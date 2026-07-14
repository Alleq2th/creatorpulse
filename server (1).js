require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const RSSParser = require("rss-parser");
const { createClient } = require("@supabase/supabase-js");
const { google } = require("googleapis");

const app = express();
const parser = new RSSParser();
app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const GROQ_KEY = process.env.GROQ_API_KEY;
const HF_KEY = process.env.HF_API_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
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
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── NICHE → NEWS QUERY MAPPING ────────────────────────────────────────────────
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
  "Celebrity Gossip": "celebrity gossip Hollywood entertainment scandal",
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
  "Yapping Videos": "viral controversial opinion debate internet reacts",
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
  "Self-Development": "self development personal growth mindset",
};

// ── RSS FEEDS ──────────────────────────────────────────────────────────────
const NICHE_RSS = {
  "Football/Soccer": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "Basketball": "https://feeds.bbci.co.uk/sport/basketball/rss.xml",
  "Music (Afrobeats)": "https://rss.app/feeds/afrobeats.xml",
  "Crypto": "https://cointelegraph.com/rss",
  "AI & Tech News": "https://feeds.feedburner.com/TechCrunch",
  "Movies & TV": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  "default": "https://feeds.bbci.co.uk/news/rss.xml",
};

const NICHE_BLOG_RSS = {
  "Football/Soccer": [
    "https://www.goal.com/rss/en/news",
    "https://www.skysports.com/rss/0,,12040,00.xml",
    "https://www.espn.com/espn/rss/football/news",
    "https://www.theguardian.com/football/rss"
  ],
  "Basketball": [
    "https://www.espn.com/espn/rss/basketball/news",
    "https://bleacherreport.com/articles/feed",
    "https://www.si.com/nba/rss",
    "https://www.cbssports.com/nba/rss"
  ],
  "Formula 1": [
    "https://www.autosport.com/rss/feed/f1",
    "https://www.espn.com/espn/rss/motorsports/news",
    "https://www.motorsport.com/rss/f1/news"
  ],
  "Crypto": [
    "https://cointelegraph.com/rss",
    "https://cryptobriefing.com/feed",
    "https://www.coindesk.com/arc/outboundfeeds/rss/"
  ],
  "AI & Tech News": [
    "https://feeds.feedburner.com/TechCrunch",
    "https://www.theverge.com/rss/index.xml",
    "https://www.wired.com/feed/rss",
    "https://venturebeat.com/feed"
  ],
  "Movies & TV": [
    "https://www.hollywoodreporter.com/feed",
    "https://variety.com/feed",
    "https://deadline.com/feed"
  ],
  "Gaming": [
    "https://www.ign.com/rss/articles",
    "https://www.gamespot.com/feeds/news",
    "https://www.pcgamer.com/rss"
  ],
  "Music (Hip-Hop)": [
    "https://www.complex.com/feeds/music",
    "https://hiphopdx.com/feed",
    "https://www.xxlmag.com/feed"
  ],
  "Travel": [
    "https://www.lonelyplanet.com/feeds/news",
    "https://www.travelandleisure.com/feed",
    "https://www.cntraveler.com/feed"
  ],
  "default": [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://www.reuters.com/rssfeed/topnews"
  ]
};

