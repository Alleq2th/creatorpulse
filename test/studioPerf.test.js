// Unit tests for the pure Studio logic in public/lib/studioPerf.js.
//
// Why this file exists: every complaint this round was about behaviour that is
// invisible to `node --check` and to a green test suite — a recording that
// stutters, a teleprompter that cannot be resized, an overlay that fights the
// finger, captions that say something the creator never said. Each case below
// pins one of those down as arithmetic.
//
// The frame-pacing cases are not invented: the numbers in them come from the
// isolation run in verify/isolate.js, where the shipping build measured
// 37.2 fps / 18.7% janky frames and the same build with the two identified
// costs removed measured 60.0 fps / 0%.
//
// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

const P = require('../public/lib/studioPerf.js');

// ── frame pacing ────────────────────────────────────────────────────────────

test('spFrameStats: a steady 60fps run reports 60fps and no dropped frames', () => {
  const dts = Array.from({ length: 120 }, () => 16.67);
  const s = P.spFrameStats(dts, 33.4);
  assert.equal(s.frames, 120);
  assert.equal(s.fps, 60);
  assert.equal(s.dropped, 0);
  assert.equal(s.jankPct, 0);
});

test('spFrameStats: the measured broken run is reported as janky, the fixed run is not', () => {
  // Reconstructed from the isolation run: the shipping build produced ~37fps
  // with roughly one frame in five late; the fixed build produced a steady 60.
  const broken = [];
  for (let i = 0; i < 100; i++) broken.push(i % 5 === 0 ? 68 : 16.7);
  const brokenStats = P.spFrameStats(broken, 33.4);
  assert.ok(brokenStats.jankPct > 15, `expected >15% janky, got ${brokenStats.jankPct}`);
  assert.ok(brokenStats.dropped >= 18, `expected >=18 dropped, got ${brokenStats.dropped}`);
  assert.ok(brokenStats.fps < 45, `expected <45fps, got ${brokenStats.fps}`);

  const fixed = Array.from({ length: 100 }, () => 16.7);
  assert.equal(P.spFrameStats(fixed, 33.4).jankPct, 0);
});

test('spFrameStats: p95 catches the stutter that an average hides', () => {
  // 95 good frames and 5 terrible ones averages out to ~20ms, which reads as
  // "fine" — but the five hitches are exactly what the eye notices.
  const dts = Array.from({ length: 95 }, () => 16.7).concat([200, 200, 200, 200, 200]);
  const s = P.spFrameStats(dts, 33.4);
  assert.ok(s.avgFrameMs < 30, `average should look acceptable, got ${s.avgFrameMs}`);
  assert.ok(s.p95FrameMs > 100, `p95 should expose the hitches, got ${s.p95FrameMs}`);
});

test('spFrameStats: empty and single-sample input do not divide by zero', () => {
  assert.equal(P.spFrameStats([], 33.4).fps, 0);
  assert.equal(P.spFrameStats(null, 33.4).fps, 0);
  assert.equal(P.spFrameStats([16.7], 33.4).frames, 1);
  assert.equal(P.spFrameStats([0, -5, NaN], 33.4).frames, 0);
});

test('spAutoFps: a clean run is left alone', () => {
  const stats = P.spFrameStats(Array.from({ length: 60 }, () => 16.7), 33.4);
  assert.equal(P.spAutoFps(stats, 30, { floor: 15, ceiling: 30 }), 30);
});

test('spAutoFps: a janky run steps the framerate down', () => {
  const stats = { jankPct: 22 };
  assert.equal(P.spAutoFps(stats, 30, { floor: 15, ceiling: 30, step: 5 }), 25);
});

test('spAutoFps: hysteresis — only a genuinely clean run steps back up', () => {
  // 8% janky is worse than the smooth threshold (4) and better than the janky
  // threshold (12). It must hold steady rather than oscillate every window,
  // because re-negotiating the camera mid-take is worse than a low framerate.
  assert.equal(P.spAutoFps({ jankPct: 8 }, 25, { floor: 15, ceiling: 30, step: 5 }), 25);
  assert.equal(P.spAutoFps({ jankPct: 2 }, 25, { floor: 15, ceiling: 30, step: 5 }), 30);
});

test('spAutoFps: never leaves the floor or the ceiling', () => {
  assert.equal(P.spAutoFps({ jankPct: 90 }, 15, { floor: 15, ceiling: 30, step: 5 }), 15);
  assert.equal(P.spAutoFps({ jankPct: 0 }, 30, { floor: 15, ceiling: 30, step: 5 }), 30);
});

