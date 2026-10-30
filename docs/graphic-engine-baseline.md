# CreatorPulse Graphic Engine Baseline & Protection Rules

This document records the known-good starting point for incremental graphic-preview work and the existing graphic choices that must remain available.

## Baseline revision

- Git branch at inspection: `main`
- Baseline commit: `77642373d5e8b076dc0729d6bd46ab59dab240e8`
- Baseline description: merge of PR #63, card editor cleanup/export
- Baseline test result recorded before this change: 532 tests passed
- Preview-recovery work is isolated on `fix/graphic-preview-rendering-and-recovery`; do not merge unfinished work blindly.

## Existing graphic selections to preserve

Keep all current IDs, labels, behavior, and user selections. Additions or careful integrations only.

### Five Instagram templates

| ID | Label |
|---|---|
| `impact` | Bold Impact |
| `editorial` | Editorial Clean |
| `stat_split` | Data & Stat Split |
| `dark_gradient` | Dark Ambient Glow |
| `neon_noir` | Neon Cyber |

### Five TikTok templates

| ID | Label |
|---|---|
| `viral_hook` | 9:16 Viral Hook |
| `silent_camera` | Silent Camera |
| `quote_punch` | Bold Statement |
| `minimal_noir` | Dark Minimalist |
| `high_retention` | High-Retention Alert |

These are platform-specific picker templates, defined in `public/create/steps.js`.

### Five live-editor style themes

| ID | Name |
|---|---|
| `dark_editorial` | Dark Editorial |
| `electric` | Electric |
| `minimal` | Minimal |
| `sports_broadcast` | Sports Broadcast |
| `classic_magazine` | Classic Magazine |

These are defined in `public/create/cardThemes.js`. The same file also contains eight colour themes; preserve those IDs too.

## Protected existing functionality

Any graphic-engine changes must keep these working:

- Content and news generation, including `window.gen()` and the existing card-generation request path.
- Instagram and TikTok platform previews, plus other platform previews.
- Carousel and single-graphic generation.
- Live text editing, font controls, layer colours, backgrounds, focal point, brand preset and theme controls.
- Image loading, rendering, save, export and download flows.
- Calendar, profile, and other application features.

## Regression checks

Run `npm test` before review and after each substantial update. Current source tests include editor, theme, preview, carousel, rendering, export/download/save, generation, and platform-preview coverage. Template preservation should be checked by IDs and labels, not just the number of choices. New behavior should have focused regression tests.

## Safe review and rollback

- Keep each change on a feature branch and submit it for review through a pull request.
- Check the changed-file diff and test results before merge; do not merge unrelated or unfinished branches as a shortcut.
- If a merged change regresses the app, revert its merge commit on `main` with `git revert -m 1 <merge-commit-sha>` and run `npm test`. Do not reset or force-push the shared branch.
- The baseline commit above is for comparison and recovery reference; preserve later legitimate changes when rolling back.
