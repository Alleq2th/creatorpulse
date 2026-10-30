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
const PTYPES = {tiktok:["TikTok Script","TikTok No-Face Graphic","TikTok Silent Camera","Caption + Hashtags"],instagram:["IG Reel Script","IG Carousel","Caption + Hashtags"],youtube:["Long Form Script","YouTube Short Script","Title + Description","Thumbnail"],twitter:["Hot Take Tweet","Engagement Tweet","Thread (5 tweets)"],facebook:["Long-Form Post","Engagement Post"],linkedin:["Thought Leadership","Professional Update"]};
const TONES = [{id:"normal",label:"Neutral"},{id:"funny",label:"Banter"},{id:"educative",label:"Educative"},{id:"hype",label:"Hot Take"},{id:"storytelling",label:"Storytelling"}];
// Gradient palette options exposed to the user — must match the PALETTE keys
// in services/statCard.js.

// ── Carousel Visual Themes, Typography, and Density Presets ─────────────
const CARD_THEMES = [
  { id: "modern_dark", label: "Modern Dark" },
  { id: "clean_light", label: "Clean Light" },
  { id: "cyber_neon", label: "Cyber Neon" },
  { id: "editorial_warm", label: "Editorial Warm" }
];

// Text layers on a single graphic. "field" is the slide property the text lives in.
const CARD_LAYERS = [
  { key: "headline", label: "Headline", field: "headline", multi: true },
  { key: "supportingText", label: "Supporting text", field: "supportingText", multi: true },
  { key: "ctaLine", label: "Call to action", field: "ctaLine", multi: false }
];
const CARD_TYPOGRAPHIES = [
  { id: "impact", label: "Impact Bold" },
  { id: "modern_sans", label: "Modern Sans" },
  { id: "editorial_serif", label: "Editorial Serif" },
  { id: "code_mono", label: "Modern Mono" },
  { id: "condensed_sans", label: "Condensed Display" },
  { id: "classic_serif", label: "Classic Editorial" }
];
const BRAND_PRESETS = {
  editorial: { label: "Editorial", palette: "electric_blue", theme: "editorial_warm", typography: "editorial_serif", name: "THE DAILY EDIT" },
  creator: { label: "Creator Bold", palette: "noir_orange", theme: "modern_dark", typography: "impact", name: "CREATORPULSE" },
  minimal: { label: "Minimal Studio", palette: "white_platinum", theme: "clean_light", typography: "modern_sans", name: "STUDIO NOTES" }
};

const CARD_DENSITIES = [
  { id: "punchy", label: "Punchy" },
  { id: "balanced", label: "Balanced" },
  { id: "detailed", label: "Detailed" }
];

