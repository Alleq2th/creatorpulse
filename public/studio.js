// ─── CREATE STUDIO ─────────────────────────────────────────────────────────
// Teleprompter + camera + auto-captions + trim + export.
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
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p[name]||""}</svg>`;
}

// ─── CAPCUT-STYLE CREATE STUDIO ────────────────────────────────────────────
function pageCreate(){
  const st = S.studio || (S.studio = {
    mode:"chooser", // chooser | camera | editor
    projectName:"New project",
    script:"", promptSpeed:60, mirror:true, running:false, showPrompter:false,
    camReady:false, facing:"user", micOn:true, flash:false, zoom:1, speed:1, countdown:0,
    clips:[], selectedId:null, selectedType:null, // type: video|text|caption|audio
    overlays:[], // text overlays {id,text,font,style,color,size,x,y,startMs,endMs}
    captions:[], audioTracks:[], filter:"none",
    playhead:0, playing:false, totalMs:0, exporting:false,
    sheet:null, // 'text' | 'filter' | 'audio' | 'adjust' | 'captions' | 'voice'
    editText:null, editTextTab:"font",
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
        <button class="cs-side-btn ${st.showPrompter?'on':''}" onclick="S.studio.showPrompter=!S.studio.showPrompter;render()">${CS_ICON('text')}<span class="lbl">Prompter</span></button>
        <button class="cs-side-btn" onclick="csCycleCountdown()">${CS_ICON('timer')}<span class="lbl">${st.countdown?st.countdown+'s':'Off'}</span></button>
        <button class="cs-side-btn ${st.speed!==1?'on':''}" onclick="csCycleSpeed()">${CS_ICON('sparkle')}<span class="lbl">${st.speed}×</span></button>
        <button class="cs-side-btn" onclick="csOpenMusic()">${CS_ICON('music')}<span class="lbl">Music</span></button>
        <button class="cs-side-btn ${st.micOn?'':'on'}" onclick="studioMic()">${CS_ICON('voice')}<span class="lbl">${st.micOn?'Mic on':'Muted'}</span></button>
      </div>
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

function edView(st){
  const cur = st.clips.find(c=>c.id===st.selectedId && st.selectedType==='video') || null;
  const total = csTotalMs();
  const px = 0.06; // px per ms (60px per second)
  const playX = st.playhead * px;
  return `<div class="cs-fs">
    <div class="cs-topbar">
      <div class="l">
        <button class="cs-x" onclick="csConfirmExitEditor()">${CS_ICON('close')}</button>
        <div class="cs-title">${esc(st.projectName)} <span class="chev">▼</span></div>
      </div>
      <div class="r">
        <span class="cs-badge">2K</span>
        <button class="cs-next" ${st.clips.length&&!st.exporting?'':'disabled'} onclick="csExport()">${st.exporting?'Exporting…':'Export ›'}</button>
      </div>
    </div>
    <div class="cs-ed-stage" id="cs-ed-stage" style="filter:${csFilterCss(st.filter)}">
      <video id="cs-ed-video" playsinline ${st.playing?'':''} style="width:100%;height:100%;object-fit:contain" onended="csOnClipEnded()" ontimeupdate="csOnTime()"></video>
      ${st.overlays.filter(o=>st.playhead>=o.startMs&&st.playhead<=o.endMs).map(o=>`
        <div class="cs-ed-overlay ${st.selectedId===o.id&&st.selectedType==='text'?'sel':''}"
          data-ovid="${o.id}"
          style="left:${o.x}%;top:${o.y}%;font-family:${csFontById(o.font).css};font-weight:${csFontById(o.font).weight};font-size:${o.size}px;color:${o.color};${csStyleCss(o.style,o.color,o.bg)}"
          onclick="csSelectOverlay('${o.id}')">${esc(o.text)}${st.selectedId===o.id&&st.selectedType==='text'?`<button class="ov-del" onclick="event.stopPropagation();csDeleteOverlay('${o.id}')">×</button>`:''}</div>
      `).join('')}
      <button class="cs-ed-play" onclick="csTogglePlay()">${CS_ICON(st.playing?'pause':'play')}</button>
      <div class="cs-ed-time"><span class="cur">${_fmtTs(st.playhead/1000)}</span><span class="tot"> / ${_fmtTs(total/1000)}</span></div>
      <div class="cs-ed-undo">
        <button onclick="csUndo()">${CS_ICON('undo')}</button>
        <button onclick="csRedo()">${CS_ICON('redo')}</button>
      </div>
    </div>
    <div class="cs-ed-tracks" id="cs-ed-tracks" onclick="csClickTrack(event)">
      <div class="cs-playhead" style="left:${88+playX}px"></div>
      ${csRenderTrack('video',st,px)}
      ${csRenderTrack('text',st,px)}
      ${csRenderTrack('caption',st,px)}
      ${csRenderTrack('audio',st,px)}
    </div>
    <div class="cs-ed-toolbar">
      ${st.selectedId ? `
      <div class="cs-tb-row">
        <button class="cs-tb" onclick="csSplit()">${CS_ICON('split')}<span>Split</span></button>
        <button class="cs-tb" onclick="csOpenSheet('filter')">${CS_ICON('filter')}<span>Filters</span></button>
        <button class="cs-tb" onclick="csOpenSheet('adjust')">${CS_ICON('adjust')}<span>Adjust</span></button>
        <button class="cs-tb" onclick="csOpenSheet('effects')">${CS_ICON('effects')}<span>Effects</span></button>
        <button class="cs-tb" onclick="csDuplicate()">${CS_ICON('dup')}<span>Duplicate</span></button>
        <button class="cs-tb" onclick="csCopy()">${CS_ICON('copy')}<span>Copy</span></button>
        <button class="cs-tb" onclick="csOpenSheet('opacity')">${CS_ICON('opacity')}<span>Opacity</span></button>
        <button class="cs-tb" onclick="csOpenSheet('mask')">${CS_ICON('mask')}<span>Mask</span></button>
        <button class="cs-tb" onclick="csReplaceClick()">${CS_ICON('replace')}<span>Replace</span></button>
        <button class="cs-tb danger" onclick="csDeleteSelected()">${CS_ICON('trash')}<span>Delete</span></button>
      </div>` : ''}
      <div class="cs-tb-row">
        <button class="cs-tb" onclick="csOpenSheet('audio')">${CS_ICON('music')}<span>Audio</span></button>
        <button class="cs-tb" onclick="csAddText()">${CS_ICON('text')}<span>Text</span></button>
        <button class="cs-tb" onclick="csOpenSheet('voice')">${CS_ICON('voice')}<span>Voice</span></button>
        <button class="cs-tb" onclick="csOpenSheet('captions')">${CS_ICON('cc')}<span>Captions</span></button>
        <button class="cs-tb" onclick="csOpenSheet('filter')">${CS_ICON('filter')}<span>Filters</span></button>
        <button class="cs-tb" onclick="csOpenSheet('adjust')">${CS_ICON('adjust')}<span>Adjust</span></button>
        <button class="cs-tb" onclick="csOpenSheet('sticker')">${CS_ICON('sparkle')}<span>Stickers</span></button>
        <button class="cs-tb" onclick="csAddClipClick()">${CS_ICON('plus')}<span>Add clip</span></button>
      </div>
    </div>
    ${csRenderSheet(st)}
    <input type="file" id="cs-add-clip" accept="video/*,image/*" multiple style="display:none" onchange="csHandleUpload(event, true)"/>
    <input type="file" id="cs-replace-clip" accept="video/*,image/*" style="display:none" onchange="csHandleReplace(event)"/>
  </div>`;
}

function csFontById(id){ return CS_FONTS.find(f=>f.id===id) || CS_FONTS[0]; }
function csFilterCss(id){ return (CS_FILTERS.find(f=>f.id===id)||CS_FILTERS[0]).filter; }
function csStyleCss(style,color,bg){
  bg = bg || "#000";
  if(style==="outline")     return `-webkit-text-stroke:2px #000;text-shadow:none;`;
  if(style==="rev-outline") return `color:#000 !important;-webkit-text-stroke:2px ${color};`;
  if(style==="bg")          return `background:${bg};padding:6px 12px;border-radius:6px;`;
  if(style==="rev-bg")      return `background:${color};color:${bg} !important;padding:6px 12px;border-radius:6px;`;
  if(style==="shadow")      return `text-shadow:2px 4px 8px rgba(0,0,0,.7);`;
  return ``;
}

