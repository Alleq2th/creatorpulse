// ─── CREATE STUDIO ─────────────────────────────────────────────────────────
// Teleprompter + camera + auto-captions + trim + export.
//
// v2 rewrite notes (see CHANGELOG at the bottom of this file):
//  • Export pipeline rebuilt around ONE reusable <video> element, one
//    AudioContext, frame-gated canvas capture and chunked MediaRecorder output.
//  • Preview playback rebuilt around a single rAF engine + double-buffered
//    video elements, so scrubbing and clip changes never call render().
//  • Captions have real style presets, shared by preview AND export.
//  • Text overlays support pinch + handle resize.
// ---------------------------------------------------------------------------

// Font, filter, color, style presets for the CapCut-style editor
const CS_FONTS = [
  {id:"classic",  name:"Classic",         css:'"Inter", sans-serif',           weight:800},
  {id:"classic-m",name:"Classic Medium",  css:'"Inter", sans-serif',           weight:600},
  {id:"classic-l",name:"Classic Light",   css:'"Inter", sans-serif',           weight:400},
  {id:"modern",   name:"Modern",          css:'"Archivo Black", sans-serif',   weight:900},
  {id:"modern-b", name:"Modern Bold",     css:'"Bebas Neue", sans-serif',      weight:400},
  {id:"anton",    name:"Anton",           css:'"Anton", sans-serif',           weight:400},
  {id:"oswald",   name:"Oswald",          css:'"Oswald", sans-serif',          weight:700},
  {id:"signature",name:"Signature",       css:'"Dancing Script", cursive',     weight:700},
  {id:"caveat",   name:"Handwritten",     css:'"Caveat", cursive',             weight:700},
  {id:"marker",   name:"Marker",          css:'"Permanent Marker", cursive',   weight:400},
  {id:"pacifico", name:"Script",          css:'"Pacifico", cursive',           weight:400},
  {id:"lobster",  name:"Lobster",         css:'"Lobster", cursive',            weight:400},
  {id:"editor",   name:"Editor",          css:'"Special Elite", monospace',    weight:400},
  {id:"poster",   name:"Poster",          css:'"Abril Fatface", serif',        weight:400},
  {id:"playfair", name:"Elegant",         css:'"Playfair Display", serif',     weight:900},
  {id:"zilla",    name:"Zilla",           css:'"Zilla Slab", serif',           weight:700},
  {id:"bungee",   name:"Bungee",          css:'"Bungee", sans-serif',          weight:400},
  {id:"righteous",name:"Righteous",       css:'"Righteous", sans-serif',       weight:400},
  {id:"pixel",    name:"Pixel",           css:'"Press Start 2P", monospace',   weight:400},
];
const CS_STYLES = [
  {id:"none",     name:"None"},
  {id:"outline",  name:"Outline"},
  {id:"rev-outline", name:"Rev Outline"},
  {id:"bg",       name:"Background"},
  {id:"rev-bg",   name:"Rev Background"},
  {id:"shadow",   name:"Shadow"},
];
const CS_COLORS = ["#FFFFFF","#000000","#F5C518","#EF3355","#EC4899","#7C3AED","#3B82F6","#10B981","#F97316","#EAB308","#22D3EE","#F472B6"];
const CS_FILTERS = [
  {id:"none", name:"None",       filter:"none"},
  {id:"vivid",name:"Vivid",      filter:"saturate(1.4) contrast(1.15)"},
  {id:"warm", name:"Warm",       filter:"sepia(.2) saturate(1.2) hue-rotate(-8deg)"},
  {id:"cool", name:"Cool",       filter:"saturate(1.1) hue-rotate(12deg) brightness(1.05)"},
  {id:"mono", name:"Mono",       filter:"grayscale(1) contrast(1.1)"},
  {id:"noir", name:"Noir",       filter:"grayscale(1) contrast(1.5) brightness(.9)"},
  {id:"film", name:"Film",       filter:"sepia(.35) contrast(1.15) saturate(.9)"},
  {id:"dream",name:"Dream",      filter:"blur(.4px) saturate(1.3) brightness(1.08)"},
  {id:"punch",name:"Punch",      filter:"saturate(1.6) contrast(1.25) brightness(1.02)"},
];

// ─── CAPTION STYLE PRESETS ─────────────────────────────────────────────────
// One source of truth. csCapCss() renders them in the live preview, and
// csDrawCaption() renders the *same* fields onto the export canvas, so what
// you see while editing is exactly what gets burned in.
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

// Resolve the effective caption style: preset + user overrides (color/size/pos).
function csCapStyle(){
  const st = S.studio;
  const cs = st.capStyle || (st.capStyle = { preset:"classic", x:50, y:82, size:34, color:null });
  if(cs.preset == null) cs.preset = "classic";      // migrate old saved state
  const p = csCapPreset(cs.preset);
  const f = csFontById(p.font);
  return {
    x: cs.x==null?50:cs.x,
    y: cs.y==null?82:cs.y,
    size: cs.size||34,
    color: cs.color || p.color,
    bg: p.bg, box: p.box, stroke: p.stroke, shadow: p.shadow,
    upper: p.upper, radius: p.radius,
    fontCss: f.css, fontWeight: f.weight, preset: p.id,
  };
}
// CSS for the DOM preview — mirrors csDrawCaption() 1:1.
function csCapCss(s){
  let out = `left:${s.x}%;top:${s.y}%;font-size:${s.size}px;color:${s.color};`
          + `font-family:${s.fontCss};font-weight:${s.fontWeight};`
          + `text-transform:${s.upper?'uppercase':'none'};`
          + `border-radius:${s.radius}em;`;
  out += s.bg && s.box!=='none'
    ? `background:${s.bg};padding:${s.box==='tight'?'.16em .42em':'.28em .5em'};`
    : `background:transparent;padding:.1em .2em;`;
  if(s.stroke) out += `-webkit-text-stroke:${Math.max(1,Math.round(s.size*0.06))}px ${s.stroke};paint-order:stroke fill;`;
  if(s.shadow) out += `text-shadow:0 ${Math.round(s.size*0.06)}px ${Math.round(s.size*0.28)}px rgba(0,0,0,.75);`;
  return out;
}

