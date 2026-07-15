// CreatorPulse server — production build
// Env required on Render: GROQ_API_KEY, HF_API_KEY, NEWS_API_KEY,
//                         SUPABASE_URL, SUPABASE_SERVICE_KEY,
//                         GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//                         GOOGLE_REDIRECT_URI, FRONTEND_URL

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const RSSParser = require("rss-parser");
const { createClient } = require("@supabase/supabase-js");
const { google } = require("googleapis");

const app = express();
const parser = new RSSParser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0 CreatorPulseBot/1.0" } });
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));
app.get("/", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

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

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ── AUTH ────────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Auth not configured" });
  const { email, password, name, niches, platforms, primaryPlatform, postsPerDay } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { name, niches, platforms, primaryPlatform, postsPerDay },
      email_confirm: true
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user });
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
    { title: "Premier League matchday", date: "2026-08-15", description: "Opening weekend of the 2026-27 season." },
    { title: "Champions League Final", date: "2027-06-05", description: "UEFA Champions League Final." },
    { title: "FA Cup Final", date: "2027-05-22", description: "FA Cup Final at Wembley." },
    { title: "Community Shield", date: "2026-08-08", description: "Season curtain-raiser." },
    { title: "FIFA World Cup qualifiers", date: "2026-11-12", description: "Qualification round." }
  ],
  "Basketball": [
    { title: "NBA regular season tip-off", date: "2026-10-20", description: "Opening night." },
    { title: "NBA Christmas Day slate", date: "2026-12-25", description: "Marquee holiday games." },
    { title: "NBA All-Star Weekend", date: "2027-02-13", description: "All-Star festivities." },
    { title: "NBA Playoffs begin", date: "2027-04-18", description: "First round." },
    { title: "NBA Finals tip-off", date: "2027-06-03", description: "Championship series." }
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
  "default": [
    { title: "New Year", date: "2027-01-01", description: "Kickoff content window." },
    { title: "Valentine's Day", date: "2027-02-14", description: "Seasonal content beat." },
    { title: "Halloween", date: "2026-10-31", description: "Seasonal content beat." },
    { title: "Black Friday", date: "2026-11-27", description: "Retail/creator brand deals peak." }
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
          return res.json({ articles });
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
      return {
        id: `${niche.replace(/\s/g, "_")}_rss_${i}_${Date.now()}`,
        niche,
        headline: item.title,
        summary: item.contentSnippet || (item.content ? item.content.slice(0, 200) : ""),
        image: null,
        url: item.link,
        source: feed.title || "",
        score: Math.floor(Math.random() * 15) + 80,
        tags: extractTags(item.title, niche),
        timestamp: new Date(item.isoDate || Date.now()).getTime()
      };
    });
    res.json({ articles: filteredItems });
  } catch (e) {
    console.error("News error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── BLOGS ───────────────────────────────────────────────────────────────────
app.get("/api/blog-feed", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const feeds = [...(NICHE_BLOG_RSS[niche] || []), googleNews(NICHE_QUERIES[niche] || niche)].slice(0, 5);
  let allArticles = [];
  await Promise.all(feeds.map(async feedUrl => {
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
  res.json({ articles: filteredBlogs.slice(0, 10) });
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

app.post("/api/generate", async (req, res) => {
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
app.post("/api/generate-image", async (req, res) => {
  const { prompt, format } = req.body; // format: "square" | "portrait" | "story"
  const styled = `${prompt}. Modern editorial photography, sharp focus, high contrast lighting, cinematic color grade, magazine-quality composition, no text, no watermark`;
  const models = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5"
  ];
  for (const model of models) {
    try {
      const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: styled,
          parameters: { negative_prompt: "blurry, low quality, distorted, watermark, text, logo, ugly, deformed", num_inference_steps: 25 }
        })
      });
      if (!r.ok) continue;
      const b64 = (await r.buffer()).toString("base64");
      return res.json({ image: `data:image/jpeg;base64,${b64}`, model, format: format || "square" });
    } catch (e) { /* try next */ }
  }
  res.status(500).json({ error: "All image models unavailable" });
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CreatorPulse running on port ${PORT}`));
