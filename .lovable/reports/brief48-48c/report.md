# Briefs 48–48C — first implementation, not closed

## 1. Files changed

- `roadmap.md`
- `src/features/tourhub/components/overview-v3/ComingUpSlot.tsx`
- `src/features/tourhub/components/overview-v3/HybridHero.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridOverviewShell.tsx`
- `src/features/tourhub/components/overview-v3/HybridPhotoFrame.tsx`
- `src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridComingUp.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPhoto.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridPicks.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridRecap.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridSections.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHybridUpcoming.tsx`
- `src/features/tourhub/components/overview-v3/OverviewTourSwitcher.tsx`
- `src/features/tourhub/components/overview-v3/hybridOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/overviewShells.tsx`
- `src/features/tourhub/components/overview-v3/upcomingOverviewRules.ts`
- `src/features/tourhub/components/overview-v3/useUpcomingOverview.ts`
- `src/features/tourhub/components/tabs/OverviewPageV3.tsx`
- `src/features/tourhub/overview/sections/AlsoThisWeek.tsx`
- `src/features/tourhub/overview/sections/AlsoWeekHybridCard.tsx`
- `src/features/tourhub/skins/SkinsSections.tsx`
- `src/locales/en/tourhub.json`
- `src/styles/tour-overview-hybrid.css`
- `src/test/tourOverviewHybrid48.test.tsx`

Overview-only adapters now provide the photo/glass presentation, five-tour switcher, stage-specific tiles, ten-row board, movers, heat course, pick rail, upcoming and recap lists, Also this week, Coming up and loading geometry. StoryBand moves after Coming up. Shared PhotoBand, HeroBoardRows, MiniBoard, WonChart, UpcomingFacts, UpcomingLastYear and UpcomingCourse defaults remain unchanged. SkinsTable has an opt-in overview grid; its default is preserved. No tournament page file was changed. The tournament-page regression has not yet been run, so unchanged rendering is not claimed as verified.

## 2. Rewritten tests

None. No existing test was deleted, renamed or rewritten. The authorized obsolete overview assertions still need updating and reporting. Original copies of five affected test files were retained under `/tmp/brief48-before` during this turn; temporary files are not durable deliverables.

New file: `src/test/tourOverviewHybrid48.test.tsx`, 37 tests covering tile selection/counts, projected/actual cut authority, round columns, ten-row admission, scorecard opening, country deduplication, final low round/playoff/date rules, upcoming priority, champion/tie/skins identities, pick statuses, recap row limits and switcher dispatch.

## 3. Test results and accounting

Baseline: **10,804 tests / 955 files**, zero failures, from the last reported four-shard result at `6b450d8dc8`.

Executed:

```text
npx vitest run --maxWorkers=2 src/test/tourOverviewHybrid48.test.tsx src/test/buttonBaseClassGuard.test.ts src/test/fixOverflowSource.test.ts
```

Result: **48 passed / 3 files**, zero failures: new overview tests 37, unchanged Button safeguard 2, unchanged overflow safeguard 9. Log: `.lovable/reports/brief48-48c/focused.log`.

The full suite has NOT been run after these edits. The declared addition is +37 tests / +1 file, solely `tourOverviewHybrid48.test.tsx`; the projected suite scope is 10,841 / 956, NOT a verified full-suite result. No pre-existing failures are carried from the baseline and no test failure occurred in the focused run.

Pending commands, sequentially:

```text
npx vitest run --maxWorkers=2 --shard=1/4
npx vitest run --maxWorkers=2 --shard=2/4
npx vitest run --maxWorkers=2 --shard=3/4
npx vitest run --maxWorkers=2 --shard=4/4
```

Latest harness compilation signal: `build OK`, 2026-11-28T07:25:04Z. Intermediate edit-state type/syntax errors were resolved before the focused run; no surviving completed-edit error is reported. No manual build/typecheck was run.

## 4. Captures and visual acceptance

`lovable auth-session --json --self` refused with:

```text
 gateway error (failed_precondition): this project's Supabase backend is user-managed; Lovable does not sign its tokens, so no session can be minted for it
```

No credentials were requested, guest browsing changed, or authentication bypass added.

Browser checks opened `http://localhost:8080/tourhub` at 390×1800 and 320×1800. The route remained `/tourhub`; after the initial observation both widths showed the overview loading shell and zero `[data-overview-photo-band]` elements. These are loading observations, not the requested live/event screenshots and not proof that the route can never settle. No specific live event was verified. Live/completed/upcoming/recap and skins/team fixture captures remain pending; exact-match and overflow acceptance are NOT claimed.

## 5. Open prerequisite and remaining work

Upcoming cup glass-card names are unavailable on the current upcoming path:

- `useUpcomingOverview.ts` supplies individual field/draw players, not the cup teams.
- `useOverviewChampion.tsx:52` disables its leaderboard read in the upcoming state.

The card is omitted rather than filled with invented team names. The open question asks permission for an upcoming-cup-only existing leaderboard read. Other adapters were implemented without waiting for that answer.

