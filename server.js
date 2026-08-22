// CreatorPulse server — production build
// Env required on Render: GROQ_API_KEY, HF_API_KEY, NEWS_API_KEY,
//                         SUPABASE_URL, SUPABASE_SERVICE_KEY,
//                         GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//                         GOOGLE_REDIRECT_URI, FRONTEND_URL

require("dotenv").config();

// Safety net: an uncaught error or unhandled promise rejection anywhere in
// the app used to kill the entire Node process (this is exactly what happened
// when routes/push.js hit a bad request — it took down hooks, calendar,
// digest, everything, for every user, until Render restarted it). Now it just
// gets logged instead of crashing the server for everyone over one bad request.
process.on("unhandledRejection", (err) => { console.error("[unhandledRejection]", err); });
process.on("uncaughtException", (err) => { console.error("[uncaughtException]", err); });

const path = require("path");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const RSSParser = require("rss-parser");
const { createClient } = require("@supabase/supabase-js");
const { google } = require("googleapis");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
// v1.8 pre-beta: security + performance middleware
let helmet, rateLimit, compression;
try { helmet = require("helmet"); } catch (_) { helmet = null; }
try { rateLimit = require("express-rate-limit"); } catch (_) { rateLimit = null; }
try { compression = require("compression"); } catch (_) { compression = null; }

const app = express();
const parser = new RSSParser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0 CreatorPulseBot/1.0" } });

// Behind Render/Cloudflare — trust the proxy so req.ip + secure work
app.set("trust proxy", 1);

// Redirect HTTP → HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, "https://" + req.headers.host + req.originalUrl);
  }
  next();
});

// Security headers (Helmet) with a CSP tuned for the inline SPA + external image CDNs
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "media-src": ["'self'", "blob:", "data:", "https:"],
        "connect-src": ["'self'", "https:"],
        "frame-ancestors": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
}

// Gzip/brotli responses
if (compression) app.use(compression());

// CORS — allowlist FRONTEND_URL + localhost dev origins
const CORS_ALLOWLIST = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // same-origin requests have no Origin header — allow
    if (!origin) return cb(null, true);
    if (CORS_ALLOWLIST.length === 0) return cb(null, true); // no allowlist configured → permissive
    if (CORS_ALLOWLIST.some(a => origin === a || origin.startsWith(a))) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));

// Feature routes kept in their own files under routes/, so each concern
// (digest, and future ones like push notifications) can be found and fixed
// without hunting through this whole file. Mounted AFTER express.json() —
// mounting before the body-parser meant req.body was always undefined here,
// which crashed the whole server on any POST to these routes.
app.use("/api", require("./routes/digest"));
app.use("/api", require("./routes/push"));
app.use("/api", require("./routes/uniqueness"));
app.use("/api", require("./routes/image"));
app.use("/api", require("./routes/cards"));
app.use("/api", require("./routes/stockphoto"));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self)");
  next();
});

// ── Rate limiting ────────────────────────────────────────────────────────────
const noopLimiter = (_req, _res, next) => next();
const mkLimiter = (opts) => rateLimit ? rateLimit({ standardHeaders: true, legacyHeaders: false, ...opts }) : noopLimiter;

const globalLimiter = mkLimiter({ windowMs: 15 * 60 * 1000, max: 300, message: { error: "Too many requests" } });
const authLimiter   = mkLimiter({ windowMs: 15 * 60 * 1000, max: 20,  message: { error: "Too many auth attempts. Try again in 15 min." } });
const heavyLimiter  = mkLimiter({ windowMs: 60 * 60 * 1000, max: 60,  message: { error: "Generation limit reached. Try again in an hour." } });
const contactLimiter= mkLimiter({ windowMs: 60 * 60 * 1000, max: 5,   message: { error: "Too many contact submissions. Try again later." } });

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// ── Simple in-memory TTL cache for external feeds ────────────────────────────
const _cache = new Map();
function cacheGet(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) { _cache.delete(key); return null; }
  return hit.val;
}
function cacheSet(key, val, ttlMs) {
  _cache.set(key, { val, exp: Date.now() + ttlMs });
  if (_cache.size > 500) { // simple LRU-ish trim
    const first = _cache.keys().next().value;
    _cache.delete(first);
  }
}

// Timed fetch — every external call has a hard cap
async function tfetch(url, opts = {}, ms = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); }
  finally { clearTimeout(t); }
}

// ── Static assets with cache headers ─────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR, { maxAge: "5m", etag: true, index: false }));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html"), { headers: { "Cache-Control": "no-cache" } }));

// Health check for Render / UptimeRobot
app.get("/api/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(mem.heapUsed / 1024 / 1024),
    node: process.version,
  });
});

const GROQ_KEY = process.env.GROQ_API_KEY;
const HF_KEY = process.env.HF_API_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "";

const oauth2Client = GOOGLE_CLIENT_ID
  ? new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
  : null;

// Supabase client — shared module, also used by routes/push.js
const { supabase } = require("./config/supabase");

