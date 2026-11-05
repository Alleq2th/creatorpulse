// Verifies the Themes sheet and the template-flow tiles render real previews.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.argv[2] || "http://127.0.0.1:4599";
const OUT = "/tmp/probe/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message));
p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto(BASE, { waitUntil: "load" });
await p.waitForTimeout(2000);

const res = await p.evaluate(async () => {
  const out = { themeTiles: [], templateTiles: [], failures: [] };
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:8px;overflow:auto";
  document.body.appendChild(host);

  // ── Theme tiles ──
  const s = { type: "hook", headline: "A headline that wraps onto two lines", supportingText: "Supporting text that explains the story over three sentences so it must wrap.", ctaLine: "FOLLOW FOR MORE", slideNumber: 1, totalSlides: 1 };
  window.CPTemplateEngine.apply(s, "viral_hook", 0, 1);
  const o = { type: "image", isCard: true, aspect: "instagram", img: "", editSlide: s, _renderCtx: { template: "viral_hook" } };
  S.outs["th"] = [o];
  const themes = window.CardThemes.STYLE_THEMES || window.CardThemes.themes || [];
  const list = Array.isArray(themes) ? themes : Object.values(themes);
  for (const t of list.slice(0, 6)) {
    const html = window.CPThemePreview.tileHTML({
      templateId: "viral_hook", platform: "instagram", slide: s,
      style: window.CardThemes.applyTheme({}, t.id), plateUrl: "", themeName: t.name, active: false
    });
    host.innerHTML = html;
    await new Promise(r => setTimeout(r, 20));
    const tile = host.querySelector(".cc-th-tile");
    const layers = host.querySelectorAll(".cc-th-layer");
    const frame = host.querySelector(".cc-th-frame");
    const fr = frame.getBoundingClientRect();
    out.themeTiles.push({ name: t.name, layers: layers.length, w: Math.round(fr.width), h: Math.round(fr.height), hasScrim: !!host.querySelector(".cc-th-scrim") });
    if (!layers.length) out.failures.push(`theme ${t.name}: no text layers`);
    if (!host.querySelector(".cc-th-scrim")) out.failures.push(`theme ${t.name}: no scrim`);
    if (host.textContent.includes("...")) out.failures.push(`theme ${t.name}: ellipsis in preview`);
  }

  // ── Template tiles ──
  const ids = Object.keys(window.CPTemplateEngine.TEMPLATES);
  for (const id of ids) {
    const tm = window.CPTemplateEngine.get(id);
    const html = window.CPCreateSteps.templateThumb(tm, "instagram");
    if (!html) { out.failures.push(`template ${id}: no thumb builder`); continue; }
    host.innerHTML = html;
    await new Promise(r => setTimeout(r, 15));
    const layers = host.querySelectorAll(".cc-template-layer");
    out.templateTiles.push({ id, layers: layers.length, live: !!host.querySelector(".cc-template-thumb-live") });
    if (!layers.length) out.failures.push(`template ${id}: no text layers in tile`);
  }
  host.remove();
  return out;
});

console.log(JSON.stringify(res, null, 2));
console.log("errors:", errs.slice(0, 5));
await b.close();
