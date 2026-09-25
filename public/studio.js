/* ═══════════════════════════════════════════════════════════════════════════
   CreatorPulse Studio — record → review → edit → export
   ═══════════════════════════════════════════════════════════════════════════
   Written from scratch to replace the previous Studio entirely. The old one
   is not patched here; it is gone.

   What the previous build did that this one does not:

     • Pressing stop after a recording produced no acknowledgement at all. The
       take existed in state but there was nothing on screen to show for it, so
       the flow dead-ended. Here every take lands in a visible clip strip as a
       block you can play, delete, or send straight to the editor, and the deck
       keeps a running count.

     • Trim opened a bottom sheet with two sliders and a "Done" button, and
       trimming a clip did nothing you could see. Here trimming is the CapCut
       gesture: tap the clip on the timeline, two handles grow out of its
       edges, drag either one. The slider sheet still exists as a coarse
       adjustment but it drives the same numbers, so the two can never
       disagree.

     • Zoom was fixed before recording started, and the "1x" next to the
       sparkle icon in the side rail duplicated the separate zoom pill below
       it. Here zoom is one control in one place, adjustable live, and the
       side rail holds only things that are actually toggles.

     • The header rendered partly underneath the browser's address bar, so the
       back chevron overlapped the first characters of the title and the
       side rail was clipped at the right edge. The new chrome respects the
       safe-area insets (see studio.css) instead of assuming a full-height
       viewport.

   Layout of this file:

     STATE        — the single studio state object and its normaliser
     ICONS        — inline SVG paths
     MEDIA POOL   — the one persistent <video>, never recreated per render
     ROUTER       — pageCreate() and svAfterRender() called by core.js
     RECORD       — camera view, clip strip, take review
     EDITOR       — timeline, selection, CapCut trim handles
     SHEETS       — trim, captions, text, image, video, music, effects, export
     PLAYBACK     — the single rAF ticker that drives preview and captions
     EXPORT       — ffmpeg.wasm render to a downloadable file
     HISTORY      — undo / redo

   Pure timeline maths (clip lengths, trim clamping, splitting, caption
   timing, the export plan) lives in lib/studioModel.js and is unit-tested;
   this file only wires it to the DOM.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── STATE ──────────────────────────────────────────────────────────────── */

function svDefaultState(){
  return {
    mode: 'idle',                 // idle | camera | editor
    projectName: 'New project',

    // Teleprompter
    script: '', showPrompter: false, showScriptEditor: false, promptSpeed: 60,

    // Capture
    running: false, paused: false, camReady: false, facing: 'user',
    micOn: true, torch: false, zoom: 1, countdown: 0, mirror: true,
    recStartedAt: 0, recAccumMs: 0, quality: null,

    // Content
    clips: [], overlays: [], captions: [], audioTracks: [],
    selectedId: null, selectedType: null,

    // Look
    filter: 'none', adjust: { brightness: 100, contrast: 100, saturation: 100, warmth: 0 },
    capStyle: { preset: 'classic', size: 34, width: 88, y: 78 },

    // Transport
    playhead: 0, playing: false,

    // UI
    sheet: null, editText: null, reviewId: null,
    exporting: false, exportPct: 0, exportNote: '',
    history: [], future: [],
  };
}

// A studio state can outlive a deploy — if the user keeps the tab open across
// a reload, or an older state is still in memory, every field added since must
// appear. Normalising on entry means no render path ever has to guard for a
// missing key.
// Fills missing keys of `obj` from `defaults`, keeping the SAME object.
function svFill(obj, defaults){
  if (!obj || typeof obj !== 'object') return Object.assign({}, defaults);
  for (const k in defaults){ if (obj[k] === undefined) obj[k] = defaults[k]; }
  return obj;
}

// Returns the SAME object every time, only ever topping up missing keys.
//
// This must not build a fresh object and reassign S.studio. Callers routinely
// capture a reference and then call nested helpers:
//
//     const st = svState();
//     svPush();                    // calls svState() internally
//     st.clips = smRemoveClip(...); // was writing into the ORPHANED object
//
// Any reassignment here invalidated every such reference, so those writes went
// to an object nothing else could see and the change silently vanished — which
// is exactly what broke deleting a clip from the timeline.
function svState(){
  const d = svDefaultState();
  const s = (S.studio && typeof S.studio === 'object') ? S.studio : (S.studio = {});
  for (const k in d){ if (s[k] === undefined) s[k] = d[k]; }
  // Sub-objects are topped up in place for the same reason.
  svFill(s.adjust, d.adjust);
  svFill(s.capStyle, d.capStyle);
  for (const k of ['clips', 'overlays', 'captions', 'audioTracks', 'history', 'future']){
    if (!Array.isArray(s[k])) s[k] = [];
  }
  return s;
}

let __svN = 0;
function svId(prefix){
  __svN += 1;
  return (prefix || 'x') + __svN.toString(36) + Date.now().toString(36).slice(-4);
}
function svNum(n, lo, hi){
  n = Number(n);
  if (!isFinite(n)) return lo;
  return n < lo ? lo : (n > hi ? hi : n);
}
function svPxMs(){
  try {
    const v = parseFloat(getComputedStyle(document.querySelector('.sv-root')).getPropertyValue('--sv-px-ms'));
    if (v > 0) return v;
  } catch (_){}
  return 0.09;
}
// Short, human label for a take or clip.
function svLabel(i){ return 'Clip ' + (i + 1); }

/* ── ICONS ──────────────────────────────────────────────────────────────── */

function svIcon(name){
  const P = {
    close:   '<path d="M18 6 6 18M6 6l12 12"/>',
    check:   '<path d="M20 6 9 17l-5-5"/>',
    back:    '<path d="m15 18-6-6 6-6"/>',
    text:    '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    image:   '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    video:   '<path d="m23 7-7 5 7 5z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    music:   '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    voice:   '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 18v4"/>',
    cc:      '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M8 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2M16 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2"/>',
    adjust:  '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    filter:  '<path d="M4 6h16M7 12h10M10 18h4"/>',
    stop:    '<rect x="6" y="6" width="12" height="12" rx="2.4" fill="currentColor" stroke="none"/>',
    split:   '<path d="M12 3v6m0 6v6M8 12l-5 5M8 12l-5-5M16 12l5 5M16 12l5-5"/>',
    trim:    '<path d="M6 3v18M18 3v18M6 8h5a4 4 0 0 1 0 8H6"/>',
    trash:   '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    dup:     '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    replace: '<path d="M4 12a8 8 0 0 1 14-5m2 0v5h-5M20 12a8 8 0 0 1-14 5m-2 0v-5h5"/>',
    play:    '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
    pause:   '<rect x="6.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none"/>',
    undo:    '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>',
    redo:    '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h4"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    flash:   '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    flip:    '<path d="M4 8a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 16a8 8 0 0 1-14 3l-2-2M4 20v-4h4"/>',
    upload:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    layers:  '<path d="M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    timer:   '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2M9 2h6"/>',
    sparkle: '<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    volume:  '<path d="M11 5 6 9H2v6h4l5 4zM15 9a5 5 0 0 1 0 6M19 5a10 10 0 0 1 0 14"/>',
    down:    '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>',
    grid:    '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    fx:      '<path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2"/>',
    cut:     '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20"/>',
    speed:   '<path d="M12 20a8 8 0 1 1 8-8"/><path d="m12 12 4-3"/><circle cx="12" cy="20" r="1.4" fill="currentColor"/>',
    move:    '<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><path d="M2 12h20M12 2v20"/>',
    mask:    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/>',
    spark:   '<path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.5-5.5-2.8 2.8M9.3 14.7l-2.8 2.8m11 0-2.8-2.8M9.3 9.3 6.5 6.5"/>',
  };
  return '<svg class="sv-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    + 'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || '') + '</svg>';
}
function svIconSm(name){ return svIcon(name).replace('class="sv-ico"', 'class="sv-ico sv-ico-sm"'); }

/* ── MEDIA POOL ─────────────────────────────────────────────────────────── */
// One <video> for the whole editor, created once and re-parented into the
// stage on each render. The previous build's preview was rebuilt whenever the
// view re-rendered, which dropped the decoder and left a black box; keeping
// the element alive across renders is what fixes that.

const SVMP = { v: null, host: null, loadedId: null };

function svMedia(){
  if (SVMP.v) return SVMP.v;
  SVMP.host = document.createElement('div');
  SVMP.host.style.display = 'none';
  document.body.appendChild(SVMP.host);
  const v = document.createElement('video');
  v.id = 'sv-ed-video';
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('webkit-playsinline', '');
  SVMP.host.appendChild(v);
  SVMP.v = v;
  return v;
}
function svVideoSrc(url){
  const v = svMedia();
  if (v.dataset.src !== url){
    v.dataset.src = url;
    v.src = url;
    try { v.load(); } catch (_){}
  }
  return v;
}

/* ── TEXT-TO-SPEECH / SYNTHESISED SOUND EFFECTS ─────────────────────────── */
// Small built-in effects, synthesised to a WAV in the browser so the Sound
// effects tool works with no bundled assets and no network.

function svWav(mono, sampleRate){
  const n = mono.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buf);
  const ws = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true); dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true); dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++){
    const s = Math.max(-1, Math.min(1, mono[i]));
    dv.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

const SV_SFX = [
  { id: 'pop',    label: 'Pop' },
  { id: 'whoosh', label: 'Whoosh' },
  { id: 'riser',  label: 'Riser' },
  { id: 'click',  label: 'Click' },
];

function svSfxBlob(kind){
  const sr = 44100;
  const dur = kind === 'riser' ? 1.3 : kind === 'whoosh' ? 0.7 : 0.22;
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++){
    const t = i / sr;
    const p = t / dur;
    if (kind === 'pop'){
      out[i] = Math.sin(2 * Math.PI * (900 - 620 * p) * t) * Math.exp(-9 * p) * 0.85;
    } else if (kind === 'whoosh'){
      out[i] = (Math.random() * 2 - 1) * Math.exp(-3.4 * p) * 0.55
             * (0.6 + 0.4 * Math.sin(2 * Math.PI * (320 + 900 * p) * t));
    } else if (kind === 'riser'){
      out[i] = Math.sin(2 * Math.PI * (180 + 1500 * p * p) * t)
             * Math.min(1, p * 3) * Math.exp(-1.9 * (1 - p)) * 0.7;
    } else {
      // Short, dry click — a tick of filtered noise with a hard decay.
      out[i] = (Math.random() * 2 - 1) * Math.exp(-55 * p) * 0.75;
    }
  }
  return svWav(out, sr);
}

/* ── ROUTER ─────────────────────────────────────────────────────────────── */
// core.js's renderApp() calls pageCreate() for the Create tab, and
// svAfterRender() once the markup is in the DOM.

window.pageCreate = function pageCreate(){
  const st = svState();
  if (st.mode === 'editor') return svEditorView(st);
  if (st.mode === 'camera') return svCameraView(st);
  return svStartView(st);
};

window.svAfterRender = function svAfterRender(){
  if (!S.studio || S.tab !== 'create') return;
  try {
    const st = svState();
    if (st.mode === 'camera'){
      svAttachLive();
      if (st.showPrompter && st.running && !st.paused) svPrompterRun();
      else svPrompterStop();
      if (st.running && !st.paused) svTimerRun(); else svTimerStop();
    }
    if (st.mode === 'editor'){
      svAttachMedia();
      svApplyPreview();
      if (window.pushBackState) { /* back handled by csConfirmExitEditor */ }
    }
  } catch (err){ console.warn('[studio] afterRender', err); }
};

/* ── SHARED CHROME ──────────────────────────────────────────────────────── */

function svCameraView(st){
  const clips = st.clips.length;
  const live = st.running && !st.paused;
  return `<div class="sv-root sv-rec" id="sv-root">
    <div class="sv-bar">
      <button class="sv-icon-btn" data-act="exitCamera" aria-label="Close studio">${svIcon('close')}</button>
      <div class="sv-bar-title">${esc(st.projectName)}</div>
      <div class="sv-bar-r">
        <button class="sv-chip" data-act="sheet" data-arg="quality">${svQualityLabel(st)}</button>
        <button class="sv-cta" data-act="toEditor" ${clips ? '' : 'disabled'}>Editor ${svIconSm('back')}</button>
      </div>
    </div>

    <div class="sv-stage ${st.running ? 'is-rec' : ''}" id="sv-stage">
      <video id="sv-cam-live" playsinline muted autoplay
        style="transform:${st.mirror && st.facing === 'user' ? 'scaleX(-1) ' : ''}scale(${st.zoom})"></video>

      ${st.showPrompter && st.script
        ? `<div class="sv-prompter-hd"><span>Teleprompter</span><span data-act="togglePrompter" style="cursor:pointer">Hide</span></div>
           <div class="sv-prompter"><div class="sv-prompter-inner" id="sv-prompter-inner">${esc(st.script)}</div></div>`
        : ''}

      ${st.running
        ? `<div class="${st.paused ? 'sv-paused-pill' : 'sv-rec-pill'}">
             ${st.paused ? 'Paused' : '<span class="dot"></span>'}<span id="sv-rec-time">0:00</span>
           </div>`
        : ''}

      <div class="sv-rail">
        <button class="sv-rail-btn ${st.showPrompter ? 'on' : ''}" data-act="prompter">${svIcon('text')}<span>Script</span></button>
        <button class="sv-rail-btn ${st.countdown ? 'on' : ''}" data-act="cycleCountdown">${svIcon('timer')}<span>${st.countdown ? st.countdown + 's' : 'Timer'}</span></button>
        <button class="sv-rail-btn ${st.micOn ? '' : 'warn'}" data-act="mic">${svIcon('voice')}<span>${st.micOn ? 'Mic' : 'Muted'}</span></button>
      </div>

      <div class="sv-zoom">
        ${[1, 1.5, 2, 3].map(z => `<button class="${st.zoom === z ? 'on' : ''}" data-act="zoom" data-arg="${z}">${z}×</button>`).join('')}
      </div>

      ${st.countdown && !st.running ? `<div class="sv-count" id="sv-count"></div>` : ''}
    </div>

    ${svStrip(st)}

    <div class="sv-deck">
      <div class="sv-shutter-row">
        <button class="sv-round ${st.torch ? 'on' : ''}" data-act="torch" aria-label="Torch">${svIcon('flash')}</button>
        <button class="sv-shutter ${st.running ? (st.paused ? 'paused' : 'rec') : ''}" data-act="record"
          aria-label="${st.running ? (st.paused ? 'Resume recording' : 'Pause recording') : 'Start recording'}">
          ${st.paused ? svIcon('play') : '<span></span>'}</button>
        ${st.running
          // While recording the flip button is dead anyway (the camera cannot
          // be swapped mid-take), so that slot becomes the Stop control. This
          // keeps pause and stop as separate actions — pausing used to leave
          // no way back to recording.
          ? `<button class="sv-round stop" data-act="stop" aria-label="Stop recording">${svIcon('stop')}</button>`
          : `<button class="sv-round" data-act="flip" aria-label="Switch camera">${svIcon('flip')}</button>`}
      </div>
      <div class="sv-deck-foot">
        <button class="sv-text-btn" data-act="upload">${svIconSm('upload')} Upload</button>
        <div class="sv-deck-hint">${st.running ? (st.paused ? 'Paused — tap the circle to resume' : 'Tap the circle to pause') : (clips ? clips + ' clip' + (clips === 1 ? '' : 's') + ' ready' : 'Tap to record')}</div>
        <button class="sv-text-btn" data-act="toEditor" ${clips ? '' : 'disabled'}>${svIconSm('layers')} Editor</button>
      </div>
      <input type="file" id="sv-upload" accept="video/*" multiple hidden>
      <input type="file" id="sv-script-import" accept=".txt,text/plain" hidden>
    </div>

    ${st.reviewId ? svReview(st) : ''}
    ${st.showScriptEditor ? svScriptSheet(st) : ''}
    ${st.sheet ? svScrimAndSheet(st) : ''}
  </div>`;
}