Still unfinished: authorized old-layout test rewrites; four sequential shards and full-suite reconciliation; all requested captures and visual acceptance; complete final report. These briefs are not closed.

## 6. Brief corrections and constraints

- Ben ruled below 360px: title 26px, glass name 14px, figure 28px across Briefs 48–48C; live course hardest/easiest gap 10px; other narrow-screen values unchanged.
- Ben ruled every requested/mock weight 800 becomes 700, including glass figures, tiles, board totals, mover places and cup points. Sizes, colours and tracking otherwise remain as specified. Newly defined overview CSS uses 700 for these roles; no existing 800 declaration was changed.
- Recap facts use the named Events/Winners/Most wins trio by calling the existing recapFactCells with card/youngest figures excluded. Recap data/freshness/selection remain unchanged.
- Recap standings flags are conditional on a country already present in a row. No country was invented or additional recap data read added.
- Existing authoring primitives append their own arrow, so overview actions remove a supplied trailing arrow before rendering to prevent duplicates.

No SQL, migrations or migration files; no deployed RPC/edge edits; feed_config untouched; round_pool_cap unchanged at 30; no native/Median configuration edits; no security Fix all. Guest browsing, review wizard, news composition and round plots were not edited; only the explicitly requested StoryBand placement moved.

## Ruling applied — upcoming cup team names (28 Nov 2026)
Ben allowed a cup-only read. `UpcomingCupPhoto` (OverviewHybridPhoto.tsx) mounts only when `state.kind === 'upcoming' && eventType === 'cup'` and calls the unchanged `useTourLeaderboard` (same hook/query key as TournamentPage). Two or more team rows → cup glass card; error or fewer than two → standard STARTS IN countdown card. No other slide mounts the read; tournament page untouched; no new query, no SQL.
New test file `src/test/overviewUpcomingCupRead.test.tsx` (3 tests). Focused run with tourOverviewHybrid48: 40/40. Full four-shard suite still pending.

## Close-out attempt — 28 Nov 2026, stopped before rewrites

### 1. Files changed this attempt

Only this report, `roadmap.md`, and retained diagnostic output `close-audit.log`. No application or test file was changed.

### 2. Rewritten tests

None in this attempt: no tests deleted, renamed or rewritten. The requested old-layout rewrites remain open. The diagnostic audit found 44 failing cases across 13 files; the cases below are recorded rather than silently rewritten.