// ── capture profiles ────────────────────────────────────────────────────────

test('spCaptureProfile: every tier is H.264-legal (even dimensions)', () => {
  for (const tier of P.SP_TIERS){
    const p = P.spCaptureProfile(tier);
    assert.equal(p.width % 2, 0, `${tier} width must be even`);
    assert.equal(p.height % 2, 0, `${tier} height must be even`);
    assert.ok(p.fps > 0 && p.videoBitsPerSecond > 0);
  }
});

test('spCaptureProfile: an unknown tier falls back to balanced, not to a crash', () => {
  assert.equal(P.spCaptureProfile('nonsense').tier, 'balanced');
  assert.equal(P.spCaptureProfile(null).tier, 'balanced');
  assert.equal(P.spCaptureProfile(undefined).tier, 'balanced');
});

test('spCaptureProfile: no tier asks for 1080p, because the device could not sustain it', () => {
  // 1080p was the shipped ceiling for any 8-core phone, and it is the measured
  // cause of the janky recording: capture negotiated 1080x1920@20 and the
  // encoder had to handle 2.1x the pixels of 720p every frame (37.2 fps vs
  // 56.4 fps in the isolation run). No tier may reintroduce it.
  for (const tier of ['light', 'balanced', 'high']){
    const p = P.spCaptureProfile(tier);
    assert.ok(p.width <= 720,
      tier + ' must not exceed 720p wide, got ' + p.width + ' — 1080p is what caused the jank');
    assert.ok(p.height <= 1280, tier + ' must not exceed 720p tall, got ' + p.height);
  }
  assert.equal(P.spCaptureProfile('balanced').width, 720);
  assert.equal(P.spCaptureProfile(undefined).tier, 'balanced');
});

test('spCaptureProfile: the high tier buys bitrate, not pixels', () => {
  // The reason to keep a third tier at all: better quality WITHOUT exceeding the
  // size the encoder can keep up with.
  const high = P.spCaptureProfile('high');
  const bal = P.spCaptureProfile('balanced');
  assert.equal(high.width, bal.width, 'high and balanced capture at the same size');
  assert.ok(high.videoBitsPerSecond > bal.videoBitsPerSecond,
    'high must carry more bitrate than balanced');
});

test('spLighterTier / spHeavierTier: walk the ladder and stop at the ends', () => {
  assert.equal(P.spLighterTier('high'), 'balanced');
  assert.equal(P.spLighterTier('balanced'), 'light');
  assert.equal(P.spLighterTier('light'), null);
  assert.equal(P.spHeavierTier('light'), 'balanced');
  assert.equal(P.spHeavierTier('high'), null);
});

test('spAutoTier: a weak device starts light instead of discovering it mid-take', () => {
  assert.equal(P.spAutoTier({ cores: 2 }), 'light');
  assert.equal(P.spAutoTier({ cores: 4, deviceMemory: 2 }), 'light');
  assert.equal(P.spAutoTier({ cores: 8, saveData: true }), 'light');
  assert.equal(P.spAutoTier({ cores: 4 }), 'balanced');
  assert.equal(P.spAutoTier({ cores: 8 }), 'high');
  assert.equal(P.spAutoTier({ cores: 16, deviceMemory: 8 }), 'high');
});

test('spAutoTier: an unreadable device is treated as mid-range, not as fast', () => {
  assert.equal(P.spAutoTier({}), 'balanced');
  assert.equal(P.spAutoTier(null), 'balanced');
  assert.equal(P.spAutoTier({ cores: 0 }), 'balanced');
});

// ── teleprompter ────────────────────────────────────────────────────────────

test('spPrompterGeometry: position and size are proportions of the stage', () => {
  const stage = { width: 400, height: 800 };
  const g = P.spPrompterGeometry(stage, 20, { x: 50, y: 25, w: 80, h: 40 });
  assert.equal(g.fontPx, 20);
  assert.equal(g.width, 320);          // 80% of 400
  assert.equal(g.height, 320);         // 40% of 800
  assert.equal(g.left, 40);            // centred: 200 - 160
  assert.equal(g.top, 200);            // 25% of 800
  assert.equal(g.lineHeight, 32);
});