function svQualityLabel(st){
  const q = st.quality || svAutoQuality();
  const map = { '540p': '540p', '720p': '720p', '1080p': '1080p', '2160p': '4K' };
  return map[q] || '720p';
}
function svAutoQuality(){
  const cores = navigator.hardwareConcurrency || 4;
  if (cores >= 8) return '1080p';
  if (cores >= 4) return '720p';
  return '540p';
}

function svScrimAndSheet(st){
  return `<div class="sv-scrim" data-act="closeSheet"></div>${svSheet(st)}`;
}

/* ── CLIP STRIP ─────────────────────────────────────────────────────────── */
// The feedback loop that was missing. Every recorded or uploaded take is a
// block here: tap to play it back full-screen, tap the × to drop it.

function svStrip(st){
  return `<div class="sv-strip">
    <div class="sv-strip-hd">
      <span>Takes · ${st.clips.length}</span>
      <span data-act="toEditor" style="cursor:pointer;color:${st.clips.length ? 'var(--ac2,#9F67FF)' : 'inherit'}">Edit all →</span>
    </div>
    ${st.clips.length ? `<div class="sv-strip-scroll">
      ${st.clips.map((c, i) => `
        <div class="sv-take ${st.selectedId === c.id ? 'on' : ''}" data-act="playTake" data-arg="${c.id}">
          ${c.thumb ? `<img class="sv-take-thumb" src="${c.thumb}" alt="">` : `<video class="sv-take-thumb" src="${c.url}" muted playsinline preload="metadata"></video>`}
          <div class="sv-take-play">${svIcon('play')}</div>
          <div class="sv-take-meta">${smFormatMs(smClipMs(c))}</div>
          <button class="sv-take-x" data-act="deleteTake" data-arg="${c.id}" aria-label="Delete take">${svIconSm('close')}</button>
        </div>`).join('')}
    </div>` : `<div class="sv-strip-empty">Recording stopped? Your takes appear here to watch back or delete.</div>`}
  </div>`;
}

/* ── TAKE REVIEW ────────────────────────────────────────────────────────── */
// Full-screen playback of one take, with the three decisions that actually
// matter: keep it, bin it, or go edit.

function svReview(st){
  const c = st.clips.find(x => x.id === st.reviewId);
  if (!c) return '';
  return `<div class="sv-review">
    <div class="sv-bar">
      <button class="sv-icon-btn" data-act="closeReview" aria-label="Back to camera">${svIcon('back')}</button>
      <div class="sv-bar-title">${esc(c.name || 'Take')} · ${smFormatMs(smClipMs(c))}</div>
      <div class="sv-bar-r"></div>
    </div>
    <div class="sv-review-stage" data-act="toggleReviewPlay">
      <video id="sv-review-video" src="${c.url}" playsinline controls playsinline></video>
    </div>
    <div class="sv-review-foot">
      <button class="sv-btn-wide danger" data-act="deleteReviewTake">${svIconSm('trash')} Delete</button>
      <button class="sv-btn-wide primary" data-act="toEditor">${svIconSm('layers')} Edit</button>
    </div>
  </div>`;
}

/* ── SCRIPT SHEET (teleprompter) ────────────────────────────────────────── */

function svScriptSheet(st){
  return `<div class="sv-scrim" data-act="closeScript"></div>
    <div class="sv-sheet" style="z-index:31">
      <div class="sv-sheet-grip"><i></i></div>
      <div class="sv-sheet-hd"><h4>Teleprompter script</h4>
        <button class="done" data-act="saveScript">Use script</button></div>
      <div class="sv-sheet-body">
        <div class="sv-field">
          <label>Script</label>
          <textarea class="sv-input" id="sv-script-input" autofocus
            placeholder="Type or paste your script. It scrolls over the camera while you record.">${esc(st.script)}</textarea>
        </div>
        <div class="sv-field">
          <label>Scroll speed</label>
          <input class="sv-slider" type="range" min="20" max="140" value="${st.promptSpeed}"
            data-input="promptSpeed">
          <div class="sv-sheet-note">Roughly ${Math.round(st.promptSpeed / 1.4)} words per minute. Slower is easier to read on camera.</div>
        </div>
        <button class="sv-add" data-act="importScript">${svIconSm('upload')} Import a .txt file</button>
      </div>
    </div>`;
}

/* ── EDITOR VIEW ────────────────────────────────────────────────────────── */

function svEditorView(st){
  const total = smTotalMs(st.clips);
  const sel = st.selectedType ? st.clips.find(c => c.id === st.selectedId) : null;
  return `<div class="sv-root sv-ed" id="sv-root">
    <div class="sv-bar">
      <button class="sv-icon-btn" data-act="exitEditor" aria-label="Back to camera">${svIcon('close')}</button>
      <div class="sv-bar-title">${esc(st.projectName)}</div>
      <div class="sv-bar-r">
        <button class="sv-chip" data-act="sheet" data-arg="quality">${svQualityLabel(st)}</button>
        <button class="sv-cta" data-act="export" ${st.clips.length && !st.exporting ? '' : 'disabled'}>
          ${st.exporting ? '<span class="sp"></span> Exporting' : svIconSm('down') + ' Export'}</button>
      </div>
    </div>

    <div class="sv-ed-stage" id="sv-ed-stage">
      <div class="sv-media" id="sv-media"></div>
      <div class="sv-layer" id="sv-layer">
        ${st.overlays.map(o => svOverlayHtml(o, st)).join('')}
        <div class="sv-cap ${st.selectedType === 'caption' ? 'sel' : ''} ${smCaptionAt(st.captions, st.playhead) ? '' : 'off'}"
          id="sv-ed-cap" style="${svCapCss(st)}" data-ptr="cap">${esc(smCaptionAt(st.captions, st.playhead) ? smCaptionAt(st.captions, st.playhead).text : '')}</div>
      </div>

      <div class="sv-hud">
        <button class="sv-hud-play" data-act="togglePlay">${svIcon(st.playing ? 'pause' : 'play')}</button>
        <div class="sv-hud-time"><span>${smFormatMs(st.playhead)}</span> <span class="tot">/ ${smFormatMs(total)}</span></div>
        <div class="sv-hud-right">
          <button class="sv-hud-btn" data-act="undo" ${st.history.length ? '' : 'disabled'}>${svIcon('undo')}</button>
          <button class="sv-hud-btn" data-act="redo" ${st.future.length ? '' : 'disabled'}>${svIcon('redo')}</button>
        </div>
      </div>

      ${st.exporting ? svExportVeil(st) : ''}
    </div>

    <div class="sv-timeline" id="sv-timeline">
      <div class="sv-tl-scroll" id="sv-tl-scroll">
        <div class="sv-tl-inner" id="sv-tl-inner" style="width:${Math.max(100, smTotalMs(st.clips) * svPxMs() + 32)}px">
          <div class="sv-playhead" id="sv-playhead" style="transform:translateX(${16 + st.playhead * svPxMs()}px)"></div>
          ${svRuler()}
          ${svVideoTrack(st)}
          ${svOverlayTrack(st)}
          ${svCaptionTrack(st)}
          ${svAudioTrack(st)}
        </div>
      </div>
    </div>

    <div class="sv-toolbar">
      ${st.selectedType ? `<div class="sv-tb-row sv-tb-context">
        <button class="sv-tb" data-act="split">${svIcon('split')}<span>Split</span></button>
        <button class="sv-tb on" data-act="trimOn">${svIcon('trim')}<span>Trim</span></button>
        <button class="sv-tb" data-act="duplicate">${svIcon('dup')}<span>Duplicate</span></button>
        <button class="sv-tb" data-act="replace">${svIcon('replace')}<span>Replace</span></button>
        <button class="sv-tb danger" data-act="deleteSel">${svIcon('trash')}<span>Delete</span></button>
      </div>` : `<div class="sv-tb-row sv-tb-context">
        <button class="sv-tb" data-act="sheet" data-arg="clips">${svIcon('grid')}<span>All clips</span></button>
      </div>`}
      <div class="sv-tb-row sv-tb-main">
        <button class="sv-tb" data-act="addClip">${svIcon('plus')}<span>Add clip</span></button>
        <button class="sv-tb" data-act="addText">${svIcon('text')}<span>Text</span></button>
        <button class="sv-tb" data-act="sheet" data-arg="overlays">${svIcon('image')}<span>Overlay</span></button>
        <button class="sv-tb ${st.sheet === 'captions' ? 'on' : ''}" data-act="sheet" data-arg="captions">${svIcon('cc')}<span>Captions</span></button>
        <button class="sv-tb ${st.sheet === 'audio' ? 'on' : ''}" data-act="sheet" data-arg="audio">${svIcon('music')}<span>Audio</span></button>
        <button class="sv-tb ${st.sheet === 'effects' ? 'on' : ''}" data-act="sheet" data-arg="effects">${svIcon('fx')}<span>Effects</span></button>
        <button class="sv-tb ${st.sheet === 'adjust' ? 'on' : ''}" data-act="sheet" data-arg="adjust">${svIcon('adjust')}<span>Adjust</span></button>
      </div>
      <input type="file" id="sv-add-clip" accept="video/*" multiple hidden>
      <input type="file" id="sv-replace-clip" accept="video/*" hidden>
      <input type="file" id="sv-refable-add-image" accept="image/*" hidden>
      <input type="file" id="sv-add-image" accept="image/*" hidden>
      <input type="file" id="sv-add-video-ov" accept="video/*" hidden>
      <input type="file" id="sv-add-music" accept="audio/*" hidden>
    </div>

    ${st.sheet ? svScrimAndSheet(st) : ''}
  </div>`;
}

function svExportVeil(st){
  const C = 2 * Math.PI * 16;
  const off = C * (1 - svNum(st.exportPct, 0, 100) / 100);
  return `<div class="sv-export">
    <div class="sv-ring">
      <svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="16"/>
      <circle class="fg" cx="18" cy="18" r="16" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>
      <span>${Math.round(svNum(st.exportPct, 0, 100))}%</span>
    </div>
    <div class="sv-export-note">${esc(st.exportNote || 'Rendering your video…')}</div>
    <button class="sv-btn-wide ghost" style="max-width:180px" data-act="cancelExport">Cancel</button>
  </div>`;
}

/* ── TIMELINE TRACKS ────────────────────────────────────────────────────── */
// Clip blocks are positioned straight from the model: left = clip start,
// width = kept length. studioModel decides both, so what is drawn can never
// drift from what will be exported.

function svRuler(){
  const px = svPxMs();
  const stepMs = 1000;
  const spanMs = Math.max(10000, Math.ceil((smTotalMs(S.studio.clips) + 4000) / stepMs) * stepMs);
  let out = '<div class="sv-ruler">';
  for (let ms = 0; ms <= spanMs; ms += stepMs){
    const x = 16 + ms * px;
    out += `<i style="left:${x}px"></i>`;
    if (ms % 2000 === 0) out += `<b style="left:${x}px">${smFormatMs(ms)}</b>`;
  }
  return out + '</div>';
}

function svVideoTrack(st){
  const px = svPxMs();
  if (!st.clips.length){
    return `<div class="sv-track" id="sv-track-video"><div class="sv-track-empty">Add a clip to start editing</div></div>`;
  }
  let acc = 0;
  const body = st.clips.map((c, i) => {
    const len = smClipMs(c);
    const x = 16 + acc * px;
    const w = Math.max(18, len * px);
    acc += len;
    return `<div class="sv-clip ${st.selectedId === c.id && st.selectedType === 'video' ? 'sel' : ''}"
        data-ptr="clip" data-arg="${c.id}" style="left:${x}px;width:${w}px">
      ${c.thumb ? `<img src="${c.thumb}" alt="">` : ''}
      <span class="sv-clip-dur">${smFormatMs(len)}</span>
      <span class="sv-clip-name">${esc(c.name || svLabel(i))}</span>
      <div class="sv-grab l" data-ptr="grabIn" data-arg="${c.id}"></div>
      <div class="sv-grab r" data-ptr="grabOut" data-arg="${c.id}"></div>
    </div>`;
  }).join('');
  return `<div class="sv-track" id="sv-track-video">${body}</div>`;
}

function svOverlayTrack(st){
  const px = svPxMs();
  const empty = !st.overlays.length
    ? '<div class="sv-track-empty">Add text, a photo or a video on top</div>' : '';
  const body = st.overlays.map(o => {
    const x = 16 + o.startMs * px;
    const w = Math.max(16, (o.endMs - o.startMs) * px);
    return `<div class="sv-clip-ov ${st.selectedId === o.id && st.selectedType === 'overlay' ? '' : ''}"
      data-act="selectOverlay" data-arg="${o.id}" style="left:${x}px;width:${w}px">${esc((o.text || (o.kind === 'image' ? 'Photo' : 'Video')).slice(0, 16))}</div>`;
  }).join('');
  return `<div class="sv-track sv-track-ov" id="sv-track-overlay">${empty}${body}</div>`;
}

function svCaptionTrack(st){
  const px = svPxMs();
  const empty = !st.captions.length
    ? '<div class="sv-track-empty">Auto-captions available — open Captions</div>' : '';
  const body = st.captions.map(c => {
    const x = 16 + c.startMs * px;
    const w = Math.max(14, (c.endMs - c.startMs) * px);
    return `<div class="sv-clip-cap" data-act="sheet" data-arg="captions" style="left:${x}px;width:${w}px">${esc(c.text.slice(0, 14))}</div>`;
  }).join('');
  return `<div class="sv-track sv-track-cap" id="sv-track-caption">${empty}${body}</div>`;
}

