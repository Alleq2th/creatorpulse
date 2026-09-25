// Unit tests for the pure Studio timeline maths in public/lib/studioModel.js.
//
// The whole editing surface — dragging a trim handle, splitting, stitching
// clips in order, captions staying in sync, the export plan — is arithmetic
// over inMs/outMs/dur. Getting it wrong is invisible until someone drags a
// clip on a phone and the video comes out wrong, so it is tested here instead.
//
// The old Studio is the cautionary tale: its Trim button opened a sheet with
// two sliders and a "Done" button, and trimming a clip did nothing visible.
// Every case below that names a gesture exists because that gesture was broken.
//
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

const M = require('../public/lib/studioModel.js');

// A clip of `sec` seconds, keeping the whole thing.
function clip(id, sec, over){
  return Object.assign({
    id, name: id, dur: sec, inMs: 0, outMs: Math.round(sec * 1000), kind: 'video',
  }, over || {});
}

// ── Length and layout ──────────────────────────────────────────────────────

test('a fresh clip is its full source length', () => {
  assert.equal(M.smClipMs(clip('a', 4)), 4000);
});

test('total length is the sum of the kept parts', () => {
  assert.equal(M.smTotalMs([clip('a', 4), clip('b', 2.5)]), 6500);
});

test('total of nothing is zero, and junk does not become NaN', () => {
  assert.equal(M.smTotalMs([]), 0);
  assert.equal(M.smTotalMs(null), 0);
  assert.equal(M.smTotalMs([null, undefined, {}]), 0);
});

test('clip lengths are never negative, even if in and out are crossed', () => {
  assert.equal(M.smClipMs(clip('a', 4, { inMs: 3000, outMs: 1000 })), 0);
});

test('a clip start is the sum of everything before it', () => {
  const clips = [clip('a', 2), clip('b', 3), clip('c', 1)];
  assert.equal(M.smClipStart(clips, 'a'), 0);
  assert.equal(M.smClipStart(clips, 'b'), 2000);
  assert.equal(M.smClipStart(clips, 'c'), 5000);
});

test('an unknown clip id has no position', () => {
  assert.equal(M.smClipStart([clip('a', 2)], 'nope'), -1);
});

test('time is formatted as m:ss.s', () => {
  assert.equal(M.smFormatMs(0), '0:00.0');
  assert.equal(M.smFormatMs(1500), '0:01.5');
  assert.equal(M.smFormatMs(65000), '1:05.0');
});

// ── Finding the playhead ───────────────────────────────────────────────────
// This is what makes the preview show the right frame, so it has to map
// timeline time onto SOURCE time correctly once a clip has been trimmed.

test('a playhead in the first clip maps straight through', () => {
  const r = M.smLocate([clip('a', 4), clip('b', 4)], 1000);
  assert.equal(r.clip.id, 'a');
  assert.equal(r.sourceMs, 1000);
  assert.equal(r.lengthMs, 4000);
});

test('a playhead in the second clip accounts for the first clip length', () => {
  const r = M.smLocate([clip('a', 4), clip('b', 4)], 5000);
  assert.equal(r.clip.id, 'b');
  assert.equal(r.clipOffsetMs, 1000);
  assert.equal(r.sourceMs, 1000);
  assert.equal(r.startMs, 4000);
});

test('a trimmed clip offsets the source time by its in-point', () => {
  // Clip b keeps source 1s-3s. Timeline 0 of b is source 1s.
  const r = M.smLocate([clip('a', 2), clip('b', 4, { inMs: 1000, outMs: 3000 })], 2500);
  assert.equal(r.clip.id, 'b');
  assert.equal(r.clipOffsetMs, 500);
  assert.equal(r.sourceMs, 1500);
});

test('a playhead past the end parks on the last frame, never off the end', () => {
  const r = M.smLocate([clip('a', 2), clip('b', 2)], 99999);
  assert.equal(r.clip.id, 'b');
  assert.equal(r.sourceMs, 2000);
});

test('an empty timeline has nothing to locate', () => {
  assert.equal(M.smLocate([], 500), null);
  assert.equal(M.smLocate(null, 500), null);
});

// ── Trimming: the CapCut gesture ───────────────────────────────────────────
// Tap the clip, drag a handle. The two handles move independently; dragging
// one must never silently move the other.

test('trimming the head only moves the head', () => {
  const c = clip('a', 10);
  const t = M.smTrim(c, { inMs: 3000 });
  assert.deepEqual(t, { inMs: 3000, outMs: 10000 });
  assert.equal(M.smClipMs(Object.assign({}, c, t)), 7000);
});

test('trimming the tail only moves the tail', () => {
  const c = clip('a', 10);
  const t = M.smTrim(c, { outMs: 6000 });
  assert.deepEqual(t, { inMs: 0, outMs: 6000 });
  assert.equal(M.smClipMs(Object.assign({}, c, t)), 6000);
});

