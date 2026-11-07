# Pro season tiles, legacy chart and movers — stopped

## Delivered scope
Season-only `pro-season-tiles` outlines/centering and open `pro-season-results`; result sheet tile styles retained. Legacy tile figures/labels centred, null tile values dim em dashes, fetched zero retained; hero/tile figure tracking zero. Country bars use neutral55% ink token; both dot keys render only with plot while unmapped remains independent. Movers are transparent12px outlined flex chips with28px avatar and surname; green up/warning-red down arrow separated from white place count; gross/to-par colour law unchanged. Header/padding/hairline preserved. No mock annotation/switcher/example stand-ins added.

## Changed files
- `src/features/pro-profile/ProSeasonSection.tsx`
- `src/features/pro-profile/pro-profile.css` — removed unused pro-profile-results rule; season-only overrides.
- `src/components/profile/courses/JourneySummaryCard.tsx`
- `src/components/profile/courses/CoursesMapSection.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx` — updated direction comment with Ben's7Nov ruling.
- `src/index.css` — named tokens for season outline, country bar, pure-white mover surname.
- Tests: `src/test/proProfileSeason.test.tsx`, `profileCoursesRecord.test.tsx`, `tourOverviewScorecardTap.test.tsx`, `tourOverviewMergedAiry.test.tsx`.
- `roadmap.md`, this report; design requirements saved to project memory.

## Assertion changes and inventory
Only existing updated case: `tourOverviewMergedAiry.test.tsx`, “tightens movers and their figure gap”.
- `card?.style.padding`: `'8px'`→`'7px'`.
- Figure-line margin: old `card?.children[1].style.marginTop === '6px'`→new nested `card?.children[1].children[1].style.marginTop === '2px'`, matching text-column hierarchy.
No other existing assertions changed. No test deleted or renamed. No old null-hero assertion changed: null hero remains empty; this brief changes tile nulls only. No existing amber-bar/radius/direction assertion found requiring replacement.

Five new cases:
- proProfileSeason: season-only centred outlines/result-sheet isolation; results outside any card (+2).
- profileCoursesRecord: null/zero tile semantics and alignment; neutral bars/unplottable key absence with unmapped text (+2).
- tourOverviewScorecardTap: pick-style geometry/direction-only arrows/place counts (+1).

Before7491tests/655files; after expected7496/655 (+5 in three existing files). Full-suite inventory after edits was not run/verified.

## Verification and mandatory stop
Command: `bunx vitest run src/test/proProfileSeason.test.tsx src/test/profileCoursesRecord.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewScorecardTap.test.tsx --maxWorkers=2`

**34 passed +2 failed =36 executed /4 files**. Season7/7 and MergedAiry16/16 passed; Record7passed/1failed; Scorecard4passed/1failed. Exact failures left untouched:

```text
FAIL src/test/profileCoursesRecord.test.tsx
profile courses record > unplottable courses keep unmapped text without a map key and country bars use neutral fill
src/test/profileCoursesRecord.test.tsx:76:36
AssertionError: expected '' to be 'var(--course-country-bar)' // Object.is equality

FAIL src/test/tourOverviewScorecardTap.test.tsx
movement card to-par colour > pick-style movers have direction-only arrows and independent white place counts
src/test/tourOverviewScorecardTap.test.tsx:54:67
AssertionError: expected '' to be '28px' // Object.is equality
```

These are new assertions, not permitted-known FW1 failures. No failed assertion repaired, no product workaround added. Latest telemetry buildOK,2026-11-07T15:55:46Z. Output `/tmp/pro-tiles-focused.log`.

Four shards **not run after mandatory stop**; no per-shard total claimed. Only permitted-known FW1 meta-line did not run. Prior notification parity failure remains untouched and is not reclassified as allowed-known.

320px actual season/legacy/chart/movers checks **not run after stop**; exact mock visuals/wrapping remain unverified. No SQL/migrations/deployed functions/RPC/native/Median/feed_config/pool-cap changes.