// ── EVENTS CALENDAR (static + dynamic) ─────────────────────────────────────
const NICHE_EVENTS = {
  "Football/Soccer": [
    { title: "Premier League Season Starts", date: "2026-08-15", description: "Opening weekend of the 2026-27 Premier League season." },
    { title: "Champions League Final", date: "2026-06-06", description: "UEFA Champions League Final at Wembley Stadium." },
    { title: "FIFA World Cup Qualifiers", date: "2026-11-12", description: "World Cup qualification matches begin." },
    { title: "FA Cup Final", date: "2026-05-24", description: "FA Cup Final at Wembley." },
    { title: "Community Shield", date: "2026-08-09", description: "Premier League vs FA Cup winners." },
  ],
  "Basketball": [
    { title: "NBA Season Starts", date: "2026-10-19", description: "NBA regular season tips off." },
    { title: "NBA All-Star Weekend", date: "2027-02-14", description: "All-Star festivities in Indianapolis." },
    { title: "NBA Playoffs Start", date: "2027-04-14", description: "First round of the NBA playoffs." },
    { title: "NBA Finals Start", date: "2027-06-01", description: "NBA Finals begin." },
  ],
  "Movies & TV": [
    { title: "New Marvel Movie Premiere", date: "2026-07-24", description: "Untitled Marvel blockbuster releases." },
    { title: "Oscar Nominations", date: "2027-01-23", description: "Academy Award nominations announced." },
    { title: "Oscars 2027", date: "2027-03-07", description: "99th Academy Awards ceremony." },
    { title: "Netflix Original: New Series", date: "2026-08-01", description: "Major Netflix original series drops." },
  ],
  "Formula 1": [
    { title: "F1 Season Opener", date: "2026-03-15", description: "Bahrain Grand Prix." },
    { title: "Monaco Grand Prix", date: "2026-05-24", description: "The iconic Monaco street race." },
    { title: "British Grand Prix", date: "2026-07-05", description: "Silverstone Circuit." },
  ],
  "Music (Afrobeats)": [
    { title: "Afrobeats Festival 2026", date: "2026-07-30", description: "Major Afrobeats festival in Lagos." },
    { title: "Burna Boy Tour", date: "2026-09-15", description: "Burna Boy's European tour starts." },
  ],
  "Crypto": [
    { title: "Bitcoin Halving", date: "2028-04-10", description: "Next Bitcoin halving event." },
    { title: "Crypto Conference 2026", date: "2026-10-20", description: "Major crypto conference in Dubai." },
  ],
  "default": [
    { title: "Global Tech Summit", date: "2026-11-01", description: "Annual tech summit in San Francisco." },
    { title: "World Economics Forum", date: "2027-01-15", description: "Davos 2027." },
  ]
};

// ── ROUTE: GET NEWS ──────────────────────────────────────────────────────────

