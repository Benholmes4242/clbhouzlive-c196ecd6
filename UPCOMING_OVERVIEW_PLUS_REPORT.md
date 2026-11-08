# Upcoming overview plus — verification stopped

## Result
Upcoming-only implementation is in place. Verification is incomplete; no completion claim.
The latest preview signal is `build OK` at 2026-11-08T22:26:26Z.

## Stop
Command:
`bunx vitest run src/test/upcomingOverviewPlus.test.tsx src/test/upcomingLastYearBoard.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewDesignA.test.ts src/test/overviewHeroBStrip.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/tournamentV3Sections.test.tsx src/test/tournamentV3Rules.test.ts src/test/tournamentV3Page.test.tsx --maxWorkers=2`

**214 passed, 1 failed; 215 executed across 9 files.**

Unexpected surviving assertion:
- File: `src/test/tourOverviewPicksChipsFullBoard.test.tsx:179:75`
- Test: `no "Full board" link on the photo band > is absent for live, completed (awaiting-playoff) and upcoming heroes alike`
- Assertion: `expect(document.querySelector('[data-overview-photo-situation]')).not.toBeNull();`
- Tool: `AssertionError: expected null not to be null`

Its fixture supplies neither history nor draw, so the new no-sentence rule returns null. The failing assertion was left untouched under the stop rule. Output preserved in `docs/verification/upcoming-overview-plus/focused.log`.

## Counts
Previous Tour buttons reported baseline: **7,816**.
New `upcomingOverviewPlus.test.tsx`: **23 cases**, all passed.
No tests deleted. Existing updates preserve case counts. Expected full-suite inventory **7,839** (+23); not verified by a complete suite run.
Shard 1: not run. Shard 2: not run. Shard 3: not run. Shard 4: not run. Stopped at focused verification.

## Changed files in this build
- `src/features/tourhub/components/overview-v3/upcomingOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/useUpcomingOverview.ts`
- `src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/HybridHero.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/tournament-v2/sections/CourseGlance.tsx`
- `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`
- `src/features/tourhub/tournament-v2/TournamentPage.tsx`
- `src/styles/hybrid-hero.css`
- `public/locales/en/tourhub.json`
- Tests: `tourOverviewDesignA.test.ts`, `upcomingLastYearBoard.test.tsx`, `tourOverviewMergedAiry.test.tsx`, `overviewHeroBStrip.test.tsx`, new `upcomingOverviewPlus.test.tsx`.
- Report, verification log and roadmap.

## Sources and sharing
Published R1 field/draw uses `useTeeTimesAll`: existing sr_tee_times / sr_tee_time_players / sr_players joins, matching Also this week's source. Before the draw, `usePickField` supplies canonical field and world ranking. Dedupe/intersection uses player IDs; historical winners currently have no ID, so normalized full names are used. The helper prioritizes ID when supplied. Empty/failed reads never confirm defending membership. Follow lists remain member-gated inside `useTourPlayerFollows`.
`CourseGlance` extracts the tournament's existing glanceFacts lead, yardage strip and key. Default bars remain 70px maximum; overview opts into 54px. Existing tournament test files were not edited and passed in the focused run. Course guide navigates to the tournament with `?section=course`; the page waits for the section and uses the existing root-scroll helper.

## Authorized existing-test ledger
No cases deleted. Cases renamed/reworked below retain their count.

`tourOverviewDesignA.test.ts`:
- `uses days and hours under 48 hours out` → `uses only days between 24 and 48 hours out`. Old `[{value:1,label:'days'},{value:23,label:'hours'}]` → `[{value:1,label:'days'}]`; one-largest-unit rule.
- `uses one days box at least 48 hours out` → `uses one days figure at least 48 hours out`. Assertion unchanged `[{value:2,label:'days'}]`; box terminology retired.
- `uses hours and minutes below 24 hours` → `uses only hours below 24 hours`. Old `[{value:3,label:'hours'},{value:42,label:'minutes'}]` → `[{value:3,label:'hours'}]`; one-largest-unit rule.
- `uses one minutes box below one hour` → `uses one minutes figure below one hour`. Assertion unchanged `[{value:38,label:'minutes'}]`; box terminology retired.

`upcomingLastYearBoard.test.tsx`:
- `puts the shared year in the condensed header, not the rows`: old paddingTop `12px`, heading minHeight `24px`, padding `2px 20px`, fontSize `10px` → CSS-owned upcoming-block / upcoming-kicker and three column header children. The 24px column header is distinct from the kicker now.
- `uses the live row tracks and 22px ringless avatar for a non-winner without a flag` → `uses the live row tracks without avatars or flags`: row padding `5px 20px` → `0px`; minHeight `33px` → `31px`; avatar width `22px` / border `''` / two name-cell children → no image / one name-cell child. Faces removed by brief.
- `keeps the winner the same size with a 14px trophy in the position cell and gold score/band` → `keeps the winner the same size with a 13px gold trophy and canonical score without wash`: padding `5px 20px` → `0px`; height `33px` → `31px`; trophy width/height `14` → `13`; fill GOLD_DARK → LEADER_GOLD `#FBBC2E`; score `rgb(212,160,23)` → getScoreColor(-20,'dark'); wash `rgba(251,188,46,0.1)` → `transparent`.
- Parameterized `preserves the non-winner score colour for %s` (E/+2/−2): old under-red else `#FFFFFF` → `getScoreColor(value,'dark')`, as brief explicitly requires. Case names/count unchanged.

`tourOverviewMergedAiry.test.tsx`:
- `tightens upcoming first tee and last-year rows without changing their contents` → `omits undrawn unknown facts and uses the upcoming history grammar`: old facts padding `10px 20px` → absent row for unknown/undrawn fixture; heading padding `2px 20px` → upcoming-kicker; row padding `5px 20px` → distinct upcoming-last-header plus zero-padded row. New facts only show qualified values.

`overviewHeroBStrip.test.tsx`: no assertion/case changes. Added empty `usePickField` export to existing hook mock for new batched read dependency.

## Screen/device checks
Upcoming 320/390/430 after-draw, before-draw, no-picks/no-follows, no-history, HOURS, MINUTES and tournament course comparison: **not run following stop**.
Authenticated live readback/navigation is also unverified (external unmanaged authentication).

## Protected scope
No SQL, migrations, deployed RPC/edge changes, feed_config or native/Median changes. round_pool_cap untouched. No guest browsing, review wizard, news or round plot edits.