// ── AUTH ────────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { email, password, name, niches, platforms, primaryPlatform, postsPerDay } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          niches,
          platforms,
          primaryPlatform,
          postsPerDay
        }
      }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({
      success: true,
      message: "Account created successfully.",
      user: data.user
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    const meta = data.user?.user_metadata || {};
    res.json({
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      user: {
        name: meta.name || email.split("@")[0],
        niches: meta.niches || [],
        platforms: meta.platforms || [],
        primaryPlatform: meta.primaryPlatform || "",
        postsPerDay: meta.postsPerDay || 3,
        email
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Access tokens expire (~1h). Client calls this with the stored refresh token
// to get a new access token without forcing the user to log in again.
app.post("/api/auth/refresh", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ error: "Refresh failed — please log in again" });
    res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/update-profile", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { token, name, niches, platforms, primaryPlatform, postsPerDay } = req.body;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { error } = await supabase.auth.admin.updateUserById(userData.user.id, {
      user_metadata: { name, niches, platforms, primaryPlatform, postsPerDay }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── NICHE MAPS ──────────────────────────────────────────────────────────────
const NICHE_QUERIES = {
  "Football/Soccer": "football soccer premier league champions league transfer",
  "Basketball": "NBA basketball Lakers Warriors",
  "Tennis": "tennis Wimbledon Grand Slam ATP WTA",
  "Cricket": "cricket IPL Test match World Cup",
  "Formula 1": "Formula 1 F1 Grand Prix McLaren Ferrari",
  "Boxing": "boxing fight heavyweight champion",
  "MMA/UFC": "UFC MMA fight octagon",
  "WWE Wrestling": "WWE wrestling Raw SmackDown",
  "American Football": "NFL American football touchdown Super Bowl",
  "Baseball": "MLB baseball World Series",
  "Ice Hockey": "NHL hockey Stanley Cup",
  "Golf": "golf PGA Tour Masters",
  "Rugby": "rugby Six Nations World Cup",
  "Athletics/Track": "athletics track field Olympics sprint",
  "Cycling": "cycling Tour de France Giro",
  "Swimming": "swimming Olympics world record",
  "Esports": "esports gaming tournament League of Legends",
  "Volleyball": "volleyball Olympics championship",
  "Celebrity Gossip": "celebrity gossip Hollywood entertainment",
  "Music (Afrobeats)": "Afrobeats Burna Boy Wizkid Davido music",
  "Music (Hip-Hop)": "hip hop rap Drake Kendrick music album",
  "Music (Pop)": "pop music Taylor Swift chart album",
  "Music (R&B)": "R&B soul music Beyonce album",
  "Music (K-Pop)": "K-pop BTS BLACKPINK Korean music",
  "Music (Amapiano)": "Amapiano South Africa music",
  "Movies & TV": "movies TV series Netflix box office",
  "Anime": "anime manga One Piece Naruto release",
  "Korean Drama": "Korean drama K-drama Netflix series",
  "Bollywood": "Bollywood India movies film box office",
  "Pop Culture": "pop culture viral trending internet",
  "Console Gaming": "PlayStation Xbox Nintendo gaming console",
  "PC Gaming": "PC gaming Steam graphics card GPU",
  "Mobile Gaming": "mobile gaming iOS Android game",
  "Game Reviews": "video game review launch release",
  "Twitch Streaming": "Twitch streaming streamer live",
  "YouTube Gaming": "YouTube gaming channel video",
  "Travel": "travel destination vacation tourism",
  "Food & Recipes": "food recipe cooking chef restaurant",
  "Fitness & Gym": "fitness gym workout health exercise",
  "Mental Health": "mental health wellness therapy anxiety",
  "Relationships & Dating": "relationships dating love advice",
  "Parenting": "parenting children family baby",
  "Minimalism": "minimalism lifestyle simple living",
  "Home Decor": "home decor interior design renovation",
  "Pets": "pets dogs cats animals viral",
  "Streetwear": "streetwear sneakers Supreme Nike Jordan hypebeast",
  "Luxury Fashion": "luxury fashion Gucci Louis Vuitton Chanel runway",
  "Skincare": "skincare beauty routine dermatology",
  "Makeup": "makeup beauty cosmetics tutorial",
  "Haircare": "haircare natural hair styling products",
  "Personal Finance": "personal finance money saving investing",
  "Crypto": "cryptocurrency Bitcoin Ethereum crypto price",
  "Stock Market": "stock market Wall Street S&P 500 trading",
  "Side Hustles": "side hustle passive income make money online",
  "Business News": "business startup entrepreneur funding",
  "Real Estate Investing": "real estate property investment market",
  "Budgeting": "budgeting money management finance tips",
  "AI & Tech News": "artificial intelligence AI OpenAI tech startup",
  "Gadget Reviews": "gadget tech review iPhone Samsung",
  "Coding & Dev Life": "programming coding developer software",
  "Startups": "startup funding venture capital tech",
  "Cybersecurity": "cybersecurity hack data breach privacy",
  "Space & Science": "space NASA SpaceX science discovery",
  "Science": "science discovery research breakthrough",
  "History": "history ancient civilization discovery",
  "Language Learning": "language learning Spanish French Duolingo",
  "Productivity": "productivity habits time-blocking focus deep work",
  "Study Tips": "study tips learning education student",
  "Philosophy": "philosophy life meaning ethics",
  "Psychology": "psychology behavior mind mental",
  "Yapping Videos": "viral controversial opinion debate",
  "Hot Takes": "hot take controversial opinion debate",
  "Rants": "rant viral opinion social media",
  "Storytelling": "storytelling viral story true crime",
  "Political Commentary": "politics government policy news",
  "True Crime": "true crime murder mystery investigation",
  "Mystery & Unexplained": "mystery unexplained paranormal conspiracy",
  "Viral Dances": "TikTok dance trend viral challenge",
  "Trend Reaction": "TikTok viral trend reaction internet",
  "Challenge Content": "TikTok viral challenge trend",
  "YouTube Growth": "YouTube growth subscribers views monetization",
  "Social Media Tips": "social media marketing tips growth",
  "Brand Deals": "brand deals sponsorship influencer marketing",
  "Monetization Advice": "monetization content creator income",
  "Medicine & Health": "health medicine doctor treatment news",
  "Law": "law legal court ruling news",
  "Marketing": "marketing digital advertising brand",
  "Entrepreneurship": "entrepreneurship business success startup",
  "Motivational Speaking": "motivation success mindset inspiration",
  "Faith & Religion": "faith religion church spirituality",
  "African Culture": "African culture Nigeria Ghana music art",
  "Caribbean Culture": "Caribbean culture Jamaica Trinidad music",
  "Astrology": "astrology zodiac horoscope Mercury retrograde",
  "Self-Development": "self development personal growth mindset"
};

// Expanded RSS lists per niche. Google News RSS acts as a catch-all query.
function googleNews(q) { return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`; }

const NICHE_RSS = {
  "Football/Soccer": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "Basketball": "https://feeds.bbci.co.uk/sport/basketball/rss.xml",
  "Music (Afrobeats)": googleNews("Afrobeats"),
  "Crypto": "https://cointelegraph.com/rss",
  "AI & Tech News": "https://feeds.feedburner.com/TechCrunch",
  "Movies & TV": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  "default": "https://feeds.bbci.co.uk/news/rss.xml"
};

const NICHE_BLOG_RSS = {
  "Football/Soccer": ["https://www.goal.com/rss/en/news","https://www.skysports.com/rss/0,,12040,00.xml","https://www.espn.com/espn/rss/football/news","https://www.theguardian.com/football/rss","https://www.90min.com/posts.rss"],
  "Basketball": ["https://www.espn.com/espn/rss/basketball/news","https://bleacherreport.com/articles/feed","https://www.si.com/nba/rss","https://www.cbssports.com/nba/rss"],
  "American Football": ["https://www.espn.com/espn/rss/nfl/news","https://profootballtalk.nbcsports.com/feed/","https://www.cbssports.com/nfl/rss"],
  "Formula 1": ["https://www.autosport.com/rss/feed/f1","https://www.motorsport.com/rss/f1/news","https://www.formula1.com/en/latest/all.xml"],
  "Boxing": ["https://www.boxingscene.com/rss.xml","https://www.badlefthook.com/rss/current.xml"],
  "MMA/UFC": ["https://www.mmafighting.com/rss/current.xml","https://www.bloodyelbow.com/rss/current.xml"],
  "Tennis": ["https://www.tennis.com/rss","https://www.atptour.com/en/media/rss-feed/xml-feed"],
  "Cricket": ["https://www.espncricinfo.com/rss/content/story/feeds/0.xml"],
  "Golf": ["https://www.pgatour.com/content/pgatour/rss.rss.pga.rss"],
  "Ice Hockey": ["https://www.espn.com/espn/rss/nhl/news"],
  "Baseball": ["https://www.espn.com/espn/rss/mlb/news"],
  "Rugby": ["https://www.rugbyworld.com/feed"],
  "Esports": ["https://www.dotesports.com/feed","https://dbltap.com/rss.xml"],
  "Crypto": ["https://cointelegraph.com/rss","https://cryptobriefing.com/feed","https://www.coindesk.com/arc/outboundfeeds/rss/","https://decrypt.co/feed"],
  "Stock Market": ["https://www.cnbc.com/id/10001147/device/rss/rss.html","https://feeds.marketwatch.com/marketwatch/topstories/"],
  "AI & Tech News": ["https://feeds.feedburner.com/TechCrunch","https://www.theverge.com/rss/index.xml","https://www.wired.com/feed/rss","https://venturebeat.com/feed"],
  "Gadget Reviews": ["https://www.engadget.com/rss.xml","https://www.theverge.com/rss/index.xml"],
  "Cybersecurity": ["https://feeds.feedburner.com/TheHackersNews","https://krebsonsecurity.com/feed/"],
  "Startups": ["https://feeds.feedburner.com/TechCrunch","https://www.ycombinator.com/blog/rss"],
  "Space & Science": ["https://www.nasa.gov/rss/dyn/breaking_news.rss","https://www.space.com/feeds/all"],
  "Movies & TV": ["https://www.hollywoodreporter.com/feed","https://variety.com/feed","https://deadline.com/feed"],
  "Anime": ["https://www.animenewsnetwork.com/all/rss.xml"],
  "Music (Hip-Hop)": ["https://hiphopdx.com/feed","https://www.xxlmag.com/feed"],
  "Music (Pop)": ["https://www.billboard.com/feed/"],
  "Music (Afrobeats)": [googleNews("Afrobeats OR Burna Boy OR Wizkid OR Davido"), googleNews("Rema OR Tems OR Asake")],
  "Music (K-Pop)": ["https://www.soompi.com/feed","https://www.allkpop.com/feed"],
  "Celebrity Gossip": ["https://www.tmz.com/rss.xml"],
  "Fitness & Gym": ["https://www.menshealth.com/rss/all.xml/","https://www.womenshealthmag.com/rss/all.xml/"],
  "Food & Recipes": ["https://www.bonappetit.com/feed/rss","https://www.food52.com/blog.rss"],
  "Travel": ["https://www.cntraveler.com/feed/rss","https://www.travelandleisure.com/feed"],
  "Streetwear": ["https://hypebeast.com/feed"],
  "Luxury Fashion": ["https://www.vogue.com/feed/rss","https://www.gq.com/feed/rss"],
  "True Crime": [googleNews("true crime murder investigation")],
  "Political Commentary": ["https://www.politico.com/rss/politicopicks.xml"],
  "Business News": ["https://feeds.bloomberg.com/markets/news.rss","https://www.reuters.com/rssfeed/businessNews"],
  "default": ["https://feeds.bbci.co.uk/news/rss.xml"]
};

const NICHE_EVENTS = {
  "Football/Soccer": [
    { title: "Carabao Cup (EFL Cup) begins", date: "2026-08-07", description: "First round of England's League Cup." },
    { title: "La Liga season begins", date: "2026-08-16", description: "Spain's top flight kicks off." },
    { title: "Community Shield", date: "2026-08-16", description: "England's season curtain-raiser, Cardiff." },
    { title: "Premier League season begins", date: "2026-08-21", description: "Friday Night Football opener, full matchday 1 runs through Aug 23." },
    { title: "Bundesliga season begins", date: "2026-08-09", description: "Germany's top flight kicks off." },
    { title: "Serie A season begins", date: "2026-08-23", description: "Italy's top flight kicks off." },
    { title: "Ligue 1 season begins", date: "2026-08-23", description: "France's top flight kicks off." },
    { title: "Champions League league phase draw", date: "2026-08-27", description: "36-team draw in Monaco." },
    { title: "Top-5 league transfer windows close", date: "2026-09-01", description: "Deadline day across Premier League and most of Europe." },
    { title: "Champions League matchday 1", date: "2026-09-08", description: "League phase kicks off, runs Sept 8-10." },
    { title: "FA Cup First Round", date: "2026-11-07", description: "Non-league and lower-division clubs enter." },
    { title: "Spanish Super Cup Final", date: "2027-02-07", description: "Semifinals Feb 2, final Feb 7." },
    { title: "Carabao Cup Final", date: "2027-03-21", description: "Wembley Stadium." },
    { title: "Copa del Rey Final", date: "2027-04-24", description: "Spain's domestic cup final." },
    { title: "FA Cup Final", date: "2027-05-22", description: "Wembley Stadium." },
    { title: "Ligue 1 season ends", date: "2027-05-29", description: "Final matchday." },
    { title: "Premier League season ends", date: "2027-05-30", description: "Final matchday, all games kick off simultaneously." },
    { title: "La Liga season ends", date: "2027-05-30", description: "Final matchday." },
    { title: "Serie A season ends", date: "2027-05-30", description: "Final matchday." },
    { title: "Champions League Final", date: "2027-06-05", description: "Metropolitano Stadium, Madrid." }
  ],
  "Basketball": [
    { title: "NBA regular season tip-off", date: "2026-10-20", description: "Opening night." },
    { title: "NBA Christmas Day slate", date: "2026-12-25", description: "Marquee holiday games." },
    { title: "NBA All-Star Weekend", date: "2027-02-13", description: "All-Star festivities." },
    { title: "NBA Playoffs begin", date: "2027-04-18", description: "First round." },
    { title: "NBA Finals tip-off", date: "2027-06-03", description: "Championship series." }
  ],
  "Tennis": [
    { title: "Australian Open", date: "2027-01-17", description: "First Grand Slam of the year, Melbourne Park, runs through Jan 31." },
    { title: "Roland Garros (French Open)", date: "2027-05-23", description: "Clay-court major in Paris, runs through June 6." },
    { title: "Wimbledon", date: "2027-06-28", description: "Grass-court major in London, runs through July 11." },
    { title: "US Open", date: "2027-08-29", description: "Hard-court major in New York, runs through Sept 12." }
  ],
  "Formula 1": [
    { title: "Bahrain Grand Prix", date: "2027-03-07", description: "Season opener." },
    { title: "Monaco Grand Prix", date: "2027-05-23", description: "Street classic." },
    { title: "British Grand Prix", date: "2027-07-04", description: "Silverstone." },
    { title: "Italian Grand Prix", date: "2027-09-05", description: "Monza." },
    { title: "Abu Dhabi Grand Prix", date: "2027-12-05", description: "Season finale." }
  ],
  "American Football": [
    { title: "NFL Kickoff Game", date: "2026-09-10", description: "Season opener." },
    { title: "Thanksgiving Football", date: "2026-11-26", description: "Holiday tripleheader." },
    { title: "Wild Card Weekend", date: "2027-01-09", description: "Playoffs begin." },
    { title: "Super Bowl LXI", date: "2027-02-07", description: "NFL championship." }
  ],
  "Movies & TV": [
    { title: "Emmy Awards", date: "2026-09-13", description: "TV's biggest night." },
    { title: "Oscar nominations", date: "2027-01-22", description: "Academy Awards nods." },
    { title: "Academy Awards", date: "2027-03-14", description: "Oscars ceremony." },
    { title: "Cannes Film Festival", date: "2027-05-11", description: "Prestige film festival." }
  ],
  "Music (Afrobeats)": [
    { title: "Afro Nation Portugal", date: "2027-07-01", description: "Flagship Afrobeats festival." },
    { title: "Headies Awards", date: "2027-05-22", description: "African music awards." }
  ],
  "Crypto": [
    { title: "Bitcoin halving", date: "2028-04-15", description: "Supply issuance halves." },
    { title: "Consensus (Austin)", date: "2027-05-10", description: "Major crypto conference." }
  ],
  "AI & Tech News": [
    { title: "Apple WWDC keynote", date: "2027-06-07", description: "Apple developer conference." },
    { title: "Google I/O", date: "2027-05-11", description: "Google's annual keynote." },
    { title: "CES Las Vegas", date: "2027-01-05", description: "Consumer tech expo." }
  ],
  "Tennis": [
    { title: "Australian Open", date: "2027-01-18", description: "First Grand Slam of the year." },
    { title: "French Open (Roland Garros)", date: "2027-05-24", description: "Clay court Grand Slam." },
    { title: "Wimbledon", date: "2027-06-28", description: "Grass court Grand Slam." },
    { title: "US Open", date: "2027-08-30", description: "Hard court Grand Slam." }
  ],
  "Cricket": [
    { title: "IPL Season Start", date: "2027-03-22", description: "Indian Premier League kick-off." },
    { title: "ICC Champions Trophy", date: "2027-02-19", description: "Global ODI tournament." },
    { title: "The Ashes", date: "2027-11-21", description: "England vs Australia Test series." }
  ],
  "Boxing": [
    { title: "Boxing Super Bowl weekend", date: "2027-05-01", description: "Cinco de Mayo card tradition." },
    { title: "Ring Magazine Awards", date: "2027-01-15", description: "End-of-year boxing awards." }
  ],
  "MMA/UFC": [
    { title: "UFC 300+ (International Fight Week)", date: "2027-07-03", description: "UFC's biggest annual card." },
    { title: "UFC Fight Night: Year Opener", date: "2027-01-16", description: "First card of the year." }
  ],
  "WWE Wrestling": [
    { title: "Royal Rumble", date: "2027-01-30", description: "Road to WrestleMania begins." },
    { title: "WrestleMania", date: "2027-04-03", description: "WWE's flagship event." },
    { title: "SummerSlam", date: "2027-08-07", description: "Summer's biggest party." }
  ],
  "Golf": [
    { title: "The Masters", date: "2027-04-08", description: "Augusta National tournament." },
    { title: "The Open Championship", date: "2027-07-15", description: "Oldest golf major." },
    { title: "PGA Championship", date: "2027-05-13", description: "Second major of the year." }
  ],
  "Esports": [
    { title: "League of Legends World Championship", date: "2027-10-30", description: "LoL Worlds finals window." },
    { title: "The International (Dota 2)", date: "2027-10-15", description: "Dota 2 world championship." },
    { title: "CS Major", date: "2027-05-01", description: "Counter-Strike major tournament." }
  ],
  "Music (Hip-Hop)": [
    { title: "BET Hip Hop Awards", date: "2027-10-08", description: "Annual hip-hop awards show." },
    { title: "Grammy Awards", date: "2027-02-05", description: "Music's biggest night." }
  ],
  "Music (Pop)": [
    { title: "Grammy Awards", date: "2027-02-05", description: "Music's biggest night." },
    { title: "MTV VMAs", date: "2027-09-12", description: "MTV Video Music Awards." },
    { title: "iHeartRadio Music Awards", date: "2027-04-01", description: "Fan-voted pop awards." }
  ],
  "Music (K-Pop)": [
    { title: "MAMA Awards", date: "2027-11-30", description: "Mnet Asian Music Awards." },
    { title: "Golden Disc Awards", date: "2027-01-05", description: "Korean music awards." }
  ],
  "Anime": [
    { title: "Anime Expo (Los Angeles)", date: "2027-07-02", description: "Largest anime convention in North America." },
    { title: "Crunchyroll Anime Awards", date: "2027-03-06", description: "Global anime awards show." }
  ],
  "Console Gaming": [
    { title: "Summer Game Fest", date: "2027-06-05", description: "Kickoff of summer game reveals." },
    { title: "The Game Awards", date: "2027-12-10", description: "Industry's biggest awards night." },
    { title: "gamescom (Cologne)", date: "2027-08-20", description: "Europe's biggest gaming trade fair." }
  ],
  "PC Gaming": [
    { title: "Steam Summer Sale", date: "2027-06-24", description: "Steam's biggest sale of the year." },
    { title: "Steam Winter Sale", date: "2027-12-19", description: "Holiday PC gaming sale." }
  ],
  "Celebrity Gossip": [
    { title: "Met Gala", date: "2027-05-03", description: "Fashion's biggest night." },
    { title: "Cannes red carpet", date: "2027-05-11", description: "Peak celebrity season." },
    { title: "Oscars red carpet", date: "2027-03-14", description: "Award season peak." }
  ],
  "Streetwear": [
    { title: "ComplexCon", date: "2027-11-13", description: "Streetwear and culture convention." },
    { title: "Paris Fashion Week (Men's)", date: "2027-01-19", description: "Streetwear collections drop." }
  ],
  "Luxury Fashion": [
    { title: "Met Gala", date: "2027-05-03", description: "The fashion event of the year." },
    { title: "Paris Fashion Week", date: "2027-09-28", description: "Ready-to-wear collections." },
    { title: "Milan Fashion Week", date: "2027-09-22", description: "Italian luxury runways." }
  ],
  "Skincare": [
    { title: "Summer skin prep window", date: "2027-05-15", description: "SPF & summer skin content peaks." },
    { title: "Winter skincare shift", date: "2026-11-01", description: "Barrier repair content spikes." }
  ],
  "Personal Finance": [
    { title: "Tax season begins (US)", date: "2027-01-27", description: "Tax filing content peaks." },
    { title: "Tax Day (US)", date: "2027-04-15", description: "Final filing deadline." },
    { title: "New Year budget reset", date: "2027-01-01", description: "Financial goals content." }
  ],
  "Stock Market": [
    { title: "Q4 earnings season", date: "2027-01-25", description: "Big tech earnings drop." },
    { title: "Fed rate decision (FOMC)", date: "2027-03-17", description: "Recurring rate-move dates." }
  ],
  "Real Estate Investing": [
    { title: "Spring buying season", date: "2027-03-15", description: "Peak listing season." }
  ],
  "Travel": [
    { title: "Summer travel peak", date: "2027-06-15", description: "Peak vacation content window." },
    { title: "Holiday travel rush", date: "2026-12-20", description: "Christmas/NY travel content." }
  ],
  "Food & Recipes": [
    { title: "Thanksgiving cooking week", date: "2026-11-23", description: "Recipe content explodes." },
    { title: "Super Bowl party food", date: "2027-02-07", description: "Appetizer content peaks." }
  ],
  "Fitness & Gym": [
    { title: "New Year fitness reset", date: "2027-01-01", description: "Gym content peaks." },
    { title: "Summer body season", date: "2027-05-01", description: "Cutting/shredding content." }
  ],
  "Faith & Religion": [
    { title: "Ramadan begins", date: "2027-02-17", description: "Month of fasting begins." },
    { title: "Easter Sunday", date: "2027-03-28", description: "Christian holy day." },
    { title: "Christmas", date: "2026-12-25", description: "Christian holy day." }
  ],
  "Astrology": [
    { title: "Mercury retrograde", date: "2027-01-01", description: "First retrograde of the year." },
    { title: "New Moon in Aquarius", date: "2027-02-06", description: "Manifestation content peaks." }
  ],
  "True Crime": [
    { title: "Netflix true crime drop window", date: "2027-01-10", description: "January is peak true crime doc season." }
  ],
  "Halloween-adjacent niches": [
    { title: "Spooky season kickoff", date: "2026-10-01", description: "Halloween content ramp-up." }
  ],
  "default": [
    { title: "New Year", date: "2027-01-01", description: "Kickoff content window." },
    { title: "Valentine's Day", date: "2027-02-14", description: "Seasonal content beat." },
    { title: "Easter Sunday", date: "2027-03-28", description: "Family & lifestyle content." },
    { title: "Mother's Day (US)", date: "2027-05-09", description: "Tribute content peaks." },
    { title: "Father's Day (US)", date: "2027-06-20", description: "Tribute content peaks." },
    { title: "Fourth of July", date: "2027-07-04", description: "US patriotic content." },
    { title: "Back to school", date: "2027-08-15", description: "Study/routine content peaks." },
    { title: "Halloween", date: "2026-10-31", description: "Seasonal content beat." },
    { title: "Thanksgiving (US)", date: "2026-11-26", description: "Gratitude content peaks." },
    { title: "Black Friday", date: "2026-11-27", description: "Retail/creator brand deals peak." },
    { title: "Cyber Monday", date: "2026-11-30", description: "Digital deals content." },
    { title: "Christmas", date: "2026-12-25", description: "Holiday content window." },
    { title: "New Year's Eve", date: "2026-12-31", description: "Year-end recap content." }
  ]
};

// Relevance filter — strict per niche
const NICHE_KEYWORDS = {
  "Football/Soccer": { must: ["football","soccer","premier league","la liga","serie a","bundesliga","champions league","uefa","fifa","transfer","striker","midfielder","messi","ronaldo","mbappe","haaland","salah","kane","liverpool","chelsea","arsenal","real madrid","barcelona","man utd","manchester","psg","bayern","juventus","tottenham","spurs"], banned: ["nfl","american football","touchdown","quarterback","super bowl","fantasy football draft"] },
  "Basketball": { must: ["nba","basketball","lakers","warriors","celtics","lebron","curry","doncic","jokic","embiid","tatum","playoff","dunk","three-pointer","fiba","euroleague","wnba"], banned: ["soccer","cricket","rugby"] },
  "Tennis": { must: ["tennis","atp","wta","grand slam","wimbledon","us open","french open","australian open","roland garros","djokovic","alcaraz","sinner","swiatek","gauff","sabalenka","serve","forehand"], banned: [] },
  "Cricket": { must: ["cricket","ipl","test match","odi","t20","wicket","batsman","bowler","icc","the ashes","bcci","rohit","kohli","bumrah"], banned: ["football","soccer","nba"] },
  "Formula 1": { must: ["formula 1","formula one","f1","grand prix","ferrari","mclaren","mercedes","red bull","verstappen","hamilton","leclerc","norris","piastri","pole position","pit stop","monaco","silverstone"], banned: ["nascar","indycar","motogp"] },
  "Boxing": { must: ["boxing","boxer","heavyweight","welterweight","featherweight","knockout","ko","wba","wbc","wbo","ibf","fury","joshua","canelo","usyk","haney","undisputed","world title"], banned: ["ufc","mma","wwe"] },
  "MMA/UFC": { must: ["ufc","mma","octagon","dana white","conor mcgregor","islam","volkanovski","pereira","adesanya","bellator","pfl","submission","tko"], banned: ["boxing match","wwe"] },
  "WWE Wrestling": { must: ["wwe","wrestlemania","smackdown","raw","aew","cody rhodes","roman reigns","seth rollins","cm punk","john cena","royal rumble","summerslam"], banned: [] },
  "American Football": { must: ["nfl","american football","super bowl","touchdown","quarterback","patriots","chiefs","cowboys","eagles","49ers","mahomes","kelce","brady","lamar jackson","college football","ncaa football"], banned: ["soccer","premier league","fifa","champions league","cricket","nba"] },
  "Baseball": { must: ["mlb","baseball","world series","yankees","dodgers","red sox","home run","pitcher","strikeout","ohtani","judge","aaron"], banned: ["cricket","football"] },
  "Ice Hockey": { must: ["nhl","hockey","stanley cup","goalie","rangers","bruins","oilers","maple leafs","mcdavid","crosby","ovechkin","penalty"], banned: [] },
  "Golf": { must: ["golf","pga","liv golf","masters","us open golf","the open","ryder cup","tiger woods","rory mcilroy","scheffler","koepka","augusta","birdie","eagle","bogey"], banned: [] },
  "Rugby": { must: ["rugby","six nations","world cup","all blacks","springboks","try","scrum","fly-half","world rugby","premiership rugby"], banned: ["american football","nfl"] },
  "Athletics/Track": { must: ["athletics","track","sprint","100m","200m","marathon","world championships","diamond league","usain bolt","noah lyles","sha'carri","olympics","record"], banned: [] },
  "Cycling": { must: ["cycling","tour de france","giro","vuelta","peloton","time trial","pogacar","vingegaard","evenepoel","uci"], banned: [] },
  "Swimming": { must: ["swimming","freestyle","backstroke","butterfly","breaststroke","olympics","world record","fina","world aquatics","ledecky","dressel"], banned: [] },
  "Esports": { must: ["esports","league of legends","lol","valorant","cs2","counter-strike","dota","overwatch","tournament","worlds","major","tier 1","riot games"], banned: [] },
  "Volleyball": { must: ["volleyball","fivb","vnl","serve","spike","block","olympics","world championship"], banned: [] },
  "Celebrity Gossip": { must: ["celebrity","hollywood","kardashian","jenner","taylor swift","kanye","drake","selena","zendaya","gossip","dating","split","rumor","engaged","paparazzi","red carpet"], banned: [] },
  "Music (Afrobeats)": { must: ["afrobeats","burna boy","wizkid","davido","rema","tems","asake","ayra starr","tiwa","nigerian music","african music","amapiano"], banned: [] },
  "Music (Hip-Hop)": { must: ["hip hop","hip-hop","rap","rapper","drake","kendrick","j cole","travis scott","future","21 savage","nicki minaj","cardi b","album","freestyle","diss"], banned: [] },
  "Music (Pop)": { must: ["pop music","taylor swift","billie eilish","ariana grande","dua lipa","olivia rodrigo","harry styles","the weeknd","billboard","chart","single","album"], banned: [] },
  "Music (R&B)": { must: ["r&b","rnb","soul music","beyonce","sza","summer walker","brent faiyaz","frank ocean","the weeknd","jhene aiko","h.e.r"], banned: [] },
  "Music (K-Pop)": { must: ["k-pop","kpop","bts","blackpink","newjeans","twice","stray kids","le sserafim","aespa","seventeen","comeback","hybe","sm entertainment","jyp"], banned: [] },
  "Music (Amapiano)": { must: ["amapiano","south africa","kabza","dj maphorisa","tyla","uncle waffles","piano","log drum"], banned: [] },
  "Movies & TV": { must: ["movie","film","tv series","netflix","hbo","disney+","apple tv","prime video","box office","trailer","release","season","episode","oscar","emmy","director","actor"], banned: [] },
  "Anime": { must: ["anime","manga","one piece","naruto","jujutsu kaisen","demon slayer","attack on titan","my hero academia","chainsaw man","shonen","seinen","crunchyroll","mangaka"], banned: [] },
  "Korean Drama": { must: ["k-drama","korean drama","kdrama","netflix korea","squid game","goblin","hyun bin","lee min-ho","song joong-ki"], banned: [] },
  "Bollywood": { must: ["bollywood","hindi film","shah rukh","salman khan","aamir khan","deepika","alia bhatt","ranveer","priyanka","box office india","filmfare"], banned: [] },
  "Pop Culture": { must: ["viral","trending","tiktok","internet","meme","reddit","twitter","x post","went viral","breaking the internet"], banned: [] },
  "Console Gaming": { must: ["playstation","ps5","xbox","nintendo switch","game pass","exclusive","first-party","sony","microsoft gaming"], banned: [] },
  "PC Gaming": { must: ["pc gaming","steam","gpu","graphics card","nvidia","amd radeon","rtx","dlss","valve","epic games"], banned: [] },
  "Mobile Gaming": { must: ["mobile game","ios game","android game","app store","google play","gacha","genshin","clash royale"], banned: [] },
  "Game Reviews": { must: ["game review","launch","released","score","ign","gamespot","gameplay","new game","goty"], banned: [] },
  "Twitch Streaming": { must: ["twitch","streamer","stream","kick","subathon","kai cenat","xqc","pokimane","asmongold","hasan","ludwig"], banned: [] },
  "YouTube Gaming": { must: ["youtube gaming","mrbeast","gaming channel","let's play","youtube video","gameplay video"], banned: [] },
  "Travel": { must: ["travel","destination","tourism","hotel","airline","flight","airbnb","backpack","vacation","itinerary","visa"], banned: [] },
  "Food & Recipes": { must: ["recipe","cooking","chef","restaurant","food","cuisine","michelin","tasting","kitchen","ingredient"], banned: [] },
  "Fitness & Gym": { must: ["fitness","gym","workout","exercise","strength training","bodybuilding","cardio","protein","muscle","calisthenics","crossfit"], banned: [] },
  "Mental Health": { must: ["mental health","therapy","anxiety","depression","wellness","mindfulness","burnout","self-care","psychology"], banned: [] },
  "Relationships & Dating": { must: ["relationship","dating","love","couple","breakup","marriage","tinder","hinge","bumble","situationship"], banned: [] },
  "Parenting": { must: ["parenting","child","kids","baby","toddler","mom","dad","family","school-age","teen"], banned: [] },
  "Minimalism": { must: ["minimalism","minimalist","decluttering","simple living","less is more","capsule"], banned: [] },
  "Home Decor": { must: ["home decor","interior design","renovation","furniture","apartment","aesthetic room","houseplant","ikea"], banned: [] },
  "Pets": { must: ["dog","cat","puppy","kitten","pet","animal","adoption","vet","golden retriever","husky"], banned: [] },
  "Streetwear": { must: ["streetwear","sneaker","supreme","nike","jordan","yeezy","hypebeast","travis scott","off-white","stussy","palace","drop"], banned: [] },
  "Luxury Fashion": { must: ["gucci","louis vuitton","chanel","dior","prada","hermes","balenciaga","fendi","versace","runway","paris fashion week","milan fashion week","couture"], banned: [] },
  "Skincare": { must: ["skincare","dermatology","serum","retinol","niacinamide","hyaluronic","spf","sunscreen","cerave","the ordinary","glow"], banned: [] },
  "Makeup": { must: ["makeup","cosmetics","lipstick","foundation","mascara","eyeshadow","fenty","rare beauty","mac","charlotte tilbury"], banned: [] },
  "Haircare": { must: ["haircare","natural hair","curls","protective style","wig","braids","locs","olaplex","hair growth"], banned: [] },
  "Personal Finance": { must: ["personal finance","money","saving","investing","401k","ira","budget","debt","financial","emergency fund"], banned: [] },
  "Crypto": { must: ["crypto","bitcoin","btc","ethereum","eth","solana","altcoin","defi","nft","stablecoin","coinbase","binance","memecoin"], banned: [] },
  "Stock Market": { must: ["stock","stocks","s&p 500","nasdaq","dow","earnings","wall street","trading","hedge fund","tesla stock","apple stock","fed","interest rate"], banned: [] },
  "Side Hustles": { must: ["side hustle","passive income","make money online","dropshipping","freelance","gig","etsy","print on demand"], banned: [] },
  "Business News": { must: ["business","company","ceo","funding","acquisition","merger","earnings","layoffs","startup","ipo","valuation"], banned: [] },
  "Real Estate Investing": { must: ["real estate","property","rental","mortgage","housing market","reit","landlord","cap rate","zillow","redfin"], banned: [] },
  "Budgeting": { must: ["budget","budgeting","money management","spending","frugal","expense","save money"], banned: [] },
  "AI & Tech News": { must: ["ai","artificial intelligence","openai","chatgpt","gpt","claude","anthropic","gemini","llm","machine learning","nvidia","tech","startup","silicon valley"], banned: [] },
  "Gadget Reviews": { must: ["iphone","samsung galaxy","pixel","macbook","ipad","airpods","review","unboxing","hands-on","spec","benchmark"], banned: [] },
  "Coding & Dev Life": { must: ["programming","coding","developer","software","github","open source","framework","javascript","python","typescript","react","api"], banned: [] },
  "Startups": { must: ["startup","seed round","series a","series b","venture capital","vc","y combinator","funding round","founder","valuation"], banned: [] },
  "Cybersecurity": { must: ["cybersecurity","hack","hacked","data breach","ransomware","malware","phishing","cve","vulnerability","zero-day","infosec"], banned: [] },
  "Space & Science": { must: ["nasa","spacex","space","rocket","launch","mars","moon","satellite","astronaut","james webb","starship","blue origin"], banned: [] },
  "Science": { must: ["science","research","study","discovery","scientist","breakthrough","peer-reviewed","nature journal","published"], banned: [] },
  "History": { must: ["history","historical","ancient","medieval","archaeology","artifact","civilization","empire","dynasty","world war"], banned: [] },
  "Language Learning": { must: ["language","spanish","french","japanese","mandarin","duolingo","fluent","bilingual","polyglot","grammar"], banned: [] },
  "Productivity": { must: ["productivity","focus","deep work","time blocking","habits","routine","notion","todoist","cal newport"], banned: [] },
  "Study Tips": { must: ["study","learning","student","exam","university","college","note-taking","pomodoro","gpa","revision"], banned: [] },
  "Philosophy": { must: ["philosophy","stoic","stoicism","ethics","meaning","existential","nietzsche","plato","aristotle","kant"], banned: [] },
  "Psychology": { must: ["psychology","behavior","mind","cognitive","therapy","psychologist","mental","study finds"], banned: [] },
  "Yapping Videos": { must: ["viral","opinion","debate","went viral","hot take","controversy"], banned: [] },
  "Hot Takes": { must: ["hot take","controversial","opinion","debate","unpopular opinion"], banned: [] },
  "Rants": { must: ["rant","viral","opinion","outrage","furious","slams"], banned: [] },
  "Storytelling": { must: ["story","true story","viral story","confession","reddit","aita","storytime"], banned: [] },
  "Political Commentary": { must: ["politics","election","president","congress","senate","policy","government","white house"], banned: [] },
  "True Crime": { must: ["murder","killer","crime","investigation","cold case","serial killer","police","fbi","trial","verdict","convicted"], banned: [] },
  "Mystery & Unexplained": { must: ["mystery","unexplained","paranormal","ufo","uap","conspiracy","cryptid","bigfoot","area 51"], banned: [] },
  "Viral Dances": { must: ["tiktok","dance","viral","choreography","trend","challenge"], banned: [] },
  "Trend Reaction": { must: ["viral","trend","tiktok","reaction","went viral","internet"], banned: [] },
  "Challenge Content": { must: ["challenge","viral","tiktok","trend"], banned: [] },
  "YouTube Growth": { must: ["youtube","subscribers","views","algorithm","monetization","creator","channel","adsense"], banned: [] },
  "Social Media Tips": { must: ["social media","instagram","tiktok","engagement","growth","algorithm","creator","content strategy"], banned: [] },
  "Brand Deals": { must: ["brand deal","sponsorship","influencer","partnership","paid partnership","creator economy"], banned: [] },
  "Monetization Advice": { must: ["monetization","creator income","revenue","ads","subscription","patreon","substack"], banned: [] },
  "Medicine & Health": { must: ["health","medicine","doctor","hospital","fda","treatment","clinical trial","drug","disease","who","cdc"], banned: [] },
  "Law": { must: ["law","legal","court","ruling","supreme court","judge","lawsuit","trial","verdict","attorney"], banned: [] },
  "Marketing": { must: ["marketing","brand","campaign","advertising","seo","ppc","conversion","content marketing"], banned: [] },
  "Entrepreneurship": { must: ["entrepreneur","founder","business","startup","hustle","built","launched","bootstrapped"], banned: [] },
  "Motivational Speaking": { must: ["motivation","mindset","success","discipline","goals","inspiration","david goggins","jocko"], banned: [] },
  "Faith & Religion": { must: ["faith","religion","church","god","jesus","bible","islam","muslim","christian","spirituality","pastor","prayer"], banned: [] },
  "African Culture": { must: ["africa","african","nigeria","ghana","kenya","south africa","lagos","accra","nollywood","african music","african culture"], banned: [] },
  "Caribbean Culture": { must: ["caribbean","jamaica","trinidad","barbados","reggae","dancehall","soca","carnival","rihanna"], banned: [] },
  "Astrology": { must: ["astrology","zodiac","horoscope","mercury retrograde","natal chart","sun sign","moon sign","cosmic"], banned: [] },
  "Self-Development": { must: ["self-improvement","personal growth","self-development","mindset","atomic habits","goals","discipline"], banned: [] }
};

const GLOBAL_BANNED = ["obituary","funeral","fatal crash"];

function filterAndScoreArticles(items, niche, opts = {}) {
  const cfg = NICHE_KEYWORDS[niche];
  const fallbackQuery = (NICHE_QUERIES[niche] || niche || "").toLowerCase();
  const fallbackWords = fallbackQuery.split(/\s+/).filter(w => w.length > 3);
  const must = cfg ? cfg.must.map(w => w.toLowerCase()) : fallbackWords;
  const banned = cfg ? cfg.banned.map(w => w.toLowerCase()) : [];
  const threshold = opts.threshold != null ? opts.threshold : 1;
  const scored = items.map(it => {
    const title = (it.title || "").toLowerCase();
    const summary = (it.summary || "").toLowerCase();
    const hay = title + " \u0000 " + summary;
    for (const g of GLOBAL_BANNED) if (hay.includes(g) && !must.some(m => g.includes(m))) return null;
    for (const b of banned) if (title.includes(b) && !must.some(m => b.includes(m) || m.includes(b))) return null;
    let score = 0;
    for (const m of must) { if (title.includes(m)) score += 2; else if (summary.includes(m)) score += 1; }
    if (score < threshold) return null;
    return { item: it, _score: score };
  }).filter(Boolean).sort((a,b) => b._score - a._score);
  return scored.map(x => ({ ...x.item, _relevance: x._score }));
}

// Best-fit niche detector — reassigns off-topic items to a more appropriate niche
function bestFitNiche(item, candidateNiches) {
  let best = null, bestScore = 0;
  const title = (item.title || item.headline || "").toLowerCase();
  const summary = (item.summary || "").toLowerCase();
  for (const n of candidateNiches) {
    const cfg = NICHE_KEYWORDS[n]; if (!cfg) continue;
    let s = 0;
    for (const m of cfg.must.map(x => x.toLowerCase())) {
      if (title.includes(m)) s += 2; else if (summary.includes(m)) s += 1;
    }
    if (s > bestScore) { bestScore = s; best = n; }
  }
  return bestScore >= 2 ? best : null;
}

function extractTags(title, niche) {
  const words = (title || "").split(" ").filter(w => w.length > 4).slice(0, 3);
  return [niche.split("/")[0], ...words.slice(0, 2)];
}

// ── NEWS ────────────────────────────────────────────────────────────────────
app.get("/api/news", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const _ck = "news:" + niche;
  const _hit = cacheGet(_ck);
  if (_hit) return res.json(_hit);
  const query = NICHE_QUERIES[niche] || niche;
  try {
    if (NEWS_KEY && NEWS_KEY !== "YOUR_NEWS_KEY_HERE") {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=25&language=en&apiKey=${NEWS_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.articles?.length) {
        const normalized = data.articles.map(a => ({
          title: a.title || "",
          summary: a.description || (a.content ? a.content.slice(0, 200) : ""),
          _raw: a
        }));
        const kept = filterAndScoreArticles(normalized, niche).slice(0, 12);
        if (kept.length) {
          const articles = kept.map((k, i) => {
            const a = k._raw;
            return {
              id: `${niche.replace(/\s/g, "_")}_${i}_${Date.now()}`,
              niche,
              headline: a.title,
              summary: a.description || (a.content ? a.content.slice(0, 200) : ""),
              image: a.urlToImage || null,
              url: a.url,
              source: a.source?.name || "",
              score: Math.max(70, 99 - i * 2),
              tags: extractTags(a.title, niche),
              timestamp: new Date(a.publishedAt || Date.now()).getTime()
            };
          });
          cacheSet(_ck, { articles }, 10*60*1000); return res.json({ articles });
        }
      }
    }
    // RSS fallback (BBC/etc)
    const rssUrl = NICHE_RSS[niche] || NICHE_RSS.default;
    const feed = await parser.parseURL(rssUrl);
    const normalized = (feed.items || []).map(item => ({
      title: item.title || "",
      summary: item.contentSnippet || (item.content ? item.content.slice(0, 200) : ""),
      _raw: item
    }));
    const kept = filterAndScoreArticles(normalized, niche).slice(0, 8);
    const filteredItems = kept.map((k, i) => {
      const item = k._raw;
      let sourceImage = null;
      if (item.enclosure?.url) sourceImage = item.enclosure.url;
      else if (item['media:content']?.url) sourceImage = item['media:content'].url;
      else if (item['media:content'] && Array.isArray(item['media:content'])) sourceImage = item['media:content'][0]?.url || null;
      return {
        id: `${niche.replace(/\s/g, "_")}_rss_${i}_${Date.now()}`,
        niche,
        headline: item.title,
        summary: item.contentSnippet || (item.content ? item.content.slice(0, 200) : ""),
        image: sourceImage,
        url: item.link,
        source: feed.title || "",
        score: Math.floor(Math.random() * 15) + 80,
        tags: extractTags(item.title, niche),
        timestamp: new Date(item.isoDate || Date.now()).getTime()
      };
    });
    cacheSet(_ck, { articles: filteredItems }, 10*60*1000); res.json({ articles: filteredItems });
  } catch (e) {
    console.error("News error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── BLOGS ───────────────────────────────────────────────────────────────────
app.get("/api/blog-feed", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const _ck = "blog:" + niche;
  const _hit = cacheGet(_ck);
  if (_hit) return res.json(_hit);
  const feeds = [...(NICHE_BLOG_RSS[niche] || []), googleNews(NICHE_QUERIES[niche] || niche)].slice(0, 5);
  let allArticles = [];
  await Promise.allSettled(feeds.map(async feedUrl => {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = (feed.items || []).slice(0, 4).map((item, i) => {
        let imageUrl = null;
        if (item.enclosure?.url) imageUrl = item.enclosure.url;
        else if (item['media:content']?.url) imageUrl = item['media:content'].url;
        else if (item.content) { const m = item.content.match(/<img[^>]+src="([^">]+)"/); if (m) imageUrl = m[1]; }
        return {
          id: `blog_${niche}_${feedUrl}_${i}_${Date.now()}`,
          niche,
          headline: item.title,
          summary: item.contentSnippet || item.content?.slice(0, 200) || "",
          image: imageUrl,
          url: item.link,
          source: feed.title || feedUrl,
          score: 88 + Math.floor(Math.random() * 12),
          tags: ["Blog", ...extractTags(item.title, niche)],
          timestamp: new Date(item.isoDate || Date.now()).getTime()
        };
      });
      allArticles.push(...items);
    } catch (e) { /* silent */ }
  }));
  const blogNormalized = allArticles.map(a => ({ title: a.headline, summary: a.summary, _raw: a }));
  const blogKept = filterAndScoreArticles(blogNormalized, niche, { threshold: 1 });
  let filteredBlogs = blogKept.map(k => k._raw);
  if (filteredBlogs.length === 0) filteredBlogs = allArticles;
  filteredBlogs.sort((a, b) => b.score - a.score);
  const seen = new Set();
  filteredBlogs = filteredBlogs.filter(a => {
    const key = (a.headline || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const _payload = { articles: filteredBlogs.slice(0, 10) }; cacheSet(_ck, _payload, 15*60*1000); res.json(_payload);
});

// ── TWITTER (Nitter) ────────────────────────────────────────────────────────
const NITTER_MIRRORS = ["https://nitter.net","https://nitter.privacydev.net","https://nitter.poast.org"];
app.get("/api/twitter-feed", async (req, res) => {
  const { handle, niche } = req.query;
  if (!handle) return res.status(400).json({ error: "handle required" });
  for (const base of NITTER_MIRRORS) {
    try {
      const feed = await parser.parseURL(`${base}/${handle}/rss`);
      const items = (feed.items || []).slice(0, 5).map((item, i) => {
        let imageUrl = null;
        if (item.enclosure?.url) imageUrl = item.enclosure.url;
        else if (item['media:content']?.url) imageUrl = item['media:content'].url;
        else if (item.content) { const m = item.content.match(/<img[^>]+src="([^">]+)"/); if (m) imageUrl = m[1]; }
        return {
          id: `twitter_${handle}_${Date.now()}_${i}`,
          headline: item.title,
          summary: item.contentSnippet || "",
          image: imageUrl,
          url: item.link,
          source: `@${handle}`,
          score: 92 + Math.floor(Math.random() * 8),
          tags: ["Twitter"],
          niche: niche || "News",
          timestamp: new Date(item.isoDate || Date.now()).getTime()
        };
      });
      // Cross-check: drop items obviously off-niche
      if (niche && NICHE_KEYWORDS[niche]) {
        const normalized = items.map(a => ({ title: a.headline, summary: a.summary, _raw: a }));
        const kept = filterAndScoreArticles(normalized, niche, { threshold: 1 });
        return res.json({ articles: kept.length ? kept.map(k => k._raw) : items });
      }
      return res.json({ articles: items });
    } catch (e) { /* try next mirror */ }
  }
  res.json({ articles: [] });
});

// ── EVENTS (12+ months rolling) ─────────────────────────────────────────────
app.get("/api/events", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const events = NICHE_EVENTS[niche] || NICHE_EVENTS.default;
  const now = new Date();
  const cutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const future = events.filter(e => { const d = new Date(e.date); return d >= now && d <= cutoff; });
  res.json({ events: future.slice(0, 20) });
});

// ── IMAGE HELPERS ───────────────────────────────────────────────────────────
app.get("/api/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("url required");
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return res.status(502).send("Failed to fetch image");
    res.set("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(await r.buffer());
  } catch (e) { res.status(500).send("Proxy error"); }
});

app.get("/api/sports-image", async (req, res) => {
  const { query, type } = req.query;
  try {
    if (type === "team") {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`);
      const d = await r.json();
      const team = d.teams?.[0];
      if (team) return res.json({ image: team.strTeamBadge || team.strTeamLogo, name: team.strTeam });
    } else {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(query)}`);
      const d = await r.json();
      const player = d.player?.[0];
      if (player) return res.json({ image: player.strThumb || player.strCutout, name: player.strPlayer });
    }
    res.json({ image: null });
  } catch (e) { res.json({ image: null }); }
});

app.get("/api/wiki-image", async (req, res) => {
  const { query } = req.query;
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const d = await r.json();
    res.json({ image: d.thumbnail?.source || d.originalimage?.source || null, title: d.title, extract: d.extract });
  } catch (e) { res.json({ image: null }); }
});

// ── TEXT GENERATION (with tone) ─────────────────────────────────────────────
const TONE_PROMPTS = {
  normal: "Write in a natural, neutral, professional voice — clear and confident, no hype.",
  funny: "Write with sharp banter and dry humour. Land at least one clever joke. Never cringe, never cheesy. Punchy timing.",
  educative: "Write like a teacher who respects the audience's intelligence. Lead with the insight, back it with a concrete example, no filler.",
  hype: "Write like a hot-take culture account. Bold declarations, short sentences, strong stance. No hedging.",
  storytelling: "Write like a story: cold-open hook, escalating tension, one unexpected turn, satisfying payoff. Use scenes and specifics, not summaries."
};

app.post("/api/generate", heavyLimiter, async (req, res) => {
  const { system, user, tone } = req.body;
  const toneAdd = tone && TONE_PROMPTS[tone] ? `\n\nTONE DIRECTION: ${TONE_PROMPTS[tone]}` : "";
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: (system || "") + toneAdd },
          { role: "user", content: user }
        ],
        max_tokens: 1200,
        temperature: 0.85
      })
    });
    const d = await r.json();
    if (d.error) return res.status(500).json({ error: d.error.message || "Groq API error", text: "" });
    res.json({ text: d.choices?.[0]?.message?.content || "" });
  } catch (e) { res.status(500).json({ error: e.message, text: "" }); }
});

// ── IMAGE GENERATION ────────────────────────────────────────────────────────
// Moved to services/imageGen.js (provider logic) + routes/image.js (endpoint),
// mounted near the top of the file with the other route imports.
if (false) {
function dimsForFormat(format) {
  const f = String(format || "square").toLowerCase();
  if (f.includes("thumbnail") || f.includes("youtube") || f.includes("16:9")) return { w: 1280, h: 720 };
  if (f.includes("reel") || f.includes("tiktok") || f.includes("story") || f.includes("9:16") || f.includes("portrait")) return { w: 720, h: 1280 };
  if (f.includes("carousel") || f.includes("4:5")) return { w: 1080, h: 1350 };
  return { w: 1024, h: 1024 };
}

async function pollinationsImage(prompt, w, h) {
  const seed = Math.floor(Math.random() * 1e9);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&seed=${seed}&model=flux`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "CreatorPulse/1.0" }, signal: ctl.signal });
    if (!r.ok) throw new Error("pollinations " + r.status);
    const buf = await r.buffer();
    if (buf.length < 2000) throw new Error("empty image");
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } finally { clearTimeout(timer); }
}

