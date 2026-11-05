# FIX_LIVE_DOT_1

## STOP — implementation present, not signed off

Focused command:
`bunx vitest run src/test/fixLiveDot1.test.tsx src/test/tourIsland.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/fixOverflowSource.test.ts --maxWorkers=2`

Result: **40 passed / 12 failed / 52 executed; 3 passing and 2 failing files**. Full failure output: `docs/verification/fix-live-dot-1/focused.log`. All **3 new halo tests passed**. Existing `tourIsland.test.tsx` and `fixOverflowSource.test.ts` passed unchanged. Stopped immediately after the failing run; no failed test or fixture changed. Shards 1–4 and after-edit browser checks **not run**.

## Confirmed browser cause, before edits

Inspected the real `/tourhub` at **424×970, device scale factor 1**. Live data rendered **All tours / 3 live**. The fold column had `overflow:hidden`, no padding/margin, rectangle **x61, y19.25, width78.84375, height27.5**. Dot rectangle **x61, y40, 5×5**; its 3px halo extended to x58, outside the clipping column. Bottom halo extended to y48, beyond the column bottom y46.75. Outer button/wrapper edges were x13–155.84375 and y10–56, leaving adequate room. This confirms the fold column, not outer clipping, as the cause.

Before screenshot `/tmp/browser/live-dot/before.png` was viewed at 1× and showed the clipped left halo. Geometry baseline `/tmp/browser/live-dot/baseline.json`: label **x61,y19.25,60.84375×15**; caption **x71,y38.25,32.109375×8.5**; island/button **x13,y10,142.84375×46**. This is genuine live-data evidence, not an isolated demo.

Opened the real Tour menu and inspected all **4** live dots: one Live/Leaderboards tile and three tour rows. No local clipping ancestors; only document/body clipping, with ample clearance (minimum edge clearance 100px). **TourGlance unchanged**. Evidence `/tmp/browser/live-dot/glance-before.png`; browser script `/tmp/browser/live-dot/measure.py`.

## Edit and limits

Only product file changed for this brief: `src/features/tourhub/components/TourIsland.tsx`. On fold routes the expanded column now has padding **3px**, margin **-3px**; condensed column has **0/0** and keeps maxWidth 0. Negative margin compensates the additional padding. Added margin animation locally to the existing shared fold transition: `var(--island-fold-transition), margin 300ms var(--island-fold-ease)`; padding already belongs to the shared transition. Reduced motion still returns `none`. Global transition tokens untouched. Local header/comment documents clip-edge ownership.

`TourLiveDot` and `TourGlance` unchanged. After-edit pixel positions, baseline/gap/height equivalence and folded browser leakage remain **unverified** because testing stopped. Do not infer before/after equivalence from the compensating arithmetic alone.

Latest automatic build observed: **build OK, 2026-11-05T11:21:24Z**.

## Exact failure and cases

All 12 failures share the runner error:

`Error: [vitest] No "isGuestUser" export is defined on the "@/features/guest/useIsGuest" mock. Did you forget to return it from "vi.mock"?`

Stack: `src/hooks/useProfileData.ts:11:19` (`const isGuest = isGuestUser(user);`) → `useMyProStatus.ts:36:48` → `useOwnHandicapState.ts:6:18` → `ChromeIsland.tsx:368:15` (HcpCell). These files were not changed by this brief. The pre-existing Pro status-controls own-state dependency now encounters incomplete existing chrome test mocks; this is the same missing-export category as its previously recorded overflowRightIsland failure. These 12 cases are newly observed here, not newly caused by the halo edit; no exemption is claimed.

`src/test/headerB1.test.tsx` — 6 failing cases:
- FIX_GRID_1 top100 back uses history navigation without opening the underlying video
- FIX_GRID_1 top100 back uses fallback navigation without opening the underlying video
- HB5 profile folds when the nav signal changes
- search and divider fold inaccessible while Connect and avatar stay active
- DEFAULT_B1 NotFound renders a soft-fade logo squircle and folds on scroll
- opted left and right glass move from rest token to canonical material

`src/test/islandSquircle.test.tsx` — 6 failing cases:
- both islands are 16px squircles on / at rest and folded
- both islands are 16px squircles on /clubhouse at rest and folded
- both islands are 16px squircles on /tourhub at rest and folded
- a profile island route uses the HB5 squircle radius
- the folded Clubhouse left island is 30px mark + 7px padding + 1px border each side
- a flush left slot gets no capsule padding and the squircle radius

### Other pre-existing stops, not rerun here

- Pro status controls: `ep5Completion.test.tsx` 22 missing-useHandicapTrend fixture failures; `overflowRightIsland.test.tsx` seven missing-isGuestUser fixture failures. Full log `docs/verification/pro-status-controls/shard1.log`.
- FIX_TOUR_NOTIF_1: new `fixTourNotif1.test.tsx:32:28` accessible-name mismatch and `:53:8` `TypeError: Cannot redefine property: ResizeObserver`. Full log `docs/verification/fix-tour-notif-1/focused.log`. No changes made to that brief's failing tests.
- Historical named shard-load flakes: `guestStage24.test.tsx:85`, `ob1Welcome.test.tsx:113`. Their exemption is only HH3/FIX_PROFILE_COMPARE_1 and is not applied here.

## Test inventory and rewrites

**No existing test deleted, renamed or rewritten.** New file `src/test/fixLiveDot1.test.tsx` adds **3 cases**: expanded 3px/-3px compensation; condensed 0/0 and zero maxWidth; exact unchanged shared halo `0 0 0 3px rgba(52,215,127,0.22)`. No test changed after failure.

Last fully passing baseline **6,835 / 602 files**. Pro status controls added **17 / 2** (`proOwnHandicapState.test.tsx`:3; `proStatusControls.test.tsx`:14), expected **6,852 / 604**. FIX_TOUR_NOTIF_1 then added **7 / 1** (`fixTourNotif1.test.tsx`), expected **6,859 / 605**. This brief adds **3 / 1**, expected inventory **6,862 / 606**. These are reconciled expected full-suite counts, not a fresh executed/full-pass claim. Requested four-shard command remains `bunx vitest run --maxWorkers=2 --shard=n/4` after blocker resolution.

## Scope

No stateful Git commands (`git pull` prohibited by workspace rules), SQL, migration, RPC/edge deployment/edit, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round plots changed. Additional touched files only: new test, this report, roadmap, requirement memory.