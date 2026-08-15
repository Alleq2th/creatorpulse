// ─── ICONS (Lucide-style inline SVGs) ───────────────────────────────────────
const I = {
  refresh: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M21 4v5h-5"/></svg>',
  bell: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  home: '<svg class="icon" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  cal: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  save: '<svg class="icon" viewBox="0 0 24 24"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  user: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  coach: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>',
  chevron: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
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
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const M_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["S","M","T","W","T","F","S"];
const NICHE_HANDLES = {"American Football":["AdamSchefter","RapSheet","MikeGarafolo","TomPelissero","FieldYates","NFL","ESPNNFL"],"Football/Soccer":["FabrizioRomano","ESPNFC","SkySportsPL","BBCSport","GoalNews","TheAthleticFC"],"Basketball":["ShamsCharania","WojESPN","NBA","ESPNNBA"],"Baseball":["MLB","Ken_Rosenthal","JeffPassan"],"Ice Hockey":["NHL","TSNBobMcKenzie","FriedgeHNIC"],"Tennis":["TennisChannel","atptour","WTA"],"Cricket":["ESPNcricinfo","ICC","BCCI"],"Formula 1":["F1","SkySportsF1","ScuderiaFerrari","McLarenF1"],"Boxing":["BoxingScene","DAZNBoxing","MikeCoppinger","MatchroomBoxing"],"MMA/UFC":["ufc","espnmma","arielhelwani","MMAFighting"],"WWE Wrestling":["WWE","FightfulSelect","WrestleVotes"],"Golf":["PGATOUR","GolfChannel","McIlroyRory"],"Rugby":["WorldRugby","SixNationsRugby"],"Esports":["esportscom","DotEsports","DBLTAP"],"Movies & TV":["DEADLINE","Variety","THR","FilmUpdates"],"Anime":["AnimeNewsNet","Crunchyroll"],"Celebrity Gossip":["PopCrave","PopBase","TMZ"],"Pop Culture":["PopCrave","PopBase"],"Music (Hip-Hop)":["ComplexMusic","HipHopDX","XXL","rapalert6"],"Music (Afrobeats)":["afrobeatsnews","notjustok","PulseNigeria247"],"Music (Pop)":["PopCrave","billboard"],"Music (K-Pop)":["allkpop","soompi","koreaboo"],"Console Gaming":["IGN","GameSpot","Wario64","PlayStation","Xbox"],"PC Gaming":["PCGamer","Wario64"],"AI & Tech News":["TechCrunch","WIRED","TheVerge","OpenAI"],"Gadget Reviews":["engadget","MKBHD","TheVerge"],"Cybersecurity":["briankrebs","TheHackersNews"],"Space & Science":["NASA","SpaceX"],"Crypto":["CoinDesk","Cointelegraph","WatcherGuru"],"Stock Market":["CNBC","MarketWatch"],"Business News":["Bloomberg","ReutersBiz","FT","CNBC"],"Travel":["TravelLeisure","CNTraveler"],"Food & Recipes":["NYTFood","bonappetit"],"Fitness & Gym":["MensHealthMag","WomensHealthMag"],"Streetwear":["Hypebeast","complex","Highsnobiety"],"Luxury Fashion":["Vogue","GQMagazine"],"True Crime":["oxygen"],"Political Commentary":["politico","axios"],"Entrepreneurship":["Inc","Entrepreneur"],"default":["BreakingNews","Reuters","AP"]};

const API = window.location.origin;
const SYS = "You are CreatorPulse AI, a scriptwriter for social media creators. Write in plain spoken language exactly as a person would say it on camera. Never use markdown: no headers, no bold, no bullets, no --- rules, no JSON unless asked. Write full sentences in natural paragraphs the way someone actually talks. Only use bracketed labels like [HOOK] or [CTA] when asked. Be specific, punchy, and direct. No meta-commentary, no preamble. Output the spoken words themselves, ready for a teleprompter.";

// ─── STATE ──────────────────────────────────────────────────────────────────
const S = {
  mode: "boot", // boot | auth | onboard | app
  authTab: "login", // login | signup
  authForm: { email:"", password:"", name:"" },
  authErr: "", authMsg: "", authLoading: false, token: null, refreshToken: null, user: null,
  onboard: { step:0, name:"", niches:[], platforms:[], primary:"", ppd:3 },
  tab: "home",
  trends: [], notifs: [], schedule: [], saved: [], eventsCache: {},
  loading: {}, expanded: {}, plat: {}, ctype: {}, tone: {}, outs: {}, recs: {},
  cal: { y: new Date().getFullYear(), m: new Date().getMonth() },
  coachHandle: "", coachPlatform: "instagram", coachMetrics: "", coachAnswer: "", coachLoading: false,
  addSched: { title:"", weekday:"friday", time:"20:00", notes:"" },
  quickAdd: null, // { date: "YYYY-MM-DD", title: "" } — set when a specific calendar day is tapped
  hooksNiche: null, hooksSearch: "", hooksCache: {},
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

// ─── API ────────────────────────────────────────────────────────────────────
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
async function bootApp(){ render(); loadTrends(); loadNotifs(); loadSchedule(); loadSaved(); loadDigest(); startGlobalTimer(); initPush(); }

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
  const plats = S.user?.platforms || ['instagram'];
  const hay = ((t.headline||'')+' '+(t.summary||'')).toLowerCase();
  if(/dance|challenge|viral|tiktok/.test(hay) && plats.includes('tiktok')) return 'tiktok';
  if(/photo|carousel|aesthetic|fashion/.test(hay) && plats.includes('instagram')) return 'instagram';
  if(/explain|breakdown|analysis|review/.test(hay) && plats.includes('youtube')) return 'youtube';
  if(/take|debate|breaking/.test(hay) && plats.includes('twitter')) return 'twitter';
  return S.user?.primaryPlatform || plats[0] || 'instagram';
}
function trendOpportunity(t){
  const v = trendVelocity(t);
  const s = t.score || 90;
  const boost = v.state==='rising'? 8 : v.state==='peaking'? 0 : -18;
  return Math.max(20, Math.min(100, s + boost - 40));
}


async function loadTrends(){
  if(!S.user) return;
  const now = Date.now(); const cutoff = now - 6*60*60*1000;
  S.trends = []; render();
  const all = [];
  for(const niche of S.user.niches){
    try { const arr = await fetchNews(niche); all.push(...arr); } catch(e){}
    try { const arr = await fetchBlogs(niche); all.push(...arr); } catch(e){}
    const handles = NICHE_HANDLES[niche] || NICHE_HANDLES.default;
    for(const h of handles.slice(0,4)){
      try {
        const arr = await fetchTwitter(h, niche);
        arr.forEach(a=>{ a.niche = niche; if(a.image && !/^https?:/.test(a.image)) a.image = 'https://nitter.net'+a.image; if(a.image) a.image = `${API}/api/image-proxy?url=${encodeURIComponent(a.image)}`; });
        all.push(...arr);
      } catch(e){}
    }
  }
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
async function loadSchedule(){ if(!S.token) return; try{ const d = await api(`/api/schedule?token=${S.token}&year=${S.cal.y}&month=${S.cal.m+1}`); S.schedule = d.posts||[]; render(); }catch(e){} }
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
      <div class="action-row">
        <button class="action-btn primary" ${load?'disabled':''} onclick="gen('${t.id}',false)">${load?'<span class="sp"></span>':I.bolt}<span>${load?'…':'Generate'}</span></button>
        <button class="action-btn" onclick="openRemix('${t.id}')">${I.remix}<span>Remix</span></button>
        <button class="action-btn" onclick="openTitles('${t.id}')">${I.title}<span>Titles</span></button>
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
    return `<div class="oc"><div class="oh"><span class="ol">Image</span></div><div style="padding:10px"><img loading="lazy" decoding="async" src="${o.img}" style="width:100%;border-radius:6px"/></div><div class="ofoot"><button class="btn bo bxs tipbtn" data-tip="Download image" title="Download image" aria-label="Download image" onclick="dl('${o.img}','image.jpg')">${I.dl} Download</button><button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
  }
  if(o.type === "carousel"){
    const slides = (o.slides||[]).map(s=>`<div style="padding:8px 0;border-bottom:1px solid var(--br)"><div style="font-size:10px;color:var(--mu);font-weight:600">Slide ${s.slideNum}</div>${s.img?`<img loading="lazy" decoding="async" src="${s.img}" style="width:100%;border-radius:6px;margin-top:6px;aspect-ratio:4/5;object-fit:cover"/>`:""}<div style="font-family:var(--serif);font-size:14px;font-weight:600;margin-top:6px">${esc(s.title)}</div><div style="font-size:12px;color:var(--mu);margin-top:3px;line-height:1.5">${esc(s.body)}</div></div>`).join("");
    const cp = (o.slides||[]).map(s=>`SLIDE ${s.slideNum}: ${s.title}\n${s.body}`).join("\n\n");
    return `<div class="oc"><div class="oh"><span class="ol">Carousel · ${o.slides?.length||0} slides</span><button class="btn bo bxs tipbtn" data-tip="Copy carousel text" title="Copy carousel text" aria-label="Copy carousel text" onclick="copyTxt(\`${cp.replace(/`/g,"\\`")}\`)">${I.copy}</button></div><div style="padding:10px">${slides}</div><div class="ofoot"><button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
  }
  const content = String(o.content||"");
  return `<div class="oc"><div class="oh"><span class="ol">${esc(o.label||"Draft")}</span><button class="btn bo bxs tipbtn" data-tip="Copy draft" title="Copy draft" aria-label="Copy draft" onclick="copyTxt(\`${content.replace(/`/g,"\\`")}\`)">${I.copy}</button></div><div class="ob">${esc(content)}</div><div class="ofoot"><button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button></div></div>`;
}

window.setPlat = (tid,p) => { S.plat[tid]=p; S.ctype[tid]=PTYPES[p]?.[0]||""; render(); };
window.setCT = (tid,c) => { S.ctype[tid]=c; render(); };
window.setTone = (tid,t) => { S.tone[tid]=t; render(); };
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
      if(c === "IG Carousel"){
        const sr = await generateText(`Return ONLY a valid JSON array of 5 objects: [{"slideNum":1,"title":"hook","body":"2-3 sentences"}].`, `${S.user?.niches?.[0]||""} carousel. Story: "${t.headline}". ${t.summary||""}`, tone);
        const slides = extractJSON(sr) || [];
        const slideArr = Array.isArray(slides)?slides:[slides];
        // Also generate 5 matching images for the carousel
        let imgs = [];
        try { imgs = await generateImage(`${t.headline}, ${t.niche}, editorial magazine photo, cinematic`, "carousel", 5); } catch(e){}
        slideArr.forEach((s,i)=>{ if(imgs[i]) s.img = imgs[i]; });
        out.push({type:"carousel", slides: slideArr, images: imgs});
      } else if(c === "Thumbnail" || /image/i.test(c)){
        const aspect = aspectForContent(plat, c);
        const img = await generateImage(`${t.headline}, ${t.niche}, bold editorial thumbnail, dramatic lighting`, aspect);
        if(img) out.push({type:"image", img, aspect});
      } else {
        const P = PLATS.find(x=>x.id===plat);
        const s = await generateText(SYS, `Write a "${c}" for a ${t.niche} creator on ${P?.label||plat}. Story: "${t.headline}". ${t.summary||""}. Return only the ready-to-post text.`, tone);
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
  if(r.success){ toast(`Scheduled ${r.added} weeks`); S.addSched={title:"",weekday:"friday",time:"20:00",notes:""}; loadSchedule(); loadSaved(); }
  else toast(r.error||"Error");
};
window.openQuickAdd = (dateIso, existing) => { S.quickAdd = { date: dateIso, title: "", existing: existing||[] }; render(); };
window.saveQuickAdd = async () => {
  const q = S.quickAdd;
  if(!q?.title){ toast("Add a title"); return; }
  const niche = (S.user?.niches||[])[0] || "";
  const platform = S.user?.primaryPlatform || (S.user?.platforms||[])[0] || "instagram";
  try {
    const r = await api("/api/save-post", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      token: S.token, headline: q.title, niche, platform, contentType: "Reminder",
      content: { note: q.title }, scheduledDate: q.date
    })});
    if(r.success){ toast("Added to " + q.date); S.quickAdd = null; loadSchedule(); loadSaved(); }
    else toast(r.error || "Couldn't add");
  } catch(e){ toast("Couldn't add"); }
};
window.deleteScheduleItem = async (postId) => {
  try {
    const r = await api(`/api/delete-post?token=${encodeURIComponent(S.token)}&postId=${encodeURIComponent(postId)}`, {method:"DELETE"});
    if(r.success){
      toast("Removed");
      if(S.quickAdd) S.quickAdd.existing = (S.quickAdd.existing||[]).filter(x=>x.id!==postId);
      loadSchedule(); loadSaved(); render();
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
  if(S.mode === "boot"){ root.innerHTML = `<div class="auth-wrap"><div class="brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div><div class="brand-name">CreatorPulse</div></div></div><div style="margin-top:20px"><span class="sp"></span></div></div>`; return; }
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
    <button class="btn bp" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="${isLogin?'doLogin()':'doSignup()'}">${S.authLoading?'<span class="sp"></span>':(isLogin?"Sign in":"Create account")}</button>
    <div class="auth-switch">${isLogin?"New here?":"Already have an account?"} <a onclick="S.authTab='${isLogin?'signup':'login'}'; S.authErr=''; S.authMsg=''; render()">${isLogin?"Create one":"Sign in"}</a></div>
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
  const pageFns = { home: pageHome, hooks: pageHooks, calendar: pageCalendar, create: pageCreate, profile: pageProfile };
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
    window.pushBackState(() => { S.tab = prev; render(); if(prev==='calendar'){ loadSchedule(); loadCalendarEvents(); } if(prev==='profile'){ loadSaved(); } });
  }
  S.tab=t; render(); if(t==='calendar'){ loadSchedule(); loadCalendarEvents(); } if(t==='profile'){ loadSaved(); }
};

function topBar(kicker){
  return `<div class="topbar"><div class="brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div><div class="brand-name">CreatorPulse</div><div class="brand-sub">${esc(kicker)}</div></div></div>
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
    ? filtered.map((h,i)=>`<div class="hook-card"><div class="num">${i+1}</div><div class="txt">${esc(h.text)}</div><div class="hook-actions"><button class="tiny-copy" onclick="copyTxt(\`${h.text.replace(/`/g,'\\`')}\`)">Copy</button><button class="tiny-copy" onclick="prefillHook(\`${h.text.replace(/`/g,'\\`')}\`)">Use</button></div></div>`).join("")
    : hooks.length ? `<div style="color:var(--mu);font-size:12px;padding:20px 0;text-align:center">No hooks match "${esc(S.hooksSearch)}".</div>`
    : skHookList(6);
  return `<main class="page active">${topBar("Reusable hooks")}
    <div class="sec-h"><h2>Hooks</h2><span class="sec-meta">50 per niche</span></div>
    <input class="hook-search" placeholder="Search hooks…" value="${esc(S.hooksSearch)}" oninput="S.hooksSearch=this.value;render()"/>
    ${sectionErr("hooks", `setHooksNiche('${esc(active||"")}')`)}
    <div class="hook-niche-row">${nicheChips || '<span style="color:var(--mu);font-size:12px">Add niches in Profile to see hooks.</span>'}</div>
    ${list}
  </main>`;
}
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
  const sheetErr = sh.error ? errCard(sh.error, sh.kind==='remix'?`openRemix('${sh.tid}')`:`openTitles('${sh.tid}')`) : "";
  return `<div class="sheet-overlay open" onclick="if(event.target===this)closeSheet()">
    <div class="sheet"><div class="sheet-grip"></div>
      <div class="sheet-h"><h3>${sh.kind==='remix'?'Remix — 5 angles':'Title Pack'}</h3><button class="sheet-close" onclick="closeSheet()">×</button></div>
      ${sheetErr}
      ${body}
    </div>
  </div>`;
}

function pageCalendar(){
  const y = S.cal.y, m = S.cal.m;
  const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const today = new Date();
  const isCur = today.getFullYear()===y && today.getMonth()===m;
  const itemsByDate = {}; // d -> [{label, kind, id?}] kind: "post" (user-added, deletable) or "event" (niche event, fixed)
  S.schedule.forEach(p=>{ if(p.scheduled_date){ const dt = new Date(p.scheduled_date); if(dt.getFullYear()===y && dt.getMonth()===m){ const d = dt.getDate(); (itemsByDate[d]=itemsByDate[d]||[]).push({label:p.headline, kind:'post', id:p.id}); } } });
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
    const tag = first_ ? `<div class="cal-tag cal-tag-${first_.kind}">${esc(first_.label.length>16?first_.label.slice(0,15)+'…':first_.label)}</div>` : '';
    grid += `<div class="cal-cell ${items.length?'has':''} ${tod?'today':''}" onclick='openQuickAdd("${iso}", ${JSON.stringify(items.filter(x=>x.kind==='post')).replace(/'/g,"&#39;")})'><span class="cal-daynum">${d}</span>${tag}</div>`;
  }
  // Upcoming: pull events from cache for user niches + saved schedule
  const combined = [];
  (S.user?.niches||[]).forEach(n => (S.eventsCache[n]||[]).forEach(e => combined.push({date:e.date, title:e.title, desc:e.description, kind:"Event", niche:n})));
  S.schedule.forEach(p => combined.push({date:p.scheduled_date, title:p.headline, desc:p.niche, kind:p.content_type||"Post", id:p.id}));
  combined.sort((a,b)=> new Date(a.date) - new Date(b.date));
  const now = new Date(); const upcoming = combined.filter(x=> new Date(x.date) >= new Date(now.getFullYear(),now.getMonth(),now.getDate())).slice(0, 12);
  const events = upcoming.map(e=>{ const dt = new Date(e.date); return `<div class="event-item"><div class="event-date-badge"><div class="m">${M_SHORT[dt.getMonth()]}</div><div class="d">${dt.getDate()}</div></div><div class="event-body"><div class="event-title">${esc(e.title)}</div>${e.desc?`<div class="event-desc">${esc(e.desc)}</div>`:""}<div class="event-tag">${esc(e.kind)}${e.niche?' · '+esc(e.niche):''}</div></div>${e.id?`<button class="iconbtn tipbtn" data-tip="Remove" title="Remove" aria-label="Remove ${esc(e.title)}" onclick="deleteScheduleItem('${e.id}')">${I.trash}</button>`:''}</div>`; }).join("");

  const asch = S.addSched;
  return `<main class="page active">${topBar("Schedule")}
    <div class="sec-h"><h2>Calendar</h2></div>
    <div class="card">
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
      <div style="display:flex;gap:8px">
        <button class="btn bp" style="flex:1;padding:12px;justify-content:center" onclick="saveQuickAdd()">${I.plus} Yes, add it</button>
        <button class="btn" style="padding:12px 16px" onclick="S.quickAdd=null; render();">Cancel</button>
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-h">Add to your schedule</div>
      <div class="field"><label>What are you doing</label><input class="input" placeholder="Go live · Post reel · Record podcast" value="${esc(asch.title)}" oninput="S.addSched.title=this.value"/></div>
      <div style="display:flex;gap:8px">
        <div class="field" style="flex:1"><label>Every</label><select class="input" onchange="S.addSched.weekday=this.value">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d=>`<option value="${d.toLowerCase()}" ${asch.weekday===d.toLowerCase()?'selected':''}>${d}</option>`).join("")}</select></div>
        <div class="field" style="flex:1"><label>Time</label><input class="input" type="time" value="${esc(asch.time)}" oninput="S.addSched.time=this.value"/></div>
      </div>
      <button class="btn bp" style="width:100%;padding:12px;justify-content:center" onclick="addRecurring()">${I.plus} Add for next 12 months</button>
    </div>
    <div class="card">
      <div class="card-h">Upcoming</div>
      ${events || `<div style="color:var(--mu);font-size:12px">Your niche events and scheduled posts will show here.</div>`}
    </div>
  </main>`;
}
window.calNav = (dir) => {
  S.cal.m += dir;
  if(S.cal.m < 0){ S.cal.m=11; S.cal.y--; }
  if(S.cal.m > 11){ S.cal.m=0; S.cal.y++; }
  loadSchedule();
  loadCalendarEvents();
};
function loadCalendarEvents(){
  (S.user?.niches||[]).forEach(async n => { if(!S.eventsCache[n]){ try { cacheSet("eventsCache", n, await fetchEvents(n)); } catch(e){} } render(); });
}

