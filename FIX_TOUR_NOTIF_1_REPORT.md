# FIX_TOUR_NOTIF_1

## Status: STOP — not signed off

Product edits are present. Focused run: **144 passed, 2 failed, 146 executed / 4 files**. Full output retained at `docs/verification/fix-tour-notif-1/focused.log`. No failing tests were changed after this run. Four shards and browser checks were not run because the brief stops on any failure.

### Exact new failures

- `src/test/fixTourNotif1.test.tsx:32:28`, “keeps the trophy after the route change and pushes without nav-origin state, with back to Activity”: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Weekly tournaments"`. Runner lists the actual accessible name as `Weekly tournaments DPWT · now`.
- `src/test/fixTourNotif1.test.tsx:53:8`, “keeps the title in flow and hides rather than clips when measured room is too small”: `TypeError: Cannot redefine property: ResizeObserver`.

Both failures are in the new test, not existing tests. Navigation/back and mocked narrow-title coverage therefore remain incomplete. The three existing focused files passed, including **unchanged** `tourNewsPage.test.tsx` and the explicit push parity exceptions. Latest observed automatic build entry: **build OK, 2026-11-05T11:18:53Z**.

## Changes

- `LedgerRow.tsx`: green 40×40/12px system tile, app TrophyIcon 18px; preserved test id, no tile text. Meta now uses the carried short name or Tour. Tour identity derives from notification type plus `spec.isSystem`, not URL. The old notification URL inference had one match in the source; no sibling notification inference remains.
- `activity-rounds.css`: removed sole `.activity-tour-tile` rule after checking all references.
- `activityLinks.ts`: both digests return `/tourhub`; comment now describes tournaments and overview.
- `TourHubMainPage.tsx`: inspected existing scrolling, found the shared `ScrollRestoration` already discards saved scroll and calls `scrollPageToTop('instant')` on fresh PUSH/REPLACE pathname arrivals, while POP restores saved scroll. No additional scrolling code needed. Removed unconditional `backMode=false`; non-default arrivals without `state.from='nav'` show back, bottom-navigation arrivals retain menu. LedgerRow still calls `navigate(url)` without state. Bottom-nav handler untouched. Back relies on existing `safeGoBack`.
- `NewsChromeBridge.tsx`: optional titleInPage, named header, in-flow flexible title slot with 8px side clearance and nonshrinking controls. ResizeObserver schedules fit updates in an animation frame; title stays measurable but hidden when too wide. No ellipsis. `WireNewsPage.tsx` passes titleInPage. In-page NewsTab h1 untouched; all other news files unchanged.
- Push router unchanged: `/tour/news` remains its destination.

## Exact test changes

No existing case deleted. One existing case renamed; every modified case listed here:

1. `src/test/ac1ActivityRounds.test.tsx`, **“uses carried short-name text and Tour-prefixed time” → “uses the trophy tile and carried short-name meta”**. Old `expect(screen.getByTestId('activity-tour-tile')).toHaveTextContent('DPWT')` → SVG present and tile `textContent` equals `''`; old meta `toHaveTextContent(/^Tour · /)` → `toHaveTextContent(/^DPWT · /)`. Reason: authorised trophy and short-name meta change; Bell assertion retained.
2. Same file, **“falls back to Tour without inventing a short name”**. Old tile `toHaveTextContent('Tour')` → SVG present, tile text `''`, meta `toHaveTextContent(/^Tour · /)`. Reason: fallback moved from tile to meta. Non-Tour test unchanged.
3. `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts`, **tour_preview / tour_roundup** moved out of ordinary identical-route fixture list into two named cases: **“$name opens overview on client and wire on push pending a separate push-router change Ben will approve”**. Old `routeForNotif(...).toBe(getActivityLink(r))` → client `toBe('/tourhub')` and push `toBe('/tour/news')`. Reason: explicit authorised route divergence; all inert and handled-type coverage retained. Case count unchanged.
4. New `src/test/fixTourNotif1.test.tsx`: **7 cases** (two destination cases; trophy/navigation/back; fresh arrival and POP restoration; titleInPage; measured label hide/show). Five passed, two failed as above. No new tests rewritten after failure.

## Inventory and commands

Command executed: `bunx vitest run src/test/fixTourNotif1.test.tsx src/test/ac1ActivityRounds.test.tsx src/test/tourNewsPage.test.tsx src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts --maxWorkers=2`.

Last fully passing baseline: **6,835 / 602 files** from Featured tilted pile. Intervening Pro status work added **17 / 2 files** (`proOwnHandicapState.test.tsx`: 3, `proStatusControls.test.tsx`: 14), giving the previously reported expected inventory **6,852 / 604** (not a passing full suite). This brief adds **7 / 1 file**: expected inventory now **6,859 / 605**. No deletions; parity movement and AC1 edits cause zero count delta. Full inventory is not newly verified. Shards 1–4: **not run**. Requested command after resolution: `bunx vitest run --maxWorkers=2 --shard=n/4`.

### Named pre-existing failures (not rerun or changed)

Previous Pro status-controls stop remains: `src/test/ep5Completion.test.tsx` (22 cases: missing `useHandicapTrend` fixture export) and `src/test/overflowRightIsland.test.tsx` (7 member cases: missing `isGuestUser` fixture export). Preserved evidence: `docs/verification/pro-status-controls/shard1.log`; details in `PRO_STATUS_CONTROLS_REPORT.md`. Historical `guestStage24.test.tsx:85` and `ob1Welcome.test.tsx:113` are named shard-load flakes with preserved HH3 logs; their continuation exemption applies only to HH3/FIX_PROFILE_COMPARE_1, not this brief.

## Report-only header sweep

Read-only audit of `src/features/chrome-v2`, `src/features/tourhub/components` including TourIsland, and `src/components/header` found no further absolutely centred visible title across a row with a right cluster. Registry title metadata is not rendering evidence; TourIsland is a left island, not a centred bar title. `TourPageShell.tsx:39–45,74–79` discards its title prop and uses shared AppHeader. `AppHeader.tsx:21–35` explicitly has no title in its control row.

Related shared header outside the requested directories, flagged for a later brief: **`src/components/chrome/FixedPageHeader.tsx:130,150`** — absolute-centering title positioning/rendering with flanking controls; comment at line 12 describes this grammar. No changes made. This is source-audit evidence, not a measured 320px collision claim. Mobile sweep and signed-in Activity end-to-end flow remain unverified due to the test stop.

## Boundaries

`git pull` was not run: stateful Git commands are prohibited in this workspace. No SQL, migration, deployed RPC/edge function, feed_config, round_pool_cap, native/Median, guest browsing, review wizard or round-plot changes. News changes limited to the two explicitly authorised files.