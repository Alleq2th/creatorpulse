#!/usr/bin/env node
// Measures the REAL server-side render time for 1, 3, 5, 6 and 8 slides and
// checks each against the user's budget (1 -> 5s, up to 5 -> 10s, more -> 15s).
//
// Run: node scripts/measure-generation-budget.js
//
// This measures the render pipeline only (SVG rasterise + composite + encode),
// which is the part the server controls. The AI text call and the network
// round-trip are separate and are reported by the browser harness.
const path = require("path");
const statCard = require(path.join(__dirname, "..", "services", "statCard.js"));
const budget = require(path.join(__dirname, "..", "public", "lib", "generationBudget.js"));

const TEMPLATES = ["impact", "neon_noir", "dark_gradient", "editorial", "minimal_grid"];

function slidesFor(n) {
  return Array.from({ length: n }, (_, i) => ({
    type: i === 0 ? "hook" : (i === n - 1 && n >= 6 ? "outro" : "body"),
    headline: `Slide ${i + 1}: a realistic headline that runs a few words long`,
    supportingText: "A short supporting line of copy for the card.",
    body: "One or two crisp sentences of body copy that a reader can scan quickly.",
    sectionLabel: "WHAT HAPPENED",
    stat: "42%",
    statLabel: "of fans agreed"
  }));
}

async function timeOnce(n, templateId) {
  const slides = slidesFor(n);
  const t0 = process.hrtime.bigint();
  const out = await statCard.renderCardSet(
    slides,
    { displayName: "Football", slug: "football" },
    "noir_orange",
    "instagram",
    null,
    { templateId, platform: "instagram", theme: "gradient" }
  );
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { ms, count: out.length, bytes: out.reduce((s, d) => s + d.length, 0) };
}

(async () => {
  console.log("CreatorPulse · generation timing budget\n");
  console.log("slides | template      | render ms | budget ms | within? | images");
  console.log("-------|---------------|-----------|-----------|---------|-------");
  let worst = 0;
  let allWithin = true;
  for (const n of [1, 3, 5, 6, 8]) {
    for (const tpl of TEMPLATES) {
      const r = await timeOnce(n, tpl);
      const b = budget.budgetMs(n);
      const ok = r.ms <= b;
      if (!ok) allWithin = false;
      worst = Math.max(worst, r.ms / b);
      console.log(
        `${String(n).padStart(6)} | ${tpl.padEnd(13)} | ${r.ms.toFixed(0).padStart(9)} | ${String(b).padStart(9)} | ${(ok ? "yes" : "NO").padStart(7)} | ${r.count}`
      );
    }
  }
  console.log(`\nworst case used ${(worst * 100).toFixed(0)}% of its budget`);
  console.log(allWithin ? "RESULT: every render is inside the budget" : "RESULT: SOME RENDERS EXCEEDED THE BUDGET");
  process.exit(allWithin ? 0 : 1);
})();