function CS_ICON(name){
  const p = {
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    voice:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 18v4"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    cc:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M8 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2M16 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2"/>',
    adjust:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    split:'<path d="M12 3v6m0 6v6M8 12l-5 5M8 12l-5-5M16 12l5 5M16 12l5-5"/>',
    effects:'<path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2"/>',
    trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    dup:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    mask:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
    opacity:'<path d="M12 3l7 12a7 7 0 1 1-14 0z"/>',
    replace:'<path d="M4 12a8 8 0 0 1 14-5m2 0v5h-5M20 12a8 8 0 0 1-14 5m-2 0v-5h5"/>',
    play:'<path d="M6 4v16l14-8z" fill="currentColor"/>',
    pause:'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>',
    redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    flash:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    flip:'<path d="M4 8a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 16a8 8 0 0 1-14 3l-2-2M4 20v-4h4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    layers:'<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    timer:'<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2M9 2h6"/>',
    sparkle:'<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    volume:'<path d="M11 5 6 9H2v6h4l5 4zM15 9a5 5 0 0 1 0 6M19 5a10 10 0 0 1 0 14"/>',
    resize:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p[name]||""}</svg>`;
}

// ─── DEVICE CAPABILITY PROFILE ─────────────────────────────────────────────
// Mid-range Android is the target. Encoding 1080x1920 @6 Mbps while
// simultaneously decoding a clip is what was killing tabs, so the export
// resolution and bitrate are now chosen from the device, not hardcoded.
const CS_DEVICE = (() => {
  const cores = navigator.hardwareConcurrency || 4;
  const mem   = navigator.deviceMemory || 4;          // GiB, Chrome/Android only
  const tier  = (cores >= 8 && mem >= 6) ? "high" : (cores >= 4 && mem >= 3) ? "mid" : "low";
  const prof = {
    high: { W:1080, H:1920, fps:30, bitrate:5_000_000, label:"1080p" },
    mid:  { W: 720, H:1280, fps:30, bitrate:3_000_000, label:"720p"  },
    low:  { W: 540, H: 960, fps:24, bitrate:1_800_000, label:"540p"  },
  }[tier];
  return { tier, cores, mem, ...prof };
})();

// ─── CAPCUT-STYLE CREATE STUDIO ────────────────────────────────────────────
function pageCreate(){
  const st = S.studio || (S.studio = {
    mode:"chooser", // chooser | camera | editor
    projectName:"New project",
    script:"", promptSpeed:60, mirror:true, running:false, showPrompter:false, showScriptEditor:false,
    camReady:false, facing:"user", micOn:true, flash:false, zoom:1, speed:1, countdown:0,
    clips:[], selectedId:null, selectedType:null, // type: video|text|caption|audio
    overlays:[], // text overlays {id,text,font,style,color,size,x,y,startMs,endMs}
    captions:[], audioTracks:[], filter:"none",
    capStyle:{ preset:"classic", x:50, y:82, size:34, color:null },
    playhead:0, playing:false, totalMs:0, exporting:false, exportPct:0,
    sheet:null, // 'text' | 'filter' | 'audio' | 'adjust' | 'captions' | 'voice'
    editText:null, editTextTab:"font", capTab:"style",
    history:[], future:[],
  });

  if(st.mode === "editor")  return edView(st);
  // Skip the chooser — Create tab lands straight in the camera + teleprompter view.
  if(st.mode !== "camera"){
    st.mode = "camera";
    setTimeout(async () => {
      try { await window.studioInitStage(); } catch(_){}
      const v = document.getElementById("cs-cam-live");
      if(v && window._st?.stream){ v.srcObject = window._st.stream; v.play().catch(()=>{}); }
    }, 60);
  }
  return camView(st);
}

function chooserView(st){
  return `<main class="page active">${topBar("Studio")}
    <div class="sec-h"><h2>Create</h2><span class="sec-meta">Record · Edit · Export</span></div>
    <div class="cs-choose-grid">
      <button class="cs-choose-card" onclick="csOpenCamera()">
        <div class="cs-ic">${CS_ICON('voice')}</div>
        <div class="n">Record</div>
        <div class="d">Camera + teleprompter, zoom, flash, speed.</div>
      </button>
      <button class="cs-choose-card" onclick="csOpenUpload()">
        <div class="cs-ic">${CS_ICON('upload')}</div>
        <div class="n">Upload</div>
        <div class="d">Import clips from gallery.</div>
        <input type="file" id="cs-upload" accept="video/*,image/*" multiple style="display:none" onchange="csHandleUpload(event)"/>
      </button>
      <button class="cs-choose-card" onclick="csScriptOnly()">
        <div class="cs-ic">${CS_ICON('text')}</div>
        <div class="n">Script</div>
        <div class="d">Write, then record with the prompter.</div>
      </button>
      <button class="cs-choose-card" onclick="csResumeProject()">
        <div class="cs-ic">${CS_ICON('layers')}</div>
        <div class="n">${st.clips.length?'Continue project':'Templates'}</div>
        <div class="d">${st.clips.length?st.clips.length+' clip'+(st.clips.length===1?'':'s')+' in timeline':'Ready-made formats.'}</div>
      </button>
    </div>
    ${st.script ? `<div class="card" style="margin-top:16px"><div class="card-h">Teleprompter script</div>
      <div class="field"><textarea class="input" rows="4" placeholder="Type or paste your script." oninput="S.studio.script=this.value">${esc(st.script)}</textarea></div>
    </div>` : `<div class="card" style="margin-top:16px">
      <div class="card-h">Teleprompter script <span style="color:var(--mu);font-weight:500;font-size:11px">(optional)</span></div>
      <div class="field"><textarea class="input" rows="3" placeholder="Type here — it'll scroll over the camera when you record." oninput="S.studio.script=this.value">${esc(st.script)}</textarea></div>
    </div>`}
  </main>`;
}

function camView(st){
  const rec = !!st.running;
  return `<div class="cs-fs">
    <div class="cs-topbar">
      <div class="l">
        <button class="cs-x" onclick="csExitCamera()">${CS_ICON('close')}</button>
        <div class="cs-title">${esc(st.projectName)} <span class="chev">▼</span></div>
      </div>
      <div class="r">
        <span class="cs-badge">HD</span>
        <button class="cs-next" ${st.clips.length?'':'disabled'} onclick="csGoToEditor()">Next ›</button>
      </div>
    </div>
    <div class="cs-cam-stage ${rec?'is-rec':''}" id="cs-cam-stage">
      <video id="cs-cam-live" playsinline muted autoplay style="transform:${st.mirror&&st.facing==='user'?'scaleX(-1) ':''}scale(${st.zoom});transform-origin:center center;transition:transform .15s ease"></video>
      ${st.showPrompter && st.script ? `<div class="cs-cam-prompter"><div class="cs-cam-prompter-inner" id="cs-cam-prompter-inner">${esc(st.script)}</div></div>` : ''}
      ${rec ? `<div class="cs-cam-time"><span class="dot"></span><span id="cs-cam-time">0:00</span></div>` : ''}
      <div class="cs-cam-zoom">
        ${[1,1.5,2,3].map(z=>`<button class="${st.zoom===z?'on':''}" onclick="csSetZoom(${z})">${z}×</button>`).join('')}
      </div>
      <div class="cs-cam-side">
        <button class="cs-side-btn ${st.showPrompter?'on':''}" onclick="csPrompterTap()">${CS_ICON('text')}<span class="lbl">Prompter</span></button>
        <button class="cs-side-btn" onclick="csCycleCountdown()">${CS_ICON('timer')}<span class="lbl">${st.countdown?st.countdown+'s':'Off'}</span></button>
        <button class="cs-side-btn ${st.speed!==1?'on':''}" onclick="csCycleSpeed()">${CS_ICON('sparkle')}<span class="lbl">${st.speed}×</span></button>
        <button class="cs-side-btn" onclick="csOpenMusic()">${CS_ICON('music')}<span class="lbl">Music</span></button>
        <button class="cs-side-btn ${st.micOn?'':'on'}" onclick="studioMic()">${CS_ICON('voice')}<span class="lbl">${st.micOn?'Mic on':'Muted'}</span></button>
      </div>
      ${st.showScriptEditor ? `<div class="cs-sheet" style="position:absolute">
        <div class="cs-sheet-grip"></div>
        <div class="cs-sheet-h"><h4>Teleprompter script</h4><button class="done" onclick="csSaveScript()">Use script</button></div>
        <div class="field"><textarea class="input" rows="6" autofocus placeholder="Type or paste your script — it'll scroll over the camera while you record." oninput="S.studio.script=this.value">${esc(st.script)}</textarea></div>
      </div>` : ''}
    </div>
    <div class="cs-cam-bot">
      <div class="side">
        <button class="ic ${st.flash?'on':''}" onclick="csToggleFlash()">${CS_ICON('flash')}</button>
        <span>${st.flash?'Flash':'Flash'}</span>
      </div>
      <button class="cs-rec ${rec?'rec':''}" onclick="csRecord()"><div class="cs-rec-inner"></div></button>
      <div class="side">
        <button class="ic" onclick="csFlip()">${CS_ICON('flip')}</button>
        <span>Flip</span>
      </div>
    </div>
  </div>`;
}

// ─── EDITOR VIEW ───────────────────────────────────────────────────────────
// All overlays/captions are rendered ONCE (not filtered by playhead). The rAF
// engine toggles a .off class per frame — no DOM churn during playback.
function edView(st){
  const total = csTotalMs();
  const px = CS_PX;
  const cap = csCapStyle();
  const activeTool = st.sheet || null;
  return `<div class="cs-fs">
    <div class="cs-topbar">
      <div class="l">
        <button class="cs-x" onclick="csConfirmExitEditor()">${CS_ICON('close')}</button>
        <div class="cs-title">${esc(st.projectName)} <span class="chev">▼</span></div>
      </div>
      <div class="r">
        <span class="cs-badge">${CS_DEVICE.label}</span>
        <button class="cs-next" ${st.clips.length&&!st.exporting?'':'disabled'} onclick="csExport()">${st.exporting?'Exporting…':'Export ›'}</button>
      </div>
    </div>

    <div class="cs-ed-stage" id="cs-ed-stage">
      <video id="cs-ed-video"   class="cs-ed-vid on" playsinline preload="auto" webkit-playsinline></video>
      <video id="cs-ed-video-b" class="cs-ed-vid"    playsinline preload="auto" webkit-playsinline muted></video>

      <div class="cs-ed-layer" id="cs-ed-layer">
        ${st.overlays.map(o=>{
          const f = csFontById(o.font);
          const on = st.playhead>=o.startMs && st.playhead<=o.endMs;
          const sel = st.selectedId===o.id && st.selectedType==='text';
          return `<div class="cs-ed-overlay ${sel?'sel':''} ${on?'':'off'}"
            data-ovid="${o.id}" data-start="${o.startMs}" data-end="${o.endMs}"
            style="left:${o.x}%;top:${o.y}%;font-family:${f.css};font-weight:${f.weight};font-size:${o.size}px;color:${o.color};${csStyleCss(o.style,o.color,o.bg)}"
            onpointerdown="csOverlayPointerDown(event,'${o.id}')"><span class="ov-txt">${esc(o.text)}</span>${sel?`<button class="ov-del" onpointerdown="event.stopPropagation()" onclick="event.stopPropagation();csDeleteOverlay('${o.id}')">×</button><span class="ov-size" onpointerdown="csOverlayResizeStart(event,'${o.id}')">${CS_ICON('resize')}</span>`:''}</div>`;
        }).join('')}

        <div class="cs-ed-cap ${st.selectedType==='caption'?'sel':''} ${csCapAt(st.playhead)?'':'off'}"
          id="cs-ed-cap" style="${csCapCss(cap)}"
          onpointerdown="csCaptionPointerDown(event)">${esc(csCapAt(st.playhead)?.text||'')}</div>
      </div>

      <button class="cs-ed-play" onclick="csTogglePlay()">${CS_ICON(st.playing?'pause':'play')}</button>
      <div class="cs-ed-time"><span class="cur">${_fmtTs(st.playhead/1000)}</span><span class="tot"> / ${_fmtTs(total/1000)}</span></div>
      <div class="cs-ed-undo">
        <button onclick="csUndo()" ${st.history&&st.history.length?'':'disabled'}>${CS_ICON('undo')}</button>
        <button onclick="csRedo()" ${st.future&&st.future.length?'':'disabled'}>${CS_ICON('redo')}</button>
      </div>
      ${st.exporting ? `<div class="cs-export-veil">
        <div class="cs-export-ring"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="16"/><circle class="fg" id="cs-exp-arc" cx="18" cy="18" r="16" stroke-dasharray="100.5" stroke-dashoffset="${100.5*(1-(st.exportPct||0)/100)}"/></svg><span id="cs-exp-pct">${Math.round(st.exportPct||0)}%</span></div>
        <div class="cs-export-note">Rendering ${CS_DEVICE.label} · keep this screen open</div>
        <button class="cs-export-cancel" onclick="csCancelExport()">Cancel</button>
      </div>`:''}
    </div>

    <div class="cs-ed-tracks" id="cs-ed-tracks" onpointerdown="csScrubStart(event)">
      <div class="cs-playhead" id="cs-playhead" style="transform:translateX(${88+st.playhead*px}px)"></div>
      ${csRenderTrack('video',st,px)}
      ${csRenderTrack('text',st,px)}
      ${csRenderTrack('caption',st,px)}
      ${csRenderTrack('audio',st,px)}
    </div>

    <div class="cs-ed-toolbar">
      <div class="cs-tb-scroll">
        <div class="cs-tb-row ${st.selectedId?'':'is-hidden'}">
          <button class="cs-tb" onclick="csSplit()">${CS_ICON('split')}<span>Split</span></button>
          <button class="cs-tb" onclick="csDuplicate()">${CS_ICON('dup')}<span>Duplicate</span></button>
          <button class="cs-tb" onclick="csCopy()">${CS_ICON('copy')}<span>Copy</span></button>
          <button class="cs-tb" onclick="csOpenSheet('opacity')">${CS_ICON('opacity')}<span>Opacity</span></button>
          <button class="cs-tb" onclick="csOpenSheet('mask')">${CS_ICON('mask')}<span>Mask</span></button>
          <button class="cs-tb" onclick="csReplaceClick()">${CS_ICON('replace')}<span>Replace</span></button>
          <button class="cs-tb danger" onclick="csDeleteSelected()">${CS_ICON('trash')}<span>Delete</span></button>
        </div>
        <div class="cs-tb-row">
          <button class="cs-tb ${activeTool==='audio'?'active':''}" onclick="csOpenSheet('audio')">${CS_ICON('music')}<span>Audio</span></button>
          <button class="cs-tb" onclick="csAddText()">${CS_ICON('text')}<span>Text</span></button>
          <button class="cs-tb ${activeTool==='voice'?'active':''}" onclick="csOpenSheet('voice')">${CS_ICON('voice')}<span>Voice</span></button>
          <button class="cs-tb ${activeTool==='captions'?'active':''}" onclick="csOpenSheet('captions')">${CS_ICON('cc')}<span>Captions</span></button>
          <button class="cs-tb ${activeTool==='filter'?'active':''}" onclick="csOpenSheet('filter')">${CS_ICON('filter')}<span>Filters</span></button>
          <button class="cs-tb ${activeTool==='adjust'?'active':''}" onclick="csOpenSheet('adjust')">${CS_ICON('adjust')}<span>Adjust</span></button>
          <button class="cs-tb ${activeTool==='effects'?'active':''}" onclick="csOpenSheet('effects')">${CS_ICON('effects')}<span>Effects</span></button>
          <button class="cs-tb" onclick="csAddClipClick()">${CS_ICON('plus')}<span>Add clip</span></button>
        </div>
      </div>
    </div>

    ${st.sheet ? `<div class="cs-scrim" onclick="csCloseSheet()"></div>` : ''}
    ${csRenderSheet(st)}
    <input type="file" id="cs-add-clip" accept="video/*,image/*" multiple style="display:none" onchange="csHandleUpload(event, true)"/>
    <input type="file" id="cs-replace-clip" accept="video/*,image/*" style="display:none" onchange="csHandleReplace(event)"/>
  </div>`;
}

const CS_PX = 0.06; // px per ms (60px per second)

function csFontById(id){ return CS_FONTS.find(f=>f.id===id) || CS_FONTS[0]; }
function csFilterCss(id){ return (CS_FILTERS.find(f=>f.id===id)||CS_FILTERS[0]).filter; }
function csStyleCss(style,color,bg){
  bg = bg || "#000";
  if(style==="outline")     return `-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:none;`;
  if(style==="rev-outline") return `color:#000 !important;-webkit-text-stroke:2px ${color};paint-order:stroke fill;`;
  if(style==="bg")          return `background:${bg};padding:6px 12px;border-radius:6px;`;
  if(style==="rev-bg")      return `background:${color};color:${bg} !important;padding:6px 12px;border-radius:6px;`;
  if(style==="shadow")      return `text-shadow:2px 4px 8px rgba(0,0,0,.7);`;
  return ``;
}
function csCapAt(ms){
  const caps = (S.studio.captions||[]);
  for(const c of caps){
    const s=(c.start||0)*1000, e=(c.end!=null?c.end:(c.start||0)+2)*1000;
    if(ms>=s && ms<=e) return c;
  }
  return null;
}

function csTotalMs(){
  const st = S.studio;
  let vid = st.clips.reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs)), 0);
  const ovEnd = st.overlays.reduce((n,o)=>Math.max(n,o.endMs), 0);
  return Math.max(vid, ovEnd, 1000);
}
// Global start time (ms on the timeline) of a clip.
function csClipStart(id){
  const st=S.studio; let acc=0;
  for(const c of st.clips){ if(c.id===id) return acc; acc += (c.outMs-c.inMs); }
  return 0;
}

