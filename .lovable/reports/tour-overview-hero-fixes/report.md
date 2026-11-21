# Tour overview hero fixes — stopped verification

## Result
The three scoped presentation changes are implemented. Verification is **stopped**, not complete. Preview compilation reports `build OK` at 2026-11-21T20:06:06Z. No SQL, migrations, feed_config changes, locale edits, or shared hybrid-hero.css edits.

## Exact stop
Command:
```text
./node_modules/.bin/vitest run src/test/tourOverviewHeroFixes.test.tsx src/test/completedWeekFacts.test.tsx src/test/heroBlocks.test.tsx src/test/upcomingLastYearWon.test.tsx
```
Output saved in `focused.log` in this directory.

```text
FAIL src/test/tourOverviewHeroFixes.test.tsx > Tour overview hero fixes > the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE
AssertionError: expected 'Champions · Starts 14 JAN' to be 'Champions · STARTS 14 JAN' // Object.is equality
Expected: "Champions · STARTS 14 JAN"
Received: "Champions · Starts 14 JAN"
❯ src/test/tourOverviewHeroFixes.test.tsx:68:86
Test Files 1 failed | 3 passed (4)
Tests 1 failed | 62 passed (63)
```

The failed assertion is unchanged. No test rerun, four-shard run or browser captures followed the failure. The rendered date is 14 JAN; the existing translation supplies sentence-case `Starts` in DOM text. Browser uppercase appearance has not been verified; no locale or component was changed to satisfy this assertion.

The preview also reported TS2741 at new fixture line 29 (columns 32, 66, 105), `Property 'toPar' is missing ... but required in type 'LiveFactCell'`. Only the required nullable `toPar: null` fields were supplied in that newly added fixture to restore preview compilation; no test name or assertion changed and no rerun was performed.

## Changed files and lines
- `src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx:54`: inline equal-width grid columns, based on cells.length. Every caller/state receives this presentation fix.
- `src/features/tourhub/tournament-v2/data/tournamentRules.ts:49–52`: shared startDayForm with event-zone calendar handling and zero-through-six-day weekday rule; heroStartDayForm delegates.
- `src/features/tourhub/components/overview-v3/HybridHero.tsx:33,161–162`: shared decision for the overview start kicker, using its supplied now.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx:74,550`: FIRST TEE uses the shared weekday flag instead of any valid weekday.
- `src/features/tourhub/tournament-v2/data/weekFactsRules.ts:93`: WonChart names come from each row's full_name, champion included; scores and selection unchanged.
- `src/features/tourhub/tournament-v2/sections/completedWeek.css:15,17`: wrapping key, 6px row gap, no name clipping/ellipsis.
- `src/test/completedWeekFacts.test.tsx:190`: expressly authorized surname-to-full-name expectation, detailed below.
- `src/test/tourOverviewHeroFixes.test.tsx:1–92`: thirteen new tests, real i18next provider and MemoryRouter; required nullable fixture fields corrected only for preview types.
- `roadmap.md:3–7`: scoped stop and outstanding verification.
- This report and full focused output.

WonChart.tsx needs no edit: it already renders line.name, and both its overview and tournament consumers receive the shared builder change. Architecture ownership is documented beside startDayForm rather than expanding the near-limit root AGENTS.md.

## Existing test assertion changed (authorized)
File: `src/test/completedWeekFacts.test.tsx:190`.
Case (name unchanged): `key: champion then the next two in board order, surname and score, under colour vs ink`.

Old:
```tsx
expect(items.map(i => i.querySelector('.cw-key-name')?.textContent)).toEqual(['Brown', 'Runner', 'Runner']);
```
New:
```tsx
expect(items.map(i => i.querySelector('.cw-key-name')?.textContent)).toEqual(['Blades Brown', 'First Runner', 'Second Runner']);
```
Reason: the brief explicitly replaces surname-only WonChart key names with the supplied full names. All other assertions and the case name remain unchanged.

## New test names and count reconciliation
Baseline last verified full suite: **9,611 / 9,611 tests, 855 files**.
Expected inventory after this change: **9,624 tests, 856 files**, not a verified full-suite result.
Delta: **+13 tests / +1 file**, entirely `tourOverviewHeroFixes.test.tsx`:
1. LiveFacts with 4 cells declares equal columns
2. LiveFacts with 3 cells declares equal columns
3. startDayForm uses the required form at 0 days
4. startDayForm uses the required form at 6 days
5. startDayForm uses the required form at 7 days
6. startDayForm uses the required form at 53 days
7. heroStartDayForm preserves its output at 2 days
8. heroStartDayForm preserves its output at 10 days
9. date-only and timestamp starts retain event-zone calendar handling
10. missing starts and invalid zones retain safe empty and UTC handling
11. the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE — FAILED
12. WonChart keys use all three full names, champion first, with unchanged scores
13. the won key wraps with a six-pixel row gap and never ellipsizes names

No tests deleted or renamed. Existing files retain counts: completedWeekFacts 31, heroBlocks 15, upcomingLastYearWon 4; new file 13. Focused 63 executed / 62 passed / 1 failed.

## Four shards and captures
| Shard | Tests | Files |
|---|---|---|
| 1 | Not run — stop | Not run |
| 2 | Not run — stop | Not run |
| 3 | Not run — stop | Not run |
| 4 | Not run — stop | Not run |

390px and 320px live facts / distant upcoming / DP World Last year captures: **not run**, pending a ruling on the unexpected failed test. No visual containment or live end-to-end verification is claimed.