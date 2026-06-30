require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const RSSParser = require("rss-parser");

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
  "Streetwear": "streetwear fashion Supreme Nike Jordan sneakers",
  "Luxury Fashion": "luxury fashion Gucci Louis Vuitton Chanel",
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
  "Productivity": "productivity time management focus work",
  "Study Tips": "study tips learning education student",
  "Philosophy": "philosophy life meaning ethics",
  "Psychology": "psychology behavior mind mental",
  "Yapping Videos": "viral opinion hot take controversy",
  "Hot Takes": "hot take opinion controversial debate",
  "Rants": "rant viral opinion social media",
  "Storytelling": "storytelling viral story true crime",
  "Political Commentary": "politics government policy news",
  "True Crime": "true crime murder mystery investigation",
  "Mystery & Unexplained": "mystery unexplained paranormal conspiracy",
  "Viral Dances": "viral dance TikTok trend challenge",
  "Trend Reaction": "viral trend reaction internet",
  "Challenge Content": "challenge viral social media trend",
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

// ── RSS FEEDS PER NICHE (fallback) ────────────────────────────────────────────
const NICHE_RSS = {
  "Football/Soccer": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "Basketball": "https://feeds.bbci.co.uk/sport/basketball/rss.xml",
  "Music (Afrobeats)": "https://rss.app/feeds/afrobeats.xml",
  "Crypto": "https://cointelegraph.com/rss",
  "AI & Tech News": "https://feeds.feedburner.com/TechCrunch",
  "Movies & TV": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
  "default": "https://feeds.bbci.co.uk/news/rss.xml",
};

// ── ROUTE: GET NEWS ───────────────────────────────────────────────────────────
app.get("/api/news", async (req, res) => {
  const { niche } = req.query;
  if (!niche) return res.status(400).json({ error: "niche required" });

  const query = NICHE_QUERIES[niche] || niche;

  try {
    // Try NewsAPI first
    if (NEWS_KEY && NEWS_KEY !== "YOUR_NEWS_KEY_HERE") {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=6&language=en&apiKey=${NEWS_KEY}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.articles && data.articles.length > 0) {
        const articles = data.articles.map((a, i) => ({
          id: `${niche.replace(/\s/g, "_")}_${i}`,
          niche,
          headline: a.title,
          summary: a.description || a.content?.slice(0, 200) || "",
          image: a.urlToImage || null,
          url: a.url,
          source: a.source?.name || "",
          score: Math.floor(Math.random() * 15) + 85,
          tags: extractTags(a.title, niche),
        }));
        return res.json({ articles });
      }
    }

    // Fallback: RSS
    const rssUrl = NICHE_RSS[niche] || NICHE_RSS["default"];
    const feed = await parser.parseURL(rssUrl);
    const articles = (feed.items || []).slice(0, 6).map((item, i) => ({
      id: `${niche.replace(/\s/g, "_")}_rss_${i}`,
      niche,
      headline: item.title,
      summary: item.contentSnippet || item.content?.slice(0, 200) || "",
      image: null,
      url: item.link,
      source: feed.title || "",
      score: Math.floor(Math.random() * 15) + 80,
      tags: extractTags(item.title, niche),
    }));
    return res.json({ articles });

  } catch (e) {
    console.error("News error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

function extractTags(title, niche) {
  const words = title.split(" ").filter(w => w.length > 4).slice(0, 3);
  return [niche.split("/")[0], ...words.slice(0, 2)];
}

// ── ROUTE: SPORTS PLAYER/TEAM IMAGE ──────────────────────────────────────────
app.get("/api/sports-image", async (req, res) => {
  const { query, type } = req.query; // type: player | team | league
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

// ── ROUTE: WIKIPEDIA IMAGE ────────────────────────────────────────────────────
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

// ── ROUTE: GENERATE TEXT (GROQ) ───────────────────────────────────────────────
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
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content || "";
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ROUTE: GENERATE IMAGE (HUGGING FACE) ─────────────────────────────────────
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await fetch(
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

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }

    const buffer = await r.buffer();
    const base64 = buffer.toString("base64");
    res.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ROUTE: NOTIFICATION CHECK ─────────────────────────────────────────────────
app.get("/api/notifications", async (req, res) => {
  // Returns latest breaking stories for notification bell
  const { niches } = req.query;
  const nicheList = niches ? niches.split(",") : [];
  const notifications = [];

  for (const niche of nicheList.slice(0, 3)) {
    const query = NICHE_QUERIES[niche] || niche;
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
        }
      }
    } catch (e) {}
  }

  res.json({ notifications });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CreatorPulse running on port ${PORT}`));