async function hfImage(prompt) {
  if (!HF_KEY) throw new Error("no hf key");
  const models = ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"];
  for (const model of models) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt, parameters: { negative_prompt: "blurry, watermark, text, logo, deformed", num_inference_steps: 25 } }),
        signal: ctl.signal
      });
      if (!r.ok) continue;
      const b64 = (await r.buffer()).toString("base64");
      return `data:image/jpeg;base64,${b64}`;
    } catch (e) { /* try next */ }
    finally { clearTimeout(timer); }
  }
  throw new Error("hf unavailable");
}

async function generateOneImage(prompt, format) {
  const { w, h } = dimsForFormat(format);
  const styled = `${prompt}. Editorial photography, sharp focus, cinematic lighting, magazine-quality composition, no text, no watermark, no logo`;
  try { return await pollinationsImage(styled, w, h); }
  catch (e1) {
    try { return await hfImage(styled); }
    catch (e2) { throw new Error("All image providers unavailable: " + e1.message); }
  }
}

app.post("/api/generate-image", heavyLimiter, async (req, res) => {
  const { prompt, format, count } = req.body;
  const n = Math.max(1, Math.min(5, parseInt(count) || 1));
  try {
    if (n === 1) {
      const image = await generateOneImage(prompt, format);
      return res.json({ image, format: format || "square" });
    }
    // parallel for carousel/multi
    const results = await Promise.allSettled(
      Array.from({ length: n }, (_, i) => generateOneImage(`${prompt} — slide ${i + 1} of ${n}`, format))
    );
    const images = results.filter(r => r.status === "fulfilled").map(r => r.value);
    if (!images.length) return res.status(500).json({ error: "All image models unavailable" });
    return res.json({ images, image: images[0], format: format || "square" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
}

// ── NOTIFICATIONS ───────────────────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  const { niches } = req.query;
  const list = niches ? niches.split(",") : [];
  const notifications = [];
  for (const niche of list.slice(0, 3)) {
    try {
      if (NEWS_KEY) {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(NICHE_QUERIES[niche] || niche)}&sortBy=publishedAt&pageSize=2&language=en&apiKey=${NEWS_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        if (data.articles?.[0]) { notifications.push({ niche, headline: data.articles[0].title, time: "Just now" }); continue; }
      }
      const feed = await parser.parseURL(NICHE_RSS[niche] || NICHE_RSS.default);
      if (feed.items?.[0]) notifications.push({ niche, headline: feed.items[0].title, time: "Just now" });
    } catch (e) {}
  }
  res.json({ notifications });
});

// ── SAVED POSTS + SCHEDULE ──────────────────────────────────────────────────
app.post("/api/save-post", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, headline, niche, platform, contentType, content, scheduledDate } = req.body;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { error } = await supabase.from("saved_posts").insert({
      user_id: userData.user.id, headline, niche, platform,
      content_type: contentType, content, scheduled_date: scheduledDate || null
    });
    if (error) throw error;
    res.json({ success: true, message: "Saved to calendar" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/schedule", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, year, month } = req.query;
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = `${year}-${String(month).padStart(2,'0')}-31`;
    const { data, error } = await supabase.from("saved_posts").select("*").eq("user_id", userData.user.id)
      .gte("scheduled_date", startDate).lte("scheduled_date", endDate).order("scheduled_date", { ascending: true });
    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/saved-posts", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data, error } = await supabase.from("saved_posts").select("*").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/delete-post", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, postId } = req.query;
  if (!token || !postId) return res.status(400).json({ error: "Token and postId required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data: post } = await supabase.from("saved_posts").select("user_id").eq("id", postId).single();
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== userData.user.id) return res.status(403).json({ error: "Not authorized" });
    const { error } = await supabase.from("saved_posts").delete().eq("id", postId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USER RECURRING SCHEDULE (e.g. "Go live Fridays 8pm") ────────────────────
// Uses saved_posts with content_type="Recurring" so no new table needed.
app.post("/api/user-schedule", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, title, weekday, time, notes } = req.body;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    // Materialise next 52 weeks
    const dayIdx = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(String(weekday).toLowerCase());
    if (dayIdx < 0) return res.status(400).json({ error: "Invalid weekday" });
    const today = new Date();
    const rows = [];
    for (let w = 0; w < 52; w++) {
      const d = new Date(today);
      d.setDate(today.getDate() + ((dayIdx - today.getDay() + 7) % 7) + w * 7);
      rows.push({
        user_id: userData.user.id,
        headline: title,
        niche: "Personal Schedule",
        platform: "all",
        content_type: "Recurring",
        content: { title, weekday, time, notes },
        scheduled_date: d.toISOString().slice(0, 10)
      });
    }
    const { error } = await supabase.from("saved_posts").insert(rows);
    if (error) throw error;
    res.json({ success: true, added: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI COACH — analyse creator's stated metrics/handle ──────────────────────
app.post("/api/coach", async (req, res) => {
  const { handle, platform, niche, recentMetrics, question } = req.body;
  const system = `You are CreatorPulse Coach — a straight-talking creator strategist. Give specific, tactical, kind but blunt feedback. No filler, no motivational fluff. Use short paragraphs and clear numbered actions.`;
  const user = `Platform: ${platform || "unspecified"}. Handle: ${handle || "n/a"}. Niche: ${niche || "n/a"}.
Recent metrics (creator-provided): ${recentMetrics || "not shared"}.
Coaching question: ${question || "Give me a weekly report — 3 things working, 3 to fix, 3 experiments to try."}`;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        max_tokens: 900, temperature: 0.6
      })
    });
    const d = await r.json();
    if (d.error) return res.status(500).json({ error: d.error.message || "Groq error" });
    res.json({ text: d.choices?.[0]?.message?.content || "" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GOOGLE CALENDAR OAUTH (unchanged) ───────────────────────────────────────
app.get("/api/google-auth-url", (_req, res) => {
  if (!oauth2Client) return res.status(503).json({ error: "Google OAuth not configured" });
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent'
  });
  res.json({ url: authUrl });
});

app.get("/api/google-oauth-callback", async (req, res) => {
  const { code, token } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (supabase && token) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData) {
        await supabase.from("user_tokens").upsert({
          user_id: userData.user.id,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expiry: new Date(Date.now() + (tokens.expiry_date || 3600000))
        });
      }
    }
    res.redirect(`${FRONTEND_URL}/?calendar=connected`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/create-calendar-event", async (req, res) => {
  const { token, event } = req.body;
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data: tokenData } = await supabase.from("user_tokens")
      .select("google_access_token, google_refresh_token, google_token_expiry")
      .eq("user_id", userData.user.id).single();
    if (!tokenData) return res.status(400).json({ error: "Google Calendar not connected." });
    oauth2Client.setCredentials({
      access_token: tokenData.google_access_token,
      refresh_token: tokenData.google_refresh_token,
      expiry_date: tokenData.google_token_expiry
    });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: event.summary,
        description: event.description,
        start: { date: event.startDate, timeZone: 'UTC' },
        end: { date: event.endDate || event.startDate, timeZone: 'UTC' }
      }
    });
    res.json({ success: true, eventId: result.data.id, link: result.data.htmlLink });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HOOKS LIBRARY (50 proven hooks per niche) ───────────────────────────────
// Niche-specific hooks, not generic word-swapped templates. Built in batches —
// covered niches below get real tailored hooks; everything else still falls
// back to HOOK_TEMPLATES so no niche is ever empty while more batches land.
const HOOKS_BY_NICHE = {
  "Football/Soccer": [
    "This transfer is going to blow up tomorrow and nobody's talking about it yet.",
    "VAR just ruined another game and I need to say something about it.",
    "This manager is one bad result away from getting sacked. Here's why.",
    "Everyone's praising this signing. I think it's a disaster. Let me explain.",
    "The tactical shift nobody noticed in that match changed the entire game.",
    "This is the worst refereeing decision I've seen all season.",
    "Three clubs are about to make the same transfer mistake. Again.",
    "I watched this match twice. Here's what everyone missed the first time.",
    "This academy graduate is better than three first-team players right now.",
    "The real reason this club is struggling has nothing to do with the manager.",
    "Hot take: this 'world class' player is actually overrated.",
    "Unpopular opinion — this rebuild is working better than people admit.",
    "This is the tactical trend every top team will copy next season.",
    "Five transfer rumors this week that are actually believable.",
    "Here's why this derby result matters more than the table says.",
    "I've watched this league for a decade. This season is different. Here's how.",
    "As someone who covers transfers daily, this deal makes zero sense.",
    "I tracked this player's stats for a month. The numbers don't lie.",
    "Everyone in football media is wrong about this signing. Including me, last week.",
    "So this happened in the dressing room and it's about to leak everywhere.",
    "Storytime — how this player almost signed for a completely different club.",
    "You won't believe what actually happened before this match kicked off.",
    "This is the wildest managerial u-turn I've seen in years.",
    "Let me tell you what really caused that dressing room bust-up.",
    "Why is nobody talking about this club's actual financial situation?",
    "How is this manager still employed after that performance?",
    "What if this transfer window ends up defining the entire season?",
    "Are you actually watching the tactics or just the scoreline?",
    "How did this club go from title contenders to relegation battle this fast?",
    "This scoutig report leaked and it changes how you'll see this player.",
    "Breaking: this transfer is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the manager situation.",
    "The medical is done. Here's why this signing still might collapse.",
    "This lineup decision is either genius or the manager's last mistake.",
    "Compare this season to last year's — the difference will shock you.",
    "This is the same mistake this club made three transfer windows ago.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This formation change explains everything about the last five results.",
    "The stats say one thing. What I watched on Saturday says another.",
    "This is the most underrated performance of the weekend, hands down.",
    "I need to talk about what this captain did after the final whistle.",
    "This youth prospect just did something senior players can't.",
    "The transfer fee makes sense once you see what's really happening.",
    "This is why loyalty in football doesn't exist anymore. Case in point.",
    "Nobody's asking the obvious question about this managerial appointment.",
    "This set-piece routine is the smartest thing I've seen all month.",
    "The real winner of this transfer window isn't who you think.",
    "This press conference quote is going to age very badly.",
    "Here's the tactical foul nobody's talking about that decided the game.",
    "This club's recruitment strategy just quietly changed everything."
  ],
  "Basketball": [
    "This trade is going to blow up the league and nobody's ready for it.",
    "The refs cost that team the game and I need to say it.",
    "This coach is one loss away from getting fired. Here's why.",
    "Everyone's hyping this rookie. I think he's overrated. Let me explain.",
    "The lineup change nobody noticed completely flipped that game.",
    "This is the worst officiating call I've seen all season.",
    "Three teams are about to make the same free agency mistake. Again.",
    "I watched this game twice. Here's what everyone missed the first time.",
    "This bench player outplayed two All-Stars last night.",
    "The real reason this team is losing has nothing to do with the coach.",
    "Hot take: this MVP candidate is actually padding stats on a bad team.",
    "Unpopular opinion — this rebuild is working better than people admit.",
    "This is the offensive scheme every contender will copy next season.",
    "Five trade rumors this week that are actually believable.",
    "Here's why this rivalry game matters more than the standings say.",
    "I've watched this league for a decade. This season is different. Here's how.",
    "As someone who covers the league daily, this trade makes zero sense.",
    "I tracked this player's shot chart for a month. The numbers don't lie.",
    "Everyone in NBA media is wrong about this player. Including me, last month.",
    "So this happened in the locker room and it's about to leak everywhere.",
    "Storytime — how this star almost got traded to a completely different team.",
    "You won't believe what actually happened before this game tipped off.",
    "This is the wildest coaching decision I've seen in years.",
    "Let me tell you what really caused that locker room tension.",
    "Why is nobody talking about this team's actual cap situation?",
    "How is this coach still employed after that performance?",
    "What if this trade deadline ends up defining the entire season?",
    "Are you actually watching the defense or just the scoreboard?",
    "How did this team go from title contenders to lottery odds this fast?",
    "This scouting report leaked and it changes how you'll see this prospect.",
    "Breaking: this trade is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the coaching change.",
    "The physical is done. Here's why this signing still might collapse.",
    "This rotation decision is either genius or the coach's last mistake.",
    "Compare this season to last year's — the difference will shock you.",
    "This is the same mistake this front office made two seasons ago.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This defensive scheme change explains everything about the last five games.",
    "The stats say one thing. What I watched Tuesday night says another.",
    "This is the most underrated performance of the week, hands down.",
    "I need to talk about what this captain did after the final buzzer.",
    "This two-way player just did something All-Stars can't.",
    "The trade package makes sense once you see what's really happening.",
    "This is why loyalty in the league doesn't exist anymore. Case in point.",
    "Nobody's asking the obvious question about this coaching hire.",
    "This out-of-bounds play is the smartest thing I've seen all month.",
    "The real winner of this trade deadline isn't who you think.",
    "This postgame quote is going to age very badly.",
    "Here's the hidden foul nobody's talking about that decided the game.",
    "This front office's draft strategy just quietly changed everything."
  ],
  "Crypto": [
    "This coin is about to move and almost nobody's watching it yet.",
    "The SEC just did something and the market hasn't priced it in.",
    "This project is one bad update away from collapsing. Here's why.",
    "Everyone's hyping this token. I think it's a trap. Let me explain.",
    "The on-chain move nobody noticed completely changed the setup.",
    "This is the worst exchange decision I've seen all year.",
    "Three projects are about to make the same tokenomics mistake. Again.",
    "I read this whitepaper twice. Here's what everyone missed the first time.",
    "This small-cap outperformed three top-10 coins this week.",
    "The real reason this coin is dumping has nothing to do with the news.",
    "Hot take: this 'blue chip' token is actually massively overvalued.",
    "Unpopular opinion — this bear market is healthier than people admit.",
    "This is the on-chain trend every serious trader is watching right now.",
    "Five altcoin narratives this week that are actually believable.",
    "Here's why this ETF decision matters more than the price action says.",
    "I've traded crypto for years. This cycle is different. Here's how.",
    "As someone who reads on-chain data daily, this pump makes zero sense.",
    "I tracked this wallet's moves for a month. The pattern doesn't lie.",
    "Everyone in crypto Twitter is wrong about this coin. Including me, last month.",
    "So this happened in a Discord call and it's about to leak everywhere.",
    "Storytime — how this project almost got acquired by a completely different chain.",
    "You won't believe what actually happened before this token launched.",
    "This is the wildest governance vote I've seen in years.",
    "Let me tell you what really caused that liquidity crunch.",
    "Why is nobody talking about this protocol's actual treasury situation?",
    "How is this team still funded after that roadmap miss?",
    "What if this halving ends up mattering less than everyone thinks?",
    "Are you actually reading the contract or just following the hype?",
    "How did this coin go from top-50 to irrelevant this fast?",
    "This audit report leaked and it changes how you'll see this protocol.",
    "Breaking: this listing is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the exploit.",
    "The vesting unlock is coming. Here's why this token might dump hard.",
    "This liquidity decision is either genius or the team's last mistake.",
    "Compare this cycle to the last one — the difference will shock you.",
    "This is the same mistake this project made during the last bull run.",
    "Everyone's comparing it to a top-10 coin. Here's why that's unfair.",
    "This tokenomics change explains everything about the last week's price action.",
    "The charts say one thing. What I'm seeing on-chain says another.",
    "This is the most underrated launch of the month, hands down.",
    "I need to talk about what this founder said in that leaked call.",
    "This low-cap just did something even majors haven't pulled off.",
    "The funding round makes sense once you see what's really happening.",
    "This is why 'diamond hands' doesn't work the way people think. Case in point.",
    "Nobody's asking the obvious question about this partnership announcement.",
    "This wallet-tagging move is the smartest thing I've seen all month.",
    "The real winner of this narrative shift isn't who you think.",
    "This tweet from the founder is going to age very badly.",
    "Here's the hidden fee nobody's talking about that's draining your yield.",
    "This exchange's listing strategy just quietly changed everything."
  ],
  "AI & Tech News": [
    "This AI model dropped quietly and it's about to change everything.",
    "The FTC just did something and Silicon Valley hasn't priced it in.",
    "This startup is one funding round away from collapsing. Here's why.",
    "Everyone's hyping this launch. I think it's overhyped. Let me explain.",
    "The feature nobody noticed in that update completely changes the product.",
    "This is the worst product decision I've seen from a big tech company all year.",
    "Three startups are about to make the same pivot mistake. Again.",
    "I read this research paper twice. Here's what everyone missed the first time.",
    "This unknown tool outperformed three funded competitors this week.",
    "The real reason this company is struggling has nothing to do with the market.",
    "Hot take: this 'revolutionary' AI feature is actually just a wrapper.",
    "Unpopular opinion — this AI bubble talk is overblown. Here's why.",
    "This is the architecture trend every serious lab is quietly adopting.",
    "Five startup pivots this week that are actually smart.",
    "Here's why this acquisition matters more than the headline says.",
    "I've followed this space for years. This shift is different. Here's how.",
    "As someone who reads changelogs daily, this update makes zero sense.",
    "I tracked this company's hiring for a month. The pattern doesn't lie.",
    "Everyone in tech media is wrong about this launch. Including me, last month.",
    "So this happened in an internal Slack and it's about to leak everywhere.",
    "Storytime — how this startup almost got acquired by a completely different giant.",
    "You won't believe what actually happened before this product launched.",
    "This is the wildest pivot I've seen from a founder in years.",
    "Let me tell you what really caused that mass resignation.",
    "Why is nobody talking about this company's actual burn rate?",
    "How is this CEO still in the job after that product failure?",
    "What if this AI regulation ends up mattering more than the models themselves?",
    "Are you actually reading the terms of service or just clicking accept?",
    "How did this company go from unicorn to layoffs this fast?",
    "This internal memo leaked and it changes how you'll see this company.",
    "Breaking: this acquisition is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the data breach.",
    "The beta is closed. Here's why this launch might still flop.",
    "This hiring decision is either genius or the founder's last mistake.",
    "Compare this launch to last year's — the difference will shock you.",
    "This is the same mistake this company made during their last funding round.",
    "Everyone's comparing it to a trillion-dollar company. Here's why that's unfair.",
    "This pricing change explains everything about the last week's churn.",
    "The metrics say one thing. What I'm seeing in the product says another.",
    "This is the most underrated launch of the month, hands down.",
    "I need to talk about what this founder said in that leaked interview.",
    "This two-person startup just did something a funded team couldn't.",
    "The funding round makes sense once you see what's really happening.",
    "This is why 'move fast and break things' doesn't work anymore. Case in point.",
    "Nobody's asking the obvious question about this partnership announcement.",
    "This UX decision is the smartest thing I've seen all month.",
    "The real winner of this AI race isn't who you think.",
    "This tweet from the CEO is going to age very badly.",
    "Here's the hidden cost nobody's talking about in this 'free' tool.",
    "This company's open-source strategy just quietly changed everything."
  ],
  "Music (Afrobeats)": [
    "This song leaked and it's about to run the whole summer.",
    "The label just did something and fans haven't clocked it yet.",
    "This artist is one bad drop away from losing the momentum. Here's why.",
    "Everyone's hyping this collab. I think it's underwhelming. Let me explain.",
    "The producer credit nobody noticed completely changes how you hear this track.",
    "This is the worst rollout I've seen from a major artist all year.",
    "Three artists are about to drop the same sound. Again.",
    "I listened to this album twice. Here's what everyone missed the first time.",
    "This unsigned artist outperformed three major-label acts this week.",
    "The real reason this song is flopping has nothing to do with the beat.",
    "Hot take: this 'instant classic' is actually just an average song.",
    "Unpopular opinion — this artist's new direction is actually working.",
    "This is the sound every producer is quietly copying right now.",
    "Five collabs this week that are actually believable.",
    "Here's why this feature matters more than the chart position says.",
    "I've followed this scene for years. This wave is different. Here's how.",
    "As someone who tracks credits daily, this songwriting split makes zero sense.",
    "I tracked this artist's streams for a month. The numbers don't lie.",
    "Everyone in music media is wrong about this artist. Including me, last month.",
    "So this happened in the studio session and it's about to leak everywhere.",
    "Storytime — how this song almost went to a completely different artist.",
    "You won't believe what actually happened before this track dropped.",
    "This is the wildest sample clearance story I've heard in years.",
    "Let me tell you what really caused that label dispute.",
    "Why is nobody talking about this artist's actual streaming numbers?",
    "How is this artist still getting festival slots after that no-show?",
    "What if this album ends up defining the entire sound of the year?",
    "Are you actually listening to the lyrics or just vibing to the beat?",
    "How did this artist go from viral to irrelevant this fast?",
    "This studio session leaked and it changes how you'll hear this album.",
    "Breaking: this collab is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the label situation.",
    "The video's shot. Here's why this rollout might still flop.",
    "This tracklist decision is either genius or the label's last mistake.",
    "Compare this album to the last one — the difference will shock you.",
    "This is the same mistake this artist made on their last project.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This production change explains everything about this album's sound.",
    "The charts say one thing. What I'm hearing in the mix says another.",
    "This is the most underrated drop of the month, hands down.",
    "I need to talk about what this artist said in that leaked voice note.",
    "This underground artist just did something a major-label act couldn't.",
    "The feature makes sense once you see what's really happening behind it.",
    "This is why loyalty from labels doesn't exist anymore. Case in point.",
    "Nobody's asking the obvious question about this surprise drop.",
    "This ad-lib choice is the smartest thing I've heard all month.",
    "The real winner of this beef isn't who you think.",
    "This interview quote is going to age very badly.",
    "Here's the hidden sample nobody's talking about on this track.",
    "This artist's release strategy just quietly changed everything."
  ],
  "Tennis": [
    "This upset is about to send shockwaves through the rankings.",
    "The umpire just made a call and it's about to be everywhere.",
    "This player is one bad tournament away from dropping out of the top 10.",
    "Everyone's hyping this prospect. I think he's not ready. Let me explain.",
    "The serve pattern nobody noticed completely won that match.",
    "This is the worst line call I've seen at a Slam all year.",
    "Three players are about to make the same coaching change. Again.",
    "I watched this match twice. Here's what everyone missed the first time.",
    "This qualifier outplayed three seeded players this week.",
    "The real reason this player is struggling has nothing to do with injury.",
    "Hot take: this 'generational talent' is actually overrated on clay.",
    "Unpopular opinion — this coaching change is working better than people admit.",
    "This is the return-of-serve trend every top player is adopting.",
    "Five retirement rumors this week that are actually believable.",
    "Here's why this Masters result matters more than the ranking points say.",
    "I've followed this tour for a decade. This season is different. Here's how.",
    "As someone who tracks rankings daily, this seeding makes zero sense.",
    "I tracked this player's serve speed for a month. The numbers don't lie.",
    "Everyone in tennis media is wrong about this player. Including me, last month.",
    "So this happened in the locker room and it's about to leak everywhere.",
    "Storytime — how this player almost retired before this comeback season.",
    "You won't believe what actually happened before this final started.",
    "This is the wildest coaching split I've seen in years.",
    "Let me tell you what really caused that mid-match meltdown.",
    "Why is nobody talking about this player's actual injury history?",
    "How is this player still ranked top 20 after that form slump?",
    "What if this Slam ends up defining this player's entire legacy?",
    "Are you actually watching the footwork or just the winners?",
    "How did this player go from top 5 to unranked this fast?",
    "This practice session leaked and it changes how you'll see this player.",
    "Breaking: this withdrawal is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the injury.",
    "The scan is done. Here's why this comeback might still stall.",
    "This lineup call is either genius or the coach's last mistake.",
    "Compare this season to last year's — the difference will shock you.",
    "This is the same mistake this player made at the last Slam.",
    "Everyone's comparing her to a legend. Here's why that's unfair.",
    "This racket change explains everything about the last month's results.",
    "The stats say one thing. What I watched on Centre Court says another.",
    "This is the most underrated performance of the tournament, hands down.",
    "I need to talk about what this player said in the post-match presser.",
    "This teenager just did something a top-10 player couldn't.",
    "The wildcard makes sense once you see what's really happening.",
    "This is why loyalty between player and coach doesn't last. Case in point.",
    "Nobody's asking the obvious question about this scheduling decision.",
    "This drop shot is the smartest thing I've seen all month.",
    "The real winner of this rivalry isn't who you think.",
    "This press conference quote is going to age very badly.",
    "Here's the hidden tactic nobody's talking about that won that set.",
    "This player's off-season training just quietly changed everything."
  ],
  "Formula 1": [
    "This upgrade is about to shake up the entire grid.",
    "The stewards just made a call and the paddock hasn't stopped talking.",
    "This driver is one bad qualifying away from losing the seat. Here's why.",
    "Everyone's hyping this rookie. I think the hype's too early. Let me explain.",
    "The strategy call nobody noticed completely won that race.",
    "This is the worst penalty decision I've seen all season.",
    "Three teams are about to make the same upgrade mistake. Again.",
    "I watched this race twice. Here's what everyone missed the first time.",
    "This midfield car outperformed two top teams this weekend.",
    "The real reason this team is struggling has nothing to do with the driver.",
    "Hot take: this 'title favorite' is actually running out of upgrades.",
    "Unpopular opinion — this driver swap is working better than people admit.",
    "This is the aero trend every top team is quietly copying.",
    "Five driver market rumors this week that are actually believable.",
    "Here's why this sprint result matters more than the points say.",
    "I've followed this sport for a decade. This season is different. Here's how.",
    "As someone who tracks telemetry daily, this strategy makes zero sense.",
    "I tracked this car's tyre degradation for a month. The data doesn't lie.",
    "Everyone in F1 media is wrong about this team. Including me, last month.",
    "So this happened in the garage and it's about to leak everywhere.",
    "Storytime — how this driver almost signed for a completely different team.",
    "You won't believe what actually happened before this race started.",
    "This is the wildest team radio exchange I've heard in years.",
    "Let me tell you what really caused that pit wall meltdown.",
    "Why is nobody talking about this team's actual budget cap situation?",
    "How is this driver still in the seat after that qualifying gap?",
    "What if this upgrade package ends up defining the entire championship?",
    "Are you actually watching the strategy or just the overtakes?",
    "How did this team go from title contenders to midfield this fast?",
    "This wind tunnel data leaked and it changes how you'll see this car.",
    "Breaking: this driver move is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the engine issue.",
    "The simulator work is done. Here's why this upgrade still might not work.",
    "This tyre call is either genius or the strategist's last mistake.",
    "Compare this season to last year's — the difference will shock you.",
    "This is the same mistake this team made two seasons ago.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This floor upgrade explains everything about the last three races.",
    "The sector times say one thing. What I watched in the onboard says another.",
    "This is the most underrated drive of the weekend, hands down.",
    "I need to talk about what this driver said on team radio.",
    "This rookie just did something a world champion couldn't.",
    "The contract extension makes sense once you see what's really happening.",
    "This is why driver loyalty in F1 doesn't exist anymore. Case in point.",
    "Nobody's asking the obvious question about this team principal change.",
    "This undercut call is the smartest thing I've seen all month.",
    "The real winner of this development race isn't who you think.",
    "This post-race interview quote is going to age very badly.",
    "Here's the hidden setup change nobody's talking about that won that race.",
    "This team's wind tunnel strategy just quietly changed everything."
  ],
  "MMA/UFC": [
    "This fighter just called someone out and it's about to blow up.",
    "The judges got that scorecard wrong and I need to say it.",
    "This champion is one bad camp away from losing the belt. Here's why.",
    "Everyone's hyping this prospect. I think he's not ready for that level. Let me explain.",
    "The gameplan nobody noticed completely won that fight.",
    "This is the worst stoppage decision I've seen all year.",
    "Three fighters are about to make the same weight-cut mistake. Again.",
    "I watched this fight twice. Here's what everyone missed the first time.",
    "This unranked fighter outperformed two top-5 contenders this month.",
    "The real reason this fighter is struggling has nothing to do with skill.",
    "Hot take: this 'can't-miss prospect' is actually being rushed.",
    "Unpopular opinion — this camp change is working better than people admit.",
    "This is the grappling trend every serious fighter is adopting.",
    "Five title fight rumors this week that are actually believable.",
    "Here's why this prelim result matters more than the ranking says.",
    "I've followed this sport for a decade. This era is different. Here's how.",
    "As someone who breaks down tape daily, this matchup makes zero sense.",
    "I tracked this fighter's takedown defense for a month. The numbers don't lie.",
    "Everyone in MMA media is wrong about this fighter. Including me, last month.",
    "So this happened backstage and it's about to leak everywhere.",
    "Storytime — how this fighter almost signed with a completely different promotion.",
    "You won't believe what actually happened before this fight started.",
    "This is the wildest weigh-in staredown I've seen in years.",
    "Let me tell you what really caused that corner meltdown.",
    "Why is nobody talking about this fighter's actual injury history?",
    "How is this fighter still ranked top 5 after that performance?",
    "What if this fight ends up defining this fighter's entire legacy?",
    "Are you actually watching the footwork or just waiting for the knockout?",
    "How did this fighter go from title contender to cut this fast?",
    "This training footage leaked and it changes how you'll see this fighter.",
    "Breaking: this fight announcement is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the injury pullout.",
    "The medicals are done. Here's why this fight still might not happen.",
    "This gameplan is either genius or the coach's last mistake.",
    "Compare this camp to the last one — the difference will shock you.",
    "This is the same mistake this fighter made in their last title shot.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This striking change explains everything about the last two performances.",
    "The stats say one thing. What I watched in the octagon says another.",
    "This is the most underrated performance of the card, hands down.",
    "I need to talk about what this fighter said in the post-fight interview.",
    "This debutant just did something a ranked fighter couldn't.",
    "The title shot makes sense once you see what's really happening.",
    "This is why loyalty between fighter and coach doesn't last. Case in point.",
    "Nobody's asking the obvious question about this weight class move.",
    "This clinch work is the smartest thing I've seen all month.",
    "The real winner of this rivalry isn't who you think.",
    "This post-fight callout is going to age very badly.",
    "Here's the hidden adjustment nobody's talking about that won that fight.",
    "This fighter's camp strategy just quietly changed everything."
  ],
  "American Football": [
    "This trade is about to blow up the league and nobody's ready for it.",
    "The refs cost that team the game and I need to say it.",
    "This coach is one loss away from getting fired. Here's why.",
    "Everyone's hyping this rookie QB. I think he's not ready. Let me explain.",
    "The play call nobody noticed completely flipped that game.",
    "This is the worst officiating call I've seen all season.",
    "Three teams are about to make the same free agency mistake. Again.",
    "I watched this game twice. Here's what everyone missed the first time.",
    "This undrafted rookie outperformed two first-round picks this week.",
    "The real reason this team is losing has nothing to do with the coach.",
    "Hot take: this MVP candidate is actually padding stats on a bad team.",
    "Unpopular opinion — this rebuild is working better than people admit.",
    "This is the offensive scheme every contender is quietly copying.",
    "Five trade rumors this week that are actually believable.",
    "Here's why this division game matters more than the standings say.",
    "I've followed this league for a decade. This season is different. Here's how.",
    "As someone who breaks down film daily, this play call makes zero sense.",
    "I tracked this QB's completion rate for a month. The numbers don't lie.",
    "Everyone in NFL media is wrong about this team. Including me, last month.",
    "So this happened in the locker room and it's about to leak everywhere.",
    "Storytime — how this player almost got traded to a completely different team.",
    "You won't believe what actually happened before this game kicked off.",
    "This is the wildest coaching decision I've seen in years.",
    "Let me tell you what really caused that locker room tension.",
    "Why is nobody talking about this team's actual cap situation?",
    "How is this coach still employed after that performance?",
    "What if this draft pick ends up defining the entire franchise?",
    "Are you actually watching the o-line or just the highlight plays?",
    "How did this team go from Super Bowl contenders to lottery picks this fast?",
    "This practice footage leaked and it changes how you'll see this prospect.",
    "Breaking: this trade is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the injury.",
    "The physical is done. Here's why this signing still might collapse.",
    "This fourth-down call is either genius or the coach's last mistake.",
    "Compare this season to last year's — the difference will shock you.",
    "This is the same mistake this front office made two drafts ago.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This defensive scheme change explains everything about the last three games.",
    "The stats say one thing. What I watched on Sunday says another.",
    "This is the most underrated performance of the week, hands down.",
    "I need to talk about what this QB said in the postgame presser.",
    "This practice squad player just did something a starter couldn't.",
    "The trade package makes sense once you see what's really happening.",
    "This is why loyalty in the league doesn't exist anymore. Case in point.",
    "Nobody's asking the obvious question about this coaching hire.",
    "This play-action call is the smartest thing I've seen all month.",
    "The real winner of this trade deadline isn't who you think.",
    "This postgame quote is going to age very badly.",
    "Here's the hidden penalty nobody's talking about that decided the game.",
    "This front office's draft strategy just quietly changed everything."
  ],
  "Boxing": [
    "This callout is about to blow up and nobody's ready for it.",
    "The judges got that scorecard wrong and I need to say it.",
    "This champion is one bad camp away from losing the belt. Here's why.",
    "Everyone's hyping this prospect. I think he's being rushed. Let me explain.",
    "The jab nobody noticed completely won that fight on the cards.",
    "This is the worst stoppage decision I've seen all year.",
    "Three fighters are about to make the same catchweight mistake. Again.",
    "I watched this fight twice. Here's what everyone missed the first time.",
    "This journeyman outperformed two ranked contenders this year.",
    "The real reason this fighter is struggling has nothing to do with power.",
    "Hot take: this 'pound for pound' fighter is actually ducking real challenges.",
    "Unpopular opinion — this trainer change is working better than people admit.",
    "This is the defensive style every young fighter is adopting.",
    "Five title unification rumors this week that are actually believable.",
    "Here's why this undercard result matters more than the main event says.",
    "I've followed this sport for a decade. This era is different. Here's how.",
    "As someone who breaks down tape daily, this matchup makes zero sense.",
    "I tracked this fighter's punch output for a month. The numbers don't lie.",
    "Everyone in boxing media is wrong about this fighter. Including me, last month.",
    "So this happened at the weigh-in and it's about to leak everywhere.",
    "Storytime — how this fight almost got signed for a completely different network.",
    "You won't believe what actually happened before this fight started.",
    "This is the wildest press conference face-off I've seen in years.",
    "Let me tell you what really caused that promoter dispute.",
    "Why is nobody talking about this fighter's actual purse situation?",
    "How is this fighter still ranked top 5 after that performance?",
    "What if this fight ends up defining this fighter's entire legacy?",
    "Are you actually watching the footwork or just waiting for the knockout?",
    "How did this fighter go from title contender to journeyman this fast?",
    "This sparring footage leaked and it changes how you'll see this fighter.",
    "Breaking: this fight announcement is closer than anyone's reporting right now.",
    "This is developing fast — here's what we know about the injury pullout.",
    "The medicals are done. Here's why this fight still might not happen.",
    "This gameplan is either genius or the trainer's last mistake.",
    "Compare this camp to the last one — the difference will shock you.",
    "This is the same mistake this fighter made in their last title shot.",
    "Everyone's comparing him to a legend. Here's why that's unfair.",
    "This trainer change explains everything about the last two performances.",
    "The stats say one thing. What I watched ringside says another.",
    "This is the most underrated performance of the card, hands down.",
    "I need to talk about what this fighter said in the post-fight interview.",
    "This debutant just did something a ranked fighter couldn't.",
    "The title shot makes sense once you see what's really happening.",
    "This is why loyalty between fighter and promoter doesn't last. Case in point.",
    "Nobody's asking the obvious question about this weight class move.",
    "This body-shot combination is the smartest thing I've seen all month.",
    "The real winner of this rivalry isn't who you think.",
    "This post-fight callout is going to age very badly.",
    "Here's the hidden adjustment nobody's talking about that won that fight.",
    "This fighter's camp strategy just quietly changed everything."
  ]
};
// Generic fallback templates — used for niches not yet in HOOKS_BY_NICHE above.
const HOOK_TEMPLATES = [
  // Pattern interrupts / cold opens
  "Wait — before you scroll, you have to see this {topic} moment.",
  "Stop what you're doing. This {topic} clip is going to be everywhere by tomorrow.",
  "I wasn't going to post this, but I have to talk about what just happened in {topic}.",
  "Nobody is talking about this {topic} story and it's insane to me.",
  "This is the {topic} video I wish someone showed me a year ago.",
  // Curiosity gaps
  "There's something wrong with how everyone is covering this {topic} story.",
  "The real reason this {topic} moment blew up isn't what you think.",
  "I found out something about {topic} that changes everything.",
  "You've been watching {topic} the wrong way your whole life.",
  "This {topic} detail nobody caught is the whole story.",
  // Contrarian / hot take
  "Hot take: everything you've been told about {topic} is wrong.",
  "I'm going to say what everyone else is scared to say about {topic}.",
  "Unpopular opinion, but this is the truth about {topic}.",
  "This is going to make some {topic} fans mad, but it needs to be said.",
  "The {topic} community won't want to hear this.",
  // List / promise
  "Three things about {topic} that will change how you see it.",
  "Five {topic} moves nobody talks about but the best ones use.",
  "Seven seconds. That's how long it takes to explain what actually happened in {topic}.",
  "Here are the three {topic} mistakes killing your reach right now.",
  "Watch this for two minutes and you'll understand {topic} better than 90% of people.",
  // Authority / experience
  "I've been in {topic} for years and I've never seen something like this.",
  "I watched 100 hours of {topic} content this week so you don't have to.",
  "As someone who actually creates {topic} content, let me put you on.",
  "I tested this {topic} strategy for 30 days. Here's what actually happened.",
  "Everyone in {topic} is doing this one thing wrong. Including me — until last month.",
  // Story / narrative
  "So this {topic} thing just happened and I need someone to explain it to me.",
  "Storytime — the {topic} moment that everyone missed.",
  "You're not going to believe how this {topic} story ended.",
  "This is the wildest {topic} thing I've seen all year.",
  "Let me tell you what really went down with this {topic} situation.",
  // Question hooks
  "Why is nobody talking about what happened in {topic} last night?",
  "How is this {topic} moment not the biggest story on the internet right now?",
  "What if I told you {topic} is about to change forever?",
  "Are you actually watching {topic} or are you just letting it play?",
  "How did we all miss this about {topic}?",
  // FOMO / urgency
  "This {topic} moment is about to be everywhere. Post before it's dead.",
  "You have about 12 hours to post about this {topic} story before the wave dies.",
  "If you don't hop on this {topic} trend today, you're already late.",
  "This {topic} window closes fast. Here's the angle nobody's using yet.",
  "The algorithm is pushing anything {topic} right now. Don't sleep.",
  // Numbers / results
  "This {topic} take got me 2M views last week. Steal the format.",
  "Here's the {topic} script that outperforms everything else in 2026.",
  "One {topic} format is quietly dominating every For You Page.",
  "The one {topic} hook that keeps hitting no matter the algorithm.",
  "Under-10K {topic} creators are winning right now. Here's how.",
  // Direct address / duet setup
  "If you make {topic} content, this is for you.",
  "This is a message to every {topic} creator who feels stuck.",
  "Tag a {topic} fan who needs to see this immediately.",
  "Duet this if you agree about {topic}.",
  "Come with me while I break down this {topic} moment in real time."
];
app.get("/api/hooks", (req, res) => {
  const niche = (req.query.niche || "your niche").toString();
  const _ck = "hooks:" + niche;
  const _hit = cacheGet(_ck);
  if (_hit) return res.json(_hit);
  let _payload;
  if (HOOKS_BY_NICHE[niche]) {
    _payload = { hooks: HOOKS_BY_NICHE[niche].map((h,i)=>({ id:i, text: h })) };
  } else {
    const topic = niche.replace(/\s*[\/\(\)].*$/,"").toLowerCase();
    _payload = { hooks: HOOK_TEMPLATES.map((h,i)=>({ id:i, text: h.replace(/\{topic\}/g, topic) })) };
  }
  cacheSet(_ck, _payload, 60*60*1000);
  res.json(_payload);
});

// ── v1.7 PRE-BETA: feedback, analytics, kill-switches ───────────────────────
const _feedback = [];
const _events = [];
const _flags = {
  aiCoach: true,
  imageGen: true,
  createStudio: true,
  trendsRefresh: true,
};

app.post("/api/feedback", async (req, res) => {
  const { userId, email, screen, message, context } = req.body || {};
  if (!message || String(message).trim().length < 3) {
    return res.status(400).json({ error: "Message required" });
  }
  const entry = {
    id: Date.now(),
    at: new Date().toISOString(),
    userId: userId || null,
    email: email || null,
    screen: screen || null,
    message: String(message).slice(0, 4000),
    context: context || null,
  };
  _feedback.push(entry);
  if (_feedback.length > 500) _feedback.shift();
  if (supabase) {
    try { await supabase.from("feedback").insert(entry); } catch (e) {}
  }
  console.log("[feedback]", entry.userId, entry.screen, entry.message.slice(0, 120));
  res.json({ ok: true, id: entry.id });
});

app.get("/api/feedback", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(500).json({
      error: "ADMIN_KEY is not configured."
    });
  }

  if ((req.query.key || "") !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }
  res.json({ feedback: _feedback.slice(-200).reverse() });
});