// ── NICHE KEYWORD FILTERS (Step 1: relevance) ────────────────────────────────
// For each niche: `must` = at least one of these words must appear in title or summary
// `banned` = if any of these appear in title, drop the article (unless it's also in must)
// This stops off-topic bleed (e.g. "World News" leaking into American Football).
const NICHE_KEYWORDS = {
  "Football/Soccer": { must: ["football","soccer","premier league","la liga","champions league","uefa","fifa","transfer","goal","striker","messi","ronaldo","mbapp","haaland","liverpool","chelsea","arsenal","real madrid","barcelona","man utd","manchester","psg","bayern"], banned: ["nfl","american football","touchdown","quarterback","super bowl"] },
  "Basketball": { must: ["nba","basketball","lakers","warriors","celtics","lebron","curry","doncic","jokic","embiid","playoff","dunk","three-pointer","fiba","euroleague"], banned: ["soccer","football match","cricket","rugby"] },
  "Tennis": { must: ["tennis","atp","wta","grand slam","wimbledon","us open","french open","australian open","roland garros","djokovic","alcaraz","sinner","swiatek","gauff","sabalenka","serve","forehand"], banned: [] },
  "Cricket": { must: ["cricket","ipl","test match","odi","t20","wicket","batsman","bowler","icc","world cup","ashes","bcci","rohit","kohli","pakistan","india","australia"], banned: ["football","soccer","nba"] },
  "Formula 1": { must: ["formula 1","formula one","f1","grand prix","ferrari","mclaren","mercedes","red bull","verstappen","hamilton","leclerc","norris","piastri","pole position","pit stop","monaco","silverstone"], banned: ["nascar","indycar","motogp"] },
  "Boxing": { must: ["boxing","boxer","heavyweight","featherweight","knockout","ko","wba","wbc","wbo","ibf","fury","joshua","canelo","usyk","haney","garcia","undisputed","world title"], banned: ["ufc","mma","wwe"] },
  "MMA/UFC": { must: ["ufc","mma","octagon","dana white","conor mcgregor","islam","volkanovski","pereira","strickland","adesanya","bellator","pfl","submission","tko"], banned: ["boxing match","wwe"] },
  "WWE Wrestling": { must: ["wwe","wrestlemania","smackdown","raw","aew","cody rhodes","roman reigns","seth rollins","cm punk","john cena","royal rumble","summerslam"], banned: [] },
  "American Football": { must: ["nfl","american football","super bowl","touchdown","quarterback","patriots","chiefs","cowboys","eagles","49ers","mahomes","kelce","brady","lamar","college football","ncaa football"], banned: ["soccer","premier league","fifa","champions league","cricket","nba"] },
  "Baseball": { must: ["mlb","baseball","world series","yankees","dodgers","red sox","home run","pitcher","strikeout","shohei","ohtani","judge","aaron"], banned: ["cricket","football"] },
  "Ice Hockey": { must: ["nhl","hockey","stanley cup","goalie","rangers","bruins","oilers","maple leafs","mcdavid","crosby","ovechkin","penalty"], banned: [] },
  "Golf": { must: ["golf","pga","liv golf","masters","us open","the open","ryder cup","tiger woods","rory mcilroy","scheffler","koepka","augusta","birdie","eagle","bogey"], banned: [] },
  "Rugby": { must: ["rugby","six nations","world cup","all blacks","springboks","try","scrum","fly-half","world rugby","premiership rugby"], banned: ["american football","nfl"] },
  "Athletics/Track": { must: ["athletics","track","sprint","100m","200m","marathon","world championships","diamond league","usain bolt","noah lyles","sha'carri","olympics","record"], banned: [] },
  "Cycling": { must: ["cycling","tour de france","giro","vuelta","peloton","time trial","pogacar","vingegaard","evenepoel","uci"], banned: [] },
  "Swimming": { must: ["swimming","freestyle","backstroke","butterfly","breaststroke","olympics","world record","fina","world aquatics","ledecky","dressel"], banned: [] },
  "Esports": { must: ["esports","league of legends","lol","valorant","cs2","counter-strike","dota","overwatch","tournament","worlds","major","tier 1","riot games"], banned: [] },
  "Volleyball": { must: ["volleyball","fivb","vnl","serve","spike","block","olympics","world championship"], banned: [] },
  "Celebrity Gossip": { must: ["celebrity","hollywood","kardashian","jenner","taylor swift","kanye","drake","selena","zendaya","gossip","dating","split","rumor","engaged","paparazzi","red carpet"], banned: [] },
  "Music (Afrobeats)": { must: ["afrobeats","burna boy","wizkid","davido","rema","tems","asake","ayra starr","tiwa","nigerian music","african music","amapiano"], banned: [] },
  "Music (Hip-Hop)": { must: ["hip hop","hip-hop","rap","rapper","drake","kendrick","lamar","j cole","travis scott","future","21 savage","nicki minaj","cardi b","album drop","freestyle","diss"], banned: [] },
  "Music (Pop)": { must: ["pop music","taylor swift","billie eilish","ariana grande","dua lipa","olivia rodrigo","harry styles","the weeknd","billboard","chart","single","album"], banned: [] },
  "Music (R&B)": { must: ["r&b","rnb","soul music","beyonce","sza","summer walker","brent faiyaz","frank ocean","the weeknd","jhene aiko","h.e.r"], banned: [] },
  "Music (K-Pop)": { must: ["k-pop","kpop","bts","blackpink","newjeans","twice","stray kids","le sserafim","aespa","seventeen","comeback","hybe","sm entertainment","jyp"], banned: [] },
  "Music (Amapiano)": { must: ["amapiano","south africa","kabza","dj maphorisa","tyla","uncle waffles","piano","log drum"], banned: [] },
  "Movies & TV": { must: ["movie","film","tv series","netflix","hbo","disney+","apple tv","prime video","box office","trailer","release","season","episode","oscar","emmy","director","actor"], banned: [] },
  "Anime": { must: ["anime","manga","one piece","naruto","jujutsu kaisen","demon slayer","attack on titan","my hero academia","chainsaw man","shonen","seinen","crunchyroll","mangaka"], banned: [] },
  "Korean Drama": { must: ["k-drama","korean drama","kdrama","netflix korea","squid game","goblin","descendants of the sun","son ye-jin","hyun bin","lee min-ho","song joong-ki"], banned: [] },
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
  "Pets": { must: ["dog","cat","puppy","kitten","pet","animal","viral pet","adoption","vet","golden retriever","husky"], banned: [] },
  "Streetwear": { must: ["streetwear","sneaker","supreme","nike","jordan","yeezy","hypebeast","travis scott","off-white","stussy","palace","drop"], banned: [] },
  "Luxury Fashion": { must: ["gucci","louis vuitton","chanel","dior","prada","hermes","balenciaga","fendi","versace","runway","paris fashion week","milan fashion week","couture"], banned: [] },
  "Skincare": { must: ["skincare","dermatology","serum","retinol","niacinamide","hyaluronic","spf","sunscreen","cerave","the ordinary","glow"], banned: [] },
  "Makeup": { must: ["makeup","cosmetics","lipstick","foundation","mascara","eyeshadow","fenty","rare beauty","mac","charlotte tilbury","glow"], banned: [] },
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
  "Political Commentary": { must: ["politics","election","president","congress","senate","policy","government","biden","trump","harris","white house"], banned: [] },
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
  "Self-Development": { must: ["self-improvement","personal growth","self-development","mindset","atomic habits","goals","discipline"], banned: [] },
};

