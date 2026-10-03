# CreatorPulse — Complete Handoff to Claude

> **Read this first.** This document is the full history and current state of work done on
> `Alleq2th/creatorpulse`. It is written so that an AI assistant with no prior context can pick
> the project up cold. Everything here was verified against the real repository, not recalled.

**Owner:** Allen Greg (`Alleq2th`) — self-taught, no formal coding training. Explain changes in
plain language, avoid unexplained jargon, and keep chat replies short and scannable.
**Repo:** https://github.com/Alleq2th/creatorpulse
**Last updated:** 2026-10-03

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Stack and runtime](#2-stack-and-runtime)
3. [File map — what lives where](#3-file-map--what-lives-where)
4. [How the app is wired (routing, tabs, state)](#4-how-the-app-is-wired)
5. [API endpoints](#5-api-endpoints)
6. [How the Create Studio is wired](#6-how-the-create-studio-is-wired)
7. [Chronology of all work](#7-chronology-of-all-work)
8. [Every bug found, with root cause](#8-every-bug-found-with-root-cause)
9. [THE CURRENT BREAKAGE — the index/core redesign](#9-the-current-breakage--the-indexcore-redesign)
10. [Current state: works / unverified / outstanding](#10-current-state)
11. [Test situation](#11-test-situation)
12. [Pull requests](#12-pull-requests)
13. [Conventions and what not to break](#13-conventions-and-what-not-to-break)

---

## 1. What this project is

**CreatorPulse** is a Progressive Web App ("PWA" — a website that can be installed on a phone and
works offline) for content creators. It does four things:

1. **News & trends** — pulls RSS/news feeds filtered to the creator's chosen niches, and turns a
   story into a script, hooks, titles and a thumbnail/carousel.
2. **Content calendar** — plans posts, tracks niche events (Halloween, Black Friday…), optionally
   syncs to Google Calendar.
3. **Create Studio** — the record-and-edit tool. Talk to camera with your script on a teleprompter,
   then trim, caption, filter and export a video. CapCut/Instagram-Reels style.
4. **Profile & scheduling** — saved posts, push notifications, recurring posting schedule.

The Studio is the part the owner cares most about, and the part with the most history.

---

## 2. Stack and runtime

| Layer | Technology |
|---|---|
| Server | Node.js + Express 4 |
| Database / auth | Supabase (`@supabase/supabase-js`) |
| Frontend | Vanilla JavaScript SPA — no React, no build step |
| Video export | `ffmpeg.wasm`, **vendored locally** under `public/vendor/ffmpeg/` |
| Speech-to-text (captions) | Groq `whisper-large-v3` via server route `/api/transcribe` |
| Push notifications | `web-push` + VAPID keys |
| Images | `sharp` |
| Hosting | Render (`render.yaml` present; service name `creatorpulse`) |
| Tests | Node's built-in runner — `node --test test/` |

**No build step.** The browser loads `.js` files directly via `<script src>` tags. That matters:
there is no bundler to catch a missing file — a wrong path is a silent 404 at runtime.

**Node version:** `>=18` declared; CI and production both use Node 20.

---

## 3. File map — what lives where

```
server.js                     Express entry point. All API routes, CSP headers, static serving.
public/index.html             The SPA shell + the app's main inline <style>. ~1490 lines.
public/core.js                State (S), render(), router, and EVERY page except the Studio.
public/app.js                 Boot, auth, push, misc UI wiring.
public/studio.js              The Create Studio: camera, recording, editor, export. ~3300 lines.
public/lib/studioModel.js     PURE timeline maths (sm* helpers). No DOM. Unit-testable.
public/lib/studioPerf.js      PURE perf/capture maths (sp* helpers). No DOM. Unit-testable.
public/lib/authRedirect.js    Parses Supabase password-recovery links out of the URL.
public/studio.css             All .sv-* styles for the Studio. MUST be linked in index.html.
public/sw.js                  Service worker (network-first, offline fallback).
public/manifest.json          PWA manifest.
public/vendor/ffmpeg/         Vendored ffmpeg.wasm engine (5 files, must all be present).
config/supabase.js            One shared Supabase client.
config/feeds.js               RSS feed catalogue.
routes/cards.js               Card/news routes.
routes/digest.js              Daily digest route.
routes/image.js               Image generation route.
routes/push.js                Web-push subscribe/send.
routes/stockphoto.js          Stock photo search.
routes/uniqueness.js          Duplicate-content check.
services/imageGen.js          Pollinations/HF image generation.
services/statCard.js          Stat-card rendering.
services/stockPhoto.js        Unsplash/Pexels wrappers.
test/*.test.js                The whole test suite (11 files).
scripts/vendor-ffmpeg.sh      Regenerates the vendored export engine.
scripts/setupFonts.js         postinstall font copy.
```

> ⚠️ **`public/server.js` is a stray duplicate** of the root `server.js` (different contents,
> 161 KB vs 203 KB). It was uploaded by mistake during the redesign and is **served publicly as a
> static asset** because it sits inside `public/`. It is dead code — nothing requires it. It
> should be deleted, but nothing depends on it either way.

---

## 4. How the app is wired

### Tabs
The app has 5 tabs: `home`, `hooks`, `create`, `calendar`, `profile` (plus `library`, `discover`).
The switch lives in `core.js`:

```js
window.setTab = t => {
  S.tab = t; render();
  if(t==='calendar'){ loadSchedule(); loadCalendarEvents(); loadAgendaSchedule(); }
  if(t==='profile'){ loadSaved(); }
  if(t==='hooks'){ loadActiveHooks(); }
};
```

### State
One global object `S`, defined at the top of `core.js`. **There is no `window.S`** — `S` is a
bare `const` in module scope, reachable from page code but **not** from `page.evaluate()` in a
test harness. Harnesses must drive the real UI (`setTab`, clicking) instead.

Session persistence lives under the localStorage key **`cp_v2`**:

```js
function saveSession(){
  localStorage.setItem("cp_v2", JSON.stringify({
    token: S.token, refreshToken: S.refreshToken, user: S.user, connections: S.connections||{}
  }));
}
```

### Rendering
`render()` rebuilds the active page's HTML from template-literal functions
(`pageHome`, `pageCalendar`, `pageCreate`, …) and injects it. Then an after-render pass runs
timers, video loading and the Studio hook:

```js
// core.js — after render()
if(!S.studio || S.tab !== 'create') return;
if(S.studio.mode === 'camera'){ /* timer + teleprompter scroll loops */ }
if(S.studio.mode === 'editor'){ csApplyPreview(); }
```

### Calendar
Three views, driven by `S.calView`:

| View | Renderer | Notes |
|---|---|---|
| `agenda` | `renderAgendaView()` | Default. Groups Today / Tomorrow / Upcoming. |
| `week` | `renderWeekView()` | 7-day strip + selected-day list. `weekNav()`, `selectWeekDay()`. |
| `month` | `renderMonthView()` | Grid. Month navigation via `calNav(dir)`, uses `S.cal = {y, m}`. |

All three merge `S.schedule` with `S.pendingSchedule` (optimistically-added items not yet
confirmed by the server) through `mergeWithPending()`, so a newly-scheduled post survives a slow
or failed background refresh in all three views at once.

**Calendar CSS all lives inline in `index.html`** (26 `.cal-*` rules + 15 `.agenda-*` rules).
It does **not** depend on `studio.css`.

---

## 5. API endpoints

| Method | Path | Purpose | Needs |
|---|---|---|---|
| GET | `/api/health` | Liveness + **integration report** | nothing |
| GET | `/` | Serves `index.html` (`Cache-Control: no-cache`) | nothing |
| GET | `/api/news` | Niche news feed | feed access |
| GET | `/api/daily-digest` | Daily digest | — |
| GET | `/api/twitter-feed` | X/Twitter handles per niche | — |
| GET | `/api/blog-feed` | Blog RSS | — |
| GET | `/api/notifications` | Notification list | — |
| POST | `/api/auth/login` | Sign in | Supabase |
| POST | `/api/auth/signup` | Create account | Supabase |
| POST | `/api/auth/forgot-password` | Send reset email | Supabase |
| POST | `/api/auth/reset-password` | Complete reset | Supabase + `SUPABASE_ANON_KEY` |
| GET | `/api/schedule` | Scheduled posts for a month | Supabase |
| GET | `/api/saved-posts` | Saved posts | Supabase |
| POST | `/api/transcribe` | **Speech-to-text for captions** | `GROQ_API_KEY` |
| GET | `/api/contact` | Contact storage | Supabase |

### `/api/health` — the diagnostic dashboard

This endpoint reports whether each provider is configured, as **booleans only** (never values).
It is the owner's fastest way to find a silent misconfiguration.

```js
app.get("/api/health", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(mem.heapUsed / 1024 / 1024),
    node: process.version,
    integrations: {
      supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      groq: !!process.env.GROQ_API_KEY,
      huggingface: !!process.env.HF_API_KEY,
      newsapi: !!process.env.NEWS_API_KEY,
      newsdata: !!process.env.NEWSDATA_API_KEY,
      currents: !!process.env.CURRENTS_API_KEY,
      googleOauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI),
      webPush: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      pollinations: !!process.env.POLLINATIONS_KEY,
      unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
      pexels: !!process.env.PEXELS_API_KEY,
      adminKey: !!process.env.ADMIN_KEY,
      supabaseAnon: !!process.env.SUPABASE_ANON_KEY,
      passwordReset: !!(process.env.PASSWORD_RESET_REDIRECT || process.env.FRONTEND_URL),
    },
  });
});
```

> ⚠️ **This whole `integrations` block was deleted by the redesign** and is restored in the fix
> branch. See §9.

---

## 6. How the Create Studio is wired

### Script load order — CRITICAL

Helper modules **must** be parsed before their caller. The correct order is:

```html
<script src="/lib/authRedirect.js?v=19"></script>
<script src="/lib/studioModel.js?v=19"></script>
<script src="core.js?v=19"></script>
<script src="/lib/studioPerf.js?v=19"></script>
<script src="studio.js?v=19"></script>
<script src="app.js?v=19"></script>
```

Why this exact order:
- `studioModel.js` defines `sm*` helpers → `studio.js` calls them at render time.
- `studioPerf.js` defines `sp*` helpers → `studio.js` calls them too.
- `authRedirect.js` defines `parseAuthRedirect` → `app.js` calls it on the first line of boot.
- `core.js` before `studio.js` so the Studio can be invoked from the Create tab.

**Loading `studio.js` before its helpers leaves every `sm*`/`sp*` call undefined at runtime**, and
`node --check` still passes — it is valid JavaScript until the line executes.

### The three Studio layers

```
public/studio.css           ← how it LOOKS      (.sv-* selectors)  — must be <link>ed
public/studio.js            ← how it BEHAVES    (sv* functions)
public/lib/studioModel.js   ← the maths         (sm* pure helpers)
public/lib/studioPerf.js    ← the perf maths    (sp* pure helpers)
```

The Studio renders `.sv-root` as a **fixed, full-screen, black surface**:

```css
.sv-root { display:flex; flex-direction:column; position:fixed; inset:0; background:#000 }
```

If `studio.css` is not linked, `.sv-root` collapses to `display:block; position:static;
background:transparent` — which is exactly the "unstyled, unusable" screen seen in the
screenshots.

### Studio entry points

| Trigger | Handler |
|---|---|
| `pageCreate()` in `core.js` | renders the Create tab (the "Record it, edit it, post it." intro) |
| `data-act="newProject"` | starts the camera |
| `data-act="record"` | record / pause |
| `data-act="toEditor"` | move to the editor |
| `window.svAfterRender` | called after every `render()` to re-attach listeners |

### Camera capture ladder

`studioPerf.js` exposes a pure ladder (`spCaptureProfile`, `spPickFps`, `spFpsNote`) that reads
the camera's own advertised ceiling and picks a profile. Key lesson baked in: on a phone,
**60 fps at 720p reads as clear where 30 fps at 1080p reads as blurry and jerky**, so the top
tier asks for **frame rate, not more pixels**.

### Export

Vendored `ffmpeg.wasm` at `/vendor/ffmpeg/`. Two hard rules learned the painful way:

1. The engine must be **same-origin**. `@ffmpeg/ffmpeg` boots its core inside a Web Worker, and a
   Worker cannot be constructed from a cross-origin script. Loading from unpkg made every export
   fail with `Script at ... cannot be accessed from origin`.
2. `-map` needs **bracketed** filter labels: `-map '[vlook]'`, not `-map vlook`. A bare name is
   read as an input stream specifier → `Invalid stream specifier: vlook` → `Aborted()`.

Plus a CSP requirement: `script-src` must include `'wasm-unsafe-eval'`, and the loader must not
use `blob:` URLs.

---

## 7. Chronology of all work

### Round 0 — Password reset (PRs #2–#5)

Built the forgot-password and reset-password UI, and fixed a **critical production bug** where
`lib/authRedirect.js` sat one directory too high (`lib/` at repo root instead of `public/lib/`), so
`express.static()` 404'd it and the whole app died silently.

```diff
- <script src="/lib/authRedirect.js?v=16"></script>
+ <script src="/lib/authRedirect.js?v=16"></script>   <!-- file moved to public/lib/ -->
```

Added `test/staticAssets.test.js` and `test/boot.test.js` to catch this class of bug.

### Round 1 — The old Studio was scrapped and rebuilt from scratch (PR #6)

The owner's instruction was explicit: **throw the existing Studio away, do not patch it.** The old
`public/studio.js` was ~2,000 lines of dead-end code. It was deleted and rewritten.

What the rebuild introduced:

- **`public/lib/studioModel.js` (NEW)** — all pure timeline maths extracted so it is testable:

```js
function smClipMs(clip){ ... }        // clip duration
function smTotalMs(st){ ... }         // whole timeline duration
function smTrim(clip, startMs, endMs){ ... }   // clamped trim
function smSplitAt(st, clipId, atMs){ ... }    // split at playhead
function smRemoveClip(st, clipId){ ... }
function smInsertAfter(st, refId, clip){ ... }
function smExportPlan(st){ ... }      // inputs + filtergraph
function smCaptionAt(st, t){ ... }    // which caption shows at time t
function smRestore(st, parked){ ... } // undo of a delete
```

- **`public/studio.css` (NEW)** — replaced ~900 lines of inline Studio CSS with a real stylesheet
  built on the app's existing design tokens.
- **`public/studio.js`** — rewritten as the view layer only.
- **`scripts/vendor-ffmpeg.sh` (NEW)** — regenerates the vendored export engine.

**Bugs found and fixed in this round:**

| Bug | Root cause |
|---|---|
| Export never worked | ffmpeg loaded cross-origin from unpkg; Worker rejected |
| Export aborted after loading | `-map` given bare filter labels, not `'[vlook]'` |
| Export poisoned forever after one failure | `SVFF.loading` never reset on rejection |
| Cookie banner covered the record button | banner `z-index: 9999` > Studio `9000` |
| Deleting a clip did nothing | `svState()` returned a **new object** each call — writes went to an orphan |
| Undo couldn't restore a deleted clip | deleting revoked the object URL, destroying the media |

### Round 2 — First round of 7 phone-test fixes (PR #7)

Measured, not guessed. The isolation experiment that found the recording jank:

| variant | fps | p95 frame | janky |
|---|---|---|---|
| as shipped (1080p + blur layers) | **37.2** | 66.8 ms | **18.7 %** |
| 720p capture only | 56.4 | 16.8 ms | 2.0 % |
| blur layers removed only | 59.8 | 16.7 ms | 0.4 % |
| **both** | **60.0** | **16.7 ms** | **0.0 %** |

**Two independent causes, both fixed:**

1. **Every control over the live camera carried `backdrop-filter: blur()`.** Over live video that
   forces the compositor to re-blur the whole scene every frame.

```css
/* the fix — disable while recording, keep the frosted look at idle */
.sv-stage.is-rec *,
.sv-stage.is-rec *::before,
.sv-stage.is-rec *::after {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
```

2. **1080p was the default**, so `MediaRecorder` encoded **2.1× the pixels of 720p on every
   frame**. Replaced with a device-aware capture ladder plus a watchdog that steps down a rung
   when a take still comes out choppy.

Also in this round: teleprompter A−/A+ size + drag; camera look picker **baked into the recorded
file** (a CSS preview leaves no trace in the recording, so the look is re-encoded on stop);
overlay drag reading the live stage rect; **four real corner resize handles** replacing a CSS
`::after` decal wired to nothing; cropping via `clip-path` + `crop=`; compact review stage
(758 px → 424 px on an 892 px screen).

### Round 3 — Second round of 8 fixes (PR #8) — **STILL OPEN, NOT MERGED**

| # | Item | What was done |
|---|---|---|
| 1 | Higher fps | `SP_FPS_LADDER` = 120/90/60/50/24, clamped to `track.getCapabilities().frameRateMax`; high tier asks 60fps rather than more pixels; the negotiated rate is read back and explained in plain words |
| 2 | Filter lost camera→editor | The bake rewrote the mp4 but left `st.filter` at `'none'`; a look now sets both |
| 3 | Pinch-to-resize + free drag | One gesture handler for text/caption/image/video overlays; pinch 0.25×–4×; pointer capture; one style write per frame; no `render()` mid-gesture |
| 4 | Effects "do nothing" | Panels worked; the sheet's opaque blur covered the video. Real gap: **video overlays were missing from the export filtergraph entirely** |
| 5 | Tap-to-split | Tap selects; tapping the selected clip cuts at the playhead |
| 6 | Captions from speech | Script-text fallback **removed entirely**; takes transcribed server-side via `/api/transcribe` (Groq whisper-large-v3), audio decoded to 16 kHz mono WAV and posted as multipart |
| 7 | Cropping | `ovCropEdge` input now actually writes to the overlay's crop |
| 8 | Preview too big | `.sv-review-stage video` capped at 34vh, down from 46vh |

> ⚠️ **PR #8 is open and unmerged.** The 8 fixes above are on branch `studio/v6-fps-drag-crop`
> and are **not on `main`**. The redesign then landed on `main` independently, so that branch
> likely conflicts.

---

## 8. Every bug found, with root cause

| # | Bug | Root cause | Fixed in |
|---|---|---|---|
| 1 | Whole app 404'd in production | `lib/authRedirect.js` one directory too high — `express.static` only serves `public/` | PR #4 |
| 2 | Password reset unreachable | Frontend never called the existing API; no "Forgot password?" link | PR #3 |
| 3 | Export never worked | ffmpeg loaded cross-origin; Worker cannot be built from a cross-origin script | PR #6 |
| 4 | Export aborted after loading | `-map` given bare filter labels instead of `'[vlook]'` | PR #6 |
| 5 | Export poisoned after one failure | `SVFF.loading` never cleared on rejection | PR #6 |
| 6 | Cookie banner covered record | `z-index: 9999` above the Studio's `9000` | PR #6 |
| 7 | Deleting a clip did nothing | `svState()` returned a fresh object; writes hit an orphan | PR #6 |
| 8 | Undo couldn't restore a clip | Delete revoked the object URL, destroying the media | PR #6 |
| 9 | A typo made clips invisible | `svFormatMs` vs `smFormatMs` — valid JS, threw only at render | PR #6 + wiring guards |
| 10 | Recording choppy (37 fps) | `backdrop-filter: blur()` over live camera + 1080p capture | PR #7 |
| 11 | Filter vanished camera→editor | Bake left `st.filter` at `'none'` | PR #8 (open) |
| 12 | Crop sliders did nothing | Input never wrote to the overlay's crop | PR #8 (open) |
| 13 | Video overlays absent from export | Missing from the filtergraph entirely | PR #8 (open) |
| 14 | Resize "did nothing" | CSS `::after` decal not connected to any handler | PR #7 |
| 15 | Captions showed the script, not speech | Script text used as a silent fallback | PR #8 (open) |
| 16 | **Studio unusable after redesign** | **`<link href="/studio.css">` deleted from `<head>` — 0 CSS rules applied** | **current fix** |
| 17 | **Helper modules never loaded** | **redesign dropped `/lib/studioModel.js`, `/lib/studioPerf.js`, `/lib/authRedirect.js` from the script tags** | **current fix** |
| 18 | **`/api/health` lost its integration report** | **redesign deleted the `integrations` block from `server.js`** | **current fix** |
| 19 | Stale cache on installed PWAs | `sw.js` precaches `/`; `CACHE_NAME` should be bumped when the shell changes | **current fix** |

---

## 9. THE CURRENT BREAKAGE — the index/core redesign

### What happened

Between PR #7 and now, the owner (or another tool) **redesigned `index.html`, `core.js` and
`server.js` directly through GitHub's web uploader** — 13 commits, all titled *"Add files via
upload"*:

```
f0cdb72 … 5af4167   (13 commits, all "Add files via upload")
```

Diffstat for the redesign (`git diff 38d51ba..main`):

```
 public/app.js     |  161 ++++++-----
 public/core.js    |  432 ++++++++++++++-------------
 public/index.html | 1314 ++++++++++++++++++++++++++++++++++++++++++++------
 public/server.js  | 2514 ++++++++++++++ (NEW — a stray duplicate, uploaded by mistake)
 server.js         |  635 ++++++-------------
 5 files changed, 4518 insertions(+), 538 deletions(-)
```

The redesign was a **theme and layout pass** (new neutral palette, Manrope font, light surfaces,
violet accent). It deliberately changed the design — but it **deleted four things it should not
have**, and those four breakage-fours are what stopped the Studio from being reachable.

### Regression 1 — `studio.css` link deleted ⛔ *the main one*

```diff
  <link href="https://fonts.googleapis.com/css2?family=Manrope&…" rel="stylesheet">
- <link rel="stylesheet" href="/studio.css?v=18">
  <style>
```

The redesign replaced the head block and simply dropped that line. Its replacement comment even
says where the file *should* go — but never actually adds the tag:

```html
<!--   CREATE STUDIO v3 — UI stylesheet
       existing app CSS so it wins), or ship it as studio.css and add
       <link rel="stylesheet" href="/studio.css"> in <head>. -->
```

**Measured proof** (Chromium, real page):

| | before fix | after fix |
|---|---|---|
| Studio CSS rules in the document | **0** | **237** |
| `.sv-root` display | `block` | `flex` |
| `.sv-root` position | `static` | `fixed` |
| `.sv-root` background | `rgba(0,0,0,0)` | `rgb(0,0,0)` |
| `.sv-stage` present in DOM | **no** | yes |

The file itself was always fine — it served HTTP 200 the whole time. It was simply **never
requested**.

### Regression 2 — helper scripts dropped from the page ⛔

```diff
- <script src="/lib/authRedirect.js?v=17"></script>
- <script src="/lib/studioModel.js?v=17"></script>
  <script src="core.js?v=17"></script>
- <script src="/lib/studioPerf.js?v=18"></script>
  <script src="studio.js?v=18"></script>
  <script src="app.js?v=17"></script>
```

The redesign replaced all six with three, and **downgraded the version strings from v17/v18 back
to v15** (they look like an older file was uploaded over a newer one):

```diff
+ <script src="core.js?v=15"></script>
+ <script src="studio.js?v=15"></script>
+ <script src="app.js?v=15"></script>
```

Two consequences:
- `studio.js` calls **16 distinct `sm*` helpers and 15 distinct `sp*` helpers**. With
  `studioModel.js` and `studioPerf.js` not loaded, every one of those is `undefined`.
- `app.js` calls `parseAuthRedirect()` during boot; with `authRedirect.js` gone that throws —
  **and the app's own `try/catch` swallows it**, so the first visible symptom is a broken login
  screen with no error message. This exact failure mode has now happened twice.

### Regression 3 — `/api/health` lost its integration report

The `integrations: { … }` block (14 booleans) was deleted from `server.js`. Restored verbatim.

### Regression 4 — service worker cache name not bumped

`public/sw.js` precaches `/`. When `index.html` changes but `CACHE_NAME` does not, an installed
PWA can keep serving the old shell offline. Bumped `creatorpulse-v1` → `creatorpulse-v2`.

### Not a regression — the calendar

The calendar was investigated as part of the same report and **is not broken**:

- `pageCalendar`, `renderAgendaView`, `renderWeekView`, `renderMonthView`, `setCalView`,
  `openScheduleSheet`, `weekNav`, `calNav` all exist and are wired to `window`.
- All three views render correctly in a real browser: Agenda lists 13 events, Week shows the
  7-day strip, **Month renders all 31 day-cells**.
- Zero page errors while navigating all three.
- The calendar's CSS lives **inline in `index.html`** (26 `.cal-*` + 15 `.agenda-*` rules) and was
  not touched by the redesign beyond a colour restyle.

The only 503s seen (`/api/schedule`, `/api/saved-posts`) are **sandbox artifacts** — those routes
return `503 {error:"Database not configured"}` when Supabase env vars are absent, which they are
in a local test run. On Render with `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set, they answer
normally.

> **Honest note for whoever picks this up:** the owner reported "a problem with the calendar".
> Nothing reproducible was found in the calendar itself. The most likely explanation is that the
> missing Studio stylesheet and the missing helper scripts made the shared shell look and behave
> broken, which reads as "the calendar is broken too". If he reports a *specific* calendar
> symptom, get a screenshot — do not assume this investigation closed it.

### The fix that was applied

Branch `fix/restore-studio-css-and-redesign-regressions`:

```diff
  <!-- index.html <head> -->
+ <!-- The Create Studio's own stylesheet. studio.js renders the whole record /
+      edit surface with .sv-* classes, so without this link the Studio has NO
+      styles at all -- it is why the Create screen came up unstyled. Kept as a
+      separate file (rather than inlined) so it can be cached and versioned on
+      its own. -->
+ <link rel="stylesheet" href="/studio.css?v=19">
```

```diff
  <!-- index.html, end of <body> -->
- <script src="core.js?v=15"></script>
- <script src="studio.js?v=15"></script>
- <script src="app.js?v=15"></script>
+ <script src="/lib/authRedirect.js?v=19"></script>
+ <script src="/lib/studioModel.js?v=19"></script>
+ <script src="core.js?v=19"></script>
+ <script src="/lib/studioPerf.js?v=19"></script>
+ <script src="studio.js?v=19"></script>
+ <script src="app.js?v=19"></script>
```

```diff
  # server.js
+ // `integrations` reports ONLY whether each provider is configured (booleans),
+ // never the values. Without this a deploy could answer 200 "healthy" while
+ // silently 503-ing every feature that needs a missing key.
  app.get("/api/health", (_req, res) => {
    ...
+   integrations: { supabase: !!(...), groq: !!(...), /* … 14 keys … */
+     supabaseAnon: !!process.env.SUPABASE_ANON_KEY,
+     passwordReset: !!(process.env.PASSWORD_RESET_REDIRECT || process.env.FRONTEND_URL) },
  });
```

```diff
  # public/sw.js
- const CACHE_NAME = "creatorpulse-v1";
+ const CACHE_NAME = "creatorpulse-v2";
```

Plus one **test fix** — `test/studioWiring.test.js` anchored on the bare substring `'studio.js'`,
which also matches a *comment* mentioning that filename. A sibling test already got this right by
anchoring on the script tag. Both were changed to the precise form:

```diff
- const perfAt = INDEX_SRC.indexOf('studioPerf.js');
- const studioAt = INDEX_SRC.indexOf('studio.js');
+ const perfAt = INDEX_SRC.indexOf('src="/lib/studioPerf.js');
+ const studioAt = INDEX_SRC.indexOf('src="studio.js');
```
```diff
- const iModel = INDEX_SRC.indexOf('studioModel.js');
+ const iModel = INDEX_SRC.indexOf('src="/lib/studioModel.js');
```

---

## 10. Current state

### ✅ Works (machine-verified on the fix branch)

| Area | Evidence |
|---|---|
| All page assets serve | `/`, `/studio.css`, `/lib/*.js`, `/studio.js`, `/core.js`, `/app.js`, `/api/health` → all **200** |
| Studio is styled | **237** `.sv-*` rules applied (was 0); `.sv-root` fixed/flex/black |
| Studio opens | Camera view renders with a live **720×1280** video track (`readyState 4`) |
| Studio controls present | 26 `data-act` handlers: `record`, `torch`, `zoom`, `flip`, `mic`, `camFilters`, `prompter`, `toEditor`, `upload`, … |
| Calendar | Agenda / Week / **Month (31 cells)** all render; **zero** page errors |
| `/api/health` | Returns `ok:true` **with** the 14-key `integrations` block |
| Tests | **167 / 167 passing** |
| No JS syntax errors | `node --check` clean on every file |

### ⚠️ Not verified — needs a human with a real phone

- **No real camera was used.** All browser runs used Chromium's synthetic device. The record
  path, layout and logic are proven; **device feel is not.**
- **Flashlight and true optical zoom are phone hardware.** Chrome on Android does both; iPhone
  Safari often has **no torch**, and its zoom is a digital crop, not a real lens.
- **Green screen needs a plain backdrop** to key against.
- **Export runs `ffmpeg.wasm` on the phone** — expect 20–40 s for a 60-second video.
- **Speech captions were not tested end-to-end through Groq** (no API key in the sandbox).

### 🔴 Outstanding

1. **`GROQ_API_KEY` must be set on Render** for auto-captions (`/api/transcribe`). Without it the
   app says so plainly rather than failing silently. Get one free at console.groq.com.
   *Note: the owner said "Grok" — Grok is xAI; **Groq** is a different company that runs Whisper,
   which is the accurate transcriber. The app already had Groq wired up.*
2. **`SUPABASE_ANON_KEY` must be set on Render** for the password-reset flow.
3. **Supabase → Authentication → URL Configuration** — the app URL must be in the allowed
   redirect list, or Supabase silently refuses to send reset links.
4. **Supabase SMTP must stay OFF** until a real mail provider is configured. Turning on "custom
   SMTP" with empty Host/Username/Password fields breaks **all** email.
5. **The live site may be suspended.** `https://creatorpulse.onrender.com` returned **503
   "suspended by its owner"** on the last check. If it is suspended deliberately, nothing to do;
   otherwise it needs resuming on Render.
6. **PR #8 is unmerged** — the 8-fix round lives on `studio/v6-fps-drag-crop`. It will need
   rebasing onto the redesigned `main`.
7. **The owner still wants to match Instagram's Edits app UI.** He said he would send screenshots
   to copy from. Visual polish round still to come.
8. **`public/server.js` is a stray duplicate** that is publicly served as a static asset. Dead
   code; safe to delete.

---

## 11. Test situation

**Command:** `npm test` → `node --test test/`

**Current count on the fix branch: 167 passing, 0 failing.**
(Was 20 → 47 → 109 → 160 → 167 as rounds landed. PR #8's branch claims 178, but it is unmerged.)

**Run it exactly like CI** — a fresh clone has no `node_modules` and will fail spuriously:

```bash
git clone https://github.com/Alleq2th/creatorpulse.git && cd creatorpulse
npm ci          # NOT npm install -- CI uses ci
npm test
```

### What the suite covers

| File | Covers |
|---|---|
| `test/staticAssets.test.js` | Every local asset `index.html` references **exists under `public/`**, and script load order. Catches the "perfect file in the wrong directory" 404. |
| `test/boot.test.js` | Boots the real server and asserts `/api/health` answers `ok:true` **with an `integrations` object**, and that every value in it is a **boolean** (so a secret can never leak). |
| `test/authRedirect.test.js` | 20 cases: valid recovery links, missing tokens, expired links, mangled percent-encoding, query-vs-hash precedence, garbage input. |
| `test/studioModel.test.js` | 53 cases over the pure timeline maths — trim clamping, split, remove, caption timing, export planning. |
| `test/studioWiring.test.js` | Static guards: resolves every `sv*`/`sm*`/`sp*` identifier the Studio calls against what is actually defined; asserts every `data-act` has a handler; asserts helper load order; asserts the vendored engine is same-origin and every piece is committed. |
| `test/studioPerf.test.js` | 49 cases pinning frame-pacing thresholds, the capture ladder, teleprompter clamping, overlay move/resize/crop maths, speech-to-caption timing. |
| `test/exportEngine.test.js` | Vendored engine files exist and are non-truncated. |
| `test/cache.test.js`, `test/imageGen.test.js`, `test/uniqueness.test.js` | Cache TTL, image generation, duplicate-content similarity. |

### The pattern worth preserving

**Both production bugs this project has had were invisible to unit tests**, because the files were
valid JavaScript that was simply in the wrong place or never loaded. That is why the static-asset
and boot tests exist. **If you add a file that the page needs, add it to
`test/staticAssets.test.js`** — that test is the only thing standing between a rename and a dead
app.

**Negative-test new guards.** The engine-CSP and static-asset guards were each verified by
deliberately reintroducing the bug in a scratch copy and confirming the guard fails. A guard that
cannot fail is worthless.

---

## 12. Pull requests

| # | Title | State |
|---|---|---|
| 1 | Add files via upload | merged 2026-08-15 |
| 2 | Chore/config cleanup tests password reset | merged 2026-09-24 |
| 3 | Add forgot-password and password-reset UI | merged 2026-09-24 |
| 4 | Password reset UI + fix critical static-asset 404 that broke the whole app | merged 2026-09-25 |
| 5 | Report password-reset config on `/api/health` | merged 2026-09-25 |
| 6 | Rebuild the Studio from scratch: working record → review → edit → export flow | merged 2026-09-25 |
| 7 | Studio: fix choppy recording (37→60fps), teleprompter control, baked-in camera looks, captions from speech | merged 2026-09-25 |
| 8 | Studio: 60fps capture, real voice captions, pinch-to-resize + free drag, tap-to-split, video-overlay export | **OPEN — unmerged** |
| — | `fix/restore-studio-css-and-redesign-regressions` (the 4 regressions above) | this round |

**There is no PR #6-shaped hole:** PR #6 *does* exist and *is* merged. An earlier assistant
invented a PR link before it existed and sent the owner to a 404 — **never hand over a PR link
without opening it and confirming it resolves.**

---

## 13. Conventions and what not to break

### Code conventions

- **Vanilla JS, no build step.** Files load via `<script src>`. There is no bundler to catch a
  bad path.
- **Pure logic goes in its own DOM-free module** and is exported for `require()` so `node --test`
  can reach it — `studioModel.js` (`sm*`), `studioPerf.js` (`sp*`). This is what made the Studio
  testable at all; the old 2,000-line Studio could not be tested.
- **Naming prefixes are load-bearing:** `sv*` = Studio view, `sm*` = Studio model (pure),
  `sp*` = Studio perf (pure), `cs*` = legacy Create Studio (mostly dead).
- Keep the app's existing visual language. The owner likes the app's look; it is the **Studio**
  that needed rebuilding.
- Plain-English comments explaining *why*, not *what*.

### Do not break these

1. **The `<link rel="stylesheet" href="/studio.css?v=NN">` tag in `index.html`.** Removing it
   leaves the Studio with zero styling — this is the bug that just cost a week.
2. **The six script tags, in that order.** `authRedirect` → `studioModel` → `core` → `studioPerf`
   → `studio` → `app`. A helper loaded after its caller is `undefined` at the moment the caller
   runs, and `node --check` will not tell you.
3. **The `integrations` block in `/api/health`.** Booleans only — never a value. A test asserts
   this, so a leaked secret fails CI.
4. **Same-origin ffmpeg.** Never point the export engine at a CDN.
5. **Bracketed `-map` labels** in the export filtergraph.
6. **`CACHE_NAME` must be bumped in `sw.js` whenever `index.html` changes**, or installed PWAs
   can serve the old shell.
7. **Never remove a test to make the suite green.** The 5 failures the redesign caused were the
   tests correctly reporting a real breakage. Fix the code, not the test.

### The most useful commands

```bash
npm ci && npm test                       # exactly what CI runs
node --check public/studio.js            # syntax only -- does NOT prove anything runs
curl -s localhost:3000/api/health | jq   # which integrations are configured
for u in / /studio.css /lib/studioModel.js; do
  printf "%s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' localhost:3000$u)"
done                                     # the "is it actually served" check
```

### How to verify the Studio properly

Unit tests cannot prove a camera app works. Drive it in a real Chromium with synthetic media
devices (`--use-fake-device-for-media-stream`), phone-shaped viewport (412×892), and **assert on
computed styles during recording** — not at idle:

```js
// the check that would have caught the missing stylesheet in one line
let rules = 0;
for (const sheet of document.styleSheets)
  try { for (const r of sheet.cssRules) if (r.selectorText && /\.sv-/.test(r.selectorText)) rules++; } catch (e) {}
// rules === 0  →  studio.css is not linked
```

---

*End of handoff. Everything in this document was verified against the live repository and a
running instance of the app on 2026-10-03.*