test('the head cannot be dragged past the tail', () => {
  const t = M.smTrim(clip('a', 10, { inMs: 2000, outMs: 5000 }), { inMs: 9000 }, 500);
  assert.equal(t.inMs, 4500);
  assert.equal(t.outMs, 5000);
  assert.equal(t.outMs - t.inMs, 500);
});

test('the tail cannot be dragged before the head', () => {
  const t = M.smTrim(clip('a', 10, { inMs: 2000, outMs: 5000 }), { outMs: 100 }, 500);
  assert.equal(t.inMs, 2000);
  assert.equal(t.outMs, 2500);
});

test('a handle cannot be dragged outside the source media', () => {
  assert.equal(M.smTrim(clip('a', 4), { inMs: -9999 }).inMs, 0);
  assert.equal(M.smTrim(clip('a', 4), { outMs: 99999 }).outMs, 4000);
});

test('garbage from a slider is ignored, not written into the clip', () => {
  const t = M.smTrim(clip('a', 4), { inMs: NaN, outMs: NaN });
  assert.deepEqual(t, { inMs: 0, outMs: 4000 });
});

test('trim bounds expose the legal range for the handles', () => {
  const b = M.smTrimBounds(clip('a', 10, { inMs: 2000, outMs: 6000 }), 500);
  assert.equal(b.maxInMs, 5500);
  assert.equal(b.minOutMs, 2500);
  assert.equal(b.srcMs, 10000);
});

// ── Splitting ──────────────────────────────────────────────────────────────
// Split at the playhead must produce two clips whose combined source time is
// continuous — no repeated frame, no skipped one.

test('splitting a clip makes two clips that together equal the original', () => {
  let n = 0;
  const r = M.smSplitAt([clip('a', 10)], 4000, () => 'a2', 500);
  assert.equal(r.clips.length, 2);
  assert.equal(r.newId, 'a2');
  assert.equal(r.clips[0].id, 'a');
  assert.equal(r.clips[0].inMs, 0);
  assert.equal(r.clips[0].outMs, 4000);
  assert.equal(r.clips[1].inMs, 4000);
  assert.equal(r.clips[1].outMs, 10000);
  // Continuity: no gap, no overlap at the cut.
  assert.equal(r.clips[0].outMs, r.clips[1].inMs);
  assert.equal(M.smTotalMs(r.clips), 10000);
});

test('splitting the second clip accounts for the first', () => {
  const r = M.smSplitAt([clip('a', 2), clip('b', 8)], 6000, () => 'b2', 500);
  assert.equal(r.clips.length, 3);
  assert.equal(r.clips[0].id, 'a');
  assert.equal(r.clips[1].id, 'b');
  assert.equal(r.clips[1].outMs, 4000);
  assert.equal(r.clips[2].id, 'b2');
  assert.equal(r.clips[2].inMs, 4000);
});

test('splitting a trimmed clip cuts on the source-time boundary', () => {
  // b keeps source 2s-8s; the cut at timeline 2s into it is source 4s.
  const r = M.smSplitAt([clip('b', 10, { inMs: 2000, outMs: 8000 })], 2000, () => 'b2', 500);
  assert.equal(r.clips[0].inMs, 2000);
  assert.equal(r.clips[0].outMs, 4000);
  assert.equal(r.clips[1].inMs, 4000);
  assert.equal(r.clips[1].outMs, 8000);
});

test('a split too close to an edge is refused instead of making a sliver', () => {
  const r = M.smSplitAt([clip('a', 10)], 100, () => 'a2', 500);
  assert.equal(r.newId, null);
  assert.equal(r.clips.length, 1);
});

test('splitting an empty timeline is a no-op', () => {
  const r = M.smSplitAt([], 1000, () => 'x', 500);
  assert.equal(r.newId, null);
  assert.deepEqual(r.clips, []);
});

// ── Deleting and stitching ─────────────────────────────────────────────────

test('deleting a clip leaves the rest in order', () => {
  const next = M.smRemoveClip([clip('a', 1), clip('b', 1), clip('c', 1)], 'b');
  assert.deepEqual(next.map(c => c.id), ['a', 'c']);
});

test('deleting something that is not there changes nothing', () => {
  const next = M.smRemoveClip([clip('a', 1)], 'zzz');
  assert.deepEqual(next.map(c => c.id), ['a']);
});

test('deleting the last clip empties the timeline', () => {
  assert.deepEqual(M.smRemoveClip([clip('a', 1)], 'a'), []);
});

test('a clip can be reordered to restitch the video', () => {
  const next = M.smMoveClip([clip('a', 1), clip('b', 1), clip('c', 1)], 'c', 0);
  assert.deepEqual(next.map(c => c.id), ['c', 'a', 'b']);
});