// Universal banned words that never belong in creator/niche feeds regardless
// of source. Applied unless the niche explicitly includes them as `must`.
const GLOBAL_BANNED = ["obituary","died","killed in crash","funeral"];

// Score & filter a batch of articles for a niche. Returns items sorted by
// relevance, dropping anything below threshold.
// Item shape: { title, summary, source? }
function filterAndScoreArticles(items, niche, opts = {}) {
  const cfg = NICHE_KEYWORDS[niche];
  const fallbackQuery = (NICHE_QUERIES[niche] || niche || "").toLowerCase();
  const fallbackWords = fallbackQuery.split(/\s+/).filter(w => w.length > 3);
  const must = cfg ? cfg.must.map(w => w.toLowerCase()) : fallbackWords;
  const banned = cfg ? cfg.banned.map(w => w.toLowerCase()) : [];
  const threshold = opts.threshold != null ? opts.threshold : 1;
  let dropped = 0;
  const scored = items.map(it => {
    const title = (it.title || "").toLowerCase();
    const summary = (it.summary || "").toLowerCase();
    const hay = title + " \u0000 " + summary;

    // Global banned words (unless niche explicitly wants them)
    for (const g of GLOBAL_BANNED) {
      if (hay.includes(g) && !must.some(m => g.includes(m))) {
        dropped++; return null;
      }
    }
    // Niche-banned words in TITLE = hard drop (e.g. "NFL" in Football/Soccer)
    for (const b of banned) {
      if (title.includes(b) && !must.some(m => b.includes(m) || m.includes(b))) {
        dropped++; return null;
      }
    }
    // Score by must-word hits (title = 2, summary = 1)
    let score = 0;
    for (const m of must) {
      if (title.includes(m)) score += 2;
      else if (summary.includes(m)) score += 1;
    }
    if (score < threshold) { dropped++; return null; }
    return { item: it, _score: score };
  }).filter(Boolean).sort((a,b) => b._score - a._score);

  if (dropped > 0) {
    console.log(`[relevance] ${niche}: kept ${scored.length}/${items.length} (dropped ${dropped})`);
  }
  return scored.map(x => ({ ...x.item, _relevance: x._score }));
}


