/* Spec 8.3 — the section jump list must actually move the document.
 *
 *   "The user should be able to read the script, move between sections, edit
 *    the text, and preserve the content as they work."
 *
 * "Move between sections" is the jump list. It is the easiest part of this
 * feature to break silently: the pills still render, still look tappable, and
 * simply do nothing — so the panel looks right and the promise is unmet.
 *
 * That is not hypothetical. A text-matching test passed while
 * `if (false && target.scrollIntoView)` was in the code, because the guard's
 * text was still present. This file calls the real function instead.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("BEHAVIOUR: a section pill actually scrolls the sheet", () => {
  const scrolled = [];
  const sandbox = {
    document: {
      readyState: "complete",
      head: { appendChild: () => {} },
      // Any id except the stylesheet resolves to a fake sheet section.
      getElementById: (id) => (id === "cp-doc-styles" ? null : {
        querySelector: (sel) => ({ scrollIntoView: (opts) => scrolled.push({ sel, opts }) })
      }),
      createElement: () => ({ id: "", textContent: "" }),
      addEventListener: () => {}
    },
    console: { warn: () => {} },
    setTimeout,
    module: undefined,
    renderOut: () => "ORIGINAL-CARD",
    setOutputContent: () => {},
    toggleOutputEdit: () => {},
    saveOut: () => {}
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);

  vm.runInContext(read("public/lib/longFormDoc.js"), ctx);
  vm.runInContext("var S = { outputEditing: {} };", ctx);
  vm.runInContext(read("public/lib/longFormView.js"), ctx);

  ctx.cpDocJump("t-lf", 0, 2);
  assert.equal(scrolled.length, 1, "tapping a pill must scroll to that section");
  assert.equal(scrolled[0].sel, '[data-sec="2"]', "and it must target the section that was tapped");
  assert.equal(scrolled[0].opts.block, "start", "the section must land at the top of the view");

  // The panel re-renders constantly, so a missing sheet must never throw.
  assert.doesNotThrow(() => ctx.cpDocJump("nope", 0, 0));
});

test("BEHAVIOUR: the generated pills call cpDocJump with a quoted id", () => {
  // An unquoted id is evaluated as arithmetic: cpDocJump(t-lf,0,0) means
  // "t minus lf" and throws "t is not defined", so every pill is dead. This was
  // found only in Chromium, because node never parses the onclick attribute.
  const sandbox = {
    document: {
      readyState: "complete",
      head: { appendChild: () => {} },
      getElementById: () => null,
      createElement: () => ({ id: "", textContent: "" }),
      addEventListener: () => {}
    },
    console: { warn: () => {} },
    setTimeout,
    module: undefined,
    renderOut: () => "ORIGINAL-CARD",
    setOutputContent: () => {},
    toggleOutputEdit: () => {},
    saveOut: () => {}
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(read("public/lib/longFormDoc.js"), ctx);
  vm.runInContext("var S = { outputEditing: {} };", ctx);
  vm.runInContext(read("public/lib/longFormView.js"), ctx);

  const html = ctx.renderOut({ label: "Long-Form", content: "0:00 - Hook\nbody here" }, "t-lf", 0);
  assert.match(html, /cpDocJump\('t-lf',0,0\)/, "the id must be quoted");
  assert.doesNotMatch(html, /cpDocJump\(t-lf/, "an unquoted id would be parsed as arithmetic");
});