const PALETTES = [
  {id:"noir_orange", label:"Noir Orange"}, {id:"electric_blue", label:"Electric Blue"}, {id:"emerald", label:"Emerald"},
  {id:"violet", label:"Violet"}, {id:"crimson", label:"Crimson"}, {id:"gold", label:"Gold"},
  {id:"hot_pink", label:"Hot Pink"}, {id:"sky_blue", label:"Sky Blue"}, {id:"deep_teal", label:"Deep Teal"},
  {id:"royal_indigo", label:"Royal Indigo"}, {id:"sunset_coral", label:"Sunset Coral"}, {id:"white_platinum", label:"White Platinum"}
];
// ── Visual metadata for the pickers + local card fallback ──
const PALETTE_VIS = {noir_orange:["#0d0d0f","#ff6a1a"],electric_blue:["#05122b","#2f7bff"],emerald:["#04170f","#18c37e"],violet:["#140a24","#9b5cff"],crimson:["#170507","#e3263b"],gold:["#141005","#f2b630"],hot_pink:["#1a0612","#ff3fa4"],sky_blue:["#061722","#3cc3ff"],deep_teal:["#03181a","#14a3a0"],royal_indigo:["#0a0b2a","#5b5ff5"],sunset_coral:["#1d0b08","#ff7a59"],white_platinum:["#f4f4f2","#1a1a1a"]};
const THEME_VIS = {modern_dark:{bg:"#111114",fg:"#ffffff",mu:"#8a8a93"},clean_light:{bg:"#fafaf7",fg:"#111111",mu:"#6b6b6b"},cyber_neon:{bg:"#07021a",fg:"#e9fbff",mu:"#7ef9ff"},editorial_warm:{bg:"#f3ebdd",fg:"#2a1d12",mu:"#8a6d4e"}};
const TYPO_VIS = {impact:{f:"Anton, Impact, sans-serif",w:400,up:true},modern_sans:{f:"Inter, Arial, sans-serif",w:800,up:false},editorial_serif:{f:"'Playfair Display', Georgia, serif",w:900,up:false},code_mono:{f:"'IBM Plex Mono', monospace",w:500,up:true},condensed_sans:{f:"'Arial Narrow', Impact, sans-serif",w:900,up:true},classic_serif:{f:"Georgia, 'Times New Roman', serif",w:700,up:false}};
const DENSITY_VIS = {punchy:1,balanced:2,detailed:4};
const FORMAT_VIS = {"Script":"🎬","Graphic":"🖼️","Carousel":"🗂️","Caption":"#️⃣","Thumbnail":"🖼️","Title":"🔤","Tweet":"💬","Thread":"🧵","Post":"📝","Thought":"💡","Update":"📣"};
const PLAT_LOGO = {
  instagram:'<svg viewBox="0 0 24 24" width="22" height="22"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" width="22" height="22"><rect width="24" height="24" rx="6" fill="#000"/><path d="M15.5 5c.4 1.7 1.6 2.9 3.3 3.1v2.6c-1.2 0-2.3-.4-3.3-1v5.2a4.6 4.6 0 1 1-4.6-4.6v2.6a2 2 0 1 0 2 2V5z" fill="#fff"/><path d="M15.5 5c.4 1.7 1.6 2.9 3.3 3.1" stroke="#25f4ee" stroke-width=".8" fill="none"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" width="22" height="22"><rect x="1" y="5" width="22" height="14" rx="4" fill="#ff0000"/><path d="M10 9v6l5-3z" fill="#fff"/></svg>',
  twitter:'<svg viewBox="0 0 24 24" width="22" height="22"><rect width="24" height="24" rx="6" fill="#000"/><path d="M6 6h3.2l3.1 4.3L16 6h1.7l-4.6 5.4L18 18h-3.2l-3.3-4.6L7.6 18H6l4.8-5.6z" fill="#fff"/></svg>',
  facebook:'<svg viewBox="0 0 24 24" width="22" height="22"><rect width="24" height="24" rx="6" fill="#1877f2"/><path d="M13.5 19v-6h2l.3-2.4h-2.3V9.2c0-.7.2-1.2 1.2-1.2h1.2V5.9a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.7h-2V13h2v6z" fill="#fff"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" width="22" height="22"><rect width="24" height="24" rx="5" fill="#0a66c2"/><path d="M7 10h2.3v7H7zM8.1 6.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM11 10h2.2v1c.4-.7 1.2-1.2 2.4-1.2 2.3 0 2.7 1.5 2.7 3.4V17H16v-3.4c0-.9 0-1.9-1.2-1.9s-1.4.9-1.4 1.9V17H11z" fill="#fff"/></svg>'
};
function svgEsc(x){ return String(x==null?"":x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function wrapLines(text, maxChars, maxLines){
  const words=String(text||"").split(/\s+/).filter(Boolean); const lines=[]; let cur="";
  for(const w of words){ if((cur+" "+w).trim().length>maxChars && cur){ lines.push(cur); cur=w; } else cur=(cur+" "+w).trim(); if(lines.length>=maxLines) break; }
  if(cur && lines.length<maxLines) lines.push(cur);
  return lines;
}
// Renders a real, legible slide card in the browser. Used whenever the
// card server is asleep/busy/fails, so a generated post never shows up
// as an empty black box in the Instagram/TikTok/YouTube/X previews.
async function localCardPhotoData(url, maxDim=1500){
  if(!url) return null;
  try {
    const img=new Image(); img.crossOrigin='anonymous';
    const loaded=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
    img.src=`${API}/api/image-proxy?url=${encodeURIComponent(url)}`; await loaded;
    const scale=Math.min(1,maxDim/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',.86);
  } catch(e){ console.warn('Could not prepare local story photo fallback',e); return null; }
}
function localCardImage(slide, opts){
  opts = opts||{};
  const pal = PALETTE_VIS[opts.palette] || PALETTE_VIS.noir_orange;
  const th = THEME_VIS[opts.theme] || THEME_VIS.modern_dark;
  const ty = TYPO_VIS[opts.typography] || TYPO_VIS.impact;
  const tall = opts.format === "tiktok";
  const W=1080, H= tall ? 1920 : 1350;
  const bg = opts.palette==="white_platinum" ? pal[0] : (opts.theme==="clean_light"||opts.theme==="editorial_warm" ? th.bg : pal[0]);
  const light = bg==="#f4f4f2"||bg===THEME_VIS.clean_light.bg||bg===THEME_VIS.editorial_warm.bg;
  const fg = light ? "#141414" : "#ffffff"; const mu = light ? "#555" : "rgba(255,255,255,.72)";
  const acc = pal[1];
  const headRaw = slide.headline || slide.claim || "";
  const head = ty.up ? headRaw.toUpperCase() : headRaw;
  const body = slide.type==="hook" ? (slide.supportingText||"") : (slide.body || slide.reaction || slide.outcome || "");
  const hSize = slide.type==="hook" ? 104 : 84;
  const hLines = wrapLines(head, Math.round(1500/hSize*(ty.up?1:1.15)), 5);
  const bLines = wrapLines(body, 38, opts.density==="punchy"?3:opts.density==="detailed"?8:5);
  let y = slide.type==="hook" ? H*0.38 : 330;
  const hl = hLines.map((l,i)=>`<text x="90" y="${y+i*hSize*1.08}" font-family="${ty.f}" font-weight="${ty.w}" font-size="${hSize}" fill="${(slide.type==='hook'&&i===0)?acc:fg}">${svgEsc(l)}</text>`).join("");
  y += hLines.length*hSize*1.08 + 50;
  const stat = slide.stat ? `<text x="90" y="${y+90}" font-family="${ty.f}" font-weight="900" font-size="140" fill="${acc}">${svgEsc(slide.stat)}</text><text x="90" y="${y+150}" font-family="Inter,sans-serif" font-size="34" fill="${mu}">${svgEsc(slide.statLabel||"")}</text>` : "";
  if(slide.stat) y += 210;
  const bl = bLines.map((l,i)=>`<text x="90" y="${y+i*52}" font-family="Inter,Arial,sans-serif" font-weight="500" font-size="40" fill="${mu}">${svgEsc(l)}</text>`).join("");
  const tag = (slide.tag||slide.sectionLabel) ? `<rect x="90" y="150" rx="22" width="${Math.min(800,(String(slide.tag||slide.sectionLabel).length*20)+60)}" height="54" fill="${acc}"/><text x="120" y="187" font-family="Inter,sans-serif" font-weight="800" font-size="28" fill="${light?'#fff':'#000'}">${svgEsc(String(slide.tag||slide.sectionLabel).toUpperCase())}</text>` : "";
  const cta = slide.ctaLine ? `<text x="90" y="${H-110}" font-family="Inter,sans-serif" font-weight="800" font-size="40" fill="${acc}">${svgEsc(slide.ctaLine)}</text>` : "";
  const num = slide.slideNumber ? `<text x="${W-90}" y="${H-110}" text-anchor="end" font-family="Inter,sans-serif" font-weight="700" font-size="32" fill="${mu}">${slide.slideNumber}${opts.total?' / '+opts.total:''}</text>` : "";
  const photo=opts.imageDataUrl||slide.customImage||slide.imageDataUrl||"";
  const photoLayer=photo?`<image href="${svgEsc(photo)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="100%" height="100%" fill="url(#shade)"/>`:`<rect width="100%" height="100%" fill="${bg}"/><circle cx="${W-60}" cy="${H*0.2}" r="380" fill="${acc}" opacity=".08"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".82"/><stop offset=".7" stop-color="#000" stop-opacity=".36"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>${photoLayer}<rect x="0" y="0" width="${W}" height="14" fill="${acc}"/>${tag}${hl}${stat}${bl}${cta}${num}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
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
const NICHE_HANDLES = {"American Football":["AdamSchefter","RapSheet","MikeGarafolo","TomPelissero","FieldYates","NFL","ESPNNFL","NFLNetwork"],"Football/Soccer":["FabrizioRomano","ESPNFC","SkySportsPL","BBCSport","GoalNews","TheAthleticFC","TouchlineX","TMuk_news"],"Basketball":["ShamsCharania","WojESPN","NBA","ESPNNBA","TheAthleticNBA","BleacherReport"],"Baseball":["MLB","Ken_Rosenthal","JeffPassan","MLBNetwork","TheAthleticMLB"],"Ice Hockey":["NHL","TSNBobMcKenzie","FriedgeHNIC","NHLNetwork","SportsCenter"],"Tennis":["TennisChannel","atptour","WTA","TennisTV","Eurosport"],"Cricket":["ESPNcricinfo","ICC","BCCI","cricbuzz","BBCCricket"],"Formula 1":["F1","SkySportsF1","ScuderiaFerrari","McLarenF1","MercedesAMGF1"],"Boxing":["BoxingScene","DAZNBoxing","MikeCoppinger","MatchroomBoxing","SecondsOut"],"MMA/UFC":["ufc","espnmma","arielhelwani","MMAFighting","MMAJunkie"],"WWE Wrestling":["WWE","FightfulSelect","WrestleVotes","WrestlingInc","PWInsidercom"],"Golf":["PGATOUR","GolfChannel","McIlroyRory","GolfDigest","EuropeanTour"],"Rugby":["WorldRugby","SixNationsRugby","planetrugby","rugbyworldcup"],"Esports":["esportscom","DotEsports","DBLTAP","ESLGaming","LiquipediaNet"],"Movies & TV":["DEADLINE","Variety","THR","FilmUpdates","IndieWire"],"Anime":["AnimeNewsNet","Crunchyroll","AnimeCornerNews","IGNAnime"],"Celebrity Gossip":["PopCrave","PopBase","TMZ","EOnline"],"Pop Culture":["PopCrave","PopBase","BuzzFeed"],"Music (Hip-Hop)":["ComplexMusic","HipHopDX","XXL","rapalert6"],"Music (Afrobeats)":["afrobeatsnews","notjustok","PulseNigeria247","Naijaloaded"],"Music (Pop)":["PopCrave","billboard","RollingStone"],"Music (K-Pop)":["allkpop","soompi","koreaboo"],"Console Gaming":["IGN","GameSpot","Wario64","PlayStation","Xbox"],"PC Gaming":["PCGamer","Wario64","IGN"],"AI & Tech News":["TechCrunch","WIRED","TheVerge","OpenAI","AndrewYNg"],"Gadget Reviews":["engadget","MKBHD","TheVerge","Gizmodo"],"Cybersecurity":["briankrebs","TheHackersNews","Google_Bugs"],"Space & Science":["NASA","SpaceX","NatGeo","ESA"],"Crypto":["CoinDesk","Cointelegraph","WatcherGuru","TheBlock__"],"Stock Market":["CNBC","MarketWatch","YahooFinance"],"Business News":["Bloomberg","ReutersBiz","FT","CNBC"],"Travel":["TravelLeisure","CNTraveler","LonelyPlanet"],"Food & Recipes":["NYTFood","bonappetit","foodandwine"],"Fitness & Gym":["MensHealthMag","WomensHealthMag","MuscleAndFitness"],"Streetwear":["Hypebeast","complex","Highsnobiety"],"Luxury Fashion":["Vogue","GQMagazine","BoF"],"True Crime":["oxygen","IDNetwork"],"Political Commentary":["politico","axios","thehill"],"Entrepreneurship":["Inc","Entrepreneur","ForbesEntre"],"default":["BreakingNews","Reuters","AP"],"Athletics/Track":["WorldAthletics","TrackGazette","FloTrack","TravisMillerX"],"Cycling":["Cyclingnewsfeed","VeloNews","letour","Inrng"],"Swimming":["SwimSwamNews","WorldAquatics","SwimmingWorld"],"Volleyball":["volleyballworld","FIVBVolleyball","CEVolleyball"],"Music (R&B)":["RatedRnB","SoulTracks","BillboardRnB","Essence"],"Music (Amapiano)":["AmapianoGrooves","MusicInAfrica","SlikourOnLife"],"Korean Drama":["soompi","allkpop","TheSeoulStory","kdramastars"],"Bollywood":["Bollyhungama","filmfare","Pinkvilla","taran_adarsh"],"Mobile Gaming":["PocketGamer","TouchArcade","DroidGamers"],"Game Reviews":["metacritic","opencritic","IGN","polygon"],"Twitch Streaming":["Dexerto","JakeSucky","StreamerAlerts","Twitch"],"YouTube Gaming":["YouTubeGaming","Dexerto","Tubefilter"],"Mental Health":["PsychToday","MindfulOnline","Calm","EverydayHealth"],"Relationships & Dating":["Bustle","Cosmopolitan","ModernLove"],"Parenting":["MotherlyMedia","TodaysParent","ParentsMagazine"],"Minimalism":["TheMinimalists","ZenHabits","BecomMinimalist"],"Home Decor":["ArchDigest","AptTherapy","HouseBeautiful"],"Pets":["dodo","CatsterMag","DogsterMag","PetMD"],"Skincare":["Allure_magazine","byrdiebeauty","DermTimesNow"],"Makeup":["Allure_magazine","byrdiebeauty","BeautyIndep"],"Haircare":["naturallycurly","Allure_magazine","ByrdieBeauty"],"Personal Finance":["NerdWallet","Kiplinger","ThePennyHoarder"],"Side Hustles":["SideHustleNews","NickLoper","Upwork"],"Real Estate Investing":["BiggerPockets","InmanNews","HousingWire"],"Budgeting":["CleverGirlMoney","TheBudgetMom","FrugalRules"],"Coding & Dev Life":["ThePracticalDev","freeCodeCamp","newsycombinator","GitHub"],"Science":["sciam","ScienceMagazine","NatureNews","LiveScience"],"History":["History","AncientOrigins","SmithsonianMag"],"Language Learning":["Babbel","Duolingo","FluentU"],"Productivity":["JamesClear","todoist","FastCompany","Lifehacker"],"Study Tips":["CollegeInfoGeek","Edutopia","StudyIntNL"],"Philosophy":["DailyStoic","AeonMag","PhilosophyNow"],"Psychology":["PsychToday","Psyche_Mag","SciAmMind"],"Yapping Videos":["PopCrave","TheCut","BuzzFeedNews"],"Hot Takes":["ringer","Deadspin","Slate"],"Rants":["Slate","Substack","Medium"],"Storytelling":["Narratively","MothStories","Longreads"],"Mystery & Unexplained":["Unexplained_M","MysteriousUniv","CoastToCoastAM"],"Viral Dances":["TikTokDances","Dexerto","KnowYourMeme"],"Trend Reaction":["knowyourmeme","Mashable","Distractify"],"Challenge Content":["Dexerto","Tubefilter","WhatsTrending"],"YouTube Growth":["CreatorHooks","vidIQ","TubeBuddy","Tubefilter"],"Social Media Tips":["SocialMedia2Day","LaterMedia","Hootsuite","SproutSocial"],"Brand Deals":["CreatorEconomy","Passionfroot","InfluencerMH"],"Monetization Advice":["TheInformation","Patreon","Substack"],"Medicine & Health":["Medscape","statnews","JAMA_current"],"Law":["LawDotCom","abovethelaw","SCOTUSblog"],"Marketing":["Adweek","AdAge","MarketingDive"],"Motivational Speaking":["Addicted2Succes","EverydayPower","SuccessMagazine"],"Faith & Religion":["CTmagazine","RNS","Sojourners"],"African Culture":["OkayAfrica","AfricanArgu","TheAfricaReport"],"Caribbean Culture":["CaribbeanLife","LoopNewsCarib","JamaicansDotCom"],"Astrology":["Astrology_com","Horoscope","AstroStyle"],"Self-Development":["tinybuddha","LifehackOrg","MindsetMentors"],"Startups":["BreakingNews","Reuters","AP"]};

// Was `window.location.origin`, i.e. "ask whatever machine served me this page".
// That is only correct when our own Express server serves the page. On a
// static-only host (GitHub Pages) it asked a file server for /api/..., got a
// 404, and that was the real reason photos, captions and notifications all
// failed there. apiBase() is the single place that decides where the brain is;
// loaded before this file, so it is always available.
const API = (typeof window.ariaApiBase === 'function' ? window.ariaApiBase() : '') || window.location.origin;
const SYS = "You are CreatorPulse AI, a scriptwriter for social media creators. Write in plain spoken language exactly as a person would say it on camera. Never use markdown: no headers, no bold, no bullets, no --- rules, no JSON unless asked. Never label or separate sections with bracketed tags like [HOOK] or [CTA] — a script is one continuous flow of speech, not labeled parts stitched together; the hook is simply how it opens, not a section of its own. Write full sentences in natural paragraphs the way someone actually talks. Be specific, punchy, and direct. No meta-commentary, no preamble. Output the spoken words themselves, ready for a teleprompter.";

// ─── STATE ──────────────────────────────────────────────────────────────────
const S = {
  mode: "boot", // boot | auth | onboard | app
  authTab: "login", // login | signup
  authForm: { email:"", password:"", name:"" },
  authErr: "", authMsg: "", authLoading: false, token: null, refreshToken: null, user: null,
  tierFilter: "all",
  lastTrendsRefresh: 0,
  onboard: { step:0, name:"", niches:[], platforms:[], primary:"", ppd:3 },
  tab: "home",
  trends: [], notifs: [], schedule: [], saved: [], eventsCache: {},
  loading: {}, expanded: {}, plat: {}, ctype: {}, tone: {}, palette: {}, slideCount: {}, cardTheme: {}, cardTypography: {}, cardDensity: {}, brandPreset: {}, focalPoint: {}, previewPlat: {}, previewSlideIdx: {}, previewMode: {}, outputEditing: {}, outs: {}, recs: {},
  cal: { y: new Date().getFullYear(), m: new Date().getMonth() },
  calView: "agenda", // agenda | week | month — agenda is the default per rebuild
  // Which calendar rows the user has tapped open. Keyed by the item's own
  // identity (post id, or "niche|title" for an event) rather than its array
  // index, so an opened row stays open across a re-render or a background
  // refresh that reorders the list.
  agendaExpanded: {},
  agendaSchedule: [], // rolling multi-month schedule fetch, separate from the month-scoped one Month view uses
  scheduleSheetOpen: false,
  // Optimistically-added items not yet confirmed by a real server fetch.
  // Kept separate from S.schedule/S.agendaSchedule entirely, and merged in
  // at render time for every view — this is what makes a newly-scheduled
  // item survive a failed or slow background refresh in Month, Week, AND
  // Agenda at once, instead of needing the same fix three separate times
  // in three separate places.
  pendingSchedule: [],
  coachHandle: "", coachPlatform: "tiktok", coachMetrics: "", coachAnswer: "", coachLoading: false,
    pulseAi: {
      open: false,
      messages: [],
      loading: false,
      platform: "tiktok",
      goal: "views",
      niche: "",
      brandVoice: "",
      input: "",
      activeAction: "chat"
    },
  addSched: { title:"", date:"", time:"20:00", notes:"" },
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
// Bump when the SHAPE of cached data changes (a new field the UI depends on).
// Without this, a browser holding an older cache keeps rendering the old data
// forever: loadCalendarEvents only refetched when a niche's cache was EMPTY,
// so a user could sit on last season's event list - with no `importance`
// field, hence no photos - while the server was returning fresh events.
const CACHE_VERSION = 2;
const CACHE_FIELDS = ["hooksCache","remixCache","titleCache","eventsCache"];
// Event lists are refetched after this long even when a cache exists, so a
// long-lived tab cannot drift permanently away from the server's data.
const EVENTS_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
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
    const payload = { _v: CACHE_VERSION };
    CACHE_FIELDS.forEach(f => { payload[f] = capCache(S[f] || {}); });
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch(e){ /* quota or private mode — cache is best-effort */ }
}
function restoreCaches(){
  try {
    const j = localStorage.getItem(CACHE_KEY);
    if(!j) return false;
    const data = JSON.parse(j) || {};
    // A cache written by an older version may be missing fields the current
    // UI needs - the events cache predating `importance` is the real case
    // that produced blank calendar photos. Drop it and let the app refetch.
    const stale = data._v !== CACHE_VERSION;
    CACHE_FIELDS.forEach(f => {
      if(stale && f === "eventsCache") return;
      if(data[f] && typeof data[f] === "object") S[f] = capCache(data[f]);
    });
    return true;
  } catch(e){ return false; }
}
// When each niche's event list was last fetched, so a stale-but-present cache
// is refreshed instead of being trusted forever.
const EVENTS_AT_KEY = "cp_events_at_v1";
function eventsAt(){ try { return JSON.parse(localStorage.getItem(EVENTS_AT_KEY) || "{}") || {}; } catch(e){ return {}; } }
function markEventsAt(niche){ try { const m = eventsAt(); m[niche] = Date.now(); localStorage.setItem(EVENTS_AT_KEY, JSON.stringify(m)); } catch(e){} }
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

// ── BACKEND REACHABILITY ───────────────────────────────────────────────
// Render's free tier sleeps a web service after ~15 minutes with no traffic
// and takes up to a minute to wake; a service whose free hours ran out (or
// that was switched off) answers 503 until someone presses Resume in the
// Render dashboard. Both used to show up as a blank calendar with no
// explanation at all. This asks /api/health once per load, says in plain
// words what is happening, and keeps re-checking until the server answers.
const CP_OFFLINE_MSG = "Can't reach the CreatorPulse server right now, so photos, captions and news won't load. If it was just asleep it should be awake in about a minute — this page checks by itself.";

function ariaBootNotice(){
  const st = (S.backend && S.backend.state) || "unknown";
  if(st === "ok" || st === "unknown") return "";
  if(st === "suspended"){
    return '<div class="cp-server-note cp-server-warn">CreatorPulse\'s server is switched off right now, so photos, captions and news can\'t load. Whoever runs it needs to open the Render dashboard and press <b>Resume</b> on the <b>creatorpulse</b> service. <b>Also make sure you are opening the app at the Render address itself</b> (' + esc((S.backend && S.backend.base) || "") + ') — an address that only serves files can never reach the server.</div>';
  }
  if(st === "waking"){
    return '<div class="cp-server-note">Waking the server up… photos, captions and news should start working in about a minute. Everything else already works.</div>';
  }
  return '<div class="cp-server-note">' + esc(CP_OFFLINE_MSG) + '</div>';
}

function ariaPaintBootNotice(){
  let host = document.getElementById("cp-server-note-host");
  if(!host){
    host = document.createElement("div");
    host.id = "cp-server-note-host";
    const rootEl = document.getElementById("root");
    if(rootEl && rootEl.parentNode) rootEl.parentNode.insertBefore(host, rootEl);
    else document.body.appendChild(host);
  }
  const html = ariaBootNotice();
  host.innerHTML = html;
  host.style.display = html ? "" : "none";
}

async function ariaAnnounceBackend(){
  if(typeof window.ariaHealth !== "function") return; // apiBase.js not loaded
  S.backend = S.backend || { state: "unknown", base: "" };
  // The machine that served THIS page. If that is our own Express server, then
  // it IS the backend and this probe cannot go stale - which matters because a
  // remembered address can outlive a renamed (or retired) service and produce a
  // misleading "server is switched off" notice while the server is fine.
  const self = (typeof window.ariaSelfBase === "function") ? window.ariaSelfBase() : "";
  try {
    let h = self ? await window.ariaHealth(12000, self) : null;
    if(!(h && h.ok)){
      // The page's own host did not answer as a backend. Only now is the
      // resolved/remembered address worth asking.
      h = await window.ariaHealth(12000);
    }
    if(h && h.ok){ S.backend.state = "ok"; S.backend.base = h.base; return; }
    if(h && h.status === 503){
      // /api/health always answers 200 when our own server is up, so a 503
      // here means the host itself is down — i.e. Render suspended it.
      S.backend.state = "suspended"; S.backend.base = h.base || "";
      ariaPaintBootNotice(); return;
    }
    S.backend.state = "waking"; S.backend.base = (h && h.base) || "";
    ariaPaintBootNotice();
    for(let i = 0; i < 3; i++){
      h = await window.ariaHealth(90000);
      if(h && h.ok){
        S.backend.state = "ok"; S.backend.base = h.base;
        ariaPaintBootNotice();
        toast("Server is awake: photos and captions will load now.");
        return;
      }
      if(h && h.status === 503){ S.backend.state = "suspended"; S.backend.base = h.base || ""; ariaPaintBootNotice(); return; }
    }
    S.backend.state = "offline";
    ariaPaintBootNotice();
  } catch(e){ /* a reachability notice failing must never break the app */ }
}
function esc(s){ return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
window.cardImgFail = function(el, fb){ if(fb && el.src !== fb){ el.onerror=null; el.src = fb; } };
window.imgFail = function(el){ try { const ph = document.createElement('div'); ph.className = 'timg-ph'; ph.innerHTML = I.news; if(el && el.parentNode) el.parentNode.replaceChild(ph, el); else if(el) el.remove(); } catch(e){ if(el) el.remove(); } };

// Niche category color map — every niche picks a color from its category
const NC_CATEGORY_COLOR = {
  "Sports":"#5B4A9A","Entertainment":"#5B4A9A","Gaming":"#5B4A9A","Lifestyle":"#5B4A9A",
  "Fashion & Beauty":"#5B4A9A","Finance":"#5B4A9A","Tech":"#5B4A9A","Education":"#5B4A9A",
  "Commentary":"#5B4A9A","Trends":"#5B4A9A","Creator":"#5B4A9A","Professional":"#5B4A9A","Culture":"#5B4A9A"
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
  /* Was a hardcoded gray-and-white shimmer with no relation to the app's own
     palette (#2a2a30 / white, unrelated to --sf2 / --tx). Now a signal-tinted
     pulse-line sweep — the same motion language as the momentum indicators,
     not a separate unrelated loading system. */
  @keyframes cp-shimmer { 0%{background-position:-320px 0} 100%{background-position:320px 0} }
  @keyframes cp-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  .sk { background:var(--sf2,#ECEAF0); background-image:linear-gradient(90deg,rgba(91,74,154,0) 0,rgba(91,74,154,.16) 50%,rgba(91,74,154,0) 100%);
        background-repeat:no-repeat; background-size:320px 100%;
        animation:cp-shimmer 1.2s infinite linear, cp-pulse 1.6s ease-in-out infinite; border-radius:6px; }
  @media(prefers-reduced-motion:reduce){ .sk{ animation:none; background-image:none; } }
  .sk-line { height:11px; margin:7px 0; }
  .sk-line.w90{width:90%} .sk-line.w70{width:70%} .sk-line.w50{width:50%} .sk-line.w35{width:35%}
  .sk-img { width:64px; height:64px; border-radius:8px; flex:0 0 auto; }
  .sk-trend { display:flex; gap:12px; padding:14px 0; border-bottom:1px solid var(--br,#e5e5e5); }
  .sk-trend .sk-body { flex:1; min-width:0; }
  .sk-hook { display:flex; gap:10px; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--br,#e5e5e5); }
  .sk-hook .sk-num { width:22px; height:22px; border-radius:50%; flex:0 0 auto; }
  .sk-row { padding:10px 0; }
  .sk-block { height:74px; border-radius:10px; margin:10px 0; }
  .err-card { border:1px solid var(--err-br,rgba(224,80,58,.35)); background:var(--err-bg,var(--sf2,#211E1A)); color:var(--err-tx,var(--danger,#E0503A));
              border-radius:10px; padding:12px 14px; margin:10px 0; font-size:12.5px; line-height:1.5;
              display:flex; gap:10px; align-items:center; justify-content:space-between; }
  .err-card .err-retry { border:1px solid currentColor; background:transparent; color:inherit; border-radius:7px;
              padding:5px 10px; font-size:11px; font-weight:700; cursor:pointer; flex:0 0 auto; }
  img.brand-mark { background:none; object-fit:cover; }
  .uq-result { margin-top:12px; padding:10px 12px; border-radius:8px; font-size:12.5px; line-height:1.5; }
  .uq-unique { background:rgba(95,167,119,.14); color:var(--ok,#5FA777); }
  .uq-some_overlap { background:rgba(217,162,75,.14); color:var(--or,#D9A24B); }
  .uq-too_similar { background:rgba(224,80,58,.14); color:var(--danger,#E0503A); }
  .cal-cell.has { aspect-ratio:unset; min-height:52px; padding-bottom:4px; }
  .cal-daynum { line-height:1; }
  .cal-tag { margin-top:3px; font-size:8px; line-height:1.15; font-weight:700; padding:2px 3px; border-radius:3px;
             max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  /* Niche opportunity vs. your own scheduled post now read as two distinct
     weights instead of two arbitrary hues (brick/forest) — quiet for an
     opportunity you haven't acted on yet, signal for something you've
     actually committed to the calendar. */
  .cal-tag-event { background:var(--sf2,rgba(255,255,255,.06)); color:var(--mu,#8A8375); } /* niche opportunity — quiet */
  .cal-tag-post { background:var(--tint,#EEE9F8); color:var(--tint-tx,#3C3060); } /* your scheduled post — accent */
  .cal-cell.today .cal-tag-event { background:rgba(255,255,255,.22); color:var(--bg,#131110); }
  .cal-cell.today .cal-tag-post { background:rgba(255,255,255,.22); color:var(--bg,#131110); }
  .tipbtn { position:relative; }
  .tipbtn::after { content:attr(data-tip); position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%) translateY(3px);
              background:var(--tx,#F3EEE4); color:var(--bg,#131110); font-size:10.5px; font-weight:600; white-space:nowrap; padding:4px 7px; border-radius:6px;
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
  return `<div class="err-card" role="alert"><span>${esc(msg || "Something went wrong. Please try again.")}</span>${
    retryFn ? `<button class="err-retry" onclick="${esc(retryFn)}">Try again</button>` : ""
  }${key ? `<button class="err-retry" onclick="clearErr('${esc(key)}')">Dismiss</button>` : ""}</div>`;
}
function sectionErr(key, retryFn){
  const msg = S.errors && S.errors[key];
  return msg ? errCard(msg, retryFn, key) : "";
}
window.setErr = (key, msg) => { S.errors[key] = msg || "Something went wrong. Please try again."; render(); };
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
    catch(e){
      if(r.status === 413) throw new Error("Request payload is too large for the server (status 413).");
      throw new Error(`Server returned an unexpected response (status ${r.status}). This usually means the endpoint isn't available or the server is still starting up.`);
    }
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
    if(e.name === "AbortError") throw new Error("Request timed out: the server may be waking up from sleep. Try again in a moment.");
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
async function bootApp(){ render(); ariaAnnounceBackend(); loadTrends(); loadNotifs(); loadSchedule(); loadSaved(); loadDigest(); loadAgendaSchedule(); flushOutbox(); startGlobalTimer(); initPush(); }

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
// Paint every "suggested window" label from its data-countdown value.
// Extracted so it can run immediately on paint as well as on the interval.
function paintCountdowns(){
  document.querySelectorAll('[data-countdown]').forEach(el=>{
    const target = parseInt(el.dataset.countdown,10);
    // No usable timestamp means we genuinely cannot estimate a window.
    // Spec 5.3 asks for a meaningful fallback AND a way out of it, so this is
    // honest text plus a "Try again" control - never a label that still looks
    // like it is loading, and never a time invented to fill the space.
    if(!target || !isFinite(target)){
      // Only rebuild the markup when we are not already showing it, so the
      // 30-second tick cannot throw away a tap mid-press.
      if(el.dataset.retryState !== '1'){
        el.dataset.retryState = '1';
        // The attribute STAYS (as an empty string) so the next tick still finds
        // this element and the guard above keeps its markup intact. Removing it
        // would strand the element outside the selector and stop the label from
        // ever being able to resolve again.
        el.dataset.countdown = '';
        el.innerHTML = window.cpWindowRetryMarkup
          ? window.cpWindowRetryMarkup(el.dataset.tid || '')
          : 'No window estimate';
      }
      return;
    }
    if(el.dataset.retryState){ delete el.dataset.retryState; el.textContent = ''; }
    const diff = target - Date.now();
    if(diff <= 0){ el.textContent = 'Post now'; return; }
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
    el.textContent = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  });
}
function startGlobalTimer(){
  // The interval alone used to be the ONLY thing that ever wrote this label,
  // so a freshly expanded card sat on "calculating…" for up to 30 seconds and
  // looked broken. Paint once right now, then keep it fresh.
  paintCountdowns();
  if(_cpTimer) return;
  _cpTimer = setInterval(()=>{
    paintCountdowns();
    if (S.user && S.lastTrendsRefresh && (Date.now() - S.lastTrendsRefresh >= 60 * 60 * 1000)) {
      loadTrends(true);
    }
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
    S.errors.digest = "Couldn't dismiss the digest. Please try again.";
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
  // Delegates to the pure resolver in lib/windowRetry.js so the first paint and
  // the "Try again" handler can never disagree about what the window is. It
  // returns null for a story with no usable timestamp instead of silently
  // anchoring the guess to "now" (spec 5.3: do not fabricate a posting time).
  const hours = v.state==='rising'?12: v.state==='peaking'?6:2;
  if(window.cpWindowTarget) return window.cpWindowTarget(t, v.state);
  const base = Number(t && t.timestamp);
  if(!isFinite(base) || base <= 0) return null;
  return base + hours*3600000;
}
// Spec 5.3's escape hatch: the fallback is a real action, not just a sentence.
// Re-reads the story's niche feed (the usual reason a window is missing is a
// story that arrived without a timestamp), then repaints. It never writes a
// "loading" text of its own - render() repaints every label from real state,
// so the label resolves or honestly shows the retry again.
window.retryWindowEstimate = async (tid) => {
  const t = S.trends.find(x=>x.id===tid);
  if(!t) return render();
  if(t.niche){
    try {
      const list = await fetchNews(t.niche);
      const fresh = (list||[]).find(a => (a.headline||a.title) === (t.headline||t.title));
      if(fresh && Number(fresh.timestamp) > 0) t.timestamp = Number(fresh.timestamp);
    } catch(_){ /* offline: the label simply stays honest */ }
  }
  S.expanded[tid] = true;
  render();
};
function trendBestPlatform(t){
  // Was a first-match if-chain checking a handful of keywords — most
  // ordinary headlines (especially sports news) never hit any of those
  // words, so it silently fell through to "just use your primary platform"
  // most of the time without you knowing that's what was happening. The
  // scoring now lives in lib/platformPick.js, which scores every platform
  // against several signal groups and picks whichever actually has the
  // strongest match — still a heuristic, not a trained model, but a much more
  // honest attempt than "first regex that hits wins."
  //
  // The arithmetic moved to the lib because spec 5.4 asks the recommendation
  // to be explainable, and an explanation that re-runs its own copy of this
  // walk WILL eventually disagree with the row on the card. One implementation,
  // two readers: the row, and the "Why this platform?" panel.
  // The inline version is kept as a fallback so a missing script degrades to
  // the old behaviour instead of throwing (the freeze class this codebase
  // already paid for).
  if(window.cpPickPlatform) return window.cpPickPlatform(t, S.user?.platforms, S.user?.primaryPlatform);
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
  //
  // The arithmetic itself now lives in lib/opportunityScore.js, because spec
  // 5.4 asks for the score to be explainable and an explanation that
  // recomputes the number separately WILL eventually disagree with the big
  // number on the card. One implementation, two readers.
  // The inline expression is kept as a fallback so a missing script degrades
  // to the old behaviour instead of throwing (that is the freeze class this
  // codebase already paid for once).
  if(window.cpOpportunityScore) return window.cpOpportunityScore(t);
  const v = trendVelocity(t);
  const s = t.score || 55;
  const boost = v.state==='rising'? 8 : v.state==='peaking'? 0 : -18;
  return Math.max(15, Math.min(97, Math.round(0.6*s + boost*2 + 15)));
}
// Spec 5.4: the explanation must be "accessible without cluttering the
// interface". Collapsed by default, one tap to open, one tap to close.
window.toggleOppWhy = (tid) => {
  S.oppWhy = S.oppWhy || {};
  S.oppWhy[tid] = !S.oppWhy[tid];
  render();
};
// Same rule, same gesture, for the "Best platform" recommendation (spec 5.1
// lists the suggested platform as its own block; 5.4 governs how it explains
// itself). Kept as a separate flag so opening one panel never closes the other
// by accident.
window.togglePlatWhy = (tid) => {
  S.platWhy = S.platWhy || {};
  S.platWhy[tid] = !S.platWhy[tid];
  render();
};


async function loadTrends(silent = false){
  if(!S.user) return;
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;
  if (!silent) {
    S.trends = [];
    render();
  }
  const all = [];
  const jobs = [];
  for(const niche of S.user.niches){
    jobs.push(fetchNews(niche).catch(()=>[]));
    jobs.push(fetchBlogs(niche).catch(()=>[]));
    const handles = NICHE_HANDLES[niche] || NICHE_HANDLES.default;
    for(const h of handles.slice(0,8)){
      jobs.push(
        fetchTwitter(h, niche)
          .then(arr=>{
            arr.forEach(a=>{
              a.niche = niche;
              if(a.image && !/^https?:/.test(a.image)) a.image = 'https://nitter.net'+a.image;
              if(a.image) a.image = `${API}/api/image-proxy?url=${encodeURIComponent(a.image)}`;
            });
            return arr;
          })
          .catch(()=>[])
      );
    }
  }
  const results = await Promise.all(jobs);
  results.forEach(arr => all.push(...arr));

  // Dedupe by headline and normalize viral scores/tiers
  const seen = new Set();
  const normalized = [];
  for (const t of all) {
    const k = (t.headline || t.title || "").toLowerCase().trim().slice(0,80);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const ts = t.timestamp || 0;
    if (ts && ts < cutoff) continue;

    const score = t.score || 70;
    let tier = t.viralTier;
    let label = t.viralLabel;
    if (!tier) {
      if (score >= 80) { tier = "trending"; label = "Trending"; }
      else if (score >= 65) { tier = "mid"; label = "Mid-Tier"; }
      else { tier = "low"; label = "Curated"; }
    }
    t.viralTier = tier;
    t.viralLabel = label;
    t.hasImage = !!t.image;
    normalized.push(t);
  }

  // Tier sorting priority: Trending (weight 3), Mid (weight 2), Low (weight 1)
  // Within tier: score descending, then hasImage as tiebreaker for instant visual readiness
  const tierWeight = { trending: 3, mid: 2, low: 1 };
  normalized.sort((a, b) => {
    const wDiff = (tierWeight[b.viralTier] || 1) - (tierWeight[a.viralTier] || 1);
    if (wDiff !== 0) return wDiff;
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    if (b.hasImage !== a.hasImage) return b.hasImage ? 1 : -1;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // Threshold: 40 live stories (newer stories replace older ones smoothly on hourly refresh)
  S.trends = normalized.slice(0, 40);
  S.lastTrendsRefresh = now;
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
    const availablePlats = Array.from(new Set([...(S.user?.platforms||[]), "instagram", "tiktok", "twitter", "youtube"]));
    const platChips = availablePlats.map(p => {
      const P = PLATS.find(x=>x.id===p);
      const label = p === "twitter" ? "X (Twitter)" : (P?.label||p);
      const isAct = plat === p;
      return `<button class="h-card h-card-plat ${isAct?'active':''}" onclick="setPlat('${t.id}','${p}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-logo">${PLAT_LOGO[p]||PLAT_EMOJI[p]||''}</div>
        <div class="h-name">${esc(label)}</div>
      </button>`;
    }).join("");

    const fmtIcon = (c) => {
      if (/carousel/i.test(c)) return `<div class="h-fmt-vis h-fmt-car"><span></span><span></span><span></span></div>`;
      if (/graphic|thumbnail/i.test(c)) return `<div class="h-fmt-vis"><span class="h-emoji-glyph">📸</span></div>`;
      if (/caption|hashtag/i.test(c)) return `<div class="h-fmt-vis"><span class="h-emoji-glyph">#️⃣</span></div>`;
      if (/script|short|reel/i.test(c)) return `<div class="h-fmt-vis"><span class="h-emoji-glyph">🎬</span></div>`;
      if (/thread/i.test(c)) return `<div class="h-fmt-vis"><span class="h-emoji-glyph">🧵</span></div>`;
      return `<div class="h-fmt-vis"><span class="h-emoji-glyph">💬</span></div>`;
    };
    const ctChips = (PTYPES[plat]||[]).map(c => {
      const isAct = ct === c;
      return `<button class="h-card h-card-fmt ${isAct?'active':''}" onclick="setCT('${t.id}','${esc(c)}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        ${fmtIcon(c)}
        <div class="h-name">${esc(c)}</div>
      </button>`;
    }).join("");

    const TONE_VIS = { normal:"😐", funny:"😂", educative:"🧠", hype:"🔥", storytelling:"📖" };
    const toneChips = TONES.map(x => {
      const isAct = tone === x.id;
      return `<button class="h-card h-card-tone ${isAct?'active':''}" onclick="setTone('${t.id}','${x.id}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-emoji">${TONE_VIS[x.id] || "💬"}</div>
        <div class="h-name">${x.label}</div>
      </button>`;
    }).join("");

    const palette = S.palette[t.id] || "noir_orange";
    const paletteChips = PALETTES.map(x => {
      const isAct = palette === x.id;
      const v = PALETTE_VIS[x.id] || ["#08090C","#FF7A1A"];
      return `<button class="h-card h-card-color ${isAct?'active':''}" onclick="setPalette('${t.id}','${x.id}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-color-preview" style="background:${v[0]}">
          <div class="h-color-bar" style="background:${v[1]}"></div>
          <div class="h-color-text" style="color:${x.id==='white_platinum'?'#111':'#fff'}">Aa</div>
          <div class="h-color-dot" style="background:${v[1]}"></div>
        </div>
        <div class="h-name">${x.label}</div>
      </button>`;
    }).join("");

    const showPalette = ct === "IG Carousel" || ct === "TikTok No-Face Graphic" || ct === "TikTok Silent Camera" || ct === "Thumbnail";
    const cardTheme = S.cardTheme[t.id] || "modern_dark";
    const cardTypography = S.cardTypography[t.id] || "impact";
    const cardDensity = S.cardDensity[t.id] || "balanced";
    const brandPreset = S.brandPreset[t.id] || "creator";
    const focal = S.focalPoint[t.id] || {x:50,y:50};

    const themeChips = CARD_THEMES.map(x => {
      const isAct = cardTheme === x.id;
      const v = THEME_VIS[x.id] || {bg:"#111",fg:"#fff",mu:"#888"};
      return `<button class="h-card h-card-theme ${isAct?'active':''}" onclick="setCardTheme('${t.id}','${x.id}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-theme-preview" style="background:${v.bg};border-color:${isAct?'var(--tx)':'rgba(255,255,255,0.1)'}">
          <span style="color:${v.fg}">Card</span>
          <span class="h-theme-line" style="background:${v.mu}"></span>
        </div>
        <div class="h-name">${x.label}</div>
      </button>`;
    }).join("");

    const typoChips = CARD_TYPOGRAPHIES.map(x => {
      const isAct = cardTypography === x.id;
      const v = TYPO_VIS[x.id] || {f:"Inter, sans-serif",w:700,up:false};
      const cleanFont = v.f.replace(/"/g,"'");
      return `<button class="h-card h-card-typo ${isAct?'active':''}" onclick="setCardTypography('${t.id}','${x.id}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-typo-preview" style="font-family:${cleanFont};font-weight:${v.w}">${v.up?'AA':'Aa'}</div>
        <div class="h-name" style="font-family:${cleanFont};font-weight:${v.w}">${x.label}</div>
      </button>`;
    }).join("");

    const densityChips = CARD_DENSITIES.map(x => {
      const isAct = cardDensity === x.id;
      const n = DENSITY_VIS[x.id] || 2;
      return `<button class="h-card h-card-density ${isAct?'active':''}" onclick="setCardDensity('${t.id}','${x.id}')">
        <div class="h-badge">${isAct?'✓':''}</div>
        <div class="h-dens-preview">
          <b></b>
          ${'<u></u>'.repeat(n)}
        </div>
        <div class="h-name">${x.label}</div>
        <div class="h-sub">${n===1?'Punchy':n===2?'Balanced':'Detailed'}</div>
      </button>`;
    }).join("");

    const brandChips = Object.entries(BRAND_PRESETS).map(([id,b]) => `<button class="h-card h-card-theme ${brandPreset===id?'active':''}" onclick="setBrandPreset('${t.id}','${id}')"><div class="h-theme-preview" style="background:${PALETTE_VIS[b.palette][0]};color:#fff;border-color:${PALETTE_VIS[b.palette][1]}"><span style="font-family:${TYPO_VIS[b.typography].f}">Aa</span><span class="h-theme-line" style="background:${PALETTE_VIS[b.palette][1]}"></span></div><div class="h-name">${b.label}</div></button>`).join("");
    const slideCount = S.slideCount[t.id] || 4;
    const slideCountChips = [1,2,3,4,5,6,7,8].map(n => {
      const isAct = slideCount === n;
      return `<button class="h-slide-pill ${isAct?'active':''}" onclick="setSlideCount('${t.id}',${n})">
        ${n} ${n===1?'slide':'slides'}
      </button>`;
    }).join("");
    const showSlideCount = ct === "IG Carousel";
    const outsHTML = outs.map((o,i)=>renderOut(o,t.id,i)).join("");

    const platLabel = plat === "twitter" ? "X (Twitter)" : (PLATS.find(x=>x.id===plat)?.label || plat);
    const toneLabel = TONES.find(x=>x.id===tone)?.label || tone;
    const paletteLabel = PALETTES.find(x=>x.id===palette)?.label || palette;
    const themeLabel = CARD_THEMES.find(x=>x.id===cardTheme)?.label || cardTheme;
    const typoLabel = CARD_TYPOGRAPHIES.find(x=>x.id===cardTypography)?.label || cardTypography;
    const densityLabel = CARD_DENSITIES.find(x=>x.id===cardDensity)?.label || cardDensity;

    const railOpen = (label) => {
      S.railExp = S.railExp || {};
      const key = t.id + "_" + String(label).toLowerCase().replace(/[^a-z]/g, "");
      if (S.railExp[key] !== undefined) return !!S.railExp[key];
      if (label === "Platform") return !S.hasSelected?.[t.id + "_platform"];
      if (label === "Format") return !!S.hasSelected?.[t.id + "_platform"] && !S.hasSelected?.[t.id + "_format"];
      if (label === "Tone") return !!S.hasSelected?.[t.id + "_format"] && !S.hasSelected?.[t.id + "_tone"];
      return false;
    };
    // Completed steps collapse to compact summaries; tap Change to edit again.
    const hRail = (label, value, body) => `<div class="h-step">
      <div class="h-step-hd" role="button" tabindex="0" onclick="toggleRail('${t.id}','${esc(label)}')">
        <span class="h-step-l">${esc(label)}</span>
        <span class="h-step-r"><span class="h-step-v">${esc(String(value))}</span><span class="h-step-action">${railOpen(label) ? "Done ✓" : "Change ▾"}</span></span>
      </div>
      <div class="h-rail" ${railOpen(label) ? "" : "hidden"}>${body}</div>
    </div>`;

    panel = `<div class="cp cp-news-detail">
      <div class="why"><div class="why-label">Why this matters</div><div class="why-body">${esc(rec||t.summary||"No additional context is available for this story yet.")}</div></div>
      ${(window.cpPlatformMarkup ? window.cpPlatformMarkup(t, { open:false, platforms:S.user?.platforms, primary:S.user?.primaryPlatform, plats:PLATS, emoji:PLAT_EMOJI, pick:bp }) : `<div class="best-plat"><span class="em">${PLAT_EMOJI[bp]||"◆"}</span><div style="flex:1"><div class="best-plat-lbl">Best platform</div><div class="best-plat-val">${esc(bpLabel)}</div></div></div>`)}
      <button class="btn bp cp-create-cta" type="button" onclick="cpCreateStartFromTrend('${esc(t.id)}')">${I.bolt}<span>Create content</span></button>
    </div>`;
  }
  const tier = t.viralTier || (t.score >= 80 ? 'trending' : t.score >= 65 ? 'mid' : 'low');
  const tierLabel = `<span class="stat-dot dot-${tier}"></span>${tier === 'trending' ? 'Trending' : tier === 'mid' ? 'Mid-Tier' : 'Curated'}`;
  const srcTag = t.source?`<span class="tsep">·</span><span class="badge-src">${esc(t.source)}</span>`:"";
  const imgReadyPill = t.image ? `<span class="badge badge-img-ready"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:3px"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>Photo Ready</span>` : "";
  const veloCls = (()=>{ const st=trendVelocity(t).state; return st==='peaking'?'tc-peaking':st==='rising'?'tc-rising':''; })();
  return `<div class="tc ${exp?'exp':''} tc-tier-${tier} ${veloCls}" id="tc-${t.id}">
    <div class="th" onclick="toggle('${t.id}')">
      ${img}
      <div class="thead">
        <div class="thl">${esc(t.headline)}</div>
        <div class="tmeta-top">
          <span class="badge badge-niche">${esc(t.niche)}</span>
          <span class="badge badge-tier badge-tier-${tier}">${tierLabel}</span>
          ${(function(){const v=trendVelocity(t);return `<span class="velo-pill velo-${v.state}"><span class="velo-dot"></span>${v.label}</span>`;})()}
          ${imgReadyPill}
        </div>
        <div class="tmeta"><span>${(t.tags||[]).slice(0,2).map(esc).join(' · ')}</span>${srcTag}</div>
      </div>
      <span class="cv ${exp?'open':''}">${I.chevron}</span>
    </div>
    ${panel}
  </div>`;
}


function renderPlatformMockup(o, tid, idx, curPlat) {
  const prevKey = `${tid}-${idx}`;
  const sIdx = (S.previewSlideIdx && S.previewSlideIdx[prevKey]) || 0;
  const exportSi = o.type === "carousel" ? sIdx : 0;
  const isCarousel = o.type === "carousel";
  const slides = isCarousel ? (o.slides || []) : [];
  const curSlide = isCarousel ? (slides[sIdx] || slides[0] || {}) : null;
  const totalSlides = slides.length || 1;
  const userHandle = S.user?.handle || S.user?.name?.toLowerCase().replace(/\s+/g, "") || "creatorpulse";
  const userDisp = S.user?.name || "CreatorPulse";
  const initial = userDisp.slice(0, 1).toUpperCase();
  const textContent = o.type === "text" ? String(o.content || "") : (curSlide ? [curSlide.headline, curSlide.stat, curSlide.body].filter(Boolean).join(" · ") : "");

  // Tab switcher
  const tabs = `
    <div class="preview-tabs">
      <span class="prev-tab-lbl">Live Mockup:</span>
      <button class="prev-tab ${curPlat==='instagram'?'active':''}" onclick="setPreviewPlat('${prevKey}','instagram')">📸 Instagram</button>
      <button class="prev-tab ${curPlat==='tiktok'?'active':''}" onclick="setPreviewPlat('${prevKey}','tiktok')">🎵 TikTok</button>
      <button class="prev-tab ${curPlat==='youtube'?'active':''}" onclick="setPreviewPlat('${prevKey}','youtube')">▶️ YouTube</button>
      <button class="prev-tab ${curPlat==='twitter'?'active':''}" onclick="setPreviewPlat('${prevKey}','twitter')">𝕏 X</button>
    </div>`;

  let inner = "";

  if (curPlat === "instagram") {
    const slideImg = curSlide?.img || o.img || o.imageUrl || "";
    const slideFb = curSlide?.localImg || o.fallbackImg || "";
    const imgEl = slideImg
      ? `<img data-cp-export="${tid}-${idx}-${exportSi}" src="${slideImg}" onerror="cardImgFail(this, this.dataset.fb)" data-fb="${slideFb}" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block"/>`
      : `<div style="padding:28px 16px;min-height:220px;display:flex;flex-direction:column;justify-content:center;background:#111;text-align:center"><div style="font-size:16px;font-weight:700;color:#fff">${esc(textContent.slice(0, 120))}</div></div>`;

    const navArrows = isCarousel && totalSlides > 1 ? `
      <div style="position:absolute;top:50%;left:8px;transform:translateY(-50%);z-index:3">
        <button class="btn bo bxs" style="background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:26px;height:26px;padding:0" onclick="setPreviewSlide('${prevKey}',${Math.max(0, sIdx - 1)})">‹</button>
      </div>
      <div style="position:absolute;top:50%;right:8px;transform:translateY(-50%);z-index:3">
        <button class="btn bo bxs" style="background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;width:26px;height:26px;padding:0" onclick="setPreviewSlide('${prevKey}',${Math.min(totalSlides - 1, sIdx + 1)})">›</button>
      </div>
      <div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700;z-index:3">${sIdx + 1}/${totalSlides}</div>
    ` : "";

    const dots = isCarousel && totalSlides > 1 ? `
      <div style="display:flex;justify-content:center;gap:4px;padding:6px 0">
        ${slides.map((_, i) => `<span style="width:5px;height:5px;border-radius:50%;background:${i===sIdx?'#3897f0':'rgba(255,255,255,0.25)'}"></span>`).join("")}
      </div>` : "";

    inner = `
      <div class="mock-shell mock-ig">
        <div class="mock-ig-header">
          <div class="mock-ig-user">
            <div class="mock-ig-avatar"><div class="mock-ig-avatar-inner">${initial}</div></div>
            <div>
              <div class="mock-ig-name">${esc(userHandle)}</div>
              <div class="mock-ig-sub">Suggested for you</div>
            </div>
          </div>
          <div style="color:#aaa;font-size:13px;letter-spacing:1px">•••</div>
        </div>
        <div class="mock-ig-body" style="position:relative">
          ${imgEl}
          ${navArrows}
        </div>
        ${dots}
        <div class="mock-ig-actions">
          <div class="mock-ig-icons-left">
            <span>❤️</span><span>💬</span><span>↗️</span>
          </div>
          <div><span>🔖</span></div>
        </div>
        <div class="mock-ig-likes">4,821 likes</div>
        <div class="mock-ig-caption">
          <b>${esc(userHandle)}</b> ${esc(textContent.slice(0, 110))} <span class="mock-ig-more">... more</span>
        </div>
      </div>`;
  } else if (curPlat === "tiktok") {
    const silent = !!o.silentCamera;
    const silentText = curSlide ? [curSlide.headline,curSlide.supportingText,curSlide.body].filter(Boolean).join(" ") : textContent;
    const safeZones = silent ? `<div style="position:absolute;inset:10% 8% 24%;border:1px dashed rgba(255,255,255,.76);z-index:2;pointer-events:none;border-radius:8px"><span style="position:absolute;top:5px;left:7px;background:rgba(0,0,0,.62);color:#fff;padding:3px 6px;font-size:9px;border-radius:4px">TEXT SAFE ZONE</span></div>` : "";
    const silentWarning = silent && silentText.length > 90 ? `<div style="position:absolute;top:42px;left:8px;right:8px;background:rgba(160,35,22,.94);color:white;padding:6px 8px;font-size:10px;z-index:4;border-radius:5px">Text is ${silentText.length} characters. Keep Silent Camera overlay under 90 for readability.</div>` : "";
    const slideImg = curSlide?.img || o.img || o.imageUrl || "";
    const slideFb = curSlide?.localImg || o.fallbackImg || "";
    const mediaEl = slideImg
      ? `<img data-cp-export="${tid}-${idx}-${exportSi}" src="${slideImg}" onerror="cardImgFail(this, this.dataset.fb)" data-fb="${slideFb}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"/>`
      : `<div style="padding:20px;text-align:center;color:#fff;font-weight:700;font-size:15px;z-index:1">${esc(textContent.slice(0, 140))}</div>`;

    inner = `
      <div class="mock-shell mock-tt mock-tt-shell">
        ${mediaEl}
        ${safeZones}${silentWarning}
        <div class="mock-tt-top">
          <span>Following</span>
          <span class="active">For You</span>
        </div>
        <div class="mock-tt-overlay">
          <div class="mock-tt-info">
            <div class="mock-tt-user">@<span data-cp-mock="handle" data-cp-tid="${tid}" data-cp-default="${esc(userHandle)}">${esc((S.mockText && S.mockText[tid] && S.mockText[tid].handle) || userHandle)}</span></div>
            <div class="mock-tt-desc"><span data-cp-mock="caption" data-cp-tid="${tid}" data-cp-default="${esc(textContent.slice(0, 95))}">${esc((S.mockText && S.mockText[tid] && S.mockText[tid].caption) || textContent.slice(0, 95))}</span> <span data-cp-mock="hashtags" data-cp-tid="${tid}" data-cp-default="#fyp #viral">${esc((S.mockText && S.mockText[tid] && S.mockText[tid].hashtags) || "#fyp #viral")}</span></div>
            <div class="mock-tt-sound">🎵 <span data-cp-mock="sound" data-cp-tid="${tid}" data-cp-default="Trending Sound · Original Audio">${esc((S.mockText && S.mockText[tid] && S.mockText[tid].sound) || "Trending Sound · Original Audio")}</span></div>
          </div>
          <div class="mock-tt-side">
            <div class="mock-tt-side-item"><div class="mock-tt-side-btn">❤️</div><span>52.4K</span></div>
            <div class="mock-tt-side-item"><div class="mock-tt-side-btn">💬</div><span>1,842</span></div>
            <div class="mock-tt-side-item"><div class="mock-tt-side-btn">⭐️</div><span>8,910</span></div>
            <div class="mock-tt-side-item"><div class="mock-tt-side-btn">↗️</div><span>3,420</span></div>
            <div class="mock-tt-side-item"><div class="mock-tt-side-btn" style="border-radius:50%;font-size:11px">💿</div></div>
          </div>
        </div>
      </div>`;
  } else if (curPlat === "youtube") {
    const slideImg = curSlide?.img || o.img || o.imageUrl || "";
    const slideFb = curSlide?.localImg || o.fallbackImg || "";
    const mediaEl = slideImg
      ? `<img data-cp-export="${tid}-${idx}-${exportSi}" src="${slideImg}" onerror="cardImgFail(this, this.dataset.fb)" data-fb="${slideFb}" style="width:100%;height:100%;object-fit:cover"/>`
      : `<div style="padding:16px;color:#fff;font-size:13px;font-weight:600;text-align:center">${esc(textContent.slice(0, 90))}</div>`;

    inner = `
      <div class="mock-shell mock-yt">
        <div class="mock-yt-player">
          ${mediaEl}
          <div class="mock-yt-play-btn">▶</div>
          <div class="mock-yt-progress"><div class="mock-yt-progress-fill"></div></div>
          <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.8);color:#fff;font-size:10px;padding:2px 5px;border-radius:3px">12:45</div>
        </div>
        <div class="mock-yt-meta">
          <div class="mock-yt-title">${esc(textContent.slice(0, 75) || "Viral Breakdown Video")}</div>
          <div class="mock-yt-views">284K views · 1 day ago</div>
          <div class="mock-yt-channel">
            <div class="mock-yt-ch-info">
              <div class="mock-yt-avatar">${initial}</div>
              <div class="mock-yt-ch-name">${esc(userDisp)} ✓</div>
            </div>
            <button class="mock-yt-sub-btn">Subscribe</button>
          </div>
        </div>
      </div>`;
  } else {
    // X (Twitter)
    const slideImg = curSlide?.img || o.img || "";
    const slideFb = curSlide?.localImg || o.fallbackImg || "";
    const mediaEl = slideImg
      ? `<div class="mock-x-media"><img data-cp-export="${tid}-${idx}-${exportSi}" src="${slideImg}" onerror="cardImgFail(this, this.dataset.fb)" data-fb="${slideFb}" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block"/></div>`
      : "";

    inner = `
      <div class="mock-shell mock-x">
        <div class="mock-x-card">
          <div class="mock-x-header">
            <div class="mock-x-user-row">
              <div class="mock-x-avatar">${initial}</div>
              <div class="mock-x-names">
                <div class="mock-x-display-name">${esc(userDisp)} <span style="color:#1d9bf0">✓</span></div>
                <div class="mock-x-handle">@${esc(userHandle)} · 2h</div>
              </div>
            </div>
            <div style="color:#71767b">𝕏</div>
          </div>
          <div class="mock-x-text">${esc(textContent.slice(0, 240) || "Breaking analysis on the latest trend.")}</div>
          ${mediaEl}
          <div class="mock-x-actions">
            <span class="mock-x-action">💬 142</span>
            <span class="mock-x-action">🔁 840</span>
            <span class="mock-x-action">❤️ 4.2K</span>
            <span class="mock-x-action">🔖 620</span>
            <span class="mock-x-action">📊 88K</span>
          </div>
        </div>
      </div>`;
  }

  return `<div class="mock-wrap">${tabs}${inner}</div>`;
}

function renderCardCanvasEditor(o, tid, idx, slideIndex, slide, imageUrl, aspectRatio) {
  const key = `${tid}-${idx}-${slideIndex}`;
  const live = cpCardSlide(tid, idx, slideIndex) || slide || {};
  const layout = live.textLayout || {};
  const box = (name, label, text) => {
    const pos = layout[name] || CP_LIVE_DEFAULT_BOX[name];
    const sel = !!cpCanvasSel && cpCanvasSel.key === key && cpCanvasSel.name === name;
    return `<div class="cp-canvas-block${sel ? " is-selected" : ""}" data-canvas-key="${key}" data-canvas-block="${name}" tabindex="0" role="slider" aria-label="Drag or resize ${label}" style="left:${pos.x*100}%;top:${pos.y*100}%;width:${pos.width*100}%;height:${pos.height*100}%"><div class="cc-live-text${text ? "" : " is-empty"}" data-cp-live="${name}" style="${cpLiveTextStyle(live, name, o, tid)}">${esc(text || label)}</div><span class="cp-canvas-label">${label}</span><button type="button" class="cp-canvas-resize" data-canvas-resize="true" aria-label="Resize ${label}"></button></div>`;
  };
  const sty = live._style || {};
  const stage = `<div class="cp-canvas-stage cc-live-stage" data-canvas-stage="${key}" data-tid="${tid}" data-idx="${idx}" data-slide-index="${slideIndex}" style="aspect-ratio:${aspectRatio}"><div class="cc-live-plate"></div><div class="cc-live-dim"></div><div class="cc-live-status" role="status"></div><div class="cp-canvas-blocks" data-canvas-key="${key}" data-slide-index="${slideIndex}" data-card-key="${tid}-${idx}">${CARD_LAYERS.map(L => box(L.key, L.label, live[L.field])).join("")}</div></div>`;
  const ctxBar = `<div class="cc-ctx" data-cp-ctx="${key}" data-tid="${tid}" data-idx="${idx}" data-slide-index="${slideIndex}" hidden><div class="cc-ctx-bar" role="toolbar" aria-label="Text tools"><span class="cc-ctx-name"></span><button type="button" class="cc-ctx-btn" data-cp-ctx-kind="font" aria-pressed="false" onclick="cpToggleCtxPanel('font')">Font</button><button type="button" class="cc-ctx-btn" data-cp-ctx-kind="color" aria-pressed="false" onclick="cpToggleCtxPanel('color')">Color</button></div><div class="cc-ctx-panel" hidden></div></div>`;
  const bgBar = `<div class="cc-bg" data-cp-bg="${key}" data-tid="${tid}" data-idx="${idx}" data-slide-index="${slideIndex}" hidden></div>`;
  setTimeout(cpSyncLiveStages, 0);
  setTimeout(cpRefreshCtx, 0);
  setTimeout(cpRefreshBgMenu, 0);
  const mt = (S.mockText && S.mockText[tid]) || {};
  const defHandle = S.user?.handle || S.user?.name?.toLowerCase().replace(/\s+/g, "") || "creatorpulse";
  const mockRow = (k, label, val, def) => `<label class="cc-post-row"><span class="cc-post-label">${label}</span><input type="text" value="${esc(val)}" placeholder="${esc(def)}" aria-label="Phone ${label.toLowerCase()}" oninput="cpSetMockText('${tid}','${k}',this.value)"/></label>`;
  const themeLabel = window.CardThemes?.themeName(sty.themeId) || window.CardThemes?.colourName(sty.colourThemeId) || "Original look";
  return `<div class="cp-canvas-editor" data-cp-style="${key}">
    <div class="cp-canvas-instructions">Tap text to select it, then pick its Font or Color. Double-tap to edit the words. Drag or resize the box. Tap the photo to change it.</div>
    ${stage}${ctxBar}${bgBar}
    <div class="cc-tools">
      <button type="button" class="btn bp bxs cc-th-open" onclick="cpOpenThemes('${tid}',${idx},${slideIndex})">Themes</button>
      <span class="cc-style-hint cc-th-hint">${esc(themeLabel)}</span>
    </div>
    <details class="cc-post-details"><summary>Post details</summary>
      ${mockRow("handle", "Name", mt.handle || "", defHandle)}
      ${mockRow("caption", "Caption", mt.caption || "", "Caption from the card")}
      ${mockRow("hashtags", "Hashtags", mt.hashtags || "", "#fyp #viral")}
      ${mockRow("sound", "Sound", mt.sound || "", "Trending Sound · Original Audio")}
    </details>
  </div>`;
}

function renderOut(o, tid, idx){
  if(!o) return "";
  const prevKey = `${tid}-${idx}`;
  const curPlat = (S.previewPlat && S.previewPlat[prevKey]) || (o.aspect === "reel" || o.aspect === "tiktok" ? "tiktok" : o.aspect === "youtube" ? "youtube" : (S.plat && S.plat[tid]) || "instagram");
  const mockupHTML = renderPlatformMockup(o, tid, idx, curPlat);

  if(o.type === "image"){
    const aspectRatioCSS = o.aspect === "reel" || o.aspect === "tiktok" ? "9/16" : o.aspect === "youtube" ? "16/9" : o.aspect === "carousel" ? "4/5" : "1/1";
    const badge = o.isCard
      ? `<span class="ol">Card</span>`
      : o.isRealPhoto
      ? `<span class="ol" style="color:#6fa062">Real photo${o.sourceLabel?' · '+esc(o.sourceLabel):''}</span>`
      : `<span class="ol">AI-generated</span>`;
    const gptBtn = o.isCard ? "" : `<button class="btn bo bxs tipbtn" data-tip="Get a detailed prompt for ChatGPT/DALL-E" title="ChatGPT prompt" aria-label="Get ChatGPT prompt" onclick="getChatGPTPrompt('${tid}')">${I.bolt} ChatGPT Prompt</button>`;
    return `<div class="oc">
      <div class="oh">${badge}<span style="font-size:10.5px;color:var(--mu)">Swipe format above to test</span></div>
      ${mockupHTML}
      ${o.isCard ? renderCardCanvasEditor(o,tid,idx,0,o.editSlide||{headline:S.trends.find(t=>t.id===tid)?.headline||o.label},o.img,aspectRatioCSS.replace('/','/')) : ""}
      ${o.isCard ? "" : `
      <details style="margin:0 10px 10px;background:var(--sf);border-radius:6px;padding:8px 12px;border:1px solid var(--br)">
        <summary style="cursor:pointer;font-size:11px;font-weight:600;color:var(--mu2)">View raw image canvas</summary>
        <div style="padding:10px 0"><img loading="lazy" decoding="async" src="${o.img}" data-fb="${o.fallbackImg||""}" onerror="cardImgFail(this, this.dataset.fb)" style="width:100%;max-width:280px;margin:0 auto;display:block;aspect-ratio:${aspectRatioCSS};object-fit:contain;border-radius:6px"/></div>
      </details>
`}
      <div class="ofoot">
        <button class="btn bo bxs tipbtn" data-tip="Download image" title="Download image" aria-label="Download image" onclick="${o.isCard ? `cpDownloadCard('${tid}',${idx},0,'image.jpg')` : `dl('${o.img}','image.jpg')`}">${I.dl} Download</button>
        ${gptBtn}
        <button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button>
      </div>
    </div>`;
  }
  if(o.type === "carousel"){
    const slideText = s => [s.headline, s.stat && s.statLabel ? `${s.stat} — ${s.statLabel}` : s.stat, s.sectionLabel, s.body, s.supportingText].filter(Boolean).join("\n");
    const slides = (o.slides||[]).map((s,si)=>`<div class="cc-slide"><div class="cc-slide-head"><div class="cc-slide-label">Slide ${s.slideNumber} · ${esc(s.type||"")}</div>${s.img?`<button class="btn bo bxs tipbtn" data-tip="Download this slide" title="Download this slide" aria-label="Download slide ${s.slideNumber}" onclick="cpDownloadCard('${tid}',${idx},${si},'slide-${s.slideNumber}.jpg')" style="padding:3px 8px">${I.dl}</button>`:""}</div>${renderCardCanvasEditor(o,tid,idx,si,s,s.img,"4/5")}</div>`).join("");
    const cp = (o.slides||[]).map(s=>`SLIDE ${s.slideNumber}: ${slideText(s)}`).join("\n\n");
    const imgs = (o.slides||[]).map(s=>s.img).filter(Boolean);
    const dlAllBtn = o.slides?.length ? `<button class="btn bo bxs tipbtn" data-tip="Download all slide images" title="Download all slides" aria-label="Download all slides" onclick="cpDownloadAll('${tid}',${idx})">${I.dl} All</button>` : "";
    return `<div class="oc">
      <div class="oh">
        <span class="ol">Carousel · ${o.slides?.length||0} slides · ${esc(o.theme||'modern_dark')}</span>
        <div style="display:flex;gap:6px">
          ${dlAllBtn}
          <button class="btn bo bxs tipbtn" data-tip="Copy carousel text" title="Copy carousel text" aria-label="Copy carousel text" onclick="copyTxt(\`${cp.replace(/`/g,"\\`")}\`)">${I.copy}</button>
        </div>
      </div>
      ${mockupHTML}
      <div class="cc-slides">${slides}</div>
      <details class="cc-copy-details"><summary>View slide text</summary><div class="cc-copy-text">${esc(cp)}</div></details>
      <div class="ofoot">
        <button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button>
      </div>
    </div>`;
  }
  const content = String(o.content||"");
  const isScript = /script|short|reel/i.test(o.label||"") || /script/i.test(o.contentType||"") || o.isScript;
  if(isScript){
    const editKey = `${tid}-${idx}`;
    const isEditing = !!S.outputEditing?.[editKey];
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const estSec = Math.round((words / 135) * 60);
    const timeFormatted = estSec >= 60 ? `${Math.floor(estSec/60)}m ${estSec%60}s` : `${estSec}s`;
    return `<div class="oc cp-script-card">
      <div class="oh" style="padding:12px 14px 10px;border-bottom:1px solid var(--br)">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <span class="ol" style="font-weight:700">🎬 ${esc(o.label||"Script")}</span>
          <span class="script-timing-pill">${words} words · ~${timeFormatted}</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn bo bxs" type="button" aria-pressed="${isEditing}" onclick="toggleOutputEdit('${tid}',${idx})">${isEditing ? 'Done' : 'Edit'}</button>
          <button class="btn bo bxs tipbtn" data-tip="Copy full script" title="Copy script" aria-label="Copy script" onclick="copyTxt(\`${content.replace(/`/g,"\\`")}\`)">${I.copy} Copy</button>
          <button class="btn bp bxs tipbtn" data-tip="Record in Studio" title="Record in Studio" aria-label="Record in Studio" onclick="studioShootScript('${tid}',${idx})">${I.cam} Studio</button>
        </div>
      </div>
      ${isEditing
        ? `<textarea class="cp-output-editor" aria-label="Edit ${esc(o.label||'script')}" oninput="setOutputContent('${tid}',${idx},this.value)">${esc(content)}</textarea>`
        : `<div class="script-reader-body">${esc(content)}</div>`}
      ${o.attachedCaption ? `<div class="cp-attached-caption" style="margin:10px 14px;padding:10px 12px;background:var(--sf);border-radius:8px;border:1px solid var(--br)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:10.5px;font-weight:700;color:var(--mu2)">Generated Caption &amp; Hashtags</span><button class="btn bo bxs" onclick="copyTxt(\`${String(o.attachedCaption).replace(/`/g,'\\`')}\`)" style="padding:2px 6px;font-size:10px">Copy</button></div><div style="font-size:12px;line-height:1.5;white-space:pre-wrap">${esc(o.attachedCaption)}</div></div>` : ''}
      <div style="margin:0 14px 10px;padding:8px 12px;background:color-mix(in srgb,var(--ac) 10%,var(--sf));border-radius:8px;border:1px dashed var(--ac);display:flex;justify-content:space-between;align-items:center;gap:10px">
        <span style="font-size:11px;font-weight:600;color:var(--tx)">Generate Caption + Hashtags</span>
        <button class="btn bo bxs" type="button" onclick="cpGenerateCaptionForOutput('${tid}',${idx})">Generate + #</button>
      </div>
      <div class="ofoot">
        <button class="btn bo bxs tipbtn" data-tip="Copy full script" title="Copy script" aria-label="Copy script" onclick="copyTxt(\`${content.replace(/`/g,"\\`")}\`)">${I.copy} Copy</button>
        <button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button>
      </div>
    </div>`;
  }

  const editKey = `${tid}-${idx}`;
  const isEditing = !!S.outputEditing?.[editKey];
  return `<div class="oc cp-text-output">
    <div class="oh">
      <span class="ol">${esc(o.label||"Draft")}</span>
      <div class="cp-text-actions">
        <button class="btn bo bxs" type="button" aria-pressed="${isEditing}" onclick="toggleOutputEdit('${tid}',${idx})">${isEditing ? 'Done' : 'Edit'}</button>
        <button class="btn bo bxs tipbtn" data-tip="Copy draft" title="Copy draft" aria-label="Copy draft" onclick="copyOutput('${tid}',${idx})">${I.copy}</button>
      </div>
    </div>
    ${isEditing
      ? `<textarea class="cp-output-editor" aria-label="Edit ${esc(o.label||'draft')}" oninput="setOutputContent('${tid}',${idx},this.value)">${esc(content)}</textarea>`
      : `<div class="cp-text-reader">${esc(content)}</div>`}
    <div class="cp-edit-note">Edits stay in this draft until you save.</div>
    <div class="ofoot">
      <button class="btn bp bxs tipbtn" data-tip="Save to library" title="Save to library" aria-label="Save to library" onclick="saveOut('${tid}',${idx})">${I.save} Save</button>
    </div>
  </div>`;
}

window.studioShootScript = (tid, idx) => {
  const o = S.outs[tid]?.[idx];
  const t = S.trends.find(x => x.id === tid);
  const text = o?.content || "";
  const title = t?.headline || o?.label || "Script";
  if (typeof window.svOpenWithScript === "function") {
    // Create only shows the Studio when studioDirect is set. Set it first, or
    // the script loads into a view nobody can see.
    const cs = window.CPEnv && window.CPEnv.state ? window.CPEnv.state() : null;
    if (cs) { cs.studioDirect = true; cs.studio = cs.studio || {}; cs.studio.mode = "idle"; }
    if (typeof window.setTab === "function") window.setTab("create");
    window.svOpenWithScript(text, title);
    toast("Opening in Studio teleprompter…");
  } else {
    copyTxt(text);
    toast("Script copied! Switch to Studio tab to record.");
  }
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
// Accordion open/close for the Platform/Format/Tone/etc. steps in the
// story-detail panel. One step open per story at a time — opening a new
// one implicitly closes whichever was open, since S.openStep[tid] only
// ever holds a single step name.
window.toggleStep = (tid,step) => { S.openStep = S.openStep || {}; S.openStep[tid] = (S.openStep[tid]===step ? null : step); render(); };
function closeStep(tid){ S.openStep = S.openStep || {}; S.openStep[tid] = null; }
function openStep(tid,step){ S.openStep = S.openStep || {}; S.openStep[tid] = step; }
// Picking an option used to just close that step and leave you to tap the
// next one open yourself. Now it walks you forward  Platform -> Format ->
// Tone  and only fully closes after Tone, so choosing feels like one
// continuous flow instead of three separate taps to open each step.
window.toggleRail = (tid, label) => {
  S.railExp = S.railExp || {};
  const key = tid + "_" + String(label).toLowerCase().replace(/[^a-z]/g, "");
  const wasOpen = S.railExp[key] !== undefined ? !!S.railExp[key] :
    (label === "Platform" ? !S.hasSelected?.[tid + "_platform"] :
     label === "Format" ? !!S.hasSelected?.[tid + "_platform"] && !S.hasSelected?.[tid + "_format"] :
     label === "Tone" ? !!S.hasSelected?.[tid + "_format"] && !S.hasSelected?.[tid + "_tone"] : false);
  S.railExp[key] = !wasOpen;
  render();
};
window.setPlat = (tid,p) => {
  S.hasSelected = S.hasSelected || {}; S.railExp = S.railExp || {};
  S.plat[tid]=p; S.ctype[tid]=PTYPES[p]?.[0]||"";
  S.hasSelected[tid+"_platform"]=true; S.railExp[tid+"_platform"]=false; S.railExp[tid+"_format"]=true; render();
};
window.setCT = (tid,c) => {
  S.hasSelected = S.hasSelected || {}; S.railExp = S.railExp || {};
  S.ctype[tid]=c; S.hasSelected[tid+"_format"]=true;
  S.railExp[tid+"_format"]=false; S.railExp[tid+"_tone"]=true; render();
};
window.setTone = (tid,t) => {
  S.hasSelected = S.hasSelected || {}; S.railExp = S.railExp || {};
  S.tone[tid]=t; S.hasSelected[tid+"_tone"]=true; S.railExp[tid+"_tone"]=false; render();
};
window.setPalette = (tid,p) => { S.palette[tid]=p; S.railExp = S.railExp || {}; S.railExp[tid+"_cardcolor"]=false; render(); };
window.setSlideCount = (tid,n) => { S.slideCount[tid]=n; S.railExp = S.railExp || {}; S.railExp[tid+"_numberofslides"]=false; render(); };
window.setCardTheme = (tid,v) => { S.cardTheme=S.cardTheme||{}; S.railExp=S.railExp||{}; S.cardTheme[tid]=v; S.railExp[tid+"_visualtheme"]=false; render(); };
window.setCardTypography = (tid,v) => { S.cardTypography=S.cardTypography||{}; S.railExp=S.railExp||{}; S.cardTypography[tid]=v; S.railExp[tid+"_typography"]=false; render(); };
window.setCardDensity = (tid,v) => { S.cardDensity=S.cardDensity||{}; S.railExp=S.railExp||{}; S.cardDensity[tid]=v; S.railExp[tid+"_textdensity"]=false; render(); };
window.setBrandPreset = (tid,id) => { const b=BRAND_PRESETS[id]; if(!b)return; S.brandPreset[tid]=id; S.palette[tid]=b.palette; S.cardTheme[tid]=b.theme; S.cardTypography[tid]=b.typography; render(); };
window.setFocalPoint = (tid,axis,value) => { S.focalPoint=S.focalPoint||{}; const p=S.focalPoint[tid]||{x:50,y:50}; p[axis]=Number(value); S.focalPoint[tid]=p; const el=document.querySelector(`[data-focal-label="${tid}"]`); if(el)el.textContent=`${p.x}% · ${p.y}%`; };
window.applyFocalPoint = async (tid,idx) => { const o=S.outs[tid]?.[idx]; if(!o)return; const p=S.focalPoint[tid]||{x:50,y:50}; const ctx=o._renderCtx||{category:nicheToCategory(S.trends.find(t=>t.id===tid)?.niche),palette:S.palette[tid]||"noir_orange",format:o.aspect||"instagram",imageUrl:S.trends.find(t=>t.id===tid)?.image,theme:S.cardTheme[tid],typography:S.cardTypography[tid],density:S.cardDensity[tid]}; o._imgLoading=0; render(); try { const slides=o.type==="carousel"?o.slides:[{headline:S.trends.find(t=>t.id===tid)?.headline||o.label, type:"hook", slideNumber:1,totalSlides:1,imageUrl:ctx.imageUrl}]; const cd=await generateCardsWithRetry({...ctx,slides,focalPoint:{x:p.x/100,y:p.y/100},brand:BRAND_PRESETS[S.brandPreset[tid]||"creator"]}); (cd.images||[]).forEach((img,i)=>{if(o.type==="carousel"&&o.slides[i])o.slides[i].img=img; else if(i===0)o.img=img;}); } catch(e){toast("Couldn't reframe the source image. Try again.");} o._imgLoading=null; render(); };
// ── Live card preview ──────────────────────────────────────────────────────
// The preview is the server's text-free plate with the text drawn in the
// browser on top. Moving, resizing or restyling text only changes the shared
// card state and this preview. Nothing goes to the server until Apply saves it.
const CP_LIVE_DEFAULT_BOX = {
  headline: { x: 0.08, y: 0.25, width: 0.78, height: 0.2 },
  supportingText: { x: 0.08, y: 0.48, width: 0.78, height: 0.18 },
  ctaLine: { x: 0.08, y: 0.88, width: 0.78, height: 0.06 }
};
const CP_LIVE_BASE_SIZE = { headline: 9, supportingText: 4.6, ctaLine: 4 };
let cpCanvasSel = null;      // { key, name } of the selected text block
let cpCanvasActive = null;   // drag or resize in progress
let cpCtxPanel = null;       // "font" | "color" | null: the panel open in the text toolbar
let cpBgKey = null;          // the card whose background menu is open, if any
const CP_CTX_COLORS = ["#ffffff", "#000000", "#ffd60a", "#44d7ff", "#ff3b30", "#34c759", "#a855f7", "#ff7a00"];
const cpPlateCache = new Map(); // plate key -> { src, failed, pending }

function cpCanvasDragging(block) { return !!cpCanvasActive && cpCanvasActive.block === block; }

function cpLiveTextStyle(slide, name, o, tid) {
  const sty = slide._style || {};
  const typo = (sty.layerFonts || {})[name] || sty.typography || (o && o._renderCtx && o._renderCtx.typography) || "impact";
  const vis = TYPO_VIS[typo] || {};
  const color = (sty.layerColors || {})[name] || sty.textColor || "#ffffff";
  const k = Math.max(0.5, Math.min(1.6, Number((sty.layerScale || {})[name]) || 1));
  const upper = name === "ctaLine" ? "uppercase" : "none";
  return `font-family:${vis.f || "Inter, sans-serif"};font-weight:${vis.w || 700};font-size:${(CP_LIVE_BASE_SIZE[name] * k).toFixed(2)}cqw;color:${color};text-transform:${upper}`;
}

function cpSelectCanvasBlock(key, name) {
  cpCanvasSel = key && name ? { key, name } : null;
  if (key) cpBgKey = null;
  document.querySelectorAll(".cp-canvas-block").forEach(el => {
    el.classList.toggle("is-selected", !!cpCanvasSel && el.dataset.canvasKey === cpCanvasSel.key && el.dataset.canvasBlock === cpCanvasSel.name);
  });
  document.querySelectorAll(".cc-layer[data-cp-layer]").forEach(el => {
    const panel = el.closest(".cc-style-panel");
    el.classList.toggle("is-selected", !!cpCanvasSel && panel?.dataset.cpStyle === cpCanvasSel.key && el.dataset.cpLayer === cpCanvasSel.name);
  });
  cpRefreshCtx();
  cpRefreshBgMenu();
}

// Shows the background menu under the card: the photo choices, upload and dimming.
function cpRefreshBgMenu() {
  document.querySelectorAll("[data-cp-bg]").forEach(bar => {
    const on = !!cpBgKey && bar.dataset.cpBg === cpBgKey;
    bar.hidden = !on;
    if (on) bar.innerHTML = cpBgMenuHTML(bar.dataset.tid, Number(bar.dataset.idx), Number(bar.dataset.slideIndex));
  });
}

function cpBgMenuHTML(tid, idx, slideIndex) {
  const slide = cpCardSlide(tid, idx, slideIndex) || {};
  const sty = slide._style || {};
  const o = S.outs[tid]?.[idx];
  const articleSrc = (o && o._renderCtx && o._renderCtx.imageUrl) || (S.trends.find(t => t.id === tid) || {}).image || "";
  const history = sty.bgHistory || [];
  const cur = sty.bgImage || "";
  const thumb = (src, label, on, call) => `<button type="button" class="cc-bg-thumb${on ? " active" : ""}" aria-pressed="${on}" aria-label="${esc(label)}" style="${src ? `background-image:url('${esc(src)}')` : ""}" onclick="${call}"><span>${esc(label)}</span></button>`;
  const thumbs = thumb(articleSrc, "Article photo", !cur, `cpUseBackgroundAt('${tid}',${idx},${slideIndex},-1)`)
    + history.map((h, i) => thumb(h.src, h.name || "Upload", cur === h.src, `cpUseBackgroundAt('${tid}',${idx},${slideIndex},${i})`)).join("");
  return `<div class="cc-bg-title">Background</div>
    <div class="cc-bg-thumbs" role="group" aria-label="Choose a background image">${thumbs}</div>
    <div class="cc-bg-row"><label class="btn bo bxs">Upload image<input type="file" accept="image/*" hidden onchange="cpPickCardBackground(this,'${tid}',${idx},${slideIndex})"/></label></div>
    <label class="cc-bg-row"><span class="cc-style-label">Dimming</span><input type="range" min="0" max="80" value="${Math.round((sty.dim || 0) * 100)}" aria-label="Background dimming" oninput="cpSetCardStyle('${tid}',${idx},${slideIndex},'dim',this.value/100)"/></label>`;
}

// Chooses the article photo (index -1) or one of this card's earlier uploads.
window.cpUseBackgroundAt = (tid, idx, slideIndex, i) => {
  const slide = cpCardSlide(tid, idx, slideIndex); if (!slide) return;
  const h = i >= 0 ? ((slide._style || {}).bgHistory || [])[i] : null;
  window.cpSetCardStyle(tid, idx, slideIndex, "bgImage", h ? h.src : "");
  window.cpSetCardStyle(tid, idx, slideIndex, "bgName", h ? h.name : "");
  cpRefreshBgMenu();
};

// Shows the Font and Color toolbar under the selected text block and fills its open panel.
function cpRefreshCtx() {
  document.querySelectorAll("[data-cp-ctx]").forEach(bar => {
    const on = !!cpCanvasSel && bar.dataset.cpCtx === cpCanvasSel.key;
    bar.hidden = !on;
    if (!on) return;
    const layer = CARD_LAYERS.find(L => L.key === cpCanvasSel.name);
    bar.querySelector(".cc-ctx-name").textContent = layer ? layer.label : "Text";
    bar.querySelectorAll(".cc-ctx-btn").forEach(b => {
      const act = cpCtxPanel === b.dataset.cpCtxKind;
      b.classList.toggle("active", act);
      b.setAttribute("aria-pressed", String(act));
    });
    const panel = bar.querySelector(".cc-ctx-panel");
    panel.hidden = !cpCtxPanel;
    if (cpCtxPanel) panel.innerHTML = cpCtxPanelHTML(bar.dataset.tid, Number(bar.dataset.idx), Number(bar.dataset.slideIndex), cpCanvasSel.name, cpCtxPanel);
  });
}

// The vertical font list (each name in its own face) or the colour swatches for one text layer.
function cpCtxPanelHTML(tid, idx, slideIndex, name, kind) {
  const slide = cpCardSlide(tid, idx, slideIndex) || {};
  const sty = slide._style || {};
  const o = S.outs[tid]?.[idx];
  if (kind === "font") {
    const cur = (sty.layerFonts || {})[name] || sty.typography || (o && o._renderCtx && o._renderCtx.typography) || "impact";
    const items = CARD_TYPOGRAPHIES.map(x => {
      const vis = TYPO_VIS[x.id] || {};
      const on = cur === x.id;
      const fam = String(vis.f || "Inter, sans-serif").replace(/"/g, "'");
      return `<button type="button" role="option" class="cc-ctx-font${on ? " active" : ""}" aria-selected="${on}" style="font-family:${fam};font-weight:${vis.w || 700}" onclick="cpPickLayerFont('${tid}',${idx},${slideIndex},'${name}','${x.id}')">${x.label}</button>`;
    }).join("");
    return `<div class="cc-ctx-list" role="listbox" aria-label="Font">${items}</div>`;
  }
  const cur = ((sty.layerColors || {})[name] || sty.textColor || "#ffffff").toLowerCase();
  const isPreset = CP_CTX_COLORS.includes(cur);
  const swatches = CP_CTX_COLORS.map(c => {
    const on = cur === c;
    return `<button type="button" class="cc-ctx-swatch${on ? " active" : ""}" style="background:${c}" aria-label="Color ${c}" aria-pressed="${on}" onclick="cpPickLayerColor('${tid}',${idx},${slideIndex},'${name}','${c}')"></button>`;
  }).join("");
  const customStyle = isPreset ? "" : `background:${cur}`;
  return `<div class="cc-ctx-swatches">${swatches}<label class="cc-ctx-swatch cc-ctx-custom${isPreset ? "" : " active"}" style="${customStyle}" title="Custom color"><input type="color" value="${cur}" aria-label="Custom color" oninput="cpPickLayerColor('${tid}',${idx},${slideIndex},'${name}',this.value,false)"/></label></div>`;
}

window.cpToggleCtxPanel = (kind) => {
  cpCtxPanel = cpCtxPanel === kind ? null : kind;
  cpRefreshCtx();
};
window.cpPickLayerFont = (tid, idx, slideIndex, name, typoId) => {
  cpSetLayerStyle(tid, idx, slideIndex, "layerFonts", name, typoId);
  cpRefreshCtx();
};
window.cpPickLayerColor = (tid, idx, slideIndex, name, color, refresh = true) => {
  cpSetLayerStyle(tid, idx, slideIndex, "layerColors", name, color);
  if (refresh) cpRefreshCtx();
};

// Double-tap opens the words for typing. The element keeps its font, size, colour and place.
function cpStartTextEdit(block) {
  const txt = block.querySelector(".cc-live-text");
  if (!txt) return;
  txt.setAttribute("contenteditable", "true");
  txt.setAttribute("spellcheck", "true");
  if (txt.classList.contains("is-empty")) { txt.textContent = ""; txt.classList.remove("is-empty"); }
  txt.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(txt);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
function cpEditedValue(txt) { return (txt.innerText || "").replace(/\n+$/, ""); }
function cpTextTarget(txt) {
  const block = txt.closest(".cp-canvas-block"), stage = txt.closest(".cc-live-stage");
  const layer = block && CARD_LAYERS.find(L => L.key === block.dataset.canvasBlock);
  if (!stage || !layer) return null;
  return { tid: stage.dataset.tid, idx: Number(stage.dataset.idx), slideIndex: Number(stage.dataset.slideIndex), field: layer.field };
}

function cpPlateKey(tid, idx, slideIndex) {
  const o = S.outs[tid]?.[idx];
  const ctx = o?._renderCtx || {};
  const slide = cpCardSlide(tid, idx, slideIndex) || {};
  const sty = slide._style || {};
  const bg = sty.bgImage ? `up:${sty.bgImage.length}:${sty.bgImage.slice(-48)}:${sty.bgName || ""}` : "";
  const focal = S.focalPoint?.[tid] ? `${S.focalPoint[tid].x}/${S.focalPoint[tid].y}` : "";
  return [tid, idx, slideIndex, ctx.palette || "", ctx.category || "", ctx.format || o?.aspect || "", bg, ctx.imageUrl || "", slide.customImage || "", focal].join("|");
}

function cpEnsurePlate(tid, idx, slideIndex) {
  const plateKey = cpPlateKey(tid, idx, slideIndex);
  let entry = cpPlateCache.get(plateKey);
  if (entry) return entry;
  entry = { src: null, failed: false, pending: true };
  cpPlateCache.set(plateKey, entry);
  const o = S.outs[tid]?.[idx];
  const ctx = o?._renderCtx;
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!ctx || !slide) { entry.pending = false; entry.failed = true; return entry; }
  const sty = slide._style || {};
  // Dim 0: the dim is drawn live in the browser, so the plate is the bare photo.
  const payload = {
    ...ctx,
    slides: [{ ...slide, img: undefined, localImg: undefined, customImage: sty.bgImage || slide.customImage || undefined, dim: 0, plateOnly: true }],
    plateOnly: true,
    focalPoint: S.focalPoint?.[tid] ? { x: S.focalPoint[tid].x / 100, y: S.focalPoint[tid].y / 100 } : null,
    brand: BRAND_PRESETS[S.brandPreset?.[tid] || "creator"]
  };
  generateCardsWithRetry(payload)
    .then(cd => { entry.src = (cd.images || [])[0] || null; entry.failed = !entry.src; })
    .catch(() => { entry.failed = true; })
    .finally(() => { entry.pending = false; cpPaintPlate(plateKey); });
  return entry;
}

function cpPaintPlate(plateKey) {
  const entry = cpPlateCache.get(plateKey);
  document.querySelectorAll(".cc-live-plate").forEach(el => {
    if (el.dataset.cpPlate !== plateKey) return;
    el.style.backgroundImage = entry && entry.src ? `url("${entry.src}")` : "";
    const status = el.parentElement.querySelector(".cc-live-status");
    if (status) status.textContent = entry && entry.failed ? "Preview couldn't load. Text still updates." : (entry && entry.src ? "" : "Loading preview…");
  });
  cpSyncGalleryPlate(cpThemeGallery);
  document.querySelectorAll(".cc-live-plate").forEach(el => {
    if (el.dataset.cpPlate !== plateKey) return;
    const st = el.closest(".cc-live-stage");
    if (st) cpScheduleExport(st.dataset.tid, Number(st.dataset.idx), Number(st.dataset.slideIndex));
  });
}

// Writes the shared card state into one live stage: photo, dim, text, fonts, colours and boxes.
function cpUpdateLiveStage(tid, idx, slideIndex) {
  const stage = document.querySelector(`[data-canvas-stage="${tid}-${idx}-${slideIndex}"]`);
  if (!stage) return;
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!slide) return;
  const o = S.outs[tid]?.[idx];
  const sty = slide._style || {};
  const plateKey = cpPlateKey(tid, idx, slideIndex);
  const plateEl = stage.querySelector(".cc-live-plate");
  if (plateEl) plateEl.dataset.cpPlate = plateKey;
  const dimEl = stage.querySelector(".cc-live-dim");
  if (dimEl) dimEl.style.opacity = String(Math.max(0, Math.min(0.8, Number(sty.dim) || 0)));
  if (sty.bgImage) {
    // A chosen photo appears at once and needs no server render while the user is choosing.
    if (plateEl && plateEl.dataset.cpBgSrc !== sty.bgImage) {
      plateEl.style.backgroundImage = `url("${sty.bgImage}")`;
      plateEl.style.backgroundPosition = S.focalPoint?.[tid] ? `${S.focalPoint[tid].x}% ${S.focalPoint[tid].y}%` : "center";
      plateEl.dataset.cpBgSrc = sty.bgImage;
    }
    const status = stage.querySelector(".cc-live-status");
    if (status) status.textContent = "";
  } else {
    if (plateEl) { plateEl.dataset.cpBgSrc = ""; plateEl.style.backgroundPosition = ""; }
    cpEnsurePlate(tid, idx, slideIndex);
    cpPaintPlate(plateKey);
  }
  CARD_LAYERS.forEach(L => {
    const block = stage.querySelector(`[data-canvas-block="${L.key}"]`);
    if (!block) return;
    const txt = block.querySelector(".cc-live-text");
    const val = slide[L.field] || "";
    if (txt) {
      const typing = txt === document.activeElement;
      if (!typing) txt.textContent = val || L.label;
      txt.classList.toggle("is-empty", !val && !typing);
      txt.style.cssText = cpLiveTextStyle(slide, L.key, o, tid);
    }
    if (cpCanvasDragging(block)) return; // the pointer owns the box while dragging
    const pos = (slide.textLayout || {})[L.key] || CP_LIVE_DEFAULT_BOX[L.key];
    block.style.left = `${pos.x * 100}%`;
    block.style.top = `${pos.y * 100}%`;
    block.style.width = `${pos.width * 100}%`;
    block.style.height = `${pos.height * 100}%`;
  });
  cpSyncStylePanel(tid, idx, slideIndex, slide);
  cpScheduleExport(tid, idx, slideIndex);
}

// ── Export: the saved image is drawn from the same card state as the live preview ──
// The photo (or chosen background), the dimming and each text box are drawn on a
// 1080-wide canvas with the same box positions, fonts, sizes and colours the editor
// uses. Nothing is sent to the server, so downloads and saves match the preview.
const CP_EXPORT_W = 1080;
const cpExportTimers = new Map();
const cpExportSigs = new Map();
const cpExportChain = new Map();
const cpExportKey = (tid, idx, si) => `${tid}-${idx}-${si}`;

// The shape of the exported image, from the same format rules the preview uses.
function cpExportAspect(o, isSlide) {
  if (isSlide) return [4, 5];
  if (o.aspect === "reel" || o.aspect === "tiktok") return [9, 16];
  if (o.aspect === "youtube") return [16, 9];
  return [1, 1];
}

// Reads everything the image needs in one synchronous step, so an edit made while
// the image is being drawn cannot leave it half old and half new.
function cpExportSnapshot(tid, idx, si) {
  const o = S.outs[tid]?.[idx];
  const slide = cpCardSlide(tid, idx, si);
  if (!o || !slide || !o._renderCtx) return null;
  const sty = JSON.parse(JSON.stringify(slide._style || {}));
  const plateKey = cpPlateKey(tid, idx, si);
  const entry = cpPlateCache.get(plateKey);
  let plateSrc = "";
  let plateId = "none";
  if (sty.bgImage) {
    plateSrc = sty.bgImage;
    plateId = "upload:" + plateKey;
  } else {
    if (!entry || entry.pending) return null; // the photo is still on its way
    if (entry.src) { plateSrc = entry.src; plateId = "server:" + plateKey; }
  }
  const typo = o._renderCtx.typography;
  const layers = CARD_LAYERS.map(L => {
    const text = String(slide[L.field] || "");
    const face = (sty.layerFonts || {})[L.key] || sty.typography || typo || "impact";
    const vis = TYPO_VIS[face] || {};
    const k = Math.max(0.5, Math.min(1.6, Number((sty.layerScale || {})[L.key]) || 1));
    return {
      key: L.key,
      text: L.key === "ctaLine" ? text.toUpperCase() : text,
      family: vis.f || "Inter, sans-serif",
      weight: vis.w || 700,
      size: CP_LIVE_BASE_SIZE[L.key] * k / 100, // the editor sizes text in 1% of the card width
      color: (sty.layerColors || {})[L.key] || sty.textColor || "#ffffff",
      box: (slide.textLayout || {})[L.key] || CP_LIVE_DEFAULT_BOX[L.key]
    };
  });
  const focal = sty.bgImage && S.focalPoint?.[tid] ? S.focalPoint[tid] : null;
  const state = {
    plateId,
    aspect: cpExportAspect(o, o.type === "carousel"),
    dim: Math.max(0, Math.min(0.8, Number(sty.dim) || 0)),
    focal: focal ? [focal.x, focal.y] : null,
    layers
  };
  return { state, sig: JSON.stringify(state), plateSrc };
}

function cpLoadExportImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("photo did not load"));
    im.src = src;
  });
}

