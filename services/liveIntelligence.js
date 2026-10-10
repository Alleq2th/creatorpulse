// Multi-source live intelligence: verified facts, live news, image attribution.
// This is a curated source catalogue, not a claim that every website is queried.
const fetch = require("node-fetch");
const RSSParser = require("rss-parser");
const { searchRealPhotos } = require("./stockPhoto");

const parser = new RSSParser({ timeout: 5000, headers: { "User-Agent": "CreatorPulseBot/1.0" } });
const LIVE_SOURCES_CATALOG = [
  ...[
    ["ESPN", "https://www.espn.com", "sports"], ["BBC Sport", "https://www.bbc.com/sport", "sports"], ["Sky Sports", "https://www.skysports.com", "sports"],
    ["Bleacher Report", "https://bleacherreport.com", "sports"], ["Sports Illustrated", "https://www.si.com", "sports"], ["CBS Sports", "https://www.cbssports.com", "sports"],
    ["The Athletic", "https://theathletic.com", "sports"], ["NBA.com", "https://www.nba.com", "sports"], ["NFL.com", "https://www.nfl.com", "sports"],
    ["Formula 1", "https://www.formula1.com", "sports"], ["Autosport", "https://www.autosport.com", "sports"], ["Motorsport.com", "https://www.motorsport.com", "sports"],
    ["UFC", "https://www.ufc.com", "sports"], ["MMA Fighting", "https://www.mmafighting.com", "sports"], ["MLB.com", "https://www.mlb.com", "sports"], ["NHL.com", "https://www.nhl.com", "sports"],
    ["Wikipedia", "https://en.wikipedia.org", "reference"], ["Wikimedia Commons", "https://commons.wikimedia.org", "reference"], ["Britannica", "https://www.britannica.com", "reference"],
    ["Reuters", "https://www.reuters.com", "news"], ["Associated Press", "https://apnews.com", "news"], ["BBC News", "https://www.bbc.com/news", "news"], ["NPR", "https://www.npr.org", "news"], ["The Guardian", "https://www.theguardian.com", "news"],
    ["TechCrunch", "https://techcrunch.com", "technology"], ["The Verge", "https://www.theverge.com", "technology"], ["Wired", "https://www.wired.com", "technology"], ["Ars Technica", "https://arstechnica.com", "technology"], ["CNET", "https://www.cnet.com", "technology"],
    ["IGN", "https://www.ign.com", "gaming"], ["Polygon", "https://www.polygon.com", "gaming"], ["Eurogamer", "https://www.eurogamer.net", "gaming"], ["PC Gamer", "https://www.pcgamer.com", "gaming"],
    ["Bloomberg", "https://www.bloomberg.com", "finance"], ["CNBC", "https://www.cnbc.com", "finance"], ["MarketWatch", "https://www.marketwatch.com", "finance"], ["Financial Times", "https://www.ft.com", "finance"], ["Forbes", "https://www.forbes.com", "finance"],
    ["CoinDesk", "https://www.coindesk.com", "crypto"], ["Yahoo Finance", "https://finance.yahoo.com", "finance"], ["Investopedia", "https://www.investopedia.com", "finance"],
    ["Variety", "https://variety.com", "entertainment"], ["The Hollywood Reporter", "https://www.hollywoodreporter.com", "entertainment"], ["Deadline", "https://deadline.com", "entertainment"], ["Billboard", "https://www.billboard.com", "music"], ["Rolling Stone", "https://www.rollingstone.com", "music"], ["Complex", "https://www.complex.com", "culture"], ["Pitchfork", "https://pitchfork.com", "music"],
    ["Vogue", "https://www.vogue.com", "fashion"], ["GQ", "https://www.gq.com", "lifestyle"], ["Hypebeast", "https://hypebeast.com", "fashion"], ["Men's Health", "https://www.menshealth.com", "fitness"], ["Bon Appetit", "https://www.bonappetit.com", "food"],
    ["NASA", "https://www.nasa.gov", "science"], ["Space.com", "https://www.space.com", "science"], ["ScienceDaily", "https://www.sciencedaily.com", "science"], ["National Geographic", "https://www.nationalgeographic.com", "science"],
    ["Defense News", "https://www.defensenews.com", "military"], ["Military.com", "https://www.military.com", "military"], ["USNI News", "https://news.usni.org", "military"], ["Breaking Defense", "https://breakingdefense.com", "military"]
  ].map(([name, url, category]) => ({ name, url, category }))
];

