// Visual + behavioural verification of the card fixes at iPhone size (390x844).
// Renders every template on every platform, screenshots them, checks the blob,
// the TikTok frame fill, dashed outlines, empty slots, and the download path.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:4599";
const OUT = process.argv[3] || "/tmp/probe/shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: "block" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });

await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(2000);

const results = await page.evaluate(async () => {
  const out = { checks: [], failures: [] };
  const ids = Object.keys(window.CPTemplateEngine.TEMPLATES);
  const host = document.createElement("div");
  host.id = "verify-host";
  host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:6px;overflow:auto";
  document.body.appendChild(host);

  const baseSlide = {
    type: "hook", headline: "This headline is long enough to wrap onto several lines of text",
    supportingText: "Supporting text that explains the story in a sentence or two.",
    ctaLine: "FOLLOW FOR MORE", slideNumber: 1, totalSlides: 1
  };

  for (const plat of ["instagram", "tiktok", "youtube", "twitter"]) {
    for (const id of ids) {
      const s = JSON.parse(JSON.stringify(baseSlide));
      window.CPTemplateEngine.apply(s, id, 0, 1);
      const o = {
        type: "image", isCard: true, aspect: plat === "tiktok" ? "tiktok" : plat === "youtube" ? "youtube" : "instagram",
        img: "", editSlide: s,
        _renderCtx: { category: "tech", palette: "noir_orange", format: "tiktok", imageUrl: "", template: id, theme: "modern_dark", typography: "impact", density: "balanced" }
      };
      S.outs["vf"] = [o];
      host.innerHTML = window.renderPlatformMockup(o, "vf", 0, plat);
      await new Promise(r => setTimeout(r, 20));
      try { window.cpSyncLiveStages(); } catch (e) {}
      await new Promise(r => setTimeout(r, 50));

      const stage = host.querySelector(".cc-live-stage");
      const shell = host.querySelector(".mock-shell");
      const deco = host.querySelector(".cc-live-decoration");
      const sr = stage.getBoundingClientRect();
      const shr = shell.getBoundingClientRect();
      const dr = deco && !deco.hidden ? deco.getBoundingClientRect() : null;

      // 1. No blob: a FILLED decoration must never cover most of the card.
      //    A border frame (editorial) is a stroke, not a fill, so it is exempt.
      if (dr) {
        const cs = getComputedStyle(deco);
        const isStrokeOnly = cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.borderTopWidth !== "0px";
        const ratio = (dr.width * dr.height) / (sr.width * sr.height);
        if (!isStrokeOnly && ratio > 0.55) {
          out.failures.push(`${plat}/${id}: decoration covers ${Math.round(ratio * 100)}% of the card (blob)`);
        }
      }
      // 2. TikTok card fills the frame.
      if (plat === "tiktok" && (sr.height / shr.height) < 0.95) {
        out.failures.push(`tiktok/${id}: card is ${Math.round(sr.height / shr.height * 100)}% of frame height`);
      }
      // 3. No dashed outlines in the preview.
      for (const b of host.querySelectorAll(".cp-canvas-block")) {
        const cs = getComputedStyle(b);
        if (cs.borderTopStyle === "dashed" && cs.borderTopWidth !== "0px") {
          out.failures.push(`${plat}/${id}: dashed outline visible on ${b.dataset.canvasBlock}`);
        }
      }
      // 4. Text inside the safe zone.
      const z = window.CPCardLayout.safeZone(plat);
      for (const b of host.querySelectorAll(".cp-canvas-block")) {
        const r = b.getBoundingClientRect();
        const rel = { l: (r.left - sr.left) / sr.width, t: (r.top - sr.top) / sr.height, r: (r.right - sr.left) / sr.width, b: (r.bottom - sr.top) / sr.height };
        if (rel.l < z.left - 0.02 || rel.t < z.top - 0.02 || rel.r > 1 - z.right + 0.02 || rel.b > 1 - z.bottom + 0.02) {
          out.failures.push(`${plat}/${id}: ${b.dataset.canvasBlock} outside safe zone (${JSON.stringify(rel)})`);
        }
      }
      out.checks.push({ plat, id, stage: { w: Math.round(sr.width), h: Math.round(sr.height) }, deco: dr ? { w: Math.round(dr.width), h: Math.round(dr.height) } : null });
    }
  }

  // 5. Empty slot must not render.
  const s2 = JSON.parse(JSON.stringify(baseSlide));
  window.CPTemplateEngine.apply(s2, "viral_hook", 0, 1);
  s2.supportingText = "";
  const o2 = { type: "image", isCard: true, aspect: "tiktok", img: "", editSlide: s2, _renderCtx: { template: "viral_hook" } };
  S.outs["vf2"] = [o2];
  host.innerHTML = window.renderPlatformMockup(o2, "vf2", 0, "tiktok");
  await new Promise(r => setTimeout(r, 20));
  try { window.cpSyncLiveStages(); } catch (e) {}
  await new Promise(r => setTimeout(r, 50));
  const emptyBlock = host.querySelector('[data-canvas-block="supportingText"]');
  if (emptyBlock && getComputedStyle(emptyBlock).display !== "none") out.failures.push("empty supportingText slot is still visible");
  if (host.textContent.includes("Add supporting text")) out.failures.push("placeholder text 'Add supporting text' is visible");

  host.remove();
  return out;
});

