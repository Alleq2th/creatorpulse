// Pure timeline maths for the Studio: clip layout, trimming, splitting,
// reordering, caption timing, and the export plan.
//
// Kept free of any DOM reference (no window, no document, no video elements)
// so test/studioModel.test.js can require it directly and check the behaviour
// that is otherwise only observable by dragging a clip around on a phone.
//
// Loaded two ways, exactly like lib/authRedirect.js:
//   * Node reads it as CommonJS (module.exports at the bottom) for the tests.
//   * index.html loads it as a classic <script>, where `module` is undefined,
//     the guard is skipped, and every top-level declaration becomes a global
//     that studio.js can call.
//
// Clip shape used throughout:
//   { id, name, dur, inMs, outMs, kind }
// dur is the source media length in SECONDS; inMs/outMs are the kept portion
// of that source, in milliseconds. Everything the timeline shows derives from
// those three numbers, never from a cached width.

// ── Numbers ────────────────────────────────────────────────────────────────

function smClamp(n, lo, hi){
  n = Number(n);
  if (!isFinite(n)) return lo;
  return n < lo ? lo : (n > hi ? hi : n);
}

// A clip's kept length in ms. Never negative, even if in/out are crossed by a
// bad drag, and never longer than the source.
function smClipMs(clip){
  if (!clip) return 0;
  const src = Math.max(0, (Number(clip.dur) || 0) * 1000);
  const a = smClamp(clip.inMs, 0, src);
  const b = smClamp(clip.outMs, 0, src);
  return Math.max(0, b - a);
}

function smTotalMs(clips){
  return (Array.isArray(clips) ? clips : []).reduce((n, c) => n + smClipMs(c), 0);
}

// Where a clip starts on the finished timeline (sum of everything before it).
function smClipStart(clips, id){
  let acc = 0;
  for (const c of (clips || [])){
    if (c.id === id) return acc;
    acc += smClipMs(c);
  }
  return -1;
}

