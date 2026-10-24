#!/usr/bin/env node
/* Deliberate-break harness: proves the spec 8.3 tests fail when the code
 * regresses. Each mutation is applied to the original file, tested, then the
 * original is restored from a saved in-memory copy and checksummed, so the
 * working tree is unchanged afterwards.
 *
 * Matches on test names AND assertion messages: a test that fails with the
 * intended message is proof the RIGHT assertion fired, which is stronger than
 * "some test went red".
 *
 *   node scripts/prove-longform-regressions.js
 *
 * Exit code 0 means every break was caught. A SETUP-ERROR means an anchor no
 * longer matches the code — the mutation never ran, so it proves nothing even
 * though nothing went red. Keep the anchors honest.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VIEW = path.join(ROOT, 'public', 'lib', 'longFormView.js');
const LIB = path.join(ROOT, 'public', 'lib', 'longFormDoc.js');
const ENV = path.join(ROOT, 'public', 'create', 'env.js');

const mutations = [
  {
    name: 'long-form falls back to the narrow card (delegation removed)',
    file: VIEW,
    from: 'if (window.CPLongForm && o && window.CPLongForm.shouldRenderAsDoc(o)) {',
    to: 'if (false && window.CPLongForm && o && window.CPLongForm.shouldRenderAsDoc(o)) {',
    expect: 'the document layout must be rendered'
  },
  {
    name: 'the view re-implements the decision instead of asking the shared rule',
    file: VIEW,
    from: 'if (window.CPLongForm && o && window.CPLongForm.shouldRenderAsDoc(o)) {',
    to: 'if (o && /Long-Form/.test(o.label || "")) {',
    // Re-implements the rule using only the label, so a long unlabelled script
    // stops getting the document. Caught by the unlabelled-output test.
    expect: 'long content with no label must still get the document layout'
  },
  {
    name: 'the prompt patch stops removing the bracketed headings',
    file: VIEW,
    // A bracketed heading spliced back into the replacement block: the patch
    // then "fixes" the prompt while re-injecting the very tags SYS forbids.
    from: "for watching'. Keep the energy high",
    to: "for watching'. [0:00 - 0:25 THE HOOK]: Keep the energy high",
    expect: 'every bracketed heading must be removed'
  },
  {
    name: 'the prompt patch splices raw newlines straight into the JSON body',
    file: VIEW,
    from: '.replace(/\\n/g, "\\\\n")',
    to: '.replace(/\\n/g, "\n")',
    expect: 'the patched body must still be valid JSON'
  },
  {
    name: 'a generated script could inject HTML into the page',
    file: VIEW,
    from: 'escLight(s.body)',
    to: 's.body',
    expect: 'raw HTML in a generated script must never reach the page'
  },
  {
    name: 'the section jump handler stops scrolling',
    file: VIEW,
    from: 'if (target && target.scrollIntoView)',
    to: 'if (false && target && target.scrollIntoView)',
    expect: 'tapping a pill must scroll to that section'
  },
  {
    name: 'a long unlabelled script is silently downgraded to text length only',
    file: LIB,
    from: "if (words(content).length >= MIN_DOC_WORDS) return 'long-form';",
    to: "if (false && words(content).length >= MIN_DOC_WORDS) return 'long-form';",
    expect: '300 words is a document'
  },
  {
    name: 'the parser drops sections, so the jump list disappears',
    file: LIB,
    from: 'var b = RE_BRACKET.exec(trimmed);',
    to: 'var b = null;',
    expect: 'bracketed section tags are parsed into real sections'
  },
  {
    name: 'the bootstrap loads the view before the rules it depends on',
    file: ENV,
    from: 's.async = false;',
    to: 's.async = true;',
    expect: 'order matters'
  }
];

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function runTests() {
  try {
    return execSync('node --test test/longFormScript.test.js 2>&1', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

let caught = 0;
let missed = 0;

for (const m of mutations) {
  const original = fs.readFileSync(m.file);
  const before = sha(m.file);
  const src = original.toString('utf8');

  if (!src.includes(m.from)) {
    console.log(`SETUP-ERROR  ${m.name}\n             anchor not found — mutation never applied`);
    missed++;
    continue;
  }

  fs.writeFileSync(m.file, src.replace(m.from, m.to));

  let out = '';
  try { out = runTests(); } finally { fs.writeFileSync(m.file, original); }

  const restored = sha(m.file) === before;
  const failCount = Number((out.match(/^# fail (\d+)/m) || [])[1] || 0);
  const failedNames = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((x) => x[1]);
  const ok = failCount > 0 && out.includes(m.expect);

  if (ok) {
    caught++;
    console.log(`CAUGHT       ${m.name}`);
    console.log(`             ${failCount} failed: ${failedNames.slice(0, 2).join(' | ')}`);
  } else {
    missed++;
    console.log(`MISSED       ${m.name}`);
    console.log(`             ${failCount} failed: ${failedNames.slice(0, 3).join(' | ') || '(none)'}`);
  }
  console.log(`             restored byte-identical: ${restored}`);
}

console.log(`\n${caught}/${mutations.length} deliberate breaks caught.`);
process.exit(missed === 0 ? 0 : 1);
