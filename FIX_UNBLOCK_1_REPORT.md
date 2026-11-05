# FIX_UNBLOCK_1 — stopped on reproducible untouched-file failure

## Delivered
- Restored `const backMode = false;` and the exact requested always-burger comment in `TourHubMainPage.tsx:122–123`. Activity routing, scrolling and browser history remain unchanged.
- Rewrote only the NAV-ARRIVAL TAG comment in `useNavigationHandlers.ts:70–71`; handler code unchanged.
- Repaired only fixture exports with demonstrated missing-export failures; all existing overrides retained. No assertion, case name or case count changed.
- Corrected the two authorised FIX_TOUR_NOTIF_1 test setup issues. No following assertion changed and no test asserts an arrival-dependent hub back chevron.

## Fixture line inventory
| File | Line | Old → new |
|---|---:|---|
| `src/test/headerB1.test.tsx` | 33 | Guest mock with only `useIsGuest` → partial original-module spread with the exact same `useIsGuest` override |
| `src/test/islandSquircle.test.tsx` | 19 | Same conversion, retaining `mocks.guest` |
| `src/test/hb6Group1.test.tsx` | 17 | Same conversion, retaining `useIsGuest: () => false` |
| `src/test/ep4LinksPrivacy.test.tsx` | 30 | Added inert `useHandicapTrend`; connection and `whsKeys.percentile` overrides unchanged |
| `src/test/st3SettingsPrivacy.test.tsx` | 29 | Added inert `useHandicapTrend`; connection override unchanged |
| `src/test/fixTourNotif1.test.tsx` | 24–25 | Save original ResizeObserver and restore through direct assignment in afterEach |
| `src/test/fixTourNotif1.test.tsx` | 33 | Query `name:'Weekly tournaments'` → `name:/^Weekly tournaments/`, as authorised; following assertions unchanged |
| `src/test/fixTourNotif1.test.tsx` | 54 | `vi.stubGlobal('ResizeObserver', class …)` → direct typed assignment to `window.ResizeObserver`, preserving callback/observe/disconnect |

Both inert trend stubs use `{ data: undefined, isLoading: false, isPending: true, isFetched: false, isError: false, fetchStatus: 'idle' }`, the disabled empty-query state read from the real hook and consumer. This avoids invoking real WHS/Supabase reads. No original fixture export was removed.

`ep5Completion` and `overflowRightIsland` already passed with the previous exact authorised own-state/pro-status additions and remain untouched in this brief. `tourNewsPage` also passed and remains untouched. No speculative edits to other mocks.

## Verification
Focused command:
```text
bunx vitest run src/test/fixTourNotif1.test.tsx src/test/ac1ActivityRounds.test.tsx src/test/tourNewsPage.test.tsx src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts src/test/fixLiveDot1.test.tsx src/test/tourIsland.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/overflowRightIsland.test.tsx src/test/ep5Completion.test.tsx src/test/proStatusControls.test.tsx src/test/proOwnHandicapState.test.tsx src/test/fixOverflowSource.test.ts --maxWorkers=2
```
**272 passed / 13 files**, full output `docs/verification/fix-unblock-1/focused.log`.

Full-suite commands: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| 1 | 1,753 | 0 | 1,753 | 152 passed |
| 2 | 1,654 | 9 | 1,663 | 151 passed / 1 failed |
| 3 | Not run | — | — | — |
| 4 | Not run | — | — | — |

Executed: **3,407 passed + 9 failed = 3,416 tests / 304 files**. No full-suite green claim.
Full logs retained at `docs/verification/fix-unblock-1/shard1.log` and `shard2.log`.

### Reproducible STOP — no flake exception
Untouched `src/test/islandsNav.test.tsx` has nine failures, also observed before this brief in the pro-status continuation:
- "shows the improving move as ▾0.2" — line 133:25
- "shows the drifting move as ▴0.3" — line 144:19
- "shows only the number when there is no move" — line 150:25
- "opens on tap with dialog semantics and focuses the card" — line 168:5
- "shows the move, sparkline and stats once data settles" — line 190:5
- "hides the sparkline when fewer than 2 points exist" — line 203:5
- "closes on Escape and returns focus to the index cell" — line 208:18
- "closes on a tap on the backdrop" — line 215:5
- "closes on route change" — line 234:28

Tool's exact error:
```text
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Handicap index 12.4"
```
Isolated command: `bunx vitest run src/test/islandsNav.test.tsx --maxWorkers=2`.
**10 passed / 9 failed**, full output `docs/verification/fix-unblock-1/islandsNav-isolated1.log`.
The first isolated run failed, so 3/3 passing runs are impossible and no further retries or fixes were made. This is not one of the authorised missing-export errors. Shards 3–4 and browser checks stopped.

Previously recorded failures repaired here: headerB1 (6), islandSquircle (6), hb6Group1 (20), ep4LinksPrivacy (1), st3SettingsPrivacy (13), plus the two FIX_TOUR_NOTIF_1 apparatus/query failures. The prior ep5Completion (22) and overflowRightIsland (7) fixture failures were already repaired by the previous authorisation. Their historical logs are retained. No failure newly observed under this brief beyond the already-recorded islandsNav failure; no failure waived as flaky.

## Test inventory
No tests added/deleted/renamed/rewritten in FIX_UNBLOCK_1; no assertion changed. The source-based expected before/after remains **6,874 tests / 607 files**, not a freshly executed total.

Reconciliation against requested **6,862 / 606**: the prior fixture authorisation added four Settings cases to `proStatusControls.test.tsx` and nine in `proStatusSurfaceCoverage.test.tsx` (+13 tests / +1 file). Historical FIX_TOUR_NOTIF_1 accounting listed seven cases, but the current source and focused run contain six (one `it.each` expands to two plus four ordinary cases), a one-case historical overcount, not a deletion in this brief. Thus **6,862 + 13 − 1 = 6,874 / 607**. Against the last completed 6,835 / 602 baseline: proOwnHandicapState +3, original proStatusControls +14, fixTourNotif1 actual +6, fixLiveDot1 +3, and prior surface additions +13 = +39 / +5 files. Full inventory not confirmed because testing stopped.

## Build, browser and scope
- Latest automatic build: **build OK, 2026-11-05T12:04:40Z**.
- Browser checks were not run after the reproducible test failure. The requested `/tmp/browser/live-dot/baseline.json` is absent from this sandbox, so exact historical pixel comparison cannot currently be supplied even after tests unblock.
- No product changes outside the one authorised hub revert; handler change is comment-only. No changes to guest browsing, review wizard, News product files, round plots, setup.ts, SQL, migrations, deployed RPCs/edge functions, feed_config, round_pool_cap or native/Median configuration.
- Earlier reports remain; their all-green deletion/close-out condition has not been met.