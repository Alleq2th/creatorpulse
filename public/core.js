// ─── ICONS (Lucide-style inline SVGs) ───────────────────────────────────────
const I = {
  image: '<svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  refresh: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M21 4v5h-5"/></svg>',
  bell: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  home: '<svg class="icon" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  cal: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  save: '<svg class="icon" viewBox="0 0 24 24"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  user: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  coach: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>',
  chevron: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  back: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  copy: '<svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  dl: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  bolt: '<svg class="icon icon-sm" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  news: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/></svg>',
  plus: '<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  hook: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 4v10a4 4 0 1 0 8 0"/><circle cx="9" cy="4" r="1.5"/></svg>',
  remix: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M4 4h16v6H4z"/><path d="M4 14h16v6H4z"/><path d="M8 10v4M16 10v4"/></svg>',
  title: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
  sparkle: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L20 10l-6.1 1.4L12 17l-1.9-5.6L4 10l6.1-1.4z"/></svg>',
  create: '<svg class="icon" viewBox="0 0 24 24"><path d="m23 7-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  mic: '<svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>',
  cam: '<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="13" r="4"/><path d="M3 7h4l2-3h6l2 3h4v13H3z"/></svg>',
  stop: '<svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  link: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  upload: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
};

// ─── DATA ───────────────────────────────────────────────────────────────────
const NICHES = {"Sports":["Football/Soccer","Basketball","Tennis","Cricket","Formula 1","Boxing","MMA/UFC","WWE Wrestling","American Football","Baseball","Ice Hockey","Golf","Rugby","Athletics/Track","Cycling","Swimming","Esports","Volleyball"],"Entertainment":["Celebrity Gossip","Music (Afrobeats)","Music (Hip-Hop)","Music (Pop)","Music (R&B)","Music (K-Pop)","Music (Amapiano)","Movies & TV","Anime","Korean Drama","Bollywood","Pop Culture"],"Gaming":["Console Gaming","PC Gaming","Mobile Gaming","Game Reviews","Twitch Streaming","YouTube Gaming"],"Lifestyle":["Travel","Food & Recipes","Fitness & Gym","Mental Health","Relationships & Dating","Parenting","Minimalism","Home Decor","Pets"],"Fashion & Beauty":["Streetwear","Luxury Fashion","Skincare","Makeup","Haircare"],"Finance":["Personal Finance","Crypto","Stock Market","Side Hustles","Business News","Real Estate Investing","Budgeting"],"Tech":["AI & Tech News","Gadget Reviews","Coding & Dev Life","Startups","Cybersecurity","Space & Science"],"Education":["Science","History","Language Learning","Productivity","Study Tips","Philosophy","Psychology"],"Commentary":["Yapping Videos","Hot Takes","Rants","Storytelling","Political Commentary","True Crime","Mystery & Unexplained"],"Trends":["Viral Dances","Trend Reaction","Challenge Content"],"Creator":["YouTube Growth","Social Media Tips","Brand Deals","Monetization Advice"],"Professional":["Medicine & Health","Law","Marketing","Entrepreneurship","Motivational Speaking"],"Culture":["Faith & Religion","African Culture","Caribbean Culture","Astrology","Self-Development"]};
const PLATS = [{id:"tiktok",label:"TikTok"},{id:"instagram",label:"Instagram"},{id:"youtube",label:"YouTube"},{id:"twitter",label:"X"},{id:"facebook",label:"Facebook"},{id:"linkedin",label:"LinkedIn"}];
const PTYPES = {tiktok:["TikTok Script","TikTok No-Face Graphic","Caption + Hashtags"],instagram:["IG Reel Script","IG Carousel","Caption + Hashtags"],youtube:["Long Form Script","YouTube Short Script","Title + Description","Thumbnail"],twitter:["Hot Take Tweet","Engagement Tweet","Thread (5 tweets)"],facebook:["Long-Form Post","Engagement Post"],linkedin:["Thought Leadership","Professional Update"]};
const TONES = [{id:"normal",label:"Neutral"},{id:"funny",label:"Banter"},{id:"educative",label:"Educative"},{id:"hype",label:"Hot Take"},{id:"storytelling",label:"Storytelling"}];
// Gradient palette options exposed to the user — must match the PALETTE keys
// in services/statCard.js.
const PALETTES = [
  {id:"noir_orange", label:"Noir Orange"}, {id:"electric_blue", label:"Electric Blue"}, {id:"emerald", label:"Emerald"},
  {id:"violet", label:"Violet"}, {id:"crimson", label:"Crimson"}, {id:"gold", label:"Gold"},
  {id:"hot_pink", label:"Hot Pink"}, {id:"sky_blue", label:"Sky Blue"}, {id:"deep_teal", label:"Deep Teal"},
  {id:"royal_indigo", label:"Royal Indigo"}, {id:"sunset_coral", label:"Sunset Coral"}, {id:"white_platinum", label:"White Platinum"}
];
// Maps a niche to one of the original icon glyphs in services/statCard.js.
// Anything not listed falls back to the generic icon — this only changes
// which small badge icon shows in the card header, never real brand marks.
const NICHE_ICON_SLUG = {"Football/Soccer": "football", "American Football": "football", "Basketball": "basketball", "Boxing": "combat_sports", "MMA/UFC": "combat_sports", "WWE Wrestling": "combat_sports", "Tennis": "tennis", "Cricket": "cricket", "Formula 1": "formula_1", "Baseball": "baseball", "Ice Hockey": "ice_hockey", "Golf": "golf", "Rugby": "rugby", "Athletics/Track": "athletics", "Cycling": "athletics", "Swimming": "athletics", "Volleyball": "athletics", "Esports": "esports", "Console Gaming": "gaming", "PC Gaming": "gaming", "Mobile Gaming": "gaming", "Game Reviews": "gaming", "Twitch Streaming": "gaming", "YouTube Gaming": "gaming", "Movies & TV": "entertainment", "Korean Drama": "entertainment", "Bollywood": "entertainment", "Pop Culture": "entertainment", "Anime": "anime", "Celebrity Gossip": "celebrity", "Music (Afrobeats)": "music", "Music (Hip-Hop)": "music", "Music (Pop)": "music", "Music (R&B)": "music", "Music (K-Pop)": "music", "Music (Amapiano)": "music", "Travel": "travel", "Food & Recipes": "food", "Fitness & Gym": "fitness", "Mental Health": "lifestyle", "Relationships & Dating": "lifestyle", "Parenting": "lifestyle", "Minimalism": "lifestyle", "Home Decor": "lifestyle", "Pets": "lifestyle", "Self-Development": "lifestyle", "Streetwear": "fashion", "Luxury Fashion": "fashion", "Skincare": "beauty", "Makeup": "beauty", "Haircare": "beauty", "Personal Finance": "finance", "Crypto": "finance", "Stock Market": "finance", "Side Hustles": "finance", "Business News": "finance", "Real Estate Investing": "finance", "Budgeting": "finance", "AI & Tech News": "tech", "Gadget Reviews": "tech", "Coding & Dev Life": "tech", "Startups": "tech", "Cybersecurity": "tech", "Space & Science": "science", "Science": "science", "History": "science", "Language Learning": "education", "Productivity": "education", "Study Tips": "education", "Philosophy": "education", "Psychology": "education", "Yapping Videos": "commentary", "Hot Takes": "commentary", "Rants": "commentary", "Storytelling": "commentary", "Political Commentary": "commentary", "True Crime": "commentary", "Mystery & Unexplained": "commentary", "Viral Dances": "trends", "Trend Reaction": "trends", "Challenge Content": "trends", "YouTube Growth": "creator", "Social Media Tips": "creator", "Brand Deals": "creator", "Monetization Advice": "creator", "Medicine & Health": "professional", "Law": "professional", "Marketing": "professional", "Entrepreneurship": "professional", "Motivational Speaking": "professional", "Faith & Religion": "culture", "African Culture": "culture", "Caribbean Culture": "culture", "Astrology": "culture"};
function nicheToCategory(niche){ return { name: niche || "", slug: NICHE_ICON_SLUG[niche] || "default" }; }
// Auto-generated CTA outro slide — the story arc always ends on a call to
// action, not just wherever the AI's last body slide happened to stop.
const CTA_TEMPLATES = [
  {headline:"FOLLOW FOR DAILY [NICHE] UPDATES", supportingText:"New stories every day.", emphasisLine:1},
  {headline:"MORE CONTEXT. MORE STORIES.\nFOLLOW.", supportingText:"", emphasisLine:1},
  {headline:"FOLLOW FOR MORE [NICHE] STORIES", supportingText:"You don't want to miss the next one.", emphasisLine:1},
  {headline:"STAY AHEAD. FOLLOW FOR MORE.", supportingText:"You'll want it when this plays out.", emphasisLine:0}
];
function ctaOutroSlide(niche){
  const tpl = CTA_TEMPLATES[Math.floor(Math.random()*CTA_TEMPLATES.length)];
  return { type:"outro", headline: tpl.headline.replace("[NICHE]", (niche||"this").toUpperCase()), supportingText: tpl.supportingText, emphasisLine: tpl.emphasisLine };
}
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const M_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["S","M","T","W","T","F","S"];
const NICHE_HANDLES = {"American Football": ["AdamSchefter", "RapSheet", "MikeGarafolo", "TomPelissero", "FieldYates", "NFL", "ESPNNFL", "NFLNetwork"], "Football/Soccer": ["FabrizioRomano", "ESPNFC", "SkySportsPL", "BBCSport", "GoalNews", "TheAthleticFC", "TouchlineX", "TMuk_news"], "Basketball": ["ShamsCharania", "WojESPN", "NBA", "ESPNNBA", "TheAthleticNBA", "BleacherReport"], "Baseball": ["MLB", "Ken_Rosenthal", "JeffPassan", "MLBNetwork", "TheAthleticMLB"], "Ice Hockey": ["NHL", "TSNBobMcKenzie", "FriedgeHNIC", "NHLNetwork", "SportsCenter"], "Tennis": ["TennisChannel", "atptour", "WTA", "TennisTV", "Eurosport"], "Cricket": ["ESPNcricinfo", "ICC", "BCCI", "cricbuzz", "BBCCricket"], "Formula 1": ["F1", "SkySportsF1", "ScuderiaFerrari", "McLarenF1", "MercedesAMGF1"], "Boxing": ["BoxingScene", "DAZNBoxing", "MikeCoppinger", "MatchroomBoxing", "SecondsOut"], "MMA/UFC": ["ufc", "espnmma", "arielhelwani", "MMAFighting", "MMAJunkie"], "WWE Wrestling": ["WWE", "FightfulSelect", "WrestleVotes", "WrestlingInc", "PWInsidercom"], "Golf": ["PGATOUR", "GolfChannel", "McIlroyRory", "GolfDigest", "EuropeanTour"], "Rugby": ["WorldRugby", "SixNationsRugby", "planetrugby", "rugbyworldcup"], "Esports": ["esportscom", "DotEsports", "DBLTAP", "ESLGaming", "LiquipediaNet"], "Movies & TV": ["DEADLINE", "Variety", "THR", "FilmUpdates", "IndieWire"], "Anime": ["AnimeNewsNet", "Crunchyroll", "AnimeCornerNews", "IGNAnime"], "Celebrity Gossip": ["PopCrave", "PopBase", "TMZ", "EOnline"], "Pop Culture": ["PopCrave", "PopBase", "BuzzFeed"], "Music (Hip-Hop)": ["ComplexMusic", "HipHopDX", "XXL", "rapalert6"], "Music (Afrobeats)": ["afrobeatsnews", "notjustok", "PulseNigeria247", "Naijaloaded"], "Music (Pop)": ["PopCrave", "billboard", "RollingStone"], "Music (K-Pop)": ["allkpop", "soompi", "koreaboo"], "Console Gaming": ["IGN", "GameSpot", "Wario64", "PlayStation", "Xbox"], "PC Gaming": ["PCGamer", "Wario64", "IGN"], "AI & Tech News": ["TechCrunch", "WIRED", "TheVerge", "OpenAI", "AndrewYNg"], "Gadget Reviews": ["engadget", "MKBHD", "TheVerge", "Gizmodo"], "Cybersecurity": ["briankrebs", "TheHackersNews", "Google_Bugs"], "Space & Science": ["NASA", "SpaceX", "NatGeo", "ESA"], "Crypto": ["CoinDesk", "Cointelegraph", "WatcherGuru", "TheBlock__"], "Stock Market": ["CNBC", "MarketWatch", "YahooFinance"], "Business News": ["Bloomberg", "ReutersBiz", "FT", "CNBC"], "Travel": ["TravelLeisure", "CNTraveler", "LonelyPlanet"], "Food & Recipes": ["NYTFood", "bonappetit", "foodandwine"], "Fitness & Gym": ["MensHealthMag", "WomensHealthMag", "MuscleAndFitness"], "Streetwear": ["Hypebeast", "complex", "Highsnobiety"], "Luxury Fashion": ["Vogue", "GQMagazine", "BoF"], "True Crime": ["oxygen", "IDNetwork"], "Political Commentary": ["politico", "axios", "thehill"], "Entrepreneurship": ["Inc", "Entrepreneur", "ForbesEntre"], "default": ["BreakingNews", "Reuters", "AP"]};

const API = window.location.origin;
const SYS = "You are CreatorPulse AI, a scriptwriter for social media creators. Write in plain spoken language exactly as a person would say it on camera. Never use markdown: no headers, no bold, no bullets, no --- rules, no JSON unless asked. Never label or separate sections with bracketed tags like [HOOK] or [CTA] — a script is one continuous flow of speech, not labeled parts stitched together; the hook is simply how it opens, not a section of its own. Write full sentences in natural paragraphs the way someone actually talks. Be specific, punchy, and direct. No meta-commentary, no preamble. Output the spoken words themselves, ready for a teleprompter.";

// ─── STATE ──────────────────────────────────────────────────────────────────
const S = {
  mode: "boot", // boot | auth | onboard | app
  authTab: "login", // login | signup | forgot
  authForm: { email:"", password:"", name:"" },
  authErr: "", authMsg: "", authLoading: false, token: null, refreshToken: null, user: null,
  // Password recovery. Filled in from the Supabase recovery link that lands on
  // the app as #access_token=…&refresh_token=…&type=recovery. Held in state
  // rather than read from the URL at submit time, because the hash is scrubbed
  // from the address bar as soon as it has been parsed.
  recovery: { active:false, accessToken:"", refreshToken:"", error:"", done:false, loading:false, form:{ password:"", confirm:"" } },
  onboard: { step:0, name:"", niches:[], platforms:[], primary:"", ppd:3 },
  tab: "home",
  trends: [], notifs: [], schedule: [], saved: [], eventsCache: {},
  loading: {}, expanded: {}, plat: {}, ctype: {}, tone: {}, palette: {}, slideCount: {}, outs: {}, recs: {},
  cal: { y: new Date().getFullYear(), m: new Date().getMonth() },
  calView: "agenda", // agenda | week | month — agenda is the default per rebuild
  agendaSchedule: [], // rolling multi-month schedule fetch, separate from the month-scoped one Month view uses
  scheduleSheetOpen: false,
  // Optimistically-added items not yet confirmed by a real server fetch.
  // Kept separate from S.schedule/S.agendaSchedule entirely, and merged in
  // at render time for every view — this is what makes a newly-scheduled
  // item survive a failed or slow background refresh in Month, Week, AND
  // Agenda at once, instead of needing the same fix three separate times
  // in three separate places.
  pendingSchedule: [],
  coachHandle: "", coachPlatform: "instagram", coachMetrics: "", coachAnswer: "", coachLoading: false,
  addSched: { title:"", weekday:"friday", time:"20:00", notes:"" },
  quickAdd: null, // { date: "YYYY-MM-DD", title: "" } — set when a specific calendar day is tapped
  hooksNiche: null, hooksSearch: "", hooksCache: {}, uqCheck: { text:"", loading:false, result:null },
  sheet: null, remixCache: {}, titleCache: {},
  digest: null, digestDismissed: false,
  inspiration: [],
  errors: {} // inline error-boundary messages, keyed by section
};

