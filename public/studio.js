// ─── CREATE STUDIO v3 ───────────────────────────────────────────────────────
// Camera · timeline · text + image overlays · word-by-word captions · music ·
// ffmpeg.wasm export.
//
// v3 rewrite (see CHANGELOG at the bottom):
//  • Export no longer uses canvas capture + MediaRecorder. It builds one
//    ffmpeg.wasm filter graph (trim → concat → colour → overlay PNGs → ASS
//    captions → amix) and encodes offline. No realtime decode+encode race.
//  • Two persistent <video> elements live OUTSIDE the render() innerHTML
//    churn, so re-rendering the editor no longer orphans media decoders.
//    That was the "dead after 5–6 edits" bug.
//  • Split lands on the exact playhead sample, always.
//  • Text AND image overlays: drag + corner resize + pinch.
//  • Captions are word-timed (1–2 words per chunk), not sentence blocks.
// ---------------------------------------------------------------------------

const CS_FONTS = [
  {id:"classic",  name:"Classic",        css:'"Inter", sans-serif',         weight:800, ass:"Inter"},
  {id:"classic-m",name:"Classic Medium", css:'"Inter", sans-serif',         weight:600, ass:"Inter"},
  {id:"classic-l",name:"Classic Light",  css:'"Inter", sans-serif',         weight:400, ass:"Inter"},
  {id:"modern",   name:"Modern",         css:'"Archivo Black", sans-serif', weight:900, ass:"Archivo Black"},
  {id:"modern-b", name:"Modern Bold",    css:'"Bebas Neue", sans-serif',    weight:400, ass:"Bebas Neue"},
  {id:"anton",    name:"Anton",          css:'"Anton", sans-serif',         weight:400, ass:"Anton"},
  {id:"oswald",   name:"Oswald",         css:'"Oswald", sans-serif',        weight:700, ass:"Oswald"},
  {id:"signature",name:"Signature",      css:'"Dancing Script", cursive',   weight:700, ass:"Dancing Script"},
  {id:"caveat",   name:"Handwritten",    css:'"Caveat", cursive',           weight:700, ass:"Caveat"},
  {id:"marker",   name:"Marker",         css:'"Permanent Marker", cursive', weight:400, ass:"Permanent Marker"},
  {id:"pacifico", name:"Script",         css:'"Pacifico", cursive',         weight:400, ass:"Pacifico"},
  {id:"lobster",  name:"Lobster",        css:'"Lobster", cursive',          weight:400, ass:"Lobster"},
  {id:"editor",   name:"Editor",         css:'"Special Elite", monospace',  weight:400, ass:"Special Elite"},
  {id:"poster",   name:"Poster",         css:'"Abril Fatface", serif',      weight:400, ass:"Abril Fatface"},
  {id:"playfair", name:"Elegant",        css:'"Playfair Display", serif',   weight:900, ass:"Playfair Display"},
  {id:"zilla",    name:"Zilla",          css:'"Zilla Slab", serif',         weight:700, ass:"Zilla Slab"},
  {id:"bungee",   name:"Bungee",         css:'"Bungee", sans-serif',        weight:400, ass:"Bungee"},
  {id:"righteous",name:"Righteous",      css:'"Righteous", sans-serif',     weight:400, ass:"Righteous"},
  {id:"pixel",    name:"Pixel",          css:'"Press Start 2P", monospace', weight:400, ass:"Press Start 2P"},
];
const CS_STYLES = [
  {id:"none", name:"None"}, {id:"outline", name:"Outline"}, {id:"rev-outline", name:"Rev Outline"},
  {id:"bg", name:"Background"}, {id:"rev-bg", name:"Rev Background"}, {id:"shadow", name:"Shadow"},
];
const CS_COLORS = ["#FFFFFF","#000000","#F5C518","#EF3355","#EC4899","#7C3AED","#3B82F6","#10B981","#F97316","#EAB308","#22D3EE","#F472B6"];

// Each filter carries BOTH the CSS string (live preview) and an ffmpeg filter
// chain (export). One preset, two renderers, identical intent.
const CS_FILTERS = [
  {id:"none", name:"None",  filter:"none",                                              ff:""},
  {id:"vivid",name:"Vivid", filter:"saturate(1.4) contrast(1.15)",                       ff:"eq=saturation=1.4:contrast=1.15"},
  {id:"warm", name:"Warm",  filter:"sepia(.2) saturate(1.2) hue-rotate(-8deg)",          ff:"eq=saturation=1.2,colorbalance=rs=.10:gs=.02:bs=-.08"},
  {id:"cool", name:"Cool",  filter:"saturate(1.1) hue-rotate(12deg) brightness(1.05)",   ff:"eq=saturation=1.1:brightness=0.05,colorbalance=rs=-.06:bs=.10"},
  {id:"mono", name:"Mono",  filter:"grayscale(1) contrast(1.1)",                         ff:"hue=s=0,eq=contrast=1.1"},
  {id:"noir", name:"Noir",  filter:"grayscale(1) contrast(1.5) brightness(.9)",          ff:"hue=s=0,eq=contrast=1.5:brightness=-0.06"},
  {id:"film", name:"Film",  filter:"sepia(.35) contrast(1.15) saturate(.9)",             ff:"eq=contrast=1.15:saturation=0.9,colorbalance=rs=.14:gs=.05:bs=-.10"},
  {id:"dream",name:"Dream", filter:"blur(.4px) saturate(1.3) brightness(1.08)",          ff:"gblur=sigma=0.6,eq=saturation=1.3:brightness=0.06"},
  {id:"punch",name:"Punch", filter:"saturate(1.6) contrast(1.25) brightness(1.02)",      ff:"eq=saturation=1.6:contrast=1.25:brightness=0.02"},
];

const CS_CAP_PRESETS = [
  {id:"classic",  name:"Classic",  font:"classic",   color:"#F5C518", bg:"rgba(0,0,0,.72)", box:"block",  stroke:null,      shadow:false, upper:false, radius:.18},
  {id:"clean",    name:"Clean",    font:"classic",   color:"#FFFFFF", bg:null,              box:"none",   stroke:null,      shadow:true,  upper:false, radius:0},
  {id:"pop",      name:"Pop",      font:"modern",    color:"#FFFFFF", bg:null,              box:"none",   stroke:"#000000", shadow:false, upper:true,  radius:0},
  {id:"karaoke",  name:"Karaoke",  font:"anton",     color:"#F5C518", bg:null,              box:"none",   stroke:"#111111", shadow:false, upper:true,  radius:0},
  {id:"boxed",    name:"Boxed",    font:"classic",   color:"#0A0A0F", bg:"#FFFFFF",         box:"tight",  stroke:null,      shadow:false, upper:false, radius:.14},
  {id:"neon",     name:"Neon",     font:"righteous", color:"#22D3EE", bg:"rgba(0,0,0,.55)", box:"block",  stroke:null,      shadow:true,  upper:false, radius:.5},
  {id:"news",     name:"News",     font:"oswald",    color:"#FFFFFF", bg:"#EF3355",         box:"tight",  stroke:null,      shadow:false, upper:true,  radius:.06},
  {id:"minimal",  name:"Minimal",  font:"classic-m", color:"#FFFFFF", bg:"rgba(0,0,0,.35)", box:"block",  stroke:null,      shadow:false, upper:false, radius:.3},
  {id:"handnote", name:"Note",     font:"caveat",    color:"#FFFFFF", bg:null,              box:"none",   stroke:"#000000", shadow:true,  upper:false, radius:0},
];
function csCapPreset(id){ return CS_CAP_PRESETS.find(p=>p.id===id) || CS_CAP_PRESETS[0]; }
function csFontById(id){ return CS_FONTS.find(f=>f.id===id) || CS_FONTS[0]; }
function csFilterDef(id){ return CS_FILTERS.find(f=>f.id===id) || CS_FILTERS[0]; }
function csFilterCss(id){ return csFilterDef(id).filter; }

function csCapStyle(){
  const st = S.studio;
  const cs = st.capStyle || (st.capStyle = { preset:"classic", x:50, y:82, size:34, color:null, words:2 });
  if(cs.preset == null) cs.preset = "classic";
  if(cs.words == null) cs.words = 2;
  const p = csCapPreset(cs.preset);
  const f = csFontById(p.font);
  return {
    x: cs.x==null?50:cs.x, y: cs.y==null?82:cs.y, size: cs.size||34,
    color: cs.color || p.color,
    bg:p.bg, box:p.box, stroke:p.stroke, shadow:p.shadow, upper:p.upper, radius:p.radius,
    fontCss:f.css, fontWeight:f.weight, fontAss:f.ass, preset:p.id, words:cs.words,
  };
}
function csCapCss(s){
  let out = `left:${s.x}%;top:${s.y}%;font-size:${s.size}px;color:${s.color};`
          + `font-family:${s.fontCss};font-weight:${s.fontWeight};`
          + `text-transform:${s.upper?'uppercase':'none'};border-radius:${s.radius}em;`;
  out += s.bg && s.box!=='none'
    ? `background:${s.bg};padding:${s.box==='tight'?'.16em .42em':'.28em .5em'};`
    : `background:transparent;padding:.1em .2em;`;
  if(s.stroke) out += `-webkit-text-stroke:${Math.max(1,Math.round(s.size*0.06))}px ${s.stroke};paint-order:stroke fill;`;
  if(s.shadow) out += `text-shadow:0 ${Math.round(s.size*0.06)}px ${Math.round(s.size*0.28)}px rgba(0,0,0,.75);`;
  return out;
}
function csStyleCss(style,color,bg){
  bg = bg || "#000";
  if(style==="outline")     return `-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:none;`;
  if(style==="rev-outline") return `color:#000 !important;-webkit-text-stroke:2px ${color};paint-order:stroke fill;`;
  if(style==="bg")          return `background:${bg};padding:6px 12px;border-radius:8px;`;
  if(style==="rev-bg")      return `background:${color};color:${bg} !important;padding:6px 12px;border-radius:8px;`;
  if(style==="shadow")      return `text-shadow:2px 4px 8px rgba(0,0,0,.7);`;
  return ``;
}

