// Pure maths for the Studio's recording performance, teleprompter layout,
// overlay manipulation and speech-derived captions.
//
// Kept free of any DOM reference (no window, no document, no media elements)
// so test/studioPerf.test.js can require it directly and pin the behaviour
// that is otherwise only observable by holding a phone and squinting.
//
// Loaded two ways, exactly like lib/studioModel.js:
//   * Node reads it as CommonJS (module.exports at the bottom) for the tests.
//   * index.html loads it as a classic <script>, where `module` is undefined,
//     the guard is skipped, and every top-level declaration becomes a global
//     that studio.js can call.
//
// ── Why this file exists ────────────────────────────────────────────────────
// Recording was janky and the cause had to be identified by measurement, not
// guesswork. The isolation run (verify/isolate.js) held everything constant and
// varied one factor at a time:
//
//     as shipped (1080p capture + stacked blurs)   37.2 fps   18.7% janky
//     720p capture only                            56.4 fps    2.0% janky
//     blurs removed only                           59.8 fps    0.4% janky
//     both                                          60.0 fps    0.0% janky
//
// Both factors matter, so both are addressed here: spCaptureProfile() decides
// what to ask the camera for, and spAutoFps() decides whether to ask for less
// when the device is still struggling.

// ── Frame pacing ────────────────────────────────────────────────────────────

function spClamp(n, lo, hi){
  n = Number(n);
  if (!isFinite(n)) return lo;
  return n < lo ? lo : (n > hi ? hi : n);
}

// Summarise a list of frame deltas (ms between consecutive animation frames).
// `budgetMs` is the length of one frame at 30fps — anything slower than that
// is a frame the viewer would see as a stutter.
function spFrameStats(dts, budgetMs){
  const list = (Array.isArray(dts) ? dts : []).filter(d => isFinite(d) && d > 0);
  const budget = Number(budgetMs) > 0 ? Number(budgetMs) : 33.4;
  if (list.length < 2) return { frames: list.length, fps: 0, avgFrameMs: 0, p95FrameMs: 0, dropped: 0, jankPct: 0 };
  const sum = list.reduce((a, b) => a + b, 0);
  const avg = sum / list.length;
  const sorted = list.slice().sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const dropped = list.filter(d => d > budget).length;
  return {
    frames: list.length,
    fps: Math.round((1000 / avg) * 10) / 10,
    avgFrameMs: Math.round(avg * 100) / 100,
    p95FrameMs: Math.round(p95 * 100) / 100,
    dropped,
    jankPct: Math.round((dropped / list.length) * 1000) / 10,
  };
}

// Decide the next capture framerate from how the last window actually ran.
// Hysteresis matters: stepping down the instant one frame is late would make
// the setting oscillate, and re-negotiating the camera mid-take is worse than
// a slightly low framerate. So it only moves on a sustained trend.
function spAutoFps(stats, current, opts){
  const o = opts || {};
  const floor = Number(o.floor) || 15;
  const ceiling = Number(o.ceiling) || 30;
  const step = Number(o.step) || 5;
  const janky = o.jankyAt != null ? Number(o.jankyAt) : 12;
  const smooth = o.smoothAt != null ? Number(o.smoothAt) : 4;
  let fps = Math.round(spClamp(current || ceiling, floor, ceiling));
  const j = stats && isFinite(stats.jankPct) ? stats.jankPct : 0;
  if (j >= janky) fps -= step;
  else if (j <= smooth && fps < ceiling) fps += step;
  return Math.round(spClamp(fps, floor, ceiling));
}

// ── Capture profiles ────────────────────────────────────────────────────────
// What we ASK the camera for. 1080p is what shipped and it is what the phone
// could not keep up with: the synthetic rig negotiated 1080x1920@20 on a
// 4-core box, and a real mid-range phone behaves the same way. Asking for a
// smaller frame means MediaRecorder does far less work per frame, and the
// picture on screen is passed through untouched regardless — only the
// recorded file is affected.