test('reordering clamps an out-of-range target instead of dropping the clip', () => {
  const next = M.smMoveClip([clip('a', 1), clip('b', 1)], 'a', 99);
  assert.deepEqual(next.map(c => c.id), ['b', 'a']);
});

test('a new take is inserted right after the selected clip', () => {
  const next = M.smInsertAfter([clip('a', 1), clip('c', 1)], clip('b', 1), 'a');
  assert.deepEqual(next.map(c => c.id), ['a', 'b', 'c']);
});

test('a take recorded with nothing selected goes to the end', () => {
  const next = M.smInsertAfter([clip('a', 1)], clip('b', 1), 'missing');
  assert.deepEqual(next.map(c => c.id), ['a', 'b']);
});

// ── Captions ───────────────────────────────────────────────────────────────

test('a long script is broken into short readable chunks', () => {
  const chunks = M.smChunkText('one two three four five six seven', 3, 40);
  assert.deepEqual(chunks, ['one two three', 'four five six', 'seven']);
});

test('a chunk that would run off the screen is split in two', () => {
  const chunks = M.smChunkText('extraordinarily complicated terminology here', 4, 20);
  assert.ok(chunks.every(c => c.length <= 40), 'no chunk should be double-length');
  assert.equal(chunks.join(' ').replace(/\s+/g, ' '), 'extraordinarily complicated terminology here');
});

test('an empty script produces no captions at all', () => {
  assert.deepEqual(M.smChunkText('', 5, 42), []);
  assert.deepEqual(M.smChunkText(null, 5, 42), []);
  assert.deepEqual(M.smAutoCaptions('', [clip('a', 5)], 5, 42), []);
});

test('captions span the whole finished timeline with no gaps', () => {
  const caps = M.smAutoCaptions('one two three four five six seven eight nine ten', [clip('a', 10)], 5, 42);
  assert.equal(caps.length, 2);
  assert.equal(caps[0].startMs, 0);
  assert.equal(caps[caps.length - 1].endMs, 10000);
  for (let i = 1; i < caps.length; i++) assert.equal(caps[i].startMs, caps[i - 1].endMs);
});

test('removing a clip reflows the captions onto the shorter timeline', () => {
  const before = M.smAutoCaptions('one two three four five six seven eight nine ten', [clip('a', 10)], 5, 42);
  const after = M.smAutoCaptions('one two three four five six seven eight nine ten', [clip('a', 5)], 5, 42);
  assert.equal(before[before.length - 1].endMs, 10000);
  assert.equal(after[after.length - 1].endMs, 5000);
});

test('captions fall back to an even spread when there is no video yet', () => {
  const caps = M.smCaptionsUniform('one two three four', 4000, 2, 42);
  assert.equal(caps.length, 2);
  assert.equal(caps[0].startMs, 0);
  assert.equal(caps[1].endMs, 4000);
});

test('the caption showing at a moment is the one that covers it', () => {
  const caps = [{ id: 'c1', text: 'a', startMs: 0, endMs: 1000 }, { id: 'c2', text: 'b', startMs: 1000, endMs: 2000 }];
  assert.equal(M.smCaptionAt(caps, 500).text, 'a');
  assert.equal(M.smCaptionAt(caps, 1500).text, 'b');
  assert.equal(M.smCaptionAt(caps, 99999), null);
});

test('overlays show only while the playhead is inside their window', () => {
  const ovs = [{ id: 'o1', startMs: 1000, endMs: 2000 }, { id: 'o2', startMs: 3000, endMs: 4000 }];
  assert.deepEqual(M.smActiveOverlays(ovs, 1500).map(o => o.id), ['o1']);
  assert.deepEqual(M.smActiveOverlays(ovs, 2500), []);
  assert.deepEqual(M.smActiveOverlays(ovs, 3500).map(o => o.id), ['o2']);
});

// ── Export ─────────────────────────────────────────────────────────────────

test('export resolution follows the chosen quality', () => {
  const presets = { '720p': { width: 720, height: 1280, fps: 30 }, '1080p': { width: 1080, height: 1920, fps: 30 } };
  assert.deepEqual(M.smExportRes('1080p', presets), { width: 1080, height: 1920, fps: 30 });
});

test('export dimensions are always even, or H.264 refuses the file', () => {
  const presets = { '720p': { width: 721, height: 1281, fps: 30 } };
  const r = M.smExportRes('720p', presets);
  assert.equal(r.width % 2, 0);
  assert.equal(r.height % 2, 0);
});

test('an unknown quality falls back instead of producing a zero-size video', () => {
  const presets = { '720p': { width: 720, height: 1280, fps: 30 } };
  const r = M.smExportRes('nonsense', presets);
  assert.equal(r.width, 720);
  assert.equal(r.height, 1280);
  assert.equal(M.smExportRes(null, null).width > 0, true);
});

