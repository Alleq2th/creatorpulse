/* Spec 8.3 — long-form scripts need a document experience, not a narrow card.
 *
 *   "Long-form scripts require a different experience."
 *   "The user should be able to read the script, move between sections, edit
 *    the text, and preserve the content as they work."
 *   "Avoid presenting a long script inside a narrow card surrounded by
 *    unrelated controls."
 *   "Use a more document-oriented layout where appropriate."
 *   "Keep secondary actions accessible without allowing them to overwhelm the
 *    writing experience."
 *
 * Plus the app's own system-prompt rule, which the long-form template used to
 * contradict:
 *   "Never label or separate sections with bracketed tags like [HOOK] or [CTA]."
 *
 * Two kinds of test here, on purpose:
 *  1. BEHAVIOUR — the real longFormView.js is evaluated in a VM against a fake
 *     browser, so what is asserted is the markup the user would see.
 *  2. WIRING — the loader actually loads the files, and the cache moved forward.
 *
 * Source-text matching is a weak proof: `if (false && shouldRenderAsDoc(o))`
 * still contains the "right" text while rendering nothing. The VM tests exist
 * because that exact mutation slipped past a text-only version of this file.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const LIB = require(path.join(ROOT, "public", "lib", "longFormDoc.js"));

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const VIEW_JS = read("public/lib/longFormView.js");
const ENV_JS = read("public/create/env.js");
const SW_JS = read("public/sw.js");
const CORE_JS = read("public/core.js");

const LONG_WORDS = Array.from({ length: 300 }, (_, i) => "word" + i).join(" ");

/* ---------- 1. the pure rules ---------- */

test("long-form is recognised from its label or its length", () => {
  assert.equal(LIB.shouldRenderAsDoc({ label: "YouTube · Long-Form Video Script", content: "x" }), true);
  assert.equal(LIB.shouldRenderAsDoc({ label: "YouTube · Shorts", content: "short" }), false);
  assert.equal(LIB.shouldRenderAsDoc({ label: null, content: "short" }), false);
  assert.equal(LIB.shouldRenderAsDoc({ label: null, content: LONG_WORDS }), true, "300 words is a document");
});

test("a wordy short-form script is still a script, not a document", () => {
  // The short-form label must beat length, or the editor silently changes
  // layout just because a TikTok script got long.
  const long = Array.from({ length: 400 }, (_, i) => "w" + i).join(" ");
  assert.equal(LIB.shouldRenderAsDoc({ label: "TikTok · Script", content: long }), false);
  assert.equal(LIB.shouldRenderAsDoc({ label: "YouTube · Shorts", content: long }), false);
  assert.equal(LIB.shouldRenderAsDoc({ label: "X · Hot Take", content: "Agree?" }), false);
  assert.equal(LIB.shouldRenderAsDoc(undefined), false, "a missing output must not throw");
  assert.equal(LIB.shouldRenderAsDoc({}), false, "an empty output must not throw");
});

test("bracketed section tags are parsed into real sections, in order", () => {
  const doc = LIB.longFormDoc([
    "[0:00 - 0:25 THE HOOK & RETENTION STAKE]:",
    "Open immediately on the central question.",
    "",
    "[CHAPTER 1: THE BACKSTORY]:",
    "The origins and key figures.",
    "",
    "[OUTRO & RETENTION CTA]:",
    "Never say in conclusion."
  ].join("\n"));

  assert.equal(doc.sections.length, 3);
  assert.equal(doc.sections[0].label, "0:00 - 0:25 THE HOOK & RETENTION STAKE");
  assert.equal(doc.sections[2].label, "OUTRO & RETENTION CTA");
  assert.match(doc.sections[0].body, /Open immediately/);
  // The label must not repeat inside the body, or the user reads it twice.
  assert.ok(!/HOOK & RETENTION STAKE/.test(doc.sections[0].body));
});

test("timestamp chapter lines (the new prompt shape) also become sections", () => {
  // The prompt now asks for "0:00 - The Hook" instead of [tags], so the parser
  // must understand that shape or the fix loses all structure.
  const doc = LIB.longFormDoc("0:00 - The Hook\nOpening line.\n\n2:10 - The Backstory\nThe middle.\n\n5:30 - Your Next Move\nClosing.");
  assert.equal(doc.sections.length, 3);
  assert.equal(doc.sections[0].label, "0:00 · The Hook");
  assert.equal(doc.sections[2].label, "5:30 · Your Next Move");
});