// Breaks text into lines the way the preview does: words wrap, and a word longer than the box breaks anywhere.
function cpWrapLines(ctx, text, maxW) {
  const out = [];
  String(text).split("\n").forEach(para => {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach(w => {
      const candidate = line ? `${line} ${w}` : w;
      if (ctx.measureText(candidate).width <= maxW) { line = candidate; return; }
      if (line) { out.push(line); line = ""; }
      if (ctx.measureText(w).width <= maxW) { line = w; return; }
      for (const ch of w) {
        if (line && ctx.measureText(line + ch).width > maxW) { out.push(line); line = ""; }
        line += ch;
      }
    });
    out.push(line);
  });
  return out;
}

// One text box: clipped to its box like the preview, top-aligned, 1.05 line height, with the same shadow.
function cpDrawTextBox(ctx, l, W, H) {
  const px = l.size * W;
  const lineH = px * 1.05;
  const left = l.box.x * W, top = l.box.y * H, bw = l.box.width * W, bh = l.box.height * H;
  ctx.font = `${l.weight} ${px}px ${l.family}`;
  const lines = cpWrapLines(ctx, l.text, bw);
  const m = ctx.measureText("Hg");
  const asc = m.fontBoundingBoxAscent ?? px * 0.8;
  const desc = m.fontBoundingBoxDescent ?? px * 0.2;
  const firstBaseline = top + (lineH - (asc + desc)) / 2 + asc;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, bw, bh);
  ctx.clip();
  ctx.font = `${l.weight} ${px}px ${l.family}`;
  ctx.fillStyle = l.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0.006 * W; // 0.6% of the width, as in the preview's text-shadow
  ctx.shadowBlur = 0.035 * W;    // 3.5% of the width
  lines.forEach((ln, i) => ctx.fillText(ln, left, firstBaseline + i * lineH));
  ctx.restore();
}

