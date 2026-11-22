# Tour overview kicker and shared round state — verification stopped

## Implemented scope, not a completion claim

- PhotoBand's existing kicker row is now the title column's first child, immediately before h1. Its styles/minHeight are retained; h1 uses OVERVIEW_TITLE_GAP, and the outer/right columns retain bottom alignment. No geometry constants or band-height code changed.
- Added pure overviewRoundState in liveStateRules and useOverviewRoundState, preserving betweenRounds, exact-round starter matching, earliest tee and >60-minute delay. Tournament round status precedes meta fallback. Delay remains a separate field, not a LiveStage.
- HybridHero and useLiveOverview consume that hook. The full tee-time read retains useTeeTimesAll's existing key and enabled rule. HeroBoardSection passes event status/clock, uses the delayed round for pick tees, and forwards the shared state to LivePicksBlock.
- LivePicksBlock opts into shared-state headings and delayed pre-start row branches. Added English delayed / delayedShort keys. After-round headings use the existing hero afterRound key; first-tee headings use existing round and firstTee keys. Legacy livePicksHeading calls without the shared-state argument retain their prior output and passing tests.
- LeadersGroup and AlsoWeekEvent source/logic were not changed. No SQL, migrations, feed_config, pool cap, auth or guest operations.

Ownership is documented in the new hook's header. The attempted root AGENTS.md pointer was rejected by its size limit; no root rules were condensed or changed.

## Exact unexpected test stop

Command:

```text
./node_modules/.bin/vitest run src/test/overviewRoundParity.test.tsx src/test/roundDelayOverview.test.tsx src/test/tourLiveStates.test.tsx src/test/tourOverviewHeroFixes.test.tsx
```

Full output: focused.log.

```text
FAIL  src/test/overviewRoundParity.test.tsx > overview hero and picks share one round state > 'before the first tee' names the same round and state
AssertionError: expected 'ROUND 1 · First tee' to be 'ROUND 1 · FIRST TEE' // Object.is equality

Expected: "ROUND 1 · FIRST TEE"
Received: "ROUND 1 · First tee"

❯ src/test/overviewRoundParity.test.tsx:82:75
expect(view.container.querySelector('.live-picks-full')?.textContent).toBe(fixture.picks);
```

The new fixture expected capitalised textContent, whereas the existing overview.hero.firstTee key supplies mixed-case “First tee” (presentation CSS uppercases it). No expected text, locale key or component was changed after this failure, and there was no rerun.

## Original typing error — resolved by the follow-up below

Latest harness entry, 2026-11-22T09:32:15Z, retained in build.log:

```text
src/test/overviewRoundParity.test.tsx(112,63): error TS2352: Conversion of type '{ name: 'R3 delayed'; kind: 'live'; round: 3; rows: readonly [BoardEntry]; tee: "2026-11-21T14:10:00Z"; hero: 'PGA Tour · ROUND 3 · DELAYED'; picks: 'ROUND 3 · DELAYED'; status: "inprogress"; }' to type '{ readonly name: "in play R3"; readonly kind: "live"; readonly round: 3; readonly rows: readonly [BoardEntry]; readonly status: "inprogress"; readonly tee: "2026-11-21T14:10:00Z"; readonly hero: "PGA Tour · ROUND 3"; readonly picks: "ROUND 3 · LIVE"; } | ... 4 more ... | ...' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Type '{ name: 'R3 delayed'; kind: 'live'; round: 3; rows: readonly [BoardEntry]; tee: "2026-11-21T14:10:00Z"; hero: 'PGA Tour · ROUND 3 · DELAYED'; picks: 'ROUND 3 · DELAYED'; status: "inprogress"; }' is not comparable to type '{ readonly name: 'R3 delayed'; readonly kind: 'live'; readonly round: 3; readonly rows: readonly [BoardEntry]; readonly status: 'scheduled'; readonly tee: "2026-11-21T14:10:00Z"; readonly hero: 'PGA Tour · ROUND 3 · DELAYED'; readonly picks: 'ROUND 3 · DELAYED'; }'.
Types of property 'status' are incompatible.
Type '"inprogress"' is not comparable to type '"scheduled"'.
```

This is the new test's narrow fixture union/cast at line112, not app code. It remains unmodified under the stop ruling. An intermediate app-input typing error was corrected before tests; the harness subsequently reported build OK at09:31:17Z, but that is NOT the latest state because the fixture error above survives.

## Test inventory and outcomes

Before: last full-suite baseline **9,747/9,747 tests /864 files**, from News bottom clearance.

After inventory: **9,766 tests /865 files**, exactly +19 cases/+1 file: src/test/overviewRoundParity.test.tsx. This is not a verified full passing suite. No existing test file was deleted, renamed, rewritten or edited.