- `src/test/alsoWeekSection.test.tsx > weekly section membership and heading > two live events count as two live in the section head`
- `src/test/alsoWeekSection.test.tsx > weekly section membership and heading > no live events hide the count`
- `src/test/alsoWeekSection.test.tsx > weekly section membership and heading > viewed event is excluded from rows and live count`
- `src/test/alsoWeekSection.test.tsx > weekly section membership and heading > carousel order and four-event cap remain unchanged`
- `src/test/effectiveCurrentRound.test.tsx > RSM shape names round 3 and DELAYED everywhere > hero kicker reads PGA Tour · ROUND 3 · DELAYED with round 3 tees`
- `src/test/effectiveCurrentRound.test.tsx > RSM shape names round 3 and DELAYED everywhere > normal between-rounds hero still reads AFTER ROUND 3`
- `src/test/effectiveCurrentRound.test.tsx > narrow hero kicker short forms > the photo kicker carries the tour-prefixed short form for the narrow layout`
- `src/test/overviewCloseTheGap.test.tsx > block order > finished: band → champion block → chip row → board`
- `src/test/overviewRhythm.test.tsx > Overview rhythm event selection > fills the next panel and four rows after all above-page exclusions`
- `src/test/overviewRhythm.test.tsx > Overview rhythm event selection > next kicker includes a tag when comingTag supplies one`
- `src/test/overviewRhythm.test.tsx > Overview rhythm story slot > page order is hero band week coming-up slot rankings News`
- `src/test/overviewRhythm.test.tsx > Overview rhythm story slot > page has no slot when no fresh unused story remains`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'in play R3' names the same round and state`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'after R3' names the same round and state`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'R3 delayed' names the same round and state`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'R3 suspended' names the same round and state`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'before the first tee' names the same round and state`
- `src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'final round' names the same round and state`
- `src/test/overviewTourButtons.test.tsx > overview tour chip row > renders one chip per slide in OVERVIEW_TOUR_ORDER, with no chip for a tour without a slide`
- `src/test/overviewTourButtons.test.tsx > overview tour chip row > labels a same-tour pair "{TOUR} · {token}", live first then by start date`
- `src/test/overviewTourButtons.test.tsx > overview tour chip row > drops LIV, the pseudo-major and other unlisted tours from both the chips and the carousel`
- `src/test/overviewTourButtons.test.tsx > overview tour chip row > uses the canonical RailChips with toggle semantics — no new chip styles`
- `src/test/overviewTourButtons.test.tsx > URGENT_FIX close-the-gap: five buttons that fill the row > a Korn Ferry slide from the fallback renders a Korn Ferry chip, fifth`
- `src/test/overviewTourButtons.test.tsx > URGENT_FIX close-the-gap: five buttons that fill the row > chips are flex 1 1 auto, centred and unwrapped; the row scrolls only on overflow`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > hero kicker reads PGA Tour · ROUND 3 · DELAYED after the scheduled first tee`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > hero reverts to after-round wording when a current-round player records a hole before a score arrives`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > hero keeps after-round wording before the one-hour boundary`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > republished future tee times remove the hero delay`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > provider-suspended hero handling remains unchanged`
- `src/test/roundDelayOverview.test.tsx > RSM-shaped derived delay displays > weekly section consumes the batched round-keyed tee while retaining its live count`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > pga rolls from a six-day-old final to recap instead of its 54-day upcoming slide`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > lpga rolls from a six-day-old final to recap instead of its 54-day upcoming slide`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > euro rolls from a six-day-old final to recap instead of its 54-day upcoming slide`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > champ rolls from a six-day-old final to recap instead of its 54-day upcoming slide`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > pgad rolls from a six-day-old final to recap instead of its 54-day upcoming slide`
- `src/test/seasonRecapNextUp.test.tsx > Season recap Next up > the earliest loaded next event supplies the footer, not a later slide`
- `src/test/tourChampionAvatarCandidates.test.tsx > Tour champion avatar candidates > renders the shared .tv-champion block with the narrative and "BY TWO", and drops the photo sentence and Full board link`
- `src/test/tourMoversNoTile.test.tsx > Biggest movers without tiles > (a) has no border-top in the band or its shell`
- `src/test/tourMoversNoTile.test.tsx > Biggest movers without tiles > (f) picks and mover shells both lose the tile`
- `src/test/tourMoversNoTile.test.tsx > Biggest movers without tiles > (g) Brief 44: the three-mover row and the movers shell row both use three equal columns`
- `src/test/tourOverviewGate.test.tsx > Tour overview one load > missing shape draws the hero only`
- `src/test/tourOverviewGate.test.tsx > Tour overview one load > fresh shape draws exactly its flagged shells in page order`
- `src/test/tourOverviewHeroFixes.test.tsx > Tour overview hero fixes > the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE`
- `src/test/tourOverviewPicksChipsFullBoard.test.tsx > no "Full board" link on the photo band > the photo band still opens the tournament page`

### 3. Tests and baseline

Last verified baseline: **10,804 tests / 955 files**, zero failures (`6b450d8dc8`). The two already-added Briefs 48–48C files contribute 40 tests: `tourOverviewHybrid48.test.tsx` (37) and `overviewUpcomingCupRead.test.tsx` (3). Before and after this attempt, the projected full-suite scope remains **10,844 tests / 957 files**; that is NOT a verified full-suite result. No count delta in this attempt.

Diagnostic command (not a full-suite shard):

```text
rg -l 'LiveFacts|LiveHeroBoard|LeadersGroup|HybridHero|SeasonRecap|ComingUp|AlsoThisWeek' src/test -g '*.test.*' > /tmp/brief48-close/affected-files.txt
xargs npx vitest run --maxWorkers=2 < /tmp/brief48-close/affected-files.txt
```

Result: **1,186 executed: 1,142 passed, 44 failed / 81 files (68 passed, 13 failed)**. Retained output: `close-audit.log`. No pre-existing failures carried from baseline. The four sequential shards were not started: the unexpected failure below triggered Ben's stop rule.

### 4. Unexpected failure — stop

```text
FAIL src/test/tourOverviewPicksChipsFullBoard.test.tsx
> no "Full board" link on the photo band
> the photo band still opens the tournament page
AssertionError: expected "spy" to be called 1 times, but got 0 times
❯ src/test/tourOverviewPicksChipsFullBoard.test.tsx:265:20
265| expect(onOpen).toHaveBeenCalledTimes(1);
```

This checks preserved navigation, not an obsolete appearance assertion. `HybridPhotoFrame.tsx:32` renders the photo-band container without an open handler, while line 36 puts `onClick={onOpen}` only on the title. The audit clicks the photo band at test line 264. Briefs 48–48C replace presentation but do not authorise retiring this existing photo tap. No source fix or test weakening was made. The remaining old-layout failures are listed above; they were not rerun or treated as pre-existing.

### 5. Captures

No new screenshots taken: stopped on the unexpected navigation regression before the requested 390/320 event and fixture captures. Earlier captures remain loading-only observations, not acceptance evidence. Live, completed, upcoming, recap, skins and team visual acceptance remains unfinished.

### 6. Brief findings and constraints

All rulings remain accepted: below-360 hero sizes 26/14/28px, maximum weight 700, upcoming-cup-only existing leaderboard read with countdown fallback. No new conflict or ruling was introduced. The unexpected photo-navigation failure requires a user ruling before continuing.

No SQL, migrations, migration files, RPC or edge-function edits; `feed_config` untouched; `round_pool_cap` stays 30. No guest browsing, review wizard, news, round plot or native/Median changes.