// Draws one card from a snapshot and returns it as a JPEG data URL.
async function cpComposeCard(snap) {
  const { state } = snap;
  const W = CP_EXPORT_W;
  const H = Math.round(W * state.aspect[1] / state.aspect[0]);
  const families = [...new Set(state.layers.filter(l => l.text).map(l => l.family))];
  await Promise.all(families.map(f => document.fonts.load(`900 40px ${f}`).catch(() => null)));
  const photo = snap.plateSrc ? await cpLoadExportImage(snap.plateSrc) : null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1b1b1f";
  ctx.fillRect(0, 0, W, H);
  if (photo) {
    const s = Math.max(W / photo.naturalWidth, H / photo.naturalHeight);
    const dw = photo.naturalWidth * s, dh = photo.naturalHeight * s;
    const [fx, fy] = state.focal ? state.focal.map(v => v / 100) : [0.5, 0.5];
    ctx.drawImage(photo, (W - dw) * fx, (H - dh) * fy, dw, dh);
  }
  if (state.dim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${state.dim})`;
    ctx.fillRect(0, 0, W, H);
  }
  state.layers.forEach(l => { if (l.text) cpDrawTextBox(ctx, l, W, H); });
  return canvas.toDataURL("image/jpeg", 0.92);
}

function cpCurrentExportImg(tid, idx, si) {
  const o = S.outs[tid]?.[idx];
  if (!o) return "";
  return o.type === "carousel" ? (o.slides?.[si]?.img || "") : (o.img || "");
}

function cpSetExportImg(tid, idx, si, url) {
  const o = S.outs[tid]?.[idx];
  if (!o) return;
  if (o.type === "carousel") { if (o.slides?.[si]) o.slides[si].img = url; }
  else o.img = url;
}

// Queues an export for one card. Exports for a card run one after another, and each starts from
// the newest look. Resolves to the image URL, or "" when the image could not be made.
function cpRunExport(tid, idx, si) {
  const key = cpExportKey(tid, idx, si);
  const run = (cpExportChain.get(key) || Promise.resolve()).then(() => cpExportNow(tid, idx, si));
  cpExportChain.set(key, run.catch(() => {}));
  return run;
}

// Draws the card if its look has changed, then updates the mockup image in place (no re-render).
async function cpExportNow(tid, idx, si) {
  const key = cpExportKey(tid, idx, si);
  const snap = cpExportSnapshot(tid, idx, si);
  if (!snap) return "";
  const current = cpCurrentExportImg(tid, idx, si);
  if (cpExportSigs.get(key) === snap.sig && current) return current;
  let url = "";
  try { url = await cpComposeCard(snap); } catch (e) { url = ""; }
  if (!url) return "";
  cpExportSigs.set(key, snap.sig);
  cpSetExportImg(tid, idx, si, url);
  document.querySelectorAll(`img[data-cp-export="${key}"]`).forEach(im => { if (im.src !== url) im.src = url; });
  return url;
}

// Live edits export after a short pause, so typing and dragging do not redraw on every frame.
function cpScheduleExport(tid, idx, si) {
  const key = cpExportKey(tid, idx, si);
  clearTimeout(cpExportTimers.get(key));
  cpExportTimers.set(key, setTimeout(() => {
    cpExportTimers.delete(key);
    cpRunExport(tid, idx, si).catch(() => {});
  }, 180));
}

// Runs a card's export now, skipping the pause. Used before a download or a save.
function cpFlushExport(tid, idx, si) {
  const key = cpExportKey(tid, idx, si);
  clearTimeout(cpExportTimers.get(key));
  cpExportTimers.delete(key);
  return cpRunExport(tid, idx, si).catch(() => "");
}

// True when a card's image already matches its look, so it can be downloaded inside the tap.
function cpExportReady(tid, idx, si) {
  const key = cpExportKey(tid, idx, si);
  const snap = cpExportSnapshot(tid, idx, si);
  return !!(snap && cpCurrentExportImg(tid, idx, si) && cpExportSigs.get(key) === snap.sig && !cpExportTimers.has(key));
}

// Brings every slide up to date. Resolves to the slide image URLs in order, or null if any slide failed.
async function cpFlushExports(tid, idx) {
  const o = S.outs[tid]?.[idx];
  if (!o) return null;
  const slideIdxs = o.type === "carousel" ? (o.slides || []).map((_, si) => si) : [0];
  const urls = [];
  for (const si of slideIdxs) {
    const url = await cpFlushExport(tid, idx, si);
    if (!url) return null;
    urls.push(url);
  }
  return urls;
}

// Uploads exported images so saved cards keep their picture. Resolves to a copy of the card that points at the stored images.
async function cpStoreCardImages(tid, idx, urls) {
  const o = S.outs[tid]?.[idx];
  const storeOne = async (url) => {
    if (!url || !url.startsWith("data:")) return url;
    const r = await api("/api/card-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: S.token, dataUrl: url }) });
    if (!r || !r.success || !r.url) throw new Error(r?.error || "upload failed");
    return r.url;
  };
  const copy = { ...o };
  if (o.type === "carousel") {
    copy.slides = [];
    for (let si = 0; si < (o.slides || []).length; si++) {
      const img = await storeOne(urls[si]);
      copy.slides.push({ ...o.slides[si], img });
    }
  } else {
    copy.img = await storeOne(urls[0]);
  }
  return copy;
}

// Keeps the "Text on the card" fields in step with the preview, leaving any field the user is typing in alone.
function cpSyncStylePanel(tid, idx, slideIndex, slide) {
  const key = `${tid}-${idx}-${slideIndex}`;
  const sty = slide._style || {};
  const dimPct = Math.round((Number(sty.dim) || 0) * 100);
  document.querySelectorAll(`[data-cp-bg="${key}"] input[type=range]`).forEach(r => { if (r !== document.activeElement) r.value = dimPct; });
  const panel = document.querySelector(`[data-cp-style="${key}"]`);
  if (!panel) return;
  CARD_LAYERS.forEach(L => {
    const row = panel.querySelector(`[data-cp-layer="${L.key}"]`);
    if (!row) return;
    const field = row.querySelector("textarea, input[type=text]");
    if (field && field !== document.activeElement) field.value = slide[L.field] || "";
    const sel = row.querySelector("select");
    if (sel) sel.value = (sty.layerFonts || {})[L.key] || "";
    const col = row.querySelector("input[type=color]");
    if (col && col !== document.activeElement) col.value = (sty.layerColors || {})[L.key] || sty.textColor || "#ffffff";
    const range = row.querySelector("input[type=range]");
    if (range && range !== document.activeElement) range.value = Math.round((((sty.layerScale || {})[L.key]) || 1) * 100);
  });
  const dimRange = panel.querySelector('input[aria-label="Dim background photo"]');
  if (dimRange && dimRange !== document.activeElement) dimRange.value = dimPct;
  const hint = panel.querySelector(".cc-bg-hint");
  if (hint) hint.textContent = sty.bgName || "Article photo";
  const themeHint = panel.querySelector(".cc-th-hint");
  if (themeHint) themeHint.textContent = window.CardThemes?.themeName(sty.themeId) || window.CardThemes?.colourName(sty.colourThemeId) || "Original look";
}

function cpSyncLiveStages() {
  document.querySelectorAll(".cc-live-stage[data-tid]").forEach(st => {
    cpUpdateLiveStage(st.dataset.tid, Number(st.dataset.idx), Number(st.dataset.slideIndex));
  });
}

// Saves a finished move or resize into the shared card state, as fractions of the stage.
function cpCommitBlockLayout(block) {
  const stage = block.closest(".cc-live-stage");
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const b = block.getBoundingClientRect();
  const slide = cpCardSlide(stage.dataset.tid, Number(stage.dataset.idx), Number(stage.dataset.slideIndex));
  if (!slide || !rect.width || !rect.height) return;
  slide.textLayout = {
    ...(slide.textLayout || {}),
    [block.dataset.canvasBlock]: {
      x: (b.left - rect.left) / rect.width,
      y: (b.top - rect.top) / rect.height,
      width: b.width / rect.width,
      height: b.height / rect.height
    }
  };
  cpScheduleExport(stage.dataset.tid, Number(stage.dataset.idx), Number(stage.dataset.slideIndex));
}

const cardCanvasPointer = (() => {
  let lastTap = null; // the last text block tapped, to tell a double tap from two single taps
  document.addEventListener("pointerdown", (event) => {
    const active = document.querySelector('.cc-live-text[contenteditable="true"]');
    if (active && active.contains(event.target)) return; // native caret and selection while typing
    if (active) active.blur(); // tapping anywhere else finishes the edit
    const stage = event.target.closest(".cc-live-stage");
    if (!stage) { if (!event.target.closest(".cp-canvas-editor")) { cpSelectCanvasBlock(null, null); cpBgKey = null; cpRefreshBgMenu(); } return; }
    const block = event.target.closest(".cp-canvas-block");
    if (!block) { cpSelectCanvasBlock(null, null); cpBgKey = stage.dataset.canvasStage; cpRefreshBgMenu(); return; }
    const key = stage.dataset.canvasStage, name = block.dataset.canvasBlock;
    const now = Date.now();
    const doubleTap = !!lastTap && lastTap.key === key && lastTap.name === name && now - lastTap.time < 350 && !event.target.closest("[data-canvas-resize]");
    lastTap = doubleTap ? null : { key, name, time: now };
    if (doubleTap) cpSelectCanvasBlock(key, name);
    const rect = stage.getBoundingClientRect();
    const resizing = !!event.target.closest("[data-canvas-resize]");
    const boxRect = block.getBoundingClientRect();
    cpSelectCanvasBlock(stage.dataset.canvasStage, block.dataset.canvasBlock);
    cpCanvasActive = { block, rect, startX: event.clientX, startY: event.clientY, left: boxRect.left - rect.left, top: boxRect.top - rect.top, width: boxRect.width, height: boxRect.height, resizing, moved: false, editOnRelease: doubleTap };
    block.setPointerCapture?.(event.pointerId);
    block.classList.add("is-active");
    event.preventDefault();
  });
  document.addEventListener("pointermove", (event) => {
    const a = cpCanvasActive;
    if (!a) return;
    const dx = event.clientX - a.startX, dy = event.clientY - a.startY;
    if (!a.moved) { if (Math.hypot(dx, dy) < 4) return; a.moved = true; }
    const { block, rect, left, top, width, height, resizing } = a;
    const w = resizing ? Math.max(44, Math.min(rect.width - left, width + dx)) : width;
    const h = resizing ? Math.max(36, Math.min(rect.height - top, height + dy)) : height;
    const x = resizing ? left : Math.max(0, Math.min(rect.width - width, left + dx));
    const y = resizing ? top : Math.max(0, Math.min(rect.height - height, top + dy));
    block.style.left = `${x / rect.width * 100}%`; block.style.top = `${y / rect.height * 100}%`;
    block.style.width = `${w / rect.width * 100}%`; block.style.height = `${h / rect.height * 100}%`;
  });
  const finish = () => {
    const a = cpCanvasActive;
    if (!a) return;
    a.block.classList.remove("is-active");
    if (a.moved) cpCommitBlockLayout(a.block);
    else if (a.editOnRelease) cpStartTextEdit(a.block); // a double tap that did not move opens the words
    cpCanvasActive = null;
  };
  document.addEventListener("pointerup", finish);
  document.addEventListener("pointercancel", finish);

  // While a block is being typed in: typing updates the card state live, Escape or
  // (on the single-line call to action) Enter finishes, and paste keeps plain text only.
  document.addEventListener("input", (event) => {
    const txt = event.target.closest?.('.cc-live-text[contenteditable="true"]');
    const t = txt && cpTextTarget(txt);
    if (t) cpSetSlideText(t.tid, t.idx, t.slideIndex, t.field, cpEditedValue(txt));
  });
  document.addEventListener("focusout", (event) => {
    const txt = event.target.closest?.('.cc-live-text[contenteditable="true"]');
    if (!txt) return;
    txt.removeAttribute("contenteditable");
    const t = cpTextTarget(txt);
    if (t) cpSetSlideText(t.tid, t.idx, t.slideIndex, t.field, cpEditedValue(txt));
  });
  document.addEventListener("keydown", (event) => {
    const txt = event.target.closest?.('.cc-live-text[contenteditable="true"]');
    if (!txt) return;
    const single = txt.closest(".cp-canvas-block")?.dataset.canvasBlock === "ctaLine";
    if (event.key === "Escape" || (event.key === "Enter" && single)) { event.preventDefault(); txt.blur(); }
  });
  document.addEventListener("paste", (event) => {
    const txt = event.target.closest?.('.cc-live-text[contenteditable="true"]');
    if (!txt) return;
    event.preventDefault();
    const single = txt.closest(".cp-canvas-block")?.dataset.canvasBlock === "ctaLine";
    const plain = (event.clipboardData || window.clipboardData).getData("text/plain").replace(/\r?\n/g, single ? " " : "\n");
    document.execCommand("insertText", false, plain);
  });
  return true;
})();

// ── Card style: font, text colour and background for a generated graphic ──
function cpCardSlide(tid, idx, slideIndex) {
  const o = S.outs[tid]?.[idx];
  if (!o) return null;
  if (o.type === "carousel") return o.slides?.[slideIndex] || null;
  if (!o.editSlide) o.editSlide = {type:"hook", headline:S.trends.find(t=>t.id===tid)?.headline||o.label, slideNumber:1, totalSlides:1, imageUrl:o._renderCtx?.imageUrl};
  return o.editSlide;
}
window.cpSetCardStyle = (tid, idx, slideIndex, key, value) => {
  const slide = cpCardSlide(tid, idx, slideIndex); if (!slide) return;
  slide._style = slide._style || {};
  slide._style[key] = value;
  cpUpdateLiveStage(tid, idx, slideIndex);
};
window.cpSetSlideText = (tid, idx, slideIndex, field, value) => {
  const slide = cpCardSlide(tid, idx, slideIndex); if (!slide) return;
  slide[field] = value;
  cpUpdateLiveStage(tid, idx, slideIndex);
};
window.cpSetLayerStyle = (tid, idx, slideIndex, group, layerKey, value) => {
  const slide = cpCardSlide(tid, idx, slideIndex); if (!slide) return;
  slide._style = slide._style || {};
  slide._style[group] = { ...(slide._style[group] || {}), [layerKey]: value };
  cpUpdateLiveStage(tid, idx, slideIndex);
};
// Phone overlay text (name, caption, hashtags, sound) is plain HTML, so it
// updates the mockup in place. Keeping the editor open while typing.
window.cpSetMockText = (tid, key, value) => {
  S.mockText = S.mockText || {};
  S.mockText[tid] = { ...(S.mockText[tid] || {}), [key]: value };
  document.querySelectorAll(`[data-cp-mock="${key}"][data-cp-tid="${tid}"]`).forEach(el => {
    el.textContent = value || el.dataset.cpDefault || "";
  });
};
window.cpPickCardBackground = async (input, tid, idx, slideIndex) => {
  const file = input.files && input.files[0];
  if (!file) return;
  let dataUrl;
  try { dataUrl = await downscaleImageFile(file, 1600, 0.85); }
  catch (e) { toast("Couldn't read that image. Try a different photo."); return; }
  const name = file.name.slice(0, 40);
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (slide) {
    slide._style = slide._style || {};
    slide._style.bgHistory = [{ src: dataUrl, name }, ...(slide._style.bgHistory || []).filter(h => h.name !== name).slice(0, 2)];
  }
  window.cpSetCardStyle(tid, idx, slideIndex, "bgImage", dataUrl);
  window.cpSetCardStyle(tid, idx, slideIndex, "bgName", name);
  cpRefreshBgMenu();
  toast("Background updated. Apply saves it to the card image.");
};

// ── Themes gallery ──────────────────────────────────────────────
// Opens over the editor. Each tile shows this graphic's own photo (a text-free
// plate from the server) with the real headline, supporting text and CTA drawn
// in the theme's type and colours. Picking a tile applies it to the card.
let cpThemeGallery = null;
function cpThemeTileHTML(gal, kind, t, sty, slide, plateCss) {
  const CT = window.CardThemes;
  const v = CT.preview(kind, t.id, sty);
  const active = kind === "style" ? sty.themeId === t.id : sty.colourThemeId === t.id;
  const fam = TYPO_VIS[v.typography] || TYPO_VIS.impact;
  const pick = kind === "style" ? "cpPickTheme" : "cpPickColourTheme";
  if (kind === "colour") {
    return `<button type="button" class="cc-th-swatch${active ? " active" : ""}" aria-pressed="${active}" onclick="${pick}('${gal.tid}',${gal.idx},${gal.slideIndex},'${t.id}')">
      <span class="cc-th-dots"><i style="background:${v.textColor}"></i><i style="background:${v.accent}"></i></span><span>${esc(t.name)}</span></button>`;
  }
  return `<button type="button" class="cc-th-tile${active ? " active" : ""}" aria-pressed="${active}" onclick="${pick}('${gal.tid}',${gal.idx},${gal.slideIndex},'${t.id}')">
    <span class="cc-th-frame" style="${plateCss}">
      <span class="cc-th-dim" style="background:rgba(0,0,0,${v.dim})"></span>
      <span class="cc-th-copy" style="font-family:${fam.f};font-weight:${fam.w};text-transform:${fam.up ? "uppercase" : "none"};color:${v.textColor}">
        <span class="cc-th-headline">${esc(slide.headline || "")}</span>
        ${slide.supportingText || slide.body ? `<span class="cc-th-sub">${esc(slide.supportingText || slide.body)}</span>` : ""}
        ${slide.ctaLine ? `<span class="cc-th-cta" style="color:${v.accent}">${esc(slide.ctaLine)}</span>` : ""}
      </span>
    </span>
    <span class="cc-th-name">${esc(t.name)}</span>
  </button>`;
}
function cpRenderThemeGallery() {
  const gal = cpThemeGallery;
  const body = document.getElementById("cthBody");
  if (!gal || !body) return;
  const slide = cpCardSlide(gal.tid, gal.idx, gal.slideIndex);
  if (!slide) return;
  const sty = slide._style || {};
  const CT = window.CardThemes;
  const plateCss = gal.plate ? `background-image:url("${gal.plate}")` : "background:#1b1b1f";
  const status = gal.failed ? "Previews couldn't load, but themes still apply to the card." : (gal.plate ? "" : "Loading previews…");
  body.innerHTML = `
    <div class="cc-th-section">Looks</div>
    <div class="cc-th-list">${CT.STYLE_THEMES.map(t => cpThemeTileHTML(gal, "style", t, sty, slide, plateCss)).join("")}</div>
    <div class="cc-th-section">Colour themes</div>
    <div class="cc-th-swatches">${CT.COLOUR_THEMES.map(t => cpThemeTileHTML(gal, "colour", t, sty, slide, plateCss)).join("")}</div>
    <div class="cc-th-status" role="status">${status}</div>`;
}
// The gallery shows the same bare photo as the editor. A photo the user chose is
// already in the browser, and the editor\'s plate is cached, so opening the gallery
// normally needs no request at all.
function cpLoadThemePlate(gal) {
  const o = S.outs[gal.tid]?.[gal.idx];
  const ctx = o?._renderCtx;
  const slide = cpCardSlide(gal.tid, gal.idx, gal.slideIndex);
  if (!ctx || !slide) return;
  const sty = slide._style || {};
  if (sty.bgImage) { gal.plate = sty.bgImage; cpRenderThemeGallery(); return; }
  gal.plateKey = cpPlateKey(gal.tid, gal.idx, gal.slideIndex);
  cpEnsurePlate(gal.tid, gal.idx, gal.slideIndex);
  cpSyncGalleryPlate(gal);
}
// Moves the cached plate into an open gallery once it has loaded.
function cpSyncGalleryPlate(gal) {
  if (!gal || cpThemeGallery !== gal || !gal.plateKey) return;
  const entry = cpPlateCache.get(gal.plateKey);
  if (!entry || entry.pending) return;
  const src = entry.src || null;
  const failed = !!entry.failed;
  if (gal.plate === src && gal.failed === failed) return;
  gal.plate = src;
  gal.failed = failed;
  cpRenderThemeGallery();
}
window.cpOpenThemes = (tid, idx, slideIndex) => {
  const o = S.outs[tid]?.[idx];
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!o || !o._renderCtx || !slide || o.type === "carousel") { toast("Themes work on a single graphic for now."); return; }
  window.cpCloseThemes();
  const gal = { tid, idx, slideIndex, plate: null, failed: false };
  cpThemeGallery = gal;
  const overlay = document.createElement("div");
  overlay.className = "cc-th-overlay";
  overlay.id = "cthOverlay";
  overlay.innerHTML = `<div class="cc-th-sheet" role="dialog" aria-modal="true" aria-labelledby="cthTitle">
    <div class="cc-th-head"><h2 id="cthTitle">Themes</h2><button type="button" class="btn bo bxs" onclick="cpCloseThemes()" aria-label="Close themes">Close</button></div>
    <div class="cc-th-body" id="cthBody"></div>
    <div class="cc-th-foot"><button type="button" class="btn bo bxs" onclick="cpRestoreTheme('${tid}',${idx},${slideIndex})">Restore original look</button></div>
  </div>`;
  document.body.appendChild(overlay);
  cpRenderThemeGallery();
  cpLoadThemePlate(gal);
};
window.cpCloseThemes = () => {
  document.getElementById("cthOverlay")?.remove();
  cpThemeGallery = null;
};
// Repaints the open card from its shared style at once. Themes and restore never
// call the server. The image is drawn from the same look on Download or Save.
function cpApplyThemeLive(tid, idx, slideIndex) {
  const stage = document.querySelector(`[data-canvas-stage="${tid}-${idx}-${slideIndex}"]`);
  if (stage) cpUpdateLiveStage(tid, idx, slideIndex);
  else render();
}
function cpApplyThemeResult(tid, idx, slideIndex, next) {
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!slide || !next) { toast("That theme isn't available."); return; }
  slide._style = next;
  window.cpCloseThemes();
  cpApplyThemeLive(tid, idx, slideIndex);
}
window.cpPickTheme = (tid, idx, slideIndex, themeId) => {
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!slide) return;
  cpApplyThemeResult(tid, idx, slideIndex, window.CardThemes.applyTheme(slide._style || {}, themeId));
};
window.cpPickColourTheme = (tid, idx, slideIndex, colourId) => {
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!slide) return;
  cpApplyThemeResult(tid, idx, slideIndex, window.CardThemes.applyColourTheme(slide._style || {}, colourId));
};
window.cpRestoreTheme = (tid, idx, slideIndex) => {
  const slide = cpCardSlide(tid, idx, slideIndex);
  if (!slide) return;
  const res = window.CardThemes.restore(slide._style || {});
  if (!res.restored) { toast("This graphic is already in its original look."); return; }
  slide._style = res.style;
  window.cpCloseThemes();
  cpApplyThemeLive(tid, idx, slideIndex);
};
window.copyOutput = (tid, idx) => { const output=S.outs[tid]?.[idx]; if(output) copyTxt(output.content||""); };
window.toggleOutputEdit = (tid, idx) => {
  const key = `${tid}-${idx}`;
  S.outputEditing = S.outputEditing || {};
  S.outputEditing[key] = !S.outputEditing[key];
  render();
};
window.setOutputContent = (tid, idx, value) => {
  const output = S.outs[tid]?.[idx];
  if (output) output.content = value;
};
window.setPreviewPlat = (key, plat) => { S.previewPlat = S.previewPlat || {}; S.previewPlat[key] = plat; render(); };
window.setPreviewSlide = (key, idx) => { S.previewSlideIdx = S.previewSlideIdx || {}; S.previewSlideIdx[key] = idx; render(); };
window.setPreviewMode = (key, mode) => { S.previewMode = S.previewMode || {}; S.previewMode[key] = mode; render(); };

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
// Downloads a card as it looks now. A card that is already up to date downloads inside the tap,
// which phone browsers need; otherwise it is brought up to date first.
window.cpDownloadCard = async (tid, idx, si, name) => {
  if (cpExportReady(tid, idx, si)) { window.dl(cpCurrentExportImg(tid, idx, si), name); return; }
  const url = await cpFlushExport(tid, idx, si);
  if (!url) { toast("Couldn't prepare this image. Try again in a moment."); return; }
  window.dl(url, name);
};
window.cpDownloadAll = async (tid, idx) => {
  const o = S.outs[tid]?.[idx];
  const slideIdxs = (o?.slides || []).map((_, si) => si);
  if (!slideIdxs.length) return;
  if (slideIdxs.every(si => cpExportReady(tid, idx, si))) {
    window.dlAll(slideIdxs.map(si => cpCurrentExportImg(tid, idx, si)));
    return;
  }
  const urls = await cpFlushExports(tid, idx);
  if (!urls) { toast("Couldn't prepare every slide. Try again in a moment."); return; }
  window.dlAll(urls);
};
// The first file starts inside the tap; the rest follow on a short delay so phones don't drop them.
window.dlAll = (urls) => {
  (urls || []).forEach((u, i) => {
    if (i === 0) window.dl(u, "slide-1.jpg");
    else setTimeout(() => window.dl(u, `slide-${i + 1}.jpg`), i * 350);
  });
  toast(`Downloading ${urls?.length || 0} slides`);
};

window.gen = async (tid, all) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const ct = S.ctype[tid] || PTYPES[plat]?.[0] || "";
  const tone = S.tone[tid] || "normal";
  S.loading[tid] = true; S.outs[tid] = []; render();
  try {
    const types = all ? (PTYPES[plat]||[]) : [ct];
    const out = [];
    let articleImage = t.image || null;
    for(const c of types){
      if(c === "IG Carousel" || c === "TikTok No-Face Graphic" || c === "TikTok Silent Camera" || c === "Thumbnail"){
        const category = nicheToCategory(t.niche);
        if (!articleImage) {
          try {
            const photoResult = await api(`/api/stock-photo?query=${encodeURIComponent((t.headline || "") + " " + (t.niche || ""))}&count=1`);
            articleImage = photoResult.photos?.[0]?.url || null;
          } catch (e) { console.warn("Story photo lookup failed", e); }
        }
        const isSilentCamera = c === "TikTok Silent Camera";
        const isThumbnail = c === "Thumbnail";
        const isSingle = c === "TikTok No-Face Graphic" || isSilentCamera || isThumbnail;
        const cardFormat = isSilentCamera ? "tiktok_silent" : isThumbnail ? "youtube_thumbnail" : isSingle ? "tiktok" : plat;
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
        const HOOK_SCHEMA = `"hookHeadline":"a scroll-stopping editorial headline in 4-7 punchy words, clear and specific","hookTease":"one intriguing sentence of no more than 14 words"`;
        const BODY_ITEM_SCHEMA = `{"headline":"editorial headline, 4-8 words — communicate the actual news, not just a topic label","sectionLabel":"short label like BACKGROUND or WHAT HAPPENED, else null","body":"1-2 crisp, specific sentences, max 30 words total; easy to scan in 3 seconds, not a paragraph","subject":"the entity doing the thing — a person, brand, or organization name, ONLY if the slide is naturally an announcement (someone/something did a specific thing) — else omit this field entirely","action":"the specific thing that entity did or announced, as a short clear phrase — ONLY set this alongside subject, else omit this field entirely","outcome":"1-2 sentences on why it matters or what happens next, only if subject/action are set, else omit","compareA":{"label":"short label for the first figure, e.g. BEFORE or LAST SEASON","value":"the first figure as a short string, e.g. 5.25% or 8.2 PPG"},"compareB":{"label":"short label for the second figure, e.g. AFTER or THIS SEASON","value":"the second figure as a short string"},"comparisonNote":"1 sentence on what the contrast means, only if compareA/compareB are set, else omit","claim":"the statement or move that's stirring a response, as a short bold sentence — ONLY if the story has a genuine claim/action-and-reaction dynamic, else omit this field entirely","reaction":"1-2 sentences on how people (fans, critics, the public, other parties) are actually responding, only if claim is set, else omit","reactionTag":"a short label like BACKLASH, MIXED REACTION, PRAISE, or DEBATE — only if claim is set, else omit","stat":"a number/figure from the story if one genuinely exists, else null","statLabel":"what the stat measures, else null","facts":["3-4 short standalone facts, ONLY if the story naturally breaks into a list of distinct points — else omit this field entirely"],"quote":"a real quote from someone in the story, ONLY if the source material actually contains one — else omit this field entirely","quoteAttribution":"who said it, only if quote is set","timeline":[{"label":"a date/stage label","text":"what happened at that point"}],"tag":"a short context tag like a team/event name, else null"}`;
        const REWRITE_RULES = `Design a high-retention social carousel, not a dense article. Every slide must scan in under 3 seconds: one key idea, short copy, strong contrast, plain conversational English. Use a genuinely supported stat, comparison, quote, fact list, timeline, or announcement when the source has one. Never invent facts, numbers, quotes, reactions, or comparisons. Give each slide a distinct editorial beat and preserve concrete names/context.`;

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
            `Return ONLY a valid JSON object for a single all-in-one post (there is no other slide, this must fully tell the story): {"headline":"a full, complete, REWRITTEN editorial headline stating the actual news — catchy, not a copy of the raw source headline, 6-10 words","body":"1-2 concise sentences that explain the key takeaway with real names/numbers and context, maximum 30 words total; this is the only slide, so make it complete without becoming a paragraph.","tag":"a short context tag, else null"}.`,
            `${category.name} single post. Raw source headline: "${t.headline}". Full source text: ${sourceText}`, tone
          );
          const single = extractJSON(sr) || {};
          slideArr = [{ type: isSilentCamera || isThumbnail ? "hook" : "body", headline: single.headline || t.headline, supportingText: isSilentCamera ? (single.body || sourceText) : undefined, body: isSilentCamera ? undefined : (single.body || sourceText), tag: single.tag || null, ctaLine: "FOLLOW FOR MORE →", sourceLabel: t.source || null, useCover: isSingle, silentCamera: isSilentCamera, imageUrl:articleImage }];
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
          const hookSlide = { type: "hook", headline: parsed.hookHeadline || t.headline, supportingText: parsed.hookTease || sourceText.split(/(?<=[.!?])\s/).slice(0,2).join(" "), emphasisLine: 1, sourceLabel: t.source || null };
          slideArr = [hookSlide, ...bodySlides];
        } else {
          // 6+ slides: there's enough real content that a dedicated CTA
          // slide at the end doesn't feel like a waste.
          const bodyCount = requestedCount - 2;
          const promptStr = `Return ONLY a valid JSON object: {${HOOK_SCHEMA},"slides":[array of exactly ${bodyCount} objects, each shaped like ${BODY_ITEM_SCHEMA}]}. The outro slide is added separately, don't include it. ${REWRITE_RULES}`;
          const ctxStr = `${category.name} carousel. Raw source headline: "${t.headline}". Full source text: ${sourceText}`;
          const { parsed, slides: rawSlides } = await generateSlidesWithCount(promptStr, ctxStr, tone, bodyCount);
          const bodySlides = rawSlides.map(s => ({ ...s, type: "body" }));
          const hookSlide = { type: "hook", headline: parsed.hookHeadline || t.headline, supportingText: parsed.hookTease || sourceText.split(/(?<=[.!?])\s/).slice(0,2).join(" "), emphasisLine: 1, sourceLabel: t.source || null };
          slideArr = [hookSlide, ...bodySlides, ctaOutroSlide(t.niche)];
        }
        // Real cards (actual text, actual numbers) — not AI-generated art, which
        // can't reliably render legible text. See services/statCard.js.
        let cardImgs = [];
        try {
          const cd = await generateCardsWithRetry({slides: slideArr, category, palette: S.palette[tid] || "noir_orange", format: cardFormat, imageUrl: articleImage, theme: S.cardTheme[tid] || "modern_dark", typography: S.cardTypography[tid] || "impact", density: S.cardDensity[tid] || "balanced", focalPoint: S.focalPoint[tid] ? {x:S.focalPoint[tid].x/100,y:S.focalPoint[tid].y/100} : null, brand: BRAND_PRESETS[S.brandPreset[tid] || "creator"]});
          cardImgs = (cd.images || []).map(u => (u && !/^(https?:|data:|blob:)/.test(u)) ? API + (u.startsWith('/')?'':'/') + u : u);
        } catch(e){ console.warn("generate-cards failed, using local cards", e); }
        const imageDataUrl = articleImage ? await localCardPhotoData(articleImage) : null;
        const localOpts = { palette: S.palette[tid] || "noir_orange", theme: S.cardTheme[tid] || "modern_dark", typography: S.cardTypography[tid] || "impact", density: S.cardDensity[tid] || "balanced", format: cardFormat, total: slideArr.length, imageDataUrl };
        slideArr.forEach((s,i)=>{ s.slideNumber = i+1; if (articleImage && !s.customImage) s.imageUrl = articleImage; s.localImg = localCardImage({...s,imageDataUrl:s.customImage||imageDataUrl}, localOpts); s.img = cardImgs[i] || s.localImg; });
        const imgsFinal = slideArr.map(s=>s.img);
        out.push(isSingle ? {type:"image", img: imgsFinal[0], fallbackImg: slideArr[0].localImg, aspect: isThumbnail ? "youtube" : isSilentCamera ? "tiktok" : "tiktok", isCard:true, editSlide:slideArr[0], silentCamera:isSilentCamera, sourceLabel:t.source||"Article photo", _renderCtx:{category,palette:localOpts.palette,format:cardFormat,imageUrl:articleImage,theme:localOpts.theme,typography:localOpts.typography,density:localOpts.density}} : {type:"carousel", slides: slideArr, images: imgsFinal, _renderCtx: { category, palette: localOpts.palette, format: cardFormat, imageUrl: articleImage, theme: localOpts.theme, typography: localOpts.typography, density: localOpts.density }});
      } else if(/image/i.test(c)){
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
        const isThread = /thread/i.test(c);
        const isReel = /reel/i.test(c);
        const isTikTokScript = plat === "tiktok" && isScript;
        const isCaption = /caption/i.test(c);

        let userPrompt = "";
        const isYouTubeLong = plat === "youtube" && /long form/i.test(c);
        const isYouTubeShort = plat === "youtube" && /short/i.test(c);
        const isYouTubeTitleDesc = plat === "youtube" && /title/i.test(c);
        const isYouTubeThumb = plat === "youtube" && /thumbnail/i.test(c);

        if (plat === "twitter" && isThread) {
          userPrompt = `Write a high-converting, viral 5-tweet thread for a ${t.niche} creator on X (Twitter), breaking down: "${t.headline}". Story details: ${t.summary||""}.

Thread structure requirements:
- 1/5 (The Hook): A scroll-stopping opening hook (under 240 chars) that creates an urgent curiosity gap. Tease the key revelation or debate. End with 🧵👇
- 2/5 (The Context / Stakes): The essential background in 1-2 punchy sentences. Why this matters right now.
- 3/5 (The Turning Point / Key Numbers): Specific stats, quotes, or turning points that define the story.
- 4/5 (The Analysis / Hot Take): An opinionated, debate-sparking perspective that triggers replies and quote tweets.
- 5/5 (The Payoff & Question): Final takeaway + ask an irresistible question to drive comments + "If you found this valuable, repost 🔁 and follow for daily ${t.niche} breakdowns."

Format with 1/5, 2/5, 3/5, 4/5, 5/5 clearly separated by double line breaks. Return only the ready-to-post thread with no meta-commentary.`;
        } else if (plat === "twitter" && /hot take/i.test(c)) {
          userPrompt = `Write a punchy, controversial hot take tweet (under 240 characters) for a ${t.niche} creator on X (Twitter) about: "${t.headline}". Story: ${t.summary||""}.
Make it bold, unapologetic, and designed to generate heated replies and quote-tweets. No hashtags or generic filler. Return only the ready-to-post tweet.`;
        } else if (plat === "twitter" && /engagement/i.test(c)) {
          userPrompt = `Write a high-engagement question/poll tweet (under 250 characters) for a ${t.niche} creator on X (Twitter) about: "${t.headline}". Story: ${t.summary||""}.
Give a 1-line setup, then ask an irresistible "Agree or Disagree?" or "A vs B" dilemma question that compels people to reply. Return only the ready-to-post tweet.`;
        } else if (isYouTubeLong) {
          userPrompt = `Write a comprehensive, retention-engineered Long-Form YouTube Video Script for a ${t.niche} creator about: "${t.headline}". Story details: ${t.summary||""}.

Structure requirements:
[0:00 - 0:25 THE HOOK & RETENTION STAKE]:
Open immediately on the central question or revelation without introducing yourself. Hook viewers with high stakes.

[0:25 - 1:15 THE PREVIEW & CLIMAX TEASE]:
Tease the most unexpected part of the story coming in Chapter 3. Brief channel subscribe call-to-action.

[CHAPTER 1: THE BACKSTORY]:
The origins, the key figures involved, and how the conflict escalated. Spoken dialogue with [B-ROLL / GRAPHIC] cues.

[CHAPTER 2: THE TURNING POINT]:
The pivotal breakdown, specific statistics, and controversial quotes.

[CHAPTER 3: THE UNTOLD TRUTH & IMPACT]:
The payoff teased in the intro. What mainstream news missed.

[OUTRO & RETENTION CTA]:
Never say "in conclusion" or "thanks for watching". Keep energy high, tease the next related video topic, and tell viewers to click the next video on screen right now.

Return only the ready-to-record script formatted with timestamp chapter tags.`;
        } else if (isYouTubeShort) {
          userPrompt = `Write a high-velocity, 45-60 second YouTube Short script for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.

Crucial Requirement: Use the INFINITE LOOP technique — write the script so the very last sentence seamlessly and grammatically flows directly back into the opening hook sentence, making viewers watch it on an endless loop!

Structure:
[0-3s SCROLL-STOPPING HOOK]: Shocking visual action + opening statement.
[ON-SCREEN TEXT]: Bold 3-4 word phrase.
[RAPID EXPLANATION]: 3 fast-paced spoken beats with [B-ROLL / ZOOM IN] directions.
[THE CLIMAX / VERDICT]: High drama payoff.
[INFINITE LOOP SEED]: Seamless transition sentence that loops back to the start.

Return only the ready-to-record spoken script.`;
        } else if (isYouTubeTitleDesc) {
          userPrompt = `Write YouTube Video Titles, Description, and Chapter Timestamps for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.

Requirements:
1. 3 High-CTR Title Options (under 60 characters, curiosity-driven, emotionally compelling).
2. YouTube Video Description (2-sentence SEO summary with key search terms).
3. Suggested Chapter Timestamps (e.g. 0:00 Hook, 0:42 The Backstory, 1:45 The Twist, 3:10 What This Means).
4. Top 3 Search Tags.

Return only the ready-to-copy titles and description.`;
        } else if (isYouTubeThumb) {
          userPrompt = `Provide a high-CTR YouTube Thumbnail concept & design blueprint for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.

Requirements:
- Visual Subject & Focal Point (who or what is featured, facial expression or dramatic angle).
- Background Setting & Contrast Colors (high-contrast lighting to pop on dark/light feeds).
- On-Thumbnail Graphic Text (strictly 2 to 4 words maximum, bold, punchy, curiosity-inducing).
- A/B Split Test Alternative Concept.

Return only the ready-to-use thumbnail direction.`;
        } else if (isReel) {
          userPrompt = `Write a camera-ready, high-retention 30-45 second Instagram Reel script for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.

Structure it clearly with production beats:
[HOOK - 0-3s]: Visual action cue + punchy spoken scroll-stopper.
[TEXT OVERLAY]: Bold 3-5 word on-screen text.
[BEAT 1 - CONTEXT]: Rapid-fire setup in conversational spoken English with [B-ROLL / CUTAWAY] direction.
[BEAT 2 - THE PEAK MOMENT]: The key revelation, stats, or turning point.
[CTA - 30-40s]: Provocative question to trigger comments + "Follow for more ${t.niche} breakdowns".

Return only the ready-to-film script formatted with beat tags.`;
        } else if (isTikTokScript) {
          userPrompt = `Write a fast-paced, high-velocity 25-35 second TikTok script for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.

Structure:
[0-2s HOOK]: Stop-the-scroll visual cue + shocking opening line.
[OVERLAY]: 3-6 word controversial screen text.
[SOUND CUE]: [SOUND: Suggested trending sound genre]
[BEAT 1]: The most shocking or dramatic detail first.
[BEAT 2]: The context and why everyone is talking about it.
[COMMENT BAIT & CTA]: Ask a debate-starter question that makes viewers fight in the comments.

Return only the ready-to-record spoken script.`;
        } else if (plat === "tiktok" && isCaption) {
          userPrompt = `Write a witty, viral TikTok caption and hashtags for a ${t.niche} creator about: "${t.headline}". Story: ${t.summary||""}.
Requirements:
- 2 punchy lines maximum with dry humor or curiosity gap.
- 5-6 viral and niche-specific TikTok hashtags (including #fyp and #foryou).

Return only the ready-to-copy TikTok caption.`;
        } else if (isCaption) {
          userPrompt = `Write an engaging social caption with hashtags for a ${t.niche} creator on ${P?.label||plat} about: "${t.headline}". Story: ${t.summary||""}.
Format:
- First line: Punchy hook that stops scrolling before "...more".
- Body: 3 bullet point takeaways using emojis.
- Call to Action: A question to drive comments.
- Hashtags: 12-15 targeted, active hashtags.

Return only the ready-to-post caption.`;
        } else if (isScript) {
          userPrompt = `Write a "${c}" for a ${t.niche} creator on ${P?.label||plat}, built around this story: "${t.headline}". ${t.summary||""}

Structure it as ONE continuous flow of speech — never label or separate sections, never write a heading like "Hook:" or "[CTA]", just write it exactly as it would be spoken start to finish:
1. Open with a strong hook in the very first line — the thing that stops someone from scrolling.
2. Immediately follow with 1-2 lines that create a reason to keep watching — a curiosity gap or a "here's what happened" tease.
3. Deliver the actual substance of the story in clear, engaging spoken language.
4. Close with a natural ending, then a real call to action: ask a genuine question that invites a comment, and end with a follow-prompt.

Return only the ready-to-post spoken text — no labels, no headers, no meta-commentary.`;
        } else {
          userPrompt = `Write a "${c}" for a ${t.niche} creator on ${P?.label||plat}. Story: "${t.headline}". ${t.summary||""}. Return only the ready-to-post text.`;
        }
        const s = await generateText(SYS, userPrompt, tone);
        out.push({type:"text", label:`${P?.label||plat} · ${c}`, content:s, imageUrl:articleImage||t.image||null});
      }
    }
    S.outs[tid] = out;
    if(out.length && S.token){
      const today = new Date();
      const sd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const first = out[0];
      const kind = first.type==="carousel"?"Carousel":first.type==="image"?"Image":"Script";
      try {
        await api("/api/save-post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,headline:t.headline,niche:t.niche,platform:plat,contentType:kind,content:sanitizeContentForSave(first),scheduledDate:sd})});
        loadSchedule(); loadSaved();
      } catch(saveErr){
        console.warn("Auto-save post to calendar failed:", saveErr);
      }
    }
  } catch(e){ S.outs[tid] = [{type:"text", label:"Error", content:"Generation failed. "+e.message}]; }
  S.loading[tid] = false; render();
};