test('spPrompterGeometry: text size is clamped to a readable range', () => {
  assert.equal(P.spPrompterGeometry({ width: 400, height: 800 }, 2).fontPx, 12);
  assert.equal(P.spPrompterGeometry({ width: 400, height: 800 }, 999).fontPx, 46);
  assert.equal(P.spPrompterGeometry({ width: 400, height: 800 }, 24).fontPx, 24);
});

test('spPrompterGeometry: a bigger font never pushes the box off the stage', () => {
  const stage = { width: 400, height: 800 };
  for (const size of [12, 20, 34, 46]){
    const g = P.spPrompterGeometry(stage, size, { x: 50, y: 30 });
    assert.ok(g.top >= 0, 'top must stay on screen');
    assert.ok(g.left >= 0, 'left must stay on screen');
    assert.ok(g.left + g.width <= stage.width, 'right must stay on screen');
  }
});

test('spPrompterClamp: a dragged box is kept fully on screen', () => {
  const stage = { width: 400, height: 800 };
  const box = { width: 320, height: 320 };
  const right = P.spPrompterClamp({ x: 500, y: 900 }, stage, box);
  assert.ok(right.x <= 60, `x should clamp to the half-width bound, got ${right.x}`);
  assert.ok(right.y <= 60, `y should clamp so the box bottom stays on screen, got ${right.y}`);
  const left = P.spPrompterClamp({ x: -50, y: -20 }, stage, box);
  assert.ok(left.x >= 40, `x should not go past the left half-width, got ${left.x}`);
  assert.equal(left.y, 0);
});

test('spPrompterClamp: a centre position survives unchanged', () => {
  const c = P.spPrompterClamp({ x: 50, y: 30 }, { width: 400, height: 800 }, { width: 200, height: 160 });
  assert.equal(c.x, 50);
  assert.equal(c.y, 30);
});

// ── overlay manipulation ────────────────────────────────────────────────────

test('spOverlayMove: a drag moves the overlay by the dragged amount', () => {
  const r = P.spOverlayMove({ x: 50, y: 50 }, 10, -5, { width: 400, height: 800 }, { width: 0, height: 0 });
  assert.equal(r.x, 60);
  assert.equal(r.y, 45);
});

test('spOverlayMove: an overlay cannot be pushed off the edge and lost', () => {
  const stage = { width: 400, height: 800 };
  const box = { width: 200, height: 200 };
  const far = P.spOverlayMove({ x: 50, y: 50 }, 999, 999, stage, box);
  assert.ok(far.x <= 75, `x must clamp to 100 - halfWidth, got ${far.x}`);
  assert.ok(far.y <= 87.5, `y must clamp to 100 - halfHeight, got ${far.y}`);
  const neg = P.spOverlayMove({ x: 50, y: 50 }, -999, -999, stage, box);
  assert.ok(neg.x >= 25, `x must clamp to halfWidth, got ${neg.x}`);
  assert.ok(neg.y >= 12.5, `y must clamp to halfHeight, got ${neg.y}`);
});

test('spOverlayScale: pinch scales, within sane bounds', () => {
  assert.equal(P.spOverlayScale(1, 2), 2);
  assert.equal(P.spOverlayScale(1, 0.5), 0.5);
  assert.equal(P.spOverlayScale(1, 100), 4);
  assert.equal(P.spOverlayScale(1, 0.001), 0.25);
});

test('spOverlayScale: repeated pinches compound instead of snapping back', () => {
  let s = 1;
  for (let i = 0; i < 4; i++) s = P.spOverlayScale(s, 1.2);
  assert.ok(s > 2 && s < 2.1, `four 1.2x pinches should reach ~2.07, got ${s}`);
});

test('spCrop: insets are clamped so the content can never vanish', () => {
  const c = P.spCrop({ t: 99, r: 99, b: 99, l: 99 });
  assert.ok(c.t <= 45 && c.r <= 45 && c.b <= 45 && c.l <= 45);
  assert.ok(c.t + c.b <= 80 + 1e-9, `top+bottom must stay under the cap, got ${c.t + c.b}`);
  assert.ok(c.l + c.r <= 80 + 1e-9, `left+right must stay under the cap, got ${c.l + c.r}`);
});

test('spCrop: an untouched crop is reported as identity', () => {
  assert.ok(P.spCropIsIdentity({ t: 0, r: 0, b: 0, l: 0 }));
  assert.ok(P.spCropIsIdentity(null));
  assert.ok(!P.spCropIsIdentity({ t: 5 }));
  assert.equal(P.spCropCss({ t: 0, r: 0, b: 0, l: 0 }), '');
});