function csTotalMs(){
  const st = S.studio;
  let vid = st.clips.reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs)), 0);
  const ovEnd = st.overlays.reduce((n,o)=>Math.max(n,o.endMs), 0);
  return Math.max(vid, ovEnd, 1000);
}

function csRenderTrack(kind, st, px){
  if(kind==='video'){
    if(!st.clips.length){
      return `<div class="cs-track"><div style="padding-left:88px;color:var(--mu);font-size:11px">No clips</div></div>`;
    }
    let acc = 88;
    const chunks = st.clips.map((c,i) => {
      const dur = Math.max(120, c.outMs - c.inMs);
      const w = Math.max(40, dur*px);
      const el = `<div class="cs-track-clip cs-track-video ${st.selectedId===c.id&&st.selectedType==='video'?'sel':''}" style="width:${w}px;margin-left:${i===0?0:2}px" onclick="csSelect('${c.id}','video')">Clip ${i+1}</div>`;
      acc += w+2;
      return el;
    }).join('');
    return `<div class="cs-track"><div style="width:80px;flex:0 0 auto;color:#8C8D9A;font:600 10px var(--sans);padding-left:8px">Video</div>${chunks}<button class="cs-track-add" onclick="csAddClipClick()">+</button></div>`;
  }
  if(kind==='text'){
    const items = st.overlays.map(o=>{
      const w = Math.max(40, (o.endMs-o.startMs)*px);
      const x = 88 + o.startMs*px;
      return `<div class="cs-track-clip cs-track-text ${st.selectedId===o.id&&st.selectedType==='text'?'sel':''}" style="position:absolute;left:${x}px;width:${w}px" onclick="csSelect('${o.id}','text')">${esc(o.text.slice(0,20))}</div>`;
    }).join('');
    return `<div class="cs-track" style="position:relative"><div style="width:80px;flex:0 0 auto;color:#8C8D9A;font:600 10px var(--sans);padding-left:8px">Text</div>${items||'<div style="color:var(--mu2);font:600 10px var(--sans);padding-left:8px">Tap Text to add</div>'}</div>`;
  }
  if(kind==='caption'){
    const items = (st.captions||[]).map((c,i)=>{
      const w = Math.max(40, ((c.end||c.start+2)-c.start)*1000*px);
      const x = 88 + c.start*1000*px;
      return `<div class="cs-track-clip cs-track-caption" style="position:absolute;left:${x}px;width:${w}px">${esc((c.text||'').slice(0,16))}</div>`;
    }).join('');
    return `<div class="cs-track" style="position:relative"><div style="width:80px;flex:0 0 auto;color:#8C8D9A;font:600 10px var(--sans);padding-left:8px">Captions</div>${items||'<div style="color:var(--mu2);font:600 10px var(--sans);padding-left:8px">Auto-caption available</div>'}</div>`;
  }
  if(kind==='audio'){
    const items = (st.audioTracks||[]).map((a,i)=>{
      const w = Math.max(40, (a.durMs||10000)*px);
      const x = 88 + (a.startMs||0)*px;
      return `<div class="cs-track-clip cs-track-audio" style="position:absolute;left:${x}px;width:${w}px">${esc(a.name||'Track')}</div>`;
    }).join('');
    return `<div class="cs-track" style="position:relative"><div style="width:80px;flex:0 0 auto;color:#8C8D9A;font:600 10px var(--sans);padding-left:8px">Audio</div>${items||'<div style="color:var(--mu2);font:600 10px var(--sans);padding-left:8px">Add music</div>'}</div>`;
  }
  return '';
}


