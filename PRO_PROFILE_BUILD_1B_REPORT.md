# Pro profile build 1b — stopped at an unexpected test failure

## Implemented
- Pro-only 72px hairline avatar and three-line identity, surname/PRO together; shared shell avatars default to56 and no longer crop their full squircle. Shared shell h1 tracking is zero.
- EVENTS / TOP10S (BEST fallback, omitted without a finish) / FOLLOWERS / FRIENDS. Friends uses the existing social figure and member navigation. Existing member friendship handler, busy states, business exclusion and Remove friend menu reused. Own Edit/Share preserved.
- Ordinal solo finishes, preserved ties/eliminated finishes, fixed English months, separated ranks and SCORING for all pros.
- Explicit course-par calculation with gross storage unchanged, stacked row scores, owner/admin missing-par controls, grouped Save-only60–75 steppers (default72), existing set_pro_event_par RPC and event-query invalidation.
- Result detail shows rank_after and green/muted movement, source-specific round scores, gross subtotals, footnote attribution and bounded points wording. Detail resolves its event by ID so query refresh updates it.
- No SQL, migrations, sync/edge-function/native/Median/feed_config changes. round_pool_cap untouched. Generated types already contain both par columns and the RPC; they were not hand-edited.

## Files
Production: src/components/profile/hero/HeroShell.tsx; src/pages/ProfilePageV2.tsx; src/features/pro-profile/ProProfileBuildOne.tsx; ProSeasonSection.tsx; ProEventSheets.tsx; proProfileRules.ts; pro-profile.css; new ProParSheet.tsx; src/index.css.
Tests: new src/test/proProfileBuildOneB.test.tsx only,49 cases. No existing test was deleted, renamed, rewritten or had assertions/fixtures changed.
Structural ownership is documented in the new par sheet header and pro-only stylesheet header; existing cross-area AGENTS.md rules are unchanged.

## Checks and counts
Last reported baseline:7,149 tests /631 files (7,146 passed +3 known FS_NOTCH failures). This build adds49 tests /1 file; expected full inventory7,198 /632. This is an expected inventory, not a completed full run.

- `bunx vitest run src/test/proProfileBuildOneB.test.tsx src/test/proProfileBuildOne.test.tsx src/test/proProfileBuildOneRules.test.ts src/test/proProfileSeason.test.tsx --maxWorkers=2`:97/97 passed in4 files. Full output `/tmp/pro-build1b/focused.log`.
- `bunx vitest run --maxWorkers=2 --shard=1/4`:1,870 passed /158 files. `/tmp/pro-build1b/shard1.log`.
- `bunx vitest run --maxWorkers=2 --shard=2/4`:1,727 passed /158 files. `/tmp/pro-build1b/shard2.log`.
- `bunx vitest run --maxWorkers=2 --shard=3/4`:1,832 passed +5 failed =1,837 executed /158 files. `/tmp/pro-build1b/shard3.log` contains the complete failure output.
- Shard4 not run: required stop on the two unexpected Activity failures.
- Executed sharded subtotal5,434 tests /474 files:5,429 passed +5 failed. No full-suite pass claim.
- Preview's newest build entry:2026-11-05T23:55:41Z `build OK`. No manual build/typecheck run.

## Unexpected failures — stopped, tests untouched
`src/test/ac2ActivityFold.test.tsx:216:19` — “opens in place in score order with the not-ready round last, changes the day label and never marks read”.
`src/test/ac2ActivityFold.test.tsx:253:19` — “keeps the fold open across a refetch of the same section”.
Both tool errors: `TestingLibraryElementError: Unable to find an element with the text: Today · 4 golfers posted rounds. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.`

## Three known failures, separately carried
- `src/test/fsNotch1.test.tsx:37:45`: `AssertionError: expected '' to be '0px' // Object.is equality`.
- `src/lib/media/__tests__/fullscreenBand.test.ts:65:18`: expected width251.33333333333334, received251.33333333333331.
- `src/lib/media/__tests__/fullscreenBand.test.ts:75:22`: `AssertionError: expected 98.83333333333331 to be +0 // Object.is equality`.

## Not verified
320px three-view visual checks, live authorized par save/readback and business/friend state interactions were not exercised in the hosted UI. External unmanaged Supabase prevents managed-session injection; no credentials requested. Focused mounted tests verify mocked RPC calls/invalidation, not hosted persistence. No live data was changed.