const SP_TIERS = ['light', 'balanced', 'high'];

const SP_PROFILES = {
  light:    { width: 480,  height: 854,  fps: 24, videoBitsPerSecond: 1200000 },
  balanced: { width: 720,  height: 1280, fps: 30, videoBitsPerSecond: 2200000 },
  high:     { width: 1080, height: 1920, fps: 30, videoBitsPerSecond: 4200000 },
};

function spCaptureProfile(tier){
  const t = SP_TIERS.indexOf(tier) >= 0 ? tier : 'balanced';
  const p = SP_PROFILES[t];
  // H.264 requires even dimensions; an odd width fails the whole encode.
  const even = n => Math.max(2, Math.round(Number(n) / 2) * 2);
  return {
    tier: t,
    width: even(p.width),
    height: even(p.height),
    fps: Math.round(p.fps),
    videoBitsPerSecond: Math.round(p.videoBitsPerSecond),
  };
}

// The next profile down, or null when already at the lightest.
function spLighterTier(tier){
  const i = SP_TIERS.indexOf(tier);
  if (i <= 0) return null;
  return SP_TIERS[i - 1];
}

function spHeavierTier(tier){
  const i = SP_TIERS.indexOf(tier);
  if (i < 0 || i >= SP_TIERS.length - 1) return null;
  return SP_TIERS[i + 1];
}

// Pick a starting tier. A low-core or memory-starved device starts light
// rather than discovering it is struggling after the user has already
// recorded a ruined take. `saveData` is the browser's own data-saver signal.
function spAutoTier(device){
  const d = device || {};
  const cores = Number(d.cores);
  const mem = Number(d.deviceMemory);
  if (d.saveData) return 'light';
  if (isFinite(mem) && mem > 0 && mem <= 2) return 'light';
  if (!isFinite(cores) || cores <= 0) return 'balanced';
  if (cores <= 3) return 'light';
  if (cores <= 5) return 'balanced';
  return 'high';
}

// ── Teleprompter geometry ───────────────────────────────────────────────────
// The prompter is positioned by percentage of the stage so its position means
// the same thing on every screen, and the font size is a user setting with a
// readable floor and a ceiling that still leaves the subject visible.

function spPrompterGeometry(stage, size, pos){
  const s = stage || {};
  const stageW = Math.max(1, Number(s.width) || 1);
  const stageH = Math.max(1, Number(s.height) || 1);
  const p = pos || {};
  const fontPx = Math.round(spClamp(size != null ? size : 20, 12, 46));
  const x = spClamp(p.x != null ? p.x : 50, 0, 100);
  const y = spClamp(p.y != null ? p.y : 30, 0, 100);
  // The window is a share of the stage, never a fixed pixel height, so a tall
  // script scrolls on a short phone instead of overflowing the frame.
  const widthPct = spClamp(p.w != null ? p.w : 88, 40, 100);
  const windowPct = spClamp(p.h != null ? p.h : 34, 18, 70);
  const width = Math.round((stageW * widthPct) / 100);
  return {
    x, y, fontPx,
    width,
    height: Math.round((stageH * windowPct) / 100),
    heightPct: Math.round(windowPct),
    left: Math.round((stageW * x) / 100 - width / 2),
    top: Math.round((stageH * y) / 100),
    lineHeight: Math.round(fontPx * 1.6),
  };
}

// Keep the prompter box fully on screen after a drag. A box dragged half off
// the edge is unrecoverable without a setting to reset it, so the position is
// clamped by half the box rather than to the raw screen bounds.
function spPrompterClamp(pos, stage, box){
  const s = stage || {};
  const b = box || {};
  const stageW = Math.max(1, Number(s.width) || 1);
  const stageH = Math.max(1, Number(s.height) || 1);
  const halfW = ((Number(b.width) || 0) / 2) / stageW * 100;
  const boxH = (Number(b.height) || 0) / stageH * 100;
  return {
    x: Math.round(spClamp(pos && pos.x, halfW, 100 - halfW) * 10) / 10,
    y: Math.round(spClamp(pos && pos.y, 0, Math.max(0, 100 - boxH)) * 10) / 10,
  };
}