test('spCrop: the preview CSS and the export filter describe the same window', () => {
  const crop = { t: 10, r: 5, b: 10, l: 5 };
  assert.equal(P.spCropCss(crop), 'inset(10% 5% 10% 5%)');
  const f = P.spCropFfmpeg(crop, 720, 1280);
  assert.ok(f && f.startsWith('crop='), 'a real crop must produce an ffmpeg filter');
  // ffmpeg's crop syntax is crop=width:height:x:y.
  const [cw, ch, cx, cy] = f.slice('crop='.length).split(':').map(Number);
  // 90% of 720 and 80% of 1280, rounded to even numbers for H.264.
  assert.equal(cw, 648);
  assert.equal(ch, 1024);
  assert.equal(cx, 36);                 // 5% of 720
  assert.equal(cy, 128);                // 10% of 1280
  assert.equal(f, P.spCropFfmpeg(crop, 720, 1280));
});

test('spCropFfmpeg: no crop produces no filter, so the chain stays clean', () => {
  assert.equal(P.spCropFfmpeg(null, 720, 1280), null);
  assert.equal(P.spCropFfmpeg({ t: 0, r: 0, b: 0, l: 0 }, 720, 1280), null);
});

// ── speech-derived captions ─────────────────────────────────────────────────
// The creator's complaint was that captions came from the script, and people do
// not read the script word for word. These pin the behaviour that makes them
// come from what was actually said.

function clipOf(id, inMs, outMs, dur, speech){
  return { id, dur: dur != null ? dur : outMs / 1000, inMs, outMs, speech };
}

test('spCaptionsFromSpeech: cards follow the spoken words, not a script', () => {
  const clip = clipOf('c1', 0, 10000, 10, [
    { text: 'right so what happened', atMs: 500 },
    { text: 'was England dropped the whole squad', atMs: 2400 },
  ]);
  const caps = P.spCaptionsFromSpeech(clip.speech, clip, { wordsPerCard: 5 });
  assert.ok(caps.length >= 1);
  const all = caps.map(c => c.text).join(' ');
  assert.ok(all.includes('England dropped'), 'must contain the spoken words');
  // The words came from the speech list, not from anywhere else.
  for (const c of caps) assert.match(c.id, /^sc\d+$/);
});

test('spCaptionsFromSpeech: a long pause starts a new card', () => {
  const clip = clipOf('c1', 0, 12000, 12, [
    { text: 'first idea', atMs: 400 },
    { text: 'second idea', atMs: 4000 },
  ]);
  const caps = P.spCaptionsFromSpeech(clip.speech, clip, { gapMs: 900, wordsPerCard: 5 });
  assert.equal(caps.length, 2);
  assert.equal(caps[0].text, 'first idea');
  assert.equal(caps[1].text, 'second idea');
});

test('spCaptionsFromSpeech: speech trimmed off the front is dropped and the rest shifts', () => {
  // The clip is trimmed to keep 4s..10s of the source. A phrase at 1s was
  // spoken but is no longer in the video, so it must not appear — this is
  // exactly the drift that made script captions wrong after a trim.
  const clip = clipOf('c1', 4000, 10000, 10, [
    { text: 'this was cut off', atMs: 1000 },
    { text: 'this survived the trim', atMs: 5000 },
  ]);
  const caps = P.spCaptionsFromSpeech(clip.speech, clip, {});
  assert.equal(caps.length, 1);
  assert.equal(caps[0].text, 'this survived the trim');
  // 5000ms into the source, minus a 4000ms trim, is 1000ms into the timeline.
  assert.equal(caps[0].startMs, 1000);
});

test('spCaptionsFromSpeech: trimming makes the coverage loss reportable', () => {
  const clip = clipOf('c1', 4000, 10000, 10, [
    { text: 'a', atMs: 1000 }, { text: 'b', atMs: 2000 }, { text: 'c', atMs: 5000 },
  ]);
  assert.deepEqual(P.spSpeechCoverage(clip.speech, clip), { total: 3, kept: 1 });
});

test('spCaptionsFromSpeech: no speech means no cards, never a crash', () => {
  const clip = clipOf('c1', 0, 5000, 5, []);
  assert.deepEqual(P.spCaptionsFromSpeech([], clip, {}), []);
  assert.deepEqual(P.spCaptionsFromSpeech(null, clip, {}), []);
  assert.deepEqual(P.spCaptionsFromSpeech([{ text: '   ', atMs: 100 }], clip, {}), []);
  assert.deepEqual(P.spCaptionsFromSpeech([{ text: 'x', atMs: 100 }], null, {}), []);
});