function csRenderTrack(kind, st, px){
  if(kind==='video'){
    if(!st.clips.length){
      return `<div class="cs-track"><div class="cs-track-lbl">Video</div><div class="cs-track-empty">No clips</div></div>`;
    }
    const chunks = st.clips.map((c,i) => {
      const dur = Math.max(120, c.outMs - c.inMs);
      const w = Math.max(44, dur*px);
      return `<div class="cs-track-clip cs-track-video ${st.selectedId===c.id&&st.selectedType==='video'?'sel':''}" style="width:${w}px" onclick="csSelect('${c.id}','video')"><span>${c.kind==='image'?'Photo':'Clip'} ${i+1}</span></div>`;
    }).join('');
    return `<div class="cs-track"><div class="cs-track-lbl">Video</div>${chunks}<button class="cs-track-add" onclick="csAddClipClick()">+</button></div>`;
  }
  if(kind==='text'){
    const items = st.overlays.map(o=>{
      const w = Math.max(44, (o.endMs-o.startMs)*px);
      const x = 88 + o.startMs*px;
      return `<div class="cs-track-clip cs-track-text ${st.selectedId===o.id&&st.selectedType==='text'?'sel':''}" style="position:absolute;left:${x}px;width:${w}px" onclick="csSelect('${o.id}','text')"><span>${esc(o.text.slice(0,20))}</span></div>`;
    }).join('');
    return `<div class="cs-track abs"><div class="cs-track-lbl">Text</div>${items||'<div class="cs-track-empty">Tap Text to add</div>'}</div>`;
  }
  if(kind==='caption'){
    const items = (st.captions||[]).map(c=>{
      const w = Math.max(44, ((c.end||c.start+2)-c.start)*1000*px);
      const x = 88 + c.start*1000*px;
      return `<div class="cs-track-clip cs-track-caption" style="position:absolute;left:${x}px;width:${w}px" onclick="csOpenSheet('captions')"><span>${esc((c.text||'').slice(0,16))}</span></div>`;
    }).join('');
    return `<div class="cs-track abs"><div class="cs-track-lbl">Captions</div>${items||'<div class="cs-track-empty">Auto-caption available</div>'}</div>`;
  }
  if(kind==='audio'){
    const items = (st.audioTracks||[]).map(a=>{
      const w = Math.max(44, (a.durMs||10000)*px);
      const x = 88 + (a.startMs||0)*px;
      return `<div class="cs-track-clip cs-track-audio" style="position:absolute;left:${x}px;width:${w}px" onclick="csOpenSheet('audio')"><span>${esc(a.name||'Track')}</span></div>`;
    }).join('');
    return `<div class="cs-track abs"><div class="cs-track-lbl">Audio</div>${items||'<div class="cs-track-empty">Add music</div>'}</div>`;
  }
  return '';
}


// ── Live preview helpers (no re-render → no video reload flicker) ───────────
function csApplyPreview(){
  try {
    const st = S.studio; if(!st) return;
    const stage = document.getElementById('cs-ed-stage');
    if(!stage) return;
    const filt = csFilterCss(st.filter);
    const a = st.adjust || {brightness:100,contrast:100,saturation:100,warmth:0};
    const adjFilter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) hue-rotate(${a.warmth*0.36}deg)`;
    const combined = (filt && filt !== 'none') ? `${filt} ${adjFilter}` : adjFilter;
    // Filter only the media layer, never the whole stage: filtering the stage
    // forced the browser to re-composite the text/caption DOM every frame.
    stage.querySelectorAll('.cs-ed-vid').forEach(v => {
      v.style.filter = combined;
      v.style.opacity = ((st.opacity==null?100:st.opacity)/100);
    });
    stage.classList.remove('fx-glitch','fx-shake','fx-vignette','fx-grain','fx-vhs','fx-chroma','fx-flash','fx-zoom');
    if(st.effect && st.effect !== 'none') stage.classList.add('fx-'+st.effect);
    csEnsureEngine();
  } catch(_){}
}
function csUpdateSliderLabel(input, key){
  const lbl = document.querySelector(`[data-adj-val="${key}"]`);
  if(lbl) lbl.textContent = input.value;
}
window.csPickFilter = (id, btn) => {
  S.studio.filter = id;
  const grid = btn && btn.parentElement;
  if(grid){ grid.querySelectorAll('.cs-filter-cell').forEach(el => el.classList.toggle('on', el.getAttribute('data-fid')===id)); }
  csApplyPreview();
};
window.csPickEffect = (id, btn) => {
  S.studio.effect = id;
  const grid = btn && btn.parentElement;
  if(grid){ grid.querySelectorAll('.cs-fx-cell').forEach(el => el.classList.toggle('on', el.getAttribute('data-fxid')===id)); }
  csApplyPreview();
};

// Effects preset sheet (CSS-only, GPU-cheap)
const CS_EFFECTS = [
  {id:'none',     name:'None'},
  {id:'glitch',   name:'Glitch'},
  {id:'shake',    name:'Shake'},
  {id:'vignette', name:'Vignette'},
  {id:'grain',    name:'Grain'},
  {id:'vhs',      name:'VHS'},
  {id:'chroma',   name:'Chromatic'},
  {id:'flash',    name:'Flash'},
  {id:'zoom',     name:'Slow zoom'},
];
function csEffectsSheet(st){
  const cur = st.effect || 'none';
  return csSheet('Effects', `
    <div class="cs-filter-grid">
      ${CS_EFFECTS.map(f=>`<button class="cs-filter-cell cs-fx-cell ${cur===f.id?'on':''}" data-fxid="${f.id}" onclick="csPickEffect('${f.id}',this)">
        <div class="ph fx-preview fx-preview-${f.id}"></div><div class="n">${f.name}</div>
      </button>`).join('')}
    </div>
    <div class="cs-note">Effects are burned into the export.</div>`);
}

// Shared sheet chrome → identical padding/height behaviour for every tool,
// which is what removes the layout jump when switching tools.
function csSheet(title, body, opts){
  opts = opts || {};
  return `<div class="cs-sheet ${opts.tall?'tall':''}" onclick="event.stopPropagation()">
    <div class="cs-sheet-grip" onpointerdown="csSheetDragStart(event)"></div>
    <div class="cs-sheet-h"><h4>${esc(title)}</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div class="cs-sheet-body">${body}</div>
  </div>`;
}

function csRenderSheet(st){
  if(!st.sheet) return '';
  if(st.sheet==='text' && st.editText) return csTextSheet(st);
  if(st.sheet==='filter') return csFilterSheet(st);
  if(st.sheet==='audio') return csAudioSheet(st);
  if(st.sheet==='captions') return csCaptionsSheet(st);
  if(st.sheet==='adjust') return csAdjustSheet(st);
  if(st.sheet==='voice') return csVoiceSheet(st);
  if(st.sheet==='opacity') return csOpacitySheet(st);
  if(st.sheet==='mask') return csSheet('Mask','<div class="cs-note">Mask presets — coming soon.</div>');
  if(st.sheet==='effects') return csEffectsSheet(st);
  if(st.sheet==='sticker') return csSheet('Stickers','<div class="cs-note">Sticker pack — coming soon.</div>');
  return '';
}

function csTextSheet(st){
  const o = st.editText;
  const tab = st.editTextTab;
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
      <input class="cs-slider" type="range" min="14" max="140" value="${o.size}" oninput="csLiveOverlaySize(+this.value)"/>
      <div class="cs-row-lbl" style="margin-top:14px"><span>Duration on screen</span><span data-ov-dur>${((o.endMs-o.startMs)/1000).toFixed(1)}s</span></div>
      <input class="cs-slider" type="range" min="500" max="${Math.max(1500,csTotalMs())}" value="${o.endMs-o.startMs}" oninput="csEditOverlayDuration(+this.value)"/>
      <div class="cs-note">Tip: drag the text on the preview to move it, pinch or drag the ⤢ corner to resize.</div>
    </div>` : ''}
    </div>`;
  return csSheet('Text', body, {tall:true});
}
window.csSetTextTab = (t) => {
  S.studio.editTextTab = t;
  // Re-render only the sheet, not the whole editor (keeps the video alive).
  const sheet = document.querySelector('.cs-sheet');
  if(sheet){ sheet.outerHTML = csTextSheet(S.studio); } else render();
};

function csFilterSheet(st){
  return csSheet('Filters', `
    <div class="cs-filter-grid">
      ${CS_FILTERS.map(f=>`<button class="cs-filter-cell ${st.filter===f.id?'on':''}" data-fid="${f.id}" onclick="csPickFilter('${f.id}',this)">
        <div class="ph" style="filter:${f.filter}"></div><div class="n">${f.name}</div>
      </button>`).join('')}
    </div>`);
}

function csAudioSheet(st){
  return csSheet('Audio', `
    <label class="cs-upload-btn">${CS_ICON('upload')} Upload audio file
      <input type="file" accept="audio/*" style="display:none" onchange="csAddAudio(event)"/>
    </label>
    <div class="cs-row-lbl" style="margin-top:16px"><span>Music volume</span><span id="cs-vol-val">${(st.volume||100)}%</span></div>
    <input class="cs-slider" type="range" min="0" max="200" value="${(st.volume||100)}" oninput="S.studio.volume=+this.value;document.getElementById('cs-vol-val').textContent=this.value+'%'"/>
    <div class="cs-row-lbl" style="margin-top:14px"><span>Original clip volume</span><span id="cs-cvol-val">${(st.clipVolume==null?100:st.clipVolume)}%</span></div>
    <input class="cs-slider" type="range" min="0" max="150" value="${(st.clipVolume==null?100:st.clipVolume)}" oninput="csSetClipVolume(+this.value)"/>
    <div class="cs-note">${(st.audioTracks||[]).length} track${(st.audioTracks||[]).length===1?'':'s'} added.</div>`);
}
window.csSetClipVolume = (v) => {
  S.studio.clipVolume = v;
  const l = document.getElementById('cs-cvol-val'); if(l) l.textContent = v+'%';
  document.querySelectorAll('.cs-ed-vid').forEach(el => { el.volume = Math.min(1, v/100); });
};

// ── Captions sheet: now with real style presets ────────────────────────────
function csCaptionsSheet(st){
  const tab = st.capTab || 'style';
  const cs = st.capStyle;
  const eff = csCapStyle();
  const body = `
    <button class="cs-primary" ${st.transcribing?'disabled':''} onclick="csAutoCaption()">
      ${CS_ICON('sparkle')} ${st.transcribing?'Transcribing…':'Auto-generate captions'}
    </button>
    <div class="cs-sheet-tabs" style="margin-top:14px">
      ${[['style','Style'],['color','Color'],['size','Size & position'],['list','Lines']].map(([t,l])=>`<button class="${tab===t?'on':''}" onclick="csSetCapTab('${t}')">${l}</button>`).join('')}
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
    ${tab==='color' ? `<div class="cs-color-row">
      <button class="cs-color-dot ${!cs.color?'on':''}" style="background:conic-gradient(#F5C518,#EC4899,#22D3EE,#F5C518)" onclick="csSetCapField('color',null)"></button>
      ${CS_COLORS.map(c=>`<button class="cs-color-dot ${cs.color===c?'on':''}" style="background:${c}" onclick="csSetCapField('color','${c}')"></button>`).join('')}
    </div><div class="cs-note">First swatch = the preset's own colour.</div>` : ''}
    ${tab==='size' ? `<div class="cs-pad">
      <div class="cs-row-lbl"><span>Size</span><span id="cs-cap-size-v">${eff.size}px</span></div>
      <input class="cs-slider" type="range" min="18" max="90" value="${eff.size}" oninput="csSetCapField('size',+this.value)"/>
      <div class="cs-row-lbl" style="margin-top:14px"><span>Vertical position</span><span id="cs-cap-y-v">${Math.round(eff.y)}%</span></div>
      <input class="cs-slider" type="range" min="8" max="94" value="${Math.round(eff.y)}" oninput="csSetCapField('y',+this.value)"/>
      <div class="cs-note">You can also drag the caption directly on the preview.</div>
    </div>` : ''}
    ${tab==='list' ? ((st.captions||[]).length ? `<div class="cs-cap-list">${st.captions.map((c,i)=>`
      <div class="cs-cap-line">
        <div class="t">${_fmtTs(c.start)}</div>
        <input class="cs-cap-edit" value="${esc(c.text)}" oninput="S.studio.captions[${i}].text=this.value;csSyncCaption()"/>
      </div>`).join('')}</div>` : '<div class="cs-note" style="text-align:center;padding:20px 0">No captions yet.</div>') : ''}
    </div>`;
  return csSheet('Captions', body, {tall:true});
}
window.csSetCapTab = (t) => {
  S.studio.capTab = t;
  const sheet = document.querySelector('.cs-sheet');
  if(sheet) sheet.outerHTML = csCaptionsSheet(S.studio); else render();
};
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
// Push caption style/text into the live preview element without a re-render.
function csSyncCaption(){
  const el = document.getElementById('cs-ed-cap'); if(!el) return;
  const s = csCapStyle();
  el.setAttribute('style', csCapCss(s));
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
window.csResetAdjust = () => {
  S.studio.adjust = {brightness:100,contrast:100,saturation:100,warmth:0};
  csApplyPreview();
  const sheet = document.querySelector('.cs-sheet'); if(sheet) sheet.outerHTML = csAdjustSheet(S.studio);
};

function csVoiceSheet(st){
  return csSheet('Voiceover', `
    <div class="cs-note" style="margin-bottom:14px">Hold to record a voiceover starting at the playhead.</div>
    <button class="cs-primary" id="cs-voice-btn"
      onpointerdown="csVoiceStart()" onpointerup="csVoiceStop()" onpointercancel="csVoiceStop()" onpointerleave="csVoiceStop()">
      ${CS_ICON('voice')} <span id="cs-voice-lbl">Hold to record</span>
    </button>`);
}

function csOpacitySheet(st){
  const o = st.opacity==null?100:st.opacity;
  return csSheet('Opacity', `
    <div class="cs-row-lbl"><span>Opacity</span><span id="cs-op-val">${o}%</span></div>
    <input class="cs-slider" type="range" min="0" max="100" value="${o}" oninput="S.studio.opacity=+this.value;csApplyPreview();var l=document.getElementById('cs-op-val');if(l)l.textContent=this.value+'%'"/>`);
}

// Drag-to-dismiss on the sheet grip.
window.csSheetDragStart = (e) => {
  const sheet = e.currentTarget.closest('.cs-sheet'); if(!sheet) return;
  const y0 = e.clientY; let dy = 0;
  sheet.style.transition = 'none';
  const move = ev => { dy = Math.max(0, ev.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; };
  const up = () => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    sheet.style.transition = '';
    if(dy > 90){ sheet.style.transform = 'translateY(100%)'; setTimeout(csCloseSheet, 160); }
    else sheet.style.transform = '';
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
};

function _fmtTs(s){ s=Math.max(0,+s||0); const m=Math.floor(s/60), r=Math.floor(s%60); return `${m}:${String(r).padStart(2,'0')}`; }
function studioTotalDur(){ return (S.studio.clips||[]).reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs))/1000, 0); }

window._st = { stream:null, recorder:null, chunks:[], scrollRAF:null, timerRAF:null, tStart:0, seg:null, segRAF:null, dragId:null };

window.studioInitStage = async () => {
  const S2 = S.studio;
  if(!S2) return;
  if(!window._st.stream){
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:S2.facing }, audio:true });
      window._st.stream = s;
      s.getAudioTracks().forEach(t => t.enabled = !!S2.micOn);
      S2.camReady = true;
    } catch(e){ toast("Camera permission denied"); return; }
  }
  const v = document.getElementById("st-live");
  if(v && !v.srcObject){ v.srcObject = window._st.stream; v.play().catch(()=>{}); }
  if(S2.bg !== "off") studioBgLoop();
};

window.studioFlip = async () => {
  const S2 = S.studio;
  S2.facing = S2.facing === "user" ? "environment" : "user";
  if(window._st.stream){ window._st.stream.getTracks().forEach(t=>t.stop()); window._st.stream = null; }
  const v = document.getElementById("st-live"); if(v) v.srcObject = null;
  await window.studioInitStage();
};

window.studioMic = () => {
  S.studio.micOn = !S.studio.micOn;
  if(window._st.stream) window._st.stream.getAudioTracks().forEach(t => t.enabled = S.studio.micOn);
  render();
};

window.studioBg = async (mode) => {
  S.studio.bg = mode;
  render();
  if(mode !== "off"){
    if((navigator.hardwareConcurrency||2) < 4){ toast("Background effects need a faster device — reverting."); S.studio.bg="off"; render(); return; }
    await window.studioInitStage();
  }
};

// MediaPipe Selfie Segmentation loaded lazily
let _mp = null;
async function _loadSegmenter(){
  if(_mp) return _mp;
  await new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
  const seg = new window.SelfieSegmentation({ locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}` });
  seg.setOptions({ modelSelection:1 });
  _mp = seg; return seg;
}