// Screenshot a few representative cards.
const shots = [];
for (const [plat, id] of [["tiktok", "viral_hook"], ["tiktok", "impact"], ["tiktok", "high_retention"], ["instagram", "viral_hook"], ["instagram", "editorial"], ["youtube", "impact"], ["twitter", "neon_noir"]]) {
  await page.evaluate(async ({ plat, id }) => {
    const host = document.getElementById("shot-host") || (() => { const d = document.createElement("div"); d.id = "shot-host"; d.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:6px;overflow:auto"; document.body.appendChild(d); return d; })();
    const s = { type: "hook", headline: "This headline is long enough to wrap onto several lines", supportingText: "Supporting text that explains the story in a sentence or two.", ctaLine: "FOLLOW FOR MORE", slideNumber: 1, totalSlides: 1 };
    window.CPTemplateEngine.apply(s, id, 0, 1);
    const o = { type: "image", isCard: true, aspect: plat === "tiktok" ? "tiktok" : plat === "youtube" ? "youtube" : "instagram", img: "", editSlide: s, _renderCtx: { template: id } };
    S.outs["shot"] = [o];
    host.innerHTML = window.renderPlatformMockup(o, "shot", 0, plat);
    await new Promise(r => setTimeout(r, 20));
    try { window.cpSyncLiveStages(); } catch (e) {}
    await new Promise(r => setTimeout(r, 60));
  }, { plat, id });
  const el = await page.$("#shot-host .mock-shell");
  if (el) {
    const f = `${OUT}/${plat}-${id}.png`;
    await el.screenshot({ path: f });
    shots.push(f);
  }
}

// 6. Download path: compose a real image and confirm it is a data URL.
const dl = await page.evaluate(async () => {
  const s = { type: "hook", headline: "Download test headline", supportingText: "Support", ctaLine: "FOLLOW", slideNumber: 1, totalSlides: 1 };
  window.CPTemplateEngine.apply(s, "viral_hook", 0, 1);
  const o = { type: "image", isCard: true, aspect: "tiktok", img: "", editSlide: s, _renderCtx: { template: "viral_hook" } };
  S.outs["dl"] = [o];
  const snap = window.cpExportSnapshot("dl", 0, 0);
  if (!snap) return { ok: false, why: "no snapshot" };
  try {
    const url = await window.cpComposeCard(snap);
    return { ok: !!url && url.startsWith("data:image/jpeg"), len: url ? url.length : 0 };
  } catch (e) { return { ok: false, why: e.message }; }
});

fs.writeFileSync("/tmp/probe/verify.json", JSON.stringify({ results, dl, errs, shots }, null, 2));
console.log("failures:", results.failures.length);
results.failures.slice(0, 20).forEach(f => console.log("  ✗", f));
console.log("download:", JSON.stringify(dl));
console.log("console errors:", errs.filter(e => !/ERR_CERT|404|favicon/.test(e)).slice(0, 5));
console.log("shots:", shots.length);
await browser.close();
