# Tournament page v3 — STOP report

## Status
Implementation saved; **stopped on the first full-suite shard**, without fixing assertions/providers, rerunning tests, running shards 2–4, or claiming completion/parity. Latest automatic build is clean. No manual build/typecheck.

## Completed before stop
- Existing TournamentPage now composes the approved Before/Live/Finished sections, preserving its current Tour header; no group-2/header-B migration.
- Typed client read for the already-existing `get_tournament_course_holes` RPC, selected-event course yardages; added existing `course_timezone` column to metadata read only.
- Shared overview PicksBlock extracted intact into its own file; HeroBoardSection's opt-in picksOnly skips overview board/movement/facts/last-year/leaders while retaining existing picks/cards/member bands and sheets. Explicit tournament id wins over overview context in this opt-in. Default overview callsites unchanged.
- Scoped tournament styles and hero, race chart, field/read-only field sheet, last-year list, grouped tee times, course and day/week number sections; existing MiniBoard/ChampionStrip get opt-in tournament presentation, preserving defaults.
- Course section reuses the exported existing HolesSheet; MomentsSection omits loading/empty boxes; ContestSection/MoveSection/StorySection/EventInfoSection are no longer mounted by TournamentPage. Their files/tests remain, not deleted.
- English and en-XA `tournament.v3` copy. User's naming ruling: “Novak won it on Friday and Saturday.” replaces the brief's Andrew Novak opening in the new fixture expectation. System font retained, not the mock's retired Geist. No photograph replaced.
- Existing special playoff/shortened SituationBand remains; it was not among the brief's removals.

## Exact failures

Full command:
`bunx vitest run --shard=1/4 --maxWorkers=2`

Full output retained at `/tmp/tournament-v3/shard1.log` (231,232 bytes at reporting). No unhandled-error section was reported.

```text
FAIL src/test/roundNotificationOverlay.test.ts > round notifications open the scorecard over Activity > gives a cold round address back chrome with the page fallback and no HCP cell
AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }

Expected object lacks:
+ "condense": true,
+ "scrim": "soft",

❯ src/test/roundNotificationOverlay.test.ts:11:68
```

This is a **newly observed test failure on pre-existing HB6 registry behavior**, not a tournament registry edit. The file and registry were untouched by this task. No earlier failing run for this case was available; do not represent it as previously confirmed.

```text
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > shows the situation block for an awaiting-playoff event (pulse live) and not "Final"
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > shows the situation block for an awaiting-playoff event (pulse completed) and not "Final"
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > tournament page situation block > renders no block for a normal finished four-round event
Error: No QueryClient set, use QueryClientProvider to set one
❯ useQueryClient node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:18:11
❯ Module.usePickField src/features/tourhub/hooks/useTournamentPick.ts:37:10
❯ TournamentPage src/features/tourhub/tournament-v2/TournamentPage.tsx:85:20
```

These three existing page tests mock the former reads but mount TournamentPage without a QueryClientProvider; the new existing-RPC hooks reach useQuery. No provider/mock/expectation correction was made after the failure. Their assertions remain unchanged.

## Pre-existing issues named separately
- **Previously confirmed HB6 failure:** `src/test/headerB1.test.tsx:97:39`, “GI1 non-condense guest capsule remains byte-identical through nav changes”; expected `23px`, received `16px` for `/discover`. Retained in HB6_GROUP1_REPORT.md; not rerun here.
- **Previously suspected, not confirmed:** `src/test/tourOverviewBand.test.tsx:65–66` uses `/discover` as a non-header-B route; HB6 report flags it as likely stale. Not executed in this shard; do not call it a confirmed failure.
- Historical resolved failures from prior tasks are not current failures.

## Tests and inventory reconciliation

Last full green: **6,298 tests / 564 files** (NAV_SQ1).
HB6 subsequent inventory: **6,326 / 565** (+28 hb6Group1), with a failed focused run; not full green.
This task adds **75 tests / 3 files**, producing candidate inventory **6,401 / 568**. This is not a passing-suite total.