function CS_ICON(name){
  const p = {
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    voice:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 18v4"/>',
    cc:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M8 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2M16 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2"/>',
    adjust:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    split:'<path d="M12 3v6m0 6v6M8 12l-5 5M8 12l-5-5M16 12l5 5M16 12l5-5"/>',
    trim:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    effects:'<path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2"/>',
    trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    dup:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    opacity:'<path d="M12 3l7 12a7 7 0 1 1-14 0z"/>',
    replace:'<path d="M4 12a8 8 0 0 1 14-5m2 0v5h-5M20 12a8 8 0 0 1-14 5m-2 0v-5h5"/>',
    play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    pause:'<rect x="6.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none"/>',
    undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>',
    redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    flash:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    flip:'<path d="M4 8a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 16a8 8 0 0 1-14 3l-2-2M4 20v-4h4"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    layers:'<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    timer:'<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2M9 2h6"/>',
    sparkle:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    volume:'<path d="M11 5 6 9H2v6h4l5 4zM15 9a5 5 0 0 1 0 6M19 5a10 10 0 0 1 0 14"/>',
    resize:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p[name]||""}</svg>`;
}

// ─── DEVICE PROFILE ─────────────────────────────────────────────────────────
// Drives export resolution/fps. ffmpeg.wasm is single-threaded in the default
// build, so resolution matters more than it did with hardware MediaRecorder.
const CS_QUALITY_PRESETS = {
  "540p":  { width: 540,  height: 960,  fps: 24, crf: 27, preset: "ultrafast", label: "540p",  bitrate: 1_500_000 },
  "720p":  { width: 720,  height: 1280, fps: 30, crf: 25, preset: "ultrafast", label: "720p",  bitrate: 2_500_000 },
  "1080p": { width: 1080, height: 1920, fps: 30, crf: 23, preset: "veryfast",  label: "1080p", bitrate: 4_500_000 },
  "2160p": { width: 2160, height: 3840, fps: 30, crf: 21, preset: "veryfast",  label: "4K",    bitrate: 12_000_000 },
};
const CS_DEVICE = (() => {
  const cores = navigator.hardwareConcurrency || 4;
  const mem   = navigator.deviceMemory || 4;
  const tier  = (cores >= 8 && mem >= 6) ? "high" : (cores >= 4 && mem >= 3) ? "mid" : "low";
  const autoQuality = tier === "high" ? "1080p" : tier === "mid" ? "720p" : "540p";
  const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = mimeCandidates.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || 'video/webm';
  return {
    tier, cores, mem, mime,
    // st.quality (set by the resolution picker) overrides the auto-detected tier when present.
    get capture(){ return CS_QUALITY_PRESETS[S.studio?.quality || autoQuality]; },
    get encode(){ return CS_QUALITY_PRESETS[S.studio?.quality || autoQuality]; },
    get label(){ return CS_QUALITY_PRESETS[S.studio?.quality || autoQuality].label; },
  };
})();

const CS_PX = 0.06;                 // timeline px per ms
const CS_LBL = 84;                  // timeline label gutter width (px)

// ═══════════════════════════════════════════════════════════════════════════
//  VIEWS
// ═══════════════════════════════════════════════════════════════════════════
function csDefaultState(){
  return {
    mode:"camera",
    projectName:"New project",
    script:"", promptSpeed:60, mirror:true, running:false, showPrompter:false, showScriptEditor:false,
    camReady:false, facing:"user", micOn:true, flash:false, zoom:1, speed:1, countdown:0,
    clips:[], selectedId:null, selectedType:null,
    overlays:[], captions:[], capWords:[], audioTracks:[],
    filter:"none", adjust:{brightness:100,contrast:100,saturation:100,warmth:0},
    capStyle:{ preset:"classic", x:50, y:82, size:34, color:null, words:2 },
    playhead:0, playing:false, exporting:false, exportPct:0, exportNote:"",
    sheet:null, editText:null, editTextTab:"font", capTab:"style",
    history:[], future:[],
  };
}

function pageCreate(){
  const st = S.studio || (S.studio = csDefaultState());
  if(st.mode === "editor") return edView(st);
  if(st.mode !== "camera"){
    st.mode = "camera";
    setTimeout(() => { window.studioInitStage && window.studioInitStage(); }, 60);
  }
  return camView(st);
}

// ── Camera ──────────────────────────────────────────────────────────────────
function camView(st){
  const rec = !!st.running;
  const clips = st.clips.length;
  return `<div class="cs-fs cs-cam">
    <div class="cs-topbar">
      <button class="cs-icon-btn" onclick="csExitCamera()" aria-label="Close">${CS_ICON('close')}</button>
      <div class="cs-title">${esc(st.projectName)}</div>
      <div class="cs-topbar-r">
        <button class="cs-chip" onclick="csOpenSheet('quality')">${CS_DEVICE.label}</button>
        <button class="cs-cta" ${clips?'':'disabled'} onclick="csGoToEditor()">Next</button>
      </div>
    </div>
    ${st.sheet==='quality' ? `<div class="cs-sheet-inline">
      <div class="cs-sheet-h"><h4>Recording quality</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
      <div class="cs-sheet-body">
        ${Object.entries(CS_QUALITY_PRESETS).map(([key,p])=>`
          <button class="cs-text-btn ${(st.quality||CS_DEVICE.tier==='high'&&'1080p'||CS_DEVICE.tier==='mid'&&'720p'||'540p')===key?'on':''}"
            style="width:100%;justify-content:space-between;padding:14px 4px" onclick="csSetQuality('${key}')">
            <span>${p.label}${key==='2160p'?' (4K)':''}</span>
            <span class="cs-foot-meta">${p.width}×${p.height}</span>
          </button>`).join('')}
        <div class="cs-foot-meta" style="padding:8px 4px 0">Higher quality uses more storage and may be slower to export on older phones.</div>
      </div>
    </div>` : ''}

    <div class="cs-cam-stage ${rec?'is-rec':''}" id="cs-cam-stage">
      <video id="cs-cam-live" playsinline muted autoplay
        style="transform:${st.mirror&&st.facing==='user'?'scaleX(-1) ':''}scale(${st.zoom})"></video>

      ${st.showPrompter && st.script ? `<div class="cs-prompter">
        <div class="cs-prompter-inner" id="cs-cam-prompter-inner">${esc(st.script)}</div>
      </div>` : ''}

      ${rec ? `<div class="cs-rec-pill"><span class="dot"></span><span id="cs-cam-time">0:00</span></div>` : ''}

      <div class="cs-cam-rail">
        <button class="cs-rail-btn ${st.showPrompter?'on':''}" onclick="csPrompterTap()">${CS_ICON('text')}<span>Script</span></button>
        <button class="cs-rail-btn ${st.countdown?'on':''}" onclick="csCycleCountdown()">${CS_ICON('timer')}<span>${st.countdown?st.countdown+'s':'Timer'}</span></button>
        <button class="cs-rail-btn ${st.speed!==1?'on':''}" onclick="csCycleSpeed()">${CS_ICON('sparkle')}<span>${st.speed}×</span></button>
        <button class="cs-rail-btn ${st.micOn?'':'warn'}" onclick="studioMic()">${CS_ICON('voice')}<span>${st.micOn?'Mic':'Muted'}</span></button>
      </div>

      <div class="cs-zoom-pill">
        ${[1,1.5,2,3].map(z=>`<button class="${st.zoom===z?'on':''}" data-z="${z}" onclick="csSetZoom(${z})">${z}×</button>`).join('')}
      </div>

      ${st.showScriptEditor ? `<div class="cs-sheet cs-sheet-inline" onclick="event.stopPropagation()">
        <div class="cs-sheet-grip"></div>
        <div class="cs-sheet-h"><h4>Teleprompter</h4><button class="done" onclick="csSaveScript()">Use script</button></div>
        <div class="cs-sheet-body"><textarea class="cs-text-input" style="height:150px" autofocus
          placeholder="Type or paste your script — it scrolls over the camera while you record."
          oninput="S.studio.script=this.value">${esc(st.script)}</textarea></div>
      </div>` : ''}
    </div>

    <div class="cs-cam-bot">
      <button class="cs-round ${st.flash?'on':''}" onclick="csToggleFlash()">${CS_ICON('flash')}</button>
      <button class="cs-shutter ${rec?'rec':''}" onclick="csRecord()" aria-label="Record"><span></span></button>
      <button class="cs-round" onclick="csFlip()">${CS_ICON('flip')}</button>
    </div>
    <div class="cs-cam-foot">
      <button class="cs-text-btn" onclick="csOpenUpload()">${CS_ICON('upload')} Upload</button>
      <span class="cs-foot-meta">${clips ? clips+' clip'+(clips===1?'':'s')+' ready' : 'Tap to record'}</span>
      <button class="cs-text-btn" ${clips?'':'disabled'} onclick="csGoToEditor()">${CS_ICON('layers')} Editor</button>
      <input type="file" id="cs-upload" accept="video/*,image/*" multiple style="display:none" onchange="csHandleUpload(event, true)"/>
    </div>
  </div>`;
}

// ── Editor ──────────────────────────────────────────────────────────────────
// The two <video> buffers are NOT in this markup. They are persistent elements
// owned by CSM (media pool) and re-parented into #cs-ed-media after render.
function edView(st){
  const total = csTotalMs();
  const cap = csCapStyle();
  const tool = st.sheet || null;
  const hasSel = !!st.selectedId;
  return `<div class="cs-fs cs-ed">
    <div class="cs-topbar">
      <button class="cs-icon-btn" onclick="csConfirmExitEditor()" aria-label="Back">${CS_ICON('close')}</button>
      <div class="cs-title">${esc(st.projectName)}</div>
      <div class="cs-topbar-r">
        <span class="cs-chip">${CS_DEVICE.label}</span>
        <button class="cs-cta" ${st.clips.length&&!st.exporting?'':'disabled'} onclick="csExport()">
          ${st.exporting?'Exporting…':'Export'}</button>
      </div>
    </div>

    <div class="cs-ed-stage" id="cs-ed-stage">
      <div class="cs-ed-media" id="cs-ed-media"></div>
      <div class="cs-ed-layer" id="cs-ed-layer">
        ${st.overlays.map(o=>csOverlayHtml(o, st)).join('')}
        <div class="cs-ed-cap ${st.selectedType==='caption'?'sel':''} ${csCapAt(st.playhead)?'':'off'}"
          id="cs-ed-cap" style="${csCapCss(cap)}"
          onpointerdown="csCaptionPointerDown(event)">${esc(csCapAt(st.playhead)?.text||'')}</div>
      </div>

      <div class="cs-ed-hud">
        <button class="cs-hud-btn cs-ed-play" onclick="csTogglePlay()">${CS_ICON(st.playing?'pause':'play')}</button>
        <div class="cs-ed-time"><span class="cur">${_fmtTs(st.playhead/1000)}</span><span class="tot">/ ${_fmtTs(total/1000)}</span></div>
        <div class="cs-hud-right">
          <button class="cs-hud-btn" onclick="csUndo()" ${st.history&&st.history.length?'':'disabled'}>${CS_ICON('undo')}</button>
          <button class="cs-hud-btn" onclick="csRedo()" ${st.future&&st.future.length?'':'disabled'}>${CS_ICON('redo')}</button>
        </div>
      </div>

      ${st.exporting ? `<div class="cs-export-veil">
        <div class="cs-export-ring"><svg viewBox="0 0 36 36">
          <circle class="bg" cx="18" cy="18" r="16"/>
          <circle class="fg" id="cs-exp-arc" cx="18" cy="18" r="16" stroke-dasharray="100.5" stroke-dashoffset="${100.5*(1-(st.exportPct||0)/100)}"/>
        </svg><span id="cs-exp-pct">${Math.round(st.exportPct||0)}%</span></div>
        <div class="cs-export-note" id="cs-exp-note">${esc(st.exportNote||('Rendering '+CS_DEVICE.label))}</div>
        <button class="cs-ghost-pill" onclick="csCancelExport()">Cancel</button>
      </div>`:''}
    </div>

    <div class="cs-timeline" id="cs-ed-tracks" onpointerdown="csScrubStart(event)">
      <div class="cs-playhead" id="cs-playhead" style="transform:translateX(${CS_LBL+st.playhead*CS_PX}px)"></div>
      ${csRuler(total)}
      ${csRenderTrack('video',st)}
      ${csRenderTrack('overlay',st)}
      ${csRenderTrack('caption',st)}
      ${csRenderTrack('audio',st)}
    </div>

    <div class="cs-toolbar">
      <div class="cs-tb-row cs-tb-context ${hasSel?'':'is-hidden'}">
        <button class="cs-tb" onclick="csSplit()">${CS_ICON('split')}<span>Split</span></button>
        <button class="cs-tb" onclick="csOpenSheet('trim')">${CS_ICON('trim')}<span>Trim</span></button>
        <button class="cs-tb" onclick="csDuplicate()">${CS_ICON('dup')}<span>Duplicate</span></button>
        <button class="cs-tb" onclick="csReplaceClick()">${CS_ICON('replace')}<span>Replace</span></button>
        <button class="cs-tb danger" onclick="csDeleteSelected()">${CS_ICON('trash')}<span>Delete</span></button>
      </div>
      <div class="cs-tb-row cs-tb-main">
        <button class="cs-tb" onclick="csAddClipClick()">${CS_ICON('plus')}<span>Add clip</span></button>
        <button class="cs-tb" onclick="csAddText()">${CS_ICON('text')}<span>Text</span></button>
        <button class="cs-tb" onclick="csAddImageClick()">${CS_ICON('image')}<span>Image</span></button>
        <button class="cs-tb ${tool==='captions'?'active':''}" onclick="csOpenSheet('captions')">${CS_ICON('cc')}<span>Captions</span></button>
        <button class="cs-tb ${tool==='audio'?'active':''}" onclick="csOpenSheet('audio')">${CS_ICON('music')}<span>Music</span></button>
        <button class="cs-tb ${tool==='voice'?'active':''}" onclick="csOpenSheet('voice')">${CS_ICON('voice')}<span>Voice</span></button>
        <button class="cs-tb ${tool==='filter'?'active':''}" onclick="csOpenSheet('filter')">${CS_ICON('filter')}<span>Filters</span></button>
        <button class="cs-tb ${tool==='adjust'?'active':''}" onclick="csOpenSheet('adjust')">${CS_ICON('adjust')}<span>Adjust</span></button>
      </div>
    </div>

    ${st.sheet ? `<div class="cs-scrim" onclick="csCloseSheet()"></div>` : ''}
    ${csRenderSheet(st)}
    <input type="file" id="cs-add-clip"     accept="video/*,image/*" multiple style="display:none" onchange="csHandleUpload(event, true)"/>
    <input type="file" id="cs-replace-clip" accept="video/*,image/*"          style="display:none" onchange="csHandleReplace(event)"/>
    <input type="file" id="cs-add-image"    accept="image/*"                  style="display:none" onchange="csHandleImageOverlay(event)"/>
  </div>`;
}

// One markup path for both overlay kinds — identical drag/resize affordances.
function csOverlayHtml(o, st){
  const sel = st.selectedId===o.id && st.selectedType==='overlay';
  const on  = st.playhead>=o.startMs && st.playhead<=o.endMs;
  const handles = sel ? `
    <button class="ov-del" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();csDeleteOverlay('${o.id}')">${CS_ICON('close')}</button>
    <span class="ov-handle br" onpointerdown="csOverlayResizeStart(event,'${o.id}')">${CS_ICON('resize')}</span>` : '';
  if(o.type === 'image'){
    return `<div class="cs-ed-overlay is-img ${sel?'sel':''} ${on?'':'off'}"
      data-ovid="${o.id}" data-start="${o.startMs}" data-end="${o.endMs}"
      style="left:${o.x}%;top:${o.y}%;width:${o.w}%;opacity:${(o.alpha==null?100:o.alpha)/100}"
      onpointerdown="csOverlayPointerDown(event,'${o.id}')">
      <img src="${o.url}" alt="" draggable="false"/>${handles}</div>`;
  }
  const f = csFontById(o.font);
  return `<div class="cs-ed-overlay is-text ${sel?'sel':''} ${on?'':'off'}"
    data-ovid="${o.id}" data-start="${o.startMs}" data-end="${o.endMs}"
    style="left:${o.x}%;top:${o.y}%;font-family:${f.css};font-weight:${f.weight};font-size:${o.size}px;color:${o.color};${csStyleCss(o.style,o.color,o.bg)}"
    onpointerdown="csOverlayPointerDown(event,'${o.id}')"><span class="ov-txt">${esc(o.text)}</span>${handles}</div>`;
}

function csRuler(total){
  const secs = Math.max(4, Math.ceil(total/1000));
  let ticks = '';
  for(let s=0; s<=secs; s++){
    ticks += `<div class="cs-tick ${s%5===0?'maj':''}" style="left:${CS_LBL + s*1000*CS_PX}px">${s%5===0?`<span>${_fmtTs(s)}</span>`:''}</div>`;
  }
  return `<div class="cs-ruler" style="width:${CS_LBL + secs*1000*CS_PX + 60}px">${ticks}</div>`;
}

function csRenderTrack(kind, st){
  const px = CS_PX;
  if(kind==='video'){
    if(!st.clips.length) return `<div class="cs-track"><div class="cs-track-lbl">Video</div><div class="cs-track-empty">No clips yet</div></div>`;
    const chunks = st.clips.map((c,i) => {
      const dur = Math.max(120, c.outMs - c.inMs);
      const w = Math.max(46, dur*px);
      const sel = st.selectedId===c.id && st.selectedType==='video';
      return `<div class="cs-clip cs-clip-video ${sel?'sel':''}" style="width:${w}px" onclick="csSelect('${c.id}','video')">
        ${c.thumb?`<img class="cs-clip-thumb" src="${c.thumb}" alt=""/>`:''}
        <span class="cs-clip-name">${c.kind==='image'?'Photo':'Clip'} ${i+1}</span>
        <span class="cs-clip-dur">${(dur/1000).toFixed(1)}s</span>
      </div>`;
    }).join('');
    return `<div class="cs-track"><div class="cs-track-lbl">Video</div><div class="cs-track-lane">${chunks}<button class="cs-lane-add" onclick="csAddClipClick()">${CS_ICON('plus')}</button></div></div>`;
  }
  if(kind==='overlay'){
    const items = st.overlays.map(o=>{
      const w = Math.max(46,(o.endMs-o.startMs)*px), x = o.startMs*px;
      const sel = st.selectedId===o.id && st.selectedType==='overlay';
      const label = o.type==='image' ? 'Image' : o.text.slice(0,22);
      return `<div class="cs-clip ${o.type==='image'?'cs-clip-img':'cs-clip-text'} ${sel?'sel':''}"
        style="position:absolute;left:${x}px;width:${w}px" onclick="csSelect('${o.id}','overlay')"><span class="cs-clip-name">${esc(label)}</span></div>`;
    }).join('');
    return `<div class="cs-track"><div class="cs-track-lbl">Overlays</div><div class="cs-track-lane rel">${items||'<div class="cs-track-empty">Add text or an image</div>'}</div></div>`;
  }
  if(kind==='caption'){
    const caps = st.captions||[];
    // Word chunks are dense; draw at most 120 pills so the timeline stays cheap.
    const step = Math.max(1, Math.ceil(caps.length/120));
    const items = caps.filter((_,i)=>i%step===0).map(c=>{
      const w = Math.max(10, ((c.end||c.start+0.4)-c.start)*1000*px), x = c.start*1000*px;
      return `<div class="cs-clip cs-clip-cap" style="position:absolute;left:${x}px;width:${w}px" onclick="csOpenSheet('captions')"><span class="cs-clip-name">${esc((c.text||'').slice(0,10))}</span></div>`;
    }).join('');
    return `<div class="cs-track"><div class="cs-track-lbl">Captions</div><div class="cs-track-lane rel">${items||'<div class="cs-track-empty">Auto-caption available</div>'}</div></div>`;
  }
  if(kind==='audio'){
    const items = (st.audioTracks||[]).map(a=>{
      const w = Math.max(46,(a.durMs||10000)*px), x = (a.startMs||0)*px;
      return `<div class="cs-clip cs-clip-audio" style="position:absolute;left:${x}px;width:${w}px" onclick="csOpenSheet('audio')"><span class="cs-clip-name">${esc(a.name||'Track')}</span></div>`;
    }).join('');
    return `<div class="cs-track"><div class="cs-track-lbl">Audio</div><div class="cs-track-lane rel">${items||'<div class="cs-track-empty">Add background music</div>'}</div></div>`;
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════
//  MEDIA POOL  (the fix for "editor dies after 5–6 edits")
//  render() replaces #root.innerHTML, so any <video> written into the editor
//  markup was destroyed and re-created on EVERY edit — while still holding a
//  decoder and a blob-backed source. Chrome/Android caps concurrent media
//  decoders (~6–16); after a handful of edits the cap was hit and every later
//  play()/load() silently failed. These two elements are created once, live
//  outside the render tree, and are re-parented into the stage after render.
// ═══════════════════════════════════════════════════════════════════════════
const CSM = { a:null, b:null, activeIsA:true, host:null };

function csMakeVideo(){
  const v = document.createElement('video');
  v.className = 'cs-ed-vid';
  v.playsInline = true; v.preload = 'auto';
  v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
  v.setAttribute('disablepictureinpicture','');
  v.dataset.cid = '';
  // Listeners are attached ONCE here, never per-load. The old code assigned
  // v.onloadedmetadata on every seek/advance, which stacked closures that each
  // captured a stale clip and fought each other.
  v.addEventListener('loadedmetadata', () => {
    const pending = v._pendingSeek;
    if(pending != null){ v._pendingSeek = null; try { v.currentTime = pending; } catch(_){} }
    if(S.studio && S.studio.playing && v === csActiveVideo()) v.play().catch(()=>{});
  });
  v.addEventListener('error', () => { v.dataset.cid = ''; });
  return v;
}
function csEnsureMedia(){
  if(!CSM.a){ CSM.a = csMakeVideo(); CSM.b = csMakeVideo(); CSM.b.muted = true; }
  return CSM;
}
window.csActiveVideo = function(){ csEnsureMedia(); return CSM.activeIsA ? CSM.a : CSM.b; };
function csIdleVideo(){ csEnsureMedia(); return CSM.activeIsA ? CSM.b : CSM.a; };

// Re-parent the persistent buffers into the freshly rendered stage.
function csAttachStage(){
  const host = document.getElementById('cs-ed-media');
  if(!host) return false;
  csEnsureMedia();
  if(CSM.a.parentNode !== host){ host.appendChild(CSM.a); host.appendChild(CSM.b); }
  CSM.host = host;
  csActiveVideo().classList.add('on');
  csIdleVideo().classList.remove('on');
  CSE.ovEls = null;              // DOM was rebuilt → drop cached node list
  CSE.capEl = null;
  return true;
}

// Hard release: called when leaving the editor / the Create tab. Without this
// the decoders stayed warm in the background and Android reclaimed the tab.
function csReleaseMedia(){
  [CSM.a, CSM.b].forEach(v => {
    if(!v) return;
    try { v.pause(); v.removeAttribute('src'); v.load(); } catch(_){}
    v.dataset.cid = ''; v._pendingSeek = null;
  });
}

// ── Blob URL ledger ─────────────────────────────────────────────────────────
// Splits and duplicates share a source URL. Revoking on the first delete broke
// the surviving copies (and never revoking leaked ~every imported file).
// Ref-count instead: one owner per createObjectURL, released at zero.
const CSURL = new Map();
function csHoldUrl(url){ if(!url) return url; CSURL.set(url, (CSURL.get(url)||0)+1); return url; }
function csMakeUrl(blob){ return csHoldUrl(URL.createObjectURL(blob)); }
function csDropUrl(url){
  if(!url || !CSURL.has(url)) return;
  const n = CSURL.get(url) - 1;
  if(n > 0){ CSURL.set(url, n); return; }
  CSURL.delete(url);
  try { URL.revokeObjectURL(url); } catch(_){}
}

// ═══════════════════════════════════════════════════════════════════════════
//  TIMING HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function _fmtTs(s){ s=Math.max(0,+s||0); const m=Math.floor(s/60), r=Math.floor(s%60); return `${m}:${String(r).padStart(2,'0')}`; }
function studioTotalDur(){ return (S.studio.clips||[]).reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs))/1000, 0); }
function csTotalMs(){
  const st = S.studio;
  const vid = st.clips.reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs)), 0);
  const ov  = st.overlays.reduce((n,o)=>Math.max(n,o.endMs), 0);
  return Math.max(vid, ov, 1000);
}
function csClipStart(id){
  const st=S.studio; let acc=0;
  for(const c of st.clips){ if(c.id===id) return acc; acc += (c.outMs-c.inMs); }
  return 0;
}
// Which clip owns a global timeline position, and where inside it.
function csLocate(ms){
  const st = S.studio; let acc = 0;
  for(let i=0;i<st.clips.length;i++){
    const c = st.clips[i], dur = c.outMs - c.inMs;
    if(ms < acc + dur || i === st.clips.length-1){
      return { clip:c, index:i, start:acc, localMs: Math.max(0, Math.min(dur, ms-acc)) };
    }
    acc += dur;
  }
  return null;
}
// Caption lookup with a moving cursor: the old linear scan ran over every
// caption on every animation frame, which word-level captions made 20× worse.
function csCapAt(ms){
  const caps = S.studio.captions || [];
  if(!caps.length) return null;
  const t = ms/1000;
  let i = CSE.capIdx || 0;
  if(i >= caps.length) i = caps.length-1;
  if(caps[i] && t < caps[i].start){ while(i > 0 && caps[i-1].start > t) i--; if(i>0) i--; }
  while(i < caps.length-1 && t >= (caps[i].end != null ? caps[i].end : caps[i].start+0.4)) i++;
  CSE.capIdx = i;
  const c = caps[i];
  const end = c.end != null ? c.end : c.start + 0.4;
  return (t >= c.start && t <= end) ? c : null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYBACK ENGINE
//  One rAF loop. It never calls render(). Per-frame DOM work is: one transform,
//  one text node, and class toggles on a CACHED overlay node list.
// ═══════════════════════════════════════════════════════════════════════════
const CSE = { raf:null, scrubbing:false, seekPending:false, loading:false, capIdx:0, ovEls:null, capEl:null, lastCap:null, lastSec:-1 };

function csEnsureEngine(){
  if(CSE.raf) return;
  const loop = () => {
    const st = S.studio;
    if(!st || st.mode !== 'editor' || S.tab !== 'create'){ csStopEngine(); return; }
    CSE.raf = requestAnimationFrame(loop);
    const v = csActiveVideo();
    if(v && v.dataset.cid && !CSE.scrubbing && !v.paused){
      const cur = st.clips.find(c=>c.id===v.dataset.cid);
      if(cur){
        st.playhead = csClipStart(cur.id) + Math.max(0, v.currentTime*1000 - cur.inMs);
        if(v.currentTime >= cur.outMs/1000 - 0.03) csAdvanceClip();
      }
    }
    csPaint();
  };
  CSE.raf = requestAnimationFrame(loop);
}
function csStopEngine(){ if(CSE.raf){ cancelAnimationFrame(CSE.raf); CSE.raf = null; } }

function csPaint(){
  const st = S.studio;
  const ph = document.getElementById('cs-playhead');
  if(ph) ph.style.transform = `translateX(${CS_LBL + st.playhead*CS_PX}px)`;

  // Clock only changes once per second — skip 29 of 30 text writes.
  const sec = Math.floor(st.playhead/1000);
  if(sec !== CSE.lastSec){
    CSE.lastSec = sec;
    const t = document.querySelector('.cs-ed-time .cur');
    if(t) t.textContent = _fmtTs(st.playhead/1000);
  }

  if(!CSE.ovEls){
    const layer = document.getElementById('cs-ed-layer');
    CSE.ovEls = layer ? Array.from(layer.querySelectorAll('.cs-ed-overlay')) : [];
    CSE.capEl = document.getElementById('cs-ed-cap');
    CSE.lastCap = undefined;
  }
  for(let i=0;i<CSE.ovEls.length;i++){
    const el = CSE.ovEls[i];
    const on = st.playhead >= +el.dataset.start && st.playhead <= +el.dataset.end;
    if(el.classList.contains('off') === on) el.classList.toggle('off', !on);
  }
  const capEl = CSE.capEl;
  if(capEl){
    const cap = csCapAt(st.playhead);
    const txt = cap ? cap.text : '';
    if(txt !== CSE.lastCap){
      CSE.lastCap = txt;
      capEl.textContent = txt;
      capEl.classList.toggle('off', !cap);
    }
  }
}

// ── Loading / seeking ───────────────────────────────────────────────────────
function csSetClipSource(v, clip, seekSec){
  if(v.dataset.cid === clip.id){
    if(seekSec != null && Math.abs(v.currentTime - seekSec) > 0.04){
      try { v.fastSeek ? v.fastSeek(seekSec) : (v.currentTime = seekSec); } catch(_){}
    }
    return;
  }
  v.dataset.cid = clip.id;
  v._pendingSeek = seekSec == null ? clip.inMs/1000 : seekSec;
  v.src = clip.url;
  v.load();
}

window.csLoadCurrent = function(seekToPlayhead){
  const st = S.studio;
  if(!st || st.mode !== 'editor') return;
  if(!csAttachStage()) return;
  if(!st.clips.length){ csReleaseMedia(); return; }
  const loc = csLocate(st.playhead) || { clip: st.clips[0], localMs:0 };
  const cur = (st.selectedType==='video' && st.clips.find(c=>c.id===st.selectedId)) || loc.clip;
  const v = csActiveVideo();
  v.volume = Math.min(1, (st.clipVolume==null?100:st.clipVolume)/100);
  v.muted = false;
  const seek = seekToPlayhead ? (cur.inMs + (cur===loc.clip ? loc.localMs : 0))/1000 : cur.inMs/1000;
  if(cur.kind !== 'image') csSetClipSource(v, cur, seek);
  csPreloadNext(cur.id);
  csEnsureEngine();
};

function csPreloadNext(curId){
  const st = S.studio;
  const next = st.clips[st.clips.findIndex(c=>c.id===curId)+1];
  const b = csIdleVideo();
  if(!b) return;
  if(!next || next.kind === 'image'){
    if(b.dataset.cid){ b.dataset.cid=''; try{ b.removeAttribute('src'); b.load(); }catch(_){} }
    return;
  }
  if(b.dataset.cid === next.id) return;
  b.muted = true;
  csSetClipSource(b, next, next.inMs/1000);
}

function csPlay(){
  const st = S.studio;
  const v = csActiveVideo(); if(!v) return;
  if(!v.dataset.cid) window.csLoadCurrent(true);
  st.playing = true;
  v.muted = false;
  v.play().catch(()=>{});
  csEnsureEngine(); csSyncPlayBtn();
}
function csPause(){
  const v = csActiveVideo();
  if(S.studio) S.studio.playing = false;
  if(v) v.pause();
  csSyncPlayBtn();
}
function csSyncPlayBtn(){
  const btn = document.querySelector('.cs-ed-play');
  if(btn) btn.innerHTML = CS_ICON(S.studio && S.studio.playing?'pause':'play');
  document.getElementById('cs-ed-stage')?.classList.toggle('is-playing', !!(S.studio&&S.studio.playing));
}
window.csTogglePlay = () => { S.studio.playing ? csPause() : csPlay(); };
window.csOnTime = () => {};
window.csOnClipEnded = () => csAdvanceClip();

// Buffer swap: no element ID rewriting (that confused every getElementById
// caller, including core.js). We flip one pointer and one class.
function csAdvanceClip(){
  const st = S.studio;
  const a = csActiveVideo(), b = csIdleVideo();
  const i = st.clips.findIndex(c=>c.id===a.dataset.cid);
  const next = st.clips[i+1];
  if(!next){ csPause(); st.playhead = csTotalMs(); csPaint(); csSyncTrackSelection(); return; }

  if(b.dataset.cid === next.id && b.readyState >= 2){
    a.pause(); a.muted = true; a.classList.remove('on');
    b.muted = false; b.volume = Math.min(1,(st.clipVolume==null?100:st.clipVolume)/100);
    b.classList.add('on');
    CSM.activeIsA = !CSM.activeIsA;
    if(st.playing) b.play().catch(()=>{});
    a.dataset.cid = ''; try { a.removeAttribute('src'); a.load(); } catch(_){}
  } else {
    csSetClipSource(a, next, next.inMs/1000);
  }
  st.selectedId = next.id; st.selectedType = 'video';
  csPreloadNext(next.id);
  csSyncTrackSelection();
}

function csSyncTrackSelection(){
  const st = S.studio;
  document.querySelectorAll('.cs-clip-video').forEach((el,i)=>{
    el.classList.toggle('sel', !!(st.clips[i] && st.clips[i].id===st.selectedId && st.selectedType==='video'));
  });
}

// Seek the preview to wherever the playhead is. Coalesced to one call/frame.
function csQueueSeek(){
  if(CSE.seekPending) return;
  CSE.seekPending = true;
  requestAnimationFrame(() => { CSE.seekPending = false; csSyncToPlayhead(); });
}
function csSyncToPlayhead(){
  const st = S.studio;
  const loc = csLocate(st.playhead);
  if(!loc) return;
  const v = csActiveVideo();
  if(v && loc.clip.kind !== 'image'){
    csSetClipSource(v, loc.clip, (loc.clip.inMs + loc.localMs)/1000);
    if(v.dataset.cid !== loc.clip.id) csPreloadNext(loc.clip.id);
  }
  if(st.selectedId !== loc.clip.id || st.selectedType !== 'video'){
    st.selectedId = loc.clip.id; st.selectedType = 'video';
    csSyncTrackSelection();
    csSyncToolbarContext();
  }
}
function csSyncToolbarContext(){
  const row = document.querySelector('.cs-tb-context');
  if(row) row.classList.toggle('is-hidden', !S.studio.selectedId);
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRUBBING + DIRECT MANIPULATION
// ═══════════════════════════════════════════════════════════════════════════
window.csScrubStart = (e) => {
  const tracks = document.getElementById('cs-ed-tracks');
  if(!tracks) return;
  if(e.target.closest('.cs-clip, .cs-lane-add')) return;   // taps select, drags scrub
  const rect = tracks.getBoundingClientRect();
  const wasPlaying = S.studio.playing;
  if(wasPlaying) csPause();
  CSE.scrubbing = true;
  tracks.classList.add('scrubbing');
  csEnsureEngine();

  const apply = (clientX) => {
    const x = clientX - rect.left - CS_LBL + tracks.scrollLeft;
    S.studio.playhead = Math.max(0, Math.min(csTotalMs(), x / CS_PX));
    csQueueSeek();
  };
  apply(e.clientX);
  const move = ev => apply(ev.clientX);
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    CSE.scrubbing = false;
    tracks.classList.remove('scrubbing');
    csSyncToPlayhead();                    // settle exactly on the parked frame
    if(wasPlaying) csPlay();
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};

window.csSelect = (id, type) => {
  const st = S.studio;
  st.selectedId = id; st.selectedType = type;
  if(type==='video'){ st.playhead = csClipStart(id); window.csLoadCurrent(true); }
  render();
};
window.csSelectOverlay = (id) => {
  const st = S.studio;
  const o = st.overlays.find(x=>x.id===id); if(!o) return;
  st.selectedId = id; st.selectedType = 'overlay';
  st.editText = o;
  st.sheet = o.type === 'image' ? 'imageov' : 'text';
  if(o.type !== 'image') st.editTextTab = 'font';
  render();
};

// ── Overlay drag / pinch / handle-resize — text AND image ───────────────────
const CSPTR = { pts:new Map(), mode:null, o:null, el:null, base:null };

function csOverlayScale(o, el, factor){
  if(o.type === 'image'){
    o.w = Math.max(6, Math.min(100, +(o.w * factor).toFixed(2)));
    el.style.width = o.w + '%';
    const lbl = document.querySelector('[data-ov-size]'); if(lbl) lbl.textContent = Math.round(o.w)+'%';
  } else {
    o.size = Math.max(12, Math.min(180, Math.round(o.size * factor)));
    el.style.fontSize = o.size + 'px';
    const lbl = document.querySelector('[data-ov-size]'); if(lbl) lbl.textContent = o.size+'px';
  }
}

window.csOverlayPointerDown = (e, id) => {
  e.stopPropagation();
  const stage = document.getElementById('cs-ed-stage');
  const el = e.currentTarget;
  const o  = S.studio.overlays.find(x => x.id === id);
  if(!stage || !o) return;
  try { el.setPointerCapture(e.pointerId); } catch(_){}
  CSPTR.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

  if(CSPTR.pts.size === 2 && CSPTR.o === o){
    const [a,b] = [...CSPTR.pts.values()];
    CSPTR.mode = 'pinch';
    CSPTR.base.dist = Math.hypot(a.x-b.x, a.y-b.y) || 1;
    CSPTR.base.startSize = o.type==='image' ? o.w : o.size;
    return;
  }

  const rect = stage.getBoundingClientRect();
  CSPTR.o = o; CSPTR.el = el; CSPTR.mode = 'drag';
  CSPTR.base = { x:e.clientX, y:e.clientY, px:o.x, py:o.y, rect, moved:false };

  const move = (ev) => {
    if(CSPTR.pts.has(ev.pointerId)) CSPTR.pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    if(CSPTR.mode === 'pinch' && CSPTR.pts.size >= 2){
      const [a,b] = [...CSPTR.pts.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y) || 1;
      const startSize = CSPTR.base.startSize;
      const cur = o.type==='image' ? o.w : o.size;
      csOverlayScale(o, el, (startSize * (d/CSPTR.base.dist)) / cur);
      CSPTR.base.moved = true;
      return;
    }
    const dx = ev.clientX - CSPTR.base.x, dy = ev.clientY - CSPTR.base.y;
    if(Math.abs(dx) > 3 || Math.abs(dy) > 3) CSPTR.base.moved = true;
    // Free positioning across the whole frame (1%–99%, both axes).
    const nx = Math.max(1, Math.min(99, CSPTR.base.px + (dx / CSPTR.base.rect.width) * 100));
    const ny = Math.max(1, Math.min(99, CSPTR.base.py + (dy / CSPTR.base.rect.height) * 100));
    el.style.left = nx + '%'; el.style.top = ny + '%';
    o._px = nx; o._py = ny;
  };
  const up = (ev) => {
    CSPTR.pts.delete(ev.pointerId);
    if(CSPTR.pts.size > 0) return;
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    const moved = CSPTR.base && CSPTR.base.moved;
    if(moved){
      if(o._px != null){ o.x = o._px; o.y = o._py; delete o._px; delete o._py; }
      csPushHistory();
    } else {
      window.csSelectOverlay(id);
    }
    CSPTR.mode = null; CSPTR.o = null; CSPTR.el = null; CSPTR.base = null;
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};

window.csOverlayResizeStart = (e, id) => {
  e.stopPropagation(); e.preventDefault();
  const o = S.studio.overlays.find(x=>x.id===id); if(!o) return;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${id}"]`); if(!el) return;
  const stage = document.getElementById('cs-ed-stage');
  const rect = stage.getBoundingClientRect();
  const cx = rect.left + rect.width * (o.x/100), cy = rect.top + rect.height * (o.y/100);
  const d0 = Math.max(12, Math.hypot(e.clientX-cx, e.clientY-cy));
  const s0 = o.type==='image' ? o.w : o.size;
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch(_){}
  const move = (ev) => {
    const d = Math.max(8, Math.hypot(ev.clientX-cx, ev.clientY-cy));
    const cur = o.type==='image' ? o.w : o.size;
    csOverlayScale(o, el, (s0 * (d/d0)) / cur);
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    csPushHistory();
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};

