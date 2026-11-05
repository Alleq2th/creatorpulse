// Verifies the card design system in a REAL Chromium at iPhone size (390x844).
//
// It renders every template x every slide role x every platform through the
// app's own mockup renderer, then measures the DOM: the accent badge must be a
// pill (not a blob), no dashed outlines or placeholder copy may be visible, no
// text may overflow or be truncated, and on TikTok every text box must sit
// inside the safe zone (clear of the right action rail and the bottom caption).
// It also proves the preview and the export resolve to the SAME layout, and
// that the export endpoint returns a real image for every template.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:4599";
const OUT = process.argv[3] || "/tmp/probe/shots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--ignore-certificate-errors"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: "block" });
// Seed a session so the app renders its main shell (tab bar + Create tab)
// instead of the sign-in screen. No network is needed for the card renderer.
await ctx.addInitScript(() => {
  try { localStorage.setItem("cp_v2", JSON.stringify({ token: "probe-token", refreshToken: null, user: { id: "probe", name: "Probe", niches: ["tech"] }, connections: {} })); } catch (e) {}
});
const page = await ctx.newPage();
const errs = [];
const badResponses = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
// "Failed to load resource" is a network 404 (the browser's own favicon probe);
// it is captured with its URL in badResponses, so it is not a JS error.
page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
page.on("response", r => { if (r.status() >= 400) badResponses.push(r.status() + " " + r.url()); });

await page.goto(BASE, { waitUntil: "domcontentloaded" });
for (let i = 0; i < 60; i++) {
  const ready = await page.evaluate(() => !!(window.CPTemplateEngine && window.CPCardLayout && window.CPCardTemplates && window.CPDesignSystem));
  if (ready) break;
  await page.waitForTimeout(250);
}
await page.waitForTimeout(1500);

const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter"];
const ROLES = ["hook", "context", "evidence", "turn", "payoff", "cta"];