// ── Overlay manipulation ────────────────────────────────────────────────────
// Overlays are stored as percentages of the stage, so a drag has to convert
// pixels to percentages and then clamp. Doing the arithmetic here keeps the
// gesture itself to four lines and makes the clamping testable.

function spOverlayMove(o, dxPct, dyPct, stage, box){
  const s = stage || {};
  const b = box || {};
  const stageW = Math.max(1, Number(s.width) || 1);
  const stageH = Math.max(1, Number(s.height) || 1);
  const halfW = ((Number(b.width) || 0) / 2) / stageW * 100;
  const halfH = ((Number(b.height) || 0) / 2) / stageH * 100;
  return {
    x: Math.round(spClamp((Number(o && o.x) || 0) + Number(dxPct || 0), halfW, 100 - halfW) * 100) / 100,
    y: Math.round(spClamp((Number(o && o.y) || 0) + Number(dyPct || 0), halfH, 100 - halfH) * 100) / 100,
  };
}

// Scale from a pinch (finger distance ratio) or a corner-handle drag.
function spOverlayScale(current, factor, opts){
  const o = opts || {};
  const lo = Number(o.min) || 0.25;
  const hi = Number(o.max) || 4;
  const next = (Number(current) || 1) * (Number(factor) || 1);
  return Math.round(spClamp(next, lo, hi) * 1000) / 1000;
}

// A crop window, expressed as insets in percent from each edge. Capping each
// at 45% and each opposite pair at 80% means a crop can never collapse the
// content to nothing and leave an invisible overlay the user cannot find.
function spCrop(next, current){
  const c = Object.assign({ t: 0, r: 0, b: 0, l: 0 }, current || {});
  const out = {
    t: spClamp(next && next.t != null ? next.t : c.t, 0, 45),
    r: spClamp(next && next.r != null ? next.r : c.r, 0, 45),
    b: spClamp(next && next.b != null ? next.b : c.b, 0, 45),
    l: spClamp(next && next.l != null ? next.l : c.l, 0, 45),
  };
  const cap = Number(next && next.cap != null ? next.cap : 80);
  if (out.t + out.b > cap){
    const k = cap / (out.t + out.b);
    out.t = Math.round(out.t * k * 100) / 100;
    out.b = Math.round(out.b * k * 100) / 100;
  }
  if (out.l + out.r > cap){
    const k = cap / (out.l + out.r);
    out.l = Math.round(out.l * k * 100) / 100;
    out.r = Math.round(out.r * k * 100) / 100;
  }
  return { t: Math.round(out.t * 100) / 100, r: Math.round(out.r * 100) / 100,
           b: Math.round(out.b * 100) / 100, l: Math.round(out.l * 100) / 100 };
}

function spCropIsIdentity(c){
  const x = c || {};
  return !(Number(x.t) || 0) && !(Number(x.r) || 0) && !(Number(x.b) || 0) && !(Number(x.l) || 0);
}

function spCropCss(c){
  if (spCropIsIdentity(c)) return '';
  const x = spCrop(c);
  return 'inset(' + x.t + '% ' + x.r + '% ' + x.b + '% ' + x.l + '%)';
}

// The same crop as an ffmpeg filter, so the export matches the preview.
// ffmpeg crops in pixels from a corner and needs whole numbers.
function spCropFfmpeg(c, width, height){
  if (spCropIsIdentity(c)) return null;
  const x = spCrop(c);
  const w = Math.max(16, Number(width) || 0);
  const h = Math.max(16, Number(height) || 0);
  const cw = Math.max(2, Math.round(w * (100 - x.l - x.r) / 100 / 2) * 2);
  const ch = Math.max(2, Math.round(h * (100 - x.t - x.b) / 100 / 2) * 2);
  return 'crop=' + cw + ':' + ch + ':' + Math.round(w * x.l / 100) + ':' + Math.round(h * x.t / 100);
}