async function studioBgLoop(){
  const cv = document.getElementById("st-canvas");
  const v  = document.getElementById("st-live");
  if(!cv || !v || !window._st.stream) return;
  const seg = await _loadSegmenter().catch(()=>null);
  if(!seg){ toast("Background effects unavailable"); S.studio.bg="off"; render(); return; }
  cv.width = 720; cv.height = 1280;
  const ctx = cv.getContext("2d");
  seg.onResults((res) => {
    if(S.studio.bg === "off") return;
    ctx.save(); ctx.clearRect(0,0,cv.width,cv.height);
    ctx.drawImage(res.segmentationMask,0,0,cv.width,cv.height);
    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(res.image,0,0,cv.width,cv.height);
    ctx.globalCompositeOperation="destination-over";
    if(S.studio.bg==="blur"){ ctx.filter="blur(14px)"; ctx.drawImage(res.image,0,0,cv.width,cv.height); ctx.filter="none"; }
    else if(S.studio.bg==="dark"){ ctx.fillStyle="#0a0a0f"; ctx.fillRect(0,0,cv.width,cv.height); }
    else if(S.studio.bg==="purple"){ const g=ctx.createLinearGradient(0,0,0,cv.height); g.addColorStop(0,"#3b0764"); g.addColorStop(1,"#7C3AED"); ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height); }
    ctx.restore();
  });
  const tick = async () => {
    if(S.studio.bg === "off") return;
    if(v.readyState >= 2){ try { await seg.send({ image:v }); } catch(_){} }
    window._st.segRAF = requestAnimationFrame(tick);
  };
  tick();
}

window.studioToggleRecord = async () => {
  const S2 = S.studio;
  await window.studioInitStage();
  if(!window._st.stream){ return; }
  if(S2.running){
    try { window._st.recorder && window._st.recorder.stop(); } catch(_){}
    S2.running = false;
    if(window._st.scrollRAF) cancelAnimationFrame(window._st.scrollRAF);
    if(window._st.timerRAF) cancelAnimationFrame(window._st.timerRAF);
    return;
  }
  let recStream = window._st.stream;
  if(S2.bg !== "off"){
    const cv = document.getElementById("st-canvas");
    if(cv && cv.captureStream){
      const cs = cv.captureStream(30);
      window._st.stream.getAudioTracks().forEach(t => cs.addTrack(t));
      recStream = cs;
    }
  }
  const mime = csPickMime();
  const rec = new MediaRecorder(recStream, { mimeType:mime });
  window._st.recorder = rec; window._st.chunks = [];
  rec.ondataavailable = e => e.data && e.data.size && window._st.chunks.push(e.data);
  rec.onstop = async () => {
    const blob = new Blob(window._st.chunks, { type: mime.split(";")[0] });
    window._st.chunks.length = 0;              // release the chunk refs immediately
    const url = URL.createObjectURL(blob);
    const dur = await _probeDur(url);
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob, dur, inMs:0, outMs:Math.round(dur*1000), source:"rec", kind:"video" });
    S.studio.selectedId = S.studio.clips[S.studio.clips.length-1].id;
    S.studio.selectedType = 'video';
    render();
  };
  rec.start(1000);
  S2.running = true;
  window._st.tStart = performance.now();
  render();
  if(window.__csAutoStop) clearTimeout(window.__csAutoStop);
  window.__csAutoStop = setTimeout(() => { if(S.studio && S.studio.running) window.studioToggleRecord(); }, 180000);
};

function csPickMime(){
  const cands = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/webm;codecs=vp8,opus",   // vp8 first: far cheaper than vp9 on mid Android
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  for(const m of cands){ try { if(MediaRecorder.isTypeSupported(m)) return m; } catch(_){} }
  return "video/webm";
}

function _probeDur(url){
  return new Promise(res => {
    const v = document.createElement("video"); v.preload="metadata"; v.src=url;
    const done = d => { try { v.removeAttribute('src'); v.load(); } catch(_){} res(d); };
    v.onloadedmetadata = () => done(isFinite(v.duration)&&v.duration>0 ? v.duration : 0);
    v.onerror = () => done(0);
    setTimeout(()=>done(isFinite(v.duration)&&v.duration>0?v.duration:0), 6000);
  });
}

window.studioUploadClick = () => document.getElementById("st-file")?.click();
window.studioUpload = async (e) => {
  const files = Array.from(e.target.files||[]);
  for(const f of files){
    if(!f.type.startsWith("video/")) continue;
    const url = URL.createObjectURL(f);
    const dur = await _probeDur(url);
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob:f, dur, inMs:0, outMs:Math.round(dur*1000), source:"upload", kind:"video" });
  }
  e.target.value = "";
  if(!S.studio.selectedId && S.studio.clips.length) S.studio.selectedId = S.studio.clips[0].id;
  render();
};

window.studioSelect = (id) => { S.studio.selectedId = id; S.studio.captions = []; render(); };
window.studioDelete = (id) => {
  const i = S.studio.clips.findIndex(c=>c.id===id); if(i<0) return;
  const c = S.studio.clips[i]; try { URL.revokeObjectURL(c.url); } catch(_){}
  S.studio.clips.splice(i,1);
  if(S.studio.selectedId===id) S.studio.selectedId = S.studio.clips[0]?.id || null;
  render();
};
window.studioSetTrim = (id, which, val) => {
  const c = S.studio.clips.find(x=>x.id===id); if(!c) return;
  const ms = Math.max(0, Math.round((+val||0)*1000));
  if(which==="in")  c.inMs  = Math.min(ms, c.outMs-100);
  else              c.outMs = Math.max(ms, c.inMs+100);
  c.outMs = Math.min(c.outMs, Math.round(c.dur*1000)||c.outMs);
};
window.studioSplit = (id) => window.csSplit();
window.studioDragStart = (e, id) => { window._st.dragId = id; e.dataTransfer.effectAllowed="move"; };
window.studioDrop = (e, targetId) => {
  e.preventDefault();
  const from = window._st.dragId; if(!from || from===targetId) return;
  const arr = S.studio.clips;
  const fi = arr.findIndex(c=>c.id===from), ti = arr.findIndex(c=>c.id===targetId);
  if(fi<0||ti<0) return;
  const [m] = arr.splice(fi,1); arr.splice(ti,0,m);
  window._st.dragId = null; render();
};
window.studioPreviewMeta = (v) => { const c=S.studio.clips.find(x=>x.id===S.studio.selectedId); if(c && (!c.dur||c.dur<0.1)){ c.dur=v.duration; if(!c.outMs) c.outMs=Math.round(v.duration*1000); render(); } };

// ── Auto-captions: send the original blob to the backend ───────────────────
window.studioCaption = async () => window.csAutoCaption();

function _shareOrDownload(blob, name){
  const file = new File([blob], name, { type:blob.type });
  if(navigator.share && navigator.canShare && navigator.canShare({ files:[file] })){
    navigator.share({ files:[file], title:"CreatorPulse video" }).catch(()=>{});
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 8000);
  }
}

// ── CapCut-style Create Studio: handlers ────────────────────────────────────
window.csOpenCamera = async () => {
  csStopEngine();
  S.studio.mode = "camera"; render();
  setTimeout(async () => {
    await window.studioInitStage();
    const v = document.getElementById("cs-cam-live");
    if(v && window._st.stream) { v.srcObject = window._st.stream; v.play().catch(()=>{}); }
  }, 60);
};
window.csExitCamera = () => {
  if(S.studio.running){ if(!confirm("Stop recording and leave?")) return; window.studioToggleRecord(); }
  try { window._st.stream && window._st.stream.getTracks().forEach(t=>t.stop()); } catch(_){}
  window._st.stream = null;
  S.studio.mode = S.studio.clips.length ? "editor" : "camera";
  render();
};
window.csOpenUpload = () => { document.getElementById("cs-upload")?.click(); };
window.csAddClipClick = () => { document.getElementById("cs-add-clip")?.click(); };
window.csReplaceClick = () => { document.getElementById("cs-replace-clip")?.click(); };
window.csScriptOnly = () => { S.studio.showPrompter = true; window.csOpenCamera(); };
window.csResumeProject = () => { if(S.studio.clips.length){ S.studio.mode="editor"; render(); } else toast("No project yet — record or upload first."); };