Focused run: **90 passed /1 failed of91 tests**, three passing files /one failing file.
- tourLiveStates:47/47 unchanged.
- roundDelayOverview:12/12 unchanged, including exact existing hero output and recovery assertions.
- tourOverviewHeroFixes:13/13 unchanged.
- overviewRoundParity:18/19, failed case quoted above.

New case inventory:
1–6. `'in play R3'`, `'after R3'`, `'R3 delayed'`, `'R3 suspended'`, `'before the first tee'`, `'final round'` names the same round and state.
7. kicker is the title column first child immediately before h1.
8. delayed pick keeps current position/score and published delayed-round tee.
9. delay with no pick tee keeps position/score without an invented tee.
10–12. delay automatically ends on starter /status /future tees without remounting.
13. tournament round status wins over scheduled meta.
14. scheduled tournament status wins over in-progress meta.
15. null tournament status falls back to meta.
16. only more than sixty minutes delays the current round.
17–19. after R3 /R3 delayed /before the first tee has one enabled tee key and one read for photo plus live sections.

The three query-identity cases passed using real React Query observers and the real useTeeTimesAll implementation, with a mocked read boundary: one sr_tee_times read and one exact existing round key per fixture. This is not live network verification.

No full-suite shard was run after the unexpected focused failure. No manual build/typecheck was run. Required four sequential full-suite commands remain unexecuted.

## Report-only section audit — source-derived, not browser-observed

These statements follow the six authored test fixtures and retained section rules. Picks/hero text was observed in the focused tests (except the first-tee expected-case failure); board/facts/course/LeadersGroup/weekly captions below are source-derived and remain to be exercised together in browser fixtures.

| Fixture | Hero | Picks full heading | Live board | Live facts | Course |
|---|---|---|---|---|---|
| In play R3 | ROUND3 | ROUND3 ·LIVE | THRU/TODAY/TOT forR3 | ON COURSE/FINISHED/LOW ROUND/MADE CUT forR3 with cut_round2 | THE COURSE ·ROUND3 |
| AfterR3, provider stillR3 | AFTER ROUND3 | AFTER ROUND3 | R4 TEE/TOT if valid next tees; no-tee layout otherwise | LOW ROUND/SCORING AVG/UNDER PAR plus available cut forR3 | THE COURSE ·ROUND3; played wording when analysis supports it |
| R3 delayed, noR3 scores | ROUND3 ·DELAYED | ROUND3 ·DELAYED; narrow DELAYED | Existing between stage: R3 TEE/TOT if valid tees | Existing between facts describe finishedR2 | THE COURSE ·ROUND2 |
| R3 suspended | ROUND3 ·SUSPENDED | ROUND3 ·SUSPENDED | Dim THRU/TODAY/TOT forR3 | TO FINISH/FINISHED/LOW ROUND plus cut or average forR3 | THE COURSE ·ROUND3 |
| Before first teeR1 | ROUND1; FIRST TEE slot | ROUND1 ·First tee; CSS uppercase | First-tee list replaces the score board | FIELD/PURSE/PAR/YARDS when present | UpcomingCourse default THE COURSE, no round suffix |
| Final roundR4 | FINAL ROUND | FINAL ROUND ·LIVE | THRU/TODAY/TOT forR4 | ON COURSE/FINISHED/LOW ROUND/LEAD orTIED | THE COURSE ·ROUND4 |

**Disagreements flagged without repair:** delayed hero/picks nameR3 while existing between-stage facts/course describe completedR2. The separate delayedRound field does not change existing stage switches; no new LiveStage was introduced. Between-round board intentionally names next-round tee times, while its score context is the finished round. First-tee course has its preserved no-round default. No full browser audit was reached.

**Leaders' Group:** independently selects leadersBaseRound and advances only when the selected group AND all current leaders complete that round, the next draw exists, and the next draw contains a current leader. For authored in-play/suspended/final fixtures, a matching selected draw reads Round3 ·On course /Round3 ·Stopped /Round4 ·On course. AfterR3 with a valid qualifyingR4 draw it reads Round4 ·Tees off …; without that draw it retains Round3 ·Finished for explicit completedR3 cards. Delayed fixture beforeR3 can select baseR2, then advance toR3 only with qualifying publishedR3 membership; selectedR3 reads Round3 ·Delayed. Before the first tee the section's own field-start gate hides it. Exact selection cannot be claimed without the fixture draws/browser read.

Ben's screenshot `AFTER ROUND3` versus `Round3 ·Tees off Sat11:00` cannot be attributed to missingR4 tees alone: missingR4 can keep selection atR3, but explicit completedR3 cards would produce Finished, not Tees off. Tees off additionally means the selectedR3 group's per-round played data did not satisfy groupState. It is the Leaders' Group's independent selected-draw/per-group rule; the actual screenshot's draw and per-round rows were not supplied/read, so which gate blocked handover remains unverified.