// ── Speech-derived captions ─────────────────────────────────────────────────
// The point of these: people do NOT read the teleprompter word for word, so
// captions built from the script drift out of sync with what was actually
// said. These work from recognised speech instead.

// The browser hands back a growing transcript; finalised phrases arrive with a
// timestamp. This decides whether the phrase that just ended should start a
// new card or extend the current one, using the same readable limits as the
// script-based path so both look identical on screen.
function spShouldBreakCue(lastAtMs, atMs, text, opts){
  const o = opts || {};
  const gapMs = Number(o.gapMs) || 450;
  const wordsPerCard = Number(o.wordsPerCard) || 5;
  const maxChars = Number(o.maxChars) || 42;
  const t = String(text || '').trim();
  if (!t) return false;
  if (lastAtMs == null) return false;
  if (Number(atMs) - Number(lastAtMs) >= gapMs) return true;
  if ((t + ' ' + (o.prev || '')).split(/\s+/).filter(Boolean).length > wordsPerCard) return true;
  if (t.length >= maxChars) return true;
  return false;
}

// Turn recognised phrases into caption cards laid out on ONE clip's timeline.
//
// `segments` are `[{ text, atMs }]` where atMs is milliseconds into the take as
// it was recorded. The clip keeps only `[inMs, outMs]` of its source, and the
// timeline shows that kept window from `startMs` onward — so a phrase spoken
// before the trim point is dropped, and everything after it shifts left by the
// trim. Getting this wrong is exactly why script-based captions drifted.
function spCaptionsFromSpeech(segments, clip, opts){
  const o = opts || {};
  const list = (Array.isArray(segments) ? segments : [])
    .filter(s => s && String(s.text || '').trim())
    .slice()
    .sort((a, b) => (Number(a.atMs) || 0) - (Number(b.atMs) || 0));
  if (!clip || !list.length) return [];

  const inMs = Math.max(0, Number(clip.inMs) || 0);
  const outMs = Math.max(inMs, Number(clip.outMs) || Math.max(inMs, (Number(clip.dur) || 0) * 1000));
  const startMs = Math.max(0, Number(o.startMs) || 0);
  const wordsPerCard = Number(o.wordsPerCard) || 5;
  const maxChars = Number(o.maxChars) || 42;
  const minMs = Number(o.minMs) || 300;

  // Keep only what is both spoken AND inside the kept window.
  const kept = list.filter(s => (Number(s.atMs) || 0) >= inMs && (Number(s.atMs) || 0) <= outMs);
  if (!kept.length) return [];

  const cards = [];
  let cur = null;
  for (let i = 0; i < kept.length; i++){
    const s = kept[i];
    const at = Number(s.atMs) || 0;
    const text = String(s.text).trim();
    const prev = cur ? cur.text : '';
    const brk = cur && spShouldBreakCue(cur.lastAtMs, at, text, {
      gapMs: o.gapMs, wordsPerCard, maxChars, prev,
    });
    if (brk){
      cards.push(cur);
      cur = null;
    }
    if (!cur){
      cur = {
        text,
        startMs: startMs + Math.max(0, at - inMs),
        endMs: startMs + Math.max(0, at - inMs),
        lastAtMs: at,
      };
    } else {
      cur.text = (cur.text + ' ' + text).trim();
      cur.lastAtMs = at;
      cur.endMs = startMs + Math.max(0, at - inMs);
    }
  }
  if (cur) cards.push(cur);

  // A card runs until the next one begins; the last one gets a readable tail.
  const tail = Number(o.tailMs) || 1200;
  return cards.map((c, i) => {
    const next = cards[i + 1];
    let end = next ? next.startMs : Math.max(c.endMs + tail, c.startMs + minMs);
    if (end - c.startMs < minMs) end = c.startMs + minMs;
    return { id: 'sc' + (i + 1), text: c.text, startMs: Math.round(c.startMs), endMs: Math.round(end) };
  });
}