// ── Live preview helpers (no re-render → no video reload flicker) ───────────
function csApplyPreview(){
  try {
    const st = S.studio; if(!st) return;
    const stage = document.getElementById('cs-ed-stage');
    const vid   = document.getElementById('cs-ed-video');
    if(!stage) return;
    const filt = csFilterCss(st.filter);
    const a = st.adjust || {brightness:100,contrast:100,saturation:100,warmth:0};
    const adjFilter = `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) hue-rotate(${a.warmth*0.36}deg)`;
    const combined = (filt && filt !== 'none') ? `${filt} ${adjFilter}` : adjFilter;
    stage.style.filter = combined;
    // Effect class (applies CSS animations)
    stage.classList.remove('fx-glitch','fx-shake','fx-vignette','fx-grain','fx-vhs','fx-chroma','fx-flash','fx-zoom');
    if(st.effect && st.effect !== 'none') stage.classList.add('fx-'+st.effect);
    // Opacity applies to the media only
    if(vid) vid.style.opacity = ((st.opacity==null?100:st.opacity)/100);
  } catch(_){}
}
function csUpdateSliderLabel(input, key){
  const lbl = document.querySelector(`[data-adj-val="${key}"]`);
  if(lbl) lbl.textContent = input.value;
}
window.csPickFilter = (id, btn) => {
  S.studio.filter = id;
  // Update the "on" class in place — no re-render.
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
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Effects</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div class="cs-filter-grid">
      ${CS_EFFECTS.map(f=>`<button class="cs-filter-cell cs-fx-cell ${cur===f.id?'on':''}" data-fxid="${f.id}" onclick="csPickEffect('${f.id}',this)">
        <div class="ph fx-preview fx-preview-${f.id}"></div><div class="n">${f.name}</div>
      </button>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--mu);margin-top:12px;line-height:1.5">Effects are burned into export.</div>
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
  if(st.sheet==='mask') return csGenericSheet('Mask','Mask presets — coming soon.',st);
  if(st.sheet==='effects') return csEffectsSheet(st);
  if(st.sheet==='sticker') return csGenericSheet('Stickers','Sticker pack — coming soon.',st);
  return '';
}

function csTextSheet(st){
  const o = st.editText;
  const tab = st.editTextTab;
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Text</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <textarea class="cs-text-input" placeholder="Type text…" oninput="csEditOverlayField('text',this.value)">${esc(o.text)}</textarea>
    <div class="cs-sheet-tabs">
      ${['font','style','color','size'].map(t=>`<button class="${tab===t?'on':''}" onclick="S.studio.editTextTab='${t}';render()">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
    </div>
    ${tab==='font' ? `<div class="cs-font-grid">
      ${CS_FONTS.map(f=>`<button class="cs-font-cell ${o.font===f.id?'on':''}" style="font-family:${f.css};font-weight:${f.weight}" onclick="csEditOverlayField('font','${f.id}')">${f.name}</button>`).join('')}
    </div>` : ''}
    ${tab==='style' ? `<div class="cs-style-grid">
      ${CS_STYLES.map(s=>`<button class="cs-style-cell ${o.style===s.id?'on':''}" style="${csStyleCss(s.id,o.color,'#000')}" onclick="csEditOverlayField('style','${s.id}')">${s.name}</button>`).join('')}
    </div>` : ''}
    ${tab==='color' ? `<div class="cs-color-row">
      ${CS_COLORS.map(c=>`<button class="cs-color-dot ${o.color===c?'on':''}" style="background:${c}" onclick="csEditOverlayField('color','${c}')"></button>`).join('')}
    </div>` : ''}
    ${tab==='size' ? `<div style="padding:8px 4px"><div style="color:#8C8D9A;font-size:12px">Size: ${o.size}px</div>
      <input class="cs-slider" type="range" min="14" max="120" value="${o.size}" oninput="csEditOverlayField('size',+this.value)"/>
      <div style="color:#8C8D9A;font-size:12px;margin-top:12px">Duration on screen</div>
      <input class="cs-slider" type="range" min="500" max="${csTotalMs()}" value="${o.endMs-o.startMs}" oninput="csEditOverlayDuration(+this.value)"/>
      <div style="color:#8C8D9A;font-size:11px">${((o.endMs-o.startMs)/1000).toFixed(1)}s</div>
    </div>` : ''}
  </div>`;
}

function csFilterSheet(st){
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Filters</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div class="cs-filter-grid">
      ${CS_FILTERS.map(f=>`<button class="cs-filter-cell ${st.filter===f.id?'on':''}" data-fid="${f.id}" onclick="csPickFilter('${f.id}',this)">
        <div class="ph" style="filter:${f.filter}"></div><div class="n">${f.name}</div>
      </button>`).join('')}
    </div>
  </div>`;
}

function csAudioSheet(st){
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Audio</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <label class="btn bs" style="width:100%;padding:14px;justify-content:center;cursor:pointer;margin-bottom:12px">${CS_ICON('upload')} Upload audio file
      <input type="file" accept="audio/*" style="display:none" onchange="csAddAudio(event)"/>
    </label>
    <div style="font:700 12px var(--sans);color:#8C8D9A;margin:14px 0 8px">Volume</div>
    <input class="cs-slider" type="range" min="0" max="200" value="${(st.volume||100)}" oninput="S.studio.volume=+this.value"/>
    <div style="font-size:11px;color:var(--mu);margin-top:6px">${(st.audioTracks||[]).length} track${(st.audioTracks||[]).length===1?'':'s'} added.</div>
  </div>`;
}

function csCaptionsSheet(st){
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Captions</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <button class="btn bp" style="width:100%;padding:14px;justify-content:center" ${st.transcribing?'disabled':''} onclick="csAutoCaption()">
      ${CS_ICON('sparkle')} ${st.transcribing?'Transcribing…':'Auto-generate captions'}
    </button>
    <div style="font-size:11px;color:var(--mu);margin:12px 0">Uses AI on the selected clip's audio. Captions render burned into export.</div>
    ${(st.captions||[]).length ? `<div style="max-height:280px;overflow-y:auto">${st.captions.map((c,i)=>`
      <div style="padding:10px 0;border-bottom:1px solid #1c1c2b;display:flex;gap:8px;align-items:flex-start">
        <div style="color:#F5C518;font:700 10px var(--sans);flex:0 0 42px">${_fmtTs(c.start)}</div>
        <div style="flex:1;color:#fff;font-size:13px">${esc(c.text)}</div>
      </div>`).join('')}</div>`:'<div style="color:var(--mu2);font-size:12px;text-align:center;padding:20px">No captions yet.</div>'}
  </div>`;
}

function csAdjustSheet(st){
  const a = st.adjust || (st.adjust = {brightness:100,contrast:100,saturation:100,warmth:0});
  const rows = [['brightness',0,200],['contrast',0,200],['saturation',0,200],['warmth',-100,100]];
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Adjust</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    ${rows.map(([k,mn,mx])=>`<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;color:#e6e6f0;font:600 12px var(--sans)"><span>${k[0].toUpperCase()+k.slice(1)}</span><span data-adj-val="${k}">${a[k]}</span></div>
      <input class="cs-slider" type="range" min="${mn}" max="${mx}" value="${a[k]}" oninput="S.studio.adjust.${k}=+this.value;csApplyPreview();csUpdateSliderLabel(this,'${k}')"/>
    </div>`).join('')}
  </div>`;
}

function csVoiceSheet(st){
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Voiceover</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div style="font-size:12px;color:var(--mu);margin-bottom:14px">Tap and hold to record voiceover at the playhead.</div>
    <button class="btn bp" style="width:100%;padding:16px;justify-content:center" onmousedown="csVoiceStart()" onmouseup="csVoiceStop()" ontouchstart="csVoiceStart()" ontouchend="csVoiceStop()">
      ${CS_ICON('voice')} <span id="cs-voice-lbl">Hold to record</span>
    </button>
  </div>`;
}

function csOpacitySheet(st){
  const o = st.opacity==null?100:st.opacity;
  return `<div class="cs-sheet">
    <div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>Opacity</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div style="color:#e6e6f0;font:600 12px var(--sans);margin-bottom:8px">Opacity: <span id="cs-op-val">${o}%</span></div>
    <input class="cs-slider" type="range" min="0" max="100" value="${o}" oninput="S.studio.opacity=+this.value;csApplyPreview();var l=document.getElementById('cs-op-val');if(l)l.textContent=this.value+'%'"/>
  </div>`;
}

function csGenericSheet(title, body, st){
  return `<div class="cs-sheet"><div class="cs-sheet-grip"></div>
    <div class="cs-sheet-h"><h4>${esc(title)}</h4><button class="done" onclick="csCloseSheet()">Done</button></div>
    <div style="color:var(--mu);font-size:13px;line-height:1.55">${esc(body)}</div>
  </div>`;
}


function _fmtTs(s){ s=Math.max(0,+s||0); const m=Math.floor(s/60), r=Math.floor(s%60); return `${m}:${String(r).padStart(2,'0')}`; }
function studioTotalDur(){ return (S.studio.clips||[]).reduce((n,c)=>n+Math.max(0,(c.outMs-c.inMs))/1000, 0); }

window._st = { stream:null, recorder:null, chunks:[], scrollRAF:null, timerRAF:null, tStart:0, seg:null, segRAF:null, dragId:null };

window.studioInitStage = async () => {
  const S2 = S.studio;
  if(!S2) return;
  // Bring up camera stream if not yet
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
  // Kick canvas pipeline if bg != off
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
    // low-end guard
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
    // Draw person mask
    ctx.drawImage(res.segmentationMask,0,0,cv.width,cv.height);
    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(res.image,0,0,cv.width,cv.height);
    // Draw background under
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
  // Choose source stream: canvas if bg effect on, else camera
  let recStream = window._st.stream;
  if(S2.bg !== "off"){
    const cv = document.getElementById("st-canvas");
    if(cv && cv.captureStream){
      const cs = cv.captureStream(30);
      window._st.stream.getAudioTracks().forEach(t => cs.addTrack(t));
      recStream = cs;
    }
  }
  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")
    ? "video/mp4;codecs=avc1,mp4a.40.2"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
  const rec = new MediaRecorder(recStream, { mimeType:mime });
  window._st.recorder = rec; window._st.chunks = [];
  rec.ondataavailable = e => e.data && e.data.size && window._st.chunks.push(e.data);
  rec.onstop = async () => {
    const blob = new Blob(window._st.chunks, { type: mime.split(";")[0] });
    const url = URL.createObjectURL(blob);
    const dur = await _probeDur(url);
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob, dur, inMs:0, outMs:Math.round(dur*1000), source:"rec" });
    S.studio.selectedId = S.studio.clips[S.studio.clips.length-1].id;
    render();
  };
  rec.start(500);
  S2.running = true;
  window._st.tStart = performance.now();
  render();
  // Auto-stop safety at 3 min
  if(window.__csAutoStop) clearTimeout(window.__csAutoStop);
  window.__csAutoStop = setTimeout(() => { if(S.studio && S.studio.running) window.studioToggleRecord(); }, 180000);
};