function sanitizeContentForSave(content){
  if(!content || typeof content !== "object") return content;
  const clean = Array.isArray(content) ? [...content] : { ...content };
  if(clean.slides && Array.isArray(clean.slides)){
    clean.slides = clean.slides.map(s => {
      if(!s || typeof s !== "object") return s;
      const copy = { ...s };
      if(typeof copy.img === "string" && copy.img.startsWith("data:")) delete copy.img;
      if(typeof copy.localImg === "string" && copy.localImg.startsWith("data:")) delete copy.localImg;
      return copy;
    });
  }
  if(clean.images && Array.isArray(clean.images)){
    clean.images = clean.images.filter(img => typeof img === "string" && !img.startsWith("data:"));
    if(!clean.images.length) delete clean.images;
  }
  if(typeof clean.img === "string" && clean.img.startsWith("data:")) delete clean.img;
  if(typeof clean.fallbackImg === "string" && clean.fallbackImg.startsWith("data:")) delete clean.fallbackImg;
  return clean;
}
window.sanitizeContentForSave = sanitizeContentForSave;

window.saveOut = async (tid, idx) => {
  const t = S.trends.find(x=>x.id===tid); const o = S.outs[tid]?.[idx]; if(!t||!o) return;
  const flushed = await cpFlushExports(tid, idx);
  if (!flushed) { toast("Couldn't prepare the image to save. Try again."); return; }
  let savedCopy;
  try { savedCopy = await cpStoreCardImages(tid, idx, flushed); }
  catch (e) { toast("Couldn't save the image. Try again."); return; }
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
    const r = await api("/api/save-post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:S.token,headline:t.headline,niche:t.niche,platform:plat,contentType:kind,content:sanitizeContentForSave(savedCopy),scheduledDate:sd})});
    if(!r || !r.success) throw new Error(r?.error || "save failed");
    toast("Saved"); loadSchedule(); loadSaved();
  } catch(e){
    S.saved = prevSaved;              // revert
    S.errors.saveOut = "Couldn't save that draft. Try again.";
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

// ─── SCHEDULE ADD ───────────────────────────────────────────────────────────
// Schedule ONE post on ONE date.
//
// This used to be addRecurring(), which asked the server to materialise the
// next 52 weeks - so a post scheduled "on Friday" appeared on that Friday in
// every following week through the end of the year. It now sends a single
// calendar date and the server writes a single row, so the post shows on the
// exact day picked and nowhere else.
window.addScheduledPost = async () => {
  const p = S.addSched;
  if(!p.title){ toast("Add a title"); return; }
  if(!p.date){ toast("Pick a date"); return; }
  const scheduledDate = p.time ? `${p.date}T${p.time}:00` : p.date;
  const niche = "Personal Schedule";
  const platform = S.user?.primaryPlatform || (S.user?.platforms||[])[0] || "instagram";
  const payload = { token: S.token, title: p.title, date: p.date, time: p.time, notes: p.notes };

  // Show it and persist the pending copy FIRST, before even attempting the
  // network call - the same pattern the quick-add form already uses. The item
  // is on screen and survives an app close no matter what happens next.
  S.pendingSchedule = [...(S.pendingSchedule||[]), { id: `temp_${Date.now()}`, headline: p.title, niche, scheduled_date: scheduledDate, content_type: "Reminder" }];
  savePendingSchedule();
  S.addSched = { title:"", date:"", time:"20:00", notes:"" };
  S.scheduleSheetOpen = false;
  render(); // show the sheet closing and the item appearing immediately

  try {
    const r = await api("/api/user-schedule", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(r.success){
      toast("Scheduled for " + p.date);
      loadSchedule(); loadAgendaSchedule(); loadSaved();
    } else {
      // A real failure (not just slow) - queue it so it keeps retrying on its
      // own instead of being silently abandoned. The item already on screen
      // stays exactly where it is.
      S.outbox = [...(S.outbox||[]), { endpoint: "/api/user-schedule", payload, attempts: 1 }];
      saveOutboxState();
    }
  } catch(e){
    S.outbox = [...(S.outbox||[]), { endpoint: "/api/user-schedule", payload, attempts: 1 }];
    saveOutboxState();
  }
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
  if(S.mode === "boot"){ root.innerHTML = `<div class="auth-wrap"><div class="boot-brand"><img src="logo-64.png" class="brand-mark boot-pulse" alt="CreatorPulse"/><div class="brand-name" style="margin-top:14px">CreatorPulse</div></div><div class="boot-spinner-wrap"><span class="sp boot-sp"></span></div><div class="boot-status">Setting things up…</div></div>`; return; }
  if(typeof window.dismissCpSplash === "function") window.dismissCpSplash();
  if(S.mode === "auth") { renderAuth(); return csAfterRender(); }
  if(S.mode === "onboard") { renderOnboard(); return csAfterRender(); }
  renderApp();
  // Every render replaces the card markup, so any "suggested window" label is
  // back to its placeholder until something repaints it. Do it here, in the
  // same frame as the paint, so expanding a story never shows "calculating…".
  try { paintCountdowns(); } catch(_){}
  csAfterRender();
}

// Event photos: same stock-photo lookup as story cards, throttled to 3 at
// once so a niche with 100 events doesn't fire 100 requests the moment
// Calendar opens  only the events currently in the DOM get queued.
const EVENT_PHOTO_MAX = 3;
let eventPhotoInFlight = 0;
const eventPhotoQueue = [];
function applyEventPhoto(el, url){
  if(!el) return;
  el.style.backgroundImage = `url("${url}")`;
  el.style.backgroundSize = "cover";
  el.style.backgroundPosition = "center";
  el.classList.add("has-photo");
  el.textContent = "";
}
function pumpEventPhotoQueue(){
  if(eventPhotoInFlight >= EVENT_PHOTO_MAX) return;
  const job = eventPhotoQueue.shift();
  if(!job) return;
  eventPhotoInFlight++;
  api(`/api/stock-photo?query=${encodeURIComponent(job.query)}&count=1`)
    .then(sp => {
      const url = sp?.photos?.[0]?.url || null;
      S.eventPhoto = S.eventPhoto || {};
      S.eventPhoto[job.key] = url;
      if(url) applyEventPhoto(document.querySelector(`[data-ev-key="${CSS.escape(job.key)}"]`), url);
    })
    .catch(() => { S.eventPhoto = S.eventPhoto || {}; S.eventPhoto[job.key] = null; })
    .finally(() => { eventPhotoInFlight--; pumpEventPhotoQueue(); });
}
function calAfterRender(){
  if(S.tab !== "calendar") return;
  // ONE delegated listener for the whole app handles tap-to-expand. Delegation
  // rather than an inline handler per row is what lets a row safely carry an
  // arbitrary "niche|title" key: the key lives in a data attribute, so quotes
  // or slashes in a real event title never have to survive being interpolated
  // into JavaScript and then read back out of an HTML attribute.
  if(!window.__agendaTapBound){
    window.__agendaTapBound = true;
    document.addEventListener("click", (e) => {
      const row = e.target.closest && e.target.closest(".agenda-item[data-item-key]");
      if(!row) return;
      if(e.target.closest(".agenda-item-actions button")) return; // the row's own buttons keep their own job
      window.toggleAgendaItem(row.dataset.itemKey);
    });
    document.addEventListener("keydown", (e) => {
      if(e.key !== "Enter" && e.key !== " ") return;
      const row = e.target.closest && e.target.closest(".agenda-item[data-item-key]");
      if(!row) return;
      e.preventDefault();
      window.toggleAgendaItem(row.dataset.itemKey);
    });
  }
  S.eventPhoto = S.eventPhoto || {};
  document.querySelectorAll("[data-ev-key]").forEach(el => {
    const key = el.dataset.evKey;
    if(el.classList.contains("has-photo")) return;
    if(S.eventPhoto[key]) { applyEventPhoto(el, S.eventPhoto[key]); return; }
    if (S.eventPhoto[key] === null) return; // already tried, keep the icon fallback
    if (eventPhotoQueue.some(j => j.key === key)) return; // already queued
    eventPhotoQueue.push({ key, query: el.dataset.evQuery });
  });
  pumpEventPhotoQueue();
}
function csAfterRender(){
  calAfterRender();
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
    // The Studio (studio.js) owns its own post-render hook. renderApp() rebuilds
    // the whole page with innerHTML, which DESTROYS the camera <video> element
    // and drops its srcObject. Nothing re-attached the stream, so the preview
    // went black the instant recording started (the timer re-renders every
    // 200ms). This call is the black-screen fix.
    if (typeof window.svAfterRender === 'function') window.svAfterRender();
  } catch(err){ console.warn('csAfterRender', err); }
}

function renderAuth(){
  const tab = S.authTab;
  const isLogin = tab === "login";
  const head = `<div class="auth-brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div class="brand-name">CreatorPulse</div></div>`;
  const errMsg = `${S.authErr?`<div class="auth-err">${esc(S.authErr)}</div>`:""}${S.authMsg?`<div class="auth-msg">${esc(S.authMsg)}</div>`:""}`;

  let body;
  if(tab === "forgot"){
    body = `
    <div class="auth-title">Reset your password.</div>
    <div class="auth-sub">Enter your email and we'll send you a link to set a new one.</div>
    ${errMsg}
    <div class="field"><label>Email</label><input class="input" type="email" value="${esc(S.authForm.email)}" oninput="S.authForm.email=this.value" placeholder="you@domain.com"/></div>
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="doForgotPassword()">${S.authLoading?'<span class="sp"></span>':"Send reset link"}</button>
    <div class="auth-switch">Remember it after all? <a onclick="S.authTab='login'; S.authErr=''; S.authMsg=''; render()">Sign in</a></div>`;
  } else if(tab === "reset"){
    body = `
    <div class="auth-title">Set a new password.</div>
    <div class="auth-sub">Choose a new password for your account.</div>
    ${errMsg}
    <div class="field"><label>New password</label><input class="input" type="password" value="${esc(S.authForm.password)}" oninput="S.authForm.password=this.value" placeholder="••••••••"/></div>
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="doResetPassword()">${S.authLoading?'<span class="sp"></span>':"Update password"}</button>`;
  } else {
    body = `
    <div class="auth-title">${isLogin?"Welcome back.":"Start creating."}</div>
    <div class="auth-sub">${isLogin?"Sign in to pick up where you left off.":"Trending stories, scripts, and a calendar that thinks with you."}</div>
    ${errMsg}
    ${!isLogin?`<div class="field"><label>Name</label><input class="input" value="${esc(S.authForm.name)}" oninput="S.authForm.name=this.value" placeholder="How should we call you?"/></div>`:""}
    <div class="field"><label>Email</label><input class="input" type="email" value="${esc(S.authForm.email)}" oninput="S.authForm.email=this.value" placeholder="you@domain.com"/></div>
    <div class="field"><label>Password</label><input class="input" type="password" value="${esc(S.authForm.password)}" oninput="S.authForm.password=this.value" placeholder="••••••••"/></div>
    ${isLogin?`<div style="text-align:right;margin:-4px 0 4px"><a style="font-size:12px;color:var(--mu);cursor:pointer;text-decoration:underline;text-decoration-color:var(--mu2)" onclick="S.authTab='forgot'; S.authErr=''; S.authMsg=''; render()">Forgot password?</a></div>`:""}
    <button class="btn bp auth-cta" style="width:100%;padding:13px;margin-top:6px;justify-content:center" ${S.authLoading?"disabled":""} onclick="${isLogin?'doLogin()':'doSignup()'}">${S.authLoading?'<span class="sp"></span>':(isLogin?"Sign in":"Create account")}</button>
    <div class="auth-switch">${isLogin?"New here?":"Already have an account?"} <a onclick="S.authTab='${isLogin?'signup':'login'}'; S.authErr=''; S.authMsg=''; render()">${isLogin?"Create one":"Sign in"}</a></div>`;
  }

  document.getElementById("root").innerHTML = `<div class="auth-wrap"><div class="auth-inner">${head}${body}</div></div>`;
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
  const TEX = { home:"dots", hooks:"grid", calendar:"cross", create:"diag", profile:"dots", library:"grid", discover:"cross" };
  document.getElementById("root").innerHTML = `<div class="app" data-tex="${TEX[S.tab]||'dots'}">${pageHtml}
    <nav class="tabbar">
      <button class="tab ${S.tab==='home'?'active':''}" aria-current="${S.tab==='home'?'page':'false'}" onclick="setTab('home')">${I.home}Home</button>
      <button class="tab ${S.tab==='hooks'?'active':''}" aria-current="${S.tab==='hooks'?'page':'false'}" onclick="setTab('hooks')">${I.hook}Hooks</button>
      <button class="tab tab-create ${S.tab==='create'?'active':''}" aria-current="${S.tab==='create'?'page':'false'}" onclick="setTab('create')"><span class="tab-fab">${I.create}</span>Create</button>
      <button class="tab ${S.tab==='calendar'?'active':''}" aria-current="${S.tab==='calendar'?'page':'false'}" onclick="setTab('calendar')">${I.cal}Calendar</button>
      <button class="tab ${S.tab==='profile'?'active':''}" aria-current="${S.tab==='profile'?'page':'false'}" onclick="setTab('profile')">${I.user}Profile</button>
    </nav>
    ${renderSheet()}
    ${typeof renderFloatingCoach === "function" ? renderFloatingCoach() : ""}
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

function topBar(kicker, backTo, showRefresh){
  // Dropped the subtitle line under the wordmark  it only ever repeated
  // either the page's own H1 below it or (on Home) the count the hero
  // card already shows. Also: refresh used to appear on every page and
  // always reloaded trends specifically, which made no sense on Profile
  // or Discover. Now it only shows where the caller asks for it.
  return `<div class="topbar">${backTo ? `<button class="iconbtn tipbtn" data-tip="Back" title="Back" aria-label="Back" onclick="setTab('${backTo}')" style="margin-right:8px">${I.back}</button>` : ""}<div class="brand"><img src="/logo-64.png" class="brand-mark" alt="CreatorPulse"/><div class="brand-name">CreatorPulse</div></div>
    <div class="topbar-right">
      <button class="iconbtn tipbtn pulse-ai-topbar-btn" data-tip="Pulse AI" title="Pulse AI" aria-label="Pulse AI" onclick="openPulseAi()" style="color:var(--tint-tx);font-weight:700">${I.sparkle}</button>
      ${showRefresh ? `<button class="iconbtn tipbtn" data-tip="Refresh trends" title="Refresh trends" aria-label="Refresh trends" onclick="loadTrends();loadNotifs();toast('Refreshing')">${I.refresh}</button>` : ""}
      <div class="bell-wrap">
        <button class="iconbtn tipbtn" data-tip="Notifications" title="Notifications" aria-label="Notifications" onclick="toggleBell(event)">${I.bell}</button>
        <span class="bell-dot ${S.notifs.length?'show':''}"></span>
        <div class="notif-dd" id="notif-dd">${S.notifs.length?S.notifs.map(n=>`<div class="notif-item"><div class="notif-niche">${esc(n.niche)}</div><div class="notif-hl">${esc(n.headline)}</div><div class="notif-time">${esc(n.time)}</div></div>`).join(""):'<div class="notif-empty">Nothing new right now.</div>'}</div>
      </div>
    </div></div>`;
}
window.setTierFilter = (tier) => { S.tierFilter = tier; render(); };
window.toggleBell = (e) => { e.stopPropagation(); const dd = document.getElementById("notif-dd"); if(dd) dd.classList.toggle("open"); };
document.addEventListener("click", (e) => { if(!e.target.closest(".bell-wrap")){ const dd = document.getElementById("notif-dd"); if(dd) dd.classList.remove("open"); } });

function pageHome(){
  const first = ((S.user?.name||"").trim().split(/\s+/)[0]) || "there";
  const peaking = S.trends.filter(t=>trendVelocity(t).state==='peaking').length;
  const trendingCount = S.trends.filter(t=>t.viralTier==='trending').length;
  const midCount = S.trends.filter(t=>t.viralTier==='mid').length;
  const lowCount = S.trends.filter(t=>t.viralTier==='low').length;
  const chipTxt = S.trends.length ? (peaking ? `${peaking} ${peaking===1?'story':'stories'} peaking right now` : `${S.trends.length} live stories`) : "Loading your stories…";
  const top = S.trends[0];
  const peek = top ? `<div class="peek"><div class="k">Top story right now</div><div class="t">${esc(top.headline||top.title||"")}</div><div class="row"><span class="m">${esc(top.niche||"")} · ${trendVelocity(top).label}</span><button class="btn bp" onclick="toggle('${top.id}');setTimeout(()=>document.getElementById('tc-${top.id}')?.scrollIntoView({behavior:'smooth',block:'start'}),50)">Create</button></div></div>` : "";

  let displayTrends = S.trends;
  if(S.tierFilter && S.tierFilter !== "all"){
    displayTrends = S.trends.filter(t => t.viralTier === S.tierFilter);
  }

  const list = displayTrends.length
    ? `<div class="tlist">${displayTrends.map(renderTrend).join("")}</div>`
    : (S.trends.length ? `<div class="notif-empty" style="padding:24px 14px;text-align:center;color:var(--mu)">No stories currently in this tier. Check another tier above.</div>` : skTrendList(5));

  const filterStrip = S.trends.length ? `
    <div class="tier-filter-strip">
      <button class="tier-chip ${S.tierFilter==='all'?'active':''}" onclick="setTierFilter('all')">All (${S.trends.length})</button>
      <button class="tier-chip tier-chip-trending ${S.tierFilter==='trending'?'active':''}" onclick="setTierFilter('trending')"><span class="stat-dot dot-trending"></span>Trending (${trendingCount})</button>
      <button class="tier-chip tier-chip-mid ${S.tierFilter==='mid'?'active':''}" onclick="setTierFilter('mid')"><span class="stat-dot dot-mid"></span>Mid-Tier (${midCount})</button>
      <button class="tier-chip tier-chip-low ${S.tierFilter==='low'?'active':''}" onclick="setTierFilter('low')"><span class="stat-dot dot-low"></span>Curated (${lowCount})</button>
    </div>` : "";

  return `<main class="page active">${topBar(`${S.trends.length||0} live stories`, null, true)}
    <div class="hero">
      <div class="hi">Welcome back</div>
      <div class="nm">${esc(first)}</div>
      <div class="hero-stats-row">
        <span class="hero-stat-pill stat-trending"><span class="stat-dot dot-trending"></span>${trendingCount} Trending</span>
        <span class="hero-stat-pill stat-mid"><span class="stat-dot dot-mid"></span>${midCount} Mid-Tier</span>
        <span class="hero-stat-pill stat-low"><span class="stat-dot dot-low"></span>${lowCount} Curated</span>
      </div>
      <div class="hero-refresh-meta">Refreshes hourly · ${S.trends.length} fresh stories ready</div>
      <button class="hero-chip" onclick="document.getElementById('feed').scrollIntoView({behavior:'smooth'})"><span class="n">${peaking||S.trends.length||0}</span><span>${chipTxt}</span><span class="go">›</span></button>
    </div>
    ${peek}
    ${renderDigest()}
    <div class="sec-h" id="feed"><h2>Today's edit</h2><span class="sec-meta">Ranked by viral tier</span></div>
    ${filterStrip}
    ${list}
  </main>`;
}
function renderDigest(){
  if(S.errors.digest && !S.digestDismissed && S.digest) { /* fall through, card rendered below */ }
  if(!S.digest || S.digestDismissed || !(S.digest.stories||[]).length) return "";
  // Was a single stacked list of every story  category label, full
  // headline, thin divider, repeat  which read as one long wall of text.
  // Now a horizontal scrollable strip of compact cards, capped at 8, so
  // it's a quick scan instead of a vertical slog.
  const cards = S.digest.stories.slice(0,8).map(s=>`<div class="digest-card" onclick="setTab('home')"><div class="digest-niche">${esc(s.niche)}</div><div class="hl">${esc(s.headline)}</div></div>`).join("");
  return `<div class="digest"><div class="digest-h"><div class="digest-title">Daily Digest</div><button class="tiny-copy tipbtn" data-tip="Dismiss today's digest" title="Dismiss today's digest" aria-label="Dismiss digest" onclick="dismissDigest()">Got it</button></div>${sectionErr("digest")}<div class="digest-strip">${cards}</div></div>`;
}

// ─── HOOKS PAGE ─────────────────────────────────────────────────────────────
function pageHooks(){
  const userNiches = S.user?.niches || [];
  if(!S.hooksNiche && userNiches.length) S.hooksNiche = userNiches[0];
  const active = S.hooksNiche;
  const nicheChips = userNiches.map(n=>`<button class="chip ${active===n?'active':''}" aria-pressed="${active===n?'true':'false'}" onclick="setHooksNiche('${esc(n)}')">${esc(n)}</button>`).join("");
  const hooks = S.hooksCache[active] || [];
  const q = (S.hooksSearch||"").toLowerCase();
  const filtered = q ? hooks.filter(h=>h.text.toLowerCase().includes(q)) : hooks;
  const list = filtered.length
    ? filtered.map((h,i)=>`<article class="hook-card"><div class="hook-card-kicker">${esc(active||"Niche")} · Hook ${String(i+1).padStart(2,"0")}</div><div class="txt">${esc(h.text)}</div><div class="hook-actions"><button class="tiny-copy" onclick="copyTxt(\`${h.text.replace(/`/g,'\\`')}\`)">Copy</button><button class="tiny-copy hook-use" onclick="prefillHook(\`${h.text.replace(/`/g,'\\`')}\`)">Use hook</button><button class="tiny-copy" onclick="openBlueprint(\`${h.text.replace(/`/g,'\\`')}\`,'${esc(active)}')">Blueprint</button></div></article>`).join("")
    : hooks.length ? `<div style="color:var(--mu);font-size:12px;padding:20px 0;text-align:center">No hooks match "${esc(S.hooksSearch)}".</div>`
    : skHookList(6);
  return `<main class="page active">${topBar("Reusable hooks")}
    <div class="sec-h"><h2>Hooks</h2><span class="sec-meta">50 per niche</span></div>
    <input class="hook-search" type="search" aria-label="Search hooks" placeholder="Search hooks…" value="${esc(S.hooksSearch)}" oninput="S.hooksSearch=this.value;render()"/>
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
  const platLabel = plat === "twitter" ? "X (Twitter)" : (PLATS.find(x=>x.id===plat)?.label || plat);
  S.sheet = { kind:"blueprint", loading:true, data:null, videoBP:true, tid, plat };
  render();
  try {
    const raw = await generateText(
      "You write VIDEO STRUCTURE, never finished sentences or example dialogue. Return ONLY valid JSON: {\"beats\":[{\"label\":\"Opening (0-3s)\",\"guidance\":\"...\"},{\"label\":\"Body\",\"guidance\":\"...\"},{\"label\":\"Purpose / close\",\"guidance\":\"...\"}]}. 'guidance' tells the creator WHAT to cover and in what order — never the literal words to say, never a quote they could copy-paste. This must work for thousands of different creators building their own video from the same story, so it has to force original wording every time.",
      `Platform: ${platLabel}. Format: ${ct}. Niche: ${t.niche}. Story: "${t.headline}". ${t.summary?('Context: '+t.summary):''}\n\nGive me a 3-part video blueprint specific to this story and this platform's format:\n1. Opening — what the first few seconds needs to establish to stop the scroll for THIS story\n2. Body — what needs to be explained, in what order, to actually deliver on the opening\n3. Purpose/close — what the video should leave the viewer with and how it should wrap up\nMake the guidance specific to this exact story, not generic advice that could apply to anything.`
    );
    const parsed = extractJSON(raw) || { beats: [] };
    S.sheet.data = parsed;
  } catch(e){ S.sheet.data = { beats: [] }; S.sheet.error = "Something went wrong. Please try again."; }
  S.sheet.loading = false; render();
};
window.getChatGPTPrompt = async (tid) => {
  const t = S.trends.find(x=>x.id===tid); if(!t) return;
  const plat = S.plat[tid] || S.user?.primaryPlatform || "instagram";
  const platLabel = plat === "twitter" ? "X (Twitter)" : (PLATS.find(x=>x.id===plat)?.label || plat);
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
  } catch(e){ S.sheet.error = "Something went wrong. Please try again."; }
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
  } catch(e){ S.sheet.data = { beats: [] }; S.sheet.error = "Something went wrong. Please try again."; }
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
  } catch(e){ S.uqCheck.error = "Couldn't check right now. Try again."; }
  S.uqCheck.loading = false; render();
};
window.setHooksNiche = async (n) => {
  S.hooksNiche = n; render();
  if(!S.hooksCache[n]){
    try { const d = await api(`/api/hooks?niche=${encodeURIComponent(n)}`); cacheSet("hooksCache", n, d.hooks||[]); render(); } catch(e){ S.errors.hooks = "Couldn't load hooks."; render(); }
  }
};
window.prefillHook = (txt) => { S.tab='home'; toast("Hook copied: pick a story to remix"); navigator.clipboard.writeText(txt); render(); };

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
  } catch(e){ S.sheet.data = []; S.sheet.error = "Something went wrong. Please try again."; }
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
  } catch(e){ S.sheet.data = {titles:[], hashtags:[]}; S.sheet.error = "Something went wrong. Please try again."; }
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
// The identity of one calendar row. Deliberately the item's own identity and
// not its position in the list, so an opened row survives a re-render or a
// background refresh that reorders things underneath it.
function agendaItemKey(it){
  return it.type === "post" ? `post:${it.id}` : `event:${it.niche||""}|${it.title}`;
}
window.toggleAgendaItem = (key) => {
  if(!key) return;
  S.agendaExpanded = S.agendaExpanded || {};
  S.agendaExpanded[key] = !S.agendaExpanded[key];
  render();
};
// One calendar row.
//
// COLLAPSED BY DEFAULT. A row shows only what's needed to scan it - date,
// title, and one quiet meta line. The category, the full description and the
// row's own action all stay hidden until the row is tapped, which is what was
// asked for: a clean summary first, the details on demand, instead of every
// row dumping its whole description the moment the calendar opens.
function renderAgendaItem(it){
  const isPost = it.type === "post";
  const isMajor = it.importance === "major";
  const cls = isPost ? "agenda-item-post" : isMajor ? "agenda-item-major" : "agenda-item-event";
  const dt = new Date(it.date);
  const timeStr = isPost && it.date.includes("T") ? dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : null;
  const payload = JSON.stringify({title:it.title, desc:it.desc, niche:it.niche, date:it.date}).replace(/'/g,"&#39;");
  const itemKey = agendaItemKey(it);
  const expanded = !!S.agendaExpanded[itemKey];
  // The single line of context that stays visible while collapsed.
  const meta = isPost ? `Scheduled${timeStr ? ' \u00b7 '+timeStr : ''}` : esc(it.niche||"");
  const thumbIcon = isPost ? "\u270d\ufe0f" : isMajor ? "\ud83d\udd25" : it.importance === "relevant" ? "\ud83d\udccc" : "\ud83d\uddd3";
  // Real photo per event via the same stock-photo lookup story cards already
  // use. Every niche event is eligible, not only the "major"/"relevant" ones:
  // in several niches ALL events are "seasonal", so the narrower filter left
  // whole sections as plain icon tiles, which read as "the photos are broken".
  const wantsPhoto = !isPost;
  const evKey = wantsPhoto ? `${it.niche||""}|${it.title}` : null;
  const evQuery = wantsPhoto ? `${it.niche||""} ${it.title}`.trim() : null;
  const cachedUrl = evKey ? (S.eventPhoto||{})[evKey] : null;
  const thumbStyle = cachedUrl ? ` style="background-image:url('${esc(cachedUrl)}');background-size:cover;background-position:center"` : "";
  const thumb = `<div class="agenda-item-thumb ${cls}${cachedUrl?' has-photo':''}"${wantsPhoto?` data-ev-key="${esc(evKey)}" data-ev-query="${esc(evQuery)}"`:""}${thumbStyle}>${cachedUrl?"":thumbIcon}</div>`;
  return `<div class="agenda-item ${cls}${expanded?' expanded':''}" data-item-key="${esc(itemKey)}" role="button" tabindex="0" aria-expanded="${expanded?'true':'false'}">
    ${thumb}
    <div class="agenda-item-date"><div class="m">${M_SHORT[dt.getMonth()]}</div><div class="d">${dt.getDate()}</div></div>
    <div class="agenda-item-body">
      <div class="agenda-item-head">
        <span class="agenda-item-title">${esc(it.title)}</span>
        ${meta?`<span class="agenda-item-meta">${meta}</span>`:""}
        <span class="agenda-item-chevron" aria-hidden="true">\u203a</span>
      </div>
      <div class="agenda-item-detail">
        ${it.niche?`<div class="agenda-item-niche">${esc(it.niche)}${isPost?' \u00b7 Scheduled'+(timeStr?' \u00b7 '+timeStr:''):''}</div>`:''}
        ${it.desc && !isPost ?`<div class="agenda-item-desc">${esc(it.desc)}</div>`:''}
        <div class="agenda-item-actions">
          ${isPost
            ? `<button class="iconbtn tipbtn" data-tip="Remove" title="Remove" aria-label="Remove ${esc(it.title)}" onclick="event.stopPropagation();deleteScheduleItem('${it.id}')">${I.trash}</button>`
            : `<button class="tiny-copy" onclick='event.stopPropagation();createFromEvent(${payload})'>Create</button>`
          }
        </div>
      </div>
    </div>
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
        <div class="field" style="flex:1"><label>Date</label><input class="input" type="date" value="${esc(asch.date)}" oninput="S.addSched.date=this.value"/></div>
        <div class="field" style="flex:1"><label>Time</label><input class="input" type="time" value="${esc(asch.time)}" oninput="S.addSched.time=this.value"/></div>
      </div>
      <button class="btn bp" style="width:100%;padding:12px;justify-content:center" onclick="addScheduledPost()">${I.plus} Schedule for this date</button>
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
      <button class="cal-view-btn ${view==='agenda'?'active':''}" aria-pressed="${view==='agenda'?'true':'false'}" onclick="setCalView('agenda')">Agenda</button>
      <button class="cal-view-btn ${view==='week'?'active':''}" aria-pressed="${view==='week'?'true':'false'}" onclick="setCalView('week')">Week</button>
      <button class="cal-view-btn ${view==='month'?'active':''}" aria-pressed="${view==='month'?'true':'false'}" onclick="setCalView('month')">Month</button>
    </div>
    ${view==='agenda' ? renderAgendaView() : view==='week' ? renderWeekView() : renderMonthView()}
    <button class="btn bo cal-schedule-btn" onclick="openScheduleSheet()">${I.plus} Schedule Post</button>
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
  const at = eventsAt();
  await Promise.all(niches.map(async n => {
    const cached = S.eventsCache[n];
    const fresh = cached && (Date.now() - (at[n] || 0) < EVENTS_TTL_MS);
    if(fresh) return;
    try {
      const evs = await fetchEvents(n);
      // Never let a transient empty/error response wipe a good cache.
      if(Array.isArray(evs) && (evs.length || !cached)){ cacheSet("eventsCache", n, evs); markEventsAt(n); }
    } catch(e){ /* keep whatever we already had */ }
  }));
  render();
}


window.cpGenerateCaptionForOutput = async (tid, idx) => {
  const o = S.outs[tid]?.[idx];
  const t = S.trends.find(x => x.id === tid);
  if (!o || !t) return;
  const plat = S.plat[tid] || 'tiktok';
  const P = PLATS.find(x => x.id === plat);
  const platLabel = P?.label || plat;
  toast('Generating caption + hashtags for ' + platLabel + '…');
  try {
    const userPrompt = plat === 'tiktok'
      ? 'Write a witty, viral TikTok caption and 5-6 niche-specific hashtags (including #fyp and #foryou) based on this story: "' + t.headline + '". Return only the ready-to-copy caption.'
      : 'Write an engaging social caption with a strong hook, 3 short emoji takeaways, and 10 targeted hashtags for ' + platLabel + ' based on: "' + t.headline + '". Return only the caption.';
    const captionText = await generateText(SYS, userPrompt, S.tone[tid] || 'normal');
    if (!o.attachedCaption) o.attachedCaption = captionText;
    else o.attachedCaption += '\n\n' + captionText;
    render();
    toast('Caption + hashtags ready below script!');
  } catch (err) {
    console.error('Caption generation failed', err);
    toast('Could not generate caption right now.');
  }
};