window.csCaptionPointerDown = (e) => {
  e.stopPropagation();
  const stage = document.getElementById('cs-ed-stage');
  const el = e.currentTarget;
  const cs = S.studio.capStyle;
  if(!stage) return;
  const rect = stage.getBoundingClientRect();
  const x0=e.clientX, y0=e.clientY, px=cs.x==null?50:cs.x, py=cs.y==null?82:cs.y;
  let moved=false;
  try { el.setPointerCapture(e.pointerId); } catch(_){}
  const move = ev => {
    const dx=ev.clientX-x0, dy=ev.clientY-y0;
    if(Math.abs(dx)>3||Math.abs(dy)>3) moved=true;
    const nx=Math.max(4,Math.min(96, px + dx/rect.width*100));
    const ny=Math.max(4,Math.min(96, py + dy/rect.height*100));
    el.style.left=nx+'%'; el.style.top=ny+'%';
    cs._x=nx; cs._y=ny;
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    if(moved && cs._x!=null){ cs.x=cs._x; cs.y=cs._y; delete cs._x; delete cs._y; }
    else { S.studio.selectedType='caption'; S.studio.selectedId=null; window.csOpenSheet('captions'); }
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};

// ═══════════════════════════════════════════════════════════════════════════
//  CLIP EDITS
// ═══════════════════════════════════════════════════════════════════════════
// SPLIT — exactly at the parked playhead.
// Old behaviour read the <video>'s currentTime, which is the *decoder's*
// position: after a seek Chrome snaps to the nearest keyframe and reports it
// asynchronously, so the cut landed up to ~500ms away from the playhead (and
// silently fell back to the clip midpoint whenever the buffer had been swapped).
// The playhead is now the single source of truth, and the clip under it is
// resolved by accumulated trimmed durations, so the cut is frame-exact.
window.csSplit = () => {
  const st = S.studio;
  if(!st.clips.length){ toast('Add a clip first'); return; }
  const loc = csLocate(st.playhead);
  if(!loc){ toast('Move the playhead over a clip'); return; }
  const c = loc.clip;
  const at = Math.round(c.inMs + loc.localMs);        // exact source-time cut point
  if(at <= c.inMs + 40 || at >= c.outMs - 40){ toast('Park the playhead inside the clip to split'); return; }
  csPushHistory();
  const i = st.clips.indexOf(c);
  const right = { ...c, id: csId('c'), inMs: at, outMs: c.outMs };
  csHoldUrl(right.url);                                // shared source, +1 ref
  c.outMs = at;
  st.clips.splice(i+1, 0, right);
  st.selectedId = right.id; st.selectedType = 'video';
  st.playhead = csClipStart(right.id);                 // playhead sits on the cut
  render();
};

window.csDeleteSelected = () => {
  const st = S.studio;
  if(st.selectedType==='overlay'){ csPushHistory(); window.csDeleteOverlay(st.selectedId, true); render(); return; }
  if(st.selectedType!=='video') return;
  const i = st.clips.findIndex(c=>c.id===st.selectedId); if(i<0) return;
  csPushHistory();
  const gone = st.clips.splice(i,1)[0];
  csDropUrl(gone.url);
  st.selectedId = st.clips[0]?.id || null;
  st.selectedType = st.clips.length ? 'video' : null;
  st.playhead = Math.min(st.playhead, csTotalMs());
  const v = csActiveVideo(); if(v){ v.dataset.cid=''; try{ v.removeAttribute('src'); v.load(); }catch(_){} }
  render();
};
window.csDuplicate = () => {
  const st = S.studio;
  if(st.selectedType!=='video') return;
  const c = st.clips.find(x=>x.id===st.selectedId); if(!c) return;
  csPushHistory();
  const copy = { ...c, id: csId('c') };
  csHoldUrl(copy.url);
  st.clips.splice(st.clips.indexOf(c)+1, 0, copy);
  render();
};
window.csCopy = () => { window.__cs_clip = { ...S.studio.clips.find(x=>x.id===S.studio.selectedId) }; toast('Copied'); };
window.csSetTrim = (which, valMs) => {
  const st = S.studio;
  const c = st.clips.find(x=>x.id===st.selectedId); if(!c) return;
  const max = Math.round((c.dur||0)*1000) || c.outMs;
  if(which==='in')  c.inMs  = Math.max(0, Math.min(valMs, c.outMs-100));
  else              c.outMs = Math.min(max, Math.max(valMs, c.inMs+100));
  const lbl = document.querySelector(`[data-trim="${which}"]`);
  if(lbl) lbl.textContent = ((which==='in'?c.inMs:c.outMs)/1000).toFixed(2)+'s';
  const dur = document.querySelector('[data-trim="dur"]');
  if(dur) dur.textContent = ((c.outMs-c.inMs)/1000).toFixed(2)+'s';
};
window.csCommitTrim = () => { csPushHistory(); render(); };

function csId(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ── Overlays ────────────────────────────────────────────────────────────────
window.csAddText = () => {
  csPushHistory();
  const st = S.studio;
  const o = {
    id: csId('o'), type:'text',
    text:'Tap to edit', font:'classic', style:'none', color:'#FFFFFF', bg:'#000000',
    size:38, x:50, y:70, startMs: st.playhead, endMs: Math.min(csTotalMs(), st.playhead + 3000),
  };
  if(o.endMs - o.startMs < 800) o.endMs = o.startMs + 3000;
  st.overlays.push(o);
  st.selectedId=o.id; st.selectedType='overlay'; st.editText=o; st.sheet='text'; st.editTextTab='font';
  render();
};
window.csAddImageClick = () => document.getElementById('cs-add-image')?.click();
window.csHandleImageOverlay = async (e) => {
  const f = (e.target.files||[])[0]; e.target.value='';
  if(!f) return;
  csPushHistory();
  const st = S.studio;
  const url = csMakeUrl(f);
  const dims = await csImageSize(url).catch(()=>({w:1,h:1}));
  const o = {
    id: csId('o'), type:'image', url, blob:f, ar: dims.w/Math.max(1,dims.h),
    w:45, x:50, y:45, alpha:100,
    startMs: st.playhead, endMs: Math.min(csTotalMs(), st.playhead + 4000),
  };
  if(o.endMs - o.startMs < 800) o.endMs = o.startMs + 4000;
  st.overlays.push(o);
  st.selectedId=o.id; st.selectedType='overlay'; st.editText=o; st.sheet='imageov';
  render();
};
function csImageSize(url){
  return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res({w:i.naturalWidth,h:i.naturalHeight}); i.onerror=rej; i.src=url; });
}
window.csEditOverlayField = (k, v) => {
  const o = S.studio.editText; if(!o) return;
  o[k] = v;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(k === 'text'){
    const span = el && el.querySelector('.ov-txt');
    if(span) span.textContent = v;
    const chip = document.querySelector('.cs-clip-text.sel .cs-clip-name');
    if(chip) chip.textContent = v.slice(0,22);
    return;
  }
  if(el && o.type !== 'image'){
    const f = csFontById(o.font);
    el.setAttribute('style', `left:${o.x}%;top:${o.y}%;font-family:${f.css};font-weight:${f.weight};font-size:${o.size}px;color:${o.color};${csStyleCss(o.style,o.color,o.bg)}`);
  }
  const sheet = document.querySelector('.cs-sheet');
  if(sheet && S.studio.sheet==='text') sheet.outerHTML = csTextSheet(S.studio);
};
window.csLiveOverlaySize = (v) => {
  const o = S.studio.editText; if(!o) return;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(o.type==='image'){ o.w = v; if(el) el.style.width = v+'%'; }
  else { o.size = v; if(el) el.style.fontSize = v+'px'; }
  const lbl = document.querySelector('[data-ov-size]');
  if(lbl) lbl.textContent = o.type==='image' ? v+'%' : v+'px';
};
window.csLiveOverlayAlpha = (v) => {
  const o = S.studio.editText; if(!o) return;
  o.alpha = v;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(el) el.style.opacity = v/100;
  const lbl = document.querySelector('[data-ov-alpha]'); if(lbl) lbl.textContent = v+'%';
};
window.csEditOverlayDuration = (ms) => {
  const o = S.studio.editText; if(!o) return;
  o.endMs = o.startMs + ms;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(el) el.dataset.end = o.endMs;
  const chip = document.querySelector('.cs-clip-text.sel, .cs-clip-img.sel');
  if(chip) chip.style.width = Math.max(46, ms*CS_PX)+'px';
  const lbl = document.querySelector('[data-ov-dur]'); if(lbl) lbl.textContent = (ms/1000).toFixed(1)+'s';
};
window.csDeleteOverlay = (id, skipRender) => {
  const st = S.studio;
  const i = st.overlays.findIndex(o=>o.id===id); if(i<0) return;
  const gone = st.overlays.splice(i,1)[0];
  if(gone.type==='image') csDropUrl(gone.url);
  if(st.selectedId===id){ st.selectedId=null; st.selectedType=null; st.editText=null; st.sheet=null; }
  if(!skipRender) render();
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHEETS — one chrome, fixed heights, no layout jump between tools
// ═══════════════════════════════════════════════════════════════════════════
function csSheet(title, body, opts){
  opts = opts || {};
  return `<div class="cs-sheet ${opts.tall?'tall':''}" onclick="event.stopPropagation()">
    <div class="cs-sheet-grip" onpointerdown="csSheetDragStart(event)"></div>
    <div class="cs-sheet-h"><h4>${esc(title)}</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div class="cs-sheet-body">${body}</div>
  </div>`;
}
function csRenderSheet(st){
  switch(st.sheet){
    case 'text':     return st.editText ? csTextSheet(st) : '';
    case 'imageov':  return st.editText ? csImageSheet(st) : '';
    case 'trim':     return csTrimSheet(st);
    case 'filter':   return csFilterSheet(st);
    case 'audio':    return csAudioSheet(st);
    case 'captions': return csCaptionsSheet(st);
    case 'adjust':   return csAdjustSheet(st);
    case 'voice':    return csVoiceSheet(st);
    default:         return '';
  }
}
// Swap only the sheet markup — never re-render the editor (that would tear the
// preview stage down mid-interaction).
function csSwapSheet(html){
  const sheet = document.querySelector('.cs-sheet');
  if(sheet) sheet.outerHTML = html; else render();
}

function csTextSheet(st){
  const o = st.editText, tab = st.editTextTab;
  const body = `
    <textarea class="cs-text-input" placeholder="Type text…" oninput="csEditOverlayField('text',this.value)">${esc(o.text)}</textarea>
    <div class="cs-sheet-tabs">
      ${['font','style','color','size'].map(t=>`<button class="${tab===t?'on':''}" onclick="csSetTextTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
    </div>
    <div class="cs-tabpane">
    ${tab==='font' ? `<div class="cs-font-grid">
      ${CS_FONTS.map(f=>`<button class="cs-font-cell ${o.font===f.id?'on':''}" style="font-family:${f.css};font-weight:${f.weight}" onclick="csEditOverlayField('font','${f.id}')">${f.name}</button>`).join('')}
    </div>` : ''}
    ${tab==='style' ? `<div class="cs-style-grid">
      ${CS_STYLES.map(s=>`<button class="cs-style-cell ${o.style===s.id?'on':''}" style="${csStyleCss(s.id,o.color,'#000')}" onclick="csEditOverlayField('style','${s.id}')">${s.name}</button>`).join('')}
    </div>` : ''}
    ${tab==='color' ? `<div class="cs-color-row">
      ${CS_COLORS.map(c=>`<button class="cs-color-dot ${o.color===c?'on':''}" style="background:${c}" onclick="csEditOverlayField('color','${c}')"></button>`).join('')}
    </div>` : ''}
    ${tab==='size' ? `<div class="cs-pad">
      <div class="cs-row-lbl"><span>Size</span><span data-ov-size>${o.size}px</span></div>
      <input class="cs-slider" type="range" min="14" max="160" value="${o.size}" oninput="csLiveOverlaySize(+this.value)" onchange="csPushHistory()"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>Time on screen</span><span data-ov-dur>${((o.endMs-o.startMs)/1000).toFixed(1)}s</span></div>
      <input class="cs-slider" type="range" min="500" max="${Math.max(1500,csTotalMs())}" value="${o.endMs-o.startMs}" oninput="csEditOverlayDuration(+this.value)"/>
      <div class="cs-note">Drag the text on the preview to move it anywhere. Pinch, or drag the ⤢ corner, to resize.</div>
    </div>` : ''}
    </div>`;
  return csSheet('Text', body, {tall:true});
}
window.csSetTextTab = (t) => { S.studio.editTextTab = t; csSwapSheet(csTextSheet(S.studio)); };

function csImageSheet(st){
  const o = st.editText;
  const body = `
    <div class="cs-img-preview"><img src="${o.url}" alt=""/></div>
    <div class="cs-pad">
      <div class="cs-row-lbl"><span>Size</span><span data-ov-size>${Math.round(o.w)}%</span></div>
      <input class="cs-slider" type="range" min="6" max="100" value="${Math.round(o.w)}" oninput="csLiveOverlaySize(+this.value)" onchange="csPushHistory()"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>Opacity</span><span data-ov-alpha>${o.alpha==null?100:o.alpha}%</span></div>
      <input class="cs-slider" type="range" min="10" max="100" value="${o.alpha==null?100:o.alpha}" oninput="csLiveOverlayAlpha(+this.value)"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>Time on screen</span><span data-ov-dur>${((o.endMs-o.startMs)/1000).toFixed(1)}s</span></div>
      <input class="cs-slider" type="range" min="500" max="${Math.max(1500,csTotalMs())}" value="${o.endMs-o.startMs}" oninput="csEditOverlayDuration(+this.value)"/>
      <button class="cs-ghost" onclick="csDeleteOverlay('${o.id}')">Remove image</button>
      <div class="cs-note">Drag to move, pinch or drag the ⤢ corner to resize.</div>
    </div>`;
  return csSheet('Image overlay', body);
}

function csTrimSheet(st){
  const c = st.clips.find(x=>x.id===st.selectedId);
  if(!c) return csSheet('Trim', '<div class="cs-note">Select a clip first.</div>');
  const max = Math.round((c.dur||0)*1000) || c.outMs;
  return csSheet('Trim', `
    <div class="cs-pad">
      <div class="cs-row-lbl"><span>Start</span><span data-trim="in">${(c.inMs/1000).toFixed(2)}s</span></div>
      <input class="cs-slider" type="range" min="0" max="${max}" step="10" value="${c.inMs}" oninput="csSetTrim('in',+this.value)" onchange="csCommitTrim()"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>End</span><span data-trim="out">${(c.outMs/1000).toFixed(2)}s</span></div>
      <input class="cs-slider" type="range" min="0" max="${max}" step="10" value="${c.outMs}" oninput="csSetTrim('out',+this.value)" onchange="csCommitTrim()"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>Clip length</span><span data-trim="dur">${((c.outMs-c.inMs)/1000).toFixed(2)}s</span></div>
      <div class="cs-note">Or park the playhead and tap Split for a frame-exact cut.</div>
    </div>`);
}

function csFilterSheet(st){
  return csSheet('Filters', `
    <div class="cs-filter-grid">
      ${CS_FILTERS.map(f=>`<button class="cs-filter-cell ${st.filter===f.id?'on':''}" data-fid="${f.id}" onclick="csPickFilter('${f.id}',this)">
        <div class="ph" style="filter:${f.filter==='none'?'none':f.filter}"></div><div class="n">${f.name}</div>
      </button>`).join('')}
    </div>
    <div class="cs-note">Filters are burned into the exported file.</div>`);
}
window.csPickFilter = (id, btn) => {
  S.studio.filter = id;
  const grid = btn && btn.closest('.cs-filter-grid');
  if(grid) grid.querySelectorAll('.cs-filter-cell').forEach(el => el.classList.toggle('on', el.getAttribute('data-fid')===id));
  csApplyPreview();
};

function csAudioSheet(st){
  const tracks = st.audioTracks||[];
  return csSheet('Audio', `
    <label class="cs-upload-btn">${CS_ICON('music')} Add background music
      <input type="file" accept="audio/*" style="display:none" onchange="csAddAudio(event)"/>
    </label>
    ${tracks.length ? `<div class="cs-track-list">${tracks.map(a=>`
      <div class="cs-track-item"><span class="n">${esc(a.name)}</span><span class="d">${_fmtTs((a.durMs||0)/1000)}</span>
        <button class="x" onclick="csRemoveAudio('${a.id}')">${CS_ICON('trash')}</button></div>`).join('')}</div>` : ''}
    <div class="cs-row-lbl" style="margin-top:18px"><span>Music volume</span><span id="cs-vol-val">${(st.volume==null?100:st.volume)}%</span></div>
    <input class="cs-slider" type="range" min="0" max="200" value="${(st.volume==null?100:st.volume)}" oninput="S.studio.volume=+this.value;document.getElementById('cs-vol-val').textContent=this.value+'%'"/>
    <div class="cs-row-lbl" style="margin-top:14px"><span>Original clip volume</span><span id="cs-cvol-val">${(st.clipVolume==null?100:st.clipVolume)}%</span></div>
    <input class="cs-slider" type="range" min="0" max="150" value="${(st.clipVolume==null?100:st.clipVolume)}" oninput="csSetClipVolume(+this.value)"/>`, {tall:true});
}
window.csSetClipVolume = (v) => {
  S.studio.clipVolume = v;
  const l = document.getElementById('cs-cvol-val'); if(l) l.textContent = v+'%';
  [CSM.a, CSM.b].forEach(el => { if(el) el.volume = Math.min(1, v/100); });
};
window.csRemoveAudio = (id) => {
  const st = S.studio;
  const i = (st.audioTracks||[]).findIndex(a=>a.id===id); if(i<0) return;
  csDropUrl(st.audioTracks.splice(i,1)[0].url);
  render();
};

function csCaptionsSheet(st){
  const tab = st.capTab || 'style';
  const cs = st.capStyle, eff = csCapStyle();
  const body = `
    <button class="cs-primary" ${st.transcribing?'disabled':''} onclick="csAutoCaption()">
      ${CS_ICON('sparkle')} ${st.transcribing?'Transcribing…':'Auto-generate captions'}
    </button>
    <div class="cs-sheet-tabs" style="margin-top:14px">
      ${[['style','Style'],['pace','Pace'],['color','Color'],['size','Size'],['list','Lines']].map(([t,l])=>`<button class="${tab===t?'on':''}" onclick="csSetCapTab('${t}')">${l}</button>`).join('')}
    </div>
    <div class="cs-tabpane">
    ${tab==='style' ? `<div class="cs-cap-grid">
      ${CS_CAP_PRESETS.map(p=>{
        const f = csFontById(p.font);
        const inner = `font-family:${f.css};font-weight:${f.weight};color:${p.color};`
          + (p.bg?`background:${p.bg};padding:.16em .4em;border-radius:${p.radius}em;`:'')
          + (p.stroke?`-webkit-text-stroke:1px ${p.stroke};paint-order:stroke fill;`:'')
          + (p.shadow?`text-shadow:0 2px 6px rgba(0,0,0,.8);`:'')
          + (p.upper?`text-transform:uppercase;`:'');
        return `<button class="cs-cap-cell ${eff.preset===p.id?'on':''}" onclick="csPickCapPreset('${p.id}')">
          <span class="prev" style="${inner}">Aa</span><span class="n">${p.name}</span></button>`;
      }).join('')}
    </div>` : ''}
    ${tab==='pace' ? `<div class="cs-pad">
      <div class="cs-row-lbl"><span>Words on screen</span><span>${eff.words===1?'One at a time':'Two at a time'}</span></div>
      <div class="cs-seg">
        <button class="${eff.words===1?'on':''}" onclick="csSetCapWords(1)">1 word</button>
        <button class="${eff.words===2?'on':''}" onclick="csSetCapWords(2)">2 words</button>
      </div>
      <div class="cs-note">TikTok/CapCut style: captions pop word by word, timed to the actual speech using word-level timestamps from the transcriber.
      ${st.capWords && st.capWords.length ? `<br><b>${st.capWords.length}</b> timed words in this take.` : ''}</div>
    </div>` : ''}
    ${tab==='color' ? `<div class="cs-color-row">
      <button class="cs-color-dot ${!cs.color?'on':''}" style="background:conic-gradient(#F5C518,#EC4899,#22D3EE,#F5C518)" onclick="csSetCapField('color',null)"></button>
      ${CS_COLORS.map(c=>`<button class="cs-color-dot ${cs.color===c?'on':''}" style="background:${c}" onclick="csSetCapField('color','${c}')"></button>`).join('')}
    </div><div class="cs-note">First swatch keeps the preset's own colour.</div>` : ''}
    ${tab==='size' ? `<div class="cs-pad">
      <div class="cs-row-lbl"><span>Size</span><span id="cs-cap-size-v">${eff.size}px</span></div>
      <input class="cs-slider" type="range" min="18" max="96" value="${eff.size}" oninput="csSetCapField('size',+this.value)"/>
      <div class="cs-row-lbl" style="margin-top:16px"><span>Vertical position</span><span id="cs-cap-y-v">${Math.round(eff.y)}%</span></div>
      <input class="cs-slider" type="range" min="8" max="94" value="${Math.round(eff.y)}" oninput="csSetCapField('y',+this.value)"/>
      <div class="cs-note">You can also drag the caption on the preview.</div>
    </div>` : ''}
    ${tab==='list' ? ((st.captions||[]).length ? `<div class="cs-cap-list">${st.captions.map((c,i)=>`
      <div class="cs-cap-line"><div class="t">${c.start.toFixed(1)}s</div>
        <input class="cs-cap-edit" value="${esc(c.text)}" oninput="S.studio.captions[${i}].text=this.value;csSyncCaption()"/>
      </div>`).join('')}</div>` : '<div class="cs-note" style="text-align:center;padding:22px 0">No captions yet.</div>') : ''}
    </div>`;
  return csSheet('Captions', body, {tall:true});
}
window.csSetCapTab = (t) => { S.studio.capTab = t; csSwapSheet(csCaptionsSheet(S.studio)); };
window.csPickCapPreset = (id) => {
  S.studio.capStyle.preset = id;
  csSyncCaption();
  document.querySelectorAll('.cs-cap-cell').forEach((el,i)=>el.classList.toggle('on', CS_CAP_PRESETS[i].id===id));
};
window.csSetCapField = (k, v) => {
  S.studio.capStyle[k] = v;
  csSyncCaption();
  if(k==='size'){ const l=document.getElementById('cs-cap-size-v'); if(l) l.textContent=v+'px'; }
  if(k==='y'){ const l=document.getElementById('cs-cap-y-v'); if(l) l.textContent=Math.round(v)+'%'; }
  if(k==='color'){ document.querySelectorAll('.cs-color-row .cs-color-dot').forEach((el,i)=>el.classList.toggle('on', i===0 ? v==null : CS_COLORS[i-1]===v)); }
};
window.csSetCapWords = (n) => {
  S.studio.capStyle.words = n;
  csRebuildCaptions();
  csSwapSheet(csCaptionsSheet(S.studio));
  csSyncCaption();
};
function csSyncCaption(){
  const el = document.getElementById('cs-ed-cap'); if(!el) return;
  el.setAttribute('style', csCapCss(csCapStyle()));
  CSE.capEl = el; CSE.lastCap = undefined;
  const cap = csCapAt(S.studio.playhead);
  el.classList.toggle('off', !cap);
  el.textContent = cap ? cap.text : '';
}

function csAdjustSheet(st){
  const a = st.adjust || (st.adjust = {brightness:100,contrast:100,saturation:100,warmth:0});
  const rows = [['brightness',0,200],['contrast',0,200],['saturation',0,200],['warmth',-100,100]];
  return csSheet('Adjust', rows.map(([k,mn,mx])=>`<div class="cs-adj-row">
      <div class="cs-row-lbl"><span>${k[0].toUpperCase()+k.slice(1)}</span><span data-adj-val="${k}">${a[k]}</span></div>
      <input class="cs-slider" type="range" min="${mn}" max="${mx}" value="${a[k]}" oninput="S.studio.adjust.${k}=+this.value;csApplyPreview();csUpdateSliderLabel(this,'${k}')"/>
    </div>`).join('') + `<button class="cs-ghost" onclick="csResetAdjust()">Reset all</button>`);
}
window.csUpdateSliderLabel = (input, key) => {
  const lbl = document.querySelector(`[data-adj-val="${key}"]`);
  if(lbl) lbl.textContent = input.value;
};
window.csResetAdjust = () => {
  S.studio.adjust = {brightness:100,contrast:100,saturation:100,warmth:0};
  csApplyPreview();
  csSwapSheet(csAdjustSheet(S.studio));
};

function csVoiceSheet(st){
  return csSheet('Voiceover', `
    <div class="cs-note" style="margin-bottom:16px">Hold to record a voiceover. It starts at the current playhead position.</div>
    <button class="cs-primary" id="cs-voice-btn"
      onpointerdown="csVoiceStart()" onpointerup="csVoiceStop()" onpointercancel="csVoiceStop()" onpointerleave="csVoiceStop()">
      ${CS_ICON('voice')} <span id="cs-voice-lbl">Hold to record</span>
    </button>`);
}

window.csSheetDragStart = (e) => {
  const sheet = e.currentTarget.closest('.cs-sheet'); if(!sheet) return;
  const y0 = e.clientY; let dy = 0;
  sheet.style.transition = 'none';
  const move = ev => { dy = Math.max(0, ev.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    sheet.style.transition = '';
    if(dy > 90){ sheet.style.transform = 'translateY(100%)'; setTimeout(window.csCloseSheet, 180); }
    else sheet.style.transform = '';
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};
window.csOpenSheet = (name) => {
  S.studio.sheet = name; render();
  if(window.pushBackState) window.pushBackState(() => window.csCloseSheet());
};
window.csSetQuality = (key) => {
  if(!CS_QUALITY_PRESETS[key]) return;
  S.studio.quality = key;
  S.studio.sheet = null;
  toast('Recording quality: ' + CS_QUALITY_PRESETS[key].label);
  render();
  // Re-open the camera at the new resolution if it's already running.
  if(S.studio.mode === 'camera') csOpenCamera();
};

window.csCloseSheet = () => { S.studio.sheet = null; S.studio.editText = null; render(); };

// Live preview styling (filters + adjust) — media layer only.
function csApplyPreview(){
  try {
    const st = S.studio; if(!st) return;
    const stage = document.getElementById('cs-ed-stage'); if(!stage) return;
    const filt = csFilterCss(st.filter);
    const a = st.adjust || {brightness:100,contrast:100,saturation:100,warmth:0};
    const adjFilter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) hue-rotate(${a.warmth*0.36}deg)`;
    const combined = (filt && filt !== 'none') ? `${filt} ${adjFilter}` : adjFilter;
    [CSM.a, CSM.b].forEach(v => { if(v) v.style.filter = combined; });
    csEnsureEngine();
  } catch(_){}
}
window.csApplyPreview = csApplyPreview;

