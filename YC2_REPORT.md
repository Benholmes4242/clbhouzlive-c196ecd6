# YC2 — opened course card

## Delivered
- Opened content is isolated in `YourCourseOpenContent.tsx` with pure history/format rules in `yourCoursesOpenRules.ts`. YC1 header, tiles, sorting, names and collapsed bar remain unchanged; the bar now remains visible when expanded, as required.
- Trend starts at 15 returned rounds; compares last 10 with all returned history, using the 0.3 better/worse threshold. Better is green; worse stays ink.
- Neutral straight 1.8px line chart starts at three rounds, displays the latest 15 oldest-first, places lower scores higher, adds the dashed all-history mean and best shown dot. Four-column exact-percent mix, best round/date and nullable costliest-hole fact follow; analytics still navigates to `/courses/{id}?tab=holes`.
- Removed the old kicker, rainbow gradients/zone legend, expanded distribution bar and Rounds/Your avg/Last played trio. Old locale keys remain for compatibility; new wording added to all six existing catalogues, following their existing English-copy cutover.
- User explicitly authorized removing `PER_COURSE_CAP`; `ROW_CAP` stays **2,000**, no extra query. Returned 18-hole count supplies sentence n, even when different from the list's count. Means and best round are limited to history returned within that unchanged ceiling; not an unlimited all-time completeness claim.
- Global CSS owns YC2 colour roles. Local ownership is recorded in module headers and AGENTS.md.

## Test changes and totals
**Before: 5,238 tests / 511 files. After: 5,284 tests / 512 files.**

Only new test file: `src/test/yc2YourCoursesOpen.test.tsx`, **+46 tests / +1 file**. No old test deleted, renamed, rewritten or assertion changed. Old → new: all existing tests unchanged; 46 new history, threshold, chart-window/order/geometry, percent-edge, best/date, ordinal, null-fact and blended navigation/read cases. YC1 retains its 30 assertions/cases.

Targeted command: `bunx vitest run src/test/yc2YourCoursesOpen.test.tsx src/test/yc1YourCourses.test.tsx --maxWorkers=2`: **76/76**, two files.

Full commands: `bunx vitest run --shard=N/4 --maxWorkers=2`, N=1,2,3,4:

| Shard | Tests | Files |
|---|---:|---:|
| 1 | 1,262 | 128 |
| 2 | 1,247 | 128 |
| 3 | 1,384 | 128 |
| 4 | 1,391 | 128 |
| Total | **5,284/5,284** | **512/512** |

Against the older 5,172/509 baseline: +112/+3 = YC1 +30/+1, World Rankings +36/+1, YC2 +46/+1. No observed failures or unhandled-error summary in these runs. Logs: `/tmp/yc2-check/targeted.log` and `shard-{1,2,3,4}.log`.

## Verification and limitations
- Automatic preview build reports **build OK**, latest read entry `2026-11-01T14:32:13Z`; no manual build or typecheck.
- Real sheet flow tested with real English provider and real batched hook against explicit mocked read rows: expand course, retained bar, returned history, fact rows, close and unchanged destination. This is not authenticated browser proof.
- Browser authentication is `external_unmanaged`; signed-in live flow and screenshot/pixel parity remain unverified. No access bypass, account invention or credential request. Colours, captions, removals and layout are implemented from source but not claimed as screenshot-verified or covered by paint/copy assertions.
- Frozen YC1 retains its existing 28% expanded border and list geometry even where mock differs; no silent adoption of frozen mock details. Illustrative degrees in the mock are not app data.
- Earlier World Rankings shard-2 failure still cannot be named from surviving evidence; its requested three standalone runs remain blocked, not relabelled as a YC2 failure.

## Protected scope
No SQL, migrations, deployed RPC/edge changes, native/Median config edits or `feed_config` edits. `round_pool_cap` remains 30.