New files:
- `tournamentV3Rules.test.ts`: **59** cases, including parameterized number/amount/share/date rules, three-state hero cases, Mexico chart/champion copy, Sunday/LPGA/playoff variants, chart faint identities and spacing, field/returning names, par-five concentration, course tense, tee groups and number facts.
- `tournamentV3Sections.test.tsx`: **13**, including empty sections, completed/no-draw tee omission, both-drawn switch callbacks, tags, scores, chart tiles, field-count provenance.
- `tournamentV3Page.test.tsx`: **3** state-order cases with real MemoryRouter/QueryClientProvider and isolated section mocks.

Focused command 1:
`bunx vitest run src/test/tournamentV3Rules.test.ts src/test/tournamentV3Sections.test.tsx src/test/tourOverviewPicksTeeLine.test.tsx src/test/tournamentPickInsights.test.tsx src/test/yourPickSheet.test.tsx --maxWorkers=2`
**166/166 passed**, 5 files, log `/tmp/tournament-v3/focused.log`.

Focused command 2:
`bunx vitest run src/test/tournamentV3Page.test.tsx src/test/tournamentV3Rules.test.ts src/test/tournamentV3Sections.test.tsx --maxWorkers=2`
**75/75 passed**, 3 files, log `/tmp/tournament-v3/focused2.log`. Overlaps command 1; do not add totals as distinct tests.

|Full shard|Passed|Failed|Executed|Files|
|---|---:|---:|---:|---:|
|1/4|1,593|4|1,597|142 (140 passing / 2 failing)|
|2/4|Not run||||
|3/4|Not run||||
|4/4|Not run||||

**Existing tests deleted, renamed or rewritten: none.** No quoted existing assertion change exists to report. The old Contest/Move/Story/EventInfo tests remain valid for their retained isolated components; Moments empty-state removal currently has no dedicated old test rewrite. Full requested coverage (including all board/colour/door/moments and real-page empty cases) is not complete; no tests may be added/rerun after this stop without continuing authorization.

## Browser checks — limitations, not parity
- An isolated real-section fixture rendered Before/Live/Finished and opened the read-only field sheet; browser reported zero page errors after a temporary fixture build-constant fix. Screenshots inspected under `/tmp/browser/tournament-v3/`.
- The fixture omitted application Tailwind utility CSS, causing oversized avatar images and an improperly positioned sheet. Its photo was null and its composition omitted shared board/picks; its fabricated field/tee data and order were not full-page evidence. **Those screenshots do not prove the signed-off layout**. No app styling was changed to compensate for the fixture.
- The first temporary script timed out because fixture lacked `__BUILD_ID__`; corrected only temporary apparatus. This was not a product failure/test rerun.
- Final visual/full-page/mobile/desktop and authenticated end-to-end proof remains incomplete (external unmanaged sign-in); no bypass, credentials or managed auth used.

## Build
Latest automatic record:
```text
=== build 2026-11-03T18:41:46Z ===
build OK
```
Intermediate new-module import/prop errors were resolved within the multi-file edit before completed checks; no surviving type/build error observed. No manual tsc/build.

## Every touched project file
Product:
- `src/features/tourhub/tournament-v2/TournamentPage.tsx`
- new `src/features/tourhub/tournament-v2/tournamentPage.css`
- new `src/features/tourhub/tournament-v2/data/tournamentRules.ts`
- new `src/features/tourhub/tournament-v2/data/useTournamentCourseHoles.ts`
- new `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`
- `src/features/tourhub/tournament-v2/sections/CourseSection.tsx` (exports existing HolesSheet)
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx` (opt-in only)
- `src/features/tourhub/tournament-v2/sections/MomentsSection.tsx`
- `src/features/tourhub/leaderboard/useTournamentMeta.ts`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- new `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip.tsx`
- `public/locales/en/tourhub.json`, `public/locales/en-XA/tourhub.json`

Tests: the three new files named above.
Documentation: `roadmap.md`, `AGENTS.md`, this new report, approved archived plan `.lovable/plan/tournament-page-rebuild-three-states-2026-11-03.md`.
Memory: `mem://features/tourhub/tournament-v3.md`, index entry; surname ruling recorded.

No SQL/migration/deployed-function/RPC/schema-type/guest-browsing/review-wizard/news/round-plot/feed_config/native/Median edits. `round_pool_cap` remains 30. No publication.