app.get("/api/news", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const query = NICHE_QUERIES[niche] || niche;

  try {
    if (NEWS_KEY && NEWS_KEY !== "YOUR_NEWS_KEY_HERE") {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${NEWS_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.articles && data.articles.length > 0) {
        const normalized = data.articles.map(a => ({
          title: a.title || "",
          summary: a.description || (a.content ? a.content.slice(0, 200) : ""),
          _raw: a
        }));
        const kept = filterAndScoreArticles(normalized, niche).slice(0, 10);
        if (kept.length > 0) {
          const articles = kept.map((k, i) => {
            const a = k._raw;
            return {
              id: `${niche.replace(/\s/g, "_")}_${i}_${Date.now()}`,
              niche,
              headline: a.title,
              summary: a.description || (a.content ? a.content.slice(0, 200) : ""),
              image: a.urlToImage || null,
              url: a.url,
              source: a.source && a.source.name ? a.source.name : "",
              score: Math.max(70, 99 - i * 2),
              tags: extractTags(a.title, niche),
              timestamp: Date.now()
            };
          });
          return res.json({ articles });
        }
      }
    }

    // Fallback RSS
    const rssUrl = NICHE_RSS[niche] || NICHE_RSS["default"];
    const feed = await parser.parseURL(rssUrl);
    const normalized = (feed.items || []).map(item => ({
      title: item.title || "",
      summary: item.contentSnippet || (item.content ? item.content.slice(0, 200) : ""),
      _raw: item
    }));
    const kept = filterAndScoreArticles(normalized, niche).slice(0, 6);
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
        timestamp: Date.now()
      };
    });

    if (filteredItems.length === 0) return res.json({ articles: [] });
    return res.json({ articles: filteredItems });

  } catch (e) {
    console.error("News error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

function extractTags(title, niche) {
  const words = title.split(" ").filter(w => w.length > 4).slice(0, 3);
  return [niche.split("/")[0], ...words.slice(0, 2)];
}

// ── ROUTE: BLOG FEED ──────────────────────────────────────────────────────────
app.get("/api/blog-feed", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const feeds = NICHE_BLOG_RSS[niche] || NICHE_BLOG_RSS["default"];
  let allArticles = [];
  for (const feedUrl of feeds.slice(0, 3)) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const items = (feed.items || []).slice(0, 3).map((item, i) => {
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url;
        else if (item['media:content'] && item['media:content'].url) imageUrl = item['media:content'].url;
        else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
        }
        return {
          id: `blog_${niche}_${feedUrl}_${i}_${Date.now()}`,
          niche,
          headline: item.title,
          summary: item.contentSnippet || item.content?.slice(0, 200) || "",
          image: imageUrl,
          url: item.link,
          source: feed.title || feedUrl,
          score: 90 + Math.floor(Math.random() * 10),
          tags: ["Blog", ...extractTags(item.title, niche)],
          timestamp: Date.now()
        };
      });
      allArticles.push(...items);
    } catch (e) { console.log("Blog fetch error:", e.message); }
  }
  // Step 1: relevance filter — drop off-topic blog items
  const blogNormalized = allArticles.map(a => ({ title: a.headline, summary: a.summary, _raw: a }));
  const blogKept = filterAndScoreArticles(blogNormalized, niche, { threshold: 1 });
  let filteredBlogs = blogKept.map(k => k._raw);
  // Fallback: if strict filter wiped everything, keep original list so the page isn't blank
  if (filteredBlogs.length === 0) filteredBlogs = allArticles;
  filteredBlogs.sort((a, b) => b.score - a.score);
  const seen = new Set();
  filteredBlogs = filteredBlogs.filter(a => {
    const key = (a.headline || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  res.json({ articles: filteredBlogs.slice(0, 8) });
});

// ── ROUTE: TWITTER FEED ──────────────────────────────────────────────────────
app.get("/api/twitter-feed", async (req, res) => {
  const { handle } = req.query;
  if (!handle) return res.status(400).json({ error: "handle required" });
  try {
    const rssUrl = `https://nitter.net/${handle}/rss`;
    const feed = await parser.parseURL(rssUrl);
    const items = (feed.items || []).slice(0, 5).map((item, i) => {
      let imageUrl = null;
      if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url;
      else if (item['media:content'] && item['media:content'].url) imageUrl = item['media:content'].url;
      else if (item.content) {
        const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }
      return {
        id: `twitter_${handle}_${Date.now()}_${i}`,
        headline: item.title,
        summary: item.contentSnippet || "",
        image: imageUrl,
        url: item.link,
        source: `Twitter @${handle}`,
        score: 95 + Math.floor(Math.random() * 5),
        tags: ["Breaking", "Twitter"],
        niche: "Breaking Sports",
        timestamp: Date.now()
      };
    });
    res.json({ articles: items });
  } catch (e) {
    console.error("Twitter RSS error:", e.message);
    res.json({ articles: [] });
  }
});

// ── ROUTE: EVENTS ─────────────────────────────────────────────────────────────
app.get("/api/events", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });
  const events = NICHE_EVENTS[niche] || NICHE_EVENTS["default"];
  // Filter to only show future events
  const now = new Date();
  const future = events.filter(e => new Date(e.date) >= now);
  res.json({ events: future.slice(0, 10) });
});

