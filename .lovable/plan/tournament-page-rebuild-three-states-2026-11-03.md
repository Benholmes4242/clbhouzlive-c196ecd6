# Tournament page rebuild — three states

## Result
Rebuild the existing tournament detail page to match the signed-off Before, Live and Finished layouts, keeping its current page header and navigation. No header-B/group-2 migration is included.

- **Before:** photo hero → shared picks → drawn tee times → field → last year → course at a glance.
- **Live:** hero → leaderboard → shared picks → unfolding chart → drawn next-round tee times → day numbers → course so far → moments when present.
- **Finished:** hero → champion strip → won chart → final leaderboard → shared picks → week numbers → course how it played → moments when present. Never tee times.
- Remove the Margin, Round of the day, Story, Event info and empty draw/moments placeholders from this page.

## Signed-off details
- Preserve the 340px photo, 20px content inset, 16px bottom inset and specified typography/spacing; inherit the app’s system font rather than the mock’s retired Geist font.
- Use the specified dark canvas, gold winners, amber viewer/pick identity, red under-par figures, and existing bogey/double colours. Keep squircle avatars and existing shared avatar fallback/rings.
- Use **“Novak won it on Friday and Saturday.”** for the finished chart opening, per your ruling; update the requested fixture expectation accordingly.
- Keep overview picks/cards/followed line/record/sheets unchanged visually and behaviorally where the brief freezes them; do not adopt illustrative mock differences into those shared surfaces.
- Missing data omits dependent sections or facts; no invented values or empty boxes.

## Technical implementation
- Keep TournamentPage as the state/data coordinator; add focused section components and pure rules beside it for hero copy, chart/history, tee-group selection, field/last-year, course analysis and day/week figures.
- Reuse existing metadata, leaderboard, pulse/realtime, course-image resolver, drawn-round/tee-time, last-year, event-moment, pick-field/state/result/record and player-follow reads. Add a typed client hook for the already-existing `get_tournament_course_holes`; no database or deployed-function changes.
- Extract the existing private PicksBlock and its event-level composition into a shared owner used by overview and tournament, preserving existing consumers. Reuse ChampionStrip with opt-in tournament presentation/narrative, MiniBoard, FullBoardSheet, AllTeeTimesSheet and existing holes sheet without changing their default consumers.
- Derive gross scores and cumulative round ranks from leaderboard `round_1…round_4` plus course par; shared competition-ranking helpers remain authoritative. Chart labels reserve room and enforce the specified minimum gap.
- Read the existing `course_timezone` metadata for viewer-local tee captions. Omit offset wording when unavailable.
- Hole-analysis `rounds`/`total_players` count distinct players, **not rounds**. Do not relabel them as the mock’s “374 rounds”; a finished caption may use a verified complete-round count from leaderboard round data, otherwise omit that count. Scoring shares come from summed hole distributions.
- Add English and en-XA strings under `tournament.v3`, local semantic tokens and scoped styles. Record ownership in module headers/root architecture rules as appropriate.

## Verification and report
- Add the requested concrete rule tests and state/order/presence coverage, including Mexico Open copy, venue/date cases, board Rn label, chart separation, tee groups/switch/time caption, field/last-year, course and day/week figures.
- Inventory every removed/rewritten existing test by name, quote its assertion and explain the brief-authorized change. Do not rewrite unrelated failures.
- Run focused tests, then four full-suite shards with `--maxWorkers=2`; retain full failing output and stop/report any new failure. Check automatic build output; no manual build/typecheck.
- Known pre-existing failure: `headerB1.test.tsx:97:39`, expected `23px`, received `16px`, stale `/discover` non-condense fixture after HB6. `tourOverviewBand.test.tsx:65–66` has the same suspected stale route but is not a confirmed failure. Neither is authorized for correction here; they may prevent a clean full-suite result.
- Reconcile against last full green **6,298 tests / 564 files** and HB6 candidate inventory **6,326 / 565**, not falsely treating the latter as a passing run.
- Capture and inspect all three populated states with real-component fixtures where external sign-in prevents live verification; verify available sheet interactions. Clearly separate fixture proof from authenticated live readback.

## Boundaries
No guest browsing, review wizard, news, round plots, SQL, migrations, deployed RPCs/edge functions, feed_config, native or Median changes. `round_pool_cap` remains 30. Existing HB6 work and its stopped tests remain independent.