const report = await page.evaluate(async ({ PLATFORMS, ROLES }) => {
  const out = { rows: [], previewExportMismatch: [], errors: [] };
  const ids = Object.keys(window.CPCardTemplates.TEMPLATES);
  const host = document.createElement("div");
  host.id = "probe-host";
  host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:8px;overflow:auto";
  document.body.appendChild(host);

  const baseSlide = {
    headline: "This is a headline that runs long enough to wrap onto several lines",
    supportingText: "Supporting text that explains the story in a sentence or two.",
    ctaLine: "FOLLOW FOR MORE", slideNumber: 1, totalSlides: 1
  };
  const PLACEHOLDERS = ["Headline", "Supporting text", "Call to action", "Add a headline", "Add supporting"];

  for (const plat of PLATFORMS) {
    for (const id of ids) {
      const tpl = window.CPCardTemplates.get(id);
      if (tpl.platform !== (plat === "tiktok" ? "tiktok" : "instagram")) continue;
      for (const role of ROLES) {
        const s = JSON.parse(JSON.stringify(baseSlide));
        s.role = role;
        window.CPTemplateEngine.apply(s, id, 0, 1);
        s.role = role;
        const o = {
          type: "image", isCard: true,
          aspect: plat === "tiktok" ? "tiktok" : plat === "youtube" ? "youtube" : plat === "twitter" ? "twitter" : "instagram",
          img: "", editSlide: s,
          _renderCtx: { category: "tech", palette: "noir_orange", format: "tiktok", imageUrl: "", template: id, theme: "modern_dark", typography: "impact", density: "balanced" }
        };
        S.outs["probe"] = [o];
        let html = "";
        try { html = window.renderPlatformMockup(o, "probe", 0, plat); } catch (e) { out.errors.push(id + "/" + role + "/" + plat + ": " + e.message); continue; }
        host.innerHTML = html;
        await new Promise(r => setTimeout(r, 15));
        try { window.cpSyncLiveStages(); } catch (e) {}
        await new Promise(r => setTimeout(r, 30));

        const stage = host.querySelector(".cc-live-stage");
        if (!stage) { out.errors.push(id + "/" + role + "/" + plat + ": no stage"); continue; }
        const sr = stage.getBoundingClientRect();
        const deco = host.querySelector(".cc-live-decoration");
        const dr = deco && !deco.hidden ? deco.getBoundingClientRect() : null;

        // The layout the PREVIEW used, and the layout the EXPORT would use.
        const previewDesign = window.CPCardLayout.resolve({ templateId: id, platform: plat, slide: s, index: 0, total: 1, style: s._style || {} });
        const exportDesign = window.CPDesignSystem.resolve(id, { platform: plat, slide: s, index: 0, total: 1 });
        const geom = d => JSON.stringify(d.layers.map(l => [l.key, +l.box.x.toFixed(4), +l.box.y.toFixed(4), +l.box.width.toFixed(4), +l.box.height.toFixed(4), l.sizePct.toFixed(4), l.lines.join("|")]));
        if (geom(previewDesign) !== geom(exportDesign)) out.previewExportMismatch.push(id + "/" + role + "/" + plat);

        const blocks = [...host.querySelectorAll(".cp-canvas-block")].map(b => {
          const r = b.getBoundingClientRect();
          const txt = b.querySelector(".cc-live-text");
          const cs = txt ? getComputedStyle(txt) : null;
          const overflowX = txt ? txt.scrollWidth - txt.clientWidth : 0;
          const overflowY = txt ? txt.scrollHeight - txt.clientHeight : 0;
          const content = (txt?.textContent || "").trim();
          return {
            name: b.dataset.canvasBlock,
            empty: b.classList.contains("is-empty"),
            hidden: r.width === 0 || r.height === 0,
            border: getComputedStyle(b).borderTopStyle,
            borderWidth: getComputedStyle(b).borderTopWidth,
            text: content.slice(0, 30),
            overflowX, overflowY,
            ellipsis: /\u2026/.test(content),
            placeholder: PLACEHOLDERS.some(p => content === p),
            // fractions of the stage
            fx: (r.left - sr.left) / sr.width, fy: (r.top - sr.top) / sr.height,
            fw: r.width / sr.width, fh: r.height / sr.height
          };
        });

        out.rows.push({
          id, role, plat,
          stage: { w: Math.round(sr.width), h: Math.round(sr.height) },
          decoType: previewDesign.decoration.type,
          deco: dr ? { w: Math.round(dr.width), h: Math.round(dr.height), fw: dr.width / sr.width, fh: dr.height / sr.height, radius: getComputedStyle(deco).borderRadius } : null,
          blocks
        });
      }
    }
  }
  host.remove();
  return out;
}, { PLATFORMS, ROLES });

// ── Assertions ───────────────────────────────────────────────────────────────
const fails = [];
const safe = { tiktok: { top: 0.10, bottom: 0.20, left: 0.06, right: 0.20 }, instagram: { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 }, youtube: { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 }, twitter: { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 } };