**Also this week:** independently derives its caption from slide type/current round, with its existing delayed opt-in. Equivalent live-shaped fixtures read ROUND3 in play; ROUND3 afterR3 (no afterRound derivation, disagreement); ROUND3 ·DELAYED when the exact current-round earliest tee supports it; ROUND3 on a suspended live-type slide (no suspended caption branch, disagreement); ROUND1 before first tee (if represented as live); FINAL ROUND forR4. Actual overview selection excludes the primary hero event; this is a same-payload rule comparison, not a claim that the hero event is simultaneously displayed in that rail. No sibling logic changed.

## Outstanding verification / blockers

- Resolve the named new test expectation/casing and its line112 fixture typing error under an explicit ruling; no repairs or reruns were made after the failure.
- Run the four sequential full-suite shards and retain their entire logs.
- Capture hero plus picks for RSM-style tied after-round, delayed and in-play states at390/320.
- Measure kicker-bottom to h1-top for one face, three faces, no faces/team initials, first tee, upcoming countdown, one-line and two-line titles at390/320. Only structural placement is tested so far; no pixel-distance claim.
- Finish the combined browser section audit. No temporary capture page was created or retained in this stopped turn.

## Preview type repair — 22 November 2026

The follow-up explicitly requested fixing preview type errors. Changed only `src/test/overviewRoundParity.test.tsx:47`:

```ts
// Before
type Fixture = (typeof fixtures)[number];
// After
type Fixture = Omit<(typeof fixtures)[number], 'status'> & { status: string };
```

Reason: the recovery fixture intentionally changes round status; widening just that type allows the existing line112 cast to describe that valid input. No runtime inputs, test names or assertions changed. No test deleted, renamed or rewritten. In particular, the affected case still asserts `expect(view.container.querySelector('.live-picks-full')?.textContent).not.toContain('DELAYED')`; the reported first-tee casing assertion is unchanged.

Verification command:

```text
./node_modules/.bin/vitest run src/test/overviewRoundParity.test.tsx -t 'delay automatically ends on status without remounting'
```

Result: **1 passed /18 filtered-skipped of19 cases**, one file. Full output in type-fix-test.log. Latest harness entry: **build OK**, 2026-11-22T09:35:03Z; retained in type-fix-build.log. No manual build/typecheck.

Inventory before/after this repair: **9,766 tests /865 files**, delta zero; last fully passing full-suite baseline remains9,747/864. The casing stop remains open; its failing case, full shards and captures were not rerun. This resolves only TS2352, not the remaining overview verification.
## Resumed verification (22 Nov)
Captures: captures/{after3tied,delayed,inplay}_{390,320}.png, metrics.json. Real HybridHero + LivePicksBlock with cache-seeded fixtures, stubbed backend.
| fixture | hero kicker | picks heading | kicker→title gap | overflow |
|---|---|---|---|---|
| after R3, three tied | PGA Tour · AFTER ROUND 3 | AFTER ROUND 3 | 4px | none |
| R3 delayed | PGA Tour · ROUND 3 · DELAYED | ROUND 3 · DELAYED (320 shows short DELAYED) | 4px | none |
| in play R3 | PGA Tour · ROUND 3 | ROUND 3 · LIVE (320 shows short LIVE) | 4px | none |
At 320 the after-round kicker and picks heading both ellipsise ("AFTER ROUN…", "AFTER R…").

## AUDIT (report only)
Hero/picks columns: observed (tests + captures). Leaders' Group: real leadersGroupRules functions run on the fixtures. Also this week / board / facts: source-derived.
| fixture | hero | picks | Leaders' Group | flag |
|---|---|---|---|---|
| in play R3 | ROUND 3 | ROUND 3 · LIVE | Round 4 · Tees off (fixture has round_3 card set while thru 7, which the rules read as complete) | fixture artefact; with round_3 null it stays Round 3 |
| after R3 | AFTER ROUND 3 | AFTER ROUND 3 | R4 drawn with leaders: Round 4 · Tees off; R4 tee data missing or leaders not in it: Round 3 · Finished | none |
| R3 delayed | ROUND 3 · DELAYED | ROUND 3 · DELAYED | base round 2 (leaders have no R3 data) → Round 2 · Finished | DISAGREES |
| R3 suspended | ROUND 3 · SUSPENDED | ROUND 3 · SUSPENDED | Round 3, Stopped when on course | none |
| before first tee | ROUND 1 | ROUND 1 · First tee (uppercased) | hidden (field not started) | none |
| final round | FINAL ROUND | FINAL ROUND · LIVE | Round 4 (no next round) | none |
"Round 3 · Tees off Sat 11:00" after round 3: the rules never produce it from missing R4 data (that gives "Round 3 · Finished"). It needs the Round-3 group in its 'before' state, i.e. the leaders' round-3 card absent and today_round not 3. So it comes from the leaders' own round data (base-round rule reading R3 as unplayed), not from missing round-4 tee data.