window.csHandleUpload = async (e, toEditor) => {
  const files = Array.from(e.target.files||[]);
  for(const f of files){
    const url = URL.createObjectURL(f);
    const isImg = f.type.startsWith("image/");
    let dur = isImg ? 3 : await _probeDur(url);
    if(!dur || !isFinite(dur)) dur = 3;
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob:f, dur, inMs:0, outMs:Math.round(dur*1000), source:isImg?"image":"upload", kind:isImg?"image":"video" });
  }
  e.target.value = "";
  if(!S.studio.selectedId && S.studio.clips.length){ S.studio.selectedId = S.studio.clips[0].id; S.studio.selectedType='video'; }
  S.studio.mode = "editor"; render();
};
window.csHandleReplace = async (e) => {
  const f = (e.target.files||[])[0]; if(!f) return;
  const cur = S.studio.clips.find(c=>c.id===S.studio.selectedId); if(!cur) return;
  try { URL.revokeObjectURL(cur.url); } catch(_){}
  cur.url = URL.createObjectURL(f); cur.blob = f;
  cur.kind = f.type.startsWith("image/") ? "image" : "video";
  cur.dur = cur.kind==='image' ? 3 : await _probeDur(cur.url);
  cur.inMs=0; cur.outMs=Math.round(cur.dur*1000);
  e.target.value=""; render();
};
window.csGoToEditor = () => {
  if(!S.studio.clips.length){ toast("Record something first"); return; }
  if(S.studio.running) window.studioToggleRecord();
  try { window._st.stream && window._st.stream.getTracks().forEach(t=>t.stop()); } catch(_){}
  window._st.stream = null;
  S.studio.mode = "editor";
  if(!S.studio.selectedId){ S.studio.selectedId = S.studio.clips[0].id; S.studio.selectedType='video'; }
  render();
  setTimeout(csLoadCurrent, 80);
  if(window.pushBackState) window.pushBackState(() => {
    S.studio.mode = "camera"; render();
    setTimeout(() => window.studioInitStage && window.studioInitStage(), 60);
  });
};
window.csConfirmExitEditor = () => {
  csStopEngine();
  S.studio.mode = "camera"; render();
};

