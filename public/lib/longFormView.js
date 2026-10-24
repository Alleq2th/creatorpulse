/* CreatorPulse - long-form scripts as documents (spec 8.3).
 *
 * WHAT THE SPEC ASKS FOR (8.3, verbatim)
 * -------------------------------------
 *   "Long-form scripts require a different experience."
 *   "The user should be able to read the script, move between sections, edit
 *    the text, and preserve the content as they work."
 *   "Avoid presenting a long script inside a narrow card surrounded by
 *    unrelated controls."
 *   "Use a more document-oriented layout where appropriate."
 *   "Keep secondary actions accessible without allowing them to overwhelm the
 *    writing experience."
 *
 * WHAT WAS WRONG
 * --------------
 * Every output - a one-line tweet or a 1,200-word YouTube script - came back
 * through the same narrow card, with the script flattened into a single
 * <textarea>. A long script was unreadable, had no visible sections, and there
 * was no way to move through it. That is exactly the "narrow card" the spec
 * says to avoid, and it is the "plain text area" gap.
 *
 * There was a second, quieter contradiction: the app's global system prompt
 * says "Never label or separate sections with bracketed tags like [HOOK] or
 * [CTA]", while the long-form prompt template was still asking the model for
 * "[0:00 - 0:25 THE HOOK & RETENTION STAKE]:". The model was told two opposite
 * things, and the output the user then had to edit arrived full of the very
 * tags the app forbids. That template lived in core.js and is fixed here by
 * rewriting the prompt at request time - see promptPatch below.
 *
 * HOW IT ATTACHES WITHOUT TOUCHING core.js
 * ----------------------------------------
 * core.js defines renderOut(o, tid, idx) as a top-level function, so it is a
 * property of window. This file wraps it: when the original is about to render
 * a long-form output, the wrapper renders the document layout instead. Nothing
 * in core.js changes, which is why Plus AI, the freeze fix, the countdown and
 * the Create flow cannot be affected by this file.
 *
 * The text rules live in lib/longFormDoc.js (pure, unit-tested). This file is
 * only the picture plus the attachment, and it is loaded after core.js.
 */
