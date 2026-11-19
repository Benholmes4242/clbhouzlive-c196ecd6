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


## Exact-match fixes and two rulings — 2026-11-19

Scope: live overview only. Fonts explicitly left unchanged following Ben's answer. No SQL, migrations, RPC additions, feed_config or round_pool_cap changes.

### Files and before → after
- `LiveHeroBoard.tsx`: grid 24 / flexible / 38 THRU (50 tee) / 44 TODAY / 40 TOT → 28 / flexible / 40 THRU (48 tee) / 44 TODAY / 44 TOT; gap remains 4. Header 10/700/.08em mute → 9.5/700/.1em dim .42, minimum 22. LEADERBOARD 800/.16em → inherited 700/.1em. Faces 22 hideRing / gap 8 → 26 hairlineRing / gap 10. Name 13/600 → 14/600. THRU 12/600/.78 → 12.5/600/.62, F .42; next tee remains 11.5/600 dim. TODAY 12.5/600 → 12.5/700. Footer 36 minimum, 13/600 mute, 8px vertical padding, 16 chevron → 44 minimum, 14/600/.62, 0 20px padding, 15 ink chevron. TOT unchanged 15/700 score colour. Existing narrow rules retained.
- `LeadersGroup.tsx`: live grid 24 / flexible / 40 / 40 / 40 → board grid 28 / flexible / 40 / 44 / 44; before tee 24 / flexible / 40 → 28 / flexible / 44. Header THRU green → all three .42 grey; TOT centre → right. Live row minimum remains 40; POS 11/800 muted → 12.5/700 ink; faces 22 hideRing/gap8 → 26 hairlineRing/gap10; names 13.5 → 14/600; THRU 13 mute → 12.5/600/.62 (F .42); TODAY 13 → 12.5/700; TOT right aligned 15/700. Live score colour now getScoreColor; non-live values/colour resolver retained. At ≤340 all live names use initialSurname; faces disappear only with THRU/TODAY.
- `liveStates.css`: live-only semantic .42/.62/ink/.78 variables, leaders narrow rules and 700 ink sentence emphasis.
- `PhotoBand.tsx`, `RoundSpine.tsx`: between-round stage-derived afterRound replaces state.round for spine; finished round done/white/ink, next todo, no live node or halo. Both provider shapes tested. Normal live/suspended behavior retained.
- New `livePickSentences.ts`: loaded board/canonical resolveCutDisplay only; projected-cut additions, suspended remaining holes (singular/plural, multiple names), final clubhouse replacement, tied lead and sole-leader preservation. Gaps one–ten translated, eleven and above figures.
- `HeroBoardBand.tsx`, `LivePicksBlock.tsx`: wire sentences and bold name/figure slots; retain base picksIntro except ruled final replacement. Intro mute → .78, 13.5 unchanged.
- `en/tourhub.json`, `en-XA/tourhub.json`: new copy exclusively under overview.live.picks.*, including gap number words. Existing keys/copy retained.

### Test inventory
Baseline 9,221 → 9,236 (+15), all added in `src/test/tourLiveStates.test.tsx` (32 → 47). No existing assertion or case renamed, rewritten or deleted, so no before/after assertion changes.
New cases:
1. board columns use 28/40/44/44 and between-round tee uses 48
2. board faces use canonical hairline and header/row values match the ruling
3. leaders live and non-live grids stay independent
4. leaders before tee use three columns and narrow CSS only drops faces with TODAY
5. provider round 1: finished node done, next todo, no live
6. provider round 2: finished node done, next todo, no live
7. one outside projected cut; score at cut stays inside
8. two outside projected cut
9. all three outside projected cut
10. no cut display or actual cut never appends projected sentence
11. suspended singular hole and plural holes use 18 minus thru
12. suspended multiple unfinished picks; unstarted and finished excluded
13. final clubhouse replaces base with score and gap; numbers through ten then digits
14. tied lead replaces base with clubhouse-level wording
15. sole leading pick retains base leads sentence; unfinished pick retains base

Focused command: `bunx vitest run src/test/tourLiveStates.test.tsx` — 47/47 passed.
Four full-scope shards executed separately, each result read before starting the next:
- `bunx vitest run --shard=1/4` — 2,251 passed, 146.51s; full output `/tmp/tour-exact-shard-1.log`.
- `bunx vitest run --shard=2/4` — 2,277 passed, 163.50s; `/tmp/tour-exact-shard-2.log`.
- `bunx vitest run --shard=3/4` — 2,296 passed, 151.72s; `/tmp/tour-exact-shard-3.log`.
- `bunx vitest run --shard=4/4` — 2,412 passed, 120.42s; `/tmp/tour-exact-shard-4.log`.
Total 9,236/9,236 across 827 files. No failures or isolated reruns. Harness preview build OK; no separate manual typecheck run.

### Browser verification
Public real RSM page `/tourhub` verified at 390 and 320 CSS px. Computed header 9.5/700, actual round-1 grid 28 / flexible / 40 / 44. Board visible, 26px faces present (round 1 deliberately has no TODAY); next-round leaders group before tee uses abbreviated names at 320, retained faces, right-aligned totals. Base picks sentence visibly bolds Välimäki, T17 and 4; .78 prose. Neither width has horizontal overflow. Screenshots retained under `/tmp/browser/tour-exact/`.
RSM was round 1 in play: 10 on course / 137 finished during observation, so no between-round provider shape was observable. Other live-state sentence/paused/between presentations covered by focused fixtures, not claimed as real-data browser checks. Physical iPhone checks remain unverified. External unmanaged authentication prevents signed-in E2E; public Tour flow was exercised successfully.