test('spCaptionsFromSpeech: every card is a real, forward-running window', () => {
  const clip = clipOf('c1', 0, 20000, 20, Array.from({ length: 12 }, (_, i) => ({
    text: 'phrase number ' + (i + 1), atMs: 300 + i * 1500,
  })));
  const caps = P.spCaptionsFromSpeech(clip.speech, clip, {});
  assert.ok(caps.length > 2, 'expected several cards');
  for (const c of caps){
    assert.ok(c.endMs > c.startMs, `card ${c.id} must run forwards (${c.startMs}→${c.endMs})`);
    assert.ok(c.startMs >= 0);
    assert.ok(c.text.trim().length > 0, 'a card must carry text');
  }
  for (let i = 1; i < caps.length; i++){
    assert.ok(caps[i].startMs >= caps[i - 1].startMs, 'cards must be in order');
  }
});

test('spCaptionsForTimeline: clips stitch so cards land in finished-timeline time', () => {
  const clips = [
    clipOf('c1', 0, 4000, 10, [{ text: 'first clip words', atMs: 1000 }]),
    clipOf('c2', 2000, 6000, 10, [{ text: 'second clip words', atMs: 3000 }]),
  ];
  const caps = P.spCaptionsForTimeline(clips, {});
  assert.equal(caps.length, 2);
  assert.equal(caps[0].startMs, 1000);          // 1000 - 0 across clip 1
  assert.ok(caps[1].startMs >= 4000,
    `clip 2 starts at 4000 on the timeline; got ${caps[1].startMs}`);
  assert.equal(caps[1].startMs, 4000 + 1000);   // 3000 - 2000, after 4000 of clip 1
});

test('spCaptionsForTimeline: an empty project yields no cards', () => {
  assert.deepEqual(P.spCaptionsForTimeline([], {}), []);
  assert.deepEqual(P.spCaptionsForTimeline(null, {}), []);
});

test('spShouldBreakCue: a silence starts a card, a continuous phrase does not', () => {
  assert.equal(P.spShouldBreakCue(1000, 2000, 'next', { gapMs: 450 }), true);
  assert.equal(P.spShouldBreakCue(1000, 1200, 'next', { gapMs: 450, prev: 'hi' }), false);
  assert.equal(P.spShouldBreakCue(null, 100, 'x', {}), false);
  assert.equal(P.spShouldBreakCue(1000, 1100, '', {}), false);
});

test('spShouldBreakCue: a phrase over the length limit breaks', () => {
  assert.equal(P.spShouldBreakCue(1000, 1100, 'this is already quite a long phrase indeed', { maxChars: 20 }), true);
});

// ── preview sizing ──────────────────────────────────────────────────────────

test('spMediaBox: a portrait clip is both oversized and clamped', () => {
  // The review screen was full height on an 892px screen with a 675px video
  // inside it. Capping the height is what actually makes the page compact.
  const box = P.spMediaBox({ width: 1080, height: 1920 }, { width: 412, height: 892 }, { maxHeightPct: 46, pad: 12 });
  assert.ok(box.height <= 892 * 0.46 + 1, `expected <=~410px tall, got ${box.height}`);
  assert.ok(box.width <= 412, 'must never exceed the screen width');
  assert.ok(Math.abs(box.width / box.height - 1080 / 1920) < 0.01, 'must keep the clip aspect ratio');
});

test('spMediaBox: a landscape import is width-bound, not height-bound', () => {
  const box = P.spMediaBox({ width: 1920, height: 1080 }, { width: 412, height: 892 }, { pad: 0 });
  assert.equal(box.width, 412);
  assert.ok(Math.abs(box.height - 231.75) < 1, `expected ~232px tall, got ${box.height}`);
});

test('spMediaBox: a full-height cap never exceeds the available height', () => {
  const avail = { width: 400, height: 700 };
  for (const pct of [30, 50, 90, 200]){
    const b = P.spMediaBox({ width: 9, height: 16 }, avail, { maxHeightPct: pct });
    assert.ok(b.height <= avail.height, `height ${b.height} must fit in ${avail.height}`);
    assert.ok(b.width <= avail.width, `width ${b.width} must fit in ${avail.width}`);
  }
});