function saveSession(){ localStorage.setItem("cp_v2", JSON.stringify({ token:S.token, refreshToken:S.refreshToken, user:S.user, connections:S.connections||{} })); }
function restoreSession(){ try{ const j = localStorage.getItem("cp_v2"); if(j){ const {token,refreshToken,user,connections} = JSON.parse(j); if(token && user){ S.token=token; S.refreshToken=refreshToken||null; S.user=user; S.connections=connections||{}; return true; }} }catch(e){} return false; }
function clearSession(){ localStorage.removeItem("cp_v2"); S.token=null; S.refreshToken=null; S.user=null; S.connections={}; }

// ─── PERSISTENT CACHE (additive, survives reload) ──────────────────────────
const CACHE_KEY = "cp_cache_v1";
const CACHE_FIELDS = ["hooksCache","remixCache","titleCache","eventsCache"];
const CACHE_MAX = 20;
function capCache(obj){
  if(!obj || typeof obj !== "object") return {};
  const keys = Object.keys(obj);
  if(keys.length <= CACHE_MAX) return obj;
  // drop oldest (insertion order) until within cap
  keys.slice(0, keys.length - CACHE_MAX).forEach(k => { delete obj[k]; });
  return obj;
}
function saveCaches(){
  try {
    const payload = {};
    CACHE_FIELDS.forEach(f => { payload[f] = capCache(S[f] || {}); });
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch(e){ /* quota or private mode — cache is best-effort */ }
}
function restoreCaches(){
  try {
    const j = localStorage.getItem(CACHE_KEY);
    if(!j) return false;
    const data = JSON.parse(j) || {};
    CACHE_FIELDS.forEach(f => { if(data[f] && typeof data[f] === "object") S[f] = capCache(data[f]); });
    return true;
  } catch(e){ return false; }
}
// Write-through helper: cacheSet("hooksCache", niche, value)
function cacheSet(field, key, value){
  if(!S[field]) S[field] = {};
  delete S[field][key];          // re-insert so it counts as newest
  S[field][key] = value;
  capCache(S[field]);
  saveCaches();
  return value;
}
window.saveCaches = saveCaches;
window.cacheSet = cacheSet;
// Hydrate immediately at load — before any fetch runs.
restoreCaches();

// pendingSchedule was purely in-memory — closing the app before the
// background sync had confirmed a newly-added item into the real,
// persistent schedule data meant that item's only copy simply vanished on
// reload, even though the actual save to the server may well have
// succeeded. This makes the pending copy itself survive an app close,
// same as everything else that's meant to persist.
const PENDING_KEY = "cp_pending_schedule";
function savePendingSchedule(){ try { localStorage.setItem(PENDING_KEY, JSON.stringify(S.pendingSchedule||[])); } catch(e){} }
function restorePendingSchedule(){ try { const j = localStorage.getItem(PENDING_KEY); if(j) S.pendingSchedule = JSON.parse(j) || []; } catch(e){} }
restorePendingSchedule();

// A real "this never happens again" fix needs more than surviving a quick
// app close — it needs the actual save to keep trying until it genuinely
// succeeds, even if that takes multiple attempts across multiple app
// sessions. This is a small persisted outbox: any save that fails outright
// (not just slow) gets queued here instead of just showing an error and
// being abandoned. It's retried periodically while the app is open, and
// flushed again at boot — so a save that failed today because the server
// was down for a minute will simply succeed on its own once things
// recover, with no action needed from the user. Safe to retry repeatedly
// because the server-side endpoint now recognizes and ignores duplicates
// of the exact same save.
const OUTBOX_KEY = "cp_save_outbox";
function saveOutboxState(){ try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(S.outbox||[])); } catch(e){} }
function restoreOutboxState(){ try { const j = localStorage.getItem(OUTBOX_KEY); if(j) S.outbox = JSON.parse(j) || []; } catch(e){} }
restoreOutboxState();
async function flushOutbox(){
  if(!S.token || !S.outbox || !S.outbox.length) return;
  const remaining = [];
  for(const item of S.outbox){
    try {
      const r = await api(item.endpoint, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item.payload)});
      if(!r.success){ item.attempts = (item.attempts||0) + 1; remaining.push(item); }
      // success — simply don't re-queue it, this one's genuinely done
    } catch(e){
      item.attempts = (item.attempts||0) + 1;
      remaining.push(item);
    }
  }
  const anyResolved = remaining.length < S.outbox.length;
  S.outbox = remaining;
  saveOutboxState();
  if(anyResolved){ loadSchedule(); loadAgendaSchedule(); render(); }
}
setInterval(flushOutbox, 30000);

