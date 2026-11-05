// CreatorPulse · Shared cover-photo cache.
//
// WHY THIS EXISTS
// ---------------
// A 6-slide carousel used to download, decode, resize and re-measure the SAME
// article photo six times — once per slide — because renderStatCard called
// fetchCoverImage for every slide. On a small Render instance that is both the
// biggest chunk of the render time and the reason renders had to be run one at
// a time (sequential, to keep memory down), which in turn is why a large
// carousel blew past the 15-second budget.
//
// Fetch + cover-crop + brightness once, then hand every slide the same buffer.
// Slides are still composited individually (they need different text), but the
// expensive photo work happens once.
//
// Deliberately tiny and dependency-free apart from sharp, so it can be swapped
// for a shared store later without touching the renderer.

const sharp = require("sharp");

// Keyed by url + size + focal point. Bounded so a long-lived server cannot grow
// without limit; entries are cheap (a JPEG buffer plus one number).
const MAX_ENTRIES = 48;
const TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function keyFor(url, w, h, focalPoint) {
  const f = focalPoint ? `${Number(focalPoint.x).toFixed(3)}/${Number(focalPoint.y).toFixed(3)}` : "auto";
  return `${url}|${w}x${h}|${f}`;
}

function sweep() {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.at > TTL_MS) cache.delete(k);
  }
  while (cache.size > MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
}

async function loadCover(url, w, h, focalPoint, options = {}) {
  if (!url) return null;
  const key = keyFor(url, w, h, focalPoint);
  const hit = cache.get(key);
  if (hit) return hit.value;

  const timeoutMs = Math.max(500, Number(options.timeoutMs) || 3000);
  const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout
    ? AbortSignal.timeout(timeoutMs)
    : undefined;

  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());

    let pipeline = sharp(buf);
    const meta = await pipeline.metadata();
    const focalX = Math.max(0, Math.min(1, Number(focalPoint?.x ?? 0.5)));
    const focalY = Math.max(0, Math.min(1, Number(focalPoint?.y ?? 0.5)));

    if (focalPoint && meta.width && meta.height) {
      const scale = Math.max(w / meta.width, h / meta.height);
      const cropW = Math.max(1, Math.round(w / scale));
      const cropH = Math.max(1, Math.round(h / scale));
      const left = Math.round(Math.max(0, Math.min(meta.width - cropW, focalX * meta.width - cropW / 2)));
      const top = Math.round(Math.max(0, Math.min(meta.height - cropH, focalY * meta.height - cropH / 2)));
      pipeline = pipeline.extract({ left, top, width: cropW, height: cropH });
    }

    const cover = await pipeline
      .resize(w, h, { fit: "cover", position: focalPoint ? "centre" : sharp.strategy.attention })
      .jpeg({ quality: 90 })
      .toBuffer();

    const stats = await sharp(cover).stats();
    const avgLum = stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3 / 255;
    const value = { buffer: cover, brightness: avgLum };

    sweep();
    cache.set(key, { value, at: Date.now() });
    return value;
  } catch (e) {
    return null;
  }
}

// Cover-crops + measures brightness for an image already in memory (a user
// upload). Same output shape, so all background sources stay interchangeable.
async function loadCoverFromBuffer(buf, w, h, focalPoint) {
  try {
    let pipeline = sharp(buf);
    const meta = await pipeline.metadata();
    if (focalPoint && meta.width && meta.height) {
      const scale = Math.max(w / meta.width, h / meta.height);
      const cropW = Math.max(1, Math.round(w / scale));
      const cropH = Math.max(1, Math.round(h / scale));
      const focalX = Math.max(0, Math.min(1, Number(focalPoint.x ?? 0.5)));
      const focalY = Math.max(0, Math.min(1, Number(focalPoint.y ?? 0.5)));
      const left = Math.round(Math.max(0, Math.min(meta.width - cropW, focalX * meta.width - cropW / 2)));
      const top = Math.round(Math.max(0, Math.min(meta.height - cropH, focalY * meta.height - cropH / 2)));
      pipeline = pipeline.extract({ left, top, width: cropW, height: cropH });
    }
    const cover = await pipeline
      .resize(w, h, { fit: "cover", position: focalPoint ? "centre" : sharp.strategy.attention })
      .jpeg({ quality: 90 })
      .toBuffer();
    const stats = await sharp(cover).stats();
    const avgLum = stats.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3 / 255;
    return { buffer: cover, brightness: avgLum };
  } catch (e) {
    return null;
  }
}

function clear() { cache.clear(); }
function size() { return cache.size; }

module.exports = { loadCover, loadCoverFromBuffer, clear, size, keyFor };