app.post("/api/analytics/event", (req, res) => {
  const { userId, name, props } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const ev = { at: Date.now(), userId: userId || null, name: String(name).slice(0, 60), props: props || {} };
  _events.push(ev);
  if (_events.length > 5000) _events.splice(0, _events.length - 5000);
  res.json({ ok: true });
});

app.get("/api/analytics/summary", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(500).json({
      error: "ADMIN_KEY is not configured."
    });
  }

  if ((req.query.key || "") !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }
  const byName = {};
  const uniqUsers = new Set();
  for (const e of _events) {
    byName[e.name] = (byName[e.name] || 0) + 1;
    if (e.userId) uniqUsers.add(e.userId);
  }
  res.json({ total: _events.length, uniqueUsers: uniqUsers.size, byName });
});

app.get("/api/flags", (_req, res) => res.json(_flags));
app.post("/api/flags", (req, res) => {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(500).json({
      error: "ADMIN_KEY is not configured."
    });
  }

  if ((req.body?.key || "") !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }
  Object.assign(_flags, req.body.flags || {});
  res.json({ ok: true, flags: _flags });
});

app.get("/api/legal/terms", (_req, res) => {
  res.json({
    updated: "2026-07-16",
    text: [
      "By using CreatorPulse you agree to use it for lawful content creation only.",
      "You keep full ownership of any script, video, or image you generate.",
      "We may collect anonymous usage analytics to improve the product.",
      "AI outputs are suggestions — verify facts before publishing.",
      "We are not liable for content you choose to publish on third-party platforms.",
      "Beta software: features may change or break. Save important work locally.",
    ],
  });
});