test('spMediaBox: unknown media dimensions fall back to a safe portrait box', () => {
  const b = P.spMediaBox({}, { width: 400, height: 800 }, {});
  assert.ok(b.width > 0 && b.height > 0);
  assert.ok(b.height <= 800 && b.width <= 400);
});

// ── recording filter bake ───────────────────────────────────────────────────

test('spRecordFilterCss: the camera picker offers the same looks as the editor', () => {
  for (const id of ['none', 'vivid', 'warm', 'cool', 'mono', 'noir', 'fade', 'punch', 'retro']){
    assert.ok(id in P.SP_RECORD_FILTERS, `${id} must be offered on the camera`);
  }
  assert.equal(P.spRecordFilterCss('mono'), 'grayscale(1) contrast(1.12)');
  assert.equal(P.spRecordFilterCss('none'), 'none');
  assert.equal(P.spRecordFilterCss('bogus'), 'none');
});

test('spRecordBakePlan: a chosen filter becomes a real ffmpeg step', () => {
  const plan = P.spRecordBakePlan('mono', P.spCaptureProfile('balanced'));
  assert.equal(plan.needsBake, true);
  assert.equal(plan.filter, 'hue=s=0,eq=contrast=1.12');
  assert.equal(plan.width, 720);
  assert.equal(plan.height, 1280);
});

test('spRecordBakePlan: Original needs no re-encode of the picture', () => {
  const plan = P.spRecordBakePlan('none', P.spCaptureProfile('light'));
  assert.equal(plan.needsBake, false);
  assert.equal(plan.filter, null);
  assert.equal(plan.width, 480);
});

test('spRecordFilterFfmpeg: every non-Original look has a real filter chain', () => {
  for (const [id, f] of Object.entries(P.SP_RECORD_FILTERS)){
    if (id === 'none'){ assert.equal(f.ffmpeg, null); continue; }
    assert.ok(typeof f.ffmpeg === 'string' && f.ffmpeg.length > 4, `${id} needs an ffmpeg chain`);
    assert.ok(!f.ffmpeg.includes('['), `${id} must not emit a bare filter label`);
  }
});

// ── overlay persistence ─────────────────────────────────────────────────────

test('spOverlaySnapshot / spOverlayRestore: a round trip keeps position and crop', () => {
  const o = {
    id: 'o1', kind: 'text', text: 'Hello', x: 30, y: 70, scale: 1.5,
    crop: { t: 5, r: 0, b: 5, l: 0 }, startMs: 0, endMs: 2000,
    style: 'outline', color: '#F5C518', size: 34,
  };
  const back = P.spOverlayRestore(P.spOverlaySnapshot(o));
  assert.equal(back.x, 30);
  assert.equal(back.y, 70);
  assert.equal(back.scale, 1.5);
  assert.deepEqual(back.crop, { t: 5, r: 0, b: 5, l: 0 });
  assert.equal(back.color, '#F5C518');
});

test('spOverlayRestore: a hostile saved value cannot smuggle in a broken overlay', () => {
  const back = P.spOverlayRestore({ id: 'x', x: 9999, y: -500, scale: 99, size: 0, crop: { t: 90, r: 90, b: 90, l: 90 } });
  assert.equal(back.x, 100);
  assert.equal(back.y, 0);
  assert.equal(back.scale, 4);
  assert.ok(back.size >= 10, 'a zero text size would render nothing');
  assert.ok(back.crop.t <= 45 && back.crop.l <= 45);
  assert.ok(back.crop.t + back.crop.b <= 80 + 1e-9);
});

test('spOverlayRestore: an empty snapshot gets usable defaults, not undefined', () => {
  const back = P.spOverlayRestore({});
  assert.equal(back.x, 50);
  assert.equal(back.y, 50);
  assert.equal(back.scale, 1);
  assert.equal(back.style, 'bold');
  assert.ok(back.crop && back.crop.t === 0);
});

// ── the bug this round actually shipped with ────────────────────────────────

test('spClamp: a non-finite value falls to the low bound, never to the middle', () => {
  // Position maths runs on pointer coordinates. A stray NaN reaching the
  // model would place an overlay at "NaN%" and it would disappear with no
  // error, which is the class of silent failure this file is here to stop.
  assert.equal(P.spClamp(NaN, 10, 90), 10);
  assert.equal(P.spClamp(undefined, 10, 90), 10);
  assert.equal(P.spClamp(Infinity, 10, 90), 10);
  assert.equal(P.spClamp(50, 10, 90), 50);
});
