# Brief 21B — scorecard sync

- A `9005c839f7`: round-complete sends roundNumber + tourId (shared `_shared/tourSlug.ts`, the same getTourSlug tournament-live-sync used; live-sync now imports it). No `round` key.
- B `97975db3fb`: `sportradar-sync/scorecards.ts` — one upsert per player round; strokes missing/null/≤0 → strokes and score_to_par null; par kept.
- C `37634bbc4b`: action `scorecard_integrity` (internal secret, body `{ action }` only, via `internalActions.ts`). 21-day closed/completed/complete events, paged 1000-row reads, single-round resyncs, 120s budget, carry-over. Returns and logs `{ checked_tournaments, bad_player_rounds_before, rounds_resynced, carried_over }`. No schedule written.
- Deployed: sportradar-sync, tournament-round-complete, tournament-live-sync.

| Shard | Tests | Files |
|---|---|---|
| 1/4 | 2,517 | 230 |
| 2/4 | 2,528 | 230 |
| 3/4 | 2,717 | 230 |
| 4/4 | 2,800 | 230 |
| Total | 10,562 | 920 |

Against 10,554/917: +8 tests, +3 files (brief21bRoundCompleteBody 1, brief21bScorecardWrites 3, brief21bScorecardIntegrity 4). None removed; no existing test changed. No SQL, no migration.