test("a script with no headings renders as one readable block", () => {
  const doc = LIB.longFormDoc("Just spoken words.\n\nSecond paragraph.");
  assert.equal(doc.sections.length, 0);
  assert.match(doc.body, /Just spoken words/);
});

test("an unterminated bracket is not mistaken for a section label", () => {
  const doc = LIB.longFormDoc("[this is not a section\nthe script continues\n[0:00 Real Label]:\nbody");
  assert.equal(doc.sections.length, 1);
  assert.equal(doc.sections[0].label, "0:00 Real Label");
});

test("sectionAt maps a cursor offset to the section being typed in", () => {
  const text = "[A]:\nalpha body\n[B]:\nbravo body";
  const doc = LIB.longFormDoc(text);
  assert.equal(LIB.sectionAt(doc, text.indexOf("alpha")), 0);
  assert.equal(LIB.sectionAt(doc, text.indexOf("bravo")), 1);
  assert.equal(LIB.sectionAt(doc, text.length + 50), 1, "past the end clamps to the last section");
});

test("empty or missing content never crashes the parser", () => {
  assert.equal(LIB.hasSections(LIB.longFormDoc("")), false);
  assert.equal(LIB.hasSections(LIB.longFormDoc(null)), false);
  assert.equal(LIB.longFormDoc(undefined).words, 0);
  assert.equal(LIB.sectionAt(LIB.longFormDoc(""), 0), -1);
});

/* ---------- 2. BEHAVIOUR: run the real view in a fake browser ---------- */

function fakeBrowser(extra) {
  const styles = [];
  const sandbox = Object.assign({
    document: {
      readyState: "complete",
      head: { appendChild: (n) => styles.push(n) },
      getElementById: (id) => (id === "cp-doc-styles" ? styles[0] : null),
      createElement: () => ({ id: "", textContent: "" }),
      addEventListener: () => {}
    },
    console: { warn: () => {} },
    setTimeout,
    module: undefined,
    // The app's own renderer, standing in for core.js.
    renderOut: function () { return "ORIGINAL-CARD"; },
    setOutputContent: function () {},
    toggleOutputEdit: function () {},
    saveOut: function () {}
  }, extra || {});
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);

  // Load order must mirror index.html: the rules, then the view.
  vm.runInContext(read("public/lib/longFormDoc.js"), ctx);
  vm.runInContext("var S = { outputEditing: {} };", ctx);
  vm.runInContext(VIEW_JS, ctx);

  return { ctx, styles };
}

test("BEHAVIOUR: a long-form output renders the document, not the app's card", () => {
  const { ctx } = fakeBrowser();
  const html = ctx.renderOut({ label: "YouTube · Long-Form Video Script", content: "0:00 - Hook\n" + LONG_WORDS }, "t1", 0);

  assert.match(html, /cp-doc-card/, "the document layout must be rendered");
  assert.match(html, /cp-doc-sheet/, "the sheet must exist");
  assert.match(html, /cp-doc-h/, "section headings must be rendered");
  assert.doesNotMatch(html, /ORIGINAL-CARD/, "the narrow card must NOT be used");
});

test("BEHAVIOUR: a long unlabelled output still renders the document", () => {
  // Length alone must be enough. Without this case, a view that only looked at
  // the label would pass every other test here while silently leaving a
  // 1,000-word unlabelled script in the narrow card — the exact thing spec 8.3
  // says to avoid. (Found by deliberately mutating the view.)
  const { ctx } = fakeBrowser();
  const html = ctx.renderOut({ label: "", content: LONG_WORDS }, "t10", 0);
  assert.match(html, /cp-doc-card/, "long content with no label must still get the document layout");
  assert.doesNotMatch(html, /ORIGINAL-CARD/);
});

test("BEHAVIOUR: short content is left entirely to the app's own card", () => {
  const { ctx } = fakeBrowser();
  assert.equal(ctx.renderOut({ label: "X · Hot Take", content: "Agree?" }, "t2", 0), "ORIGINAL-CARD");
  const long = Array.from({ length: 400 }, (_, i) => "w" + i).join(" ");
  assert.equal(ctx.renderOut({ label: "TikTok · Script", content: long }, "t3", 0), "ORIGINAL-CARD",
    "a long TikTok script must not switch layout by length alone");
});