app.get("/api/legal/privacy", (_req, res) => {
  res.json({
    updated: "2026-07-16",
    text: [
      "Videos recorded in Create Studio never leave your device. Camera + mic run locally in your browser.",
      "Account data (email, niches, saved posts) is stored securely for your account only.",
      "Connected social handles are stored so the AI Coach can personalize advice. We never post on your behalf.",
      "Anonymous analytics events are collected (which tabs used, feature drop-off). No content bodies are logged.",
      "You can export or wipe your data any time from Profile → Data & Privacy.",
      "Contact: support@creatorpulse.app to request deletion.",
    ],
  });
});

app.post("/api/account/export", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  const out = { exportedAt: new Date().toISOString(), userId };
  if (supabase) {
    try {
      const [saved, sched] = await Promise.all([
        supabase.from("saved_posts").select("*").eq("user_id", userId),
        supabase.from("user_schedule").select("*").eq("user_id", userId),
      ]);
      out.saved = saved.data || [];
      out.schedule = sched.data || [];
    } catch (e) { out.error = e.message; }
  }
  res.json(out);
});

app.post("/api/account/reset", async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  if (supabase) {
    try {
      await supabase.from("saved_posts").delete().eq("user_id", userId);
      await supabase.from("user_schedule").delete().eq("user_id", userId);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
  res.json({ ok: true });
});


// ── CONTACT FORM ─────────────────────────────────────────────────────────────
function _isEmail(x) {
  return typeof x === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) && x.length <= 255;
}
app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    const name    = String(b.name    || "").trim().slice(0, 80);
    const email   = String(b.email   || "").trim().slice(0, 255);
    const subject = String(b.subject || "").trim().slice(0, 200);
    const message = String(b.message || "").trim().slice(0, 4000);
    if (!name || !subject || message.length < 5) {
      return res.status(400).json({ error: "Name, subject and message are required." });
    }
    if (!_isEmail(email)) return res.status(400).json({ error: "Valid email required." });
    if (!supabase) return res.status(503).json({ error: "Contact storage not configured." });

    const { error } = await supabase.from("contact_messages").insert({
      name, email, subject, message,
      ip: req.ip,
      user_agent: (req.headers["user-agent"] || "").slice(0, 500),
    });
    if (error) return res.status(500).json({ error: "Could not save your message. Please try again." });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Unexpected error." });
  }
});

