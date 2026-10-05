// Regression tests for the three calendar fixes reported against PR #16.
//
// The owner's three complaints, each now pinned by a test:
//
//   1. "The Schedule post button is covered by the down button."
//      The Calendar's full-width Schedule Post button sat at the very bottom of
//      the page with no reserved space below it, and the floating chat/refresh
//      button was pinned to a hardcoded `bottom:82px` - between the 66px tab
//      bar and that button. The floating buttons no longer live in that
//      column at all, and the Schedule button reserves its own room.
//
//   2. "The schedule post you schedule on one week it will schedule every
//      other week on that day to the end of the year."
//      The sheet's weekday dropdown POSTed to /api/user-schedule, which
//      materialised 52 weekly rows. It now sends one date and the server
//      writes one row.
//
//   3. "He does not want the event details showing by default."
//      renderAgendaItem() rendered the category and the full description
//      inline, unconditionally. Details now live in .agenda-item-detail, which
//      only displays when the row carries .expanded - toggled on tap.
//
// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const CORE = fs.readFileSync(path.join(ROOT, "public", "core.js"), "utf8");
const INDEX = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
const APP = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
const SERVER = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
const PUBLIC_SERVER = fs.readFileSync(path.join(ROOT, "public", "server.js"), "utf8");
const SW = fs.readFileSync(path.join(ROOT, "public", "sw.js"), "utf8");

// ── 1. the Schedule post button can never be covered ───────────────────────

test("the Schedule Post button reserves clear space beneath itself", () => {
  assert.match(
    INDEX,
    /\.cal-schedule-btn\{[^}]*margin-bottom:\s*9[0-9]px/,
    "the Schedule Post button needs a bottom margin that clears the floating buttons"
  );
  // The old markup carried its layout in inline styles and had nothing below
  // it, which is exactly how a floating button ended up sitting on top.
  assert.match(
    CORE,
    /class="btn bo cal-schedule-btn" onclick="openScheduleSheet\(\)"/,
    "the Schedule Post button must use the .cal-schedule-btn class"
  );
  assert.doesNotMatch(
    CORE,
    /class="btn bo" style="width:100%;padding:13px;justify-content:center;margin-top:16px" onclick="openScheduleSheet\(\)"/,
    "the old uncovered inline-styled Schedule Post button must be gone"
  );
});

