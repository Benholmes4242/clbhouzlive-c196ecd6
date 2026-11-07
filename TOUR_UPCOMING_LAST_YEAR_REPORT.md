# Tour upcoming LAST YEAR — stopped on new test failures

## Changes
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow.tsx`: condensed three-column rows, shared tracks/gap/gutter, uniform 33px minimum height and 5px vertical padding; 22px ringless avatars; 13px/600 ellipsised names; 14px trophy; centred 15px scores. Removed flag/year props and cells; retained winner band and GOLD_DARK score rule.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`: only LAST YEAR block changed; 12px top padding, no bottom padding, condensed header with shared year or label-only fallback.
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`: user-authorized export-only changes for HERO_PAD_X, HERO_POS_W, HERO_TOT_W and HERO_GAP; no values or rendering changed.
- `src/test/tourOverviewMergedAiry.test.tsx`: four authorized geometry assertions updated in the existing “tightens upcoming first tee and last-year rows without changing their contents” case.
- `src/test/upcomingLastYearBoard.test.tsx`: seven new cases.
- `roadmap.md`: scoped task and stop recorded.

## Existing assertions changed
In `src/test/tourOverviewMergedAiry.test.tsx`, existing case unchanged by name:
1. `expect(last?.style.paddingBottom).toBe('4px')` → `expect(last?.style.paddingBottom).toBe('')`: remove bottom padding.
2. `expect((last?.children[0] as HTMLElement)?.style.padding).toBe('12px 20px 4px')` → `...toBe('2px 20px')`: live-board header treatment.
3. `expect((last?.children[1] as HTMLElement)?.style.padding).toBe('10px 20px')` → `...toBe('5px 20px')`: winner uses normal row padding.
4. `expect((last?.children[2] as HTMLElement)?.style.padding).toBe('8px 20px')` → `...toBe('5px 20px')`: condensed non-winner padding.

No test deleted or renamed. No other existing test changed.

## Verification and mandatory stop
Command: `bunx vitest run src/test/upcomingLastYearBoard.test.tsx src/test/tourOverviewMergedAiry.test.tsx --maxWorkers=2`

Result: **20 passed, 3 failed; 23 executed across 2 files**. All 16 existing Merged Airy cases passed. Four of seven new cases passed.

Unexpected failures in `src/test/upcomingLastYearBoard.test.tsx` (tool output):

```text
puts the shared year in the condensed header, not the rows
src/test/upcomingLastYearBoard.test.tsx:38:33
AssertionError: expected 'Last year · 2025' to be 'LAST YEAR · 2025' // Object.is equality
Expected: "LAST YEAR · 2025"
Received: "Last year · 2025"

omits the heading year when the displayed rows have different years
src/test/upcomingLastYearBoard.test.tsx:50:113
AssertionError: expected 'Last year' to be 'LAST YEAR' // Object.is equality
Expected: "LAST YEAR"
Received: "Last year"

keeps the winner the same size with a 14px trophy in the position cell and gold score/band
src/test/upcomingLastYearBoard.test.tsx:81:63
AssertionError: expected 'rgb(212, 160, 23)' to be 'rgb(251, 188, 46)' // Object.is equality
Expected: "rgb(251, 188, 46)"
Received: "rgb(212, 160, 23)"
```

The first two new assertions inspect DOM text, whereas the existing English label is “Last year” and the requested uppercase appearance is CSS text-transform. The third new assertion mistakenly expects the band gold rather than the retained GOLD_DARK score token (#D4A017). No failed assertion was edited after the stop. Repair requires explicit test-only authorization; production casing and gold should remain unchanged.

Failure output retained in `/tmp/upcoming-focused.log` and `/tmp/upcoming-stop-output.log`.

Four shards: **not run**, per unexpected-failure stop rule. The only allowed known failure, `fw1FeaturedDeck` “reserves no right padding on the meta line”, was not in this focused run; no failure was classified as known.

Last reported full-suite baseline: **7,440 tests / 651 files**. Added seven cases in one new file gives an expected inventory of **7,447 / 652**; this is not a verified full-suite result.

New cases: shared heading year; mixed-year fallback; non-winner geometry/avatar/no flag; winner trophy/score/band geometry; non-winner E, +2, and −2 score colours.

Latest preview telemetry: `build OK` at 2026-11-07T15:00:24Z.

320px upcoming-hero/long-name browser check: **not run after the stop**. No guest browsing, SQL, migrations, deployed function/RPC, feed_config, native/Median or pool-cap changes.