// ── STUDIO: AUTO-CAPTIONS (Groq Whisper) ─────────────────────────────────────
// Accepts a raw audio body (wav/webm/mp4/mp3/ogg) up to 25MB, forwards to
// Groq Whisper large-v3 with word/segment timestamps, returns [{start,end,text}].
// Rate limited via heavyLimiter (30/hour). Requires GROQ_API_KEY.
app.post(
  "/api/transcribe",
  heavyLimiter,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!GROQ_KEY) return res.status(503).json({ error: "Transcription not configured." });
      const file = req.file;
      if (!file || !file.buffer || !file.buffer.length) return res.status(400).json({ error: "Empty audio body." });
      if (file.buffer.length > 25 * 1024 * 1024) return res.status(413).json({ error: "Audio too large (25MB max)." });

      const ct = (file.mimetype || "audio/webm").toLowerCase();
      const ext = ct.includes("mp4") ? "mp4"
                : ct.includes("mpeg") || ct.includes("mp3") ? "mp3"
                : ct.includes("webm") ? "webm"
                : ct.includes("ogg") ? "ogg"
                : ct.includes("m4a") ? "m4a"
                : "wav";

      // Frontend can request word-level timing (for word-by-word captions) via
      // the `granularity` field; default to requesting both word + segment so
      // older and newer caption code paths both get what they need.
      const wantWord = (req.body?.granularity || "word") === "word";

      const fd = new FormData();
      fd.append("file", new Blob([file.buffer], { type: ct }), `clip.${ext}`);
      fd.append("model", "whisper-large-v3");
      fd.append("response_format", "verbose_json");
      fd.append("timestamp_granularities[]", "segment");
      if (wantWord) fd.append("timestamp_granularities[]", "word");

      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 60000);
      let r;
      try {
        // Node's native fetch (not node-fetch@2) — required for it to correctly
        // set multipart headers for native FormData/Blob.
        r = await globalThis.fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_KEY}` },
          body: fd,
          signal: ctrl.signal,
        });
      } finally { clearTimeout(to); }

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        console.error("[transcribe] upstream", r.status, t.slice(0, 300));
        let reason = "Transcription failed.";
        try {
          const parsed = JSON.parse(t);
          if (parsed?.error?.message) reason = parsed.error.message;
        } catch (_) {}
        return res.status(502).json({ error: reason, upstreamStatus: r.status });
      }
      const data = await r.json();
      const segments = Array.isArray(data.segments)
        ? data.segments.map(s => ({
            start: Number(s.start) || 0,
            end: Number(s.end) || 0,
            text: String(s.text || "").trim(),
          })).filter(s => s.text)
        : (data.text ? [{ start: 0, end: 0, text: String(data.text).trim() }] : []);
      const words = Array.isArray(data.words)
        ? data.words.map(w => ({
            word: String(w.word || "").trim(),
            start: Number(w.start) || 0,
            end: Number(w.end) || 0,
          })).filter(w => w.word)
        : [];
      res.json({ segments, words, text: data.text || segments.map(s => s.text).join(" ") });
    } catch (e) {
      console.error("[transcribe]", e && e.message);
      res.status(500).json({ error: "Unexpected error." });
    }
  }
);

// Graceful catch-all for unknown /api/* (JSON, not HTML)
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler — never leak stack traces
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err && err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CreatorPulse running on port ${PORT}`));

// SECURITY NOTE:
// - Passwords are hashed by Supabase Auth (bcrypt/argon2). Never store plaintext.
// - HTTPS is terminated by Render. 'trust proxy' + x-forwarded-proto guard is set above.
// - Enable Point-in-Time Recovery in the Supabase dashboard when you upgrade
//   to the Pro plan (7-day PITR). Free tier includes daily backups.
// - This deployment uses Bearer-token auth (no cookies), so CSRF tokens are
//   not required. Do NOT switch to cookie-based auth without adding CSRF.


