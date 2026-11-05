// Reproduces the card preview bugs in a real Chromium at iPhone size.
// Renders the real mockup markup for every template on every platform and
// measures the geometry, so a bug is a number, not an opinion.
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

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const report = await page.evaluate(async () => {
  const out = { templates: [], platforms: {} };
  const ids = Object.keys(window.CPTemplateEngine.TEMPLATES);
  const host = document.createElement("div");
  host.id = "probe-host";
  host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:8px;overflow:auto";
  document.body.appendChild(host);

  const baseSlide = {
    type: "hook", headline: "This is a headline that runs long enough to wrap onto several lines",
    supportingText: "Supporting text that explains the story in a sentence or two.",
    ctaLine: "FOLLOW FOR MORE", slideNumber: 1, totalSlides: 1
  };

  for (const plat of ["instagram", "tiktok", "youtube", "twitter"]) {
    out.platforms[plat] = [];
    for (const id of ids) {
      const s = JSON.parse(JSON.stringify(baseSlide));
      window.CPTemplateEngine.apply(s, id, 0, 1);
      const o = {
        type: "image", isCard: true, aspect: plat === "tiktok" ? "tiktok" : plat === "youtube" ? "youtube" : "instagram",
        img: "", editSlide: s,
        _renderCtx: { category: "tech", palette: "noir_orange", format: "tiktok", imageUrl: "", template: id, theme: "modern_dark", typography: "impact", density: "balanced" }
      };
      // The app keeps outputs in S.outs; the live stage reads the slide from there.
      S.outs["probe"] = [o];
      let html = "";
      try { html = window.renderPlatformMockup(o, "probe", 0, plat); } catch (e) { out.platforms[plat].push({ id, error: e.message }); continue; }
      host.innerHTML = html;
      await new Promise(r => setTimeout(r, 20));
      try { window.cpSyncLiveStages(); } catch (e) {}
      await new Promise(r => setTimeout(r, 40));
      const stage = host.querySelector(".cc-live-stage");
      const shell = host.querySelector(".mock-shell");
      const deco = host.querySelector(".cc-live-decoration");
      const blocks = [...host.querySelectorAll(".cp-canvas-block")].map(b => {
        const r = b.getBoundingClientRect();
        const txt = b.querySelector(".cc-live-text");
        return {
          name: b.dataset.canvasBlock,
          w: Math.round(r.width), h: Math.round(r.height),
          top: Math.round(r.top), left: Math.round(r.left),
          border: getComputedStyle(b).borderTopStyle,
          text: (txt?.textContent || "").slice(0, 24),
          fontSize: txt ? getComputedStyle(txt).fontSize : null
        };
      });
      const sr = stage ? stage.getBoundingClientRect() : null;
      const shr = shell ? shell.getBoundingClientRect() : null;
      const dr = deco && !deco.hidden ? deco.getBoundingClientRect() : null;
      out.platforms[plat].push({
        id,
        stage: sr ? { w: Math.round(sr.width), h: Math.round(sr.height), top: Math.round(sr.top) } : null,
        shell: shr ? { w: Math.round(shr.width), h: Math.round(shr.height) } : null,
        deco: dr ? { w: Math.round(dr.width), h: Math.round(dr.height), top: Math.round(dr.top), left: Math.round(dr.left), radius: getComputedStyle(deco).borderRadius } : null,
        blocks
      });
    }
  }
  host.remove();
  return out;
});

fs.writeFileSync("/tmp/probe/report.json", JSON.stringify(report, null, 2));
for (const plat of ["tiktok", "instagram"]) {
  console.log("=== " + plat + " ===");
  for (const r of report.platforms[plat]) {
    console.log(r.id, "stage", JSON.stringify(r.stage), "shell", JSON.stringify(r.shell), "deco", JSON.stringify(r.deco));
  }
}
console.log("errors:", errs.slice(0, 5));
await browser.close();
