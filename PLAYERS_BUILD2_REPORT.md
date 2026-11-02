# Players page — Build 2 of 3: "Who keeps their card?" picks

## Files
- New: `players-v2/picks/linePicksRules.ts` (state, window, shares, dates, sentences), `picks/useLinePicks.ts` (get_line_picks, get_line_pick_result, get_line_pick_callers(…, 5) settled-only, optimistic set_line_pick with rollback, 60s stale, invalidation), `picks/LinePicksCard.tsx` (Open / Closed / Settled).
- `front/FrontPage.tsx`: card rendered straight after each featured LineCard whose stake has `picks`.
- `playersRules.ts`: `Stake` gains optional `picks`, `picks_title`, `settled_at`; `ClockEvent` gains `endDate`.
- `data/useTourRace.ts`: events carry `end_date`.
- `data/usePlayersRanking.ts` + `PlayersTab.tsx`: standings read the race's `season_year`; the query waits while the race read is pending; the walk-back-one-season fallback runs only when there is no race row (or the race read fails).
- `guest/guestGateStore.ts`: `GuestAction` gains `'pick'`.
- Types: already regenerated in `types.ts` (all four RPCs, `tour_line_picks`, new columns); no casts.

## Notes
- Live: PGA 100 line shows Open ("Closes Thu 19 Nov"); LPGA 80 line is configured too.
- Event names that already start with "The" are not doubled ("Settled after the RSM Classic").
- Settled verdict uses the RPC `result` ('kept'/other) and falls back to `final_position ≤ L`.
- Error toast: `toast.error("Couldn't save your pick. Try again.")` (existing toast helper; wording mine).
- Analytics: `tour_line_pick_set`, `tour_line_pick_blocked` (guest|max|closed|error), `tour_line_picks_viewed`, `tour_line_pick_caller_tapped`.

## Tests
- New `src/test/linePicks.test.tsx` (18): state resolution ×5; Open: six rows + THE LINE, shares, toggle RPC args + flip, fourth pick blocked, guest gate + no RPC, out-of-window appended; open foot wording; Closed: no buttons, chips, copy; Settled: verdict order, KEPT kicker, viewer caller after top five; summary sentences; helpers; usePlayersRanking race season ×2.
- No existing test changed. `playersPage.test.tsx` failed 9/12 mid-build because the standings briefly waited on a field its race fixture lacks; fixed in `PlayersTab` (reads `race.season_year`), no test edit.

## Totals
Shards: 1,479 + 1,419 + 1,465 + 1,484 = **5,847/5,847 across 538 files**. Against 5,829/537: +18 tests, +1 file (linePicks.test.tsx). Typecheck clean. No SQL, migrations, RPC/edge, `feed_config`, `round_pool_cap` or native changes.