// Camera controls
window.csToggleFlash = async () => {
  const track = window._st.stream?.getVideoTracks()?.[0];
  const caps = track?.getCapabilities?.();
  if(caps && caps.torch){
    S.studio.flash = !S.studio.flash;
    try { await track.applyConstraints({ advanced:[{ torch:S.studio.flash }] }); } catch(_){ toast("Torch not supported on this camera"); S.studio.flash=false; }
  } else { toast("Flash only works on rear camera on supported devices"); }
  render();
};
window.csFlip = async () => { await window.studioFlip(); const v=document.getElementById("cs-cam-live"); if(v&&window._st.stream){ v.srcObject=window._st.stream; v.play().catch(()=>{}); } };
window.csCycleCountdown = () => { const o=[0,3,5,10]; S.studio.countdown = o[(o.indexOf(S.studio.countdown||0)+1)%o.length]; render(); };
window.csCycleSpeed = () => { const s=[1,0.5,2,3]; S.studio.speed = s[(s.indexOf(S.studio.speed||1)+1)%s.length]; render(); };
window.csSetZoom = (z) => {
  S.studio.zoom = z;
  const v = document.getElementById('cs-cam-live');
  if(v){ v.style.transform = `${S.studio.mirror&&S.studio.facing==='user'?'scaleX(-1) ':''}scale(${z})`; }
  document.querySelectorAll('.cs-cam-zoom button').forEach(b => b.classList.toggle('on', b.textContent === z+'×'));
};
window.csPrompterTap = () => {
  const st = S.studio;
  if(!st.script){ st.showScriptEditor = true; render(); return; }
  st.showPrompter = !st.showPrompter; render();
};
window.csSaveScript = () => {
  const st = S.studio;
  st.showScriptEditor = false;
  st.showPrompter = !!st.script.trim();
  if(!st.script.trim()) toast("Add some text first");
  render();
};
window.csOpenMusic = () => { toast("Tap Music inside the editor after recording"); };
window.csRecord = async () => {
  if(S.studio.countdown && !S.studio.running){
    let n = S.studio.countdown;
    const tick = () => {
      toast(n+"…");
      n--; if(n>0) setTimeout(tick, 1000); else { window.studioToggleRecord(); csTimerBind(); csPrompterScrollBind(); }
    };
    tick();
  } else {
    await window.studioToggleRecord();
    csTimerBind();
    csPrompterScrollBind();
  }
};
function csPrompterScrollBind(){
  const el = document.getElementById("cs-cam-prompter-inner");
  if(!el || !S.studio.showPrompter) return;
  el.style.transform = "translateY(0px)";
  const start = performance.now();
  const pxPerSec = (S.studio.promptSpeed || 60) / 3;
  const maxScroll = Math.max(0, el.scrollHeight - el.parentElement.clientHeight);
  const tick = () => {
    if(!S.studio.running){ return; }
    const elapsed = (performance.now() - start) / 1000;
    const y = Math.min(maxScroll, elapsed * pxPerSec);
    el.style.transform = `translateY(-${y}px)`;
    if(y < maxScroll) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function csTimerBind(){
  const label = document.getElementById("cs-cam-time");
  if(!label) return;
  let last = 0;
  const tick = () => {
    if(!S.studio.running) return;
    const s = (performance.now()-window._st.tStart)/1000;
    if(s - last > .25){ label.textContent = _fmtTs(s); last = s; }
    requestAnimationFrame(tick);
  };
  tick();
}

// ═══════════════════════════════════════════════════════════════════════════
//  PREVIEW PLAYBACK ENGINE
//  One rAF loop owns the playhead, overlay visibility and caption text.
//  Nothing here calls render(), so the <video> element is never torn down
//  mid-playback (that teardown was the main source of the stutter).
// ═══════════════════════════════════════════════════════════════════════════
const CSE = { raf:null, scrubbing:false, seekPending:false, lastPaint:0 };

function csActiveVideo(){ return document.getElementById('cs-ed-video'); }
function csIdleVideo(){ return document.getElementById('cs-ed-video-b'); }

function csEnsureEngine(){
  if(CSE.raf) return;
  const loop = () => {
    CSE.raf = requestAnimationFrame(loop);
    const st = S.studio;
    if(!st || st.mode !== 'editor'){ csStopEngine(); return; }
    const v = csActiveVideo();
    if(!v || !v.dataset.cid) return;
    if(!CSE.scrubbing){
      const cur = st.clips.find(c=>c.id===v.dataset.cid);
      if(!cur) return;
      const local = Math.max(0, v.currentTime*1000 - cur.inMs);
      st.playhead = csClipStart(cur.id) + local;
      // End of trimmed range → hand over to the preloaded buffer.
      if(!v.paused && v.currentTime >= cur.outMs/1000 - 0.03) csAdvanceClip();
    }
    csPaint();
  };
  CSE.raf = requestAnimationFrame(loop);
}
function csStopEngine(){ if(CSE.raf){ cancelAnimationFrame(CSE.raf); CSE.raf = null; } }

// Cheap per-frame DOM sync: transform on the playhead (no layout), class
// toggles on overlays, textContent on the caption.
function csPaint(){
  const st = S.studio;
  const now = performance.now();
  if(now - CSE.lastPaint < 16) return;
  CSE.lastPaint = now;

  const ph = document.getElementById('cs-playhead');
  if(ph) ph.style.transform = `translateX(${88 + st.playhead*CS_PX}px)`;
  const t = document.querySelector('.cs-ed-time .cur');
  if(t){ const s = _fmtTs(st.playhead/1000); if(t.textContent !== s) t.textContent = s; }

  const layer = document.getElementById('cs-ed-layer');
  if(layer){
    const els = layer.querySelectorAll('.cs-ed-overlay');
    for(let i=0;i<els.length;i++){
      const el = els[i];
      const on = st.playhead >= +el.dataset.start && st.playhead <= +el.dataset.end;
      if(el.classList.contains('off') === on) el.classList.toggle('off', !on);
    }
    const capEl = document.getElementById('cs-ed-cap');
    if(capEl){
      const cap = csCapAt(st.playhead);
      const txt = cap ? cap.text : '';
      if(capEl.textContent !== txt) capEl.textContent = txt;
      if(capEl.classList.contains('off') === !!cap) capEl.classList.toggle('off', !cap);
    }
  }
}

// Editor: selection, timeline, playback
window.csSelect = (id, type) => {
  const st = S.studio;
  st.selectedId = id; st.selectedType = type;
  if(type==='video'){ st.playhead = csClipStart(id); csLoadCurrent(true); }
  render();
};
window.csSelectOverlay = (id) => {
  S.studio.selectedId = id; S.studio.selectedType='text';
  const o=S.studio.overlays.find(x=>x.id===id);
  if(o){ S.studio.editText = o; S.studio.sheet='text'; S.studio.editTextTab = 'font'; }
  render();
};

// ── Pointer handling for overlays: drag, pinch-resize, tap-to-edit ─────────
const CSPTR = { pts:new Map(), mode:null, o:null, el:null, base:null };

window.csOverlayPointerDown = (e, id) => {
  e.stopPropagation();
  const stage = document.getElementById("cs-ed-stage");
  const el = e.currentTarget;
  const o  = S.studio.overlays.find(x => x.id === id);
  if (!stage || !o) return;
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
  CSPTR.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

  if(CSPTR.pts.size === 2 && CSPTR.o === o){
    // Second finger down → switch from drag to pinch, keep the same element.
    const [a,b] = [...CSPTR.pts.values()];
    CSPTR.mode = 'pinch';
    CSPTR.base = { dist: Math.hypot(a.x-b.x, a.y-b.y) || 1, size: o.size };
    return;
  }

  const rect = stage.getBoundingClientRect();
  CSPTR.o = o; CSPTR.el = el; CSPTR.mode = 'drag';
  CSPTR.base = { x:e.clientX, y:e.clientY, px:o.x, py:o.y, rect, moved:false, size:o.size };

  const move = (ev) => {
    if(CSPTR.pts.has(ev.pointerId)) CSPTR.pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    if(CSPTR.mode === 'pinch' && CSPTR.pts.size >= 2){
      const [a,b] = [...CSPTR.pts.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y) || 1;
      const next = Math.max(12, Math.min(160, Math.round(CSPTR.base.size * (d / CSPTR.base.dist))));
      o.size = next; el.style.fontSize = next + 'px';
      CSPTR.base.moved = true;
      return;
    }
    const dx = ev.clientX - CSPTR.base.x, dy = ev.clientY - CSPTR.base.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) CSPTR.base.moved = true;
    const nx = Math.max(2, Math.min(98, CSPTR.base.px + (dx / CSPTR.base.rect.width) * 100));
    const ny = Math.max(2, Math.min(98, CSPTR.base.py + (dy / CSPTR.base.rect.height) * 100));
    el.style.left = nx + "%"; el.style.top = ny + "%";
    o._px = nx; o._py = ny;
  };
  const up = (ev) => {
    CSPTR.pts.delete(ev.pointerId);
    if(CSPTR.pts.size > 0) return;                    // wait for the last finger
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", up);
    const moved = CSPTR.base && CSPTR.base.moved;
    if (moved){
      if(o._px != null){ o.x = o._px; o.y = o._py; delete o._px; delete o._py; }
      csPushHistory();
      const lbl = document.querySelector('[data-ov-size]'); if(lbl) lbl.textContent = o.size+'px';
    } else {
      window.csSelectOverlay(id);
    }
    CSPTR.mode = null; CSPTR.o = null; CSPTR.el = null; CSPTR.base = null;
  };
  document.addEventListener("pointermove", move, {passive:true});
  document.addEventListener("pointerup", up);
  document.addEventListener("pointercancel", up);
};

// Corner handle resize (the reliable path on devices where pinch is awkward).
window.csOverlayResizeStart = (e, id) => {
  e.stopPropagation(); e.preventDefault();
  const o = S.studio.overlays.find(x=>x.id===id); if(!o) return;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${id}"]`); if(!el) return;
  const startY = e.clientY, startX = e.clientX, base = o.size;
  const move = (ev) => {
    const d = ((ev.clientX-startX) + (ev.clientY-startY)) / 2;
    const next = Math.max(12, Math.min(160, Math.round(base + d*0.6)));
    o.size = next; el.style.fontSize = next+'px';
    const lbl = document.querySelector('[data-ov-size]'); if(lbl) lbl.textContent = next+'px';
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    csPushHistory();
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
};

// Caption drag (position only — style comes from the preset).
window.csCaptionPointerDown = (e) => {
  e.stopPropagation();
  const stage = document.getElementById("cs-ed-stage");
  const el = e.currentTarget;
  const cs = S.studio.capStyle;
  if(!stage) return;
  const rect = stage.getBoundingClientRect();
  const x0=e.clientX, y0=e.clientY, px=cs.x==null?50:cs.x, py=cs.y==null?82:cs.y;
  let moved=false;
  el.setPointerCapture && el.setPointerCapture(e.pointerId);
  const move = ev => {
    const dx=ev.clientX-x0, dy=ev.clientY-y0;
    if(Math.abs(dx)>3||Math.abs(dy)>3) moved=true;
    const nx=Math.max(5,Math.min(95, px + dx/rect.width*100));
    const ny=Math.max(5,Math.min(95, py + dy/rect.height*100));
    el.style.left=nx+'%'; el.style.top=ny+'%';
    cs._x=nx; cs._y=ny;
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    if(moved && cs._x!=null){ cs.x=cs._x; cs.y=cs._y; delete cs._x; delete cs._y; }
    else { S.studio.selectedType='caption'; S.studio.selectedId=null; csOpenSheet('captions'); }
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
};

// ── Timeline scrubbing: pointer drag, rAF-coalesced seeks, zero re-renders ──
window.csScrubStart = (e) => {
  const tracks = document.getElementById('cs-ed-tracks');
  if(!tracks) return;
  // Let taps on actual clips select them instead of scrubbing.
  if(e.target.closest('.cs-track-clip, .cs-track-add')) return;
  const rect = tracks.getBoundingClientRect();
  const wasPlaying = S.studio.playing;
  if(wasPlaying) csPause();
  CSE.scrubbing = true;
  tracks.classList.add('scrubbing');
  csEnsureEngine();

  const apply = (clientX) => {
    const x = clientX - rect.left - 88 + tracks.scrollLeft;
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
    if(wasPlaying) csPlay();
  };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};

// Coalesce seeks to one per animation frame and use fastSeek where available:
// firing currentTime= on every pointermove is what made scrubbing lurch.
function csQueueSeek(){
  if(CSE.seekPending) return;
  CSE.seekPending = true;
  requestAnimationFrame(() => { CSE.seekPending = false; csSyncToPlayhead(); });
}

function csLoadCurrent(seekToPlayhead){
  const st = S.studio;
  const cur = st.clips.find(c=>c.id===st.selectedId && st.selectedType==='video') || st.clips[0];
  if(!cur) return;
  const v = csActiveVideo();
  if(!v) return;
  v.volume = Math.min(1, (st.clipVolume==null?100:st.clipVolume)/100);
  if(v.dataset.cid !== cur.id){
    v.dataset.cid = cur.id;
    v.src = cur.url;
    v.load();
    v.onloadedmetadata = () => {
      const local = seekToPlayhead ? Math.max(0, st.playhead - csClipStart(cur.id)) : 0;
      try { v.currentTime = cur.inMs/1000 + local/1000; } catch(_){}
      if(st.playing) v.play().catch(()=>{});
    };
  }
  csPreloadNext(cur.id);
  csEnsureEngine();
}

// Double buffering: the next clip is decoded and seeked while the current one
// is still playing, so the cut is instant instead of a black reload flash.
function csPreloadNext(curId){
  const st = S.studio;
  const i = st.clips.findIndex(c=>c.id===curId);
  const next = st.clips[i+1];
  const b = csIdleVideo();
  if(!b) return;
  if(!next){ if(b.dataset.cid){ b.removeAttribute('src'); b.dataset.cid=''; b.load(); } return; }
  if(b.dataset.cid === next.id) return;
  b.dataset.cid = next.id;
  b.src = next.url;
  b.load();
  b.onloadedmetadata = () => { try { b.currentTime = next.inMs/1000; } catch(_){} };
}

function csPlay(){
  const st = S.studio;
  const v = csActiveVideo(); if(!v) return;
  if(!v.dataset.cid) csLoadCurrent(true);
  st.playing = true;
  v.play().catch(()=>{});
  csEnsureEngine();
  csSyncPlayBtn();
}
function csPause(){
  const v = csActiveVideo();
  S.studio.playing = false;
  if(v) v.pause();
  csSyncPlayBtn();
}
function csSyncPlayBtn(){
  const btn = document.querySelector('.cs-ed-play');
  if(btn) btn.innerHTML = CS_ICON(S.studio.playing?'pause':'play');
  document.getElementById('cs-ed-stage')?.classList.toggle('is-playing', !!S.studio.playing);
}
window.csTogglePlay = () => { S.studio.playing ? csPause() : csPlay(); };

// Legacy hooks kept so nothing else breaks; the rAF engine owns timing now.
window.csOnTime = () => {};
window.csOnClipEnded = () => csAdvanceClip();

function csAdvanceClip(){
  const st = S.studio;
  const a = csActiveVideo(), b = csIdleVideo();
  if(!a) return;
  const i = st.clips.findIndex(c=>c.id===a.dataset.cid);
  const next = st.clips[i+1];
  if(!next){ csPause(); st.playhead = csTotalMs(); csPaint(); render(); return; }

  if(b && b.dataset.cid === next.id && b.readyState >= 2){
    // Swap buffers: no src assignment, no decode stall, no flash.
    a.pause();
    a.classList.remove('on'); b.classList.add('on');
    a.id = 'cs-ed-video-b'; b.id = 'cs-ed-video';
    a.muted = true; b.muted = false;
    b.volume = Math.min(1, (st.clipVolume==null?100:st.clipVolume)/100);
    st.selectedId = next.id; st.selectedType = 'video';
    if(st.playing) b.play().catch(()=>{});
    // Old buffer is now the preloader → point it at the clip after next.
    a.removeAttribute('src'); a.dataset.cid=''; a.load();
    csPreloadNext(next.id);
  } else {
    st.selectedId = next.id; st.selectedType = 'video';
    a.dataset.cid = next.id; a.src = next.url; a.load();
    a.onloadedmetadata = () => { try { a.currentTime = next.inMs/1000; } catch(_){} if(st.playing) a.play().catch(()=>{}); };
    csPreloadNext(next.id);
  }
  csSyncTrackSelection();
}
// Update the timeline highlight without a full render.
function csSyncTrackSelection(){
  const st = S.studio;
  document.querySelectorAll('.cs-track-video').forEach((el,i)=>{
    el.classList.toggle('sel', st.clips[i] && st.clips[i].id===st.selectedId && st.selectedType==='video');
  });
}

function csSyncToPlayhead(){
  const st = S.studio;
  let acc = 0;
  for(const c of st.clips){
    const dur = c.outMs-c.inMs;
    if(st.playhead <= acc+dur || c === st.clips[st.clips.length-1]){
      const v = csActiveVideo();
      if(v){
        const target = c.inMs/1000 + Math.max(0, st.playhead-acc)/1000;
        if(v.dataset.cid !== c.id){
          v.dataset.cid=c.id; v.src=c.url; v.load();
          v.onloadedmetadata=()=>{ try{ v.currentTime = target; }catch(_){} };
          csPreloadNext(c.id);
        } else if(Math.abs(v.currentTime - target) > 0.04){
          try { v.fastSeek ? v.fastSeek(target) : (v.currentTime = target); } catch(_){}
        }
      }
      if(st.selectedId !== c.id){ st.selectedId = c.id; st.selectedType='video'; csSyncTrackSelection(); }
      return;
    }
    acc += dur;
  }
}

// Editor: clip actions
window.csSplit = () => {
  const st = S.studio;
  let c = st.selectedType==='video' ? st.clips.find(x=>x.id===st.selectedId) : null;
  if(!c){
    c = st.clips.find(x=>x.id===st.selectedId) || st.clips[0];
    if(c){ st.selectedId = c.id; st.selectedType = 'video'; }
  }
  if(!c){ toast("Add a clip first"); return; }
  const v = csActiveVideo();
  const at = v && v.dataset.cid===c.id ? Math.round(v.currentTime*1000) : Math.round((c.inMs+c.outMs)/2);
  if(at <= c.inMs+120 || at >= c.outMs-120){ toast("Move playhead further into the clip"); return; }
  csPushHistory();
  const i = st.clips.findIndex(x=>x.id===c.id);
  const right = { ...c, id:"c"+Date.now()+Math.random().toString(36).slice(2,6), inMs:at, outMs:c.outMs };
  c.outMs = at;
  st.clips.splice(i+1, 0, right);
  render();
};
window.csDeleteSelected = () => {
  const st = S.studio;
  csPushHistory();
  if(st.selectedType==='video'){
    const i = st.clips.findIndex(c=>c.id===st.selectedId); if(i<0) return;
    const gone = st.clips[i];
    st.clips.splice(i,1);
    // Only revoke when no other clip (a split/duplicate) still points at it.
    if(!st.clips.some(c=>c.url===gone.url)){ try { URL.revokeObjectURL(gone.url); } catch(_){} }
    st.selectedId = st.clips[0]?.id || null;
    if(!st.clips.length) st.selectedType=null;
    const v = csActiveVideo(); if(v){ v.dataset.cid=''; }
  } else if(st.selectedType==='text'){
    csDeleteOverlay(st.selectedId, true);
  }
  render();
};
window.csDuplicate = () => {
  const st = S.studio;
  if(st.selectedType!=='video') return;
  const c = st.clips.find(x=>x.id===st.selectedId); if(!c) return;
  csPushHistory();
  const i = st.clips.indexOf(c);
  st.clips.splice(i+1, 0, { ...c, id:"c"+Date.now()+Math.random().toString(36).slice(2,6) });
  render();
};
window.csCopy = () => { window.__cs_clip = { ...S.studio.clips.find(x=>x.id===S.studio.selectedId) }; toast("Copied"); };

// Overlays / text
window.csAddText = () => {
  csPushHistory();
  const o = {
    id:"o"+Date.now()+Math.random().toString(36).slice(2,6),
    text:"Tap to edit", font:"classic", style:"none", color:"#FFFFFF", bg:"#000000",
    size:38, x:50, y:70, startMs:S.studio.playhead, endMs:S.studio.playhead + 3000,
  };
  S.studio.overlays.push(o);
  S.studio.selectedId = o.id; S.studio.selectedType='text';
  S.studio.editText = o; S.studio.sheet = 'text'; S.studio.editTextTab = 'font';
  render();
};
window.csEditOverlayField = (k, v) => {
  const o = S.studio.editText; if(!o) return;
  o[k] = v;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(k === 'text'){
    const span = el && el.querySelector('.ov-txt');
    if(span) span.textContent = v;
    const chip = document.querySelector(`.cs-track-text.sel span`);
    if(chip) chip.textContent = v.slice(0,20);
    return;
  }
  if(el){
    // Restyle in place — a full render() here nuked the video element.
    const f = csFontById(o.font);
    el.setAttribute('style', `left:${o.x}%;top:${o.y}%;font-family:${f.css};font-weight:${f.weight};font-size:${o.size}px;color:${o.color};${csStyleCss(o.style,o.color,o.bg)}`);
  }
  // Reflect selection state in the sheet without rebuilding the editor.
  const sheet = document.querySelector('.cs-sheet');
  if(sheet && S.studio.sheet==='text') sheet.outerHTML = csTextSheet(S.studio);
};
window.csLiveOverlaySize = (v) => {
  const o = S.studio.editText; if(!o) return;
  o.size = v;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(el) el.style.fontSize = v+'px';
  const lbl = document.querySelector('[data-ov-size]'); if(lbl) lbl.textContent = v+'px';
};
window.csEditOverlayDuration = (ms) => {
  const o = S.studio.editText; if(!o) return;
  o.endMs = o.startMs + ms;
  const el = document.querySelector(`.cs-ed-overlay[data-ovid="${o.id}"]`);
  if(el) el.dataset.end = o.endMs;
  const chip = document.querySelector('.cs-track-text.sel');
  if(chip) chip.style.width = Math.max(44, ms*CS_PX)+'px';
  const lbl = document.querySelector('[data-ov-dur]'); if(lbl) lbl.textContent = (ms/1000).toFixed(1)+'s';
};
window.csDeleteOverlay = (id, skipRender) => {
  const i = S.studio.overlays.findIndex(o=>o.id===id); if(i<0) return;
  S.studio.overlays.splice(i,1);
  if(S.studio.selectedId===id){ S.studio.selectedId=null; S.studio.selectedType=null; S.studio.editText=null; S.studio.sheet=null; }
  if(!skipRender) render();
};

// Sheets
window.csOpenSheet = (name) => {
  S.studio.sheet = name; render();
  if(window.pushBackState) window.pushBackState(() => window.csCloseSheet());
};
window.csCloseSheet = () => { S.studio.sheet = null; S.studio.editText = null; render(); };

// Audio
window.csAddAudio = async (e) => {
  const f = (e.target.files||[])[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  const dur = await new Promise(r => {
    const a=new Audio(); a.preload='metadata'; a.src=url;
    a.onloadedmetadata=()=>r(a.duration||10); a.onerror=()=>r(10);
    setTimeout(()=>r(a.duration||10), 5000);
  });
  S.studio.audioTracks = S.studio.audioTracks || [];
  S.studio.audioTracks.push({ id:"a"+Date.now(), name:f.name.replace(/\.[^.]+$/,''), url, blob:f, startMs:0, durMs:Math.round(dur*1000) });
  render();
};

// Captions
window.csAutoCaption = async () => {
  const st = S.studio;
  const c = st.clips.find(x=>x.id===st.selectedId) || st.clips[0];
  if(!c){ toast("Add a clip first"); return; }
  st.transcribing = true; render();
  const clipDur = Math.max(1, (c.outMs - c.inMs)/1000);
  try {
    const mime = c.blob?.type || "video/webm";
    const ac = new AbortController();
    const tmo = setTimeout(()=>ac.abort(), 25000);
    let r;
    try {
      r = await fetch("/api/transcribe", { method:"POST", headers:{ "Content-Type":mime }, body:c.blob, signal:ac.signal });
    } finally { clearTimeout(tmo); }
    if(!r.ok){
      const errBody = await r.json().catch(()=>({}));
      throw new Error(errBody.error || ("Transcribe failed: "+r.status));
    }
    const data = await r.json().catch(()=>({}));
    st.captions = (data.segments||[]).length ? data.segments : (data.text ? [{start:0,end:Math.min(clipDur,3),text:data.text}] : []);
    if(!st.captions.length){ throw new Error("No speech detected"); }
    toast("Captions ready");
  } catch(e){
    const script = (st.script||"").trim();
    if(script){
      const parts = script.split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(Boolean);
      const per = clipDur / Math.max(1, parts.length);
      st.captions = parts.map((t,i)=>({ start: +(i*per).toFixed(2), end: +((i+1)*per).toFixed(2), text: t }));
      toast("Captions from script (transcription offline)");
    } else {
      toast((e && e.message) ? e.message : "Auto-caption unavailable — add a script for fallback captions");
    }
  }
  st.transcribing = false; render();
};

// Voiceover
window.csVoiceStart = async () => {
  if(window.__cs_voice) return;
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio:true });
    const rec = new MediaRecorder(s);
    const chunks = [];
    const startedAt = S.studio.playhead;
    const t0 = performance.now();
    rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      s.getTracks().forEach(t=>t.stop());
      const blob = new Blob(chunks, { type:'audio/webm' });
      chunks.length = 0;
      const url = URL.createObjectURL(blob);
      S.studio.audioTracks = S.studio.audioTracks || [];
      S.studio.audioTracks.push({ id:"a"+Date.now(), name:"Voiceover", url, blob, startMs:startedAt, durMs:Math.round(performance.now()-t0) });
      render();
    };
    window.__cs_voice = { rec, s };
    rec.start();
    const lbl = document.getElementById("cs-voice-lbl"); if(lbl) lbl.textContent = "Recording…";
    document.getElementById('cs-voice-btn')?.classList.add('rec');
  } catch(e){ toast("Mic permission denied"); }
};
window.csVoiceStop = () => {
  const v = window.__cs_voice; if(!v) return;
  try { v.rec.stop(); } catch(_){}
  const lbl = document.getElementById("cs-voice-lbl"); if(lbl) lbl.textContent = "Hold to record";
  document.getElementById('cs-voice-btn')?.classList.remove('rec');
  window.__cs_voice = null;
};