// ═══════════════════════════════════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════════════════════════════════
// One stream, one recorder, one rAF ticker — all tracked so they can be torn
// down deterministically. The old build re-acquired getUserMedia on every
// render and never stopped the previous tracks, which is what made the camera
// go black after a few round-trips.
const CSCAM = { stream:null, rec:null, chunks:[], timer:null, prompter:null, startedAt:0, track:null };

window.studioInitStage = async function(){
  if(S.studio.mode !== 'camera') return;
  const vid = document.getElementById('cs-cam-live');
  if(!vid) return;
  if(CSCAM.stream && CSCAM.stream.active && vid.srcObject === CSCAM.stream) return;
  await csOpenCamera();
};

async function csOpenCamera(){
  const st = S.studio;
  csCloseCamera();
  try {
    const p = CS_DEVICE.capture;
    CSCAM.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: st.facing, width:{ideal:p.width}, height:{ideal:p.height}, frameRate:{ideal:p.fps} },
      audio: st.micOn ? { echoCancellation:true, noiseSuppression:true } : false,
    });
  } catch(err){
    console.warn('[studio] camera', err);
    toast(err && err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera unavailable');
    return;
  }
  CSCAM.track = CSCAM.stream.getVideoTracks()[0] || null;
  const vid = document.getElementById('cs-cam-live');
  if(vid){ vid.srcObject = CSCAM.stream; vid.play().catch(()=>{}); }
  csApplyZoom();
}
function csCloseCamera(){
  try { CSCAM.rec && CSCAM.rec.state !== 'inactive' && CSCAM.rec.stop(); } catch(_){}
  CSCAM.rec = null;
  if(CSCAM.stream){ CSCAM.stream.getTracks().forEach(t => { try{ t.stop(); }catch(_){} }); }
  CSCAM.stream = null; CSCAM.track = null;
  clearInterval(CSCAM.timer); CSCAM.timer = null;
  cancelAnimationFrame(CSCAM.prompter); CSCAM.prompter = null;
}
window.csExitCamera = () => {
  csCloseCamera();
  S.studio.mode = 'idle';
  S.page = 'home';
  render();
};
window.studioMic = () => {
  const st = S.studio;
  st.micOn = !st.micOn;
  if(CSCAM.stream){ CSCAM.stream.getAudioTracks().forEach(t => t.enabled = st.micOn); }
  if(st.micOn && CSCAM.stream && !CSCAM.stream.getAudioTracks().length){ csOpenCamera(); return; }
  render();
};
window.csFlip = async () => {
  const st = S.studio;
  if(st.running) return toast('Stop recording first');
  st.facing = st.facing === 'user' ? 'environment' : 'user';
  st.flash = false;
  await csOpenCamera();
  render();
};
window.csSetZoom = (z) => {
  S.studio.zoom = z;
  const v = document.getElementById('cs-cam-live');
  const st = S.studio;
  if(v) v.style.transform = `${st.mirror && st.facing==='user' ? 'scaleX(-1) ' : ''}scale(${z})`;
  document.querySelectorAll('.cs-zoom-pill button').forEach(b => b.classList.toggle('on', +b.dataset.z === z));
  csApplyZoom();
};
// Use the real hardware zoom when the device exposes it; fall back to the CSS
// transform above (which is already applied) when it doesn't.
function csApplyZoom(){
  const t = CSCAM.track; if(!t || !t.getCapabilities) return;
  try {
    const caps = t.getCapabilities();
    if(caps.zoom){
      const z = Math.min(caps.zoom.max, Math.max(caps.zoom.min, S.studio.zoom));
      t.applyConstraints({ advanced:[{ zoom:z }] });
      const v = document.getElementById('cs-cam-live');
      if(v) v.style.transform = `${S.studio.mirror && S.studio.facing==='user' ? 'scaleX(-1) ' : ''}scale(1)`;
    }
  } catch(_){}
}
window.csToggleFlash = async () => {
  const t = CSCAM.track;
  if(!t || !t.getCapabilities || !t.getCapabilities().torch) return toast('Flash not supported here');
  S.studio.flash = !S.studio.flash;
  try { await t.applyConstraints({ advanced:[{ torch: S.studio.flash }] }); } catch(_){ toast('Flash unavailable'); }
  render();
};
window.csCycleCountdown = () => { const o=[0,3,5,10]; S.studio.countdown = o[(o.indexOf(S.studio.countdown)+1)%o.length]; render(); };
window.csCycleSpeed = () => { const o=[0.5,1,1.5,2]; S.studio.speed = o[(o.indexOf(S.studio.speed)+1)%o.length]; render(); };
window.csPrompterTap = () => {
  const st = S.studio;
  if(!st.script) st.showScriptEditor = true; else st.showPrompter = !st.showPrompter;
  render();
};
window.csSaveScript = () => { const st=S.studio; st.showScriptEditor=false; st.showPrompter=!!st.script; render(); };

