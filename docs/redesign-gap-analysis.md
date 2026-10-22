# CreatorPulse — spec gap analysis

Compared: the 1,952-line redesign brief (Parts 1–22) against `main` at `8f62b46`,
which already contains merged redesign PRs #31–#38.

**Verdict: the redesign the brief describes is already largely shipped.** This
run audited it against the brief, found one genuine spec violation, fixed it,
and verified every screen in a real browser.

---

## What already matches the brief

| Brief | Evidence in the code |
|---|---|
| §2.2 Brand identity retained — dark surfaces, purple accent, gold secondary | `--ac`, `--or`, `--bg`/`--sf`/`--sf2` token set; light + dark themes |
| §2.3 One disciplined type system | `--type-display/title/section/body/support/label` tokens all on `--sans` |
| §2.4 Spacing scale | `--space-1..5` (4/8/12/16/24px) |
| §16.1 Design tokens | Colours, radii (`--r`, `--rs`, `--r-control`), shadows, `--focus-ring` |
| §16.4 Interaction states | `:focus-visible` ring on every control, `aria-current`, `aria-pressed` |
| §14 Bottom nav retained, Create prominent | `.tabbar` with Home/Hooks/Create/Calendar/Profile |
| §4.1 Welcome panel reduced | Hero is compact; story counts shown as pills, not a giant panel |
| §4.2–4.4 Story hierarchy | Headline → niche badge → tier dot → velocity pill → one primary action |
| §4.5 Digest scannable + dismissable | Horizontal `.digest-strip`, `dismissDigest()` |
| §5.1–5.2 Story detail grouping | Suggested window, "Why this matters", best platform, opportunity bar |
| §7.2 Contextual rails (Platform — value — Change) | `hRail()` renders collapsed summary rows with "Change ▾" |
| §7.3 No truncated labels / no horizontal-scroll default | Rails collapse to a value; chips are wide cards |
| §7.4 Action hierarchy | Generate is `.action-btn.primary`; Remix/Titles/Blueprint/Save secondary |
| §8.5 Platform change adapts formats | Verified: twitter → Hot Take / Engagement / Thread; youtube → Long Form / Short / Title+Desc / Thumbnail |
| §10.1–10.2 Hook cards match the brief's exact structure | Kicker `NICHE · HOOK 01`, full-width text, actions **below** |
| §10.4 Search preserved | `.hook-search` filters within the selected niche |
| §11 Calendar keeps Agenda/Week/Month | `cal-view-switch` + `S.calView` |
| §12 Profile hierarchy | Identity → Niches → Platforms (Primary/Active/Inactive) → Activity |
| §13 Pulse AI distinct, doesn't obstruct | Floating coach hidden on Create; `public/plus-ai/` 6-file split |
| §17.2 All existing features preserved | Generate, Remix, Titles, Blueprint, Save, Hooks, Calendar, Profile, Pulse AI all present |
| §17.3 No hardcoded mock data | 342 tests include guards against this; screens render live feeds |

## The one real spec violation found — and fixed

**§5.3, quoted:** *"Never leave a loading label visible indefinitely because a
request failed silently."* and *"Do not fabricate a posting time."*

The "Suggested window" label rendered as `calculating…` and was written **only**
by a 30-second `setInterval`. Any newly expanded story card therefore sat on
`calculating…` for up to 30 seconds — the exact "page looks broken" state the
brief forbids. Measured in Chromium at 390×844.

**Fix** (`public/core.js`):
- Extracted `paintCountdowns()` from the interval body.
- `startGlobalTimer()` now paints **once, immediately**, before starting the interval.
- `render()` calls `paintCountdowns()` in the same frame as it replaces the markup,
  so expanding a card resolves instantly.
- When no usable timestamp exists the label now says `No window estimate`
  rather than showing a spinner-like word forever.
- Sub-hour windows read `45m left` instead of `0h 45m left`.

**Verified:** label 120 ms after a real tap = `11h 21m left` (was `calculating…`).

## Decision flagged, not changed

**The `Create` tab is a video Studio, not the brief's format picker.**

`pageCreate` → `svStartView` offers: *Start with a story* / *Record a video* /
*Upload a video* / *Continue editing*. The brief's §6 guided flow
(source → platform → format → generate → refine → save) lives in the **Home
story cards** instead, which is what PR #37 (`Redesign discovery and Create
entry experience`) chose.

I kept it, because:
1. The user's instruction was to preserve what is live and working.
2. §6.1 explicitly says *"Do not force every content format into the same
   graphic editor"* — and the current split honours that, since text formats
   render text editors and only graphic formats show palette/theme/typography rails.
3. "Start with a story" is a real, working route into that flow.

**This is the one place the product does not match the brief literally.** If you
want the Create tab to be the format picker instead, that is a follow-up, not a bug.

## Remaining known gaps

- §5.3 request-failure path: the label no longer sticks, but there is no explicit
  "couldn't estimate" retry affordance — it degrades to "No window estimate".
- §19 Phase 8 full end-to-end (Home → Story → Create → Generate → **Edit** → **Save**)
  was verified screen-by-screen and for platform/format adaptation, but generation
  and saving need a live Groq + Supabase backend, which the local sandbox does not
  have (`integrations.groq:false`, `supabase:false`). Those paths are covered by
  the 342 passing tests rather than by a live click-through.

## Verification performed this run

- `node --test test/*.test.js` → **342 pass, 0 fail** (4 new countdown tests;
  proven to fail 3/4 against the old `core.js`).
- Local server booted clean; `/` → **200**, `/api/health` → **200**.
- Chromium 390×844: Home, Hooks, Create, Calendar, Profile all render with live
  data, **zero uncaught exceptions**, each still responsive after navigation.
- Platform-switch matrix verified for instagram → twitter → youtube.