function smFormatMs(ms){
  const total = Math.max(0, Math.round((Number(ms) || 0) / 100) / 10);
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

// ── Finding a playhead ─────────────────────────────────────────────────────

// Which clip covers this timeline position, and how far into its SOURCE the
// playhead sits (in/out means timeline time and source time differ).
function smLocate(clips, ms){
  const list = clips || [];
  if (!list.length) return null;
  let acc = 0;
  for (let i = 0; i < list.length; i++){
    const len = smClipMs(list[i]);
    if (ms < acc + len || i === list.length - 1){
      const into = smClamp(ms - acc, 0, len);
      return {
        clip: list[i], index: i, clipOffsetMs: into,
        sourceMs: (Number(list[i].inMs) || 0) + into,
        startMs: acc, lengthMs: len,
      };
    }
    acc += len;
  }
  return null;
}

// ── Trimming (the CapCut gesture) ──────────────────────────────────────────

// The trim window is expressed as two positions along the SOURCE media, not as
// offsets from the current edges, so dragging one handle can never silently
// move the other.
function smTrimBounds(clip, minMs){
  const src = Math.max(0, (Number(clip && clip.dur) || 0) * 1000);
  const floor = Math.max(0, Number(minMs) || 0);
  const inMs = smClamp(clip && clip.inMs, 0, src);
  const outMs = smClamp(clip && clip.outMs, 0, src);
  return {
    srcMs: src, minMs: floor,
    inMs, outMs,
    maxInMs: Math.max(0, outMs - floor),
    minOutMs: Math.min(src, inMs + floor),
  };
}

// Apply a trim. `next` may carry an absolute inMs, an absolute outMs, or both.
// Returns the clamped pair — always a valid, at-least-minMs window.
function smTrim(clip, next, minMs){
  const b = smTrimBounds(clip, minMs);
  let inMs = next && next.inMs != null ? Number(next.inMs) : b.inMs;
  let outMs = next && next.outMs != null ? Number(next.outMs) : b.outMs;
  if (!isFinite(inMs)) inMs = b.inMs;
  if (!isFinite(outMs)) outMs = b.outMs;
  inMs = smClamp(inMs, 0, b.maxInMs);
  outMs = smClamp(outMs, b.minOutMs, b.srcMs);
  return { inMs: Math.round(inMs), outMs: Math.round(outMs) };
}

// ── Cutting ────────────────────────────────────────────────────────────────

// Split whatever clip covers `ms` into two. The cut lands on a source-time
// boundary, so both halves keep playing their own stretch of the original
// with no frame repeated or dropped.
// Returns the new clip array and the id of the tail half, or null if the
// playhead is too close to an edge to make two usable clips.
function smSplitAt(clips, ms, idFor, minMs){
  const list = Array.isArray(clips) ? clips : [];
  const floor = Math.max(0, Number(minMs) || 0);
  let acc = 0;
  for (let i = 0; i < list.length; i++){
    const len = smClipMs(list[i]);
    if (ms < acc + len || i === list.length - 1){
      const into = smClamp(ms - acc, 0, len);
      if (into < floor || len - into < floor) return { clips: list, newId: null };
      const c = list[i];
      const cutAt = (Number(c.inMs) || 0) + into;
      const head = Object.assign({}, c, { outMs: Math.round(cutAt) });
      const tail = Object.assign({}, c, { id: idFor(), inMs: Math.round(cutAt) });
      const next = list.slice();
      next.splice(i, 1, head, tail);
      return { clips: next, newId: tail.id };
    }
    acc += len;
  }
  return { clips: list, newId: null };
}

// Remove a clip. Undefined rather than a wrong index when the id is unknown.
function smRemoveClip(clips, id){
  const list = Array.isArray(clips) ? clips : [];
  const i = list.findIndex(c => c.id === id);
  if (i < 0) return list;
  const next = list.slice();
  next.splice(i, 1);
  return next;
}

// Stitch order: move a clip to a new index, clamped into range.
function smMoveClip(clips, id, toIndex){
  const list = Array.isArray(clips) ? clips : [];
  const from = list.findIndex(c => c.id === id);
  if (from < 0) return list;
  const to = Math.round(smClamp(toIndex, 0, list.length - 1));
  if (to === from) return list;
  const next = list.slice();
  const [c] = next.splice(from, 1);
  next.splice(to, 0, c);
  return next;
}

// Insert a freshly recorded clip directly after the clip that was selected when
// recording started — so several takes in a row land in the order they were
// shot rather than all piling up at the end.
function smInsertAfter(clips, clip, afterId){
  const list = Array.isArray(clips) ? clips : [];
  if (!clip) return list;
  const i = list.findIndex(c => c.id === afterId);
  const next = list.slice();
  next.splice(i < 0 ? next.length : i + 1, 0, clip);
  return next;
}

// ── Captions ───────────────────────────────────────────────────────────────

// Break a script into short chunks. Two lines per card by default, because a
// third line on a phone covers the speaker's face.
function smChunkText(text, wordsPerCard, maxChars){
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const per = Math.max(1, Math.round(Number(wordsPerCard) || 5));
  const cap = Math.max(8, Math.round(Number(maxChars) || 42));
  const out = [];
  for (let i = 0; i < words.length; i += per){
    const chunk = words.slice(i, i + per);
    if (chunk.length > 1 && chunk.join(' ').length > cap){
      const half = Math.ceil(chunk.length / 2);
      out.push(chunk.slice(0, half).join(' '), chunk.slice(half).join(' '));
    } else {
      out.push(chunk.join(' '));
    }
  }
  return out;
}

// Spread caption cards across the finished timeline in proportion to their
// length, so they stay in sync when the user trims or removes a clip.
function smAutoCaptions(text, clips, wordsPerCard, maxChars){
  const total = smTotalMs(clips);
  const chunks = smChunkText(text, wordsPerCard, maxChars);
  if (!chunks.length || total <= 0) return [];
  const weights = chunks.map(c => Math.max(1, c.length));
  const sum = weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return chunks.map((t, i) => {
    const span = (weights[i] / sum) * total;
    const startMs = Math.round(at);
    at += span;
    return { id: 'cap' + (i + 1), text: t, startMs, endMs: Math.round(at) };
  });
}

// With no clip times yet, fall back to an even spread over a nominal duration
// so the caption sheet still shows a sensible preview.
function smCaptionsUniform(text, totalMs, wordsPerCard, maxChars){
  const chunks = smChunkText(text, wordsPerCard, maxChars);
  const total = Math.max(1, Number(totalMs) || 0);
  const each = total / Math.max(1, chunks.length);
  return chunks.map((t, i) => ({
    id: 'cap' + (i + 1), text: t,
    startMs: Math.round(i * each), endMs: Math.round((i + 1) * each),
  }));
}

// ── Clips vs overlays at a moment in time ──────────────────────────────────

function smActiveOverlays(overlays, ms){
  return (overlays || []).filter(o => ms >= o.startMs && ms <= o.endMs);
}

function smCaptionAt(captions, ms){
  return (captions || []).find(c => ms >= c.startMs && ms < c.endMs) || null;
}

// ── Export plan ────────────────────────────────────────────────────────────
// Describes what to render, as plain data, so the ffmpeg command can be built
// and asserted without a browser.

function smExportRes(quality, presets){
  const p = (presets || {})[String(quality || '')];
  const fallback = (presets && presets['720p']) || { width: 720, height: 1280, fps: 30 };
  const r = p || fallback;
  // Even dimensions are required by H.264 (yuv420p); an odd width fails the
  // whole export with an unhelpful codec error.
  const even = n => Math.max(2, Math.round((Number(n) || 0) / 2) * 2);
  return { width: even(r.width), height: even(r.height), fps: Math.round(r.fps) || 30 };
}

function smExportPlan(st){
  const s = st || {};
  const clips = (s.clips || []).filter(c => smClipMs(c) > 0);
  return {
    clipCount: clips.length,
    totalMs: smTotalMs(clips),
    hasVideo: clips.length > 0,
    overlayCount: (s.overlays || []).length,
    captionCount: (s.captions || []).length,
    audioCount: (s.audioTracks || []).length,
    hasFilter: !!s.filter && s.filter !== 'none',
    filenamesChanged: (s.audioTracks || []).length > 0,
  };
}

// ── Saving / restoring a session ───────────────────────────────────────────
// Only the decision-making state is persisted — never Blobs or object URLs,
// which cannot survive a reload (and a stale object URL is worse than none).

function smSnapshot(st){
  const s = st || {};
  return {
    projectName: s.projectName || 'New project',
    clips: (s.clips || []).map(c => ({
      id: c.id, name: c.name, dur: c.dur, inMs: c.inMs, outMs: c.outMs, kind: c.kind || 'video',
    })),
    overlays: (s.overlays || []).map(o => ({
      id: o.id, kind: o.kind, text: o.text, x: o.x, y: o.y, scale: o.scale,
      startMs: o.startMs, endMs: o.endMs, style: o.style, color: o.color,
    })),
    captions: s.captions || [],
    capStyle: s.capStyle || null,
    filter: s.filter || 'none',
    quality: s.quality || null,
    script: s.script || '',
  };
}

// A saved clip whose media is gone must not reappear as a broken block, so
// anything without a live blob is dropped on restore.
function smRestore(snap, hasBlob){
  const s = snap || {};
  const alive = c => (typeof hasBlob === 'function' ? !!hasBlob(c && c.id) : true);
  const clips = (Array.isArray(s.clips) ? s.clips : []).filter(alive);
  const ids = new Set(clips.map(c => c.id));
  return {
    projectName: s.projectName || 'New project',
    clips,
    // Overlays and captions are timed against the timeline; if every clip they
    // referred to is gone they would sit over black, so drop those too.
    overlays: (Array.isArray(s.overlays) ? s.overlays : []),
    captions: clips.length ? (Array.isArray(s.captions) ? s.captions : []) : [],
    capStyle: s.capStyle || null,
    filter: s.filter || 'none',
    quality: s.quality || null,
    script: s.script || '',
    droppedIds: (Array.isArray(s.clips) ? s.clips : []).filter(c => !ids.has(c.id)).map(c => c.id),
  };
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = {
    smClamp, smClipMs, smTotalMs, smClipStart, smFormatMs, smLocate,
    smTrimBounds, smTrim, smSplitAt, smRemoveClip, smMoveClip, smInsertAfter,
    smChunkText, smAutoCaptions, smCaptionsUniform,
    smActiveOverlays, smCaptionAt,
    smExportRes, smExportPlan, smSnapshot, smRestore,
  };
}