function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2400); }
function esc(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
window.imgFail = function(el){ try { const ph = document.createElement('div'); ph.className = 'timg-ph'; ph.innerHTML = I.news; if(el && el.parentNode) el.parentNode.replaceChild(ph, el); else if(el) el.remove(); } catch(e){ if(el) el.remove(); } };

// Niche category color map — every niche picks a color from its category
const NC_CATEGORY_COLOR = {
  "Sports":"#F97316","Entertainment":"#EC4899","Gaming":"#8B5CF6","Lifestyle":"#10B981",
  "Fashion & Beauty":"#F43F5E","Finance":"#22C55E","Tech":"#3B82F6","Education":"#EAB308",
  "Commentary":"#EF4444","Trends":"#06B6D4","Creator":"#A855F7","Professional":"#0EA5E9","Culture":"#F59E0B"
};
const NC = (function(){ const m = {}; Object.entries(NICHES).forEach(([cat, arr]) => arr.forEach(n => m[n] = NC_CATEGORY_COLOR[cat] || "#7C3AED")); return m; })();

// Platform emoji lookup
const PLAT_EMOJI = { tiktok:"🎵", instagram:"📸", youtube:"▶️", twitter:"🐦", facebook:"👥", linkedin:"💼" };


// ─── SKELETONS · TOOLTIPS · INLINE ERROR CARDS (additive UI layer) ─────────
(function injectUxStyles(){
  if(typeof document === "undefined" || document.getElementById("cp-ux-styles")) return;
  const st = document.createElement("style");
  st.id = "cp-ux-styles";
  st.textContent = `
  @keyframes cp-shimmer { 0%{background-position:-320px 0} 100%{background-position:320px 0} }
  @keyframes cp-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  .sk { background:#2a2a30; background-image:linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,.35) 50%,rgba(255,255,255,0) 100%);
        background-repeat:no-repeat; background-size:320px 100%;
        animation:cp-shimmer 1.2s infinite linear, cp-pulse 1.6s ease-in-out infinite; border-radius:6px; }
  .sk-line { height:11px; margin:7px 0; }
  .sk-line.w90{width:90%} .sk-line.w70{width:70%} .sk-line.w50{width:50%} .sk-line.w35{width:35%}
  .sk-img { width:64px; height:64px; border-radius:8px; flex:0 0 auto; }
  .sk-trend { display:flex; gap:12px; padding:14px 0; border-bottom:1px solid var(--br,#e5e5e5); }
  .sk-trend .sk-body { flex:1; min-width:0; }
  .sk-hook { display:flex; gap:10px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--br,#e5e5e5); }
  .sk-hook .sk-num { width:22px; height:22px; border-radius:50%; flex:0 0 auto; }
  .sk-row { padding:10px 0; }
  .sk-block { height:74px; border-radius:10px; margin:10px 0; }
  .err-card { border:1px solid var(--err-br,#e6bcbc); background:var(--err-bg,#fff6f6); color:var(--err-tx,#a3423c);
              border-radius:10px; padding:12px 14px; margin:10px 0; font-size:12.5px; line-height:1.5;
              display:flex; gap:10px; align-items:center; justify-content:space-between; }
  .err-card .err-retry { border:1px solid currentColor; background:transparent; color:inherit; border-radius:7px;
              padding:5px 10px; font-size:11px; font-weight:700; cursor:pointer; flex:0 0 auto; }
  img.brand-mark { background:none; object-fit:cover; }
  .uq-result { margin-top:12px; padding:10px 12px; border-radius:8px; font-size:12.5px; line-height:1.5; }
  .uq-unique { background:rgba(86,117,75,.15); color:#6fa062; }
  .uq-some_overlap { background:rgba(214,158,46,.15); color:#d69e2e; }
  .uq-too_similar { background:rgba(220,68,68,.15); color:#e05c5c; }
  .cal-cell.has { aspect-ratio:unset; min-height:52px; padding-bottom:4px; }
  .cal-daynum { line-height:1; }
  .cal-tag { margin-top:3px; font-size:8px; line-height:1.15; font-weight:700; padding:2px 3px; border-radius:3px;
             max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cal-tag-event { background:rgba(168,69,44,.16); color:#c85a37; } /* niche event — brick accent */
  .cal-tag-post { background:rgba(86,117,75,.18); color:#6fa062; } /* user-added — forest accent */
  .cal-cell.today .cal-tag-event { background:rgba(255,255,255,.22); color:#fff; }
  .cal-cell.today .cal-tag-post { background:rgba(255,255,255,.22); color:#fff; }
  .tipbtn { position:relative; }
  .tipbtn::after { content:attr(data-tip); position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%) translateY(3px);
              background:#111; color:#fff; font-size:10.5px; font-weight:600; white-space:nowrap; padding:4px 7px; border-radius:6px;
              opacity:0; pointer-events:none; transition:opacity .15s, transform .15s; z-index:60; }
  .tipbtn:hover::after, .tipbtn:focus-visible::after, .tipbtn.tip-hold::after { opacity:1; transform:translateX(-50%) translateY(0); }`;
  document.head.appendChild(st);
})();

// Long-press support for tooltips on touch devices
if(typeof document !== "undefined"){
  let _tipTimer = null, _tipEl = null;
  document.addEventListener("touchstart", (e)=>{
    const el = e.target.closest?.(".tipbtn"); if(!el) return;
    _tipTimer = setTimeout(()=>{ _tipEl = el; el.classList.add("tip-hold"); }, 400);
  }, { passive:true });
  const clearTip = () => { clearTimeout(_tipTimer); if(_tipEl){ _tipEl.classList.remove("tip-hold"); _tipEl = null; } };
  document.addEventListener("touchend", clearTip, { passive:true });
  document.addEventListener("touchmove", clearTip, { passive:true });
}

function skLine(w){ return `<div class="sk sk-line ${w||""}"></div>`; }
function skTrendCard(){ return `<div class="sk-trend"><div class="sk sk-img"></div><div class="sk-body">${skLine("w35")}${skLine("w90")}${skLine("w50")}</div></div>`; }
function skTrendList(n){ return `<div class="tlist" aria-busy="true">${Array.from({length:n||5}).map(skTrendCard).join("")}</div>`; }
function skHookList(n){ return `<div aria-busy="true">${Array.from({length:n||6}).map(()=>`<div class="sk-hook"><div class="sk sk-num"></div><div style="flex:1">${skLine("w90")}${skLine("w50")}</div></div>`).join("")}</div>`; }
function skTextBlock(n){ return `<div aria-busy="true" style="padding:4px 0">${Array.from({length:n||3}).map(()=>`<div class="sk-row">${skLine("w35")}${skLine("w90")}${skLine("w70")}</div>`).join("")}</div>`; }
function skDraftBlock(){ return `<div aria-busy="true">${skLine("w35")}<div class="sk sk-block"></div><div class="sk sk-block"></div></div>`; }

// Inline error card — replaces alert()/toast for failed section actions
function errCard(msg, retryFn, key){
  return `<div class="err-card" role="alert"><span>${esc(msg || "Something went wrong — try again.")}</span>${
    retryFn ? `<button class="err-retry" onclick="${esc(retryFn)}">Try again</button>` : ""
  }${key ? `<button class="err-retry" onclick="clearErr('${esc(key)}')">Dismiss</button>` : ""}</div>`;
}
function sectionErr(key, retryFn){
  const msg = S.errors && S.errors[key];
  return msg ? errCard(msg, retryFn, key) : "";
}
window.setErr = (key, msg) => { S.errors[key] = msg || "Something went wrong — try again."; render(); };
window.clearErr = (key) => { delete S.errors[key]; render(); };

function extractJSON(txt){ const m = String(txt).match(/\{[\s\S]*\}|\[[\s\S]*\]/); if(!m) return null; try{ return JSON.parse(m[0]); }catch(e){ return null; } }

function asArray(parsed) {
  // Defensive against a real failure mode: when we ask an LLM for "an array
  // of exactly 1 item" it will often just hand back the bare object instead
  // of wrapping it in [...] — extractJSON then returns a plain object, and
  // calling .map on it crashes generation entirely. Normalize here once
  // instead of trusting every call site to guard against it.
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
}

// ─── API ────────────────────────────────────────────────────────────────────
async function generateCardsWithRetry(payload) {
  // The concurrency limiter returns a 503 ("busy") when 3 generations are
  // already running server-wide — that's a deliberate, short-lived state,
  // not a real failure. One retry after a short pause clears most of these
  // automatically instead of showing the user an error for something that
  // resolves itself in a couple seconds.
  for (let attempt = 0; attempt < 2; attempt++) {
    const cd = await api("/api/generate-cards", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if (!cd.error) return cd;
    if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
    else throw new Error(cd.error);
  }
}

async function api(path, opts, _isRetry){
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000); // 60s — covers Render free-tier cold start
  try {
    const r = await fetch(API+path, { ...opts, signal: ctl.signal });
    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch(e){ throw new Error(`Server returned an unexpected response (status ${r.status}). This usually means the endpoint isn't available or the server is still starting up.`); }
    if(!r.ok && !data.error) data.error = data.message || `Request failed (status ${r.status})`;
    // Access token expired mid-session — silently refresh once and retry the
    // same request, instead of surfacing "Invalid token" to the user.
    if(r.status === 401 && !_isRetry && S.refreshToken && !path.startsWith('/api/auth/')){
      const refreshed = await tryRefreshToken();
      if(refreshed){
        const retryOpts = opts?.body ? { ...opts, body: opts.body.replace(/"token":"[^"]*"/, `"token":"${S.token}"`) } : opts;
        return api(path, retryOpts, true);
      }
    }
    return data;
  } catch(e){
    if(e.name === "AbortError") throw new Error("Request timed out — the server may be waking up from sleep. Try again in a moment.");
    throw e;
  } finally { clearTimeout(timer); }
}
async function tryRefreshToken(){
  if(!S.refreshToken) return false;
  try {
    const r = await fetch(API+'/api/auth/refresh', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: S.refreshToken }) });
    const d = await r.json();
    if(d.token){ S.token = d.token; S.refreshToken = d.refreshToken || S.refreshToken; saveSession(); return true; }
  } catch(e){}
  clearSession(); S.mode = 'auth'; render();
  return false;
}
async function fetchNews(niche){ return (await api(`/api/news?niche=${encodeURIComponent(niche)}&_=${Date.now()}`)).articles||[]; }
async function fetchBlogs(niche){ return (await api(`/api/blog-feed?niche=${encodeURIComponent(niche)}&_=${Date.now()}`)).articles||[]; }
async function fetchTwitter(handle,niche){ return (await api(`/api/twitter-feed?handle=${handle}&niche=${encodeURIComponent(niche||"")}&_=${Date.now()}`)).articles||[]; }
async function fetchEvents(niche){ return (await api(`/api/events?niche=${encodeURIComponent(niche)}&_=${Date.now()}`)).events||[]; }
async function generateText(system, user, tone){ const d = await api(`/api/generate`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system,user,tone})}); if(d.error) throw new Error(d.error); return d.text||""; }
async function generateImage(prompt, format, count){ const d = await api(`/api/generate-image`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,format,count:count||1})}); return count && count>1 ? (d.images||[]) : (d.image||null); }
// A raw headline sentence is NOT a usable image prompt — diffusion models have
// no concrete subject to render from "Riot Games has confirmed development
// will cease" and end up hallucinating unrelated dark/dramatic art instead.
// This turns the headline into an actual visual scene description first.
async function sceneForHeadline(headline, niche){
  try {
    const raw = await generateText(
      "You describe ONE concrete photographable scene in under 25 words. No captions, no text-in-image, no abstract concepts, no quotes — just what a camera would physically see: a real setting, a real subject, an action. Return ONLY the scene description, nothing else.",
      `Niche: ${niche}. Story: "${headline}". What's a real photograph that would visually represent this story?`
    );
    return raw.trim().replace(/^["']|["']$/g,'') || `${niche} news`;
  } catch(e){ return `${niche} news scene`; }
}
// Map platform + format label → aspect ratio hint for image gen
function aspectForContent(platform, contentType){
  const ct = (contentType||"").toLowerCase();
  if(ct.includes("thumbnail")) return "youtube"; // 16:9
  if(ct.includes("carousel")) return "carousel"; // 4:5
  if(ct.includes("reel") || ct.includes("short") || ct.includes("tiktok") || ct.includes("story")) return "reel"; // 9:16
  if(platform==="tiktok") return "reel";
  if(platform==="youtube") return "youtube";
  return "square";
}
async function fetchNotifs(niches){ return (await api(`/api/notifications?niches=${encodeURIComponent(niches.join(","))}&_=${Date.now()}`)).notifications||[]; }

// ─── AUTH ───────────────────────────────────────────────────────────────────
async function doLogin(){
  S.authLoading = true; S.authErr=""; S.authMsg=""; render();
  try {
    const d = await api("/api/auth/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(S.authForm)});
    if(d.error){ S.authErr = d.error; }
    else {
      S.token = d.token; S.refreshToken = d.refreshToken || null; S.user = d.user; saveSession();
      if(!S.user.niches?.length){ S.mode="onboard"; S.onboard.name = S.user.name; }
      else { S.mode="app"; bootApp(); }
    }
  } catch(e){ S.authErr = e.message; }
  S.authLoading=false; render();
}
async function doSignup(){
  S.authLoading = true; S.authErr=""; S.authMsg=""; render();
  try {
    const d = await api("/api/auth/signup", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      email: S.authForm.email, password: S.authForm.password, name: S.authForm.name,
      niches: [], platforms: [], primaryPlatform: "", postsPerDay: 3
    })});
    if(d.error){ S.authErr = d.error; }
    else {
      // Email confirmation is required before login — don't attempt auto-login.
      S.authMsg = d.message || "Account created. Check your email to confirm your account before signing in.";
      S.authTab = "login";
      S.authForm.password = "";
    }
  } catch(e){ S.authErr = e.message; }
  S.authLoading=false; render();
}
async function saveOnboarding(){
  const ob = S.onboard;
  const payload = { token: S.token, name: ob.name, niches: ob.niches, platforms: ob.platforms, primaryPlatform: ob.primary || ob.platforms[0], postsPerDay: ob.ppd };
  const d = await api("/api/auth/update-profile", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(d.error){ toast(d.error); return; }
  S.user = { ...S.user, ...payload };
  delete S.user.token;
  saveSession();
  S.mode = "app";
  bootApp();
}

// ─── APP ────────────────────────────────────────────────────────────────────
async function loadAgendaSchedule(){
  // Agenda is meant to be the primary view, so it can't awkwardly cut off
  // at whatever month the Month-view grid currently happens to be on.
  // Fetches the current month plus the next two, independently of S.cal,
  // and keeps the result separate from S.schedule so Month view's existing
  // behavior is untouched.
  if(!S.token) return;
  const now = new Date();
  const months = [0,1,2].map(offset => { const d = new Date(now.getFullYear(), now.getMonth()+offset, 1); return {y:d.getFullYear(), m:d.getMonth()+1}; });
  try {
    const results = await Promise.all(months.map(({y,m}) => api(`/api/schedule?token=${S.token}&year=${y}&month=${m}`)));
    // Same principle as loadSchedule — only trust results that genuinely
    // came back successfully. A failed month contributes nothing rather
    // than silently overwriting real (or optimistic) data with an empty
    // result, and if every month happens to fail, the existing state is
    // left completely untouched instead of being wiped to nothing.
    const successful = results.filter(r => Array.isArray(r.posts));
    if(successful.length){ S.agendaSchedule = successful.flatMap(r => r.posts); cleanupPendingSchedule(); render(); }
  } catch(e){}
}
async function bootApp(){ render(); loadTrends(); loadNotifs(); loadSchedule(); loadSaved(); loadDigest(); loadAgendaSchedule(); flushOutbox(); startGlobalTimer(); initPush(); }

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
// Public key only — safe to embed client-side. Must match VAPID_PUBLIC_KEY on the server.
const VAPID_PUBLIC_KEY = "BABGi6-NsT4cTN6RflTShVW7uT4KzJip1rnBPdzcnzXq7pcrG3Mz85qOr9K0QmYkgqeCBN9n8Q26eWXmG0rZHFY";
function urlBase64ToUint8Array(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
async function initPush(){
  if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if(localStorage.getItem('cp_push_subscribed')) return; // already done, don't re-prompt every boot
  if(Notification.permission === 'denied') return;
  try {
    const perm = await Notification.requestPermission();
    if(perm !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if(!sub){
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    }
    if(S.token){
      const r = await api('/api/push-subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: S.token, subscription: sub.toJSON() }) });
      if(r && !r.error) localStorage.setItem('cp_push_subscribed','1');
    }
  } catch(e){ console.log('[push] subscribe failed:', e.message); }
}

// ─── GLOBAL COUNTDOWN TIMER (one interval, updates DOM directly) ────────
let _cpTimer = null;
function startGlobalTimer(){
  if(_cpTimer) return;
  _cpTimer = setInterval(()=>{
    document.querySelectorAll('[data-countdown]').forEach(el=>{
      const target = parseInt(el.dataset.countdown,10); if(!target) return;
      const diff = target - Date.now();
      if(diff <= 0){ el.textContent = 'Post now'; return; }
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
      el.textContent = `${h}h ${m}m left`;
    });
  }, 30000);
}

// 2-hour bucket key (UTC) — matches the bucketing server.js uses for /api/daily-digest,
// so the digest is treated as "new" again every 2 hours instead of staying dismissed all day.
function digestBucketKey(){
  const now = new Date();
  const bucketHour = Math.floor(now.getUTCHours() / 2) * 2;
  return 'cp_digest_seen_' + now.toISOString().slice(0,10) + '-' + String(bucketHour).padStart(2,'0');
}
async function loadDigest(){
  if(!S.user?.niches?.length) return;
  const key = digestBucketKey();
  S.digestDismissed = !!localStorage.getItem(key); // reflects current bucket only — resets when bucket rolls over
  try { const d = await api(`/api/daily-digest?niches=${encodeURIComponent(S.user.niches.join(','))}`); S.digest = d.digest; render(); } catch(e){}
}
window.dismissDigest = async () => {
  // OPTIMISTIC: hide the digest instantly, revert if the server rejects it.
  const key = digestBucketKey();
  const prev = S.digestDismissed;
  S.digestDismissed = true;
  delete S.errors.digest;
  localStorage.setItem(key,'1');
  render();
  try {
    if(S.token){
      const r = await api("/api/digest-dismiss", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token, date:key.replace('cp_digest_seen_','')})});
      if(r && r.error && !/not found|404/i.test(r.error)) throw new Error(r.error);
    }
  } catch(e){
    S.digestDismissed = prev;         // revert
    localStorage.removeItem(key);
    S.errors.digest = "Couldn't dismiss the digest — try again.";
    render();
  }
};

// Trend heuristics — velocity, opportunity, best platform, post-before window
function trendVelocity(t){
  const age = Date.now() - (t.timestamp||Date.now());
  const h = age / 3600000;
  if(h < 2) return { state:'rising', label:'Rising' };
  if(h < 8) return { state:'peaking', label:'Peaking' };
  return { state:'dying', label:'Cooling' };
}
function trendPostBefore(t){
  const v = trendVelocity(t);
  const base = t.timestamp || Date.now();
  const hours = v.state==='rising'?12: v.state==='peaking'?6:2;
  return base + hours*3600000;
}
function trendBestPlatform(t){
  // Was a first-match if-chain checking a handful of keywords — most
  // ordinary headlines (especially sports news) never hit any of those
  // words, so it silently fell through to "just use your primary platform"
  // most of the time without you knowing that's what was happening. This
  // scores every platform against several signal groups and picks whichever
  // actually has the strongest match — still a heuristic, not a trained
  // model, but a much more honest attempt than "first regex that hits wins."
  const plats = S.user?.platforms || ['instagram'];
  const hay = ((t.headline||'')+' '+(t.summary||'')).toLowerCase();
  const scores = { tiktok:0, instagram:0, youtube:0, twitter:0 };
  // Reaction/entertainment/shock-driven stories are TikTok's strength
  if (/viral|dance|challenge|meme|reacts?|shocking|stuns|wild|insane|hilarious|prank/.test(hay)) scores.tiktok += 3;
  // Stat-heavy / list-like / visual stories fit a carousel well
  if (/\d+%|\$\d|record|stats?|numbers|ranking|top \d|list of/.test(hay)) scores.instagram += 3;
  if (/photo|aesthetic|fashion|style|design|behind the scenes/.test(hay)) scores.instagram += 2;
  // In-depth/explainer content favors YouTube's longer format
  if (/explain|breakdown|analysis|review|documentary|deep dive|how .* works|why .* happened/.test(hay)) scores.youtube += 3;
  // Hot takes/opinion/debate/breaking fit a fast, conversational format
  if (/breaking|takes?|debate|slams|blasts|responds|reacts to|opinion/.test(hay)) scores.twitter += 3;
  // A story with a genuinely high content score (corroborated by multiple
  // outlets, uses high-impact language) reads better as a real-time take or
  // an explainer than a purely visual carousel post
  if ((t.score||0) >= 85) { scores.twitter += 1; scores.youtube += 1; }

  const ranked = Object.entries(scores).filter(([p]) => plats.includes(p)).sort((a,b)=>b[1]-a[1]);
  if (ranked.length && ranked[0][1] > 0) return ranked[0][0];
  return S.user?.primaryPlatform || plats[0] || 'instagram';
}
function trendOpportunity(t){
  // Recalibrated for the real content-score range (40-99, typically 55-85)
  // now coming from the server — the old formula (score + boost - 40) was
  // tuned for scores that were almost always 80-99 (randomly generated), so
  // it would read as artificially low against real scores. This isn't a
  // trained prediction — it's the same honest heuristic combination as
  // before, just scaled to match what the score actually means now.
  const v = trendVelocity(t);
  const s = t.score || 55;
  const boost = v.state==='rising'? 8 : v.state==='peaking'? 0 : -18;
  return Math.max(15, Math.min(97, Math.round(0.6*s + boost*2 + 15)));
}


async function loadTrends(){
  if(!S.user) return;
  const now = Date.now(); const cutoff = now - 6*60*60*1000;
  S.trends = []; render();
  const all = [];
  // Was: nested for-loops with `await` inside — every niche/handle fetch ran
  // one at a time (up to ~18 sequential round trips for 3 niches). Now all
  // requests fire together and we just wait for whichever finish, in
  // whatever order — this is why "Today's edit" was slow to load.
  const jobs = [];
  for(const niche of S.user.niches){
    jobs.push(fetchNews(niche).catch(()=>[]));
    jobs.push(fetchBlogs(niche).catch(()=>[]));
    const handles = NICHE_HANDLES[niche] || NICHE_HANDLES.default;
    for(const h of handles.slice(0,8)){
      jobs.push(
        fetchTwitter(h, niche)
          .then(arr=>{
            arr.forEach(a=>{ a.niche = niche; if(a.image && !/^https?:/.test(a.image)) a.image = 'https://nitter.net'+a.image; if(a.image) a.image = `${API}/api/image-proxy?url=${encodeURIComponent(a.image)}`; });
            return arr;
          })
          .catch(()=>[])
      );
    }
  }
  const results = await Promise.all(jobs);
  results.forEach(arr => all.push(...arr));
  // Dedupe + freshness
  const seen = new Set();
  S.trends = all.filter(t=>{
    const k = (t.headline||"").toLowerCase().trim().slice(0,80);
    if(!k || seen.has(k)) return false; seen.add(k);
    const ts = t.timestamp || 0;
    return ts >= cutoff;
  }).sort((a,b)=> (b.score||0) - (a.score||0)).slice(0, 25);
  if(S.tab === "home") render();
}
async function loadNotifs(){ if(!S.user) return; S.notifs = await fetchNotifs(S.user.niches).catch(()=>[]); render(); }
// A pending item is "confirmed" once a real fetch returns something with
// the same headline on the same date — matched loosely on just the date
// portion since exact timestamp formatting can differ slightly between
// what was sent and what Postgres hands back.
// Was removing a pending item from the one shared list the moment ANY
// cache confirmed it — but Month and Agenda/Week refresh independently and
// don't always succeed together. If Month's refresh confirmed an item
// first and removed it from the shared pending list, while Agenda's own
// refresh for that same period failed moments later, the item fell into
// the gap between the two: gone from pending, never made it into Agenda's
// own cache either. Checking against each view's OWN data at render time
// instead — rather than deleting from one shared list based on a
// different cache's success — means there's no gap for an item to fall
// into, and no dependency on which refresh happens to finish first.
// Housekeeping only — NOT relied on for correctness (render-time deduping
// in mergeWithPending already handles that regardless of this ever
// running). This just keeps the persisted pending list from growing
// forever: once an item is confirmed in BOTH real caches — the safe
// condition, unlike the old one-cache-triggers-removal bug — it's dropped
// and the trimmed list is re-saved.
function cleanupPendingSchedule(){
  if(!S.pendingSchedule.length) return;
  const confirmedInBoth = S.pendingSchedule.filter(pending =>
    S.schedule.some(r => r.headline === pending.headline && (r.scheduled_date||"").slice(0,10) === (pending.scheduled_date||"").slice(0,10)) &&
    S.agendaSchedule.some(r => r.headline === pending.headline && (r.scheduled_date||"").slice(0,10) === (pending.scheduled_date||"").slice(0,10))
  );
  if(confirmedInBoth.length){
    S.pendingSchedule = S.pendingSchedule.filter(p => !confirmedInBoth.includes(p));
    savePendingSchedule();
  }
}
function mergeWithPending(realItems, pendingItems){
  if(!pendingItems.length) return realItems;
  const stillPending = pendingItems.filter(pending =>
    !realItems.some(real => real.headline === pending.headline && (real.scheduled_date||"").slice(0,10) === (pending.scheduled_date||"").slice(0,10))
  );
  return [...realItems, ...stillPending];
}
async function loadSchedule(){
  if(!S.token) return;
  try{
    const d = await api(`/api/schedule?token=${S.token}&year=${S.cal.y}&month=${S.cal.m+1}`);
    // Only replace what's on screen if this actually succeeded. On failure
    // api() returns an error-shaped object with no .posts array at all —
    // falling back to [] here was silently wiping out whatever was already
    // showing (including an item just optimistically added seconds
    // earlier) the moment this background check failed, even though
    // nothing was actually wrong with that data.
    if(Array.isArray(d.posts)){ S.schedule = d.posts; cleanupPendingSchedule(); render(); }
  }catch(e){}
}
async function loadSaved(){ if(!S.token) return; try{ const d = await api(`/api/saved-posts?token=${S.token}`); S.saved = d.posts||[]; render(); }catch(e){} }

// ─── TRENDING RENDER ────────────────────────────────────────────────────────
function renderTrend(t){
  const exp = !!S.expanded[t.id];
  const plat = S.plat[t.id] || S.user?.primaryPlatform || "instagram";
  const ct = S.ctype[t.id] || PTYPES[plat]?.[0] || "";
  const tone = S.tone[t.id] || "normal";
  const outs = S.outs[t.id] || [];
  const rec = S.recs[t.id] || "";
  const load = !!S.loading[t.id];
  const img = t.image ? `<img loading="lazy" decoding="async" class="timg" src="${esc(t.image)}" onerror="imgFail(this)"/>` : `<div class="timg-ph">${I.news}</div>`;

  let panel = "";
  if(exp){
    const velo = trendVelocity(t);
    const postBy = trendPostBefore(t);
    const bp = trendBestPlatform(t);
    const bpLabel = PLATS.find(x=>x.id===bp)?.label || bp;
    const opp = trendOpportunity(t);
    const platChips = (S.user?.platforms||["instagram"]).map(p=>{ const P = PLATS.find(x=>x.id===p); return `<button class="chip ${plat===p?'active':''}" onclick="setPlat('${t.id}','${p}')">${esc(P?.label||p)}</button>`; }).join("");
    const ctChips = (PTYPES[plat]||[]).map(c=>`<button class="chip ac ${ct===c?'active':''}" onclick="setCT('${t.id}','${esc(c)}')">${esc(c)}</button>`).join("");
    const toneChips = TONES.map(x=>`<button class="chip ${tone===x.id?'active':''}" onclick="setTone('${t.id}','${x.id}')">${x.label}</button>`).join("");
    const palette = S.palette[t.id] || "noir_orange";
    const paletteChips = PALETTES.map(x=>`<button class="chip ${palette===x.id?'active':''}" onclick="setPalette('${t.id}','${x.id}')">${x.label}</button>`).join("");
    const showPalette = ct === "IG Carousel" || ct === "TikTok No-Face Graphic";
    const slideCount = S.slideCount[t.id] || 4;
    const slideCountChips = [1,2,3,4,5,6].map(n=>`<button class="chip ${slideCount===n?'active':''}" onclick="setSlideCount('${t.id}',${n})">${n}</button>`).join("");
    const showSlideCount = ct === "IG Carousel";
    const outsHTML = outs.map((o,i)=>renderOut(o,t.id,i)).join("");
    panel = `<div class="cp">
      <div class="countdown">
        <span class="countdown-label">Post before</span>
        <span class="countdown-time" data-countdown="${postBy}">calculating…</span>
      </div>
      <div class="why"><div class="why-label">Why this matters</div><div class="why-body">${esc(rec||t.summary||"This is trending in your niche right now — the earlier you post, the more upside on reach.")}</div></div>
      <div class="best-plat"><span class="em">${PLAT_EMOJI[bp]||"◆"}</span><div style="flex:1"><div class="best-plat-lbl">Best platform</div><div class="best-plat-val">${esc(bpLabel)}</div></div></div>
      <div class="opp"><div class="opp-head"><span class="opp-lbl">Opportunity</span><span class="opp-val">${opp}/100</span></div><div class="opp-bar"><div class="opp-fill" style="width:${opp}%"></div></div></div>
      <div class="chip-label">Platform</div>
      <div class="chips">${platChips}</div>
      <div class="chip-label">Format</div>
      <div class="chips">${ctChips}</div>
      <div class="chip-label">Tone</div>
      <div class="chips">${toneChips}</div>
      ${showPalette ? `<div class="chip-label">Card color</div><div class="chips">${paletteChips}</div>` : ""}
      ${showSlideCount ? `<div class="chip-label">Number of slides</div><div class="chips">${slideCountChips}</div>` : ""}
      <div class="action-row">
        <button class="action-btn primary" ${load?'disabled':''} onclick="gen('${t.id}',false)">${load?'<span class="sp"></span>':I.bolt}<span>${load?'…':'Generate'}</span></button>
        <button class="action-btn" onclick="openRemix('${t.id}')">${I.remix}<span>Remix</span></button>
        <button class="action-btn" onclick="openTitles('${t.id}')">${I.title}<span>Titles</span></button>
        ${plat!=='twitter' ? `<button class="action-btn" onclick="openVideoBlueprint('${t.id}')">${I.bolt}<span>Blueprint</span></button>` : ''}
        <button class="action-btn" onclick="quickSaveTrend('${t.id}')">${I.save}<span>Save</span></button>
      </div>
      ${load?skDraftBlock():""}
      ${sectionErr("saveOut")}
      <div class="oa">${outsHTML}</div>
    </div>`;
  }
  const srcTag = t.source?`<span class="tsep">·</span><span class="badge-src">${esc(t.source)}</span>`:"";
  return `<div class="tc ${exp?'exp':''}" id="tc-${t.id}">
    <div class="th" onclick="toggle('${t.id}')">
      ${img}
      <div class="thead">
        <div class="tmeta-top">
          <span class="badge badge-hot">${t.score||90}</span>
          <span class="badge badge-niche">${esc(t.niche)}</span>
          ${(function(){const v=trendVelocity(t);return `<span class="velo-pill velo-${v.state}"><span class="velo-dot"></span>${v.label}</span>`;})()}
        </div>
        <div class="thl">${esc(t.headline)}</div>
        <div class="tmeta"><span>${(t.tags||[]).slice(0,2).map(esc).join(' · ')}</span>${srcTag}</div>
      </div>
      <span class="cv ${exp?'open':''}">${I.chevron}</span>
    </div>
    ${panel}
  </div>`;
}

function renderOut(o, tid, idx){
  if(!o) return "";
  if(o.type === "image"){
    // aspect-ratio CSS constrains the preview box so a 9:16 TikTok card
    // doesn't render at full natural height inside a feed card sized for
    // a 4:5 carousel slide or square thumbnail — that mismatch (no
    // constraint at all, previously) is what made the TikTok single card
    // look oversized. object-fit:contain (not cover) so we never crop off
    // any of the actual card — cards are precisely laid out, unlike photos.
    const aspectRatioCSS = o.aspect === "reel" || o.aspect === "tiktok" ? "9/16" : o.aspect === "youtube" ? "16/9" : o.aspect === "carousel" ? "4/5" : "1/1";
    const badge = o.isCard
      ? `<span class="ol">Card</span>`
      : o.isRealPhoto
      ? `<span class="ol" style="color:#6fa062">Real photo${o.sourceLabel?' · '+esc(o.sourceLabel):''}</span>`
      : `<span class="ol">AI-generated</span>`;
    const gptBtn = o.isCard ? "" : `<button class="btn bo bxs tipbtn" data-tip="Get a detailed prompt for ChatGPT/DALL-E" title="ChatGPT prompt" aria-label="Get ChatGPT prompt" onclick="getChatGPTPrompt('${tid}')">${I.bolt} ChatGPT Prompt</button>`;
    return `<div class="oc"><div class="oh">${badge}</div><div style="padding:10px"><img loading="lazy" decoding="async" src="${o.img}" style="width:100%;max-width:280px;margin:0 auto;display:block;aspect-ratio:${aspectRatioCSS};object-fit:contain;border-radius:6px"/></div><div class="ofoot"><button class="btn bo bxs tipbtn" data-tip="Download image" title="Download image" aria-label="Download image" onclick="dl('${o.img}','image.jpg')">${I.dl} Download</button>${gptBtn}<button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
  }
  if(o.type === "carousel"){
    const slideText = s => [s.headline, s.stat && s.statLabel ? `${s.stat} — ${s.statLabel}` : s.stat, s.sectionLabel, s.body, s.supportingText].filter(Boolean).join("\n");
    const slides = (o.slides||[]).map((s,si)=>`<div style="padding:8px 0;border-bottom:1px solid var(--br)"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:10px;color:var(--mu);font-weight:600">Slide ${s.slideNumber} · ${esc(s.type||"")}</div><div style="display:flex;gap:4px;align-items:center">${o._imgLoading===si?`<span style="font-size:10px;color:var(--mu)">Applying…</span>`:`${s.img?`<button class="btn bo bxs tipbtn" data-tip="Download this slide" title="Download this slide" aria-label="Download slide ${s.slideNumber}" onclick="dl('${s.img}','slide-${s.slideNumber}.png')" style="padding:3px 8px">${I.dl}</button>`:""}<input type="file" accept="image/*" id="slideimg-${tid}-${idx}-${si}" style="display:none" onchange="setSlideBackgroundImage('${tid}',${idx},${si},this.files[0])"/><button class="btn bo bxs tipbtn" data-tip="Use your own photo as this slide's background" title="Add background image" aria-label="Add background image for slide ${s.slideNumber}" onclick="document.getElementById('slideimg-${tid}-${idx}-${si}').click()" style="padding:3px 8px">${I.image}</button>`}</div></div>${s.img?`<img loading="lazy" decoding="async" src="${s.img}" style="width:100%;border-radius:6px;margin-top:6px;aspect-ratio:4/5;object-fit:cover"/>`:""}<div style="font-family:var(--serif);font-size:14px;font-weight:600;margin-top:6px">${esc(s.headline)}</div>${s.stat?`<div style="font-size:12px;color:var(--ac);margin-top:2px;font-weight:700">${esc(s.stat)}${s.statLabel?` — ${esc(s.statLabel)}`:""}</div>`:""}<div style="font-size:12px;color:var(--mu);margin-top:3px;line-height:1.5">${esc(s.body||s.supportingText||"")}</div></div>`).join("");
    const cp = (o.slides||[]).map(s=>`SLIDE ${s.slideNumber}: ${slideText(s)}`).join("\n\n");
    const imgs = (o.slides||[]).map(s=>s.img).filter(Boolean);
    const dlAllBtn = imgs.length ? `<button class="btn bo bxs tipbtn" data-tip="Download all slide images" title="Download all slides" aria-label="Download all slides" onclick='dlAll(${JSON.stringify(imgs)})'>${I.dl} All</button>` : "";
    return `<div class="oc"><div class="oh"><span class="ol">Carousel · ${o.slides?.length||0} slides</span><div style="display:flex;gap:6px">${dlAllBtn}<button class="btn bo bxs tipbtn" data-tip="Copy carousel text" title="Copy carousel text" aria-label="Copy carousel text" onclick="copyTxt(\`${cp.replace(/`/g,"\\`")}\`)">${I.copy}</button></div></div><div style="padding:10px">${slides}</div><div class="ofoot"><button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
  }
  const content = String(o.content||"");
  return `<div class="oc"><div class="oh"><span class="ol">${esc(o.label||"Draft")}</span><button class="btn bo bxs tipbtn" data-tip="Copy draft" title="Copy draft" aria-label="Copy draft" onclick="copyTxt(\`${content.replace(/`/g,"\\`")}\`)">${I.copy}</button></div><div class="ob">${esc(content)}</div><div class="ofoot"><button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
}

window.setSlideBackgroundImage = async (tid, idx, slideIdx, file) => {
  if (!file) return;
  const o = S.outs[tid]?.[idx];
  if (!o || o.type !== "carousel" || !o._renderCtx) return;
  // A phone photo can easily be 10-20MB — base64-encoding it adds another
  // ~33% on top, which used to blow straight through the server's 2MB
  // request-body limit and fail with no useful error. There's no reason to
  // send the original size anyway: the card canvas only needs ~1080px
  // wide. Downscaling here (max 1600px on the long edge, JPEG ~0.85
  // quality) shrinks a typical photo to a few hundred KB — faster upload,
  // and comfortably inside the server limit regardless of the source size.
  let dataUrl;
  try {
    dataUrl = await downscaleImageFile(file, 1600, 0.85);
  } catch (e) {
    toast("Couldn't read that image — try a different photo.");
    return;
  }
  o.slides[slideIdx].customImage = dataUrl;
  o._imgLoading = slideIdx; render();
  try {
    const { category, palette, format, imageUrl } = o._renderCtx;
    const cd = await generateCardsWithRetry({slides: o.slides, category, palette, format, imageUrl});
    const newImgs = cd.images || [];
    o.slides.forEach((s,i)=>{ if(newImgs[i]) s.img = newImgs[i]; });
    o.images = newImgs;
  } catch(e) { toast("Couldn't apply that image — try again."); }
  o._imgLoading = null; render();
};
function downscaleImageFile(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
window.setPlat = (tid,p) => { S.plat[tid]=p; S.ctype[tid]=PTYPES[p]?.[0]||""; render(); };
window.setCT = (tid,c) => { S.ctype[tid]=c; render(); };
window.setTone = (tid,t) => { S.tone[tid]=t; render(); };
window.setPalette = (tid,p) => { S.palette[tid]=p; render(); };
window.setSlideCount = (tid,n) => { S.slideCount[tid]=n; render(); };
window.toggle = async (tid) => {
  S.expanded[tid] = !S.expanded[tid];
  if(S.expanded[tid] && !S.plat[tid]) S.plat[tid] = S.user?.primaryPlatform || "instagram";
  if(S.expanded[tid] && !S.ctype[tid]) S.ctype[tid] = PTYPES[S.plat[tid]]?.[0] || "";
  render();
  if(S.expanded[tid] && !S.recs[tid]){
    const t = S.trends.find(x=>x.id===tid); if(!t) return;
    try { S.recs[tid] = await generateText("One-sentence content recommendation. No preamble.", `Niche: ${S.user?.niches?.join(", ")}. Story: "${t.headline}". Best platform, format, and angle?`); render(); } catch(e){}
  }
};
window.copyTxt = (t) => { navigator.clipboard.writeText(t); toast("Copied"); };
window.dl = (url, name) => { const a=document.createElement("a"); a.href=url; a.download=name; a.click(); };
// Staggered so mobile browsers don't drop/block downloads fired back-to-back
// from a single tap.
window.dlAll = (urls) => { (urls||[]).forEach((u,i)=> setTimeout(()=> window.dl(u, `slide-${i+1}.png`), i*350)); toast(`Downloading ${urls?.length||0} slides`); };

window.gen = async (tid, all) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const ct = S.ctype[tid] || PTYPES[plat]?.[0] || "";
  const tone = S.tone[tid] || "normal";
  S.loading[tid] = true; S.outs[tid] = []; render();
  try {
    const types = all ? (PTYPES[plat]||[]) : [ct];
    const out = [];
    for(const c of types){
      if(c === "IG Carousel" || c === "TikTok No-Face Graphic"){
        const category = nicheToCategory(t.niche);
        const isSingle = c === "TikTok No-Face Graphic";
        const cardFormat = isSingle ? "tiktok" : plat;
        const requestedCount = isSingle ? 1 : (S.slideCount[tid] || 4);
        // Only 6+ slides earns a dedicated CTA slide — below that, there's
        // too little actual story to justify spending a whole slide on
        // "follow for more" by itself. Instead the CTA gets folded onto the
        // end of the last content slide (a ctaLine — see statCard.js).
        const useDedicatedOutro = requestedCount >= 6;
        // This is the actual source article text now (server sends up to
        // 1600 chars, not the old 200) — the raw material the AI rewrites
        // from, not just a fragment to mechanically slice up.
        const sourceText = t.summary || "";
        const HOOK_SCHEMA = `"hookHeadline":"a REWRITTEN, catchier editorial headline that states the real news and makes someone want to keep reading — not a copy of the raw scraped headline, 5-9 words","hookTease":"1-2 sentences that tease why this matters without giving away the full story"`;
        const BODY_ITEM_SCHEMA = `{"headline":"editorial headline, 4-8 words — communicate the actual news, not just a topic label","sectionLabel":"short label like BACKGROUND or WHAT HAPPENED, else null","body":"2-4 FULL sentences with real specific detail — names, numbers, context, what happens next. Don't summarize vaguely, explain it properly like a real news writer would, else null","subject":"the entity doing the thing — a person, brand, or organization name, ONLY if the slide is naturally an announcement (someone/something did a specific thing) — else omit this field entirely","action":"the specific thing that entity did or announced, as a short clear phrase — ONLY set this alongside subject, else omit this field entirely","outcome":"1-2 sentences on why it matters or what happens next, only if subject/action are set, else omit","compareA":{"label":"short label for the first figure, e.g. BEFORE or LAST SEASON","value":"the first figure as a short string, e.g. 5.25% or 8.2 PPG"},"compareB":{"label":"short label for the second figure, e.g. AFTER or THIS SEASON","value":"the second figure as a short string"},"comparisonNote":"1 sentence on what the contrast means, only if compareA/compareB are set, else omit","claim":"the statement or move that's stirring a response, as a short bold sentence — ONLY if the story has a genuine claim/action-and-reaction dynamic, else omit this field entirely","reaction":"1-2 sentences on how people (fans, critics, the public, other parties) are actually responding, only if claim is set, else omit","reactionTag":"a short label like BACKLASH, MIXED REACTION, PRAISE, or DEBATE — only if claim is set, else omit","stat":"a number/figure from the story if one genuinely exists, else null","statLabel":"what the stat measures, else null","facts":["3-4 short standalone facts, ONLY if the story naturally breaks into a list of distinct points — else omit this field entirely"],"quote":"a real quote from someone in the story, ONLY if the source material actually contains one — else omit this field entirely","quoteAttribution":"who said it, only if quote is set","timeline":[{"label":"a date/stage label","text":"what happened at that point"}],"tag":"a short context tag like a team/event name, else null"}`;
        const REWRITE_RULES = `You are REWRITING this into a proper editorial carousel, not mechanically splitting the source text across slides — rephrase in clear, engaging, well-written English, and never cut a sentence off mid-thought at a slide boundary. Each slide should use AT MOST ONE of subject+action+outcome / compareA+compareB / claim+reaction / stat / facts / quote / timeline — never combine them, never fill one in unless the story genuinely supports it, never invent a stat/quote/timeline/comparison point that isn't actually in the source. Use subject+action+outcome specifically when the slide's whole point is that a named person/brand/organization did or announced something concrete — that's a distinct visual treatment from a plain body paragraph, so don't set it for slides that are just background or context with no clear actor. Use compareA+compareB ONLY when the source genuinely gives two comparable figures (a real before/after, this-season-vs-last, or two named things being weighed against each other) — never invent a second figure just to force a comparison. Use claim+reaction ONLY when the source genuinely describes a statement or move AND a real response to it (backlash, praise, debate, pushback) — never invent a reaction that isn't actually reported. Prioritize substance — every slide should teach the reader something concrete.`;

        // Generation occasionally returns fewer slide objects than asked —
        // usually a truncated/malformed response rather than the model
        // deliberately ignoring the count. One retry with a blunter
        // instruction recovers most of these instead of silently shipping
        // a shorter carousel than what was selected.
        async function generateSlidesWithCount(prompt, ctx, tone, wantCount) {
          for (let attempt = 0; attempt < 2; attempt++) {
            const p = attempt === 0 ? prompt : prompt + ` CRITICAL: your last response did not contain exactly ${wantCount} items — count them before responding, the "slides" array MUST have exactly ${wantCount} entries, no more, no fewer.`;
            const sr = await generateText(p, ctx, tone);
            const parsed = extractJSON(sr) || {};
            const slides = asArray(parsed.slides);
            if (slides.length === wantCount || attempt === 1) return { parsed, slides };
          }
        }

        let slideArr;
        if(requestedCount === 1){
          // A single slide is the WHOLE post — no second slide to swipe to,
          // so headline + body + CTA all have to live here together.
          const sr = await generateText(
            `Return ONLY a valid JSON object for a single all-in-one post (there is no other slide, this must fully tell the story): {"headline":"a full, complete, REWRITTEN editorial headline stating the actual news — catchy, not a copy of the raw source headline, 6-10 words","body":"3-5 full sentences with real specific detail — names, numbers, context, what happens and why it matters. This is the ONLY slide so it must completely explain the story on its own, in clear well-written English.","tag":"a short context tag, else null"}.`,
            `${category.name} single post. Raw source headline: "${t.headline}". Full source text: ${sourceText}`, tone
          );
          const single = extractJSON(sr) || {};
          slideArr = [{ type: "body", headline: single.headline || t.headline, body: single.body || sourceText, tag: single.tag || null, ctaLine: "FOLLOW FOR MORE →" }];
        } else if(!useDedicatedOutro){
          // 2-5 slides: CTA folded onto the last body slide instead of
          // spending a whole separate slide on it. Hook + body slides all
          // come from ONE call now, so the whole thing reads as one
          // rewritten story instead of a hardcoded headline stitched to
          // separately-generated body slides.
          const bodyCount = requestedCount - 1;
          const promptStr = `Return ONLY a valid JSON object: {${HOOK_SCHEMA},"slides":[array of exactly ${bodyCount} objects, each shaped like ${BODY_ITEM_SCHEMA}]}. ${REWRITE_RULES}`;
          const ctxStr = `${category.name} carousel. Raw source headline: "${t.headline}". Full source text: ${sourceText}`;
          const { parsed, slides: rawSlides } = await generateSlidesWithCount(promptStr, ctxStr, tone, bodyCount);
          const bodySlides = rawSlides.map(s => ({ ...s, type: "body" }));
          if(bodySlides.length) bodySlides[bodySlides.length - 1].ctaLine = "FOLLOW FOR MORE →";
          const hookSlide = { type: "hook", headline: parsed.hookHeadline || t.headline, supportingText: parsed.hookTease || sourceText.split(/(?<=[.!?])\s/).slice(0,2).join(" "), emphasisLine: 1 };
          slideArr = [hookSlide, ...bodySlides];
        } else {
          // 6+ slides: there's enough real content that a dedicated CTA
          // slide at the end doesn't feel like a waste.
          const bodyCount = requestedCount - 2;
          const promptStr = `Return ONLY a valid JSON object: {${HOOK_SCHEMA},"slides":[array of exactly ${bodyCount} objects, each shaped like ${BODY_ITEM_SCHEMA}]}. The outro slide is added separately, don't include it. ${REWRITE_RULES}`;
          const ctxStr = `${category.name} carousel. Raw source headline: "${t.headline}". Full source text: ${sourceText}`;
          const { parsed, slides: rawSlides } = await generateSlidesWithCount(promptStr, ctxStr, tone, bodyCount);
          const bodySlides = rawSlides.map(s => ({ ...s, type: "body" }));
          const hookSlide = { type: "hook", headline: parsed.hookHeadline || t.headline, supportingText: parsed.hookTease || sourceText.split(/(?<=[.!?])\s/).slice(0,2).join(" "), emphasisLine: 1 };
          slideArr = [hookSlide, ...bodySlides, ctaOutroSlide(t.niche)];
        }
        // Real cards (actual text, actual numbers) — not AI-generated art, which
        // can't reliably render legible text. See services/statCard.js.
        let cardImgs = [];
        try {
          const cd = await generateCardsWithRetry({slides: slideArr, category, palette: S.palette[tid] || "noir_orange", format: cardFormat, imageUrl: t.image || null});
          cardImgs = cd.images || [];
        } catch(e){ toast("Server's busy right now — the text generated fine, but images didn't come through. Try regenerating in a moment."); }
        slideArr.forEach((s,i)=>{ s.slideNumber = i+1; if(cardImgs[i]) s.img = cardImgs[i]; });
        out.push(isSingle ? {type:"image", img: cardImgs[0], aspect: "tiktok", isCard:true} : {type:"carousel", slides: slideArr, images: cardImgs, _renderCtx: { category, palette: S.palette[tid] || "noir_orange", format: cardFormat, imageUrl: t.image || null }});
      } else if(c === "Thumbnail" || /image/i.test(c)){
        const aspect = aspectForContent(plat, c);
        if(t.image){
          // The article/post this trend came from already has a real photo —
          // use that instead of generating a fake one. Proxied through our
          // server so download/hotlinking always works reliably.
          out.push({type:"image", img: `${API}/api/image-proxy?url=${encodeURIComponent(t.image)}`, aspect, isRealPhoto:true, sourceLabel: t.source||""});
        } else {
          let realPhoto = null;
          try {
            const sp = await api(`/api/stock-photo?query=${encodeURIComponent(t.niche+' '+(t.tags||[]).join(' '))}&count=1`);
            realPhoto = sp.photos?.[0] || null;
          } catch(e){}
          if(realPhoto){
            out.push({type:"image", img: realPhoto.url, aspect, isRealPhoto:true, sourceLabel: `Photo: ${realPhoto.credit}`});
          } else {
            const scene = await sceneForHeadline(t.headline, t.niche);
            const img = await generateImage(`${scene}. Real photograph, natural lighting, photojournalism style, no text, no logo, no watermark`, aspect);
            if(img) out.push({type:"image", img, aspect, isRealPhoto:false});
          }
        }
      } else {
        const P = PLATS.find(x=>x.id===plat);
        const isScript = /script/i.test(c);
        const userPrompt = isScript
          ? `Write a "${c}" for a ${t.niche} creator on ${P?.label||plat}, built around this story: "${t.headline}". ${t.summary||""}

Structure it as ONE continuous flow of speech — never label or separate sections, never write a heading like "Hook:" or "[CTA]", just write it exactly as it would be spoken start to finish:
1. Open with a strong hook in the very first line — the thing that stops someone from scrolling. This is not a separate section, it's just how the script begins.
2. Immediately follow with 1-2 lines that create a reason to keep watching — a curiosity gap or a "here's what happened" tease — before explaining anything fully.
3. Deliver the actual substance of the story in clear, engaging spoken language — this is the bulk of the script.
4. Close with a natural ending, then a real call to action: ask a genuine question that invites a comment, and end with a follow-prompt worded differently than the usual line — vary it, never repeat the same "follow for more" phrasing verbatim every time.

Return only the ready-to-post spoken text — no labels, no headers, no meta-commentary.`
          : `Write a "${c}" for a ${t.niche} creator on ${P?.label||plat}. Story: "${t.headline}". ${t.summary||""}. Return only the ready-to-post text.`;
        const s = await generateText(SYS, userPrompt, tone);
        out.push({type:"text", label:`${P?.label||plat} · ${c}`, content:s});
      }
    }
    S.outs[tid] = out;
    if(out.length && S.token){
      const today = new Date();
      const sd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const first = out[0];
      const kind = first.type==="carousel"?"Carousel":first.type==="image"?"Image":"Script";
      await api("/api/save-post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,headline:t.headline,niche:t.niche,platform:plat,contentType:kind,content:first,scheduledDate:sd})});
      loadSchedule(); loadSaved();
    }
  } catch(e){ S.outs[tid] = [{type:"text", label:"Error", content:"Generation failed. "+e.message}]; }
  S.loading[tid] = false; render();
};

window.saveOut = async (tid, idx) => {
  const t = S.trends.find(x=>x.id===tid); const o = S.outs[tid]?.[idx]; if(!t||!o) return;
  const today = new Date(); const sd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const kind = o.type==="carousel"?"Carousel":o.type==="image"?"Image":"Script";
  // OPTIMISTIC: show it as saved right away, reconcile after the API answers.
  const tempId = "tmp-" + Date.now() + "-" + idx;
  const optimistic = { id: tempId, _pending: true, headline: t.headline, niche: t.niche, platform: plat, content_type: kind, content: o, scheduled_date: sd };
  const prevSaved = S.saved.slice();
  S.saved = [optimistic, ...S.saved];
  delete S.errors.saveOut;
  render();
  try {
    const r = await api("/api/save-post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,headline:t.headline,niche:t.niche,platform:plat,contentType:kind,content:o,scheduledDate:sd})});
    if(!r || !r.success) throw new Error(r?.error || "save failed");
    toast("Saved"); loadSchedule(); loadSaved();
  } catch(e){
    S.saved = prevSaved;              // revert
    S.errors.saveOut = "Couldn't save that draft — try again.";
    toast("Error saving");
    render();
  }
};

window.delSaved = async (id) => {
  if(!confirm("Delete this saved item?")) return;
  const r = await fetch(`${API}/api/delete-post?token=${S.token}&postId=${id}`, {method:"DELETE"});
  const d = await r.json();
  if(d.success){ toast("Deleted"); loadSaved(); loadSchedule(); }
};

// ─── COACH ──────────────────────────────────────────────────────────────────
window.runCoach = async () => {
  S.coachLoading = true; S.coachAnswer = ""; delete S.errors.coach; render();
  try {
    const conns = Object.entries(S.connections||{}).map(([k,v])=>`${k}: ${v.handle||"(connected)"}`).join(", ");
    const savedRecent = (S.saved||[]).slice(0,10).map(p=>`${p.content_type} on ${p.platform} for ${p.niche}: ${p.headline}`).join("\n");
    const context = `Connected accounts: ${conns||"none"}\nRecent picks the creator saved:\n${savedRecent||"(nothing yet)"}\nCreator-provided analytics:\n${S.coachMetrics||"(not shared yet)"}`;
    const d = await api("/api/coach", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      handle: S.coachHandle, platform: S.coachPlatform, niche: S.user?.niches?.[0], recentMetrics: context
    })});
    if(d.error) throw new Error(d.error);
    S.coachAnswer = d.text || "No response";
    delete S.errors.coach;
  } catch(e){ S.coachAnswer = ""; S.errors.coach = "Something went wrong — try again."; }
  S.coachLoading = false; render();
};

// ─── SCHEDULE ADD ───────────────────────────────────────────────────────────
window.addRecurring = async () => {
  const p = S.addSched;
  if(!p.title){ toast("Add a title"); return; }
  const r = await api("/api/user-schedule", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,...p})});
  if(r.success){
    toast(`Scheduled ${r.added} weeks`);
    S.addSched={title:"",weekday:"friday",time:"20:00",notes:""};
    S.scheduleSheetOpen=false;
    render(); // show the sheet closing immediately, don't wait on the refresh below
    loadSchedule(); loadAgendaSchedule(); loadSaved();
  }
  else toast(r.error||"Error");
};
window.openQuickAdd = (dateIso, existing) => { S.quickAdd = { date: dateIso, title: "", time: "12:00", existing: existing||[] }; render(); };
window.saveQuickAdd = async () => {
  const q = S.quickAdd;
  if(!q?.title){ toast("Add a title"); return; }
  const niche = (S.user?.niches||[])[0] || "";
  const platform = S.user?.primaryPlatform || (S.user?.platforms||[])[0] || "instagram";
  const scheduledDate = q.time ? `${q.date}T${q.time}:00` : q.date;
  const payload = { token: S.token, headline: q.title, niche, platform, contentType: "Reminder", content: { note: q.title }, scheduledDate };

  // Show it and persist the pending copy FIRST, before even attempting the
  // network call — not after success. This way the item is safely on
  // screen and survives an app close no matter what happens next.
  S.pendingSchedule = [...S.pendingSchedule, { id: `temp_${Date.now()}`, headline: q.title, niche, scheduled_date: scheduledDate, content_type: "Reminder" }];
  savePendingSchedule();
  S.quickAdd = null;
  render();

  try {
    const r = await api("/api/save-post", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(r.success){
      toast("Added to " + q.date);
      loadSchedule(); loadAgendaSchedule(); loadSaved();
    } else {
      // A real failure (not just slow) — queue it so it keeps retrying on
      // its own instead of being silently abandoned. The pending item
      // already on screen stays exactly where it is; the user doesn't
      // need to do anything or even know this happened.
      S.outbox = [...(S.outbox||[]), { endpoint: "/api/save-post", payload, attempts: 1 }];
      saveOutboxState();
    }
  } catch(e){
    S.outbox = [...(S.outbox||[]), { endpoint: "/api/save-post", payload, attempts: 1 }];
    saveOutboxState();
  }
};
window.deleteScheduleItem = async (postId) => {
  try {
    const r = await api(`/api/delete-post?token=${encodeURIComponent(S.token)}&postId=${encodeURIComponent(postId)}`, {method:"DELETE"});
    if(r.success){
      toast("Removed");
      if(S.quickAdd) S.quickAdd.existing = (S.quickAdd.existing||[]).filter(x=>x.id!==postId);
      loadSchedule(); loadAgendaSchedule(); loadSaved(); render();
    } else toast(r.error || "Couldn't remove");
  } catch(e){ toast("Couldn't remove"); }
};

// ─── RENDER (PAGES) ─────────────────────────────────────────────────────────
function render(){
  const root = document.getElementById("root");
  // Preserve live-media state across re-renders (critical to keep camera preview + editor video alive)
  if(!window.__csKeep) window.__csKeep = { edTime:0, edCid:null };
  try {
    const ev = document.getElementById("cs-ed-video");
    if(ev){ window.__csKeep.edTime = ev.currentTime || window.__csKeep.edTime; window.__csKeep.edCid = ev.dataset.cid || window.__csKeep.edCid; }
  } catch(_){}
  if(S.mode === "boot"){ root.innerHTML = `<div class="auth-wrap"><div class="boot-brand"><img src="/logo-64.png" class="brand-mark boot-pulse" alt="CreatorPulse"/><div class="brand-name" style="margin-top:14px">CreatorPulse</div></div><div class="boot-spinner-wrap"><span class="sp boot-sp"></span></div><div class="boot-status">Setting things up…</div></div>`; return; }
  // A recovery link owns the screen until the password is changed, whatever the
  // mode — a signed-in user who clicks the link must still land on it.
  if(S.recovery.active) { renderRecovery(); return csAfterRender(); }
  if(S.mode === "auth" && S.authTab === "forgot") { renderForgot(); return csAfterRender(); }
  if(S.mode === "auth") { renderAuth(); return csAfterRender(); }
  if(S.mode === "onboard") { renderOnboard(); return csAfterRender(); }
  renderApp();
  csAfterRender();
}

function csAfterRender(){
  try {
    const fbBtn = document.getElementById('cp-fb-btn');
    if(fbBtn) fbBtn.style.display = (S.tab === 'create') ? 'none' : '';
    const coachBtn = document.getElementById('fab-coach');
    if(coachBtn) coachBtn.style.display = (S.tab === 'create') ? 'none' : '';
    if(!S.studio || S.tab !== 'create') return;
    // ── Camera mode: reattach live stream + rebind timer/prompter loops ──
    if(S.studio.mode === 'camera'){
      const v = document.getElementById('cs-cam-live');
      if(v){
        const liveStream = (typeof CSCAM !== 'undefined' && CSCAM.stream) ? CSCAM.stream : (window._st && window._st.stream);
        if(liveStream && v.srcObject !== liveStream){
          v.srcObject = liveStream;
          v.muted = true; v.playsInline = true;
          v.play().catch(()=>{});
        }
      }
      // Timer: single canonical loop keyed off S.studio.running
      if(S.studio.running){
        if(!window.__csTimer){
          window.__csTimer = setInterval(() => {
            if(!S.studio || !S.studio.running){ clearInterval(window.__csTimer); window.__csTimer=null; return; }
            const el = document.getElementById('cs-cam-time');
            if(el){ const s = (performance.now() - (window._st.tStart||performance.now()))/1000; el.textContent = _fmtTs(s); }
          }, 250);
        }
      } else if(window.__csTimer){ clearInterval(window.__csTimer); window.__csTimer=null; }
      // Prompter scroll
      const p = document.getElementById('cs-cam-prompter-inner');
      if(p && S.studio.showPrompter && S.studio.script && S.studio.running && !window.__csPromp){
        const start = performance.now();
        window.__csPromp = setInterval(() => {
          if(!S.studio.running || !S.studio.showPrompter){ clearInterval(window.__csPromp); window.__csPromp=null; return; }
          const el = document.getElementById('cs-cam-prompter-inner'); if(!el) return;
          const dt = (performance.now()-start)/1000;
          el.style.transform = `translateY(${-dt*(S.studio.speed||60)}px)`;
        }, 50);
      }
      if((!S.studio.running || !S.studio.showPrompter) && window.__csPromp){ clearInterval(window.__csPromp); window.__csPromp=null; }
    } else {
      if(window.__csTimer){ clearInterval(window.__csTimer); window.__csTimer=null; }
      if(window.__csPromp){ clearInterval(window.__csPromp); window.__csPromp=null; }
    }
    // ── Editor mode: restore video src + playhead ──
    // Lovable's studio.js now owns video loading via a dual-buffer system
    // (two <video> elements that swap IDs for smooth clip transitions).
    // Defer to its own csLoadCurrent/csActiveVideo instead of managing
    // #cs-ed-video directly here — doing both was fighting over the same
    // element and resetting an already-loaded video mid-load (black screen).
    if(S.studio.mode === 'editor'){
      if(window.csLoadCurrent){
        window.csLoadCurrent(true);
      }
      const v = (window.csActiveVideo && window.csActiveVideo()) || document.getElementById('cs-ed-video');
      if(v){
        const st = S.studio;
        if(st.playing && v.paused) v.play().catch(()=>{});
        else if(!st.playing && !v.paused) v.pause();
      }
    }
    if(S.studio.mode === 'editor') csApplyPreview();
  } catch(err){ console.warn('csAfterRender', err); }
}


// ─── PASSWORD RECOVERY ──────────────────────────────────────────────────────
// Backend contract, from server.js:
//   POST /api/auth/forgot-password  { email }
//        → always { success, message } so the endpoint can't be used to probe
//          which addresses have accounts
//   POST /api/auth/reset-password   { access_token, refresh_token, password }
//        → { success, message } or 4xx { error }
// Supabase hands the recovery session back in the URL hash
// (#access_token=…&refresh_token=…&type=recovery); checkAuthRedirect() in
// app.js captures it into S.recovery before scrubbing the hash.

async function doForgotPassword(){
  const email = (S.authForm.email || "").trim();
  S.authErr = ""; S.authMsg = "";
  if(!email){ S.authErr = "Enter your email address first."; render(); return; }
  S.authLoading = true; render();
  try {
    const d = await api("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if(d.error) S.authErr = d.error;
    else S.authMsg = d.message || "If that email has an account, a reset link is on its way. Check your inbox and your spam folder.";
  } catch(e){ S.authErr = e.message; }
  S.authLoading = false; render();
}

async function doResetPassword(){
  const r = S.recovery;
  const pw = (r.form.password || "");
  const confirm = (r.form.confirm || "");
  r.error = "";
  if(pw.length < 6){ r.error = "Password must be at least 6 characters."; render(); return; }
  if(pw !== confirm){ r.error = "Those passwords don't match."; render(); return; }
  r.loading = true; render();
  try {
    const d = await api("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: r.accessToken, refresh_token: r.refreshToken, password: pw })
    });
    // Covers both "invalid/expired link" and a rejected password from Supabase.
    if(d.error) r.error = d.error;
    else { r.done = true; r.accessToken = ""; r.refreshToken = ""; r.form = { password:"", confirm:"" }; }
  } catch(e){ r.error = e.message; }
  r.loading = false; render();
}

window.openForgot = () => { S.mode = "auth"; S.authTab = "forgot"; S.authErr = ""; S.authMsg = ""; render(); };
window.backToLogin = () => {
  S.recovery = { active:false, accessToken:"", refreshToken:"", error:"", done:false, loading:false, form:{ password:"", confirm:"" } };
  S.mode = "auth"; S.authTab = "login"; S.authErr = ""; S.authMsg = "";
  try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e){}
  render();
};

function authShell(body){
  return `<div class="auth-wrap"><div class="auth-inner">
    <div class="auth-brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div class="brand-name">CreatorPulse</div></div>
    ${body}
  </div></div>`;
}

function renderForgot(){
  document.getElementById("root").innerHTML = authShell(`
    <div class="auth-title">Reset your password.</div>
    <div class="auth-sub">Enter your email and we'll send you a link to set a new one.</div>
    ${S.authErr?`<div class="auth-err">${esc(S.authErr)}</div>`:""}
    ${S.authMsg?`<div class="auth-msg">${esc(S.authMsg)}</div>`:""}
    <div class="field"><label>Email</label><input class="input" type="email" value="${esc(S.authForm.email)}" oninput="S.authForm.email=this.value" placeholder="you@domain.com" autocomplete="email"/></div>
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="doForgotPassword()">${S.authLoading?'<span class="sp"></span>':"Send reset link"}</button>
    <div class="auth-switch"><a onclick="backToLogin()">Back to sign in</a></div>`);
}

function renderRecovery(){
  const r = S.recovery;
  if(r.done){
    document.getElementById("root").innerHTML = authShell(`
      <div class="auth-title">Password updated.</div>
      <div class="auth-msg">All set — your new password is active.</div>
      <div class="auth-sub">Sign in with your new password to pick up where you left off.</div>
      <button class="btn bp auth-cta" style="width:100%;padding:13px;justify-content:center" onclick="backToLogin()">Go to sign in</button>`);
    return;
  }
  // No tokens means the link arrived without a usable recovery session —
  // expired, already used, or stripped somewhere along the way. Dead end by
  // design: the only useful action left is to request a fresh link.
  if(!r.accessToken || !r.refreshToken){
    document.getElementById("root").innerHTML = authShell(`
      <div class="auth-title">Link expired.</div>
      <div class="auth-sub">This reset link is no longer valid. They can only be used once, and they expire.</div>
      ${r.error?`<div class="auth-err">${esc(r.error)}</div>`:""}
      <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" onclick="openForgot()">Request a new link</button>
      <div class="auth-switch"><a onclick="backToLogin()">Back to sign in</a></div>`);
    return;
  }
  document.getElementById("root").innerHTML = authShell(`
    <div class="auth-title">Set a new password.</div>
    <div class="auth-sub">Choose something you'll remember — at least 6 characters.</div>
    ${r.error?`<div class="auth-err">${esc(r.error)}</div>`:""}
    <div class="field"><label>New password</label><input class="input" type="password" value="${esc(r.form.password)}" oninput="S.recovery.form.password=this.value" placeholder="••••••••" autocomplete="new-password"/></div>
    <div class="field"><label>Confirm new password</label><input class="input" type="password" value="${esc(r.form.confirm)}" oninput="S.recovery.form.confirm=this.value" placeholder="••••••••" autocomplete="new-password"/></div>
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${r.loading?"disabled":""} onclick="doResetPassword()">${r.loading?'<span class="sp"></span>':"Update password"}</button>
    <div class="auth-switch"><a onclick="backToLogin()">Back to sign in</a></div>`);
}

function renderAuth(){
  const isLogin = S.authTab === "login";
  document.getElementById("root").innerHTML = `<div class="auth-wrap"><div class="auth-inner">
    <div class="auth-brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div class="brand-name">CreatorPulse</div></div>
    <div class="auth-title">${isLogin?"Welcome back.":"Start creating."}</div>
    <div class="auth-sub">${isLogin?"Sign in to pick up where you left off.":"Trending stories, scripts, and a calendar that thinks with you."}</div>
    ${S.authErr?`<div class="auth-err">${esc(S.authErr)}</div>`:""}
    ${S.authMsg?`<div class="auth-msg">${esc(S.authMsg)}</div>`:""}
    ${!isLogin?`<div class="field"><label>Name</label><input class="input" value="${esc(S.authForm.name)}" oninput="S.authForm.name=this.value" placeholder="How should we call you?"/></div>`:""}
    <div class="field"><label>Email</label><input class="input" type="email" value="${esc(S.authForm.email)}" oninput="S.authForm.email=this.value" placeholder="you@domain.com"/></div>
    <div class="field"><label>Password</label><input class="input" type="password" value="${esc(S.authForm.password)}" oninput="S.authForm.password=this.value" placeholder="••••••••"/></div>
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="${isLogin?'doLogin()':'doSignup()'}">${S.authLoading?'<span class="sp"></span>':(isLogin?"Sign in":"Create account")}</button>
    <div class="auth-switch">${isLogin?"New here?":"Already have an account?"} <a onclick="S.authTab='${isLogin?'signup':'login'}'; S.authErr=''; S.authMsg=''; render()">${isLogin?"Create one":"Sign in"}</a>${isLogin?'<div style="margin-top:10px"><a onclick="openForgot()">Forgot password?</a></div>':""}</div>
  </div></div>`;
}

function renderOnboard(){
  const ob = S.onboard;
  const nichesFlat = Object.values(NICHES).flat();
  let body = "";
  if(ob.step === 0){
    body = `<div class="auth-title">What do you make?</div>
      <div class="auth-sub">Pick up to 5 niches. We'll only pull news that matches.</div>
      <div class="pick-grid">${nichesFlat.map(n=>`<button class="pick ${ob.niches.includes(n)?'on':''}" onclick="obToggleN('${esc(n)}')">${esc(n)}</button>`).join("")}</div>
      <button class="btn bp" style="width:100%;padding:13px;justify-content:center" ${!ob.niches.length?'disabled':''} onclick="ob.step=1;render()">Continue</button>`;
  } else if(ob.step === 1){
    body = `<div class="auth-title">Where do you post?</div>
      <div class="auth-sub">Pick your platforms. We'll tailor formats for each.</div>
      <div class="pick-grid">${PLATS.map(p=>`<button class="pick ${ob.platforms.includes(p.id)?'on':''}" onclick="obToggleP('${p.id}')">${p.label}</button>`).join("")}</div>
      <div style="display:flex;gap:8px"><button class="btn bo" style="flex:1;padding:13px;justify-content:center" onclick="ob.step=0;render()">Back</button><button class="btn bp" style="flex:1;padding:13px;justify-content:center" ${!ob.platforms.length?'disabled':''} onclick="ob.step=2;render()">Continue</button></div>`;
  } else {
    body = `<div class="auth-title">Primary platform</div>
      <div class="auth-sub">The one you post to most.</div>
      <div class="pick-grid">${ob.platforms.map(p=>{ const P = PLATS.find(x=>x.id===p); return `<button class="pick ${ob.primary===p?'on':''}" onclick="ob.primary='${p}';render()">${P.label}</button>`; }).join("")}</div>
      <div style="display:flex;gap:8px"><button class="btn bo" style="flex:1;padding:13px;justify-content:center" onclick="ob.step=1;render()">Back</button><button class="btn bp" style="flex:1;padding:13px;justify-content:center" ${!ob.primary?'disabled':''} onclick="saveOnboarding()">Finish</button></div>`;
  }
  document.getElementById("root").innerHTML = `<div class="auth-wrap"><div class="auth-inner">${body}</div></div>`;
}
window.obToggleN = n => { const i = S.onboard.niches.indexOf(n); if(i<0){ if(S.onboard.niches.length<5) S.onboard.niches.push(n); } else S.onboard.niches.splice(i,1); render(); };
window.obToggleP = p => { const i = S.onboard.platforms.indexOf(p); if(i<0) S.onboard.platforms.push(p); else S.onboard.platforms.splice(i,1); render(); };
window.ob = S.onboard;

function renderApp(){
  const pageFns = { home: pageHome, hooks: pageHooks, calendar: pageCalendar, create: pageCreate, profile: pageProfile, library: pageLibrary, discover: pageDiscover };
  const pageHtml = (pageFns[S.tab] || pageHome)();
  document.getElementById("root").innerHTML = `<div class="app">${pageHtml}
    <nav class="tabbar">
      <button class="tab ${S.tab==='home'?'active':''}" onclick="setTab('home')">${I.home}Home</button>
      <button class="tab ${S.tab==='hooks'?'active':''}" onclick="setTab('hooks')">${I.hook}Hooks</button>
      <button class="tab ${S.tab==='calendar'?'active':''}" onclick="setTab('calendar')">${I.cal}Calendar</button>
      <button class="tab ${S.tab==='create'?'active':''}" onclick="setTab('create')">${I.create}Create</button>
      <button class="tab ${S.tab==='profile'?'active':''}" onclick="setTab('profile')">${I.user}Profile</button>
    </nav>
    ${renderSheet()}
    ${renderFloatingCoach()}
  </div>`;
}
window.setTab = t => {
  const prev = S.tab;
  if(t !== prev && window.pushBackState){
    window.pushBackState(() => { S.tab = prev; render(); if(prev==='calendar'){ loadSchedule(); loadCalendarEvents(); loadAgendaSchedule(); } if(prev==='profile'){ loadSaved(); } if(prev==='hooks'){ loadActiveHooks(); } });
  }
  S.tab=t; render(); if(t==='calendar'){ loadSchedule(); loadCalendarEvents(); loadAgendaSchedule(); } if(t==='profile'){ loadSaved(); } if(t==='hooks'){ loadActiveHooks(); }
};
function loadActiveHooks(){
  const userNiches = S.user?.niches || [];
  if(!S.hooksNiche && userNiches.length) S.hooksNiche = userNiches[0];
  if(S.hooksNiche) window.setHooksNiche(S.hooksNiche);
}

function topBar(kicker, backTo){
  return `<div class="topbar">${backTo ? `<button class="iconbtn tipbtn" data-tip="Back" title="Back" aria-label="Back" onclick="setTab('${backTo}')" style="margin-right:8px">${I.back}</button>` : ""}<div class="brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div><div class="brand-name">CreatorPulse</div><div class="brand-sub">${esc(kicker)}</div></div></div>
    <div class="topbar-right">
      <button class="iconbtn tipbtn" data-tip="Refresh trends" title="Refresh trends" aria-label="Refresh trends" onclick="loadTrends();loadNotifs();toast('Refreshing')">${I.refresh}</button>
      <div class="bell-wrap">
        <button class="iconbtn tipbtn" data-tip="Notifications" title="Notifications" aria-label="Notifications" onclick="toggleBell(event)">${I.bell}</button>
        <span class="bell-dot ${S.notifs.length?'show':''}"></span>
        <div class="notif-dd" id="notif-dd">${S.notifs.length?S.notifs.map(n=>`<div class="notif-item"><div class="notif-niche">${esc(n.niche)}</div><div class="notif-hl">${esc(n.headline)}</div><div class="notif-time">${esc(n.time)}</div></div>`).join(""):'<div class="notif-empty">Nothing new right now.</div>'}</div>
      </div>
    </div></div>`;
}
window.toggleBell = (e) => { e.stopPropagation(); const dd = document.getElementById("notif-dd"); if(dd) dd.classList.toggle("open"); };
document.addEventListener("click", (e) => { if(!e.target.closest(".bell-wrap")){ const dd = document.getElementById("notif-dd"); if(dd) dd.classList.remove("open"); } });

function pageHome(){
  const list = S.trends.length ? `<div class="tlist">${S.trends.map(renderTrend).join("")}</div>` : skTrendList(5);
  return `<main class="page active">${topBar(`${S.trends.length||0} live stories`)}
    ${renderDigest()}
    <div class="sec-h"><h2>Today's edit</h2><span class="sec-meta">Ranked by relevance</span></div>
    ${list}
  </main>`;
}
function renderDigest(){
  if(S.errors.digest && !S.digestDismissed && S.digest) { /* fall through, card rendered below */ }
  if(!S.digest || S.digestDismissed || !(S.digest.stories||[]).length) return "";
  const rows = S.digest.stories.map(s=>`<div class="digest-row"><div class="digest-niche">${esc(s.niche)}</div>${esc(s.headline)}</div>`).join("");
  return `<div class="digest"><div class="digest-h"><div class="digest-title">Daily Digest</div><button class="tiny-copy tipbtn" data-tip="Dismiss today's digest" title="Dismiss today's digest" aria-label="Dismiss digest" onclick="dismissDigest()">Got it</button></div>${sectionErr("digest")}${rows}</div>`;
}

// ─── HOOKS PAGE ─────────────────────────────────────────────────────────────
function pageHooks(){
  const userNiches = S.user?.niches || [];
  if(!S.hooksNiche && userNiches.length) S.hooksNiche = userNiches[0];
  const active = S.hooksNiche;
  const nicheChips = userNiches.map(n=>`<button class="chip ${active===n?'active':''}" onclick="setHooksNiche('${esc(n)}')">${esc(n)}</button>`).join("");
  const hooks = S.hooksCache[active] || [];
  const q = (S.hooksSearch||"").toLowerCase();
  const filtered = q ? hooks.filter(h=>h.text.toLowerCase().includes(q)) : hooks;
  const list = filtered.length
    ? filtered.map((h,i)=>`<div class="hook-card"><div class="num">${i+1}</div><div class="txt">${esc(h.text)}</div><div class="hook-actions"><button class="tiny-copy" onclick="copyTxt(\`${h.text.replace(/`/g,'\\`')}\`)">Copy</button><button class="tiny-copy" onclick="prefillHook(\`${h.text.replace(/`/g,'\\`')}\`)">Use</button><button class="tiny-copy" onclick="openBlueprint(\`${h.text.replace(/`/g,'\\`')}\`,'${esc(active)}')">Blueprint</button></div></div>`).join("")
    : hooks.length ? `<div style="color:var(--mu);font-size:12px;padding:20px 0;text-align:center">No hooks match "${esc(S.hooksSearch)}".</div>`
    : skHookList(6);
  return `<main class="page active">${topBar("Reusable hooks")}
    <div class="sec-h"><h2>Hooks</h2><span class="sec-meta">50 per niche</span></div>
    <input class="hook-search" placeholder="Search hooks…" value="${esc(S.hooksSearch)}" oninput="S.hooksSearch=this.value;render()"/>
    ${sectionErr("hooks", `setHooksNiche('${esc(active||"")}')`)}
    <div class="hook-niche-row">${nicheChips || '<span style="color:var(--mu);font-size:12px">Add niches in Profile to see hooks.</span>'}</div>
    ${list}
    <div class="card" style="margin-top:18px">
      <div class="card-h">Check your script's uniqueness</div>
      <div style="font-size:12px;color:var(--mu);margin-bottom:10px">Paste the script you wrote yourself. We'll check it against other scripts submitted in ${esc(active||"this niche")} so you're not accidentally too close to someone else's.</div>
      <textarea class="input" rows="5" placeholder="Paste your finished script here…" style="resize:vertical;width:100%" oninput="S.uqCheck.text=this.value">${esc(S.uqCheck.text)}</textarea>
      <button class="btn bp" style="width:100%;padding:12px;justify-content:center;margin-top:10px" onclick="checkUniqueness('${esc(active||"")}')" ${S.uqCheck.loading?'disabled':''}>${S.uqCheck.loading?'Checking…':'Check uniqueness'}</button>
      ${S.uqCheck.result ? `<div class="uq-result uq-${S.uqCheck.result.verdict}"><strong>${S.uqCheck.result.similarity}% similar</strong> to another submission — ${esc(S.uqCheck.result.message)}</div>` : ''}
      ${S.uqCheck.error ? `<div class="uq-result uq-too_similar">${esc(S.uqCheck.error)}</div>` : ''}
    </div>
  </main>`;
}
window.openVideoBlueprint = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const ct = S.ctype[tid] || PTYPES[plat]?.[0] || "";
  const platLabel = PLATS.find(x=>x.id===plat)?.label || plat;
  S.sheet = { kind:"blueprint", loading:true, data:null, videoBP:true, tid, plat };
  render();
  try {
    const raw = await generateText(
      "You write VIDEO STRUCTURE, never finished sentences or example dialogue. Return ONLY valid JSON: {\"beats\":[{\"label\":\"Opening (0-3s)\",\"guidance\":\"...\"},{\"label\":\"Body\",\"guidance\":\"...\"},{\"label\":\"Purpose / close\",\"guidance\":\"...\"}]}. 'guidance' tells the creator WHAT to cover and in what order — never the literal words to say, never a quote they could copy-paste. This must work for thousands of different creators building their own video from the same story, so it has to force original wording every time.",
      `Platform: ${platLabel}. Format: ${ct}. Niche: ${t.niche}. Story: "${t.headline}". ${t.summary?('Context: '+t.summary):''}\n\nGive me a 3-part video blueprint specific to this story and this platform's format:\n1. Opening — what the first few seconds needs to establish to stop the scroll for THIS story\n2. Body — what needs to be explained, in what order, to actually deliver on the opening\n3. Purpose/close — what the video should leave the viewer with and how it should wrap up\nMake the guidance specific to this exact story, not generic advice that could apply to anything.`
    );
    const parsed = extractJSON(raw) || { beats: [] };
    S.sheet.data = parsed;
  } catch(e){ S.sheet.data = { beats: [] }; S.sheet.error = "Something went wrong — try again."; }
  S.sheet.loading = false; render();
};
window.getChatGPTPrompt = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const platLabel = PLATS.find(x=>x.id===plat)?.label || plat;
  const isYouTube = plat === "youtube";
  S.sheet = { kind:"gptprompt", loading:true, data:null, tid };
  render();
  try {
    // Two things were breaking this: (1) the composition guidance was
    // written for TikTok-style vertical scroll-stopping framing regardless
    // of platform, so a YouTube request still came back looking like a
    // TikTok prompt; (2) words like "photorealistic", "hyper-realistic",
    // and "logos" — describing real team branding as if reproducing it
    // exactly — are exactly what trips ChatGPT's own third-party-likeness
    // guardrail when you paste the prompt back in. Neither is about our
    // guardrails; it's the receiving tool's, so the fix is in the wording
    // we hand back, not in loosening anything on our end.
    const compositionGuidance = isYouTube
      ? "This is for a YOUTUBE THUMBNAIL: 16:9 landscape, one clear focal subject with a strong readable expression (shock, excitement, intensity — whatever fits the story), bold contrast so it reads as a tiny preview, and open negative space on one side where bold text will be overlaid separately. Avoid busy backgrounds that would compete with overlay text."
      : "This is for a vertical mobile scroll-stopping image (9:16): tight, immersive framing, bold central subject, dynamic angle, designed to stop a thumb mid-scroll.";
    const raw = await generateText(
      `You write ONE detailed image-generation prompt for ChatGPT/DALL-E's own image tool. Describe composition, setting, lighting, mood, and framing concretely. If the story centers on a real named person, describe them generically by role, appearance, and context (approximate build, jersey color, setting, action) rather than asserting an exact likeness — and describe team identity by color scheme and general kit style rather than naming or precisely reproducing a specific logo or crest. This isn't a limitation to apologize for, it's just how to phrase it so the prompt doesn't get flagged as reproducing a real trademark or exact likeness when pasted into an image tool. Avoid words like "photorealistic" or "hyper-realistic" paired with real branded/team imagery — describe the artistic style instead (e.g. "cinematic sports photography style"). Return ONLY the prompt text, nothing else — no preamble, no quotes around it.`,
      `Platform: ${platLabel}. Story: "${t.headline}". Niche: ${t.niche}. ${t.summary?('Context: '+t.summary):''}\n\n${compositionGuidance}\n\nWrite the image prompt for this exact story.`
    );
    S.sheet.data = raw.trim();
  } catch(e){ S.sheet.error = "Something went wrong — try again."; }
  S.sheet.loading = false; render();
};
window.openBlueprint = async (hookText, niche) => {
  S.sheet = { kind:"blueprint", loading:true, data:null, hookText, niche };
  render();
  try {
    const raw = await generateText(
      "You write SCRIPT STRUCTURE, never finished sentences. Return ONLY valid JSON: {\"beats\":[{\"label\":\"Hook (0-3s)\",\"guidance\":\"...\"},{\"label\":\"Setup\",\"guidance\":\"...\"},{\"label\":\"Turn\",\"guidance\":\"...\"},{\"label\":\"Payoff/CTA\",\"guidance\":\"...\"}]}. Each 'guidance' field tells the creator WHAT to say and in what order — never the exact words to say. No markdown, no example dialogue, no quotes of what they should literally say.",
      `Niche: ${niche}. Hook/topic: "${hookText}". Give me a 4-beat script structure for a short-form video built around this hook, as guidance only — this needs to work for thousands of different creators writing their own words from the same structure, so it must never suggest literal phrasing.`
    );
    const parsed = extractJSON(raw) || { beats: [] };
    S.sheet.data = parsed;
  } catch(e){ S.sheet.data = { beats: [] }; S.sheet.error = "Something went wrong — try again."; }
  S.sheet.loading = false; render();
};
window.checkUniqueness = async (niche) => {
  const text = S.uqCheck.text.trim();
  if(text.split(/\s+/).length < 15){ S.uqCheck.error = "Paste at least ~15 words of your script to check."; S.uqCheck.result = null; render(); return; }
  S.uqCheck.loading = true; S.uqCheck.error = null; S.uqCheck.result = null; render();
  try {
    const r = await api("/api/check-uniqueness", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token, niche, text})});
    if(r.error){ S.uqCheck.error = r.error; }
    else { S.uqCheck.result = r; }
  } catch(e){ S.uqCheck.error = "Couldn't check right now — try again."; }
  S.uqCheck.loading = false; render();
};
window.setHooksNiche = async (n) => {
  S.hooksNiche = n; render();
  if(!S.hooksCache[n]){
    try { const d = await api(`/api/hooks?niche=${encodeURIComponent(n)}`); cacheSet("hooksCache", n, d.hooks||[]); render(); } catch(e){ S.errors.hooks = "Couldn't load hooks."; render(); }
  }
};
window.prefillHook = (txt) => { S.tab='home'; toast("Hook copied — pick a story to remix"); navigator.clipboard.writeText(txt); render(); };