// ─── Undo / redo (now actually functional for edits) ───────────────────────
function csSnapshot(){
  const st = S.studio;
  return JSON.stringify({
    clips: st.clips.map(c=>({ id:c.id, url:c.url, dur:c.dur, inMs:c.inMs, outMs:c.outMs, kind:c.kind, source:c.source })),
    overlays: st.overlays,
    captions: st.captions,
    capStyle: st.capStyle,
    filter: st.filter, adjust: st.adjust, effect: st.effect, opacity: st.opacity,
  });
}
function csRestore(json){
  const st = S.studio, snap = JSON.parse(json);
  // Keep the live Blob references — they are not serialisable.
  const blobs = new Map(st.clips.map(c=>[c.id, c.blob]));
  st.clips = snap.clips.map(c => ({ ...c, blob: blobs.get(c.id) || null }));
  st.overlays = snap.overlays; st.captions = snap.captions; st.capStyle = snap.capStyle;
  st.filter = snap.filter; st.adjust = snap.adjust; st.effect = snap.effect; st.opacity = snap.opacity;
  if(!st.clips.some(c=>c.id===st.selectedId)){ st.selectedId = st.clips[0]?.id||null; st.selectedType = st.selectedId?'video':null; }
  render();
}
function csPushHistory(){
  const st = S.studio;
  st.history = st.history || [];
  st.history.push(csSnapshot());
  if(st.history.length>30) st.history.shift();
  st.future = [];
}
window.csUndo = () => {
  const st = S.studio;
  if(!st.history || !st.history.length){ toast("Nothing to undo"); return; }
  st.future = st.future || [];
  st.future.push(csSnapshot());
  csRestore(st.history.pop());
};
window.csRedo = () => {
  const st = S.studio;
  if(!st.future || !st.future.length){ toast("Nothing to redo"); return; }
  st.history.push(csSnapshot());
  csRestore(st.future.pop());
};

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORT
//  Rewritten for mobile memory safety. See CHANGELOG at the bottom.
// ═══════════════════════════════════════════════════════════════════════════
window.csCancelExport = () => { if(window.__csExport) window.__csExport.cancelled = true; };

window.csExport = async () => {
  const st = S.studio;
  if(!st.clips.length){ toast("Nothing to export"); return; }
  if(st.exporting) return;
  csPause();
  csStopEngine();                       // stop preview decoding during export
  const preview = [csActiveVideo(), csIdleVideo()];
  preview.forEach(v => { if(v){ try{ v.pause(); v.removeAttribute('src'); v.load(); v.dataset.cid=''; }catch(_){} } });

  st.exporting = true; st.exportPct = 0; render();
  let wake = null;
  try { wake = await navigator.wakeLock?.request?.('screen'); } catch(_){}
  try {
    const out = await csComposeWithOverlays(st.clips, st.overlays, st.captions, st.audioTracks, st.filter, st.adjust, st.capStyle);
    if(out){
      _shareOrDownload(out, `creatorpulse-${Date.now()}.${out.type.includes("mp4")?"mp4":"webm"}`);
      toast("Exported");
    } else toast("Export cancelled");
  } catch(e){
    console.error('[export]', e);
    toast(e && e.message === 'nomem' ? "Ran out of memory — try trimming or exporting fewer clips" : "Export failed");
  } finally {
    try { wake && wake.release(); } catch(_){}
    st.exporting = false; st.exportPct = 0;
    window.__csExport = null;
    render();
    setTimeout(()=>csLoadCurrent(true), 60);
  }
};

function csExportProgress(pct){
  S.studio.exportPct = pct;
  const arc = document.getElementById('cs-exp-arc');
  const lbl = document.getElementById('cs-exp-pct');
  if(arc) arc.setAttribute('stroke-dashoffset', String(100.5*(1-pct/100)));
  if(lbl) lbl.textContent = Math.round(pct)+'%';
}