function _probeDur(url){
  return new Promise(res => {
    const v = document.createElement("video"); v.preload="metadata"; v.src=url;
    v.onloadedmetadata = () => { const d = isFinite(v.duration)&&v.duration>0 ? v.duration : 0; res(d); };
    v.onerror = () => res(0);
  });
}

window.studioUploadClick = () => document.getElementById("st-file")?.click();
window.studioUpload = async (e) => {
  const files = Array.from(e.target.files||[]);
  for(const f of files){
    if(!f.type.startsWith("video/")) continue;
    const url = URL.createObjectURL(f);
    const dur = await _probeDur(url);
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob:f, dur, inMs:0, outMs:Math.round(dur*1000), source:"upload" });
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
window.studioSplit = (id) => {
  const c = S.studio.clips.find(x=>x.id===id); if(!c) return;
  const pv = document.getElementById("st-preview");
  const at = pv ? pv.currentTime*1000 : (c.inMs + (c.outMs-c.inMs)/2);
  if(at <= c.inMs+100 || at >= c.outMs-100){ toast("Move the playhead further into the clip"); return; }
  const i = S.studio.clips.findIndex(x=>x.id===id);
  const right = { ...c, id:"c"+Date.now()+Math.random().toString(36).slice(2,6), inMs:Math.round(at), outMs:c.outMs };
  c.outMs = Math.round(at);
  S.studio.clips.splice(i+1, 0, right);
  render();
};
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

