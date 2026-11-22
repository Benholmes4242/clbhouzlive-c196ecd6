# TOUR ROUND NUMBER — effective current round

## Rule
`effectiveCurrentRound(provider, rows)` in `liveStateRules.ts` = min(provider, highest scored round of any active row + 1), at least 1, never above the provider.
Addition (reported): an empty/unloaded board (no active rows) keeps the provider round, so the hero never flashes "ROUND 1" while its board loads. Found in the capture harness.

## Shared state
`overviewRoundState` applies the rule to its round and exposes `currentRound`. When the round is delayed, `afterRound` is null (a delayed round is never also "after" the previous one); tees are still read for the delayed round. `stage` is still `between` (round 2) internally so the board shows round 3 tee times — reported, not changed further.
RSM: currentRound 3, afterRound null, delayedRound 3 → hero "PGA Tour · ROUND 3 · DELAYED", picks "ROUND 3 · DELAYED".

## Consumers changed
- HybridHero: passes the effective-round state to the round state, sentence and PhotoBand (spine, kicker).
- HeroBoardBand: caps `currentRound` with its entries, so PicksBlock, PicksSheet, movement bands and LeadersGroup all receive it.
- LeadersGroup: takes round and delay from the shared state (`roundState`); a delayed round forces that round's group. Wording unchanged ("Round 3 · Delayed"; the tee time is replaced by Delayed, as before).
- AlsoWeekEvent / AlsoThisWeek / useAlsoWeekData: per-event `overviewRoundState`; the existing batched tee read now fetches rounds 1..provider in the same single query so the effective round's tee is available.
- Feed TourSlot / slotLeadRules: effective round for kicker and lead; delayed kicker "ROUND 3 · DELAYED". One cached `useTeeTimesAll` per live slot (same key as the overview, deduped) — a new read, needed for DELAYED; reported.
- Admin TourDataSection: raw value now labelled "Provider round".
- PhotoBand narrow kicker (≤340px, same breakpoint as Our picks): AFTER R3, R3 · DELAYED, R3, R3 · SUSPENDED (suspended short form is an addition), FINAL ROUND unchanged. Short form is drawn via CSS from `data-kicker-short`, so textContent is unchanged.

## Consumers without rows (not changed)
| Consumer | Today for RSM | Needs |
|---|---|---|
| TourIsland / tourIslandRules / TourSideMenu | "Live · Round 4" | board rows per live event |
| LiveNowStrip / usePlayerState | "Round 4" suffix | field rows (has only the player's own row) |
| usePredictionTracker | round 4 from prediction round info | field rows |
| LinkedProSections | provider round 4 | field rows |
| useOverviewNewsData (liveNewsRounds) | round 4 for live-story boards | field rows (reads only story players) |
| OnTheCourse CutWatchLine | cut display keyed to provider round 4 (projection hidden) | field rows |
| AlsoThisWeek `statusFor` | "Live · Round 4" (only referenced by a test) | entries |
| HybridHero.utils deriveHeroState | state.round 4 (capped downstream by HybridHero/HeroBoardBand) | — |

## Tests
New `src/test/effectiveCurrentRound.test.tsx`, 18 tests: six worked cases + empty board; shared state RSM and normal between; hero, picks, Leaders' Group, Also this week, feed kicker and feed lead for RSM; normal between hero AFTER ROUND 3; short forms; data-kicker-short.
No existing test edited, renamed or deleted. No existing test pinned "AFTER ROUND 3" for the provider-ahead case.

## Suite
Before (last report, 09cfef26e1): 9,835 tests / 870 files.
After: 2,416 / 2,426 / 2,449 / 2,562 = 9,853 tests / 872 files, all passed.
Tests: +18 = effectiveCurrentRound.test.tsx. Files: the tree at 09cfef26e1 held 871 test files and all 871 ran now, plus the new file = 872. The earlier "870" figure cannot be reconciled from the logs available (they were not retained); flagged.

## Captures (fixtures, placeholder data, not live/phone)
`captures/rsm_390.png`, `rsm_320.png`, `between_390.png`, `between_320.png`, `kicker_matrix_320.png`, `metrics.json`. RSM: hero/picks/leaders/also/feed all round 3 and DELAYED; between: AFTER ROUND 3. No horizontal overflow; no kicker ellipsis at 320 for PGA, LPGA, DP World, PGA Tour Champions, Korn Ferry in after/delayed/round/final.
Between rounds, Also this week and the feed still read "FINAL ROUND" (round 4 of 4) — existing behaviour, unchanged.