(function () {
  "use strict";

  // Spec 8.3: the long-form prompt must not ask for the tags SYS forbids.
  // Matched on the template's distinctive first sentence so a future reword of
  // the body does not silently disable the fix.
  var OLD_PROMPT = "Structure requirements:";
  var NEW_PROMPT =
    "The script is read as a document and edited section by section, so give it " +
    "real chapters. Put each chapter heading on its own line as a timestamp " +
    "followed by a dash and a short title, for example \"0:00 - The Hook\". Never " +
    "wrap a heading in square brackets or any other tag, and never write a bare " +
    "label like \"HOOK:\" - a heading is the only line that starts with a " +
    "timestamp; everything else is spoken words.";

  /* The chat request builder lives in core.js and is not exported, so the
   * prompt is corrected at the transport instead: one fetch wrapper that
   * rewrites the long-form template on its way out. This is deliberately the
   * narrowest possible touch - it changes one string in one request body and
   * leaves every other request byte-identical. */
  function installPromptPatch() {
    if (typeof window === "undefined" || window.__cpPromptPatched) return;
    var nativeFetch = window.fetch;
    if (typeof nativeFetch !== "function") return;

    window.fetch = function (input, init) {
      try {
        var body = init && init.body;
        if (typeof body === "string" && body.indexOf("Long-Form YouTube Video Script") > -1 &&
            body.indexOf(OLD_PROMPT) > -1) {
          init = Object.assign({}, init, {
            body: body.replace(OLD_PROMPT, NEW_PROMPT + "\n\nCover these chapters in this order:")
          });
        }
      } catch (e) { /* never break a request because of this file */ }
      return nativeFetch.call(this, input, init);
    };
    window.__cpPromptPatched = true;
  }

  function escLight(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* core.js declares its state with a top-level `const S`, so it lives in the
   * global LEXICAL scope: a later classic script can read it as a bare name, but
   * `window.S` is undefined. `typeof` never throws for an undeclared name, so
   * this one guarded read is what keeps the file safe on the very first paint
   * (and in Node, where there is no S at all). */
  function appState() {
    return typeof S !== "undefined" ? S : null;
  }

  /* The document itself.
   *
   * The sheet is one wide column at a comfortable reading measure, with real
   * headings - so "move between sections" and "read the script" are both
   * possible on a phone. The actions are split: Save stays primary at the
   * bottom, everything else sits in a quiet toolbar - spec 8.3: "Keep secondary
   * actions accessible without allowing them to overwhelm the writing
   * experience."
   */
  function renderDocScript(o, tid, idx, content) {
    var LF = window.CPLongForm;
    var doc = LF.longFormDoc(content);
    var state = appState();
    var editing = !!(state && state.outputEditing && state.outputEditing[tid + "-" + idx]);
    var words = doc.words;
    var secs = Math.round((words / 140) * 60);
    var reading = secs >= 60 ? Math.floor(secs / 60) + " min " + (secs % 60) + "s read" : secs + "s read";

    // Jump list: read-only, so it cannot disturb an edit in progress.
    var toc = doc.sections.length
      ? '<nav class="cp-doc-toc" aria-label="Sections"><span class="cp-doc-toc-l">' +
        doc.sections.length + (doc.sections.length === 1 ? " section" : " sections") + "</span>" +
        doc.sections.map(function (s, si) {
          return '<button class="cp-doc-toc-b" type="button" onclick="cpDocJump(\'' + escLight(tid) +
            "'," + idx + "," + si + ')">' + escLight(s.label) + "</button>";
        }).join("") + "</nav>"
      : "";

    var body;
    if (editing) {
      body = '<textarea class="cp-doc-editor" aria-label="Edit script" ' +
        'oninput="setOutputContent(\'' + escLight(tid) + "'," + idx + ',this.value)">' +
        escLight(content) + "</textarea>";
    } else if (doc.sections.length) {
      body = doc.sections.map(function (s, si) {
        return '<section class="cp-doc-section" data-sec="' + si + '">' +
          '<h3 class="cp-doc-h">' + escLight(s.label) + "</h3>" +
          '<div class="cp-doc-p">' + escLight(s.body) + "</div></section>";
      }).join("");
    } else {
      body = '<div class="cp-doc-section"><div class="cp-doc-p">' +
        escLight(doc.body || content) + "</div></div>";
    }

    var editLabel = editing ? "Done" : "Edit";

    return '<div class="oc cp-doc-card">' +
      '<div class="cp-doc-top">' +
        '<div class="cp-doc-meta">' +
          '<span class="ol">' + escLight(o.label || "Long-form script") + "</span>" +
          '<span class="cp-doc-stat">' + words + " words \u00b7 " + reading + "</span>" +
        "</div>" +
        '<div class="cp-doc-tools">' +
          '<button class="btn bo bxs" type="button" aria-pressed="' + editing +
            '" onclick="toggleOutputEdit(\'' + escLight(tid) + "'," + idx + ')">' + editLabel + "</button>" +
        "</div>" +
      "</div>" +
      toc +
      '<div class="cp-doc-sheet" id="cp-doc-' + escLight(tid) + "-" + idx + '">' + body + "</div>" +
      '<div class="cp-doc-foot">' +
        '<button class="btn bp bxs" type="button" onclick="saveOut(\'' + escLight(tid) + "'," + idx + ')">Save</button>' +
      "</div>" +
    "</div>";
  }

  // Scroll the sheet to a section. Touches no state, so it is safe while editing.
  window.cpDocJump = function (tid, idx, si) {
    var sheet = document.getElementById("cp-doc-" + tid + "-" + idx);
    var target = sheet && sheet.querySelector('[data-sec="' + si + '"]');
    if (target && target.scrollIntoView) target.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  /* Attach: wrap the app's own renderer rather than replace it.
   * If anything about the app's shape is unexpected, the wrapper stands aside
   * and the original renders - a broken guess must never blank the app. */
  function install() {
    if (typeof window === "undefined" || typeof window.renderOut !== "function") return false;
    if (window.renderOut.__cpDocWrapped) return true;

    var original = window.renderOut;
    var wrapped = function (o, tid, idx) {
      try {
        if (window.CPLongForm && o && window.CPLongForm.shouldRenderAsDoc(o)) {
          return renderDocScript(o, tid, idx, String(o.content == null ? "" : o.content));
        }
      } catch (e) {
        if (window.console && console.warn) console.warn("[longform] falling back to the card:", e && e.message);
      }
      return original.apply(this, arguments);
    };
    wrapped.__cpDocWrapped = true;
    window.renderOut = wrapped;
    return true;
  }

  /* Styles are injected from here rather than added to index.html, so this
   * feature is one self-contained unit: delete this file and its <script> tag
   * and the app is exactly as it was. */
  var CSS = [
    ".cp-doc-card{background:transparent;border:0}",
    ".cp-doc-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:var(--sf);border:1px solid var(--br);border-radius:10px 10px 0 0}",
    ".cp-doc-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}",
    ".cp-doc-stat{font-size:11px;font-weight:600;color:var(--mu);white-space:nowrap}",
    ".cp-doc-tools{display:flex;gap:6px;align-items:center;flex:0 0 auto}",
    ".cp-doc-toc{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:var(--sf);border-left:1px solid var(--br);border-right:1px solid var(--br);scrollbar-width:none}",
    ".cp-doc-toc::-webkit-scrollbar{display:none}",
    ".cp-doc-toc-l{flex:0 0 auto;align-self:center;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);padding-right:2px}",
    ".cp-doc-toc-b{flex:0 0 auto;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 11.5px var(--sans);color:var(--mu2);background:var(--sf2);border:1px solid var(--br);border-radius:999px;padding:6px 10px;cursor:pointer}",
    ".cp-doc-toc-b:active{background:var(--ac);color:#fff}",
    ".cp-doc-sheet{background:var(--sf);border:1px solid var(--br);border-top:0;border-radius:0 0 10px 10px;padding:18px 16px 22px}",
    ".cp-doc-section+.cp-doc-section{margin-top:22px;padding-top:20px;border-top:1px solid var(--br)}",
    ".cp-doc-h{font:800 12.5px/1.35 var(--sans);letter-spacing:.03em;text-transform:uppercase;color:var(--ac);margin:0 0 8px}",
    ".cp-doc-p{font:400 15.5px/1.85 var(--sans);color:var(--tx);white-space:pre-wrap;overflow-wrap:anywhere}",
    ".cp-doc-editor{display:block;width:100%;min-height:60vh;resize:vertical;padding:0;border:0;outline:none;background:transparent;color:var(--tx);font:400 15.5px/1.85 var(--sans);white-space:pre-wrap}",
    ".cp-doc-editor:focus-visible{box-shadow:inset 0 0 0 2px var(--ac);border-radius:4px}",
    ".cp-doc-foot{display:flex;align-items:center;gap:8px;padding:12px 2px 4px}",
    "@media(min-width:700px){.cp-doc-p,.cp-doc-editor{font-size:17px;line-height:1.9;max-width:72ch}}"
  ].join("\n");

  function injectStyles() {
    if (typeof document === "undefined" || document.getElementById("cp-doc-styles")) return;
    var st = document.createElement("style");
    st.id = "cp-doc-styles";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // core.js is a plain script loaded before this one, so renderOut exists by
  // now. Retry once on DOMContentLoaded for the case where it did not.
  function boot() {
    injectStyles();
    installPromptPatch();
    if (!install() && typeof document !== "undefined") {
      document.addEventListener("DOMContentLoaded", install, { once: true });
    }
  }

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // Exposed for the tests and for a future caller that wants the markup direct.
  window.cpRenderDocScript = renderDocScript;
  window.cpLongFormInstalled = install;
})();