window.csRecord = async () => {
  const st = S.studio;
  if(st.running) return csStopRecording();
  if(!CSCAM.stream) { await csOpenCamera(); if(!CSCAM.stream) return; }
  if(st.countdown){ await csCountdown(st.countdown); if(!CSCAM.stream) return; }

  const mime = CS_DEVICE.mime;
  try {
    CSCAM.rec = new MediaRecorder(CSCAM.stream, { mimeType: mime, videoBitsPerSecond: CS_DEVICE.capture.bitrate });
  } catch(_){
    try { CSCAM.rec = new MediaRecorder(CSCAM.stream); } catch(e){ return toast('Recording not supported'); }
  }
  CSCAM.chunks = [];
  CSCAM.rec.ondataavailable = e => { if(e.data && e.data.size) CSCAM.chunks.push(e.data); };
  CSCAM.rec.onstop = () => csFinishRecording(CSCAM.rec ? CSCAM.rec.mimeType : mime);
  CSCAM.rec.start(1000);
  st.running = true; st.recStart = Date.now();
  render();
  csTickRecording();
  if(st.showPrompter && st.script) csStartPrompter();
};
function csStopRecording(){
  S.studio.running = false;
  clearInterval(CSCAM.timer); CSCAM.timer = null;
  cancelAnimationFrame(CSCAM.prompter); CSCAM.prompter = null;
  try { CSCAM.rec && CSCAM.rec.state !== 'inactive' && CSCAM.rec.stop(); } catch(_){}
}
function csTickRecording(){
  clearInterval(CSCAM.timer);
  CSCAM.timer = setInterval(() => {
    const el = document.getElementById('cs-cam-time');
    if(!el || !S.studio.running) return;
    el.textContent = _fmtTs((Date.now() - S.studio.recStart)/1000);
  }, 250);
}
function csStartPrompter(){
  const box = document.getElementById('cs-cam-prompter-inner');
  if(!box) return;
  const parent = box.parentElement;
  const dist = Math.max(0, box.scrollHeight - parent.clientHeight);
  const words = (S.studio.script||'').trim().split(/\s+/).length;
  const total = Math.max(6000, (words/2.6)*1000);        // ~160 wpm
  const t0 = performance.now();
  const step = (t) => {
    if(!S.studio.running) return;
    const p = Math.min(1, (t - t0)/total);
    box.style.transform = `translateY(${-dist*p}px)`;
    if(p < 1) CSCAM.prompter = requestAnimationFrame(step);
  };
  CSCAM.prompter = requestAnimationFrame(step);
}
function csCountdown(n){
  return new Promise(res => {
    const stage = document.getElementById('cs-cam-stage');
    if(!stage) return res();
    const el = document.createElement('div');
    el.className = 'cs-countdown';
    stage.appendChild(el);
    let left = n;
    const tick = () => {
      el.textContent = left;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      if(left-- <= 0){ clearInterval(iv); el.remove(); res(); }
    };
    tick();
    const iv = setInterval(tick, 1000);
  });
}
async function csFinishRecording(mime){
  const st = S.studio;
  const blob = new Blob(CSCAM.chunks, { type: (mime||'video/webm').split(';')[0] });
  CSCAM.chunks = [];
  if(blob.size < 1000){ toast('Clip too short'); render(); return; }
  const clip = await csMakeClip(blob, 'Take ' + (st.clips.length + 1));
  clip.speed = st.speed;
  st.clips.push(clip);
  csPushHistory();
  toast('Clip added');
  render();
}