// A whole-project pass: every clip carries its own recognised phrases, and the
// cards come back in finished-timeline time so they line up with the video.
function spCaptionsForTimeline(clips, opts){
  const o = opts || {};
  const list = Array.isArray(clips) ? clips : [];
  const out = [];
  let acc = 0;
  for (const c of list){
    const len = Math.max(0, (Number(c.outMs) || 0) - (Number(c.inMs) || 0));
    const segs = c.speech || [];
    const cards = spCaptionsFromSpeech(segs, c, Object.assign({}, o, { startMs: acc }));
    for (const card of cards) out.push(card);
    acc += len;
  }
  return out;
}

// How much recognised speech landed inside a clip's kept window. Used to tell
// the user "3 of 9 phrases were trimmed away" rather than silently dropping.
function spSpeechCoverage(segments, clip){
  const list = Array.isArray(segments) ? segments : [];
  if (!clip) return { total: 0, kept: 0 };
  const inMs = Math.max(0, Number(clip.inMs) || 0);
  const outMs = Math.max(inMs, Number(clip.outMs) || 0);
  const kept = list.filter(s => (Number(s.atMs) || 0) >= inMs && (Number(s.atMs) || 0) <= outMs).length;
  return { total: list.length, kept };
}

// ── Preview sizing ──────────────────────────────────────────────────────────
// The review screen was a full-height black page with a small video floating
// in it. This sizes the stage to the media's own aspect ratio, so the frame
// hugs the picture and the surrounding black collapses to a thin margin.

function spMediaBox(media, avail, opts){
  const o = opts || {};
  const pad = Number(o.pad) || 0;
  const availW = Math.max(1, (Number(avail && avail.width) || 1) - pad * 2);
  const availH = Math.max(1, (Number(avail && avail.height) || 1) - pad * 2);
  const mw = Number(media && media.width) > 0 ? Number(media.width) : 9;
  const mh = Number(media && media.height) > 0 ? Number(media.height) : 16;
  const ratio = mw / mh;
  let width = availW;
  let height = width / ratio;
  if (height > availH){ height = availH; width = height * ratio; }
  // A portrait clip is height-bound on a phone; a 16:9 import is width-bound.
  const maxPct = Number(o.maxHeightPct);
  if (isFinite(maxPct) && maxPct > 0){
    const cap = (Number(avail && avail.height) || 0) * (maxPct / 100);
    if (height > cap){ height = cap; width = height * ratio; }
  }
  return { width: Math.round(width), height: Math.round(height),
           ratio: Math.round(ratio * 1000) / 1000 };
}

// ── Live filter on a recorded take ──────────────────────────────────────────
// A filter chosen before recording has to be part of the FILE, not just the
// on-screen preview, or it vanishes the moment the take lands in the editor.
// This maps the editor's filter ids onto the ffmpeg chain used when the take
// is re-encoded, so the recorded clip matches what the user saw.