async function csComposeWithOverlays(clips, overlays, captions, audioTracks, filterId, adjust, capStyle){
  const ctl = window.__csExport = { cancelled:false };
  const { W, H, fps, bitrate } = CS_DEVICE;

  // ── Shared, reused resources (created once, destroyed once) ──────────────
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d", { alpha:false, desynchronized:true });
  const canFilter = typeof ctx.filter === "string";

  // ONE video element for the whole timeline. Previously a fresh <video> was
  // created per clip and never released, so every clip left a decoder +
  // its decoded frame buffers alive until GC — the crash path on Android.
  const vid = document.createElement("video");
  vid.playsInline = true; vid.preload = "auto"; vid.crossOrigin = "anonymous";
  vid.setAttribute("playsinline",""); vid.setAttribute("webkit-playsinline","");

  const AC = window.AudioContext || window.webkitAudioContext;
  const actx = new AC();
  const dest = actx.createMediaStreamDestination();

  // createMediaElementSource can legally be called only ONCE per element.
  // With a single reused element we create a single node for the whole export.
  let vSrc = null, vGain = null;
  try {
    vSrc = actx.createMediaElementSource(vid);
    vGain = actx.createGain();
    vGain.gain.value = Math.min(1.5, (S.studio.clipVolume==null?100:S.studio.clipVolume)/100);
    vSrc.connect(vGain).connect(dest);
  } catch(_){}

  // Music / voiceover tracks: element + gain, all tracked for teardown.
  const musicEls = [];
  const musicGain = actx.createGain();
  musicGain.gain.value = Math.min(2, (S.studio.volume==null?100:S.studio.volume)/100);
  musicGain.connect(dest);

  // Frame-gated capture: captureStream(0) means the encoder receives exactly
  // the frames we hand it, instead of sampling the canvas on every compositor
  // tick. Fewer encodes = less heat, less memory, no runaway queue.
  let stream, manualFrames = false;
  try {
    stream = cv.captureStream(0);
    const tr = stream.getVideoTracks()[0];
    manualFrames = !!(tr && typeof tr.requestFrame === "function");
    if(!manualFrames){ stream.getTracks().forEach(t=>t.stop()); stream = cv.captureStream(fps); }
  } catch(_){ stream = cv.captureStream(fps); }
  dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));

  const mime = csPickMime();
  const rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:bitrate, audioBitsPerSecond:128000 });

  // Chunked recording. rec.start() with no timeslice buffers the ENTIRE
  // encoded video inside the recorder before emitting it — a 2-minute 1080p
  // clip is hundreds of MB held in one allocation. A timeslice flushes small
  // Blobs (backed by disk, not JS heap) as we go.
  let chunks = [];
  let bytes = 0;
  const MAX_BYTES = 320 * 1024 * 1024;   // hard safety valve
  rec.ondataavailable = e => {
    if(e.data && e.data.size){
      chunks.push(e.data); bytes += e.data.size;
      if(bytes > MAX_BYTES){ ctl.cancelled = true; ctl.reason = 'nomem'; }
    }
  };
  const stopped = new Promise(r => { rec.onstop = r; });

  const filterCss = (CS_FILTERS.find(f=>f.id===filterId)||CS_FILTERS[0]).filter;
  const adj = adjust || {brightness:100,contrast:100,saturation:100,warmth:0};
  const adjFilter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) hue-rotate(${adj.warmth*0.36}deg)`;
  const fullFilter = filterCss === 'none' ? adjFilter : `${filterCss} ${adjFilter}`;

  const totalMs = clips.reduce((n,c)=>n+Math.max(0,c.outMs-c.inMs), 0) || 1;
  let globalMs = 0;

  const drawFrame = (media, mw, mh, gMs) => {
    const ar = (mw||W)/(mh||H), tar = W/H;
    let dw=W, dh=H, dx=0, dy=0;
    if(ar > tar){ dh=H; dw=H*ar; dx=(W-dw)/2; } else { dw=W; dh=W/ar; dy=(H-dh)/2; }
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,W,H);
    if(canFilter) ctx.filter = fullFilter;
    try { ctx.drawImage(media, dx, dy, dw, dh); } catch(_){}
    if(canFilter) ctx.filter = "none";
    for(const o of overlays){
      if(gMs < o.startMs || gMs > o.endMs) continue;
      csDrawOverlay(ctx, o, W, H);
    }
    for(const cap of (captions||[])){
      const gs=(cap.start||0)*1000, ge=((cap.end!=null?cap.end:(cap.start||0)+2)*1000);
      if(gMs>=gs && gMs<=ge){ csDrawCaption(ctx, cap.text||"", W, H); break; }
    }
    if(manualFrames){ try { stream.getVideoTracks()[0].requestFrame(); } catch(_){} }
  };

  try {
    rec.start(1000);

    // Kick off music/voiceover on the shared graph.
    for(const a of (audioTracks||[])){
      try {
        const el = new Audio(); el.src = a.url; el.preload = "auto"; el.crossOrigin = "anonymous";
        const src = actx.createMediaElementSource(el);
        src.connect(musicGain);
        musicEls.push({ el, src, t: setTimeout(()=>el.play().catch(()=>{}), Math.max(0, a.startMs||0)) });
      } catch(_){}
    }

    for(const c of clips){
      if(ctl.cancelled) break;
      const clipMs = Math.max(0, c.outMs - c.inMs);

      if(c.kind === 'image'){
        // Still image: decode once, hold frames for the clip's duration.
        const img = await csLoadImage(c.url).catch(()=>null);
        const startWall = performance.now();
        const frameMs = 1000/fps;
        while(!ctl.cancelled && performance.now()-startWall < clipMs){
          const gMs = globalMs + (performance.now()-startWall);
          if(img) drawFrame(img, img.naturalWidth, img.naturalHeight, gMs);
          csExportProgress(Math.min(99, (gMs/totalMs)*100));
          await csSleep(frameMs);
        }
        if(img && img.close) try { img.close(); } catch(_){}
        globalMs += clipMs;
        continue;
      }

      // ── Video clip on the shared element ──────────────────────────────────
      await csSetSource(vid, c.url);
      await csSeek(vid, c.inMs/1000);
      const endT = c.outMs/1000;
      const startGlobal = globalMs;

      await vid.play().catch(()=>{});
      await csRunClip(vid, endT, ctl, (t) => {
        const gMs = startGlobal + Math.max(0, (t - c.inMs/1000)*1000);
        drawFrame(vid, vid.videoWidth, vid.videoHeight, gMs);
        csExportProgress(Math.min(99, (gMs/totalMs)*100));
      }, fps);

      globalMs = startGlobal + clipMs;
      try { vid.pause(); } catch(_){}
    }
  } finally {
    // ── Teardown, always. Every one of these was previously leaked. ─────────
    try { if(rec.state !== 'inactive') rec.stop(); } catch(_){}
    await stopped.catch(()=>{});
    for(const m of musicEls){
      clearTimeout(m.t);
      try { m.el.pause(); } catch(_){}
      try { m.src.disconnect(); } catch(_){}
      try { m.el.removeAttribute('src'); m.el.load(); } catch(_){}
    }
    musicEls.length = 0;
    try { vSrc && vSrc.disconnect(); } catch(_){}
    try { vGain && vGain.disconnect(); } catch(_){}
    try { musicGain.disconnect(); } catch(_){}
    try { vid.pause(); vid.removeAttribute('src'); vid.load(); } catch(_){}
    try { stream.getTracks().forEach(t=>t.stop()); } catch(_){}
    try { dest.disconnect(); } catch(_){}
    try { await actx.close(); } catch(_){}
    // Drop the backing store of the composite canvas explicitly: a 1080x1920
    // RGBA surface is ~8 MB and Safari/Android keep it alive with the element.
    cv.width = cv.height = 1;
  }

  if(ctl.cancelled && ctl.reason === 'nomem'){ chunks = []; throw new Error('nomem'); }
  if(ctl.cancelled){ chunks = []; return null; }

  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  chunks.length = 0;              // release chunk references right away
  chunks = null;
  csExportProgress(100);
  return blob;
}

// Drive one clip to its out-point. Prefers requestVideoFrameCallback, which
// fires once per *decoded* frame — no wasted draws, and unlike rAF it isn't
// tied to display refresh (a 60 Hz rAF was compositing 2x the frames needed).
function csRunClip(v, endT, ctl, onFrame, fps){
  return new Promise(resolve => {
    let done = false;
    const minGap = 1000/fps - 2;
    let last = 0;
    const finish = () => { if(done) return; done = true; clearInterval(guard); resolve(); };
    const step = (now) => {
      if(done) return;
      if(ctl.cancelled || v.ended || v.currentTime >= endT) return finish();
      if(!last || now - last >= minGap){ last = now; onFrame(v.currentTime); }
      schedule();
    };
    const schedule = () => {
      if(done) return;
      if(v.requestVideoFrameCallback) v.requestVideoFrameCallback((now)=>step(now));
      else requestAnimationFrame((now)=>step(now));
    };
    // Watchdog: if decoding stalls (backgrounded tab, codec hiccup) we finish
    // instead of hanging the export forever with the recorder still running.
    let stallTicks = 0, lastT = -1;
    const guard = setInterval(() => {
      if(done) return;
      if(ctl.cancelled) return finish();
      if(v.currentTime === lastT && !v.paused) { if(++stallTicks > 12) finish(); }
      else { stallTicks = 0; lastT = v.currentTime; }
      if(v.paused && !v.ended && !ctl.cancelled) v.play().catch(()=>{});
    }, 250);
    schedule();
  });
}

function csSetSource(v, url){
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error('decode')); };
    const cleanup = () => { v.removeEventListener('loadedmetadata', ok); v.removeEventListener('error', bad); };
    v.addEventListener('loadedmetadata', ok, {once:true});
    v.addEventListener('error', bad, {once:true});
    v.src = url; v.load();
    setTimeout(()=>{ if(v.readyState>=1) ok(); }, 8000);
  });
}
function csSeek(v, t){
  return new Promise(resolve => {
    if(Math.abs(v.currentTime - t) < 0.02) return resolve();
    const ok = () => { v.removeEventListener('seeked', ok); resolve(); };
    v.addEventListener('seeked', ok, {once:true});
    try { v.currentTime = t; } catch(_){ resolve(); }
    setTimeout(resolve, 3000);
  });
}
function csSleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function csLoadImage(url){
  return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
}

// ─── Canvas renderers — the export-side twins of the DOM preview ───────────
function csDrawOverlay(ctx, o, W, H){
  const f = CS_FONTS.find(x=>x.id===o.font)||CS_FONTS[0];
  const size = Math.round(o.size * (W/720));
  ctx.save();
  ctx.font = `${f.weight} ${size}px ${f.css}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const x = o.x/100 * W, y = o.y/100 * H;
  const metrics = ctx.measureText(o.text);
  const padX = size*0.35, padY = size*0.25;
  if(o.style==='bg'){
    ctx.fillStyle = o.bg||"#000";
    csRoundRect(ctx, x - metrics.width/2 - padX, y - size/2 - padY, metrics.width + padX*2, size + padY*2, size*0.16);
  } else if(o.style==='rev-bg'){
    ctx.fillStyle = o.color;
    csRoundRect(ctx, x - metrics.width/2 - padX, y - size/2 - padY, metrics.width + padX*2, size + padY*2, size*0.16);
    ctx.fillStyle = o.bg||"#000"; ctx.fillText(o.text, x, y); ctx.restore(); return;
  }
  if(o.style==='outline'){ ctx.lineJoin='round'; ctx.lineWidth = size*0.09; ctx.strokeStyle = "#000"; ctx.strokeText(o.text, x, y); }
  if(o.style==='rev-outline'){ ctx.lineJoin='round'; ctx.lineWidth = size*0.09; ctx.strokeStyle = o.color; ctx.strokeText(o.text, x, y); ctx.fillStyle = "#000"; ctx.fillText(o.text, x, y); ctx.restore(); return; }
  if(o.style==='shadow'){ ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = size*0.3; ctx.shadowOffsetY = size*0.1; }
  ctx.fillStyle = o.color; ctx.fillText(o.text, x, y);
  ctx.restore();
}

// Caption renderer reads the SAME resolved style object as the preview,
// so the preset picked in the sheet is exactly what lands in the file.
function csDrawCaption(ctx, text, W, H){
  const s = csCapStyle();
  const size = Math.round(s.size * (W/720));
  const str = s.upper ? String(text).toUpperCase() : String(text);
  ctx.save();
  ctx.font = `${s.fontWeight} ${size}px ${s.fontCss}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const cx = W*(s.x/100), cy = H*(s.y/100);
  const maxW = W*0.78;

  const words = str.split(/\s+/);
  const lines = []; let line = "";
  for(const w of words){
    const test = line ? line+" "+w : w;
    if(ctx.measureText(test).width > maxW && line){ lines.push(line); line = w; }
    else line = test;
  }
  if(line) lines.push(line);

  const lineH = size*1.25;
  const blockH = lines.length*lineH;
  const widest = Math.max(...lines.map(l=>ctx.measureText(l).width));
  const padX = size*(s.box==='tight'?0.42:0.5), padY = size*(s.box==='tight'?0.16:0.28);

  if(s.bg && s.box !== 'none'){
    ctx.fillStyle = s.bg;
    csRoundRect(ctx, cx - widest/2 - padX, cy - blockH/2 - padY, widest + padX*2, blockH + padY*2, size*s.radius);
  }
  lines.forEach((l,i) => {
    const ly = cy - blockH/2 + lineH*i + lineH/2;
    if(s.shadow){ ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = size*0.28; ctx.shadowOffsetY = size*0.06; }
    if(s.stroke){
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, size*0.12);
      ctx.strokeStyle = s.stroke;
      ctx.strokeText(l, cx, ly);
    }
    ctx.fillStyle = s.color;
    ctx.fillText(l, cx, ly);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  });
  ctx.restore();
}
function csRoundRect(ctx, x, y, w, h, r){
  r = Math.max(0, Math.min(r, Math.min(w,h)/2));
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(x,y,w,h,r);
  else {
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  ctx.fill();
}

// Legacy single-timeline export kept as an alias so old call sites still work.
window.studioExport = () => window.csExport();

// Release the preview engine when the Create tab is left, and pause decoding
// when the app is backgrounded (Android kills tabs that decode in background).
document.addEventListener('visibilitychange', () => {
  if(document.hidden && S.studio && S.studio.mode === 'editor' && !S.studio.exporting){
    csPause(); csStopEngine();
  } else if(!document.hidden && S.studio && S.studio.mode === 'editor'){
    csEnsureEngine();
  }
});

// Boot camera stage when switching to the Create tab.
(function(){
  const _origSetTab = window.setTab;
  window.setTab = (t) => {
    if(t !== 'create') csStopEngine();
    _origSetTab && _origSetTab(t);
    if(t==='create' && S.studio && S.studio.mode==='camera'){ setTimeout(()=>window.studioInitStage&&window.studioInitStage(), 60); }
    if(t==='create' && S.studio && S.studio.mode==='editor'){ setTimeout(()=>{ csLoadCurrent(true); }, 60); }
  };
})();

/* ───────────────────────── CHANGELOG (v2) ─────────────────────────────────
EXPORT
  - one reusable <video> + one AudioContext for the whole timeline
    (was: a new <video> and a new MediaElementSource per clip, never released)
  - MediaRecorder.start(1000) chunked output (was: one giant in-memory buffer)
  - captureStream(0) + requestFrame() frame gating (was: 30fps auto-capture
    sampling every compositor tick regardless of decoded frames)
  - resolution/bitrate chosen from hardwareConcurrency + deviceMemory
    (was: always 1080x1920 @ 6 Mbps)
  - requestVideoFrameCallback draw loop with a stall watchdog (was: rAF that
    silently stopped when the tab was backgrounded, leaving the recorder live)
  - guaranteed teardown in finally{}: nodes disconnected, elements unloaded,
    tracks stopped, AudioContext closed, canvas backing store freed
  - 320 MB safety valve + Cancel button + wake lock + progress ring
PLAYBACK
  - single rAF engine owns playhead/overlays/captions; render() is no longer
    called during playback or scrubbing (that teardown caused the stutter)
  - double-buffered video elements: next clip is preloaded and seeked, and the
    cut is a class swap instead of a src reload
  - scrubbing coalesces seeks to one per frame and uses fastSeek()
  - playhead moves via transform (compositor) instead of left (layout)
  - CSS filters apply to the media layer only, not the whole stage
CAPTIONS
  - 9 style presets + colour/size/position overrides
  - csCapStyle() is the single source of truth; csCapCss() (preview) and
    csDrawCaption() (export) both read it → no preview/export mismatch
TEXT
  - pinch-to-resize and a corner resize handle, both live-updating
UI
  - shared sheet chrome, scrim, drag-to-dismiss, fixed tool-row height so
    switching tools no longer shifts the layout
─────────────────────────────────────────────────────────────────────────── */