function svAudioTrack(st){
  const px = svPxMs();
  const empty = !st.audioTracks.length
    ? '<div class="sv-track-empty">No music or effects yet</div>' : '';
  const body = st.audioTracks.map(a => {
    const startMs = a.startMs || 0;
    const lenMs = a.lenMs || Math.max(1000, smTotalMs(st.clips) - startMs);
    const x = 16 + startMs * px;
    const w = Math.max(16, lenMs * px);
    return `<div class="sv-clip-aud" data-act="sheet" data-arg="audio" style="left:${x}px;width:${w}px">
      ${svIconSm(a.kind === 'sfx' ? 'spark' : 'music')}${esc(a.name || 'Track')}</div>`;
  }).join('');
  return `<div class="sv-track sv-track-aud" id="sv-track-audio">${empty}${body}</div>`;
}

/* ── OVERLAYS (text / image / video on the video) ───────────────────────── */

function svOverlayHtml(o, st){
  const sel = st.selectedId === o.id && st.selectedType === 'overlay';
  const on = st.playhead >= o.startMs && st.playhead <= o.endMs;
  if (!on && !sel) return '';
  const base = `position:absolute;left:${o.x}%;top:${o.y}%;transform:translate(-50%,-50%)`;
  const inner = o.kind === 'text'
    ? `<span style="${svTextStyle(o)}">${esc(o.text || '')}</span>`
    : o.kind === 'image'
      ? `<img src="${o.url}" alt="" style="width:${Math.round(160 * (o.scale || 1))}px">`
      : `<video src="${o.url}" muted playsinline style="width:${Math.round(160 * (o.scale || 1))}px;border-radius:8px"></video>`;
  return `<div class="sv-overlay ${sel ? 'sel' : ''}" style="${base}" data-ptr="ovBody" data-arg="${o.id}">
    ${inner}
    <button class="sv-ov-x" data-act="deleteOverlay" data-arg="${o.id}" aria-label="Remove">${svIconSm('close')}</button>
  </div>`;
}

function svTextStyle(o){
  const s = o.style || 'bold';
  const size = Math.round((o.size || 30) * 1.6);
  const color = o.color || '#FFFFFF';
  const map = {
    bold:      `font:800 ${size}px var(--sans,sans-serif);color:${color}`,
    clean:     `font:600 ${size}px var(--sans,sans-serif);color:${color};letter-spacing:.02em`,
    serif:     `font:700 ${size}px var(--serif,Georgia,serif);color:${color}`,
    outline:   `font:800 ${size}px var(--sans,sans-serif);color:${color};-webkit-text-stroke:2px #000;paint-order:stroke`,
    shadow:    `font:800 ${size}px var(--sans,sans-serif);color:${color};text-shadow:2px 4px 10px rgba(0,0,0,.85)`,
    highlight: `font:800 ${size}px var(--sans,sans-serif);color:#0A0A0F;background:${color};padding:2px 8px;border-radius:6px`,
  };
  return (map[s] || map.bold) + ';white-space:nowrap';
}

function svCapCss(st){
  const c = st.capStyle;
  const size = Math.round(c.size || 34);
  const presets = {
    classic: 'font:700 SIZEpx var(--sans,sans-serif);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.9)',
    boxed:   'font:800 SIZEpx var(--sans,sans-serif);color:#0A0A0F;background:#fff;padding:2px 10px;border-radius:6px',
    pop:     'font:800 SIZEpx var(--sans,sans-serif);color:#F5C518;-webkit-text-stroke:2px #000;paint-order:stroke',
    italic:  'font:600 italic SIZEpx var(--serif,Georgia,serif);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.9)',
    karaoke: 'font:800 SIZEpx var(--sans,sans-serif);color:#fff;background:rgba(124,58,237,.85);padding:2px 10px;border-radius:6px',
    minimal: 'font:500 SIZEpx var(--sans,sans-serif);color:rgba(255,255,255,.92);letter-spacing:.03em',
  };
  const css = (presets[c.preset] || presets.classic).replace(/SIZE/g, String(size));
  return `bottom:${Math.max(2, 100 - (c.y || 78))}%;width:${c.width || 88}%;${css}`;
}

/* ── DELEGATED EVENTS ───────────────────────────────────────────────────── */
// One click listener and one pointerdown listener for the whole Studio, so no
// dynamic markup has to embed a quoted JavaScript string in an attribute —
// which is where the old file's inline handlers kept breaking on real data.

const SV_ACT = {
  /* camera */
  exitCamera:      () => svExitCamera(),
  record:          () => svRecordTap(),
  stop:            () => svStopRecording(),
  flip:            () => svFlip(),
  torch:           () => svTorch(),
  mic:             () => svMic(),
  zoom:            a => svSetZoom(Number(a)),
  cycleCountdown:  () => svCycleCountdown(),
  prompter:        () => svPrompterTap(),
  togglePrompter:  () => { const st = svState(); st.showPrompter = !st.showPrompter; render(); },
  promptSpeed:     (a, el) => { svState().promptSpeed = Number(el.value); },
  saveScript:      () => svSaveScript(),
  closeScript:     () => { const st = svState(); st.showScriptEditor = false; render(); },
  importScript:    () => document.getElementById('sv-script-import') && document.getElementById('sv-script-import').click(),
  upload:          () => document.getElementById('sv-upload') && document.getElementById('sv-upload').click(),

  /* takes */
  playTake:        a => svPlayTake(a),
  deleteTake:      a => svDeleteTake(a),
  closeReview:     () => { const st = svState(); st.reviewId = null; render(); },
  toggleReviewPlay: () => svToggleReview(),
  deleteReviewTake: () => { const st = svState(); const id = st.reviewId; st.reviewId = null; svDeleteTake(id); },

  /* navigation */
  toEditor:        () => svGoToEditor(),
  exitEditor:      () => svConfirmExitEditor(),

  /* editing */
  selectOverlay:   a => svSelect(a, 'overlay'),
  deleteOverlay:   a => svDeleteOverlay(a),
  addText:         () => svAddText(),
  addClip:         () => { const el = document.getElementById('sv-add-clip'); if (el) el.click(); },
  replace:         () => { const el = document.getElementById('sv-replace-clip'); if (el) el.click(); },
  split:           () => svSplit(),
  duplicate:       () => svDuplicate(),
  deleteSel:       () => svDeleteSelected(),
  trimOn:          () => svOpenSheet('trim'),

  /* transport + history */
  togglePlay:      () => svTogglePlay(),
  undo:            () => svUndo(),
  redo:            () => svRedo(),

  /* sheets */
  sheet:           a => svOpenSheet(a),
  closeSheet:      () => svCloseSheet(),

  /* idle screen entry points */
  newProject:      () => svNewProject(),
  upload2:         () => { const el = document.getElementById('sv-upload'); if (el) el.click(); },

  /* captions */
  autoCaps:        () => svAutoCaptions(),
  capPreset:       (a, el) => { const st = svState(); st.capStyle.preset = a; render(); },
  capSize:         (a, el) => { const st = svState(); st.capStyle.size = Number(el.value); svApplyCapLive(); },
  capPos:          (a, el) => { const st = svState(); st.capStyle.y = Number(el.value); svApplyCapLive(); },
  capWord:         (a, el) => { const st = svState(); st.capWords = Number(el.value); svAutoCaptions(); },
  delCap:          a => { const st = svState(); st.captions = st.captions.filter(c => c.id !== a); render(); },

  /* text overlay editor */
  ovStyle:         a => { const st = svState(); const o = svFindOverlay(st.editText); if (o) o.style = a; render(); },
  ovColor:         (a, el) => { const st = svState(); const o = svFindOverlay(st.editText); if (o) o.color = a; render(); },
  ovSize:          (a, el) => { const st = svState(); const o = svFindOverlay(st.editText); if (o) o.size = Number(el.value); render(); },
  ovText:          (a, el) => { const st = svState(); const o = svFindOverlay(st.editText); if (o) o.text = el.value; svApplyOverlayLive(); },
  ovDone:          () => { const st = svState(); st.editText = null; st.sheet = null; svPush(); render(); },
  addImageOv:      () => { const el = document.getElementById('sv-add-image'); if (el) el.click(); },
  addVideoOv:      () => { const el = document.getElementById('sv-add-video-ov'); if (el) el.click(); },
  ovDur:           (a, el) => { const st = svState(); const o = svFindOverlay(st.editText); if (o) o.endMs = o.startMs + Number(el.value) * 1000; render(); },

  /* audio */
  addMusic:        () => { const el = document.getElementById('sv-add-music'); if (el) el.click(); },
  addSfx:          a => svAddSfx(a),
  delAudio:        a => { const st = svState(); st.audioTracks = st.audioTracks.filter(t => t.id !== a); render(); },
  musicVol:        (a, el) => { const st = svState(); const t = st.audioTracks.find(x => x.id === a); if (t) t.volume = Number(el.value); },

  /* effects + adjust */
  pickFilter:      a => { const st = svState(); st.filter = a; svApplyPreview(); svRenderSheetOnly(); },
  adj:             (a, el) => { const st = svState(); st.adjust[a] = Number(el.value); svApplyPreview(); },
  resetAdjust:     () => { const st = svState(); st.adjust = { brightness: 100, contrast: 100, saturation: 100, warmth: 0 }; svApplyPreview(); svRenderSheetOnly(); },

  /* quality */
  setQuality:      a => { const st = svState(); st.quality = a; render(); },

  /* clip list */
  pickClip:        a => { svSelect(a, 'video'); svCloseSheet(); },

  /* export */
  export:          () => svExport(),
  cancelExport:    () => svCancelExport(),
};

const SV_PTR = {
  clip:    (e, id) => svSelect(id, 'video'),
  grabIn:  (e, id) => svBeginTrim(e, id, 'in'),
  grabOut: (e, id) => svBeginTrim(e, id, 'out'),
  ovBody:  (e, id) => svBeginOverlayDrag(e, id),
  cap:     (e)    => svSelectCaption(),
  scrub:   (e)    => svBeginScrub(e),
};

document.addEventListener('click', function (e){
  const host = e.target.closest && e.target.closest('.sv-root');
  if (!host) return;
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const fn = SV_ACT[t.dataset.act];
  if (!fn) return;
  e.preventDefault();
  e.stopPropagation();
  try { fn(t.dataset.arg, t); } catch (err){ console.warn('[studio] action ' + t.dataset.act, err); svToast('Something went wrong there'); }
}, false);

document.addEventListener('pointerdown', function (e){
  const host = e.target.closest && e.target.closest('.sv-root');
  if (!host) return;
  const t = e.target.closest('[data-ptr]');
  if (t){
    const fn = SV_PTR[t.dataset.ptr];
    if (fn){
      // Selection runs on pointerdown so a clip highlights the instant it is
      // touched, before any drag begins.
      try { fn(e, t.dataset.arg); } catch (err){ console.warn('[studio] pointer ' + t.dataset.ptr, err); }
      return;
    }
  }
  // Tapping empty timeline space scrubs to that position.
  const scroller = e.target.closest('#sv-tl-scroll');
  if (scroller){
    try { SV_PTR.scrub(e); } catch (err){ console.warn('[studio] scrub', err); }
  }
}, false);

/* File inputs are wired once, not per render — a listener attached inside the
   markup string would be re-bound on every render and fire twice. */
function svWireInputs(){
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.wired){ el.dataset.wired = '1'; el.addEventListener('change', fn); }
  };
  bind('sv-upload', e => svHandleUpload(e));
  bind('sv-add-clip', e => svHandleUpload(e));
  bind('sv-replace-clip', e => svHandleReplace(e));
  bind('sv-add-image', e => svHandleImageOverlay(e));
  bind('sv-add-video-ov', e => svHandleVideoOverlay(e));
  bind('sv-add-music', e => svHandleMusic(e));
  bind('sv-script-import', e => svImportScript(e));
}
document.addEventListener('change', function (e){
  if (e.target.closest && e.target.closest('.sv-root')) svWireInputs();
}, true);

/* ── CAMERA LIFECYCLE ───────────────────────────────────────────────────── */

const SVC = { stream: null, rec: null, chunks: [], track: null, timer: null, prompter: null, segStart: 0 };

async function svOpenCamera(){
  const st = svState();
  svCloseCamera();
  const q = svQualityFor(st);
  try {
    SVC.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: st.facing,
        width: { ideal: q.width }, height: { ideal: q.height }, frameRate: { ideal: q.fps },
      },
      audio: st.micOn ? { echoCancellation: true, noiseSuppression: true } : false,
    });
  } catch (err){
    console.warn('[studio] camera', err);
    svToast(err && err.name === 'NotAllowedError'
      ? 'Camera blocked — allow camera access for this site'
      : 'Camera unavailable on this device');
    return;
  }
  SVC.track = SVC.stream.getVideoTracks()[0] || null;
  st.camReady = true;
  svAttachLive();
  svApplyHardwareZoom();
}

function svAttachLive(){
  const v = document.getElementById('sv-cam-live');
  if (v && SVC.stream && v.srcObject !== SVC.stream){
    v.srcObject = SVC.stream;
    v.play().catch(() => {});
  }
}

function svCloseCamera(){
  try { if (SVC.rec && SVC.rec.state !== 'inactive') SVC.rec.stop(); } catch (_){}
  SVC.rec = null;
  if (SVC.stream) SVC.stream.getTracks().forEach(t => { try { t.stop(); } catch (_){} });
  SVC.stream = null; SVC.track = null;
  clearInterval(SVC.timer); SVC.timer = null;
  cancelAnimationFrame(SVC.prompter); SVC.prompter = null;
  if (S.studio) S.studio.camReady = false;
}

function svQualityFor(st){
  const P = {
    '540p':  { width: 540,  height: 960,  fps: 24, crf: 27, preset: 'ultrafast', label: '540p', bitrate: 1500000 },
    '720p':  { width: 720,  height: 1280, fps: 30, crf: 25, preset: 'ultrafast', label: '720p', bitrate: 2500000 },
    '1080p': { width: 1080, height: 1920, fps: 30, crf: 23, preset: 'veryfast',  label: '1080p', bitrate: 4500000 },
    '2160p': { width: 2160, height: 3840, fps: 30, crf: 21, preset: 'veryfast',  label: '4K', bitrate: 12000000 },
  };
  return P[st.quality || svAutoQuality()] || P['720p'];
}
function svMime(){
  const list = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return list.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || 'video/webm';
}

/* Torch + hardware zoom: real capabilities where the phone exposes them, and
   a silent no-op where it does not, so the button never lies about state. */
