# Upcoming overview plus — authorised repairs and verification

## Result
Upcoming-only implementation is in place. Verification is incomplete; no completion claim.
The latest available preview signal is `build OK` at 2026-11-08T22:48:58Z. No production changes in this repair turn.

## Stop
Command:
`bunx vitest run src/test/upcomingOverviewPlus.test.tsx src/test/upcomingLastYearBoard.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewDesignA.test.ts src/test/overviewHeroBStrip.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/tournamentV3Sections.test.tsx src/test/tournamentV3Rules.test.ts src/test/tournamentV3Page.test.tsx --maxWorkers=2`

**Authorised repair applied; fresh focused run: 215/215 passed across 9 files.**

Exactly one line changed in `src/test/tourOverviewPicksChipsFullBoard.test.tsx:179`, case `is absent for live, completed (awaiting-playoff) and upcoming heroes alike`:
- Old: `expect(document.querySelector('[data-overview-photo-situation]')).not.toBeNull();`
- New: `expect(document.querySelector('[data-overview-photo-situation]')).toBeNull();`
- Reason: no history and no draw correctly omit the upcoming sentence.
No other change in that file; no assertion/case count delta.
Original stopped output remains in `docs/verification/upcoming-overview-plus/focused.log`; fresh output is `focused-repair.log` beside it.

### CB57 authorised repair and fresh verification
Only the authorised assertion lines changed in `cb57HeroBoardRemovals.test.tsx`, case `renders an empty upcoming band without a placeholder or reserved height`:
- Old: `expect(view.container.firstElementChild?.childElementCount).toBe(0);`
- New: `expect(view.container.firstElementChild?.childElementCount).toBe(1);`
- Added: `expect(view.container.querySelector('[data-overview-facts]')?.querySelectorAll('[data-upcoming-fact]')).toHaveLength(2);`
The fixture has FIELD 1 and PAR 72. Both subsequent height assertions remain unchanged; no other change to this file and no production edits in this repair turn.
`bunx vitest run src/test/cb57HeroBoardRemovals.test.tsx --maxWorkers=2`: **9/9 passed**.
Fresh focused command above: **215/215 passed**.
Previous stopped runs remain preserved; they are not included in the fresh totals below.

## Counts
Previous Tour buttons reported baseline: **7,816**.
New `upcomingOverviewPlus.test.tsx`: **23 cases**, all passed.
No tests deleted, added, renamed or recounted in either repair. Full-suite total before **7,816**, after **7,839**, delta **+23**, entirely the previously added `upcomingOverviewPlus.test.tsx` cases.
Fresh separate commands, strictly sequential, restarting at shard 1:
- `bunx vitest run --shard=1/4 --maxWorkers=2`: **2,028/2,028 passed**.
- `bunx vitest run --shard=2/4 --maxWorkers=2`: **1,874/1,874 passed**.
- `bunx vitest run --shard=3/4 --maxWorkers=2`: **2,002/2,002 passed**.
- `bunx vitest run --shard=4/4 --maxWorkers=2`: **1,935/1,935 passed**.
**7,839 executed, 7,839 passed, zero failures; 684 files passed.** Neither permitted known failure appeared. No linkedHandicapState isolated rerun was needed.
Logs: `docs/verification/upcoming-overview-plus/cb57-authorised.log`, `focused-final.log`, and `shard1-final.log` through `shard4-final.log`.

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

`tourOverviewPicksChipsFullBoard.test.tsx`: authorised one-line `.not.toBeNull()` → `.toBeNull()` repair detailed above; case name and count unchanged.

`overviewHeroBStrip.test.tsx`: no assertion/case changes. Added empty `usePickField` export to existing hook mock for new batched read dependency.

## Screen/device checks
Actual PhotoBand, RailChips, UpcomingFacts, YourUpcomingPlayers, UpcomingLastYear, UpcomingCourse and CourseV3Section fixtures loaded real styles and English translations at **320/390/430**. Browser apparatus router/translation module mismatches were corrected only in the temporary script; final captures have **zero page errors, zero horizontal overflow**.
- Drawn: five followed rows with local tee times, overflow count, historical board and 18 course bars checked.
- Before draw: five followed rows, no promised tee times.
- No picks/no follows/no history: personalized/history blocks absent; no sentence and no intervening empty heading.
- No history with draw: first-tee sentence visible.
- HOURS/MINUTES: single `3 HOURS` and `38 MINUTES` figures visible.
- Tournament course: actual CourseV3Section retains 18 bars, max70px and longest/shortest tiles; overview max54px.
- Fixture wrapper equals photo height:356.594px with sentence /328.703px without at all three widths in these fixtures.
Screenshots: `/tmp/browser/upcoming-final/{draw,before,none,nohistory,hours,minutes,tournament}_{320,390,430}.png`. Measurements persisted in `docs/verification/upcoming-overview-plus/screens-results.json`.
**Limits:** fixtures intentionally omit real pick cards, so the requested populated-picks screen and integrated OverviewHero carousel/cross-fade/frame floor remain unverified. Wrapper equality is not proof of the full carousel frame. No pre-extraction screenshot exists, so tournament presentation is regression-tested, not a before/after pixel comparison. Live authenticated data/navigation remain unavailable with external unmanaged authentication. These checks are for Ben's device, not claimed complete.

## Protected scope
No SQL, migrations, deployed RPC/edge changes, feed_config or native/Median changes. round_pool_cap untouched. No guest browsing, review wizard, news or round plot edits.