// ─── REMIX / TITLE PACK BOTTOM SHEETS ───────────────────────────────────────
window.openRemix = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const cachedRemix = S.remixCache[t.headline];
  if(cachedRemix){ S.sheet = { kind:"remix", tid, loading:false, data:cachedRemix }; render(); return; }
  S.sheet = { kind:"remix", tid, loading:true, data:null }; render();
  try {
    const raw = await generateText("Return ONLY a JSON array of 5 objects: [{\"angle\":\"...\",\"desc\":\"1-2 sentences on how to shoot it\"}]. No markdown.", `Give me 5 different content angles for a ${t.niche} creator on this story: \"${t.headline}\". Vary format and POV.`);
    const parsed = extractJSON(raw) || [];
    S.sheet.data = Array.isArray(parsed) ? parsed : [];
    if(S.sheet.data.length) cacheSet("remixCache", t.headline, S.sheet.data);
  } catch(e){ S.sheet.data = []; S.sheet.error = "Something went wrong — try again."; }
  S.sheet.loading = false; render();
};
window.openTitles = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const cachedTitles = S.titleCache[t.headline];
  if(cachedTitles){ S.sheet = { kind:"titles", tid, loading:false, data:cachedTitles }; render(); return; }
  S.sheet = { kind:"titles", tid, loading:true, data:null }; render();
  try {
    const raw = await generateText("Return ONLY valid JSON: {\"titles\":[5 strings],\"hashtags\":[15 strings without # prefix]}. No markdown.", `Story: \"${t.headline}\". Niche: ${t.niche}. Generate 5 scroll-stopping titles and 15 hashtags for a creator.`);
    const parsed = extractJSON(raw) || { titles:[], hashtags:[] };
    S.sheet.data = parsed;
    if((parsed.titles||[]).length) cacheSet("titleCache", t.headline, parsed);
  } catch(e){ S.sheet.data = {titles:[], hashtags:[]}; S.sheet.error = "Something went wrong — try again."; }
  S.sheet.loading = false; render();
};
window.closeSheet = () => { S.sheet = null; render(); };
window.copyAllHashtags = (tags) => {
  const txt = tags.map(t=>'#'+t.replace(/^#/,'')).join(' ');
  navigator.clipboard.writeText(txt); toast("All hashtags copied");
};
window.quickSaveTrend = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t||!S.token) return;
  const today = new Date(); const sd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const r = await api("/api/save-post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,headline:t.headline,niche:t.niche,platform:plat,contentType:"Story",content:{headline:t.headline,summary:t.summary},scheduledDate:sd})});
  if(r.success){ toast("Saved to Calendar"); loadSaved(); loadSchedule(); }
};

function renderSheet(){
  if(!S.sheet) return "";
  const sh = S.sheet;
  let body = "";
  if(sh.loading){
    body = sh.kind==='remix' ? skTextBlock(5) : skTextBlock(4);
  } else if(sh.kind==='remix'){
    const items = (sh.data||[]);
    body = items.length ? items.map((x,i)=>{
      const angle = esc(x.angle||"");
      const desc = esc(x.desc||"");
      const cp = (x.angle+" — "+x.desc).replace(/`/g,'\`');
      return `<div class="remix-item"><div class="idx">${i+1}</div><div class="body"><div style="font-weight:600;margin-bottom:3px">${angle}</div><div style="color:var(--mu);font-size:12px">${desc}</div></div><button class="tiny-copy" onclick="copyTxt(\`${cp}\`)">Copy</button></div>`;
    }).join("") : `<div style="color:var(--mu);font-size:12px">No angles — try again.</div>`;
  } else if(sh.kind==='blueprint'){
    const beats = (sh.data?.beats||[]);
    body = beats.length ? `<div style="font-size:12px;color:var(--mu);margin-bottom:14px">This is structure, not a script — write each beat in your own words. That's what keeps it yours.</div>` +
      beats.map((b,i)=>`<div class="remix-item"><div class="idx">${i+1}</div><div class="body"><div style="font-weight:600;margin-bottom:3px">${esc(b.label||"")}</div><div style="color:var(--mu);font-size:12px">${esc(b.guidance||"")}</div></div></div>`).join("")
      : `<div style="color:var(--mu);font-size:12px">Couldn't build a structure — try again.</div>`;
  } else if(sh.kind==='gptprompt'){
    const txt = sh.data || "";
    body = txt ? `<div style="font-size:12px;color:var(--mu);margin-bottom:12px">Paste this into ChatGPT, DALL-E, or any image tool you already have access to — for when you need an exact face or character our free generator can't nail.</div>
      <div class="field"><textarea class="input" rows="8" readonly style="width:100%;resize:vertical;font-size:13px">${esc(txt)}</textarea></div>
      <button class="btn bp" style="width:100%;padding:12px;justify-content:center;margin-top:10px" onclick="copyTxt(\`${txt.replace(/`/g,'\\`')}\`)">${I.dl} Copy prompt</button>`
      : `<div style="color:var(--mu);font-size:12px">Couldn't write a prompt — try again.</div>`;
  } else {
    const d = sh.data||{};
    const titles = (d.titles||[]).map((t,i)=>{
      const safe = String(t).replace(/`/g,'\`');
      return `<div class="title-item"><div class="idx">${i+1}</div><div class="body">${esc(t)}</div><button class="tiny-copy" onclick="copyTxt(\`${safe}\`)">Copy</button></div>`;
    }).join("");
    const tags = d.hashtags || [];
    const tagsHTML = tags.length ? `<div style="margin-top:14px"><div class="chip-label" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">Hashtags · ${tags.length}<button class="tiny-copy" onclick='copyAllHashtags(${JSON.stringify(tags).replace(/'/g,"&#39;")})'>Copy All</button></div><div class="hashwrap">${tags.map(t=>`<span class="h" onclick="copyTxt('#${esc(t.replace(/^#/,''))}')">#${esc(t.replace(/^#/,''))}</span>`).join("")}</div></div>` : "";
    body = titles + tagsHTML;
  }
  const sheetErr = sh.error ? errCard(sh.error, sh.kind==='remix'?`openRemix('${sh.tid}')`:sh.kind==='blueprint'?(sh.videoBP?`openVideoBlueprint('${sh.tid}')`:`openBlueprint(\`${(sh.hookText||'').replace(/`/g,'\\`')}\`,'${esc(sh.niche||'')}')`):sh.kind==='gptprompt'?`getChatGPTPrompt('${sh.tid}')`:`openTitles('${sh.tid}')`) : "";
  const sheetTitle = sh.kind==='remix'?'Remix — 5 angles':sh.kind==='blueprint'?(sh.videoBP?'Video Blueprint':'Script Blueprint'):sh.kind==='gptprompt'?'Prompt for ChatGPT/DALL-E':'Title Pack';
  return `<div class="sheet-overlay open" onclick="if(event.target===this)closeSheet()">
    <div class="sheet"><div class="sheet-grip"></div>
      <div class="sheet-h"><h3>${sheetTitle}</h3><button class="sheet-close" onclick="closeSheet()">×</button></div>
      ${sheetErr}
      ${body}
    </div>
  </div>`;
}

// Combines niche events (full year, all of them) with the user's own
// scheduled posts (rolling multi-month fetch) into one sorted, future-only
// list — the shared data source for both Agenda and Week views.
function getUnifiedAgendaItems(){
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = [];
  (S.user?.niches||[]).forEach(n => (S.eventsCache[n]||[]).forEach(e => {
    items.push({ date: e.date, title: e.title, desc: e.description, type: "event", niche: n, importance: e.importance || "seasonal" });
  }));
  mergeWithPending(S.agendaSchedule, S.pendingSchedule).forEach(p => {
    items.push({ date: p.scheduled_date, title: p.headline, desc: p.niche, type: "post", id: p.id, niche: p.niche });
  });
  return items
    .filter(it => it.date && new Date(it.date) >= todayStart)
    .sort((a,b) => new Date(a.date) - new Date(b.date));
}
// Shared between Agenda and Week views so an event/post looks identical
// wherever it appears. User posts get the app's own purple/gradient
// language; major niche events get a stronger accent; ordinary events stay
// neutral — the spec's "this is MY content vs. something happening in my
// niche" distinction.
function renderAgendaItem(it){
  const isPost = it.type === "post";
  const isMajor = it.importance === "major";
  const badge = isPost ? "" : isMajor ? "🔥 " : it.importance === "relevant" ? "📌 " : "🗓 ";
  const cls = isPost ? "agenda-item-post" : isMajor ? "agenda-item-major" : "agenda-item-event";
  const dt = new Date(it.date);
  const timeStr = isPost && it.date.includes("T") ? dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : null;
  const payload = JSON.stringify({title:it.title, desc:it.desc, niche:it.niche, date:it.date}).replace(/'/g,"&#39;");
  return `<div class="agenda-item ${cls}">
    <div class="agenda-item-date"><div class="m">${M_SHORT[dt.getMonth()]}</div><div class="d">${dt.getDate()}</div></div>
    <div class="agenda-item-body">
      <div class="agenda-item-title">${badge}${esc(it.title)}</div>
      ${it.niche?`<div class="agenda-item-niche">${esc(it.niche)}${isPost?' · Scheduled'+(timeStr?' · '+timeStr:''):''}</div>`:''}
      ${it.desc && !isPost ?`<div class="agenda-item-desc">${esc(it.desc)}</div>`:''}
    </div>
    ${isPost
      ? `<button class="iconbtn tipbtn" data-tip="Remove" title="Remove" aria-label="Remove ${esc(it.title)}" onclick="deleteScheduleItem('${it.id}')">${I.trash}</button>`
      : `<button class="tiny-copy" onclick='createFromEvent(${payload})'>Create</button>`
    }
  </div>`;
}
function renderAgendaView(){
  const items = getUnifiedAgendaItems();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate()+1);
  const dayAfter = new Date(tomorrowStart); dayAfter.setDate(dayAfter.getDate()+1);

  const todayItems = items.filter(it => { const d=new Date(it.date); return d>=todayStart && d<tomorrowStart; });
  const tomorrowItems = items.filter(it => { const d=new Date(it.date); return d>=tomorrowStart && d<dayAfter; });
  const laterItems = items.filter(it => new Date(it.date) >= dayAfter).slice(0, 20);

  const group = (label, arr) => arr.length ? `<div class="agenda-group">
    <div class="agenda-group-hd">${label}<span class="agenda-group-sub">${arr.length} ${arr.length===1?'thing':'things'}</span></div>
    ${arr.map(renderAgendaItem).join("")}
  </div>` : "";

  if(!todayItems.length && !tomorrowItems.length && !laterItems.length){
    return `<div class="cal-empty">
      <div class="cal-empty-icon">🗓</div>
      <div class="cal-empty-title">Nothing scheduled yet</div>
      <div class="cal-empty-sub">Your niche events and any posts you schedule will show up here.</div>
      <button class="btn bp" style="margin-top:14px" onclick="openScheduleSheet()">${I.plus} Schedule a post</button>
    </div>`;
  }
  return `${group("Today", todayItems)}${group("Tomorrow", tomorrowItems)}${group("Upcoming", laterItems)}`;
}
function renderWeekView(){
  const items = getUnifiedAgendaItems();
  const now = new Date();
  const weekStart = S.calWeekStart ? new Date(S.calWeekStart) : (() => { const d=new Date(now); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d; })();
  const days = Array.from({length:7}).map((_,i) => { const d=new Date(weekStart); d.setDate(d.getDate()+i); return d; });
  const selected = S.calWeekSelected ? new Date(S.calWeekSelected+'T00:00:00') : now;

  const strip = days.map(d => {
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayItems = items.filter(it => it.date.slice(0,10) === iso);
    const isToday = d.toDateString() === now.toDateString();
    const isSel = d.toDateString() === selected.toDateString();
    return `<button class="week-day ${isSel?'sel':''} ${isToday?'today':''}" onclick="selectWeekDay('${iso}')">
      <div class="week-day-lbl">${DAYS[d.getDay()]}</div>
      <div class="week-day-num">${d.getDate()}</div>
      ${dayItems.length ? `<div class="week-day-dot ${dayItems.some(x=>x.importance==='major')?'major':''}"></div>` : ''}
    </button>`;
  }).join("");

  const selIso = `${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}`;
  const selItems = items.filter(it => it.date.slice(0,10) === selIso);

  return `
    <div class="week-strip">
      <button class="iconbtn tipbtn" data-tip="Previous week" title="Previous week" aria-label="Previous week" onclick="weekNav(-1)">‹</button>
      <div class="week-days">${strip}</div>
      <button class="iconbtn tipbtn" data-tip="Next week" title="Next week" aria-label="Next week" onclick="weekNav(1)">›</button>
    </div>
    <div class="agenda-group">
      <div class="agenda-group-hd">${selected.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
      ${selItems.length ? selItems.map(renderAgendaItem).join("") : `<div class="cal-empty-inline">Nothing on this day yet.</div>`}
    </div>
  `;
}
window.weekNav = (dir) => {
  const now = new Date();
  const cur = S.calWeekStart ? new Date(S.calWeekStart) : (() => { const d=new Date(now); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d; })();
  cur.setDate(cur.getDate() + dir*7);
  S.calWeekStart = cur.toISOString().slice(0,10);
  S.calWeekSelected = null;
  render();
};
window.selectWeekDay = (iso) => { S.calWeekSelected = iso; render(); };
function renderMonthView(){
  const y = S.cal.y, m = S.cal.m;
  const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const today = new Date();
  const isCur = today.getFullYear()===y && today.getMonth()===m;
  const itemsByDate = {};
  mergeWithPending(S.schedule, S.pendingSchedule).forEach(p=>{ if(p.scheduled_date){ const dt = new Date(p.scheduled_date); if(dt.getFullYear()===y && dt.getMonth()===m){ const d = dt.getDate(); (itemsByDate[d]=itemsByDate[d]||[]).push({label:p.headline, kind:'post', id:p.id}); } } });
  (S.user?.niches||[]).forEach(n => (S.eventsCache[n]||[]).forEach(e => {
    const ed = new Date(e.date);
    if(ed.getFullYear()===y && ed.getMonth()===m) (itemsByDate[ed.getDate()]=itemsByDate[ed.getDate()]||[]).push({label:e.title, kind:'event'});
  }));
  let grid = DAYS.map(d=>`<div class="cal-day-lbl">${d}</div>`).join("");
  for(let i=0;i<first;i++) grid += `<div></div>`;
  for(let d=1;d<=days;d++){
    const items = itemsByDate[d]||[];
    const first_ = items[0];
    const tod = isCur && d===today.getDate();
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    // Separate from "today" — this is whichever date the user actually
    // tapped, kept in sync with the quick-add form below so the highlight
    // and the form's date can never show two different days at once.
    const sel = S.quickAdd && S.quickAdd.date === iso;
    const tag = first_ ? `<div class="cal-tag cal-tag-${first_.kind}">${esc(first_.label.length>16?first_.label.slice(0,15)+'…':first_.label)}</div>` : '';
    grid += `<div class="cal-cell ${items.length?'has':''} ${tod?'today':''} ${sel?'selected':''}" onclick='openQuickAdd("${iso}", ${JSON.stringify(items.filter(x=>x.kind==='post')).replace(/'/g,"&#39;")})'><span class="cal-daynum">${d}</span>${tag}</div>`;
  }
  return `<div class="card">
      <div class="cal-hd">
        <h3>${MONTHS[m]} ${y}</h3>
        <div style="display:flex;gap:4px">
          <button class="iconbtn tipbtn" data-tip="Previous month" title="Previous month" aria-label="Previous month" onclick="calNav(-1)">‹</button>
          <button class="iconbtn tipbtn" data-tip="Next month" title="Next month" aria-label="Next month" onclick="calNav(1)">›</button>
        </div>
      </div>
      <div class="cal-grid">${grid}</div>
    </div>
    ${S.quickAdd ? `<div class="card">
      <div class="card-h">Add something for ${esc(new Date(S.quickAdd.date+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric'}))}?</div>
      ${(S.quickAdd.existing||[]).length ? `<div style="margin-bottom:12px">${S.quickAdd.existing.map(x=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--br,#2c2c2c)"><span style="font-size:13px">${esc(x.label)}</span><button class="iconbtn tipbtn" data-tip="Remove" title="Remove" aria-label="Remove ${esc(x.label)}" onclick="deleteScheduleItem('${x.id}')">${I.trash||'✕'}</button></div>`).join("")}</div>` : ''}
      <div class="field"><label>What are you doing</label><input class="input" placeholder="Go live · Post reel · Record podcast" value="${esc(S.quickAdd.title)}" oninput="S.quickAdd.title=this.value" autofocus/></div>
      <div class="field"><label>Time</label><input class="input" type="time" value="${esc(S.quickAdd.time||'12:00')}" oninput="S.quickAdd.time=this.value"/></div>
      <div style="display:flex;gap:8px">
        <button class="btn bp" style="flex:1;padding:12px;justify-content:center" onclick="saveQuickAdd()">${I.plus} Yes, add it</button>
        <button class="btn" style="padding:12px 16px" onclick="S.quickAdd=null; render();">Cancel</button>
      </div>
    </div>` : ''}`;
}
function renderScheduleSheet(){
  if(!S.scheduleSheetOpen) return "";
  const asch = S.addSched;
  return `<div class="sheet-overlay open" onclick="if(event.target===this)closeScheduleSheet()">
    <div class="sheet"><div class="sheet-grip"></div>
      <div class="sheet-h"><h3>Schedule a post</h3><button class="sheet-close" onclick="closeScheduleSheet()">×</button></div>
      <div class="field"><label>What are you doing</label><input class="input" placeholder="Go live · Post reel · Record podcast" value="${esc(asch.title)}" oninput="S.addSched.title=this.value" autofocus/></div>
      <div style="display:flex;gap:8px">
        <div class="field" style="flex:1"><label>Every</label><select class="input" onchange="S.addSched.weekday=this.value">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d=>`<option value="${d.toLowerCase()}" ${asch.weekday===d.toLowerCase()?'selected':''}>${d}</option>`).join("")}</select></div>
        <div class="field" style="flex:1"><label>Time</label><input class="input" type="time" value="${esc(asch.time)}" oninput="S.addSched.time=this.value"/></div>
      </div>
      <button class="btn bp" style="width:100%;padding:12px;justify-content:center" onclick="addRecurring()">${I.plus} Add for next 12 months</button>
    </div>
  </div>`;
}
window.openScheduleSheet = () => { S.scheduleSheetOpen = true; render(); };
window.closeScheduleSheet = () => { S.scheduleSheetOpen = false; render(); };
window.setCalView = (v) => { S.calView = v; render(); };
// Hands off to the EXISTING generation pipeline rather than building a
// second one — synthesizes a trend-shaped object from the event, drops it
// into S.trends, and reuses the same toggle()/expand flow a live news
// story already goes through.
window.createFromEvent = (ev) => {
  const id = `evt_${Date.now()}`;
  S.trends = [{ id, headline: ev.title, summary: ev.desc || ev.title, niche: ev.niche || (S.user?.niches||[])[0] || "", image: null, score: 80, timestamp: new Date(ev.date).getTime() }, ...S.trends];
  S.tab = "home"; window.toggle(id); render();
  setTimeout(() => { document.getElementById(`trend-${id}`)?.scrollIntoView({behavior:'smooth', block:'start'}); }, 50);
};

function pageCalendar(){
  const view = S.calView || "agenda";
  return `<main class="page active">${topBar("Calendar")}
    <div class="cal-header">
      <div class="cal-title">Content Calendar</div>
      <div class="cal-sub">Plan around what's happening in your world.</div>
    </div>
    <div class="cal-view-switch">
      <button class="cal-view-btn ${view==='agenda'?'active':''}" onclick="setCalView('agenda')">Agenda</button>
      <button class="cal-view-btn ${view==='week'?'active':''}" onclick="setCalView('week')">Week</button>
      <button class="cal-view-btn ${view==='month'?'active':''}" onclick="setCalView('month')">Month</button>
    </div>
    ${view==='agenda' ? renderAgendaView() : view==='week' ? renderWeekView() : renderMonthView()}
    <button class="btn bo" style="width:100%;padding:13px;justify-content:center;margin-top:16px" onclick="openScheduleSheet()">${I.plus} Schedule Post</button>
    ${renderScheduleSheet()}
  </main>`;
}
window.calNav = (dir) => {
  S.cal.m += dir;
  if(S.cal.m < 0){ S.cal.m=11; S.cal.y--; }
  if(S.cal.m > 11){ S.cal.m=0; S.cal.y++; }
  render(); // show the new month immediately with whatever's already cached —
            // don't wait on network calls just to reflect the month change
  loadSchedule();
  loadCalendarEvents();
};
async function loadCalendarEvents(){
  // Was calling render() once per niche unconditionally — with several
  // niches resolving at different, unpredictable network speeds, a single
  // month click could fire many overlapping re-renders in quick,
  // unpredictable succession. One render, after everything has actually
  // settled, is both correct and far cheaper.
  const niches = S.user?.niches || [];
  await Promise.all(niches.map(async n => {
    if(!S.eventsCache[n]){
      try { cacheSet("eventsCache", n, await fetchEvents(n)); } catch(e){}
    }
  }));
  render();
}

