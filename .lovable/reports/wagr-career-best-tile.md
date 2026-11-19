# WAGR BEST RANK tile — implemented, verification stopped

## Changes
- Extracted the existing Career rank/week/id sorting expression into `amateurCareerHigh` in rankingTabRules.ts. Both the tile and Career call it. Career output/order, chart, header and three other tiles unchanged.
- Tile formats the loaded history best with wagrOrdinal; loading/failed/empty history uses summary.best_rank. No new summary display elsewhere; the existing SettingsWagrCard display remains unchanged (outside the specified ProfileRankingTab change).
- No SQL, migration, sync, database column, feed_config or round_pool_cap changes.

## Test accounting
Requested before: 9,165. Last passing before: 9,169, reconciled by the four `SCORECARD_TILE · NET follow-ups` cases in scorecardTileRedesign.test.tsx (provider allocation, selects, held row, failed fallback), documented in scorecard-net-score-row.md. The later title-only rename added zero cases.
Expected after: 9,172 = 9,169 + three new cases. Full suite not executed because focused verification failed. wagrRankingTab.test.tsx: 27 → 30 cases. No tests deleted or renamed.

Two authorised assertion updates, both formerly `expect(screen.getByText('312th')).toBeInTheDocument();`, now expect `318th`:
1. `Tab renders Lewy headline, movement, tiles and foot` — fixture history minimum is 318; old assertion encoded summary 312.
2. `A failed events read removes only the events section` — history should independently settle to 318; old assertion encoded summary 312. This updated assertion exposed the stop below.

Added:
- `BEST RANK uses Ben’s history minimum 1306 rather than summary 1944` — passed.
- `BEST RANK falls back to summary 1944 with no history rows` — passed.
- `BEST RANK and the Career-high line share amateurCareerHigh` — passed (requested static contract).

## STOP
Command: `bunx vitest run src/test/wagrRankingTab.test.tsx src/test/wagrCareer.test.tsx --maxWorkers=2` (full output `/tmp/wagr-career-best-focused.log`). Result: 45 passed / 1 failed out of 46; Career 16/16, Ranking 29/30.

File/line: `src/test/wagrRankingTab.test.tsx:213:17`.
Case: `A failed events read removes only the events section`.
Error: `TestingLibraryElementError: Unable to find an element with the text: 318th. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.`
Duration: 23ms. DOM at failure shows 312th fallback, no chart/movement, and dash career totals: the test awaits the summary headline, not the history settling. This is evidence of an observer-timing issue, not proof of a source defect; no further assertion/timing changes applied after the failure.

Required isolated rerun: `bunx vitest run src/test/wagrRankingTab.test.tsx --maxWorkers=2` (full output `/tmp/wagr-career-best-isolated.log`). Reproduced at the same line with the same error: 29 passed / 1 failed, failing case 15ms.

Four shards not started. No manual typecheck run (harness owns typechecking). Ben’s actual profile/iPhone check remains outstanding. Proposed ruling: allow this one updated case to await `318th` before its existing assertion, so the history read settles independently of the headline; no expected-value changes.