test("BEHAVIOUR: a malformed output falls back to the card instead of throwing", () => {
  const { ctx } = fakeBrowser();
  assert.equal(ctx.renderOut(null, "t4", 0), "ORIGINAL-CARD");
  assert.equal(ctx.renderOut({ label: {}, content: null }, "t5", 0), "ORIGINAL-CARD");
  assert.equal(ctx.renderOut(undefined, "t6", 0), "ORIGINAL-CARD");
});

test("BEHAVIOUR: the document escapes user text, so a script cannot inject HTML", () => {
  const { ctx } = fakeBrowser();
  const html = ctx.renderOut(
    { label: "Long-Form", content: '0:00 - Hook\n<img src=x onerror="alert(1)"> ' + LONG_WORDS }, "t7", 0);
  assert.ok(!/<img/i.test(html), "raw HTML in a generated script must never reach the page");
  assert.match(html, /&lt;img/, "it must appear escaped instead");
});

test("BEHAVIOUR: the story id is quoted inside the jump handler", () => {
  // A real bug found only in Chromium: cpDocJump(t-lf,0,0) is evaluated as
  // t MINUS lf and throws "t is not defined", so every pill button was dead.
  const { ctx } = fakeBrowser();
  const html = ctx.renderOut({ label: "Long-Form", content: "0:00 - Hook\nbody here" }, "t-lf", 0);
  assert.match(html, /cpDocJump\('t-lf',0,0\)/, "the id must be quoted");
  assert.doesNotMatch(html, /cpDocJump\(t-lf/, "an unquoted id would be evaluated as arithmetic");
});

test("BEHAVIOUR: styles are injected once, and the wrapper never nests", () => {
  const { ctx, styles } = fakeBrowser();
  assert.equal(styles.length, 1, "the stylesheet must be injected on load");
  assert.match(styles[0].textContent, /\.cp-doc-card/, "and it must be the document styles");

  const first = ctx.renderOut({ label: "Long-Form", content: "0:00 - H\nx" }, "t8", 0);
  vm.runInContext("window.cpLongFormInstalled();", ctx); // boot a second time
  assert.equal(ctx.renderOut({ label: "Long-Form", content: "0:00 - H\nx" }, "t8", 0), first);
  assert.equal((first.match(/cp-doc-card/g) || []).length, 1, "the document must render once, not twice");
});

test("BEHAVIOUR: the editor is wired to the app's own edit and save handlers", () => {
  const { ctx } = fakeBrowser();
  ctx.S.outputEditing["t9-0"] = true;
  const html = ctx.renderOut({ label: "Long-Form", content: "0:00 - H\nbody" }, "t9", 0);
  assert.match(html, /oninput="setOutputContent\('t9',0,this\.value\)"/);
  assert.match(html, /toggleOutputEdit\('t9',0\)/);
  assert.match(html, /saveOut\('t9',0\)/);
  assert.match(html, /cp-doc-editor/, "the editor must exist while editing is on");
  assert.match(html, /aria-pressed="true"/, "the button must report its state");
});

test("typing does not re-render the whole page", () => {
  // A full re-render per keystroke drops the cursor and the scroll position —
  // spec 8.3's "preserve the content as they work".
  const fn = CORE_JS.match(/window\.setOutputContent = \(tid, idx, value\) => \{[\s\S]*?\};/);
  assert.ok(fn, "setOutputContent must exist");
  assert.ok(!/render\(\)/.test(fn[0]), "typing must not call render()");
  assert.match(fn[0], /content\s*=/, "the edit must be written back to the output");
});

/* ---------- 3. the prompt contradiction ---------- */

test("the system prompt still forbids bracketed tags", () => {
  assert.match(CORE_JS, /Never label or separate sections with bracketed tags/);
  assert.match(CORE_JS, /Structure requirements:/, "the template being patched must still exist");
});

test("BEHAVIOUR: the prompt patch rewrites the long-form request, and only that", () => {
  const calls = [];
  const { ctx } = fakeBrowser({
    fetch: function (input, init) { calls.push(init && init.body); return "sent"; }
  });

  // A long-form request, built from the REAL template's shape: the marker, the
  // bracketed headings, then the closing line. The closing line matters — it is
  // what bounds the block being replaced.
  const realShape = [
    "Write a comprehensive, retention-engineered Long-Form YouTube Video Script about: X.",
    "",
    "Structure requirements:",
    "[0:00 - 0:25 THE HOOK & RETENTION STAKE]:",
    "Open immediately on the central question.",
    "",
    "[CHAPTER 1: THE BACKSTORY]:",
    "The origins.",
    "",
    "Return only the ready-to-record script formatted with timestamp chapter tags."
  ].join("\n");

  const longBody = JSON.stringify({ messages: [{ role: "user", content: realShape }] });
  assert.equal(ctx.fetch("https://api.example/chat", { body: longBody }), "sent", "the request must still be sent");
  const patched = JSON.parse(calls[0]).messages[0].content;
  assert.ok(!patched.includes("[0:00 - 0:25 THE HOOK"), "every bracketed heading must be removed, not just the marker");
  assert.ok(!patched.includes("[CHAPTER 1"), "including later chapter tags");
  assert.match(patched, /Never wrap a heading in square brackets/, "and replaced with the SYS-compliant rule");
  assert.match(patched, /Return only the ready-to-record script/, "the closing line must be preserved");

  // A tweet request must be untouched, byte for byte.
  const shortBody = JSON.stringify({ messages: [{ role: "user", content: "Write a tweet about [this]" }] });
  ctx.fetch("https://api.example/chat", { body: shortBody });
  assert.equal(calls[1], shortBody, "no other request may be modified");

  // A non-string body (an upload) must pass straight through.
  const bin = new Uint8Array([1, 2, 3]);
  ctx.fetch("https://api.example/upload", { body: bin });
  assert.ok(calls[2] instanceof Uint8Array, "binary bodies must pass through untouched");
});

test("BEHAVIOUR: the replacement prompt cannot corrupt the JSON body", () => {
  // Two real bugs were caught here while writing this feature, and both would
  // have broken long-form generation outright:
  //   1. the replacement text used raw newlines, which are illegal inside a
  //      JSON string literal -> "Bad control character in string literal";
  //   2. it also contained double quotes, which end the JSON string early.
  // The body is already JSON-encoded when the patch runs, so everything spliced
  // in must be JSON-escaped. This proves it by parsing the patched body.
  const calls = [];
  const { ctx } = fakeBrowser({ fetch: function (i, init) { calls.push(init && init.body); return "sent"; } });

  const realShape = [
    "Write a Long-Form YouTube Video Script.",
    "",
    "Structure requirements:",
    "[0:00 - 0:25 THE HOOK]:",
    "Open on the question.",
    "",
    "Return only the ready-to-record script formatted."
  ].join("\n");

  ctx.fetch("https://api.example/chat", { body: JSON.stringify({ messages: [{ role: "user", content: realShape }] }) });

  assert.doesNotThrow(() => JSON.parse(calls[0]), "the patched body must still be valid JSON");
  const content = JSON.parse(calls[0]).messages[0].content;
  assert.ok(!content.includes("[0:00 - 0:25 THE HOOK"), "and the tags must be gone from the decoded prompt");

  // The newlines that survive must be REAL prompt line breaks, not stray "\n"
  // text the model would read literally.
  assert.doesNotMatch(content, /\\n/, "no literal backslash-n may leak into the prompt text");
  assert.match(content, /\n/, "real line breaks must remain");
});

/* ---------- 4. delivery: the files actually load, and the cache moves ---------- */

test("the view is loaded by a script that runs after core.js", () => {
  // index.html cannot be edited from the API (150KB), so the view is
  // bootstrapped from create/env.js — the first script after core.js.
  const idx = read("public/index.html");
  assert.ok(idx.indexOf('src="create/env.js') > idx.indexOf('src="core.js'),
    "the bootstrap must run after core.js defines renderOut");

  assert.match(ENV_JS, /lib\/longFormDoc\.js\?v=\d+/);
  assert.match(ENV_JS, /lib\/longFormView\.js\?v=\d+/);
  assert.match(ENV_JS, /s\.async = false/, "order matters: the rules must evaluate before the view");
  assert.match(ENV_JS, /onerror/, "a missing file must be reported, not silent");
});

test("the service worker cache version moved forward", () => {
  const v = Number(SW_JS.match(/creatorpulse-v(\d+)/)[1]);
  assert.ok(v >= 23, "a returning phone must fetch the new files");
});

test("Plus AI is not touched by this change", () => {
  // Checked for real references, not the word: the app's own name has "Pulse".
  [VIEW_JS, ENV_JS].forEach((src) => {
    assert.doesNotMatch(src, /public\/plus-ai|\/plus-ai\/|openPulseAi|runCoach/);
  });
});