const cache = new Map();
const TTL = 15 * 60 * 1000;
function cached(key) { const item = cache.get(key); if (!item) return null; if (Date.now() - item.ts > TTL) { cache.delete(key); return null; } return item.data; }
function store(key, data) { cache.set(key, { data, ts: Date.now() }); return data; }

async function fetchWikipediaKnowledge(topic) {
  if (!topic || typeof topic !== "string") return null;
  const clean = topic.trim();
  const key = `wiki:${clean.toLowerCase()}`;
  const hit = cached(key); if (hit) return hit;
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
    const res = await fetch(url, { headers: { "User-Agent": "CreatorPulse/1.0 (creator research)" }, timeout: 4500 });
    if (res.ok) {
      const d = await res.json();
      if (d.extract) return store(key, { title: d.title, extract: d.extract, description: d.description || "", imageUrl: d.originalimage?.source || d.thumbnail?.source || null, url: d.content_urls?.desktop?.page || url, source: `Wikipedia (${d.title})` });
    }
  } catch (e) { console.warn("[live-intel] Wikipedia:", e.message); }
  return null;
}

async function findLiveImage(query, niche = "") {
  if (!query || typeof query !== "string") return null;
  const clean = query.trim(); const key = `img:${clean.toLowerCase()}`;
  const hit = cached(key); if (hit) return hit;
  const wiki = await fetchWikipediaKnowledge(clean);
  if (wiki?.imageUrl && !/\.svg(?:\?|$)/i.test(wiki.imageUrl)) return store(key, { url: wiki.imageUrl, title: wiki.title, source: "Wikimedia Commons via Wikipedia", credit: `Image: Wikimedia Commons; article: ${wiki.title}`, attributionUrl: wiki.url, type: "wikipedia" });
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean + " filetype:bitmap")}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime|dimensions&format=json`;
    const res = await fetch(endpoint, { headers: { "User-Agent": "CreatorPulse/1.0 (creator research)" }, timeout: 4500 });
    if (res.ok) {
      const data = await res.json();
      for (const page of Object.values(data.query?.pages || {})) {
        const img = page.imageinfo?.[0];
        if (img && ["image/jpeg", "image/png", "image/webp"].includes(img.mime) && Math.max(img.width || 0, img.height || 0) >= 600) return store(key, { url: img.url, title: page.title.replace(/^File:/, ""), source: "Wikimedia Commons", credit: `Image: ${page.title.replace(/^File:/, "")} via Wikimedia Commons`, attributionUrl: page.fullurl || "https://commons.wikimedia.org", type: "wikimedia" });
      }
    }
  } catch (e) { console.warn("[live-intel] Commons:", e.message); }
  try {
    const photos = await searchRealPhotos(`${clean} ${niche}`.trim(), 1);
    if (photos?.[0]?.url) return store(key, { url: photos[0].url, title: clean, source: photos[0].source || "Stock photo", credit: photos[0].credit || "Photo provider attribution required", type: "stock" });
  } catch (_) {}
  return null;
}

async function fetchMultiSourceLiveData(query = "", niche = "") {
  const cleanQuery = String(query || "").trim();
  const key = `live:${cleanQuery.toLowerCase()}:${String(niche).toLowerCase()}`;
  const hit = cached(key); if (hit) return hit;
  const results = [];
  const topic = cleanQuery.replace(/\b(news|live|breaking|today|score|match|game|post|instagram|tiktok)\b/gi, "").trim() || cleanQuery || niche;
  const [wiki, news] = await Promise.all([
    fetchWikipediaKnowledge(topic),
    (async () => {
      try {
        const q = cleanQuery || `${niche || "trending"} news today`;
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        const feed = await parser.parseURL(url);
        return (feed.items || []).slice(0, 8).map(item => ({ title: item.title, source: item.creator || item.source || "Google News result", pubDate: item.pubDate || null, snippet: item.contentSnippet || item.content || item.title, url: item.link }));
      } catch (e) { console.warn("[live-intel] News search:", e.message); return []; }
    })()
  ]);
  if (wiki?.extract) results.push({ title: `${wiki.title}: background`, source: wiki.source, snippet: wiki.extract.slice(0, 500), url: wiki.url, imageUrl: wiki.imageUrl, verifiedBackground: true });
  results.push(...news);
  return store(key, { items: results.slice(0, 9), sourcesCount: new Set(results.map(x => x.source)).size, catalogCount: LIVE_SOURCES_CATALOG.length, sources: [...new Set(results.map(x => x.source))] });
}

module.exports = { LIVE_SOURCES_CATALOG, fetchWikipediaKnowledge, findLiveImage, fetchMultiSourceLiveData };