const SP_RECORD_FILTERS = {
  none:  { label: 'Original', css: 'none',                                                ffmpeg: null },
  vivid: { label: 'Vivid',    css: 'saturate(1.45) contrast(1.1)',                        ffmpeg: 'eq=saturation=1.45:contrast=1.1' },
  warm:  { label: 'Warm',     css: 'sepia(.22) saturate(1.25) brightness(1.04)',          ffmpeg: 'colorbalance=rs=.09:gs=.02:bs=-.07,eq=saturation=1.2' },
  cool:  { label: 'Cool',     css: 'hue-rotate(-12deg) saturate(1.15) brightness(1.02)',  ffmpeg: 'colorbalance=bs=.09:rs=-.06,eq=saturation=1.12' },
  mono:  { label: 'Mono',     css: 'grayscale(1) contrast(1.12)',                         ffmpeg: 'hue=s=0,eq=contrast=1.12' },
  noir:  { label: 'Noir',     css: 'grayscale(1) contrast(1.4) brightness(.9)',           ffmpeg: 'hue=s=0,eq=contrast=1.4:brightness=-.08' },
  fade:  { label: 'Fade',     css: 'contrast(.86) brightness(1.1) saturate(.82)',         ffmpeg: 'eq=contrast=.87:brightness=.07:saturation=.84' },
  punch: { label: 'Punch',    css: 'contrast(1.3) saturate(1.3)',                         ffmpeg: 'eq=contrast=1.28:saturation=1.28' },
  retro: { label: 'Retro',    css: 'sepia(.4) saturate(1.4) contrast(.92) hue-rotate(-8deg)', ffmpeg: 'hue=s=.72,eq=contrast=.94:saturation=1.35' },
};

function spRecordFilterCss(id){
  const f = SP_RECORD_FILTERS[String(id || 'none')];
  return (f && f.css) || 'none';
}

function spRecordFilterFfmpeg(id){
  const f = SP_RECORD_FILTERS[String(id || 'none')];
  return (f && f.ffmpeg) || null;
}

// The full filter chain for turning a freshly recorded take into the file that
// matches the preview: burn in the chosen filter, then re-encode at the small
// size used for editing so the editor stays responsive.
function spRecordBakePlan(filterId, profile){
  const p = profile || spCaptureProfile('balanced');
  const parts = [];
  const f = spRecordFilterFfmpeg(filterId);
  if (f) parts.push(f);
  return {
    filter: parts.length ? parts.join(',') : null,
    width: p.width,
    height: p.height,
    fps: p.fps,
    needsBake: !!(parts.length),
  };
}

// ── Restoring an overlay across a session ───────────────────────────────────

function spOverlaySnapshot(o){
  const x = o || {};
  return {
    id: x.id, kind: x.kind, text: x.text, x: x.x, y: x.y, scale: x.scale,
    crop: x.crop ? spCrop(x.crop) : null,
    startMs: x.startMs, endMs: x.endMs, style: x.style, color: x.color,
    size: x.size, rot: x.rot,
  };
}

function spOverlayRestore(snap){
  const s = snap || {};
  return {
    id: s.id, kind: s.kind, text: s.text,
    x: spClamp(s.x != null ? s.x : 50, 0, 100),
    y: spClamp(s.y != null ? s.y : 50, 0, 100),
    scale: spClamp(s.scale != null ? s.scale : 1, 0.25, 4),
    crop: s.crop ? spCrop(s.crop) : { t: 0, r: 0, b: 0, l: 0 },
    startMs: Math.max(0, Number(s.startMs) || 0),
    endMs: Math.max(0, Number(s.endMs) || 0),
    style: s.style || 'bold', color: s.color || '#FFFFFF',
    size: spClamp(s.size != null ? s.size : 30, 10, 90),
    rot: Number(s.rot) || 0,
  };
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = {
    spClamp, spFrameStats, spAutoFps,
    spCaptureProfile, spLighterTier, spHeavierTier, spAutoTier, SP_TIERS, SP_PROFILES,
    spPrompterGeometry, spPrompterClamp,
    spOverlayMove, spOverlayScale, spCrop, spCropIsIdentity, spCropCss, spCropFfmpeg,
    spShouldBreakCue, spCaptionsFromSpeech, spCaptionsForTimeline, spSpeechCoverage,
    spMediaBox,
    SP_RECORD_FILTERS, spRecordFilterCss, spRecordFilterFfmpeg, spRecordBakePlan,
    spOverlaySnapshot, spOverlayRestore,
  };
}