// Build a clip record + read its true duration once (webm from MediaRecorder
// often reports Infinity until it is seeked to the end — handled here so the
// timeline never gets a NaN-width clip).
async function csMakeClip(blob, name){
  const url = csMakeUrl(blob);
  const dur = await csProbeDuration(url);
  return {
    id: csId('c'), url, blob, name,
    dur, inMs: 0, outMs: Math.round(dur*1000),
    speed: 1, volume: 100, kind: 'video',
  };
}
function csProbeDuration(url){
  return new Promise(res => {
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true;
    let done = false;
    const finish = d => { if(done) return; done = true; v.removeAttribute('src'); try{v.load();}catch(_){} res(Math.max(0.1, d||0.1)); };
    v.onloadedmetadata = () => {
      if(v.duration === Infinity || isNaN(v.duration)){
        v.currentTime = 1e6;
        v.ontimeupdate = () => { v.ontimeupdate = null; finish(v.duration); };
      } else finish(v.duration);
    };
    v.onerror = () => finish(0.1);
    setTimeout(() => finish(v.duration), 4000);
    v.src = url;
  });
}

window.csOpenUpload = () => document.getElementById('cs-upload')?.click();
window.csAddClipClick = () => document.getElementById('cs-add-clip')?.click();
window.csReplaceClick = () => document.getElementById('cs-replace-clip')?.click();
window.csHandleUpload = async (e, fromCamera) => {
  const files = [...(e.target.files||[])]; e.target.value = '';
  if(!files.length) return;
  const st = S.studio;
  for(const f of files){
    if(!/^video\//.test(f.type)){ toast('Only video files can go on the timeline'); continue; }
    st.clips.push(await csMakeClip(f, f.name.replace(/\.[^.]+$/, '').slice(0,24)));
  }
  csPushHistory();
  if(!fromCamera && !st.selectedId){ st.selectedId = st.clips[0]?.id; st.selectedType='video'; }
  render();
};
window.csHandleReplace = async (e) => {
  const f = (e.target.files||[])[0]; e.target.value='';
  const st = S.studio;
  if(!f || st.selectedType!=='video') return;
  const i = st.clips.findIndex(c=>c.id===st.selectedId); if(i<0) return;
  csPushHistory();
  const old = st.clips[i];
  const next = await csMakeClip(f, f.name.replace(/\.[^.]+$/,'').slice(0,24));
  next.id = old.id;
  csDropUrl(old.url);
  st.clips[i] = next;
  const v = csActiveVideo(); if(v) v.dataset.cid = '';
  render();
};

window.csGoToEditor = () => {
  const st = S.studio;
  if(!st.clips.length) return toast('Record or upload a clip first');
  csCloseCamera();
  st.mode = 'editor';
  st.selectedId = st.selectedId || st.clips[0].id;
  st.selectedType = 'video';
  st.playhead = 0;
  render();
  if(window.pushBackState) window.pushBackState(() => window.csConfirmExitEditor());
};
window.csConfirmExitEditor = () => {
  const st = S.studio;
  if(st.sheet) return window.csCloseSheet();
  csStopEngine();
  st.mode = 'camera';
  st.sheet = null;
  render();
  setTimeout(() => window.studioInitStage && window.studioInitStage(), 60);
};

// ═══════════════════════════════════════════════════════════════════════════
//  HISTORY (undo / redo)
// ═══════════════════════════════════════════════════════════════════════════
// Structural snapshot only: never clone Blobs or object URLs, or undo would
// resurrect revoked URLs. Clips/overlays keep their url+blob references.
function csSnapshot(){
  const st = S.studio;
  return JSON.stringify({
    clips: st.clips, overlays: st.overlays, captions: st.captions, capWords: st.capWords,
    capStyle: st.capStyle, filter: st.filter, adjust: st.adjust,
    audioTracks: st.audioTracks, volume: st.volume, clipVolume: st.clipVolume,
    selectedId: st.selectedId, selectedType: st.selectedType,
  }, (k,v) => k === 'blob' ? undefined : v);
}
window.csPushHistory = () => {
  const st = S.studio;
  st.history = st.history || []; st.future = [];
  st.history.push(csSnapshot());
  if(st.history.length > 30) st.history.shift();
  csSyncUndoButtons();
};
function csRestore(snap){
  const st = S.studio;
  const blobs = new Map();
  st.clips.forEach(c => blobs.set(c.id, c.blob));
  st.overlays.forEach(o => o.blob && blobs.set(o.id, o.blob));
  st.audioTracks.forEach(a => blobs.set(a.id, a.blob));
  const d = JSON.parse(snap);
  Object.assign(st, d);
  st.clips.forEach(c => { if(blobs.has(c.id)) c.blob = blobs.get(c.id); });
  st.overlays.forEach(o => { if(blobs.has(o.id)) o.blob = blobs.get(o.id); });
  st.audioTracks.forEach(a => { if(blobs.has(a.id)) a.blob = blobs.get(a.id); });
  st.playhead = Math.min(st.playhead, csTotalMs());
  const v = csActiveVideo(); if(v) v.dataset.cid = '';
  render();
}
window.csUndo = () => {
  const st = S.studio;
  if(!st.history || !st.history.length) return;
  st.future = st.future || [];
  st.future.push(csSnapshot());
  csRestore(st.history.pop());
};
window.csRedo = () => {
  const st = S.studio;
  if(!st.future || !st.future.length) return;
  st.history.push(csSnapshot());
  csRestore(st.future.pop());
};
function csSyncUndoButtons(){
  const st = S.studio;
  const u = document.querySelector('[data-hist="undo"]'), r = document.querySelector('[data-hist="redo"]');
  if(u) u.disabled = !(st.history||[]).length;
  if(r) r.disabled = !(st.future||[]).length;
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUDIO + VOICEOVER
// ═══════════════════════════════════════════════════════════════════════════
window.csAddAudio = async (e) => {
  const f = (e.target.files||[])[0]; e.target.value='';
  if(!f) return;
  csPushHistory();
  const url = csMakeUrl(f);
  const durMs = Math.round(await csProbeDuration(url) * 1000);
  S.studio.audioTracks.push({ id: csId('a'), url, blob:f, name: f.name.slice(0,28), durMs, startMs: 0, kind:'music' });
  render();
};
const CSVOICE = { rec:null, stream:null, chunks:[] };
window.csVoiceStart = async () => {
  if(CSVOICE.rec) return;
  try { CSVOICE.stream = await navigator.mediaDevices.getUserMedia({ audio:true }); }
  catch(_){ return toast('Microphone unavailable'); }
  CSVOICE.chunks = [];
  CSVOICE.rec = new MediaRecorder(CSVOICE.stream);
  CSVOICE.rec.ondataavailable = ev => ev.data && ev.data.size && CSVOICE.chunks.push(ev.data);
  CSVOICE.rec.onstop = async () => {
    const blob = new Blob(CSVOICE.chunks, { type:'audio/webm' });
    CSVOICE.stream.getTracks().forEach(t => t.stop());
    CSVOICE.stream = null; CSVOICE.rec = null; CSVOICE.chunks = [];
    if(blob.size < 800) return;
    const url = csMakeUrl(blob);
    csPushHistory();
    S.studio.audioTracks.push({
      id: csId('a'), url, blob, name:'Voiceover', kind:'voice',
      startMs: Math.round(S.studio.playhead), durMs: Math.round(await csProbeDuration(url)*1000),
    });
    render();
  };
  CSVOICE.rec.start();
  const l = document.getElementById('cs-voice-lbl'); if(l) l.textContent = 'Recording… release to stop';
  document.getElementById('cs-voice-btn')?.classList.add('rec');
};
window.csVoiceStop = () => {
  if(!CSVOICE.rec) return;
  try { CSVOICE.rec.stop(); } catch(_){}
  const l = document.getElementById('cs-voice-lbl'); if(l) l.textContent = 'Hold to record';
  document.getElementById('cs-voice-btn')?.classList.remove('rec');
};

// ═══════════════════════════════════════════════════════════════════════════
//  AUTO-CAPTIONS — word-level, TikTok/CapCut style
// ═══════════════════════════════════════════════════════════════════════════
// The transcriber is asked for timestamp_granularities[]=word, so every word
// carries its own start/end. Words are grouped into 1- or 2-word cues that pop
// exactly on the beat instead of the old sentence-long blocks.
window.csAutoCaption = async () => {
  const st = S.studio;
  if(st.transcribing) return;
  if(!st.clips.length) return toast('Add a clip first');
  st.transcribing = true;
  csSwapSheet(csCaptionsSheet(st));
  try {
    const words = [];
    let offset = 0;
    for(const c of st.clips){
      const dur = (c.outMs - c.inMs);
      const res = await csTranscribe(c.blob);
      (res.words||[]).forEach(w => {
        const sMs = w.start*1000, eMs = w.end*1000;
        if(eMs <= c.inMs || sMs >= c.outMs) return;              // trimmed away
        words.push({
          text: String(w.word||'').trim(),
          start: (Math.max(sMs, c.inMs) - c.inMs + offset)/1000,
          end:   (Math.min(eMs, c.outMs) - c.inMs + offset)/1000,
        });
      });
      offset += dur;
    }
    if(!words.length){ toast('No speech detected'); return; }
    csPushHistory();
    st.capWords = words.filter(w => w.text);
    csRebuildCaptions();
    st.capTab = 'style';
    toast(words.length + ' words captioned');
  } catch(err){
    console.warn('[studio] transcribe', err);
    toast(err.message || 'Could not transcribe');
  } finally {
    st.transcribing = false;
    render();
  }
};
async function csTranscribe(blob){
  const fd = new FormData();
  fd.append('file', blob, 'clip.webm');
  fd.append('granularity', 'word');
  const r = await fetch('/api/transcribe', { method:'POST', body: fd, credentials:'include' });
  if(!r.ok) throw new Error(r.status === 401 ? 'Please sign in again' : 'Transcription failed');
  return r.json();
}
// Group timed words into cues (1 or 2 words per cue).
window.csRebuildCaptions = function(){
  const st = S.studio;
  const per = csCapStyle().words === 2 ? 2 : 1;
  const out = [];
  const w = st.capWords || [];
  for(let i=0; i<w.length; i+=per){
    const grp = w.slice(i, i+per);
    out.push({ start: grp[0].start, end: grp[grp.length-1].end, text: grp.map(g=>g.text).join(' ') });
  }
  // Close micro-gaps so a word never flickers off between beats.
  for(let i=0; i<out.length-1; i++){
    if(out[i+1].start - out[i].end < 0.12) out[i].end = out[i+1].start;
  }
  st.captions = out;
  CSE.lastCap = undefined;
};

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORT — ffmpeg.wasm
// ═══════════════════════════════════════════════════════════════════════════
// Replaces the old canvas + MediaRecorder capture, which had to play the whole
// timeline back in real time while painting every frame to a canvas: on a
// mid-range Android that means an OOM tab crash on anything over ~30s.
// ffmpeg.wasm encodes offline, so the cost is CPU time, not RAM spikes.
const CS_FFMPEG_CORE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
const CS_FFMPEG_UMD  = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
const CS_FFMPEG_UTIL = 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js';
const CSFF = { inst:null, loading:null, cancel:false };

function csLoadScript(src){
  return new Promise((res, rej) => {
    if([...document.scripts].some(s => s.src === src)) return res();
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = res; s.onerror = () => rej(new Error('Failed to load encoder'));
    document.head.appendChild(s);
  });
}
async function csFFmpeg(onProgress){
  if(CSFF.inst) { CSFF.inst.on('progress', onProgress); return CSFF.inst; }
  if(CSFF.loading) { await CSFF.loading; CSFF.inst.on('progress', onProgress); return CSFF.inst; }
  CSFF.loading = (async () => {
    await csLoadScript(CS_FFMPEG_UMD);
    await csLoadScript(CS_FFMPEG_UTIL);
    const { FFmpeg } = window.FFmpegWASM || window.FFmpeg || {};
    const { toBlobURL } = window.FFmpegUtil || {};
    if(!FFmpeg || !toBlobURL) throw new Error('Encoder unavailable');
    const ff = new FFmpeg();
    await ff.load({
      coreURL: await toBlobURL(`${CS_FFMPEG_CORE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CS_FFMPEG_CORE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    CSFF.inst = ff;
  })();
  await CSFF.loading;
  CSFF.inst.on('progress', onProgress);
  return CSFF.inst;
}

window.csCancelExport = () => { CSFF.cancel = true; try { CSFF.inst && CSFF.inst.terminate(); } catch(_){} CSFF.inst = null; CSFF.loading = null; S.studio.exporting = null; render(); };

window.csExport = async () => {
  const st = S.studio;
  if(st.exporting) return;
  if(!st.clips.length) return toast('Nothing to export');
  csPause();
  CSFF.cancel = false;
  st.exporting = { pct: 0, stage: 'Loading encoder' };
  render();

  const setStage = (stage, pct) => {
    if(!st.exporting) return;
    st.exporting.stage = stage;
    if(pct != null) st.exporting.pct = Math.max(st.exporting.pct, Math.round(pct));
    const bar = document.querySelector('.cs-export-bar > i');
    const lbl = document.querySelector('[data-export-stage]');
    const pc  = document.querySelector('[data-export-pct]');
    if(bar) bar.style.width = st.exporting.pct + '%';
    if(lbl) lbl.textContent = stage;
    if(pc)  pc.textContent = st.exporting.pct + '%';
  };

  try {
    const ff = await csFFmpeg(({ progress }) => setStage(st.exporting?.stage || 'Encoding', 10 + Math.min(88, progress*88)));
    const p  = CS_DEVICE.encode;
    const written = [];
    const write = async (name, data) => { await ff.writeFile(name, data); written.push(name); };
    const fetchU8 = async (blobOrUrl) => {
      const b = blobOrUrl instanceof Blob ? blobOrUrl : await (await fetch(blobOrUrl)).blob();
      return new Uint8Array(await b.arrayBuffer());
    };

    // 1 ── segment every clip with its trim applied, normalised to one format
    setStage('Preparing clips', 4);
    const segs = [];
    for(let i=0; i<st.clips.length; i++){
      if(CSFF.cancel) return;
      const c = st.clips[i];
      await write(`in${i}`, await fetchU8(c.blob || c.url));
      const out = `seg${i}.mp4`;
      await ff.exec([
        '-ss', (c.inMs/1000).toFixed(3), '-to', (c.outMs/1000).toFixed(3), '-i', `in${i}`,
        '-vf', `scale=${p.width}:${p.height}:force_original_aspect_ratio=increase,crop=${p.width}:${p.height},fps=${p.fps},setsar=1`,
        '-c:v','libx264','-preset', p.preset, '-crf', String(p.crf), '-pix_fmt','yuv420p',
        '-c:a','aac','-ar','44100','-ac','2', '-shortest', out,
      ]);
      written.push(out);
      segs.push(out);
      setStage('Preparing clips', 4 + (i+1)/st.clips.length*6);
    }

    // 2 ── concat
    setStage('Joining clips', 12);
    let base = segs[0];
    if(segs.length > 1){
      await write('list.txt', new TextEncoder().encode(segs.map(s=>`file '${s}'`).join('\n')));
      await ff.exec(['-f','concat','-safe','0','-i','list.txt','-c','copy','joined.mp4']);
      written.push('joined.mp4');
      base = 'joined.mp4';
    }

    // 3 ── burn in filter/adjust + overlays + captions
    const filterParts = [];
    const fd = csFilterDef(st.filter);
    if(fd && fd.ff) filterParts.push(fd.ff);
    const a = st.adjust || {};
    if(a.brightness!==100 || a.contrast!==100 || a.saturation!==100){
      filterParts.push(`eq=brightness=${((a.brightness-100)/200).toFixed(3)}:contrast=${(a.contrast/100).toFixed(3)}:saturation=${(a.saturation/100).toFixed(3)}`);
    }
    if(a.warmth) filterParts.push(`colortemperature=temperature=${Math.round(6500 - a.warmth*25)}`);

    const inputs = ['-i', base];
    const chain = [];
    let vlabel = '0:v';
    if(filterParts.length){ chain.push(`[${vlabel}]${filterParts.join(',')}[vf]`); vlabel = 'vf'; }

    // image overlays
    const imgs = st.overlays.filter(o => o.type === 'image');
    for(let i=0; i<imgs.length; i++){
      const o = imgs[i];
      const name = `ov${i}.png`;
      await write(name, await fetchU8(o.blob || o.url));
      inputs.push('-i', name);
      const idx = i + 1;
      const w = Math.round(p.width * o.w/100);
      const alpha = (o.alpha==null?100:o.alpha)/100;
      chain.push(`[${idx}:v]scale=${w}:-1,format=rgba,colorchannelmixer=aa=${alpha}[img${i}]`);
      const nl = `vo${i}`;
      chain.push(`[${vlabel}][img${i}]overlay=x=(W*${(o.x/100).toFixed(4)}-w/2):y=(H*${(o.y/100).toFixed(4)}-h/2):enable='between(t,${(o.startMs/1000).toFixed(2)},${(o.endMs/1000).toFixed(2)})'[${nl}]`);
      vlabel = nl;
    }

    // text overlays + word-by-word captions via ASS (libass keeps the exact
    // styling and needs no per-frame JS)
    const ass = csBuildAss(p);
    if(ass){
      await write('subs.ass', new TextEncoder().encode(ass));
      chain.push(`[${vlabel}]subtitles=subs.ass:fontsdir=/[vsub]`);
      vlabel = 'vsub';
    }

    // 4 ── audio mix
    const tracks = st.audioTracks || [];
    const cv = (st.clipVolume==null?100:st.clipVolume)/100;
    const mv = (st.volume==null?100:st.volume)/100;
    let alabel = null;
    const aChain = [];
    const aIn = [`[0:a]volume=${cv.toFixed(2)}[a0]`];
    const mixLabels = ['a0'];
    for(let i=0; i<tracks.length; i++){
      const t = tracks[i];
      const name = `aud${i}`;
      await write(name, await fetchU8(t.blob || t.url));
      inputs.push('-i', name);
      const idx = imgs.length + 1 + i;
      const delay = Math.max(0, Math.round(t.startMs||0));
      aIn.push(`[${idx}:a]volume=${(t.kind==='voice'?1:mv).toFixed(2)},adelay=${delay}|${delay}[m${i}]`);
      mixLabels.push('m'+i);
    }
    if(mixLabels.length > 1){
      aChain.push(...aIn, `[${mixLabels.map(l=>l).join('][')}]amix=inputs=${mixLabels.length}:duration=first:dropout_transition=0,dynaudnorm[aout]`);
      alabel = 'aout';
    } else if(cv !== 1){
      aChain.push(aIn[0]); alabel = 'a0';
    }

    setStage('Encoding', 14);
    const args = [...inputs];
    const allChain = [...chain, ...aChain];
    if(allChain.length) args.push('-filter_complex', allChain.join(';'));
    args.push('-map', chain.length ? `[${vlabel}]` : '0:v');
    args.push('-map', alabel ? `[${alabel}]` : '0:a?');
    args.push('-c:v','libx264','-preset', p.preset, '-crf', String(p.crf), '-pix_fmt','yuv420p',
              '-c:a','aac','-b:a','128k','-movflags','+faststart','out.mp4');
    await ff.exec(args);
    if(CSFF.cancel) return;

    setStage('Finishing', 98);
    const data = await ff.readFile('out.mp4');
    const blob = new Blob([data.buffer], { type:'video/mp4' });

    // free the virtual FS immediately — otherwise a second export OOMs
    for(const f of written.concat(['out.mp4','subs.ass','list.txt'])) { try { await ff.deleteFile(f); } catch(_){} }

    st.exporting = null;
    st.exportUrl && csDropUrl(st.exportUrl);
    st.exportUrl = csMakeUrl(blob);
    st.exportSize = blob.size;
    st.sheet = null;
    render();
    csDownload(st.exportUrl, (st.projectName||'video').replace(/\s+/g,'-').toLowerCase() + '.mp4');
    toast('Export ready');
  } catch(err){
    console.warn('[studio] export', err);
    st.exporting = null;
    render();
    toast(err.message === 'called FFmpeg.terminate()' ? 'Export cancelled' : 'Export failed — try trimming the video shorter');
  }
};
function csDownload(url, name){
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}

// ── ASS subtitle builder: text overlays + word-by-word captions ─────────────
function csAssTime(s){
  const h = Math.floor(s/3600), m = Math.floor(s%3600/60), sec = (s%60);
  return `${h}:${String(m).padStart(2,'0')}:${sec.toFixed(2).padStart(5,'0')}`;
}
function csAssColor(hex, alpha){
  const h = (hex||'#FFFFFF').replace('#','');
  const r = h.slice(0,2), g = h.slice(2,4), b = h.slice(4,6);
  return `&H${alpha||'00'}${b}${g}${r}`.toUpperCase();
}
function csBuildAss(p){
  const st = S.studio;
  const texts = st.overlays.filter(o => o.type === 'text' && (o.text||'').trim());
  const caps  = st.captions || [];
  if(!texts.length && !caps.length) return null;
  const scale = p.height / 1280;                    // preview px → export px
  const styles = [], events = [];

  texts.forEach((o, i) => {
    const f = csFontById(o.font);
    const outline = o.style === 'outline' ? 3 : (o.style === 'shadow' ? 0 : 1);
    const border  = o.style === 'box' ? 3 : 1;      // 3 = opaque box
    styles.push(`Style: T${i},${f.ass},${Math.round(o.size*scale*1.6)},${csAssColor(o.color)},${csAssColor(o.color)},${csAssColor('#000000')},${csAssColor(o.bg||'#000000','40')},${f.weight>=700?-1:0},0,0,0,100,100,0,0,${border},${outline},${o.style==='shadow'?3:0},5,0,0,0,1`);
    const px = Math.round(p.width * o.x/100), py = Math.round(p.height * o.y/100);
    const line = String(o.text).replace(/\n/g,'\\N').replace(/[{}]/g,'');
    events.push(`Dialogue: 0,${csAssTime(o.startMs/1000)},${csAssTime(o.endMs/1000)},T${i},,0,0,0,,{\\pos(${px},${py})}${line}`);
  });

  if(caps.length){
    const cs = csCapStyle();
    const f = csFontById(cs.font);
    styles.push(`Style: CAP,${f.ass},${Math.round(cs.size*scale*1.6)},${csAssColor(cs.color)},${csAssColor(cs.color)},${csAssColor(cs.stroke||'#000000')},${csAssColor(cs.bg||'#000000', cs.bg?'20':'80')},-1,0,0,0,100,100,0,0,${cs.bg?3:1},${cs.stroke?3:1.5},${cs.shadow?2:0},5,0,0,0,1`);
    const cx = Math.round(p.width * ((cs.x==null?50:cs.x)/100));
    const cy = Math.round(p.height * ((cs.y==null?82:cs.y)/100));
    caps.forEach(c => {
      const t = (cs.upper ? c.text.toUpperCase() : c.text).replace(/[{}]/g,'');
      // tiny pop-in scale gives the CapCut "beat" feel
      events.push(`Dialogue: 1,${csAssTime(c.start)},${csAssTime(c.end)},CAP,,0,0,0,,{\\pos(${cx},${cy})\\fscx90\\fscy90\\t(0,90,\\fscx100\\fscy100)}${t}`);
    });
  }

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${p.width}
PlayResY: ${p.height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styles.join('\n')}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEARDOWN — called by core.js when the studio page unmounts
// ═══════════════════════════════════════════════════════════════════════════
window.studioTeardown = function(){
  csCloseCamera();
  csStopEngine();
  csReleaseMedia();
};
window.addEventListener('pagehide', () => { try { window.studioTeardown(); } catch(_){} });
document.addEventListener('visibilitychange', () => { if(document.hidden && S.studio && S.studio.playing) csPause(); });