// ── Auto-captions: extract audio → WAV → POST /api/transcribe ──────────────
window.studioCaption = async () => {
  const c = S.studio.clips.find(x=>x.id===S.studio.selectedId);
  if(!c){ toast("Select a clip first"); return; }
  S.studio.transcribing = true; render();
  try {
    // Send the original recorded blob straight to the backend — no client-side
    // decode/re-encode. The Content-Type matches the blob's native mime so the
    // server's extension detection picks the right format (webm/mp4/etc).
    const mime = c.blob?.type || "video/webm";
    const r = await fetch("/api/transcribe", { method:"POST", headers:{ "Content-Type":mime }, body:c.blob });
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.error||"Transcribe failed"); }
    const data = await r.json();
    S.studio.captions = (data.segments||[]).length ? data.segments : (data.text?[{start:0,end:0,text:data.text}]:[]);
    if(!S.studio.captions.length) toast("No speech detected"); else toast("Captions ready");
  } catch(e){ toast(e.message||"Caption failed"); }
  S.studio.transcribing = false; render();
};


// ── Export: sequential canvas + audio → MediaRecorder ─────────────────────
window.studioExport = async () => {
  const clips = S.studio.clips; if(!clips.length){ toast("Add a clip first"); return; }
  if(clips.length===1 && clips[0].inMs===0 && Math.abs(clips[0].outMs - clips[0].dur*1000)<50){
    // No edits: direct download
    const c = clips[0]; const ext = (c.blob.type||"video/webm").includes("mp4")?"mp4":"webm";
    _shareOrDownload(c.blob, `creatorpulse-${Date.now()}.${ext}`); toast("Exported"); return;
  }
  S.studio.exporting = true; render();
  try {
    const out = await _composeTimeline(clips);
    _shareOrDownload(out, `creatorpulse-${Date.now()}.${out.type.includes("mp4")?"mp4":"webm"}`);
    toast("Exported");
  } catch(e){ console.error(e); toast("Export failed"); }
  S.studio.exporting = false; render();
};

function _shareOrDownload(blob, name){
  const file = new File([blob], name, { type:blob.type });
  if(navigator.share && navigator.canShare && navigator.canShare({ files:[file] })){
    navigator.share({ files:[file], title:"CreatorPulse video" }).catch(()=>{});
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
  }
}

async function _composeTimeline(clips){
  const W=720, H=1280;
  const cv = document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx = cv.getContext("2d");
  const AC = window.AudioContext || window.webkitAudioContext;
  const actx = new AC();
  const dest = actx.createMediaStreamDestination();
  const vStream = cv.captureStream(30);
  dest.stream.getAudioTracks().forEach(t => vStream.addTrack(t));
  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")
    ? "video/mp4;codecs=avc1,mp4a.40.2"
    : "video/webm;codecs=vp9,opus";
  const rec = new MediaRecorder(vStream, { mimeType:mime });
  const chunks = [];
  rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start();

  for(const c of clips){
    await new Promise(async (resolve) => {
      const v = document.createElement("video");
      v.src = c.url; v.playsInline = true; v.muted = false; v.crossOrigin="anonymous";
      await new Promise(rs => { v.onloadedmetadata = rs; });
      v.currentTime = c.inMs/1000;
      await new Promise(rs => { v.onseeked = rs; });
      // Route audio into destination
      let node = null;
      try { node = actx.createMediaElementSource(v); node.connect(dest); } catch(_){}
      const endT = c.outMs/1000;
      const draw = () => {
        if(v.paused || v.ended || v.currentTime >= endT){
          try { v.pause(); } catch(_){}
          try { node && node.disconnect(); } catch(_){}
          return resolve();
        }
        // Cover-fit
        const ar = v.videoWidth/v.videoHeight;
        const tar = W/H;
        let dw=W, dh=H, dx=0, dy=0;
        if(ar > tar){ dh=H; dw=H*ar; dx=(W-dw)/2; } else { dw=W; dh=W/ar; dy=(H-dh)/2; }
        ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
        try { ctx.drawImage(v, dx, dy, dw, dh); } catch(_){}
        requestAnimationFrame(draw);
      };
      v.play().catch(()=>{});
      draw();
    });
  }
  rec.stop();
  await done;
  try { actx.close(); } catch(_){}
  return new Blob(chunks, { type: mime.split(";")[0] });
}