test('the export plan counts what will actually be rendered', () => {
  const plan = M.smExportPlan({
    clips: [clip('a', 2), clip('b', 3)],
    overlays: [{ id: 'o' }], captions: [{ id: 'c' }], audioTracks: [{ id: 'm' }], filter: 'vivid',
  });
  assert.equal(plan.hasVideo, true);
  assert.equal(plan.clipCount, 2);
  assert.equal(plan.totalMs, 5000);
  assert.equal(plan.overlayCount, 1);
  assert.equal(plan.captionCount, 1);
  assert.equal(plan.audioCount, 1);
  assert.equal(plan.hasFilter, true);
});

test('the export plan refuses an empty timeline', () => {
  const plan = M.smExportPlan({ clips: [] });
  assert.equal(plan.hasVideo, false);
  assert.equal(plan.totalMs, 0);
  assert.equal(M.smExportPlan(null).hasVideo, false);
});

test('a trimmed-to-nothing clip drops out of the export plan', () => {
  const plan = M.smExportPlan({ clips: [clip('a', 4, { inMs: 2000, outMs: 2000 })] });
  assert.equal(plan.clipCount, 0);
  assert.equal(plan.hasVideo, false);
});

// ── Saving and restoring ───────────────────────────────────────────────────

test('a snapshot keeps the edit decisions and drops the media handles', () => {
  const snap = M.smSnapshot({
    projectName: 'My reel',
    clips: [Object.assign(clip('a', 5, { inMs: 1000, outMs: 4000 }), { blob: { fake: true }, url: 'blob:xyz' })],
    filter: 'vivid', quality: '720p', script: 'hello world',
  });
  assert.equal(snap.projectName, 'My reel');
  assert.equal(snap.clips[0].inMs, 1000);
  assert.equal(snap.clips[0].outMs, 4000);
  assert.equal(snap.filter, 'vivid');
  // A Blob and its object URL cannot survive a reload, so they must not be
  // written down — a stale object URL renders as a broken black block.
  assert.equal(snap.clips[0].blob, undefined);
  assert.equal(snap.clips[0].url, undefined);
});

test('a snapshot of nothing is still a valid snapshot', () => {
  const snap = M.smSnapshot(null);
  assert.equal(snap.projectName, 'New project');
  assert.deepEqual(snap.clips, []);
  assert.equal(snap.filter, 'none');
});

test('restoring drops clips whose media is no longer in memory', () => {
  const snap = M.smSnapshot({ clips: [clip('a', 2), clip('b', 2)] });
  const back = M.smRestore(snap, id => id === 'a');
  assert.deepEqual(back.clips.map(c => c.id), ['a']);
  assert.deepEqual(back.droppedIds, ['b']);
});

test('restoring an intact session keeps every clip', () => {
  const snap = M.smSnapshot({ clips: [clip('a', 2), clip('b', 2)] });
  const back = M.smRestore(snap, () => true);
  assert.deepEqual(back.clips.map(c => c.id), ['a', 'b']);
  assert.equal(M.smTotalMs(back.clips), 4000);
});

test('restoring a session with no surviving video drops the captions too', () => {
  const snap = M.smSnapshot({ clips: [clip('a', 2)], captions: [{ id: 'c1', text: 'hi' }] });
  const back = M.smRestore(snap, () => false);
  assert.deepEqual(back.clips, []);
  // Captions timed to a deleted timeline would float over a black screen.
  assert.deepEqual(back.captions, []);
});

test('restoring garbage does not throw', () => {
  assert.doesNotThrow(() => M.smRestore(null, () => true));
  assert.doesNotThrow(() => M.smRestore({ clips: 'not an array' }, () => true));
  assert.deepEqual(M.smRestore({ clips: 'not an array' }, () => true).clips, []);
});

// ── The model must stay DOM-free so it can be tested at all ────────────────

test('the model reaches for no browser globals', () => {
  const src = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'public', 'lib', 'studioModel.js'), 'utf8');
  const body = src
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  for (const banned of ['document.', 'window.', 'localStorage', 'navigator.']){
    assert.ok(!body.includes(banned), `studioModel.js must not use ${banned}`);
  }
});

test('the model exports exactly the documented surface', () => {
  const expected = [
    'smClamp', 'smClipMs', 'smTotalMs', 'smClipStart', 'smFormatMs', 'smLocate',
    'smTrimBounds', 'smTrim', 'smSplitAt', 'smRemoveClip', 'smMoveClip', 'smInsertAfter',
    'smChunkText', 'smAutoCaptions', 'smCaptionsUniform',
    'smActiveOverlays', 'smCaptionAt',
    'smExportRes', 'smExportPlan', 'smSnapshot', 'smRestore',
  ];
  assert.deepEqual(Object.keys(M).sort(), expected.slice().sort());
});