async function svApplyHardwareZoom(){
  const t = SVC.track;
  if (!t || !t.getCapabilities) return;
  try {
    const caps = t.getCapabilities();
    if (caps.zoom){
      const z = Math.min(caps.zoom.max, Math.max(caps.zoom.min, S.studio.zoom));
      await t.applyConstraints({ advanced: [{ zoom: z }] });
      const v = document.getElementById('sv-cam-live');
      if (v) v.style.transform = (S.studio.mirror && S.studio.facing === 'user' ? 'scaleX(-1) ' : '') + 'scale(1)';
    }
  } catch (_){}
}
async function svTorch(){
  const t = SVC.track;
  const caps = t && t.getCapabilities ? t.getCapabilities() : null;
  if (!caps || !caps.torch) return svToast('Torch is not available on this camera');
  const st = svState();
  st.torch = !st.torch;
  try { await t.applyConstraints({ advanced: [{ torch: st.torch }] }); }
  catch (_){ st.torch = false; return svToast('Could not switch the torch on'); }
  render();
}
window.svSetZoom = function (z){
  const st = svState();
  st.zoom = svNum(z, 1, 3);
  const v = document.getElementById('sv-cam-live');
  if (v) v.style.transform = (st.mirror && st.facing === 'user' ? 'scaleX(-1) ' : '') + 'scale(' + st.zoom + ')';
  document.querySelectorAll('.sv-zoom button').forEach(b => b.classList.toggle('on', Number(b.dataset.arg) === st.zoom));
  svApplyHardwareZoom();
};
async function svFlip(){
  const st = svState();
  if (st.running) return svToast('Stop the recording first');
  st.facing = st.facing === 'user' ? 'environment' : 'user';
  st.torch = false;
  await svOpenCamera();
  render();
}
function svMic(){
  const st = svState();
  st.micOn = !st.micOn;
  if (SVC.stream) SVC.stream.getAudioTracks().forEach(t => { t.enabled = st.micOn; });
  if (st.micOn && SVC.stream && !SVC.stream.getAudioTracks().length) return svOpenCamera().then(render);
  render();
}
function svCycleCountdown(){
  const st = svState();
  const opts = [0, 3, 5, 10];
  st.countdown = opts[(opts.indexOf(st.countdown) + 1) % opts.length];
  render();
}
function svPrompterTap(){
  const st = svState();
  if (!st.script) st.showScriptEditor = true;
  else st.showPrompter = !st.showPrompter;
  render();
}
function svSaveScript(){
  const st = svState();
  const el = document.getElementById('sv-script-input');
  if (el) st.script = el.value;
  st.showScriptEditor = false;
  st.showPrompter = !!st.script.trim();
  render();
  svToast(st.showPrompter ? 'Teleprompter ready — it scrolls while you record' : 'Script saved');
}
async function svImportScript(e){
  const f = (e.target.files || [])[0];
  e.target.value = '';
  if (!f) return;
  const text = await f.text();
  const st = svState();
  st.script = text.slice(0, 20000);
  st.showPrompter = true;
  st.showScriptEditor = false;
  render();
  svToast('Script loaded onto the teleprompter');
}

/* ── RECORDING ──────────────────────────────────────────────────────────── */

async function svRecordTap(){
  const st = svState();
  if (!st.running) return svStartRecording();
  // While recording the shutter is a pause/resume toggle. Finishing is its own
  // button, so a pause can always be undone — previously a second tap stopped
  // the take outright, which left no way back to recording.
  if (!st.paused) return svPauseRecording();
  return svResumeRecording();
}

async function svStartRecording(){
  const st = svState();
  if (!SVC.stream){ await svOpenCamera(); if (!SVC.stream) return; }
  if (!st.micOn && SVC.stream.getAudioTracks().length){
    SVC.stream.getAudioTracks().forEach(t => { t.enabled = false; });
  }
  if (st.countdown){
    await svCountdown(st.countdown);
    if (!SVC.stream) return;
  }
  const mime = svMime();
  const q = svQualityFor(st);
  try {
    SVC.rec = new MediaRecorder(SVC.stream, { mimeType: mime, videoBitsPerSecond: q.bitrate });
  } catch (_){
    try { SVC.rec = new MediaRecorder(SVC.stream); }
    catch (e2){ return svToast('Recording is not supported in this browser'); }
  }
  SVC.chunks = [];
  SVC.rec.ondataavailable = ev => { if (ev.data && ev.data.size) SVC.chunks.push(ev.data); };
  SVC.rec.onstop = () => svFinishRecording(SVC.rec ? (SVC.rec.mimeType || mime) : mime);
  SVC.rec.start(1000);

  st.running = true; st.paused = false;
  st.recStartedAt = Date.now(); st.recAccumMs = 0;
  render();
  svTimerRun();
  if (st.showPrompter && st.script) svPrompterRun();
}

function svPauseRecording(){
  const st = svState();
  try { if (SVC.rec && SVC.rec.state === 'recording') SVC.rec.pause(); } catch (_){}
  st.paused = true;
  st.recAccumMs += Date.now() - st.recStartedAt;
  svTimerStop();
  svPrompterStop();
  render();
}

function svResumeRecording(){
  const st = svState();
  try { if (SVC.rec && SVC.rec.state === 'paused') SVC.rec.resume(); } catch (_){}
  st.paused = false;
  st.recStartedAt = Date.now();
  svTimerRun();
  if (st.showPrompter && st.script) svPrompterRun();
  render();
}

function svStopRecording(){
  const st = svState();
  if (st.paused) st.recAccumMs += 0; // already banked at pause
  else st.recAccumMs += Date.now() - st.recStartedAt;
  st.running = false; st.paused = false;
  svTimerStop();
  svPrompterStop();
  try { if (SVC.rec && SVC.rec.state !== 'inactive') SVC.rec.stop(); } catch (_){}
}

function svTimerRun(){
  svTimerStop();
  SVC.timer = setInterval(() => {
    const st = S.studio;
    if (!st || !st.running || st.paused) return;
    const el = document.getElementById('sv-rec-time');
    if (el) el.textContent = smFormatMs(st.recAccumMs + (Date.now() - st.recStartedAt));
  }, 200);
}
function svTimerStop(){ clearInterval(SVC.timer); SVC.timer = null; }

function svPrompterRun(){
  const box = document.getElementById('sv-prompter-inner');
  if (!box) return;
  cancelAnimationFrame(SVC.prompter);
  const parent = box.parentElement;
  const dist = Math.max(0, box.scrollHeight - parent.clientHeight + 30);
  if (dist <= 0) return;
  // Duration is derived from the word count at the chosen reading speed, so
  // the text finishes roughly when the script does.
  const words = String(S.studio.script || '').trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.max(60, (S.studio.promptSpeed || 60) * 1.4);
  const total = Math.max(4000, (words / wpm) * 60000);
  const t0 = performance.now();
  const startY = -SVP.prompterY;
  const step = t => {
    const st = S.studio;
    if (!st || !st.running || st.paused) return;
    const p = Math.min(1, (t - t0) / total);
    const y = startY - dist * p;
    SVP.prompterY = -y;
    box.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    if (p < 1) SVC.prompter = requestAnimationFrame(step);
  };
  SVC.prompter = requestAnimationFrame(step);
}
function svPrompterStop(){ cancelAnimationFrame(SVC.prompter); SVC.prompter = null; }
const SVP = { prompterY: 0 };

function svCountdown(n){
  return new Promise(res => {
    const host = document.getElementById('sv-count');
    if (!host) return res();
    let left = n;
    const tick = () => {
      host.innerHTML = '<span class="pop">' + left + '</span>';
      if (left-- <= 0){ clearInterval(iv); res(); }
    };
    tick();
    const iv = setInterval(tick, 1000);
  });
}

/* Reads the true duration of a recorded blob. webm from MediaRecorder reports
   Infinity until it is seeked — handled so a clip never lands on the timeline
   with a NaN width. */
function svProbeDuration(url){
  return new Promise(res => {
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true;
    let done = false;
    const finish = d => {
      if (done) return;
      done = true;
      try { v.removeAttribute('src'); v.load(); } catch (_){}
      res(Math.max(0.2, Number(d) || 0.2));
    };
    v.onloadedmetadata = () => {
      if (v.duration === Infinity || isNaN(v.duration)){
        v.currentTime = 1e6;
        v.ontimeupdate = () => { v.ontimeupdate = null; finish(v.duration); };
      } else finish(v.duration);
    };
    v.onerror = () => finish(0.2);
    setTimeout(() => finish(v.duration), 4000);
    v.src = url;
  });
}

/* Poster frame for the strip and the timeline block. Without it a take is a
   black rectangle and the user cannot tell two recordings apart. */
function svGrabThumb(url){
  return new Promise(res => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    let done = false;
    const finish = data => {
      if (done) return;
      done = true;
      try { v.removeAttribute('src'); v.load(); } catch (_){}
      res(data || '');
    };
    const snap = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 150; c.height = 200;
        const ctx = c.getContext('2d');
        const vw = v.videoWidth || 9, vh = v.videoHeight || 16;
        // Cover-fit so the poster is never letterboxed.
        const scale = Math.max(c.width / vw, c.height / vh);
        const dw = vw * scale, dh = vh * scale;
        ctx.drawImage(v, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
        finish(c.toDataURL('image/jpeg', 0.7));
      } catch (_){ finish(''); }
    };
    v.onloadeddata = () => { try { v.currentTime = Math.min(0.4, (v.duration || 1) / 3); } catch (_){ snap(); } };
    v.onseeked = snap;
    v.onerror = () => finish('');
    setTimeout(() => finish(''), 3500);
    v.src = url;
  });
}

async function svFinishRecording(mime){
  const st = svState();
  const blob = new Blob(SVC.chunks, { type: (mime || 'video/webm').split(';')[0] });
  SVC.chunks = [];
  const wasSelected = st.selectedId;
  if (blob.size < 1200){ svToast('That take was too short to keep'); render(); return; }

  const url = svHoldUrl(URL.createObjectURL(blob));
  const dur = await svProbeDuration(url);
  const thumb = await svGrabThumb(url);
  const clip = {
    id: svId('c'), name: svLabel(st.clips.length), url, blob, thumb,
    dur, inMs: 0, outMs: Math.round(dur * 1000), kind: 'video',
  };
  // Land the take next to whatever was selected when it was shot, so several
  // takes in a row keep the order they were recorded in.
  st.clips = smInsertAfter(st.clips, clip, wasSelected);
  st.selectedId = clip.id; st.selectedType = 'video';
  svPush();
  // Paint first, then report. The strip block has to exist before the toast
  // tells the user to look for it — the thumbnail and duration are already
  // resolved above, so there is nothing left to await.
  render();
  svToast('Take saved — tap it in the strip below to watch it back');
}

/* ── TAKE ACTIONS ───────────────────────────────────────────────────────── */

function svPlayTake(id){
  const st = svState();
  st.reviewId = id;
  st.selectedId = id; st.selectedType = 'video';
  render();
}
function svToggleReview(){
  const v = document.getElementById('sv-review-video');
  if (!v) return;
  if (v.paused) v.play().catch(() => {}); else v.pause();
}
function svDeleteTake(id){
  const st = svState();
  const c = st.clips.find(x => x.id === id);
  if (!c) return;
  if (!window.confirm('Delete this take? This cannot be undone.')) return;
  svReleaseUrl(c.url);
  st.clips = smRemoveClip(st.clips, id);
  if (st.selectedId === id){ st.selectedId = null; st.selectedType = null; }
  if (st.reviewId === id) st.reviewId = null;
  svPush();
  svToast('Take deleted');
  render();
}

/* ── OBJECT URL LIFETIME ────────────────────────────────────────────────── */
// A revoked URL is worse than a leaked one: the block renders black. So URLs
// are reference-counted and only released when the last holder lets go.

const SVURL = new Map();
function svHoldUrl(u){ if (!u) return u; SVURL.set(u, (SVURL.get(u) || 0) + 1); return u; }
function svReleaseUrl(u){
  if (!u) return;
  const n = (SVURL.get(u) || 1) - 1;
  if (n <= 0){ SVURL.delete(u); try { URL.revokeObjectURL(u); } catch (_){} }
  else SVURL.set(u, n);
}

// Parked media for clips removed from the timeline but still reachable through
// Undo. Deleting must NOT revoke the object URL: the snapshot only carries clip
// metadata, so revoking here left Undo with a clip it could not re-attach media
// to, and smRestore then dropped it — the clip simply never came back.
// Everything parked here is released when the project is torn down.
const SVPARK = new Map();
function svParkClip(c){ if (c && c.id) SVPARK.set(c.id, { url: c.url, blob: c.blob, thumb: c.thumb }); }
function svParkedOf(id){ return SVPARK.get(id) || null; }
function svClearParked(){
  SVPARK.forEach(m => svReleaseUrl(m && m.url));
  SVPARK.clear();
}

/* ── UPLOAD / REPLACE ───────────────────────────────────────────────────── */