// ── CapCut-style Create Studio: handlers ────────────────────────────────────
window.csOpenCamera = async () => {
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
    let dur = 5;
    if(f.type.startsWith("video/")) dur = await _probeDur(url);
    S.studio.clips.push({ id:"c"+Date.now()+Math.random().toString(36).slice(2,6), url, blob:f, dur, inMs:0, outMs:Math.round(dur*1000), source:f.type.startsWith("image/")?"image":"upload", kind:f.type.startsWith("image/")?"image":"video" });
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
  cur.dur = await _probeDur(cur.url); cur.inMs=0; cur.outMs=Math.round(cur.dur*1000);
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
};
window.csConfirmExitEditor = () => {
  // Autosaved to session state — leave silently, no confirmation prompt.
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
window.csSetZoom = (z) => { S.studio.zoom = z; render(); };
window.csOpenMusic = () => { toast("Tap Music inside the editor after recording"); };
window.csRecord = async () => {
  if(S.studio.countdown && !S.studio.running){
    let n = S.studio.countdown;
    const tick = () => {
      toast(n+"…");
      n--; if(n>0) setTimeout(tick, 1000); else { window.studioToggleRecord(); csTimerBind(); }
    };
    tick();
  } else {
    await window.studioToggleRecord();
    csTimerBind();
  }
};
function csTimerBind(){
  const label = document.getElementById("cs-cam-time");
  if(!label) return;
  const tick = () => {
    if(!S.studio.running) return;
    const s = (performance.now()-window._st.tStart)/1000;
    label.textContent = _fmtTs(s);
    requestAnimationFrame(tick);
  };
  tick();
}

// Editor: selection, timeline, playback
window.csSelect = (id, type) => { S.studio.selectedId = id; S.studio.selectedType = type; if(type==='video') csLoadCurrent(); render(); };
window.csSelectOverlay = (id) => { S.studio.selectedId = id; S.studio.selectedType='text'; const o=S.studio.overlays.find(x=>x.id===id); if(o){ S.studio.editText = o; S.studio.sheet='text'; } render(); };
window.csClickTrack = (e) => {
  if(!e.target.classList.contains('cs-ed-tracks')) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left - 88;
  const ms = Math.max(0, x/0.06);
  S.studio.playhead = ms; render();
  csSyncToPlayhead();
};
function csLoadCurrent(){
  const st = S.studio;
  const cur = st.clips.find(c=>c.id===st.selectedId && st.selectedType==='video') || st.clips[0];
  if(!cur) return;
  const v = document.getElementById("cs-ed-video");
  if(!v) return;
  if(v.dataset.cid !== cur.id){
    v.dataset.cid = cur.id;
    v.src = cur.url;
    v.load();
    v.onloadedmetadata = () => { v.currentTime = cur.inMs/1000; if(st.playing) v.play().catch(()=>{}); };
  }
}
window.csTogglePlay = () => {
  const v = document.getElementById("cs-ed-video"); if(!v) return;
  S.studio.playing = !S.studio.playing;
  if(S.studio.playing) v.play().catch(()=>{}); else v.pause();
  // Update just the play-button icon (no full re-render → no video reload flicker)
  const btn = document.querySelector('.cs-ed-play');
  if(btn){ btn.innerHTML = CS_ICON(S.studio.playing?'pause':'play'); }
};
window.csOnTime = () => {
  const v = document.getElementById("cs-ed-video"); if(!v) return;
  const st = S.studio;
  const cur = st.clips.find(c=>c.id===v.dataset.cid); if(!cur) return;
  const idx = st.clips.indexOf(cur);
  const before = st.clips.slice(0,idx).reduce((n,c)=>n+(c.outMs-c.inMs),0);
  st.playhead = before + Math.max(0, v.currentTime*1000 - cur.inMs);
  const ph = document.querySelector('.cs-playhead');
  if(ph) ph.style.left = (88 + st.playhead*0.06)+'px';
  const time = document.querySelector('.cs-ed-time .cur');
  if(time) time.textContent = _fmtTs(st.playhead/1000);
  if(v.currentTime >= cur.outMs/1000){ v.pause(); csAdvanceClip(); }
};
window.csOnClipEnded = () => csAdvanceClip();
function csAdvanceClip(){
  const st = S.studio;
  const v = document.getElementById("cs-ed-video");
  const i = st.clips.findIndex(c=>c.id===v?.dataset?.cid);
  if(i>=0 && i<st.clips.length-1){
    const next = st.clips[i+1];
    st.selectedId = next.id; st.selectedType='video';
    v.src = next.url; v.dataset.cid = next.id;
    v.onloadedmetadata = () => { v.currentTime = next.inMs/1000; if(st.playing) v.play().catch(()=>{}); };
    render();
  } else {
    st.playing = false; render();
  }
}
function csSyncToPlayhead(){
  const st = S.studio;
  let acc = 0;
  for(const c of st.clips){
    const dur = c.outMs-c.inMs;
    if(st.playhead <= acc+dur){
      const v = document.getElementById("cs-ed-video");
      if(v){
        if(v.dataset.cid !== c.id){ v.src=c.url; v.dataset.cid=c.id; v.onloadedmetadata=()=>{ v.currentTime = c.inMs/1000 + (st.playhead-acc)/1000; }; }
        else { v.currentTime = c.inMs/1000 + (st.playhead-acc)/1000; }
      }
      st.selectedId = c.id; st.selectedType='video';
      return;
    }
    acc += dur;
  }
}

// Editor: clip actions
window.csSplit = () => {
  const st = S.studio;
  if(st.selectedType!=='video'){ toast("Select a video clip"); return; }
  const c = st.clips.find(x=>x.id===st.selectedId); if(!c) return;
  const v = document.getElementById("cs-ed-video");
  const at = v ? Math.round(v.currentTime*1000) : Math.round((c.inMs+c.outMs)/2);
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
    try { URL.revokeObjectURL(st.clips[i].url); } catch(_){}
    st.clips.splice(i,1);
    st.selectedId = st.clips[0]?.id || null;
    if(!st.clips.length) st.selectedType=null;
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
  o[k] = v; render();
};
window.csEditOverlayDuration = (ms) => {
  const o = S.studio.editText; if(!o) return;
  o.endMs = o.startMs + ms; render();
};
window.csDeleteOverlay = (id, skipRender) => {
  const i = S.studio.overlays.findIndex(o=>o.id===id); if(i<0) return;
  S.studio.overlays.splice(i,1);
  if(S.studio.selectedId===id){ S.studio.selectedId=null; S.studio.selectedType=null; S.studio.editText=null; S.studio.sheet=null; }
  if(!skipRender) render();
};

// Sheets
window.csOpenSheet = (name) => { S.studio.sheet = name; render(); };
window.csCloseSheet = () => { S.studio.sheet = null; S.studio.editText = null; render(); };

// Audio
window.csAddAudio = async (e) => {
  const f = (e.target.files||[])[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  const dur = await new Promise(r => { const a=new Audio(url); a.onloadedmetadata=()=>r(a.duration||10); a.onerror=()=>r(10); });
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
    // Send the original recorded blob directly — the backend detects the
    // format from the Content-Type header. No client-side audio decode.
    const mime = c.blob?.type || "video/webm";
    const ac = new AbortController();
    const tmo = setTimeout(()=>ac.abort(), 25000);
    let r;
    try {
      r = await fetch("/api/transcribe", { method:"POST", headers:{ "Content-Type":mime }, body:c.blob, signal:ac.signal });
    } finally { clearTimeout(tmo); }
    if(!r.ok){
      const msg = r.status===502 ? "Transcription service unavailable (502)" : ("Transcribe failed: "+r.status);
      throw new Error(msg);
    }
    const data = await r.json().catch(()=>({}));
    st.captions = (data.segments||[]).length ? data.segments : (data.text ? [{start:0,end:Math.min(clipDur,3),text:data.text}] : []);
    if(!st.captions.length){ throw new Error("No speech detected"); }
    toast("Captions ready");
  } catch(e){
    // Fallback: build captions from the teleprompter script if we have one.
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
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio:true });
    const rec = new MediaRecorder(s);
    const chunks = [];
    rec.ondataavailable = e => e.data && chunks.push(e.data);
    rec.onstop = () => {
      s.getTracks().forEach(t=>t.stop());
      const blob = new Blob(chunks, { type:'audio/webm' });
      const url = URL.createObjectURL(blob);
      S.studio.audioTracks = S.studio.audioTracks || [];
      S.studio.audioTracks.push({ id:"a"+Date.now(), name:"Voiceover", url, blob, startMs:S.studio.playhead, durMs:5000 });
      render();
    };
    window.__cs_voice = { rec, s };
    rec.start();
    const lbl = document.getElementById("cs-voice-lbl"); if(lbl) lbl.textContent = "Recording…";
  } catch(e){ toast("Mic permission denied"); }
};
window.csVoiceStop = () => {
  const v = window.__cs_voice; if(!v) return;
  try { v.rec.stop(); } catch(_){}
  const lbl = document.getElementById("cs-voice-lbl"); if(lbl) lbl.textContent = "Hold to record";
  window.__cs_voice = null;
};