for (const r of report.rows) {
  const z = safe[r.plat];
  if (r.deco && r.decoType === "badge") {
    if (r.deco.fw > 0.5) fails.push(`${r.id}/${r.role}/${r.plat}: badge is a blob (${(r.deco.fw * 100).toFixed(0)}% wide)`);
    if (r.deco.fh > 0.08) fails.push(`${r.id}/${r.role}/${r.plat}: badge is full height (${(r.deco.fh * 100).toFixed(0)}%)`);
  }
  for (const b of r.blocks) {
    if (b.hidden) continue;
    if (b.border !== "none" && b.borderWidth !== "0px") fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: dashed outline visible (${b.border} ${b.borderWidth})`);
    if (b.placeholder) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: placeholder copy visible ("${b.text}")`);
    if (b.ellipsis) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: truncated with an ellipsis`);
    if (b.overflowX > 1) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: text overflows horizontally by ${b.overflowX}px`);
    if (b.overflowY > 1) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: text overflows vertically by ${b.overflowY}px`);
    if (b.fx < z.left - 0.02) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: left of the safe zone (${(b.fx * 100).toFixed(1)}%)`);
    if (b.fx + b.fw > 1 - z.right + 0.02) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: right of the safe zone (${((b.fx + b.fw) * 100).toFixed(1)}%)`);
    if (b.fy < z.top - 0.02) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: above the safe zone (${(b.fy * 100).toFixed(1)}%)`);
    if (b.fy + b.fh > 1 - z.bottom + 0.02) fails.push(`${r.id}/${r.role}/${r.plat}/${b.name}: below the safe zone (${((b.fy + b.fh) * 100).toFixed(1)}%)`);
  }
}
if (report.previewExportMismatch.length) fails.push(`preview/export layout mismatch: ${report.previewExportMismatch.slice(0, 5).join(", ")}`);
if (report.errors.length) fails.push(`render errors: ${report.errors.slice(0, 5).join("; ")}`);

// ── The templates must be GENUINELY different, not just recoloured ───────────
// For each template, the six slide roles must produce six different
// compositions (a different set of text boxes), and no two templates may share
// an identical composition for the same role.
const sig = r => r.blocks.filter(b => !b.hidden).map(b => `${b.name}@${b.fx.toFixed(2)},${b.fy.toFixed(2)},${b.fw.toFixed(2)},${b.fh.toFixed(2)}`).sort().join("|");
const byTplRole = {};
for (const r of report.rows) { (byTplRole[r.id] = byTplRole[r.id] || {})[r.role] = sig(r); }
for (const id of Object.keys(byTplRole)) {
  const sigs = Object.values(byTplRole[id]);
  const uniq = new Set(sigs);
  if (uniq.size < sigs.length) fails.push(`${id}: slide roles are not all different (${uniq.size}/${sigs.length} distinct compositions)`);
}
const byRole = {};
for (const r of report.rows) { (byRole[r.role] = byRole[r.role] || {})[r.id] = sig(r); }
for (const role of Object.keys(byRole)) {
  const sigs = Object.values(byRole[role]);
  const uniq = new Set(sigs);
  if (uniq.size < sigs.length) fails.push(`role ${role}: two templates share an identical composition (${uniq.size}/${sigs.length} distinct)`);
}

