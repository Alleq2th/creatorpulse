/* CreatorPulse · Long-form scripts as documents (spec 8.3).
 *
 * Spec 8.3, verbatim:
 *   "Long-form scripts require a different experience."
 *   "The user should be able to read the script, move between sections, edit
 *    the text, and preserve the content as they work."
 *   "Avoid presenting a long script inside a narrow card surrounded by
 *    unrelated controls."
 *   "Use a more document-oriented layout where appropriate."
 *
 * This file is ONLY the text rules: what counts as long-form, and where the
 * sections are. It touches no DOM and makes no network calls, so the tests run
 * the real logic in Node instead of grepping core.js with a regex.
 *
 * Loaded two ways, exactly like lib/opportunityScore.js and
 * lib/storyToCreate.js:
 *   * Node reads it as CommonJS (module.exports below) for the tests.
 *   * index.html loads it as a classic <script>, where `module` is undefined,
 *     the guard is skipped, and window.CPLongForm becomes available.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.CPLongForm = api;
    root.longFormDoc = api.longFormDoc;
    root.longFormKind = api.longFormKind;
    root.hasSections = api.hasSections;
    root.sectionAt = api.sectionAt;
    root.shouldRenderAsDoc = api.shouldRenderAsDoc;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // A script shorter than this is not a document, whatever its label says.
  var MIN_DOC_WORDS = 250;

  // Labels that mark content as short-form even when the text is long.
  var SHORT_FORM = /shorts?\b|reel\b|tiktok|hot take|caption|tweet\b|thread|carousel|thumbnail|title/i;
  // Labels that mark long-form outright.
  var LONG_FORM = /long[\s-]?form/i;

  function words(text) {
    return String(text == null ? '' : text).trim().split(/\s+/).filter(Boolean);
  }

  /* Is this output a long-form document?
   *
   * Long-form is decided by the label first (it is what the generator wrote and
   * what the user chose), then by size. A 300-word TikTok script must stay a
   * script, so a short-form label always wins over length — otherwise the
   * editor would silently switch layout because a script got wordy. */
  function longFormKind(o) {
    if (!o) return null;
    var label = String(o.label || '');
    var content = String(o.content == null ? '' : o.content);

    if (SHORT_FORM.test(label)) return null;
    if (LONG_FORM.test(label)) return 'long-form';
    if (words(content).length >= MIN_DOC_WORDS) return 'long-form';
    return null;
  }

  /* Section label patterns.
   *
   * Two shapes are recognised, because both occur in real generated scripts:
   *   1. a bracketed tag on its own line — "[CHAPTER 1: THE BACKSTORY]:"
   *      (what every script generated before this change looks like)
   *   2. a YouTube-style chapter line — "0:00 — The Hook"
   *      (what the long-form prompt now asks for, since the system prompt
   *      forbids bracketed tags)
   *
   * The bracket pattern requires a CLOSING "]" before the end of the line, so a
   * stray "[" in prose is never mistaken for a heading. */
  var RE_BRACKET = /^\[([^\[\]\n]{1,90})\]:?\s*$/;
  var RE_CHAPTER = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[\u2013\u2014:-]?\s*(\S.{0,58})$/;

  function isSectionLine(line) {
    if (!line) return null;
    var trimmed = line.trim();
    if (!trimmed) return null;

    var b = RE_BRACKET.exec(trimmed);
    if (b) return b[1].trim();

    var c = RE_CHAPTER.exec(trimmed);
    // A chapter line is a heading, not a sentence: it must not end mid-clause.
    if (c && !/[.,;]$/.test(trimmed)) return (c[1] + ' \u00b7 ' + c[2]).trim();

    return null;
  }

  /* Split a script into a readable document.
   *
   * Returns:
   *   body     — everything before the first section label (usually empty)
   *   sections — [{ label, body, start, end, index }]
   *
   * `start`/`end` are character offsets into the ORIGINAL text, so the editor
   * can map a cursor position back to the section being typed in.
   *
   * With no labels at all, `sections` is empty and the whole text is `body`.
   * That is the normal case for a short script, and the renderer then shows one
   * flowing block rather than inventing structure the text does not have. */
  function longFormDoc(text) {
    var src = String(text == null ? '' : text);
    var lines = src.split('\n');
    var sections = [];
    var bodyLines = [];
    var offset = 0;
    var current = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var label = isSectionLine(line);

      if (label) {
        if (current) {
          current.body = current.body.replace(/\s+$/, '');
          current.end = offset;
        }
        current = { label: label, body: '', start: offset, end: src.length, index: sections.length };
        sections.push(current);
      } else if (current) {
        current.body += (current.body ? '\n' : '') + line;
      } else {
        bodyLines.push(line);
      }

      offset += line.length + 1; // + the '\n' that split removed
    }

    if (current) {
      current.body = current.body.replace(/\s+$/, '');
      current.end = src.length;
    }

    // Drop heading-only sections that carry no text, but keep the numbering
    // contiguous so sectionAt() and the jump list stay in agreement.
    var kept = sections.filter(function (s) { return s.body.trim() !== ''; });
    kept.forEach(function (s, idx) { s.index = idx; });

    return {
      body: bodyLines.join('\n').replace(/^\s+|\s+$/g, ''),
      sections: kept,
      text: src,
      words: words(src).length
    };
  }

  function hasSections(doc) {
    return !!(doc && doc.sections && doc.sections.length);
  }

  /* Which section does a cursor at `offset` sit in?
   * Used to keep the "You are here" line in step while the user types. */
  function sectionAt(doc, offset) {
    if (!hasSections(doc)) return -1;
    var pos = Number(offset);
    if (!isFinite(pos) || pos < 0) return 0;
    var list = doc.sections;
    for (var i = 0; i < list.length; i++) {
      if (pos >= list[i].start && pos < list[i].end) return i;
    }
    return list.length - 1;
  }

  /* The single decision core.js asks, so the renderer never re-implements it.
   * Kept as its own named function (rather than an inline ===) so the tests can
   * call the REAL dispatch rule instead of matching a string in core.js. */
  function shouldRenderAsDoc(o) {
    return longFormKind(o) === 'long-form';
  }

  return {
    longFormDoc: longFormDoc,
    longFormKind: longFormKind,
    shouldRenderAsDoc: shouldRenderAsDoc,
    hasSections: hasSections,
    sectionAt: sectionAt,
    MIN_DOC_WORDS: MIN_DOC_WORDS
  };
});