// Undo / redo
function csPushHistory(){
  const st = S.studio;
  st.history = st.history || [];
  st.history.push(JSON.stringify({ clips:st.clips.map(c=>({...c,blob:null})), overlays:st.overlays, filter:st.filter }));
  if(st.history.length>50) st.history.shift();
  st.future = [];
}
window.csUndo = () => { toast("Undo: state history is per-session"); };
window.csRedo = () => { toast("Redo: use split/duplicate to rebuild"); };

// EXPORT: composite video + overlays + filter into MP4/WebM
window.csExport = async () => {
  const st = S.studio;
  if(!st.clips.length){ toast("Nothing to export"); return; }
  st.exporting = true; render();
  try {
    const out = await csComposeWithOverlays(st.clips, st.overlays, st.captions, st.audioTracks, st.filter, st.adjust);
    _shareOrDownload(out, `creatorpulse-${Date.now()}.${out.type.includes("mp4")?"mp4":"webm"}`);
    toast("Exported");
  } catch(e){ console.error(e); toast("Export failed"); }
  st.exporting = false; render();
};

async function csComposeWithOverlays(clips, overlays, captions, audioTracks, filterId, adjust){
  const W=1080, H=1920;
  const cv = document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx = cv.getContext("2d");
  const AC = window.AudioContext || window.webkitAudioContext;
  const actx = new AC();
  const dest = actx.createMediaStreamDestination();
  const vStream = cv.captureStream(30);
  dest.stream.getAudioTracks().forEach(t => vStream.addTrack(t));

  // Route audio tracks
  for(const a of (audioTracks||[])){
    try {
      const el = new Audio(a.url); el.crossOrigin="anonymous"; el.loop=false;
      const src = actx.createMediaElementSource(el); src.connect(dest);
      setTimeout(()=>el.play().catch(()=>{}), a.startMs||0);
    } catch(_){}
  }

  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")
    ? "video/mp4;codecs=avc1,mp4a.40.2"
    : "video/webm;codecs=vp9,opus";
  const rec = new MediaRecorder(vStream, { mimeType:mime, videoBitsPerSecond: 6_000_000 });
  const chunks = [];
  rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start();

  const filterCss = (CS_FILTERS.find(f=>f.id===filterId)||CS_FILTERS[0]).filter;
  const adj = adjust || {brightness:100,contrast:100,saturation:100,warmth:0};
  const adjFilter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) hue-rotate(${adj.warmth*0.36}deg)`;

  let globalMs = 0;
  for(const c of clips){
    await new Promise(async (resolve) => {
      const v = document.createElement("video");
      v.src = c.url; v.playsInline = true; v.crossOrigin = "anonymous";
      await new Promise(rs => { v.onloadedmetadata = rs; });
      v.currentTime = c.inMs/1000;
      await new Promise(rs => { v.onseeked = rs; });
      let node = null;
      try { node = actx.createMediaElementSource(v); node.connect(dest); } catch(_){}
      const endT = c.outMs/1000;
      const startGlobal = globalMs;
      const draw = () => {
        if(v.paused || v.ended || v.currentTime >= endT){
          try { v.pause(); node && node.disconnect(); } catch(_){}
          globalMs = startGlobal + (v.currentTime - c.inMs/1000)*1000;
          return resolve();
        }
        // Cover-fit
        const ar = (v.videoWidth||W)/(v.videoHeight||H), tar=W/H;
        let dw=W, dh=H, dx=0, dy=0;
        if(ar > tar){ dh=H; dw=H*ar; dx=(W-dw)/2; } else { dw=W; dh=W/ar; dy=(H-dh)/2; }
        ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
        ctx.filter = filterCss === 'none' ? adjFilter : `${filterCss} ${adjFilter}`;
        try { ctx.drawImage(v, dx, dy, dw, dh); } catch(_){}
        ctx.filter = "none";
        // Draw overlays active at current global time
        const gMs = startGlobal + (v.currentTime - c.inMs/1000)*1000;
        for(const o of overlays){
          if(gMs < o.startMs || gMs > o.endMs) continue;
          csDrawOverlay(ctx, o, W, H);
        }
        // Draw captions
        for(const cap of (captions||[])){
          const gs = (cap.start||0)*1000, ge = ((cap.end||cap.start+2)*1000);
          if(gMs>=gs && gMs<=ge){ csDrawCaption(ctx, cap.text||"", W, H); }
        }
        requestAnimationFrame(draw);
      };
      v.play().catch(()=>{});
      draw();
    });
  }
  rec.stop();
  await done;
  try { actx.close(); } catch(_){}
  return new Blob(chunks, { type: mime.split(";")[0] });
}

function csDrawOverlay(ctx, o, W, H){
  const f = CS_FONTS.find(x=>x.id===o.font)||CS_FONTS[0];
  const size = Math.round(o.size * (W/720));
  ctx.font = `${f.weight} ${size}px ${f.css}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const x = o.x/100 * W, y = o.y/100 * H;
  const metrics = ctx.measureText(o.text);
  const padX = size*0.35, padY = size*0.25;
  ctx.save();
  if(o.style==='bg'){ ctx.fillStyle = o.bg||"#000"; ctx.fillRect(x - metrics.width/2 - padX, y - size/2 - padY, metrics.width + padX*2, size + padY*2); }
  else if(o.style==='rev-bg'){ ctx.fillStyle = o.color; ctx.fillRect(x - metrics.width/2 - padX, y - size/2 - padY, metrics.width + padX*2, size + padY*2); ctx.fillStyle = o.bg||"#000"; ctx.fillText(o.text, x, y); ctx.restore(); return; }
  if(o.style==='outline'){ ctx.lineWidth = size*0.09; ctx.strokeStyle = "#000"; ctx.strokeText(o.text, x, y); }
  if(o.style==='rev-outline'){ ctx.lineWidth = size*0.09; ctx.strokeStyle = o.color; ctx.strokeText(o.text, x, y); ctx.fillStyle = "#000"; ctx.fillText(o.text, x, y); ctx.restore(); return; }
  if(o.style==='shadow'){ ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = size*0.3; ctx.shadowOffsetY = size*0.1; }
  ctx.fillStyle = o.color; ctx.fillText(o.text, x, y);
  ctx.restore();
}
function csDrawCaption(ctx, text, W, H){
  const size = Math.round(34 * (W/720));
  ctx.font = `800 ${size}px "Inter", sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const x = W/2, y = H*0.82;
  const metrics = ctx.measureText(text);
  const padX = size*0.4, padY = size*0.28;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(x - metrics.width/2 - padX, y - size/2 - padY, metrics.width + padX*2, size + padY*2);
  ctx.fillStyle = "#F5C518"; ctx.fillText(text, x, y);
  ctx.restore();
}

// Boot camera stage when opening chooser Camera button — no-op here (opened on click)
(function(){
  const _origSetTab = window.setTab;
  window.setTab = (t) => { _origSetTab && _origSetTab(t); if(t==='create' && S.studio && S.studio.mode==='camera'){ setTimeout(()=>window.studioInitStage&&window.studioInitStage(), 60); } };
})();