// ── Screenshots: one per template (hook role) on its own platform ────────────
const shots = [];
for (const id of Object.keys(await page.evaluate(() => window.CPCardTemplates.TEMPLATES))) {
  const tpl = await page.evaluate(i => window.CPCardTemplates.get(i), id);
  const plat = tpl.platform === "tiktok" ? "tiktok" : "instagram";
  const shot = await page.evaluate(async ({ id, plat }) => {
    const host = document.createElement("div");
    host.id = "shot-host";
    host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0a0c;padding:10px;display:flex;align-items:flex-start;justify-content:center";
    document.body.appendChild(host);
    const s = { headline: "This is a headline that runs long enough to wrap", supportingText: "Supporting text that explains the story in a sentence.", ctaLine: "FOLLOW FOR MORE", role: "hook", slideNumber: 1, totalSlides: 1 };
    window.CPTemplateEngine.apply(s, id, 0, 1);
    s.role = "hook";
    const o = { type: "image", isCard: true, aspect: plat, img: "", editSlide: s, _renderCtx: { category: "tech", palette: "noir_orange", format: "tiktok", imageUrl: "", template: id, theme: "modern_dark", typography: "impact", density: "balanced" } };
    S.outs["shot"] = [o];
    host.innerHTML = window.renderPlatformMockup(o, "shot", 0, plat);
    await new Promise(r => setTimeout(r, 40));
    try { window.cpSyncLiveStages(); } catch (e) {}
    await new Promise(r => setTimeout(r, 60));
    const stage = host.querySelector(".cc-live-stage");
    const r = stage.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, { id, plat });
  const file = `${OUT}/${id}.png`;
  await page.screenshot({ path: file, clip: { x: Math.max(0, shot.x), y: Math.max(0, shot.y), width: shot.width, height: shot.height } });
  shots.push(file);
  await page.evaluate(() => { const h = document.getElementById("shot-host"); if (h) h.remove(); });
}

// ── Contact sheet: every template at THUMBNAIL size, for the SAME content ────
// One image showing all ten templates side by side, so the compositions can be
// compared at a glance. The same slide content is used for every tile, so any
// difference on the sheet is a difference in the COMPOSITION, not the copy.
await page.setViewportSize({ width: 1300, height: 1600 });
const sheet = await page.evaluate(async () => {
  const ids = Object.keys(window.CPCardTemplates.TEMPLATES);
  const host = document.createElement("div");
  host.id = "sheet-host";
  host.style.cssText = "position:fixed;left:0;top:0;z-index:99999;background:#0a0a0c;padding:18px;display:grid;grid-template-columns:repeat(5,220px);gap:16px;font-family:Inter,sans-serif";
  document.body.appendChild(host);
  const geom = [];
  for (const id of ids) {
    const tpl = window.CPCardTemplates.get(id);
    const plat = tpl.platform === "tiktok" ? "tiktok" : "instagram";
    const cell = document.createElement("div");
    cell.style.cssText = "width:220px";
    const label = document.createElement("div");
    label.textContent = tpl.name;
    label.style.cssText = "color:#dedede;font-size:12px;margin-bottom:5px;font-weight:600";
    const box = document.createElement("div");
    box.style.cssText = "width:220px;overflow:hidden;border:1px solid #2C2C2C";
    cell.appendChild(label); cell.appendChild(box);
    host.appendChild(cell);
    const s = { headline: "This is a headline that runs long enough to wrap", supportingText: "Supporting text that explains the story in a sentence.", ctaLine: "FOLLOW FOR MORE", role: "hook", slideNumber: 1, totalSlides: 1, stat: "87%" };
    window.CPTemplateEngine.apply(s, id, 0, 1);
    s.role = "hook";
    const o = { type: "image", isCard: true, aspect: plat, img: "", editSlide: s, _renderCtx: { category: "tech", palette: "noir_orange", format: "tiktok", imageUrl: "", template: id, theme: "modern_dark", typography: "impact", density: "balanced" } };
    S.outs["sheet"] = [o];
    box.innerHTML = window.renderPlatformMockup(o, "sheet", 0, plat);
    await new Promise(r => setTimeout(r, 30));
    try { window.cpSyncLiveStages(); } catch (e) {}
    await new Promise(r => setTimeout(r, 40));
    const d = window.CPCardLayout.resolve({ templateId: id, platform: plat, slide: s, index: 0, total: 1, style: {} });
    const h = d.layers.find(l => l.key === "headline");
    const sup = d.layers.find(l => l.key === "supportingText");
    geom.push({
      id, name: tpl.name, treatment: d.treatment.id, deco: d.decoration.type,
      headBox: [h.box.x, h.box.y, h.box.width, h.box.height].map(n => +n.toFixed(3)),
      align: h.align, anchor: h.anchor, lines: h.lines.length, size: +h.sizePct.toFixed(4),
      keyword: h.keyword || "",
      supBox: sup && !sup.empty ? [sup.box.x, sup.box.y, sup.box.width, sup.box.height].map(n => +n.toFixed(3)) : null,
      supLines: sup && !sup.empty ? sup.lines.length : 0
    });
  }
  await new Promise(r => setTimeout(r, 250));
  const r = host.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height, geom };
});
await page.screenshot({ path: `${OUT}/contact-sheet.png`, clip: { x: Math.max(0, sheet.x), y: Math.max(0, sheet.y), width: sheet.width, height: sheet.height } });
await page.evaluate(() => { const h = document.getElementById("sheet-host"); if (h) h.remove(); });
fs.writeFileSync("/tmp/probe/geometry.json", JSON.stringify(sheet.geom, null, 2));
await page.setViewportSize({ width: 390, height: 844 });