// ── IMAGE PROXY ────────────────────────────────────────────────────────────────
app.get("/api/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("url required");
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return res.status(502).send("Failed to fetch image");
    const contentType = r.headers.get("content-type") || "image/jpeg";
    const buffer = await r.buffer();
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (e) {
    res.status(500).send("Proxy error");
  }
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
  } catch (e) {
    res.json({ image: null });
  }
});

app.get("/api/wiki-image", async (req, res) => {
  const { query } = req.query;
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const d = await r.json();
    const image = d.thumbnail?.source || d.originalimage?.source || null;
    res.json({ image, title: d.title, extract: d.extract });
  } catch (e) {
    res.json({ image: null });
  }
});

// ── GENERATE TEXT ──────────────────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { system, user } = req.body;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });
    const d = await r.json();
    if (d.error) {
      console.error("Groq API error:", d.error);
      return res.status(500).json({ error: d.error.message || "Groq API error", text: "" });
    }
    const text = d.choices?.[0]?.message?.content || "";
    res.json({ text });
  } catch (e) {
    console.error("Groq request failed:", e.message);
    res.status(500).json({ error: e.message, text: "" });
  }
});

// ── GENERATE IMAGE ─────────────────────────────────────────────────────────────
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: "blurry, bad quality, distorted, ugly",
            num_inference_steps: 20
          }
        }),
      }
    );
    if (!r.ok) {
      const err = await r.text();
      if (r.status === 429) {
        const fallback = await fetch(
          "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HF_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
          }
        );
        if (!fallback.ok) {
          const err2 = await fallback.text();
          return res.status(500).json({ error: err2 });
        }
        const buffer = await fallback.buffer();
        const base64 = buffer.toString("base64");
        return res.json({ image: `data:image/jpeg;base64,${base64}` });
      }
      return res.status(500).json({ error: err });
    }
    const buffer = await r.buffer();
    const base64 = buffer.toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (e) {
    console.error("Image generation error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  const { niches } = req.query;
  const nicheList = niches ? niches.split(",") : [];
  const notifications = [];
  for (const niche of nicheList.slice(0, 3)) {
    const query = NICHE_QUERIES[niche] || niche;
    let found = false;
    try {
      if (NEWS_KEY && NEWS_KEY !== "YOUR_NEWS_KEY_HERE") {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=2&language=en&apiKey=${NEWS_KEY}`;
        const r = await fetch(url);
        const data = await r.json();
        if (data.articles?.[0]) {
          notifications.push({
            niche,
            headline: data.articles[0].title,
            time: "Just now",
          });
          found = true;
        }
      }
    } catch(e) {}
    if (!found) {
      try {
        const rssUrl = NICHE_RSS[niche] || NICHE_RSS["default"];
        const feed = await parser.parseURL(rssUrl);
        if (feed.items?.[0]) {
          notifications.push({
            niche,
            headline: feed.items[0].title,
            time: "Just now",
          });
        }
      } catch(e) {}
    }
  }
  res.json({ notifications });
});

// ── SAVE POST ──────────────────────────────────────────────────────────────────
app.post("/api/save-post", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, headline, niche, platform, contentType, content, scheduledDate } = req.body;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { error } = await supabase
      .from("saved_posts")
      .insert({
        user_id: userData.user.id,
        headline,
        niche,
        platform,
        content_type: contentType,
        content,
        scheduled_date: scheduledDate || null,
      });
    if (error) throw error;
    res.json({ success: true, message: "Post saved to calendar!" });
  } catch(e) {
    console.error("Save post error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET SCHEDULE ──────────────────────────────────────────────────────────────
app.get("/api/schedule", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, year, month } = req.query;
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", userData.user.id)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });
    if (error) throw error;
    res.json({ posts: data || [] });
  } catch(e) {
    console.error("Schedule error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET ALL SAVED POSTS ──────────────────────────────────────────────────────
app.get("/api/saved-posts", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: "Token required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (e) {
    console.error("Saved posts error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE SAVED POST ────────────────────────────────────────────────────────
app.delete("/api/delete-post", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { token, postId } = req.query;
  if (!token || !postId) return res.status(400).json({ error: "Token and postId required" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data: post, error: fetchError } = await supabase
      .from("saved_posts")
      .select("user_id")
      .eq("id", postId)
      .single();
    if (fetchError || !post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== userData.user.id) return res.status(403).json({ error: "Not authorized" });
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("id", postId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error("Delete error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GOOGLE CALENDAR ROUTES ────────────────────────────────────────────────────
app.get("/api/google-auth-url", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent'
  });
  res.json({ url: authUrl });
});

app.get("/api/google-oauth-callback", async (req, res) => {
  const { code } = req.query;
  const { token } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (supabase && token) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData) {
        await supabase
          .from("user_tokens")
          .upsert({
            user_id: userData.user.id,
            google_access_token: tokens.access_token,
            google_refresh_token: tokens.refresh_token,
            google_token_expiry: new Date(Date.now() + tokens.expiry_date)
          });
      }
    }
    res.redirect(`${FRONTEND_URL}/?calendar=connected`);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/create-calendar-event", async (req, res) => {
  const { token, event } = req.body;
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) return res.status(401).json({ error: "Invalid token" });
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("google_access_token, google_refresh_token, google_token_expiry")
      .eq("user_id", userData.user.id)
      .single();
    if (tokenError || !tokenData) {
      return res.status(400).json({ error: "Google Calendar not connected. Please connect your account first." });
    }
    oauth2Client.setCredentials({
      access_token: tokenData.google_access_token,
      refresh_token: tokenData.google_refresh_token,
      expiry_date: tokenData.google_token_expiry
    });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const eventData = {
      summary: event.summary,
      description: event.description,
      start: { date: event.startDate, timeZone: 'UTC' },
      end: { date: event.endDate || event.startDate, timeZone: 'UTC' }
    };
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: eventData
    });
    res.json({ success: true, eventId: result.data.id, link: result.data.htmlLink });
  } catch (e) {
    console.error("Calendar error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CreatorPulse running on port ${PORT}`));
