# Tour player page rebuild

## Page
- Match the signed-off player-page layout on one dark canvas, including the full Scheffler, results-only Hillier and one-start Tojai shapes. The mock’s three buttons are reference examples, not navigation to add.
- Keep the app’s inherited system font. Omit Compare as explicitly instructed, despite its appearance in the mock. Preserve the live strip unchanged beneath the hero.
- Rebuild the hero, figures, follow control, Next start, form, season chart, game percentiles, hole scoring, member comparison, round-by-round, majors, picks history, results and About sections.
- Hide sections without qualifying data. Use LPGA pronouns, gold for recorded wins, amber only for viewer-related surfaces and red for under-par figures.
- Keep event navigation and the full-season results sheet. Next start opens the existing Your pick sheet with this player preselected; guests use the existing gate. Our record opens the existing record sheet for the player’s tour and season.

## Data and shared rules
- Add the five read hooks under `player-v2/data`, with the header’s `season_year` and `main_tour` governing all season reads and identity.
- Use `display_position` everywhere and only `is_winner` for result wins, including Travelers. Preserve the existing points-race source, scoped to the header season without changing other pages’ defaults.
- Reuse the existing tour/member hole-scoring hooks and picks stat formatting, ordinal and catch rules. Add an optional initial-player choice to YourPickSheet, preserving its existing default behaviour and requiring an explicit submit.
- The live public pick-history response has been inspected: `{ picks: [{ won, name, end_date, position, tournament_id }], member_picks }`. No stored data was changed.
- Put new calculations and copy selection in pure player rules; add English and en-XA copy under `player.v3`. Clean About places and preserve the college stamp.
- Remove superseded player sections and the unused StatsSheet after checking consumers. Leave shared rules with active consumers intact.

## Verification and report
- Add concrete tests for season authority, recorded wins, all sentence/figure variants, section thresholds, scoring arithmetic, round ordering, majors, pick history, place cleaning, pronouns and action navigation.
- Name and quote every removed or rewritten test and explain its replacement. Reconcile totals against the last green baseline: **6,168 tests / 554 files**.
- Run focused tests, then the full suite in four shards using `--maxWorkers=2`; report each shard’s pass count and unhandled errors. Stop and report any unexpected failure, retaining its full output.
- Check the automatic build signal and reachable player pages against the mock. Authenticated end-to-end checks may remain unavailable on this external Supabase project; distinguish public verification from member-only checks.
- Report every touched file and any remaining verification limitation.

## Boundaries
No SQL, migrations, deployed RPC or edge-function edits, guest-browsing changes, review wizard, news, round plots, `feed_config`, native or Median configuration changes. `round_pool_cap` remains 30.