// ── Other tabs still respond ─────────────────────────────────────────────────
// ── Download works for every template: the export endpoint returns a real PNG ─
// This is the same endpoint the Download button calls. A non-200, a tiny body,
// or a non-PNG magic number means the download is broken for that template.
const downloads = [];
for (const id of Object.keys(await page.evaluate(() => window.CPCardTemplates.TEMPLATES))) {
  const tpl = await page.evaluate(i => window.CPCardTemplates.get(i), id);
  const plat = tpl.platform === "tiktok" ? "tiktok" : "instagram";
  const res = await page.evaluate(async ({ id, plat }) => {
    const s = { headline: "Download check headline", supportingText: "Supporting line.", ctaLine: "FOLLOW FOR MORE", role: "hook", slideNumber: 1, totalSlides: 1 };
    window.CPTemplateEngine.apply(s, id, 0, 1);
    s.role = "hook";
    const r = await fetch("/api/generate-cards", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides: [s], format: plat, template: id, category: "tech", palette: "noir_orange", theme: "modern_dark", typography: "impact", density: "balanced" })
    });
    const json = await r.json();
    const dataUrl = (json.images && json.images[0]) || "";
    const b64 = dataUrl.split(",")[1] || "";
    const bin = atob(b64);
    const magic = bin.slice(0, 4).split("").map(c => c.charCodeAt(0)).join(",");
    return { status: r.status, bytes: bin.length, magic, isDataUrl: dataUrl.startsWith("data:image/png") };
  }, { id, plat });
  const isPng = res.magic === "137,80,78,71"; // \x89PNG
  downloads.push({ id, plat, ...res, isPng });
  if (res.status !== 200) fails.push(`download ${id}: HTTP ${res.status}`);
  else if (!res.isDataUrl || !isPng) fails.push(`download ${id}: not a PNG data URL (magic ${res.magic})`);
  else if (res.bytes < 20000) fails.push(`download ${id}: suspiciously small (${res.bytes} bytes)`);
}

const tabsOk = await page.evaluate(() => {
  const nav = [...document.querySelectorAll(".tabbar .tab")].map(b => b.textContent.trim()).filter(Boolean);
  return { count: nav.length, sample: nav.slice(0, 6) };
});
// Prove the other tabs still respond: switch to each and confirm the view changes.
const tabSwitch = await page.evaluate(async () => {
  const results = [];
  for (const t of ["hooks", "calendar", "profile", "home"]) {
    try { window.setTab(t); } catch (e) { results.push(t + ":ERR"); continue; }
    await new Promise(r => setTimeout(r, 120));
    const active = document.querySelector(".tabbar .tab.active");
    results.push(t + ":" + (active ? active.textContent.trim() : "none"));
  }
  return results;
});

fs.writeFileSync("/tmp/probe/design-report.json", JSON.stringify({ rows: report.rows.length, fails, shots, downloads, tabsOk, tabSwitch, errs, badResponses }, null, 2));
console.log("rows:", report.rows.length, "| screenshots:", shots.length);
console.log("downloads:", downloads.filter(d => d.status === 200 && d.isPng).length + "/" + downloads.length, "returned a real PNG");
console.log("console errors:", errs.length ? errs.slice(0, 5) : "none");
console.log("bad responses:", badResponses.length ? badResponses.slice(0, 5) : "none");
console.log("tabs found:", tabsOk.count, tabsOk.sample.join(", "));
console.log("tab switch:", tabSwitch.join(" | "));
if (fails.length) { console.log("FAILURES (" + fails.length + "):"); fails.slice(0, 40).forEach(f => console.log("  - " + f)); }
else console.log("ALL CHECKS PASSED");
await browser.close();
process.exit(fails.length ? 1 : 0);