async function svHandleUpload(e){
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  if (!files.length) return;
  const st = svState();
  for (const f of files){
    if (!/^video\//.test(f.type)){ svToast('Only video files can go on the timeline'); continue; }
    const url = svHoldUrl(URL.createObjectURL(f));
    const dur = await svProbeDuration(url);
    const thumb = await svGrabThumb(url);
    st.clips.push({
      id: svId('c'), name: f.name.replace(/\.[^.]+$/, '').slice(0, 20) || svLabel(st.clips.length),
      url, blob: f, thumb, dur, inMs: 0, outMs: Math.round(dur * 1000), kind: 'video',
    });
  }
  svPush();
  render();
  svToast(files.length + (files.length === 1 ? ' clip added' : ' clips added'));
}

async function svHandleReplace(e){
  const f = (e.target.files || [])[0];
  e.target.value = '';
  const st = svState();
  if (!f || st.selectedType !== 'video') return;
  const i = st.clips.findIndex(c => c.id === st.selectedId);
  if (i < 0) return;
  const old = st.clips[i];
  const url = svHoldUrl(URL.createObjectURL(f));
  const dur = await svProbeDuration(url);
  const thumb = await svGrabThumb(url);
  svPush();
  svReleaseUrl(old.url);
  st.clips[i] = {
    id: old.id, name: f.name.replace(/\.[^.]+$/, '').slice(0, 20) || old.name,
    url, blob: f, thumb, dur, inMs: 0, outMs: Math.round(dur * 1000), kind: 'video',
  };
  st.playhead = smClipStart(st.clips, old.id);
  render();
  svToast('Clip replaced');
}

/* ── NAVIGATION BETWEEN STUDIO SCREENS ──────────────────────────────────── */

function svExitCamera(){
  const st = svState();
  if (st.clips.length){
    const ok = window.confirm(st.clips.length === 1
      ? 'Leave the studio? Your recording will be discarded.'
      : 'Leave the studio? All ' + st.clips.length + ' takes will be discarded.');
    if (!ok) return;
    st.clips.forEach(c => svReleaseUrl(c.url));
    svClearParked();
    st.clips = []; st.overlays = []; st.captions = []; st.audioTracks = [];
    st.history = []; st.future = [];
  }
  svCloseCamera();
  st.mode = 'idle'; st.running = false; st.paused = false; st.reviewId = null;
  st.sheet = null; st.showScriptEditor = false;
  S.tab = 'home';
  render();
}

function svGoToEditor(){
  const st = svState();
  if (!st.clips.length) return svToast('Record or add a clip first');
  svCloseCamera();
  st.mode = 'editor';
  st.reviewId = null;
  st.sheet = null;
  if (!st.selectedId){ st.selectedId = st.clips[0].id; st.selectedType = 'video'; }
  st.playhead = smClipStart(st.clips, st.selectedId);
  if (st.playhead < 0) st.playhead = 0;
  render();
  if (window.pushBackState) window.pushBackState(() => svConfirmExitEditor());
}

function svConfirmExitEditor(){
  const st = svState();
  if (st.sheet) return svCloseSheet();
  svPause();
  st.mode = 'camera';
  st.selectedType = null;
  st.sheet = null;
  render();
  setTimeout(() => svOpenCamera(), 60);
}

/* ── TIMELINE: SELECTION, SCRUB, TRIM ───────────────────────────────────── */

function svSelect(id, type){
  const st = svState();
  st.selectedId = id;
  st.selectedType = type;
  if (type === 'video'){
    const start = smClipStart(st.clips, id);
    if (start >= 0) st.playhead = start;
    svLoadAt(st.playhead, true);
  }
  render();
}

function svSelectCaption(){
  const st = svState();
  st.selectedType = 'caption';
  st.selectedId = null;
  render();
}

function svTimelineTimeAt(clientX){
  const inner = document.getElementById('sv-tl-inner');
  const scroller = document.getElementById('sv-tl-scroll');
  if (!inner || !scroller) return 0;
  const rect = inner.getBoundingClientRect();
  const x = clientX - rect.left - 16;
  const ms = x / svPxMs();
  return svNum(ms, 0, Math.max(0, smTotalMs(svState().clips)));
}

function svBeginScrub(e){
  const st = svState();
  const move = ev => {
    st.playhead = svTimelineTimeAt(ev.clientX);
    svPaintPlayhead();
    svLoadAt(st.playhead, false);
  };
  move(e);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    svLoadAt(st.playhead, true);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

/* The CapCut gesture. Pointerdown on a handle captures the drag; every move
   recomputes the trim from the pointer's distance from the clip's left edge,
   and the visible block is resized in place rather than re-rendering the
   whole editor on every frame. */
function svBeginTrim(e, id, edge){
  e.preventDefault();
  e.stopPropagation();
  const st = svState();
  const clip = st.clips.find(c => c.id === id);
  if (!clip) return;
  const scroller = document.getElementById('sv-tl-scroll');
  const node = document.querySelector('.sv-clip[data-arg="' + id + '"]');
  const inner = document.getElementById('sv-tl-inner');
  if (!node || !inner) return;

  svSelect(id, 'video');
  const px = svPxMs();
  const startLeft = parseFloat(node.style.left) || 0;
  const startWidth = parseFloat(node.style.width) || 0;
  const startX = e.clientX;
  const minMs = 400;
  const orig = { inMs: clip.inMs, outMs: clip.outMs };
  if (scroller) scroller.classList.add('is-trimming');

  const move = ev => {
    const dxMs = (ev.clientX - startX) / px;
    let next;
    if (edge === 'in'){
      const t = smTrim(clip, { inMs: orig.inMs + dxMs }, minMs);
      next = { inMs: t.inMs, outMs: orig.outMs };
    } else {
      const t = smTrim(clip, { outMs: orig.outMs + dxMs }, minMs);
      next = { inMs: orig.inMs, outMs: t.outMs };
    }
    clip.inMs = next.inMs; clip.outMs = next.outMs;
    // Live geometry, straight from the model.
    if (edge === 'in'){
      const delta = smClipMs({ dur: clip.dur, inMs: next.inMs, outMs: orig.outMs }) - smClipMs({ dur: clip.dur, inMs: orig.inMs, outMs: orig.outMs });
      node.style.left = (startLeft + delta * px) + 'px';
    }
    node.style.width = Math.max(18, smClipMs(clip) * px) + 'px';
    const durEl = node.querySelector('.sv-clip-dur');
    if (durEl) durEl.textContent = smFormatMs(smClipMs(clip));
    const read = document.getElementById('sv-trim-read');
    if (read){
      read.innerHTML = '<span>In</span>' + smFormatMs(clip.inMs) +
        '<span>Length</span>' + smFormatMs(smClipMs(clip)) +
        '<span>Out</span>' + smFormatMs(clip.outMs);
    }
    svTimelineWidth();
    svRepaintTimeline();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (scroller) scroller.classList.remove('is-trimming');
    svPush();
    render();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

// Repaint the non-video tracks after a trim, without a full re-render — a
// full render mid-drag would replace the node being dragged.
function svRepaintTimeline(){
  const st = svState();
  const tl = document.getElementById('sv-timeline');
  if (!tl) return;
  ['sv-track-overlay', 'sv-track-caption', 'sv-track-audio'].forEach((id, i) => {
    const host = document.getElementById(id);
    if (!host) return;
    const fn = [svOverlayTrack, svCaptionTrack, svAudioTrack][i];
    const fresh = document.createElement('div');
    fresh.innerHTML = fn(st);
    host.innerHTML = fresh.firstElementChild.innerHTML;
  });
  svPaintPlayhead();
}

function svTimelineWidth(){
  const st = svState();
  const inner = document.getElementById('sv-tl-inner');
  if (inner) inner.style.width = Math.max(100, smTotalMs(st.clips) * svPxMs() + 32) + 'px';
  const ruler = document.querySelector('.sv-ruler');
  if (ruler){
    const fresh = document.createElement('div');
    fresh.innerHTML = svRuler();
    ruler.replaceWith(fresh.firstElementChild);
  }
}

function svPaintPlayhead(){
  const ph = document.getElementById('sv-playhead');
  if (ph) ph.style.transform = 'translateX(' + (16 + svState().playhead * svPxMs()) + 'px)';
}

/* ── OVERLAY DRAG + RESIZE ──────────────────────────────────────────────── */

function svBeginOverlayDrag(e, id){
  e.preventDefault();
  const st = svState();
  const o = st.overlays.find(x => x.id === id);
  if (!o) return;
  svSelect(id, 'overlay');
  const stage = document.getElementById('sv-ed-stage');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const el = e.target.closest('.sv-overlay');
  const resizing = e.target.classList && e.target.classList.contains('sel') === false && false;

  const move = ev => {
    const nx = ((ev.clientX - rect.left) / rect.width) * 100;
    const ny = ((ev.clientY - rect.top) / rect.height) * 100;
    o.x = svNum(nx, 2, 98);
    o.y = svNum(ny, 2, 98);
    if (el){ el.style.left = o.x + '%'; el.style.top = o.y + '%'; }
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    svPush();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

/* ── EDIT ACTIONS ───────────────────────────────────────────────────────── */

function svSplit(){
  const st = svState();
  if (!st.clips.length) return;
  const r = smSplitAt(st.clips, st.playhead, () => svId('c'), 400);
  if (!r.newId) return svToast('Move the playhead away from the clip edge to split');
  const src = st.clips.find(c => c.id === r.clips[r.clips.indexOf(r.clips.find(x => x.id === r.newId))].id);
  // Carry the poster frame onto both halves so neither goes black.
  const parent = st.clips.find(c => c.id === (r.clips.find(x => x.id === r.newId) || {}).id) || null;
  st.clips = r.clips.map((c, i) => {
    const orig = st.clips.find(o => o.id === c.id) || st.clips.find(o => o.inMs === c.inMs && o.outMs === c.outMs);
    return Object.assign({}, c, {
      url: (orig && orig.url) || c.url,
      blob: (orig && orig.blob) || c.blob,
      thumb: (orig && orig.thumb) || c.thumb || '',
    });
  });
  st.selectedId = r.newId;
  st.selectedType = 'video';
  svPush();
  render();
  svToast('Clip split — drag either handle to fine-tune');
}

function svDuplicate(){
  const st = svState();
  if (st.selectedType === 'overlay') return svToast('Overlays are already on the timeline');
  const i = st.clips.findIndex(c => c.id === st.selectedId);
  if (i < 0) return;
  const c = st.clips[i];
  // Media is shared by reference; only the edit window is copied, so a
  // duplicate costs no extra memory or object URL.
  const copy = Object.assign({}, c, { id: svId('c'), name: (c.name || 'Clip') + ' copy' });
  svPush();
  st.clips.splice(i + 1, 0, copy);
  st.selectedId = copy.id;
  render();
  svToast('Clip duplicated');
}

function svDeleteSelected(){
  const st = svState();
  if (st.selectedType === 'overlay') return svDeleteOverlay(st.selectedId);
  const i = st.clips.findIndex(c => c.id === st.selectedId);
  if (i < 0) return;
  const c = st.clips[i];
  if (!window.confirm('Delete this clip from the timeline?')) return;
  svPush();
  svParkClip(c);
  st.clips = smRemoveClip(st.clips, c.id);
  st.selectedId = st.clips.length ? st.clips[Math.min(i, st.clips.length - 1)].id : null;
  st.selectedType = st.clips.length ? 'video' : null;
  // Captions are timed to the timeline, so they are recomputed rather than
  // left hanging over the shortened video.
  if (st.captions.length && st.script) st.captions = smAutoCaptions(st.script, st.clips, st.capWords || 5, 42);
  st.playhead = svNum(st.playhead, 0, smTotalMs(st.clips));
  render();
  svToast('Clip deleted');
}

function svDeleteOverlay(id){
  const st = svState();
  const o = st.overlays.find(x => x.id === id);
  if (!o) return;
  svPush();
  if (o.url) svReleaseUrl(o.url);
  st.overlays = st.overlays.filter(x => x.id !== id);
  if (st.selectedId === id){ st.selectedId = null; st.selectedType = null; }
  st.editText = st.editText === id ? null : st.editText;
  render();
  svToast('Removed');
}

/* ── OVERLAYS: TEXT, IMAGE, VIDEO ───────────────────────────────────────── */

function svAddText(){
  const st = svState();
  const total = smTotalMs(st.clips) || 4000;
  const start = svNum(st.playhead, 0, Math.max(0, total - 1000));
  const o = {
    id: svId('o'), kind: 'text', text: 'Your text', style: 'bold', color: '#FFFFFF', size: 30,
    scale: 1, x: 50, y: 30, startMs: Math.round(start), endMs: Math.round(Math.min(total, start + 3000)),
  };
  st.overlays.push(o);
  st.selectedId = o.id; st.selectedType = 'overlay';
  st.editText = o.id;
  st.sheet = 'text';
  svPush();
  render();
}

async function svHandleImageOverlay(e){
  const f = (e.target.files || [])[0];
  e.target.value = '';
  if (!f) return;
  const st = svState();
  const total = smTotalMs(st.clips) || 4000;
  const url = svHoldUrl(URL.createObjectURL(f));
  const o = {
    id: svId('o'), kind: 'image', url, name: f.name,
    x: 50, y: 40, scale: 1,
    startMs: Math.round(svNum(st.playhead, 0, Math.max(0, total - 1000))),
    endMs: Math.round(Math.min(total, st.playhead + 3000)),
  };
  st.overlays.push(o);
  st.selectedId = o.id; st.selectedType = 'overlay';
  svPush();
  render();
  svToast('Image added — drag it to position');
}

async function svHandleVideoOverlay(e){
  const f = (e.target.files || [])[0];
  e.target.value = '';
  if (!f) return;
  const st = svState();
  const total = smTotalMs(st.clips) || 4000;
  const url = svHoldUrl(URL.createObjectURL(f));
  const o = {
    id: svId('o'), kind: 'video', url, name: f.name,
    x: 50, y: 40, scale: 1,
    startMs: Math.round(svNum(st.playhead, 0, Math.max(0, total - 1000))),
    endMs: Math.round(Math.min(total, Math.max(3000, st.playhead + 4000))),
  };
  st.overlays.push(o);
  st.selectedId = o.id; st.selectedType = 'overlay';
  svPush();
  render();
  svToast('Video overlay added');
}

function svFindOverlay(id){ return svState().overlays.find(o => o.id === id) || null; }

function svApplyOverlayLive(){
  const st = svState();
  const o = svFindOverlay(st.editText);
  if (!o) return;
  const el = document.querySelectorAll('.sv-overlay span')[0];
  if (el && o.kind === 'text') el.textContent = o.text || '';
}

function svApplyCapLive(){
  const el = document.getElementById('sv-ed-cap');
  if (el) el.setAttribute('style', svCapCss(svState()));
}

/* ── CAPTIONS ───────────────────────────────────────────────────────────── */

function svAutoCaptions(){
  const st = svState();
  const stx = svState();
  const words = st.capWords || 5;
  if (!st.script || !String(st.script).trim()){
    // No script to work from: tell the user exactly how to give it one.
    return svToast('Record with the teleprompter script loaded, then captions build from it');
  }
  if (!st.clips.length) return svToast('Add a clip first');
  svPush();
  st.captions = smAutoCaptions(st.script, st.clips, words, 42);
  svRenderSheetOnly();
  svRepaintTimeline();
  svToast(st.captions.length + ' caption cards created');
}

/* ── AUDIO ──────────────────────────────────────────────────────────────── */

async function svHandleMusic(e){
  const f = (e.target.files || [])[0];
  e.target.value = '';
  if (!f) return;
  const st = svState();
  const url = svHoldUrl(URL.createObjectURL(f));
  st.audioTracks.push({
    id: svId('a'), kind: 'music', name: f.name.replace(/\.[^.]+$/, '').slice(0, 22) || 'Music',
    url, blob: f, volume: 30, startMs: 0, lenMs: Math.max(1000, smTotalMs(st.clips)),
  });
  svPush();
  render();
  svToast('Music added at 30% volume');
}

function svAddSfx(kind){
  const st = svState();
  const def = SV_SFX.find(s => s.id === kind) || SV_SFX[0];
  const blob = svSfxBlob(def.id);
  const url = svHoldUrl(URL.createObjectURL(blob));
  st.audioTracks.push({
    id: svId('a'), kind: 'sfx', name: def.label, url, blob, volume: 70,
    startMs: Math.round(st.playhead), lenMs: 1400,
  });
  svPush();
  render();
  svToast(def.label + ' effect added at the playhead');
}

/* ── LOOK: FILTERS AND ADJUST ───────────────────────────────────────────── */

const SV_FILTERS = [
  { id: 'none',    label: 'Original', css: 'none' },
  { id: 'vivid',   label: 'Vivid',    css: 'saturate(1.45) contrast(1.1)' },
  { id: 'warm',    label: 'Warm',     css: 'sepia(.22) saturate(1.25) brightness(1.04)' },
  { id: 'cool',    label: 'Cool',     css: 'hue-rotate(-12deg) saturate(1.15) brightness(1.02)' },
  { id: 'mono',    label: 'Mono',     css: 'grayscale(1) contrast(1.12)' },
  { id: 'noir',    label: 'Noir',     css: 'grayscale(1) contrast(1.4) brightness(.9)' },
  { id: 'fade',    label: 'Fade',     css: 'contrast(.86) brightness(1.1) saturate(.82)' },
  { id: 'punch',   label: 'Punch',    css: 'contrast(1.3) saturate(1.3)' },
  { id: 'retro',   label: 'Retro',    css: 'sepia(.4) saturate(1.4) contrast(.92) hue-rotate(-8deg)' },
];

function svFilterCss(id){
  if (id === 'none') return 'none';
  const f = SV_FILTERS.find(x => x.id === id);
  const st = svState();
  const a = st.adjust;
  const parts = [];
  if (f && f.css !== 'none') parts.push(f.css);
  if (a.brightness !== 100) parts.push('brightness(' + (a.brightness / 100) + ')');
  if (a.contrast !== 100) parts.push('contrast(' + (a.contrast / 100) + ')');
  if (a.saturation !== 100) parts.push('saturate(' + (a.saturation / 100) + ')');
  if (a.warmth > 0) parts.push('sepia(' + (a.warmth / 400) + ') saturate(' + (1 + a.warmth / 300) + ')');
  if (a.warmth < 0) parts.push('hue-rotate(' + (a.warmth / 4) + 'deg)');
  return parts.length ? parts.join(' ') : 'none';
}

function svApplyPreview(){
  const stage = document.getElementById('sv-ed-stage');
  if (!stage) return;
  const css = svFilterCss(svState().filter);
  stage.style.filter = css === 'none' ? '' : css;
}

function svRenderSheetOnly(){
  const host = document.querySelector('.sv-sheet');
  if (!host){ return render(); }
  const wrap = document.createElement('div');
  wrap.innerHTML = svSheet(svState());
  const fresh = wrap.firstElementChild;
  if (fresh) host.replaceWith(fresh);
  svWireInputs();
}

/* ── SHEETS ─────────────────────────────────────────────────────────────── */

function svOpenSheet(name){
  const st = svState();
  st.sheet = name;
  svPause();
  render();
}
function svCloseSheet(){
  const st = svState();
  st.sheet = null;
  st.editText = null;
  render();
}

function svSheet(st){
  const body = {
    quality:  svSheetQuality,
    clips:    svSheetClips,
    trim:     svSheetTrim,
    captions: svSheetCaptions,
    audio:    svSheetAudio,
    effects:  svSheetEffects,
    adjust:   svSheetAdjust,
    overlays: svSheetOverlays,
    text:     svSheetText,
  }[st.sheet];
  if (!body) return '';
  const title = {
    quality: 'Recording quality', clips: 'All clips', trim: 'Trim clip',
    captions: 'Captions', audio: 'Music & sound effects', effects: 'Filters & effects',
    adjust: 'Adjust', overlays: 'Overlays', text: 'Edit text',
  }[st.sheet] || 'Options';
  const done = st.sheet === 'text' ? 'ovDone' : 'closeSheet';
  return `<div class="sv-sheet" id="sv-sheet">
    <div class="sv-sheet-grip"><i></i></div>
    <div class="sv-sheet-hd"><h4>${esc(title)}</h4>
      <button class="done" data-act="${done}">Done</button></div>
    <div class="sv-sheet-body">${body(st)}</div>
  </div>`;
}

function svSheetQuality(){
  const st = svState();
  const opts = [
    { id: '540p',  label: '540p',  sub: 'Smallest file' },
    { id: '720p',  label: '720p',  sub: 'Recommended' },
    { id: '1080p', label: '1080p', sub: 'Sharp' },
    { id: '2160p', label: '4K',    sub: 'Heaviest' },
  ];
  return `<div class="sv-grid g2">
    ${opts.map(o => `<button class="sv-cell ${(st.quality || svAutoQuality()) === o.id ? 'on' : ''}"
      data-act="setQuality" data-arg="${o.id}">${o.label}<span class="sub">${o.sub}</span></button>`).join('')}
  </div>
  <div class="sv-sheet-note">Higher quality looks better but takes longer to export and uses more storage. 720p is the right choice for phone viewing.</div>`;
}

function svSheetClips(st){
  const broken = !st.clips.length;
  return (broken ? '<div class="sv-sheet-note">No clips yet. Record or upload one first.</div>' : '')
    + `<div class="sv-list">
    ${st.clips.map((c, i) => `
      <div class="sv-item">
        ${c.thumb ? `<img src="${c.thumb}" style="width:38px;height:50px;object-fit:cover;border-radius:7px" alt="">` : ''}
        <span class="n">${esc(c.name || svLabel(i))}</span>
        <span class="d">${smFormatMs(smClipMs(c))}</span>
        <button class="x" data-act="pickClip" data-arg="${c.id}" aria-label="Edit this clip">${svIconSm('trim')}</button>
      </div>`).join('')}
  </div>
  <div class="sv-sheet-note">Tap the trim icon on a clip to select it. On the timeline, drag a clip's edge handles to trim it, or use Split at the playhead.</div>`;
}

function svSheetTrim(st){
  const c = st.selectedType === 'video' ? st.clips.find(x => x.id === st.selectedId) : null;
  if (!c) return '<div class="sv-sheet-note">Tap a clip on the timeline first, then trim it.</div>';
  const src = Math.max(1, (c.dur || 0) * 1000);
  const lo = (c.inMs / src) * 100;
  const wd = (smClipMs(c) / src) * 100;
  return `<div class="sv-trim-bar">
      <div class="sv-trim-sel" style="left:${lo}%;width:${wd}%"></div>
    </div>
    <div class="sv-trim-read" id="sv-trim-read">
      <span>In</span>${smFormatMs(c.inMs)}
      <span>Length</span>${smFormatMs(smClipMs(c))}
      <span>Out</span>${smFormatMs(c.outMs)}
    </div>
    <div class="sv-field">
      <label>Start</label>
      <input class="sv-slider" type="range" min="0" max="${Math.round(src)}" step="10" value="${Math.round(c.inMs)}"
        data-input="trimIn">
    </div>
    <div class="sv-field">
      <label>End</label>
      <input class="sv-slider" type="range" min="0" max="${Math.round(src)}" step="10" value="${Math.round(c.outMs)}"
        data-input="trimOut">
    </div>
    <div class="sv-sheet-note">These sliders and the drag handles on the timeline are the same thing — whichever you use, the other follows. Close this sheet to drag with your finger.</div>`;
}

function svSheetCaptions(st){
  const presets = ['classic', 'boxed', 'pop', 'italic', 'karaoke', 'minimal'];
  return `<button class="sv-add" data-act="autoCaps" style="margin-bottom:16px">
      ${svIconSm('sparkle')} ${st.captions.length ? 'Rebuild captions from script' : 'Auto-caption from script'}</button>
    <div class="sv-field">
      <label>Style</label>
      <div class="sv-grid g3">
        ${presets.map(p => `<button class="sv-cell ${st.capStyle.preset === p ? 'on' : ''}"
          data-act="capPreset" data-arg="${p}" style="${svCapCss(Object.assign({}, st, { capStyle: Object.assign({}, st.capStyle, { preset: p }) }))};position:static;transform:none;width:auto;bottom:auto">Aa</button>`).join('')}
      </div>
    </div>
    <div class="sv-field">
      <label>Size</label>
      <input class="sv-slider" type="range" min="18" max="60" value="${st.capStyle.size}" data-input="capSize">
    </div>
    <div class="sv-field">
      <label>Height on screen</label>
      <input class="sv-slider" type="range" min="10" max="92" value="${st.capStyle.y}" data-input="capPos">
    </div>
    ${st.captions.length ? `<div class="sv-field"><label>Caption lines (${st.captions.length})</label>
      <div class="sv-list">${st.captions.slice(0, 40).map(c => `
        <div class="sv-item"><span class="d">${smFormatMs(c.startMs)}</span>
        <span class="n">${esc(c.text)}</span>
        <button class="x" data-act="delCap" data-arg="${c.id}" aria-label="Remove line">${svIconSm('close')}</button></div>`).join('')}</div>
      <div class="sv-sheet-note">Captions follow the timeline: trim or delete a clip and they re-time themselves.</div></div>`
      : '<div class="sv-sheet-note">Captions are built from your teleprompter script, so they always match what you actually say. Load a script on the camera screen first.</div>'}`;
}

function svSheetAudio(st){
  return `<div class="sv-row" style="margin-bottom:16px">
      <button class="sv-add" data-act="addMusic">${svIconSm('music')} Add music</button>
    </div>
    <div class="sv-field">
      <label>Sound effects</label>
      <div class="sv-grid g2">
        ${SV_SFX.map(s => `<button class="sv-cell" data-act="addSfx" data-arg="${s.id}">${s.label}</button>`).join('')}
      </div>
      <div class="sv-sheet-note">Effects are generated on your phone — no downloads, and no cost.</div>
    </div>
    ${st.audioTracks.length ? `<div class="sv-field"><label>On the timeline (${st.audioTracks.length})</label>
      <div class="sv-list">${st.audioTracks.map(a => `
        <div class="sv-item">
          ${svIconSm(a.kind === 'sfx' ? 'spark' : 'music')}
          <span class="n">${esc(a.name || 'Track')}</span>
          <span class="d">${a.volume}%</span>
          <button class="x" data-act="delAudio" data-arg="${a.id}" aria-label="Remove">${svIconSm('trash')}</button>
        </div>`).join('')}</div></div>`
      : '<div class="sv-sheet-note">No music or effects yet.</div>'}`;
}

function svSheetEffects(st){
  return `<div class="sv-field"><label>Filter</label>
      <div class="sv-grid g3">
        ${SV_FILTERS.map(f => `<button class="sv-cell ${st.filter === f.id ? 'on' : ''}"
          data-act="pickFilter" data-arg="${f.id}" style="padding:0;overflow:hidden">
          <span class="sv-swatch" style="display:block;background:linear-gradient(135deg,#7C3AED,#EC4899);filter:${f.css === 'none' ? 'none' : f.css}">
            <span>${f.label}</span></span></button>`).join('')}
      </div>
    </div>
    <div class="sv-sheet-note">Filters preview live on the video behind this sheet, and are baked in on export.</div>`;
}

function svSheetAdjust(st){
  const a = st.adjust;
  const rows = [
    ['brightness', 'Brightness', 50, 150],
    ['contrast',   'Contrast',   50, 150],
    ['saturation', 'Saturation', 0, 200],
    ['warmth',     'Warmth',   -50, 50],
  ];
  return rows.map(([k, label, lo, hi]) => `<div class="sv-field">
      <label>${label} · ${a[k]}</label>
      <input class="sv-slider" type="range" min="${lo}" max="${hi}" value="${a[k]}" data-input="adj" data-arg="${k}">
    </div>`).join('')
    + `<button class="sv-add" data-act="resetAdjust">Reset everything to normal</button>`;
}

function svSheetOverlays(st){
  return `<div class="sv-grid g2" style="margin-bottom:16px">
      <button class="sv-cell" data-act="addText">${svIcon('text')}<span class="sub">Add text</span></button>
      <button class="sv-cell" data-act="addImageOv">${svIcon('image')}<span class="sub">Add a photo</span></button>
      <button class="sv-cell" data-act="addVideoOv">${svIcon('video')}<span class="sub">Add a video</span></button>
    </div>
    ${st.overlays.length ? `<div class="sv-sheet-note">${st.overlays.length} overlay${st.overlays.length === 1 ? '' : 's'} on the timeline. Drag them on the video to reposition, or remove them with the red button.</div>`
      : '<div class="sv-sheet-note">An overlay sits on top of your video — a caption card, a photo, or a second video. Drag it anywhere on the preview.</div>'}`;
}

function svSheetText(st){
  const o = svFindOverlay(st.editText);
  if (!o) return '<div class="sv-sheet-note">Nothing selected.</div>';
  const styles = ['bold', 'clean', 'serif', 'outline', 'shadow', 'highlight'];
  const colors = ['#FFFFFF', '#0A0A0F', '#F5C518', '#EF4444', '#EC4899', '#7C3AED', '#3B82F6', '#4ADE80', '#F97316'];
  const total = Math.max(1000, smTotalMs(st.clips));
  return `<div class="sv-field">
      <label>Text</label>
      <input class="sv-input" value="${esc(o.text || '')}" data-input="ovText" placeholder="Type something">
    </div>
    <div class="sv-field">
      <label>Style</label>
      <div class="sv-grid g3">
        ${styles.map(s => `<button class="sv-cell ${o.style === s ? 'on' : ''}" data-act="ovStyle" data-arg="${s}">${s}</button>`).join('')}
      </div>
    </div>
    <div class="sv-field">
      <label>Colour</label>
      <div class="sv-colors">
        ${colors.map(c => `<button class="sv-dot ${(o.color || '#FFFFFF') === c ? 'on' : ''}" data-act="ovColor" data-arg="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
      </div>
    </div>
    <div class="sv-field">
      <label>Size · ${o.size || 30}</label>
      <input class="sv-slider" type="range" min="14" max="60" value="${o.size || 30}" data-input="ovSize">
    </div>
    <div class="sv-field">
      <label>Shows for · ${Math.round((o.endMs - o.startMs) / 1000)}s</label>
      <input class="sv-slider" type="range" min="1" max="${Math.ceil(total / 1000)}" value="${Math.round((o.endMs - o.startMs) / 1000)}" data-input="ovDur">
    </div>
    <button class="sv-add" data-act="deleteOverlay" data-arg="${o.id}" style="color:#FB7185;border-color:#FB718566">Remove this overlay</button>`;
}

/**
 * Opens a URL as a media file in its own element and hands back the URL. Used
 * where a clip needs a second, independent reader (the review player) without
 * disturbing the editor's persistent video element.
 */
function svMediaElement(url){
  const v = document.createElement('video');
  v.playsInline = true; v.preload = 'metadata';
  v.src = url;
  return v;
}

function svHandleInput(name, el, arg){
  const st = svState();
  const val = el && el.value;
  if (name === 'promptSpeed'){ st.promptSpeed = Number(val); }
  else if (name === 'trimIn' || name === 'trimOut'){
    const c = st.clips.find(x => x.id === st.selectedId);
    if (c) svApplyTrimSlider(c, name === 'trimIn' ? 'in' : 'out', Number(val));
  }
  else if (name === 'capSize'){ st.capStyle.size = Number(val); svApplyCapLive(); }
  else if (name === 'capPos'){ st.capStyle.y = Number(val); svApplyCapLive(); }
  else if (name === 'adj'){ st.adjust[arg] = Number(val); svApplyPreview(); }
  else if (name === 'ovText'){ const o = svFindOverlay(st.editText); if (o) o.text = val; svApplyOverlayLive(); }
  else if (name === 'ovSize'){ const o = svFindOverlay(st.editText); if (o){ o.size = Number(val); svApplyOverlayLive(); } }
  else if (name === 'ovDur'){
    const o = svFindOverlay(st.editText);
    if (o) o.endMs = Math.min(smTotalMs(st.clips) || Infinity, o.startMs + Number(val) * 1000);
  }
  else if (name === 'musicVol'){
    const a = st.audioTracks.find(x => x.id === arg);
    if (a) a.volume = Number(val);
  }
}

/* Live controls (sliders and text fields) are marked with data-input and live
   on the same delegation as everything else — one listener for the Studio.
   They are deliberately NOT data-act, so a stray click can never fire them. */
document.addEventListener('input', function (e){
  const host = e.target.closest && e.target.closest('.sv-root');
  if (!host) return;
  const t = e.target.closest('[data-input]');
  if (!t) return;
  try { svHandleInput(t.dataset.input, t, t.dataset.arg); }
  catch (err){ console.warn('[studio] input ' + t.dataset.input, err); }
}, false);

// The sheet sliders drive the same model fields as the drag handles, so the
// two representations can never disagree.
function svApplyTrimSlider(clip, edge, valueMs){
  const next = edge === 'in'
    ? smTrim(clip, { inMs: valueMs }, 400)
    : smTrim(clip, { outMs: valueMs }, 400);
  clip.inMs = edge === 'in' ? next.inMs : clip.inMs;
  clip.outMs = edge === 'out' ? next.outMs : clip.outMs;
  const bar = document.querySelector('.sv-trim-sel');
  const src = Math.max(1, (clip.dur || 0) * 1000);
  if (bar){
    bar.style.left = (clip.inMs / src) * 100 + '%';
    bar.style.width = (smClipMs(clip) / src) * 100 + '%';
  }
  const read = document.getElementById('sv-trim-read');
  if (read){
    read.innerHTML = '<span>In</span>' + smFormatMs(clip.inMs) +
      '<span>Length</span>' + smFormatMs(smClipMs(clip)) +
      '<span>Out</span>' + smFormatMs(clip.outMs);
  }
  svTimelineWidth();
  svRepaintTimeline();
}

/* ── PLAYBACK ENGINE ────────────────────────────────────────────────────── */
// One ticker drives the preview, the playhead and the caption card. Nothing
// else in the file schedules its own animation frame.

const SVE = { raf: null, loading: false };

function svLoadAt(ms, seek){
  const st = svState();
  const loc = smLocate(st.clips, ms);
  if (!loc) return;
  const v = svVideoSrc(loc.clip.url);
  v.dataset.cid = loc.clip.id;
  const target = loc.sourceMs / 1000;
  if (seek && Math.abs((v.currentTime || 0) - target) > 0.08){
    try { v.currentTime = target; } catch (_){}
  }
}

/* Kept for core.js, which calls this after a render to re-sync the preview. */
window.csLoadCurrent = function (seek){ svLoadAt(svState().playhead, seek !== false); };
window.csActiveVideo = function (){ return svMedia(); };
window.csApplyPreview = svApplyPreview;

function svPlay(){
  const st = svState();
  if (!st.clips.length) return;
  st.playing = true;
  svLoadAt(st.playhead, true);
  const v = svMedia();
  v.play().catch(() => {});
  svTick();
  svSyncPlayBtn();
}

function svPause(){
  const st = svState();
  st.playing = false;
  const v = SVMP.v;
  if (v) { try { v.pause(); } catch (_){} }
  cancelAnimationFrame(SVE.raf); SVE.raf = null;
  svSyncPlayBtn();
  // Keep a clip's elapsed time so resuming continues rather than restarts.
  if (v && v.dataset.cid){
    const loc = smLocate(st.clips, st.playhead);
    if (loc && loc.clip.id === v.dataset.cid){
      st.playhead = loc.startMs + svNum((v.currentTime || 0) * 1000 - (loc.clip.inMs || 0), 0, loc.lengthMs);
    }
  }
  svPaintPlayhead();
}

function svTogglePlay(){ const st = svState(); st.playing ? svPause() : svPlay(); }

function svSyncPlayBtn(){
  const btn = document.querySelector('.sv-hud-play');
  if (btn) btn.innerHTML = svIcon(svState().playing ? 'pause' : 'play');
}

function svTick(){
  cancelAnimationFrame(SVE.raf);
  const step = () => {
    const st = S.studio;
    if (!st || !st.playing) return;
    const total = smTotalMs(st.clips);
    const v = SVMP.v;
    const loc = smLocate(st.clips, st.playhead);
    if (loc && v){
      // If the video element drifted to a different clip (a seek, or the end
      // of the previous one), swap the source before reading its clock.
      if (v.dataset.cid !== loc.clip.id){
        svLoadAt(st.playhead, true);
        v.play().catch(() => {});
      } else {
        const into = svNum((v.currentTime || 0) * 1000 - (loc.clip.inMs || 0), 0, loc.lengthMs);
        st.playhead = loc.startMs + into;
        // Reaching the end of this clip's kept window advances to the next one.
        if (into >= loc.lengthMs - 40){
          const nextStart = loc.startMs + loc.lengthMs;
          if (nextStart >= total - 20){ st.playhead = total; st.playing = false; svSyncPlayBtn(); svPaintPlayhead(); svSyncOverlays(); return; }
          st.playhead = nextStart;
          svLoadAt(st.playhead, true);
          v.play().catch(() => {});
        }
      }
    }
    svPaintPlayhead();
    svSyncOverlays();
    SVE.raf = requestAnimationFrame(step);
  };
  SVE.raf = requestAnimationFrame(step);
}

// Caption card + overlay visibility follow the playhead, so scrubbing shows
// exactly what will be on screen at that moment.
function svSyncOverlays(){
  const st = svState();
  const cap = smCaptionAt(st.captions, st.playhead);
  const el = document.getElementById('sv-ed-cap');
  if (el){
    el.textContent = cap ? cap.text : '';
    el.classList.toggle('off', !cap);
  }
}

function svAttachMedia(){
  const host = document.getElementById('sv-media');
  if (!host) return;
  const st = svState();
  const v = svMedia();
  if (v.parentNode !== host) host.appendChild(v);
  const loc = smLocate(st.clips, st.playhead);
  if (loc){
    svVideoSrc(loc.clip.url);
    v.dataset.cid = loc.clip.id;
    // Seek on the next frame, once metadata is available — setting
    // currentTime before the media is ready is silently ignored.
    const seek = () => { try { v.currentTime = loc.sourceMs / 1000; } catch (_){} };
    if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true });
  } else if (!st.clips.length){
    host.innerHTML = '<div class="sv-empty-note">No clips on the timeline.<br>Go back and record or upload one.</div>';
  }
}

/* ── HISTORY ────────────────────────────────────────────────────────────── */

function svPush(){
  const st = svState();
  st.history = st.history || [];
  st.future = [];
  st.history.push(JSON.stringify(smSnapshot(st)));
  if (st.history.length > 40) st.history.shift();
}

function svRestore(json){
  const st = svState();
  const snap = JSON.parse(json);
  // Media (blob/url/thumb) is keyed off the live clips, since it cannot be
  // serialised — the restored clip re-attaches to the media it still has.
  const byId = new Map(st.clips.map(c => [c.id, c]));
  // Parked media is a valid source too, so a clip removed by Delete can be
  // brought back by Undo with its footage intact.
  const restored = smRestore(snap);
  st.clips = restored.clips.map(c => {
    const live = byId.get(c.id) || svParkedOf(c.id) || {};
    return Object.assign({}, c, { url: live.url, blob: live.blob, thumb: live.thumb || '' });
  });
  st.overlays = restored.overlays.filter(o => o.kind !== 'image' && o.kind !== 'video'
    || st.overlays.some(x => x.id === o.id && x.url));
  st.overlays = restored.overlays.map(o => {
    const live = st.overlays.find(x => x.id === o.id);
    return live ? Object.assign({}, o, { url: live.url }) : o;
  });
  st.captions = restored.captions;
  st.capStyle = restored.capStyle || st.capStyle;
  st.filter = restored.filter;
  st.playhead = svNum(st.playhead, 0, smTotalMs(st.clips));
  if (!st.clips.some(c => c.id === st.selectedId)){ st.selectedId = st.clips[0] ? st.clips[0].id : null; st.selectedType = st.clips.length ? 'video' : null; }
}

function svUndo(){
  const st = svState();
  if (!st.history.length) return;
  const current = JSON.stringify(smSnapshot(st));
  st.future.push(current);
  const snap = st.history.pop();
  svRestore(snap);
  render();
  svToast('Undone');
}
function svRedo(){
  const st = svState();
  if (!st.future.length) return;
  st.history.push(JSON.stringify(smSnapshot(st)));
  const snap = st.future.pop();
  svRestore(snap);
  render();
  svToast('Redone');
}

/* ── EXPORT ─────────────────────────────────────────────────────────────── */
// Rendered with ffmpeg.wasm, loaded on demand. The command is assembled from
// the same model the timeline draws, so what you see is what you get:
//   trim each clip → concat in timeline order → colour filter → overlays →
//   burnt-in captions → audio mix → mp4.

// Self-hosted, NOT a CDN. @ffmpeg/ffmpeg boots its core inside a Web Worker,
// and a Worker can only be constructed from a SAME-ORIGIN script. unpkg serves
// these without `Access-Control-Allow-Origin`, so loading them cross-origin
// throws "Script at ... cannot be accessed from origin" and every export died
// on the spot. Serving them from our own origin removes the restriction.
// Re-vendor with: bash scripts/vendor-ffmpeg.sh
const SVFF = {
  core: '/vendor/ffmpeg',
  umd:  '/vendor/ffmpeg/ffmpeg.js',
  util: '/vendor/ffmpeg/util.js',
  inst: null, loading: null, cancel: false,
};

// A failed or cancelled load must clear the in-flight promise. Without this,
// SVFF.loading stayed truthy forever, so svFfmpeg() kept handing back the same
// rejected promise and Export could never recover — the user had to reload the
// whole page to try again.
function svFfmpegReset(){
  SVFF.loading = null;
  SVFF.inst = null;
}

function svLoadScript(src){
  return new Promise((res, rej) => {
    if (document.querySelector('script[data-sv="' + src + '"]')) return res();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.dataset.sv = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}

async function svFfmpeg(){
  if (SVFF.inst) return SVFF.inst;
  if (SVFF.loading) return SVFF.loading;
  SVFF.loading = (async () => {
    svExportNote('Loading the video engine…', 2);
    try {
      await svLoadScript(SVFF.umd);
      await svLoadScript(SVFF.util);
      const FF = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
      const U = window.FFmpegUtil;
      if (!FF || !U) throw new Error('The video engine did not load. Check your connection and try again.');
      const inst = new FF();
      inst.on('progress', ({ progress }) => {
        const pct = Math.max(2, Math.min(97, Math.round((Number(progress) || 0) * 94)));
        svExportNote('Rendering…', pct);
      });
      await inst.load({
        coreURL: await U.toBlobURL(SVFF.core + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await U.toBlobURL(SVFF.core + '/ffmpeg-core.wasm', 'application/wasm'),
      });
      SVFF.inst = inst;
      return inst;
    } catch (err){
      // Leave nothing behind that would poison the next attempt.
      svFfmpegReset();
      throw err;
    }
  })();
  return SVFF.loading;
}

function svExportNote(note, pct){
  const st = S.studio;
  if (!st) return;
  if (note) st.exportNote = note;
  if (pct != null) st.exportPct = pct;
  const noteEl = document.querySelector('.sv-export-note');
  const pctEl = document.querySelector('.sv-ring span');
  const arc = document.querySelector('.sv-ring .fg');
  if (noteEl) noteEl.textContent = st.exportNote;
  if (pctEl) pctEl.textContent = Math.round(st.exportPct) + '%';
  if (arc){
    const C = 2 * Math.PI * 16;
    arc.setAttribute('stroke-dashoffset', (C * (1 - st.exportPct / 100)).toFixed(1));
  }
}

function svExtOf(blob){ return (blob && blob.type && blob.type.includes('mp4')) ? 'mp4' : 'webm'; }

/* Draws a caption or text card to a PNG at the export resolution, so the
   burnt-in words match what the preview showed. Rendering to an image avoids
   needing a font file inside the wasm build. */
function svTextPng(text, opts, W, H){
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const o = opts || {};
  const size = Math.round((o.size || 34) * (H / 1280));
  const font = o.serif ? 'Georgia, serif' : 'Inter, system-ui, sans-serif';
  ctx.font = (o.weight || 800) + ' ' + size + 'px ' + font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = W * ((o.width || 88) / 100);
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words){
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line){ lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const lh = size * 1.28;
  const blockH = lines.length * lh;
  const cx = W / 2;
  const cy = H * ((o.y || 78) / 100) - blockH / 2 + lh / 2;
  lines.forEach((ln, i) => {
    const y = cy + i * lh;
    if (o.boxed){
      const tw = ctx.measureText(ln).width;
      ctx.fillStyle = o.bg || '#FFFFFF';
      const pad = size * 0.3;
      ctx.fillRect(cx - tw / 2 - pad, y - lh / 2, tw + pad * 2, lh);
      ctx.fillStyle = o.bgText || '#0A0A0F';
    } else {
      if (o.stroke){ ctx.lineWidth = Math.max(2, size * 0.09); ctx.strokeStyle = '#000'; ctx.strokeText(ln, cx, y); }
      ctx.fillStyle = o.color || '#FFFFFF';
      if (o.shadow){ ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = size * 0.3; ctx.shadowOffsetY = size * 0.08; }
    }
    ctx.fillText(ln, cx, y);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  });
  return new Promise(res => canvas.toBlob(b => res(b), 'image/png'));
}

function svCapPngOpts(st){
  const p = st.capStyle.preset;
  const base = { size: st.capStyle.size || 34, y: st.capStyle.y || 78, width: st.capStyle.width || 88 };
  if (p === 'boxed') return Object.assign(base, { boxed: true, bg: '#FFFFFF', bgText: '#0A0A0F', weight: 800 });
  if (p === 'pop') return Object.assign(base, { color: '#F5C518', stroke: true, weight: 800 });
  if (p === 'italic') return Object.assign(base, { serif: true, weight: 600, shadow: true });
  if (p === 'karaoke') return Object.assign(base, { boxed: true, bg: 'rgba(124,58,237,.85)', bgText: '#FFFFFF', weight: 800 });
  if (p === 'minimal') return Object.assign(base, { color: 'rgba(255,255,255,.92)', weight: 500, size: (st.capStyle.size || 34) * 0.9 });
  return Object.assign(base, { shadow: true, weight: 700 });
}

function svDownload(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (_){} }, 4000);
}

window.svCancelExport = function (){
  SVFF.cancel = true;
  try { if (SVFF.inst) SVFF.inst.terminate(); } catch (_){}
  svFfmpegReset();
  const st = S.studio;
  if (st){ st.exporting = false; st.exportNote = ''; }
  render();
};

window.svExport = async function (){
  const st = svState();
  if (!st.clips.length) return svToast('Add a clip first');
  SVFF.cancel = false;
  st.exporting = true; st.exportPct = 0; st.exportNote = 'Preparing…';
  svPause();
  render();

  try {
    const q = svQualityFor(st);
    const res = smExportRes(st.quality || svAutoQuality(), {
      '540p':  { width: 540,  height: 960,  fps: 24 },
      '720p':  { width: 720,  height: 1280, fps: 30 },
      '1080p': { width: 1080, height: 1920, fps: 30 },
      '2160p': { width: 2160, height: 3840, fps: 30 },
    });
    const ff = await svFfmpeg();
    const plan = smExportPlan(st);

    const inputArgs = [];
    const filterParts = [];
    const vLabels = [];
    const aLabels = [];
    let idx = 0;
    const written = [];

    // 1. Each clip: write it, trim its kept window, normalise its size.
    for (let i = 0; i < st.clips.length; i++){
      const c = st.clips[i];
      const name = 'c' + i + '.' + svExtOf(c.blob);
      const buf = new Uint8Array(await c.blob.arrayBuffer());
      await ff.writeFile(name, buf);
      written.push(name);
      inputArgs.push('-i', name);
      const inS = ((c.inMs || 0) / 1000).toFixed(3);
      const outS = ((c.outMs || 0) / 1000).toFixed(3);
      filterParts.push(
        '[' + idx + ':v]trim=start=' + inS + ':end=' + outS + ',setpts=PTS-STARTPTS,' +
        'scale=' + res.width + ':' + res.height + ':force_original_aspect_ratio=decrease,' +
        'pad=' + res.width + ':' + res.height + ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=' + res.fps + '[v' + i + ']'
      );
      vLabels.push('[v' + i + ']');
      // Audio is optional: a silent upload has no audio stream at all, and
      // referencing one would fail the whole command.
      filterParts.push('[' + idx + ':a]atrim=start=' + inS + ':end=' + outS + ',asetpts=PTS-STARTPTS[a' + i + ']');
      aLabels.push('[a' + i + ']');
      idx++;
    }

    // 2. Stitch them into one continuous track, in timeline order.
    filterParts.push(vLabels.join('') + 'concat=n=' + st.clips.length + ':v=1:a=0[vcat]');
    let vCur = '[vcat]';
    const hasClipAudio = st.clips.every(c => c.blob && /webm|mp4|quicktime/.test(c.blob.type || ''));
    if (hasClipAudio){
      filterParts.push(aLabels.join('') + 'concat=n=' + st.clips.length + ':v=0:a=1[acat]');
    }

    // 3. Colour: filter preset plus the manual adjustments.
    const adj = st.adjust;
    const eq = 'eq=brightness=' + ((adj.brightness - 100) / 200).toFixed(3)
             + ':contrast=' + (adj.contrast / 100).toFixed(3)
             + ':saturation=' + (adj.saturation / 100).toFixed(3);
    const presetEq = {
      vivid: ',eq=saturation=1.35:contrast=1.08', warm: ',colorbalance=rs=.08:bs=-.06',
      cool: ',colorbalance=bs=.08:rs=-.05', mono: ',hue=s=0,eq=contrast=1.1',
      noir: ',hue=s=0,eq=contrast=1.35:brightness=-.06', fade: ',eq=contrast=.88:brightness=.06:saturation=.85',
      punch: ',eq=contrast=1.25:saturation=1.25', retro: ',hue=s=.7,eq=contrast=.94',
    }[st.filter] || '';
    filterParts.push(vCur + eq + presetEq + '[vlook]');
    vCur = '[vlook]';

    // 4. Overlays and captions, burnt in at their own time windows.
    const burn = [];
    for (const o of st.overlays){
      let png = null;
      if (o.kind === 'text'){
        png = await svTextPng(o.text, {
          size: o.size || 30, serif: o.style === 'serif', shadow: o.style === 'shadow',
          stroke: o.style === 'outline', weight: o.style === 'bold' || o.style === 'outline' ? 800 : 700,
          color: o.color || '#FFFFFF', y: o.y, width: 90,
        }, res.width, res.height);
      } else if (o.kind === 'image'){
        png = o.blob || null;
      }
      if (!png) continue;   // video overlays are handled as extra inputs below
      const nm = 'ov' + burn.length + '.png';
      await ff.writeFile(nm, new Uint8Array(await png.arrayBuffer()));
      written.push(nm);
      inputArgs.push('-i', nm);
      burn.push({ label: 'ov' + burn.length, idx: idx, x: o.x, y: o.y, startMs: o.startMs, endMs: o.endMs, w: o.kind === 'image' ? 0.35 : 1 });
      idx++;
    }
    // Caption cards, one image per line.
    for (let i = 0; i < st.captions.length; i++){
      const cap = st.captions[i];
      const png = await svTextPng(cap.text, svCapPngOpts(st), res.width, res.height);
      if (!png) continue;
      const nm = 'cap' + i + '.png';
      await ff.writeFile(nm, new Uint8Array(await png.arrayBuffer()));
      written.push(nm);
      inputArgs.push('-i', nm);
      burn.push({ label: 'cap' + i, idx: idx, x: 50, y: 50, startMs: cap.startMs, endMs: cap.endMs, w: 1, full: true });
      idx++;
    }

    burn.forEach((b, n) => {
      const out = '[ovl' + n + ']';
      const xExpr = b.full ? '0' : 'W*' + (b.x / 100).toFixed(4) + '-w/2';
      const yExpr = b.full ? '0' : 'H*' + (b.y / 100).toFixed(4) + '-h/2';
      const scale = b.w && b.w < 1 ? 'scale=iw*' + b.w + ':ih*' + b.w + ',' : '';
      filterParts.push('[' + b.idx + ':v]' + scale + 'format=rgba[o' + n + 's]');
      filterParts.push(vCur + '[o' + n + 's]overlay=' + xExpr + ':' + yExpr +
        ':enable=\'between(t,' + (b.startMs / 1000).toFixed(3) + ',' + (b.endMs / 1000).toFixed(3) + ')\'[ovl' + n + ']');
      vCur = out;
    });

    // 5. Audio: the clips' own sound, plus music and effects on top.
    let audioMap = null;
    const aInputs = [];
    if (hasClipAudio) aInputs.push({ label: '[acat]', vol: 1 });
    for (const a of st.audioTracks){
      if (!a.blob) continue;
      const nm = 'a' + aInputs.length + '.' + (a.blob.type.includes('wav') ? 'wav' : 'mp3');
      await ff.writeFile(nm, new Uint8Array(await a.blob.arrayBuffer()));
      written.push(nm);
      inputArgs.push('-i', nm);
      filterParts.push('[' + idx + ':a]adelay=' + Math.round(a.startMs || 0) + '|' + Math.round(a.startMs || 0) +
        ',volume=' + ((a.volume || 40) / 100) + '[au' + aInputs.length + ']');
      aInputs.push({ label: '[au' + aInputs.length + ']', vol: 1 });
      idx++;
    }
    if (aInputs.length === 1){
      // Keep the brackets. `-map` must name a filtergraph output as [label];
      // passing the bare name makes ffmpeg read it as an *input stream
      // specifier* (“Invalid stream specifier: acat” → “Stream map 'acat'
      // matches no streams” → Aborted). This was stripping them, which failed
      // every render.
      audioMap = aInputs[0].label;
    } else if (aInputs.length > 1){
      filterParts.push(aInputs.map(a => a.label).join('') + 'amix=inputs=' + aInputs.length + ':duration=first:dropout_transition=0[aout]');
      audioMap = '[aout]';
    }
    // A video with music but no recorded sound still needs a silent base, or
    // the mixed track would be shorter than the picture.
    if (!hasClipAudio && aInputs.length){
      filterParts.push('anullsrc=channel_layout=stereo:sample_rate=44100,atrim=0:' +
        (plan.totalMs / 1000).toFixed(3) + '[silent]');
      // aInputs is never empty here, so the mix branch above always produced
      // [aout]; append the silent bed to it rather than leaving it unmapped.
      filterParts.push('[aout][silent]amix=inputs=2:duration=first:dropout_transition=0[amixed]');
      audioMap = '[amixed]';
    }

    const outName = 'creatorpulse.mp4';
    const args = [
      ...inputArgs,
      '-filter_complex', filterParts.join(';'),
      // vCur already carries its brackets — pass it through untouched.
      '-map', vCur,
    ];
    if (audioMap) args.push('-map', audioMap);
    else if (hasClipAudio) args.push('-map', '[acat]');
    args.push(
      '-c:v', 'libx264', '-preset', q.preset, '-crf', String(q.crf),
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    );
    if (audioMap || hasClipAudio) args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-y', outName);

    svExportNote('Rendering ' + res.width + '×' + res.height + '…', 6);
    let code = await ff.exec(args);

    // If the clip audio concat failed (a source with no sound), retry silent
    // so the user still gets their video rather than an error.
    if (code !== 0 && hasClipAudio){
      svExportNote('Retrying without original audio…', 20);
      const retry = args.filter(a => a !== 'acat' && a !== 'acat]');
      const fixed = [];
      for (let i = 0; i < retry.length; i++){
        if (retry[i] === '-map' && retry[i + 1] === '[acat]'){ i++; continue; }
        fixed.push(retry[i]);
      }
      const vIdx = fixed.indexOf('-c:v');
      if (vIdx > -1) fixed.splice(vIdx, 0, '-an');
      code = await ff.exec(fixed);
    }

    if (SVFF.cancel){ st.exporting = false; render(); return; }
    if (code !== 0) throw new Error('The renderer reported an error. Try a shorter video or a lower quality setting.');

    svExportNote('Saving to your phone…', 98);
    const data = await ff.readFile(outName);
    const blob = new Blob([data.buffer || data], { type: 'video/mp4' });
    svDownload(blob, (st.projectName || 'creatorpulse').replace(/[^\w-]+/g, '-').toLowerCase() + '.mp4');

    // Clean the working files out of the wasm filesystem so a second export
    // does not collide with the first.
    for (const f of written.concat([outName])){
      try { await ff.deleteFile(f); } catch (_){}
    }

    st.exporting = false; st.exportPct = 100;
    render();
    svToast('Exported — check your downloads');
  } catch (err){
    console.warn('[studio] export', err);
    // Clear the failed engine first, then report on a fresh tick so the user
    // sees WHY it failed instead of a veil frozen at its last percentage. The
    // render happens before the toast so the toast is not swallowed by it.
    svFfmpegReset();
    setTimeout(() => {
      const st2 = svState();
      st2.exporting = false;
      render();
      const msg = String((err && err.message) || err);
      svToast(/engine|network|fetch|connection|load|worker|origin/i.test(msg)
        ? 'Could not load the video engine — check your internet connection and try again'
        : msg.slice(0, 140));
    }, 0);
  }
};

/* ── OPEN THE STUDIO WITH A SCRIPT ──────────────────────────────────────── */
// Called from the news side of the app. One tap carries the script across
// instead of making the user copy and paste it into the teleprompter.

window.svOpenWithScript = function (text, projectName){
  const st = svState();
  st.script = String(text || '').slice(0, 20000);
  st.showPrompter = !!st.script.trim();
  st.showScriptEditor = false;
  st.projectName = projectName ? String(projectName).slice(0, 40) : 'New project';
  // A fresh shoot each time: stale clips from an abandoned project would be
  // silently mixed into the new one.
  st.clips.forEach(c => svReleaseUrl(c.url));
  svClearParked();
  st.clips = []; st.overlays = []; st.captions = []; st.audioTracks = [];
  st.history = []; st.future = [];
  st.reviewId = null; st.sheet = null; st.editText = null;
  st.running = false; st.paused = false; st.playhead = 0;
  st.mode = 'camera';
  S.tab = 'create';
  render();
  setTimeout(() => svOpenCamera(), 80);
  svToast('Script loaded — the teleprompter is ready');
};

/* ── FIRST-RUN / IDLE SCREEN ────────────────────────────────────────────── */
// A deliberate front door, so entering Create always starts a clean project
// rather than dropping straight into a camera with someone else's state.

function svStartView(st){
  const has = st.clips.length;
  return `<div class="sv-root" id="sv-root" style="padding:0">
    <div class="sv-bar">
      <div class="sv-bar-title">Create Studio</div>
      <div class="sv-bar-r"><button class="sv-icon-btn" data-act="exitCamera" aria-label="Back">${svIcon('close')}</button></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:0 20px 40px">
      <div style="font-family:var(--serif,Georgia,serif);font-size:30px;font-weight:600;letter-spacing:-.02em;line-height:1.15">
        Record it, edit it,<br>post it.
      </div>
      <div style="color:var(--mu);font-size:13.5px;line-height:1.6;margin-bottom:8px">
        Talk to camera with your script on screen, then trim, caption and export — all without leaving CreatorPulse.
      </div>
      <button class="sv-btn-wide primary" data-act="newProject">${svIconSm('video')} Start recording</button>
      <button class="sv-btn-wide ghost" data-act="upload2">${svIconSm('upload')} Upload a video instead</button>
      ${has ? `<button class="sv-btn-wide ghost" data-act="toEditor">${svIconSm('layers')} Continue editing (${st.clips.length})</button>` : ''}
      <input type="file" id="sv-upload" accept="video/*" multiple hidden>
    </div>
  </div>`;
}

/* ── SMALL HELPERS ──────────────────────────────────────────────────────── */

function svToast(msg){
  if (typeof toast === 'function') return toast(msg);
  const el = document.createElement('div');
  el.className = 'sv-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { try { el.remove(); } catch (_){} }, 2600);
}

/* ── BACK-BUTTON + FIRST PAINT ──────────────────────────────────────────── */
// The app's router calls pageCreate() during render; the delegated listeners
// above are registered once at load.

function svNewProject(){
  const st = svState();
  st.mode = 'camera';
  render();
  setTimeout(() => svOpenCamera(), 60);
}

// Wire file inputs whenever the Create tab renders.
const __svObserve = setInterval(() => {
  if (S.studio && S.tab === 'create') svWireInputs();
}, 500);
setTimeout(() => clearInterval(__svObserve), 10 * 60 * 1000);

/* ── COMPATIBILITY ALIASES ──────────────────────────────────────────────── */
// core.js and app.js still reference these names in a few places. They map
// onto the new implementation so nothing outside this file has to change.

window.csOpenSheet       = svOpenSheet;
window.csCloseSheet      = svCloseSheet;
window.csExitCamera      = svExitCamera;
window.csGoToEditor      = svGoToEditor;
window.csConfirmExitEditor = svConfirmExitEditor;
window.csTogglePlay      = svTogglePlay;
window.csSplit           = svSplit;
window.csDuplicate       = svDuplicate;
window.csDeleteSelected  = svDeleteSelected;
window.csAddText         = svAddText;
window.csAddImageClick   = () => { const el = document.getElementById('sv-add-image'); if (el) el.click(); };
window.csReplaceClick    = () => { const el = document.getElementById('sv-replace-clip'); if (el) el.click(); };
window.csAddClipClick    = () => { const el = document.getElementById('sv-add-clip'); if (el) el.click(); };
window.csOpenUpload      = () => { const el = document.getElementById('sv-upload'); if (el) el.click(); };
window.csPushHistory     = svPush;
window.csApplyZoom       = svApplyHardwareZoom;
window.csDeleteOverlay   = svDeleteOverlay;
window.csSetZoom         = window.svSetZoom;
window.csCancelExport    = window.svCancelExport;
window.__svExport        = window.svExport;
