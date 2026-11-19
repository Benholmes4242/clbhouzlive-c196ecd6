# TOUR OVERVIEW · LIVE STATE REDESIGN (all seven states)

Scope: Tour overview live phase only (state.kind 'live' | 'suspended'). Upcoming, completed and Also this week untouched. No SQL, no migration, no new RPC, feed_config untouched, round_pool_cap untouched.

## Built
- `overview-v3/liveStateRules.ts` (pure): `betweenRounds` (both provider shapes), `liveStage` (seven states), `liveFactCells`, `leadCell`, `holeAverages`/`formatHoleAvg`/`holeAvgColor`, `initialSurname`, `livePicksHeading`.
- `overview-v3/LiveOverviewSections.tsx`: `useLiveOverview` (existing reads only: tournament meta, course holes, `get_tournament_hole_analysis`, sr_tee_times round 1), `LiveFacts`, `LiveFirstTees`, `LiveCourse`.
- `HybridHeroBands/LiveHeroBoard.tsx`: live-only board (THRU · TODAY · TOT; round 1 without TODAY; R{n} TEE between rounds; grey THRU when suspended; ≤340px initial+surname and no faces). Reuses HeroRoundPanel / ScorecardSheet / tie roles. Shared `HeroBoardRows` unchanged.
- `HybridHeroBands/LivePicksBlock.tsx`: live picks rows; shared `PicksBlock` unchanged.
- `LeadersGroup`: opt-in `live`/`suspended` presentation (dim kicker, no rule, no THRU/TODAY before tee-off, "Stopped"); selection/reads unchanged.
- `UpcomingCourse`: opt-in `live` extras (kicker, lead, fourth averages row with hardest/easiest dots, key line); default unchanged.
- Hero: AFTER ROUND n kicker, first-tee time in the leader slot before anyone tees off, suspended pause mark on the spine (overview only via `pauseSpine`).
- Order in live phase: facts → movers → board (or round 1 tee times) → leaders' group → course → picks.
- Copy: `overview.live.*`, `overview.hero.afterRound`, `overview.leadersGroup.stopped` (en, en-XA); leaders' group "On the course" → "On course" per mock.

## Rulings / flags
- Between-rounds state with no cut: SCORING AVG is already a state-3 cell, so the "use SCORING AVG instead" fallback leaves three cells rather than duplicating it.
- `betweenRounds` (b) requires the round to be named explicitly (its round column or `today_round`), so a stale unlabelled `today` with stale thru 18 reads as in-play rather than a finished round.
- Which provider shape RSM showed tonight: NOT diagnosed — I can't read the live rows (no SQL). Both shapes are covered by tests.
- Pick intro sentences: the existing `picksIntro` sentence is kept; the mock's state-specific sentences (projected cut, holes to finish, clubhouse) were not built because the brief gives no rule for them. Needs a ruling.
- Spine in state 3 (mock shows R1 done, no live node) is unchanged: between rounds via shape (a) the spine still marks the new round live. Needs a ruling.

## Tests
- Added `src/test/tourLiveStates.test.tsx`: 32 cases. No existing test deleted, renamed or rewritten.
- Focused overview files: 53 files, all passing after fixing one guard failure in my own new code (`buttonBaseClassGuard` flagged a Button className in LiveOverviewSections; changed to inline style).
- Typecheck: clean.
- Shards (sequential): 2,251 / 2,277 / 2,296 / 2,397 = 9,221 = 9,189 + 32.
- Not checked: browser/iPhone comparison with the mocks, live RSM data.
