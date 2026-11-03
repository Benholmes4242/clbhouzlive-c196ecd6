# G2D Video grids — implemented; full suite stopped

## Files touched
- `src/features/chrome-v2/registry.ts`: three video-grid rules now dark, bleeding, soft-scrim, condensing islands; global history back with /amateur fallback.
- `src/pages/WatchGridPage.tsx`: removed local header/back, reused unchanged PageTitle and useIslandBackName on actual h1; island clearance. Region-only unchanged IslandDock wraps shared controlled chip copies; selected dock tabs inherit shared glass. Grid queries, pagination, tiles and viewer taps unchanged. Local header comment records ownership; no new module.
- `src/test/g2dVideoGrids.test.tsx`: nine new cases using real router/i18n/query provider and controlled hook data/observers.
- `src/test/ws2WatchMiddle.test.tsx`, `src/test/ws3WatchBottom.test.tsx`: two authorized old-grid-header assertion cases updated, count-neutral.
- `roadmap.md`, `G2D_VIDEO_GRIDS_REPORT.md`: accounting/blockers.

PageTitle and IslandDock source/CSS unchanged. Guest browsing, wizard, news, plots, SQL/migrations, deployed RPC/edge functions, feed_config and native/Median untouched. round_pool_cap remains30.

## Test changes and accounting
Prior reported candidate: **6424 tests / 571 files** (not a green full-suite total). Current candidate: **6433 / 572**, +9/+1 entirely `g2dVideoGrids.test.tsx`; no deletions/renames. New cases:
1–3. /watch/courses, /watch/top100, /watch/region/Scotland has dark soft condensing islands and history back to /amateur.
4–5. top100/courses uses its existing translated title with no header or dock.
6. preserves the exact decoded region param and only prints available metadata.
7. observes the actual h1 and shows its name only expanded past the title.
8. docks region chips only past the row while expanded.
9. keeps both chip copies, course-id reads and analytics synchronized.

Authorized changes, assertions quoted:
- ws2, `region page shows title and sub from the regions read`: `expect(container.querySelector('[data-grid-title]')!.textContent).toBe('Down')` and `expect(container.querySelector('[data-grid-sub]')!.textContent).toBe('10 videos · 3 courses')` now select `h1` and `.chrome-page-title-subtitle` respectively, with identical expected values. Reason: shared PageTitle replaces old header nodes.
- ws3, `/watch/top100: title, no sub, no chips, Top 100 source`: `expect(q('[data-grid-title]')?.textContent).toBe('Top 100 on film')` and `expect(q('[data-grid-sub]')).toBeNull()` now select `h1` and `.chrome-page-title-subtitle`. Reason: same authorized old-header replacement; other assertions/fixtures unchanged. This sibling assertion was identified after shard1 stopped, updated under the brief’s explicit authorization and checked separately; failing tests were not corrected/rerun.

Commands/results:
- `bunx vitest run src/test/g2dVideoGrids.test.tsx src/test/ws2WatchMiddle.test.tsx --maxWorkers=2`: **35/35**, 2/2 files, `/tmp/g2d/focused.log`.
- `bunx vitest run src/test/ws3WatchBottom.test.tsx --maxWorkers=2`: **41/41**, 1/1 file, `/tmp/g2d/ws3.log`.
- Combined focused scope: **76 passing / 76 executed**, 3 files; not one combined command.
- `bunx vitest run --shard=1/4 --maxWorkers=2`: **1620 passed / 4 failed / 1624 executed**, 141 passed / 2 failed / 143 files; no unhandled-error report. Complete failure output `/tmp/g2d/shard1.log`. Stop; no shards2–4 and no all-green full-suite claim. Unchanged shard1 totals versus G2C reflect file assignment: new tests need not land in shard1.

## Inherited failures, verbatim
- `src/test/roundNotificationOverlay.test.ts:11:68`, “gives a cold round address back chrome with the page fallback and no HCP cell”: `AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }`; Received adds `condense: true` and `scrim: 'soft'`.
- `src/test/tourPlayoffShortenedEvents.test.tsx`, “shows the situation block for an awaiting-playoff event (pulse live) and not "Final"”, same `(pulse completed)`, “renders no block for a normal finished four-round event”: `Error: No QueryClient set, use QueryClientProvider to set one`; stack `src/features/tourhub/hooks/useTournamentPick.ts:37:10` → `TournamentPage.tsx:89:20`. Tool does not give test line. These are the same four reproduced in G2C/G2B, untouched.
- Prior known failures not rerun: `headerB1.test.tsx:97:39` expected23px/received16px, `g2aCourseTabs.test.tsx:104:34` expected `env(safe-area-inset-top, 0px)`/received empty. Suspected tourOverviewBand fixture is not a confirmed failure. Prior siLadderRules/SiLadder mismatch untouched.

## Browser/build and limits
Real Chromium fixture at localhost `/g2d-fixture`, 390×844, actual WatchGridPage/PageTitle/IslandDock/IslandBackCapsule and #root scroll, with controlled session/read hooks and empty grid. Title Scotland y109/30px/700; subtitle24 videos ·6 courses. Down500/up450 shows Scotland back name and dock y109/h34. Dock Kingsbarns updates original selected chip; no page errors. Screenshots `/tmp/browser/g2d/title.png`, `/tmp/browser/g2d/docked.png` reviewed. Fixture does not include right island/nav/full grid or authenticate the live route; not full-mock/live-route parity evidence. First fixture attempt timed out because IIFE environment lacked import.meta.env.DEV; fixture-only definition corrected, successful retry logged `/tmp/g2d/browser.log`.

Existing PageTitle tracking remains0 (as G2C; higher-priority design instruction), and original in-flow chips remain frozen styling. No shared changes or full mock parity claim.

Latest automatic build **build OK 2026-11-03T19:13:23Z** in observability. No manual build/typecheck. Full-suite zero-failure acceptance remains blocked by the inherited errors above.

## Final status (STABILISE_1, 3 Nov 2026)
The test stops that were open in this brief were resolved with test-only changes. The diffs, the authority for each and the named cases are in `STABILISE_1_REPORT.md`. Full suite in four shards with --maxWorkers=2: 1,638 / 1,538 / 1,641 / 1,632 = **6,449 tests, 574 files, 0 failures, 0 unhandled errors**. This confirms the earlier estimate of 6,449. Browser evidence: signed-in checks unavailable (external sign-in); signed-out live checks and fixture coverage are listed in STABILISE_1_REPORT.md.