test("the Schedule Post button paints above every floating element", () => {
  const m = /\.cal-schedule-btn\{[^}]*z-index:\s*(\d+)/.exec(INDEX);
  assert.ok(m, ".cal-schedule-btn must declare a z-index");
  const z = Number(m[1]);
  // The tab bar is 50 and the Coach tab is 80 - the Schedule button must beat
  // both, or a scroll can still land one of them over it.
  assert.ok(z > 80, `cal-schedule-btn z-index must beat the tab bar (50) and Coach (80), got ${z}`);
  assert.ok(/::before\{content:"";position:fixed;inset:0;z-index:0/.test(INDEX),
    "the background texture must stay at z-index 0 so it cannot sit over content");
});

test("the floating feedback button is lifted above the tab bar, not into it", () => {
  // Hardcoded `bottom:82px` put it 16px above the 66px tab bar, which is the
  // gap the Schedule Post button then occupied on a short page.
  assert.doesNotMatch(APP, /bottom:82px/, "the hardcoded bottom:82px must be gone");
  assert.match(
    APP,
    /fbBtn\.style\.cssText = "[^"]*bottom:calc\(var\(--tab-h\)[^"]*env\(safe-area-inset-bottom\)/,
    "the feedback button must be anchored to the tab bar + safe area"
  );
});

test("the floating Coach tab stays out of the Calendar's button column", () => {
  // It used to sit at bottom:tab-h + 24px, directly on top of the Schedule
  // Post button. It is a wide-screen affordance only now.
  assert.match(INDEX, /@media\(min-width:900px\)\{\.fab-coach\{display:none\}\}/,
    "the Coach tab must be hidden on wide screens, where the Schedule button already has room");
});

// ── 2. one scheduled post = one date, with no 52-week expansion ────────────

test("the server writes ONE row for one scheduled post, not 52", () => {
  for (const src of [SERVER, PUBLIC_SERVER]) {
    assert.doesNotMatch(src, /for \(let w = 0; w < 52; w\+\+\)/,
      "the 52-week materialisation loop must be gone");
    assert.doesNotMatch(src, /Materialise next 52 weeks/,
      "the recurring-schedule comment must be gone");
    assert.doesNotMatch(src, /error: "Invalid weekday"/,
      "a weekday must no longer be a hard requirement");
  }
  assert.match(SERVER, /app\.post\("\/api\/user-schedule"/, "the route must still exist");
  assert.match(SERVER, /let scheduledDate = String\(date \|\| ""\)\.slice\(0, 10\)/,
    "the route must resolve the single date it was given");
  assert.match(SERVER, /res\.json\(\{ success: true, added: 1, scheduled_date: scheduledDate \}\)/,
    "exactly one row must be reported as added");
  // Idempotent: a retry from the client outbox must not double-book the date.
  assert.match(SERVER, /\.eq\("headline", title\)\.eq\("scheduled_date", scheduledDate\)/,
    "a duplicate title+date must be deduped before insert");
});

test("the schedule sheet asks for a DATE, and no longer for a weekday", () => {
  assert.match(CORE, /<label>Date<\/label><input class="input" type="date"/,
    "the sheet must offer a date picker");
  assert.doesNotMatch(CORE, /<label>Every<\/label>/,
    "the 'Every <weekday>' control must be gone - it was the recurrence UI");
  assert.doesNotMatch(CORE, /onclick="addRecurring\(\)"/, "the recurring submit must be gone");
  assert.doesNotMatch(CORE, /window\.addRecurring\s*=/, "addRecurring itself must be gone");
  assert.match(CORE, /onclick="addScheduledPost\(\)"/, "the sheet must submit via addScheduledPost");
  assert.doesNotMatch(CORE, /Add for next 12 months/, "the 'next 12 months' button label must be gone");
  assert.match(CORE, /addSched: \{ title:"", date:"", time:"20:00", notes:"" \}/,
    "the sheet's state must hold a date, not a weekday");
});

test("addScheduledPost posts one date and cannot repeat weekly", () => {
  assert.match(CORE, /window\.addScheduledPost = async \(\) => \{/, "addScheduledPost must be defined");
  assert.match(CORE, /if\(!p\.date\)\{ toast\("Pick a date"\); return; \}/,
    "a date must be required");
  assert.match(CORE, /const payload = \{ token: S\.token, title: p\.title, date: p\.date, time: p\.time, notes: p\.notes \}/,
    "the payload must carry a single date and no weekday");
  assert.doesNotMatch(CORE, /weekday:\s*"friday"/, "the default weekday must be gone from the state");
  assert.doesNotMatch(CORE, /toast\(`Scheduled \$\{r\.added\} weeks`\)/, "the 'N weeks' toast must be gone");
  assert.match(CORE, /S\.addSched = \{ title:"", date:"", time:"20:00", notes:"" \}/,
    "the sheet must reset to an empty date after submitting");
});

test("a scheduled post is written exactly once if the request is retried", () => {
  // The client optimistically shows the item and queues a retry on failure, so
  // the route has to be safe to call twice with the same body.
  assert.match(CORE, /S\.pendingSchedule = \[\.\.\.\(S\.pendingSchedule\|\|\[\]\), \{ id:/,
    "a pending copy must be created before the network call");
  assert.match(CORE, /savePendingSchedule\(\);\s*\n\s*S\.addSched = /,
    "the pending copy must be persisted before the sheet resets");
  assert.match(CORE, /endpoint: "\/api\/user-schedule", payload, attempts: 1/,
    "a failed schedule must be queued for retry");
});

// ── 3. rows are collapsed by default and expand on tap ────────────────────

test("calendar row details are hidden until the row is tapped", () => {
  assert.match(INDEX, /\.agenda-item-detail\{display:none\}/,
    "the detail block must be hidden by default");
  assert.match(INDEX, /\.agenda-item\.expanded \.agenda-item-detail\{display:block/,
    "the detail block must only show on an expanded row");
  // The description and the row action must genuinely be inside that block -
  // not merely styled as if they were.
  const item = /function renderAgendaItem\(it\)\{[\s\S]*?\n\}/.exec(CORE);
  assert.ok(item, "renderAgendaItem must be found");
  const body = item[0];
  assert.match(body, /<div class="agenda-item-detail">[\s\S]*agenda-item-desc[\s\S]*agenda-item-actions[\s\S]*<\/div>\s*<\/div>\s*<\/div>`/,
    "the category, description and Create/Remove button must all live inside .agenda-item-detail");
});

test("a collapsed row still shows a scannable summary", () => {
  assert.match(CORE, /<div class="agenda-item-head">/,
    "each row needs a summary head");
  assert.match(CORE, /<span class="agenda-item-title">\$\{esc\(it\.title\)\}<\/span>/,
    "the title must stay visible while collapsed");
  assert.match(CORE, /<span class="agenda-item-meta">\$\{meta\}<\/span>/,
    "one quiet meta line must stay visible while collapsed");
  assert.match(INDEX, /\.agenda-item-chevron\{[^}]*margin-left:auto/,
    "a chevron must signal the row can be opened");
});

test("tapping a row toggles it, and the open/closed state is per item", () => {
  assert.match(CORE, /function agendaItemKey\(it\)\{/,
    "rows need a stable identity so an opened row survives a re-render");
  assert.match(CORE, /return it\.type === "post" \? `post:\$\{it\.id\}` : `event:\$\{it\.niche\|\|""\}\|\$\{it\.title\}`/,
    "the key must be the item's own identity, not its array index");
  assert.match(CORE, /window\.toggleAgendaItem = \(key\) => \{/,
    "toggleAgendaItem must exist");
  assert.match(CORE, /S\.agendaExpanded\[key\] = !S\.agendaExpanded\[key\]/,
    "toggling must flip that item's expanded flag");
  assert.match(CORE, /const expanded = !!S\.agendaExpanded\[itemKey\]/,
    "renderAgendaItem must read the per-item flag");
  assert.match(CORE, /agendaExpanded: \{\}/, "the expanded map must be part of state");
  // Rows must be collapsed on a fresh load, not defaulted open.
  assert.match(CORE, /const expanded = !!S\.agendaExpanded\[itemKey\];/,
    "an item absent from the map must render collapsed (undefined -> false)");
});

test("the tap target is the row, and the row's own buttons still work", () => {
  assert.match(CORE, /document\.addEventListener\("click", \(e\) => \{[\s\S]*?closest\("\.agenda-item\[data-item-key\]"\)/,
    "one delegated listener must own the tap-to-expand interaction");
  assert.match(CORE, /if\(e\.target\.closest\("\.agenda-item-actions button"\)\) return;/,
    "tapping Create/Remove must not also toggle the row");
  assert.match(CORE, /onclick="event\.stopPropagation\(\);deleteScheduleItem\('/,
    "Remove must stop the tap from bubbling into an expand");
  assert.match(CORE, /onclick='event\.stopPropagation\(\);createFromEvent\(/,
    "Create must stop the tap from bubbling into an expand");
  assert.match(CORE, /role="button" tabindex="0" aria-expanded=/,
    "rows must be reachable and announced as expandable");
});

// ── the deploy has to actually reach the browser ───────────────────────────

test("the asset version and service worker cache were bumped", () => {
  const m = /core\.js\?v=(\d+)/.exec(INDEX);
  assert.ok(m, "index.html must load core.js with a ?v= cache-bust");
  assert.ok(Number(m[1]) >= 23, `core.js cache-bust must be >= 23, got ${m[1]}`);
  assert.match(SW, /const CACHE_NAME = "creatorpulse-v5"/,
    "the service worker cache name must be bumped so old HTML is dropped");
});
