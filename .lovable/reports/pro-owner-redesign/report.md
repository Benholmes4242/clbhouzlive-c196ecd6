# Signed-off Tour-pro owner redesign — stopped verification

## Implemented scope
- The owner-only Finish your profile card sits after Season/HowProPlays and before collections. All three original profile-keyed reads must have succeeded without error; pending/failed reads suppress it. Bag and Partners complete at one item; Questions completes from the existing enabled flag. Only incomplete rows appear in the signed-off order; all three complete removes the card.
- The existing bag/partner edit sheets and Ask explainer are reused. ProOwnerSections shares query keys with the existing sections; there are no new tables, RPCs or alternative completion sources.
- Empty owner Bag/Partners and disabled owner Ask are absent. Enabled-empty Ask remains unchanged. Populated collections retain their existing Edit controls.
- Career has header Add without own moments, or Edit with own moments. Add opens the original career editor; Edit opens the original list. Zero-entry owners retain the header/helper; zero-entry visitors see no section. Dashed career box removed; timeline derivation/content/geometry untouched.
- Exactly 43 `font-weight:800` declarations in pro-profile.css became 700. The hero rank is 40px/700 with .9 line height; name remains 26px with 1.1 line height, now 700. pro-label.css is untouched.
- The previous fallback/owner-menu/compact-label/font-inheritance work is untouched. Season results component and row structure are unchanged; only the explicitly mandated stylesheet weight changes affect shared pro row typography.
- No SQL, migrations, feed_config, round_pool_cap changes, new media, historical writes or deployments.

## Divider decision
Removed the 0.5px divider **only for Tour pros**, together with ClubsSectionWrapper. The code labels it “Divider above Clubs section” and it immediately precedes that wrapper, with no independent purpose. Teaching pros and normal members retain both card and divider; the home-club hero kicker remains untouched.

## Changed files and line numbers
- `src/features/pro-profile/ProOwnerSections.tsx:1–47` (new): completion query/state ownership, signed-off card and original sheet doors.
- `src/features/pro-profile/ProCollectionSections.tsx:1–6,16,23–30`: optional controlled panel, absent empty collections, Career Add/Edit/helper; existing list/linked-business/timeline logic retained.
- `src/features/pro-profile/ProAskSection.tsx:1–6,81–93`: disabled Ask now absent for owners too; old owner-off invitation removed, other bodies unchanged.
- `src/features/pro-profile/ProProfileBuildOne.tsx:19,51`: mount the shared owner-sections controller after existing season/stat sections, without touching hero props or counter expression.
- `src/features/pro-profile/pro-profile.css:7–272,77,86,279–294`: all 43 weight replacements, rank size, completion-card and zero-career helper styles.
- `src/index.css:140`: semantic token `--pro-finish-add-edge` for the signed-off dashed + icon border; other existing pro tokens reused.
- `src/pages/ProfilePageV2.tsx:1450–1464`: Tour-pro-only conditional around clubs divider/card.
- `src/test/proOwnerRedesign.test.tsx:1–86` (new): completion, sheet, Career and stylesheet tests.
- `src/test/proOwnerClubs.test.tsx:1–105` (new): tour-owner/visitor and normal/teaching profile card/divider regression fixture.
- `roadmap.md:3–6`: stopped task and exact verification blocker.
- `.lovable/reports/pro-owner-redesign/report.md`, `focused.log`, `build-errors.log`: this report and retained diagnostic outputs.

## Executed tests
Command: `bunx vitest run src/test/proOwnerRedesign.test.tsx src/test/proOwnerClubs.test.tsx`

**22 executed / 22 passed**, two files; no test failures. The six prior failed tests were not repaired or rerun. No existing test was deleted, renamed, rewritten or otherwise edited.

## Stop — exact harness errors
Latest entry: `=== build 2026-11-21T10:43:36Z ===`.

```text
src/test/proOwnerRedesign.test.tsx(33,144): error TS2353: Object literal may only specify known properties, and 'updated_at' does not exist in type '{ business_id: string; created_at: string; id: string; name: string; sort: number; user_id: string; website: string; }'.
src/test/proOwnerRedesign.test.tsx(34,108): error TS2353: Object literal may only specify known properties, and 'sort' does not exist in type '{ created_at: string; id: string; is_win: boolean; text: string; user_id: string; year: number; }'.
```

These are fields in the new test fixtures, not app logic. Verification stopped under the surviving type/build error rule; the fixtures were not changed after this error. A ruling is needed to correct the unsupported Partner/CareerMoment fixture fields without changing any test names or assertions. Browser mock comparison, 320px/390px captures, and all full-suite shards remain unrun. No successful final build is claimed.

## Shards
| Command | Result |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: surviving type errors |
| `bunx vitest run --shard=2/4` | Not run: surviving type errors |
| `bunx vitest run --shard=3/4` | Not run: surviving type errors |
| `bunx vitest run --shard=4/4` | Not run: surviving type errors |

## Continuous suite accounting
The brief's historical 9,399 baseline predates the already reported +3 navTourLiveLabel, +5 featuredRoundOptionB and +4 upcomingLastYearWon cases. Thus the latest previously verified full-suite passing total was **9,411 across 844 files**. The preceding pro-profile fixes then added 12 cases (+4 profileCoverFallback, +4 proProfileBuildOneB, +4 proProfileOwnerMenu), producing **9,423 / 845 files projected**, not a passing baseline; that filtered run stopped at 70 passed / 6 failed of 76.

This redesign adds **22 / 2 files**, so projected full-suite inventory is **9,445 / 847 files**. Delta is fully reconciled by the names below. No losses. Last verified full-suite passing total remains **9,411**. Font-inheritance follow-up changed no tests or inventory.

## New tests by name
### proOwnerRedesign.test.tsx (18)
- empty owner has zero of three done and ordered doors without empty sections
- one bag item completes one item and reveals the bag section
- all three complete removes the card and retains enabled empty Ask
- visitor never sees owner completion
- failed bag read suppresses the card even with stale data
- failed partners read suppresses the card even with stale data
- failed questions read suppresses the card even with stale data
- pending bag read suppresses the card
- pending partners read suppresses the card
- pending questions read suppresses the card
- bag door opens the existing new-club editor
- partners door opens the existing partner editor
- questions door opens and dismisses the existing explainer
- zero owner entries retain header Add and helper, without a dashed box
- own moments replace Add with the existing Edit list
- zero visitor entries omit Career
- standalone collection retains the same header add sheet
- stylesheet removes all 800 weights and keeps signed-off hero sizes

### proOwnerClubs.test.tsx (4)
- tour pro owner has no clubs card or its divider
- tour pro visitor has no clubs card or its divider
- normal keeps the existing clubs card and divider
- teaching_pro keeps the existing clubs card and divider

## Remaining verification
- Correcting new test fixture fields and resuming full-suite/browser verification requires the stop ruling.
- Existing proCollectionSections/proAskSection/proProfileScale assertions still encode the removed owner boxes/800 weights; they were intentionally not edited under the “add, do not rewrite” brief. No failure from those files is claimed in this run because they were not executed.
- The six prior counter/menu test failures remain unchanged and separately stopped.
- Authenticated live profile readback is unavailable with external_unmanaged authentication; no fixture run is represented as real server data.
