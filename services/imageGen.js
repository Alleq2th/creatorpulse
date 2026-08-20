// Image generation — extracted into its own file so this is easy to find and
// fix on its own, separate from the rest of server.js.
//
// IMPORTANT HISTORY: this used to call image.pollinations.ai/prompt/... with
// no auth. Pollinations migrated their whole platform to a unified endpoint
// at gen.pollinations.ai — the old URL is deprecated, which is why image
// generation stopped working entirely (not intermittently — the old endpoint
// just doesn't work anymore). The new endpoint below still generates Flux
// images without a key, but anonymous requests are rate-limited to about
// 1 every 15 seconds. Get a free key at https://enter.pollinations.ai
// (GitHub login, takes ~2 min) and set it as POLLINATIONS_KEY on Render to
// remove that limit — the code below works with or without it.

const fetch = require("node-fetch");

const POLLINATIONS_KEY = process.env.POLLINATIONS_KEY;
const HF_KEY = process.env.HF_API_KEY;

// Aspect ratios: "square" 1:1, "portrait"/"reel"/"tiktok"/"story" 9:16,
// "thumbnail"/"youtube" 16:9, "carousel" 4:5
function dimsForFormat(format) {
  const f = String(format || "square").toLowerCase();
  if (f.includes("thumbnail") || f.includes("youtube") || f.includes("16:9")) return { w: 1280, h: 720 };
  if (f.includes("reel") || f.includes("tiktok") || f.includes("story") || f.includes("9:16") || f.includes("portrait")) return { w: 720, h: 1280 };
  if (f.includes("carousel") || f.includes("4:5")) return { w: 1080, h: 1350 };
  return { w: 1024, h: 1024 };
}

async function pollinationsImage(prompt, w, h) {
  const seed = Math.floor(Math.random() * 1e9);
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const headers = { "User-Agent": "CreatorPulse/1.0" };
    if (POLLINATIONS_KEY) headers["Authorization"] = `Bearer ${POLLINATIONS_KEY}`;
    const r = await fetch(url, { headers, signal: ctl.signal });
    if (!r.ok) throw new Error("pollinations " + r.status);
    const buf = await r.buffer();
    if (buf.length < 2000) throw new Error("empty image");
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } finally { clearTimeout(timer); }
}

async function hfImage(prompt) {
  if (!HF_KEY) throw new Error("no hf key");
  const models = ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"];
  for (const model of models) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt, parameters: { negative_prompt: "blurry, watermark, text, logo, deformed", num_inference_steps: 25 } }),
        signal: ctl.signal
      });
      if (!r.ok) continue;
      const b64 = (await r.buffer()).toString("base64");
      return `data:image/jpeg;base64,${b64}`;
    } catch (e) { /* try next model */ }
    finally { clearTimeout(timer); }
  }
  throw new Error("hf unavailable");
}

async function generateOneImage(prompt, format) {
  const { w, h } = dimsForFormat(format);
  const styled = `${prompt}. Editorial photography, sharp focus, cinematic lighting, magazine-quality composition, no text, no watermark, no logo`;
  try { return await pollinationsImage(styled, w, h); }
  catch (e1) {
    try { return await hfImage(styled); }
    catch (e2) { throw new Error("All image providers unavailable: " + e1.message); }
  }
}

module.exports = { generateOneImage, dimsForFormat };
