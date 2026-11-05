// Proves the new tests actually catch a regression: for each break, apply it,
// run the design-system tests, confirm they FAIL, restore the file, and confirm
// they PASS again. Nothing is left broken.
import fs from "node:fs";
import { execSync } from "node:child_process";

const TEST = "test/cardDesignSystem.test.js";
const BREAKS = [
  {
    name: "auto-fit never shrinks, so a long headline cannot fit",
    file: "public/lib/cardTypography.js",
    from: "      size = Math.max(minPct, size * 0.94);",
    to: "      size = size;",
    expect: "auto-fit shrinks a long headline"
  },
  {
    name: "the badge stretches to the full card width (the old blob)",
    file: "public/lib/cardLayoutEngine.js",
    from: "width: w, height: h, radius: Math.round(h / 2)",
    to: "width: W, height: h, radius: Math.round(h / 2)",
    expect: "badge decoration is pill-sized"
  },
  {
    name: "two templates share one composition",
    file: "public/lib/cardTemplates.js",
    from: "        hook:     { headline: R(.08, .16, .84, .26, { maxLines: 4, maxSize: .072 }), supportingText: R(.08, .46, .84, .30, { maxLines: 5 }), ctaLine: R(.08, .82, .84, .06, { maxLines: 1, maxSize: .028 }) },",
    to: "        hook:     { headline: R(.08, .18, .84, .30, { maxLines: 4, maxSize: .082 }), supportingText: R(.08, .52, .84, .22, { maxLines: 4 }), ctaLine: R(.08, .84, .84, .06, { maxLines: 1, maxSize: .030 }) },",
    expect: "templates are different from each other"
  },
  {
    name: "the export re-wraps the text instead of using the engine's lines",
    file: "services/statCard.js",
    from: "if (layer && !layer.empty && layer.lines && layer.lines.length) {",
    to: "if (false && layer && !layer.empty && layer.lines && layer.lines.length) {",
    expect: "export draws the engine"
  }
];

function runTests() {
  try {
    const out = execSync(`node --test ${TEST}`, { encoding: "utf8", stdio: "pipe" });
    return { pass: true, out };
  } catch (e) {
    return { pass: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const results = [];
for (const b of BREAKS) {
  const original = fs.readFileSync(b.file, "utf8");
  const count = original.split(b.from).length - 1;
  if (count !== 1) {
    results.push({ name: b.name, ok: false, why: `anchor appears ${count} times in ${b.file}` });
    continue;
  }
  fs.writeFileSync(b.file, original.replace(b.from, b.to));
  const broken = runTests();
  fs.writeFileSync(b.file, original); // restore
  const restored = runTests();
  const caught = !broken.pass && /not ok|fail [1-9]/.test(broken.out);
  // The expected test must be among the FAILING ones, not merely present in the
  // output (a passing test's name also appears there).
  const failingNames = (broken.out.match(/^not ok \d+ - (.+)$/gm) || []).join("\n");
  const named = failingNames.includes(b.expect);
  results.push({
    name: b.name,
    file: b.file,
    brokeIt: !broken.pass,
    caughtByExpectedTest: named,
    restoredPasses: restored.pass,
    ok: caught && named && restored.pass
  });
}

console.log(JSON.stringify(results, null, 2));
const allOk = results.every(r => r.ok);
console.log(allOk ? "REGRESSION PROOF: PASS (every break was caught, every restore passed)" : "REGRESSION PROOF: FAIL");
process.exit(allOk ? 0 : 1);
