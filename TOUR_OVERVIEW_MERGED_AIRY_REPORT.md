# Tour Overview Merged Airy — stopped at focused tests

## Applied
- User ruling: photo text uses the mock's **20px** left/right inset, not the brief's 24px.
- Overview-only photo height 340px; separate news height remains unchanged. Sentence/note moved onto the photo in all states; Full board moved to the pill row with a 44px target and isolated activation. Photo is a keyboard-accessible div, not a nesting button.
- Existing sentence builders and full-board availability/navigation preserved. The finished sentence is moved from ChampionStrip to PhotoBand without duplicating prose; ChampionStrip still supports its narrative spacing for other callers.
- Specified board, picks, upcoming facts/history, movers, leaders and champion narrative spacing applied; negative tracking removed in affected displayed sections.
- SituationBand retained: TournamentPage still imports it, and its existing tests remain passing. No database/RPC/edge-function/guest/review/news/round-plot/native/Median changes. feed_config untouched; round_pool_cap remains 30.

## STOP: exact failures
Command: `bunx vitest run src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewDesignA.test.ts src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/cb58LeadersGroup.test.tsx src/test/tourHeroRefinements.test.tsx src/test/tourChampionAvatarCandidates.test.tsx src/test/tourPlayoffShortenedEvents.test.tsx --maxWorkers=2`

**174 executed: 172 passed, 2 failed; 7 files (5 passed, 2 failed).** No pre-existing failure observed; both failing assertions concern the newly requested leaders hairline. Complete output: `/tmp/tour-airy-focused.log`.

1. `src/test/cb58LeadersGroup.test.tsx:171:44`, **“renders after picks and directly after the board without picks”**:
   `AssertionError: expected 'padding: 14px 20px 12px; margin-top: …' to contain 'border-top: 1px solid var(--th-overvi…'`
2. `src/test/tourOverviewMergedAiry.test.tsx:100:225`, **“tightens leaders with a six-pixel gap and top hairline”**:
   `AssertionError: expected 'padding: 14px 20px 12px; margin-top: …' to contain 'border-top: 1px solid var(--th-overvi…'`

Both tool outputs:
```text
Expected: "border-top: 1px solid var(--th-overview-hairline)"
Received: "padding: 14px 20px 12px; margin-top: 6px; color: rgb(255, 255, 255); line-height: normal;"
```
The source supplies the border using a CSS variable, but the test DOM omits that border shorthand from its style attribute. Assertions and implementation were not changed after failure. Await authorization for a narrowly scoped browser/style assertion correction; no unrelated code changes proposed.

## Test inventory
Last full green baseline: **6,025 tests / 548 files** (WS6.1).
Candidate inventory after additions: **6,041 tests / 549 files**, **+16 / +1**, solely the new `tourOverviewMergedAiry.test.tsx` (16 cases). This is inventory accounting, **not a full-suite pass count**. Four full shards were not run after the mandatory stop.

No tests deleted. Existing changes, explicitly accounted:
- `tourOverviewDesignA.test.ts`: **“keeps the overview at 386 without changing the shared news hero height”** renamed to **“… at 340 …”**. `expect(OVERVIEW_PHOTO_BAND_HEIGHT).toBe(386)` → `toBe(340)` and total `'386px'` → `'340px'`. Reason: new photo height; news assertions retained.
- `tourOverviewPicksChipsFullBoard.test.tsx`: **“puts the 30px avatar left of the name”** renamed to **“…28px…”**; `[style*="30px"]` → `[style*="28px"]`. Reason: new pick avatar measurement.
- Same file, **“renders for live and completed (awaiting-playoff) events with a board, never for upcoming”**: `[data-overview-situation] [data-overview-full-board]` → `[data-overview-photo-band] [data-overview-full-board]`; upcoming SituationBand existence assertion → photo-situation existence plus absence of old band. Reason: moved presentation.
- Same file, **“has a 44px target that leaves the row height unchanged”**: padding `'12px 0px 12px 12px'` → `'0px 0px 0px 12px'`; margin `'-12px 0px'` → `'-8px 0px'`; added height `'44px'`. Reason: relocated target on 28px pill row.
- `cb58LeadersGroup.test.tsx`, **“renders after picks and directly after the board without picks”**: `expect(section?.getAttribute('style')).not.toMatch(/border/)` → `toContain('border-top: 1px solid var(--th-overview-hairline)')`. Reason: new explicit top hairline. This assertion failed as quoted above.

New cases (16): three state-parameterized photo sentence/note cases; isolated Full board/tournament keyboard and click case; absent opener case; live/completed compressed board cases; panel/light preserved-spacing cases; upcoming/live/completed picks cases; upcoming facts/history case; movers case; leaders case; champion narrative/no-narrative case.

## Files touched
1. `src/styles/tour-hub-tokens.css`
2. `src/features/tourhub/components/overview-v3/HybridHero.constants.ts`
3. `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx`
4. `src/features/tourhub/components/overview-v3/HybridHero.tsx`
5. `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
6. `src/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow.tsx`
7. `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx`
8. `src/features/tourhub/components/overview-v3/HybridHeroBands/ChampionStrip.tsx`
9. `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx` (heroBoard branch only)
10. `src/features/tourhub/overview/magazineCopy.ts` (sentence-ownership comment only)
11. `src/test/tourOverviewDesignA.test.ts`
12. `src/test/tourOverviewPicksChipsFullBoard.test.tsx`
13. `src/test/cb58LeadersGroup.test.tsx`
14. `src/test/tourOverviewMergedAiry.test.tsx` (new)
15. `roadmap.md`
16. `TOUR_OVERVIEW_MERGED_AIRY_REPORT.md`
17. Project memory `mem://features/tourhub/merged-airy` and `mem://index.md`.

No new structural module introduced. Existing local sentence-ownership comment updated rather than adding an architecture rule to AGENTS.md.

## Remaining verification
Automatic build is **build OK, 2026-11-03T09:05:52Z**. Requested manual TypeScript command is prohibited by the execution environment; no manual build or typecheck was run. Full shards, real browser three-state comparison and signed-in readback remain unverified at the test stop. External unmanaged authentication also prevents managed signed-in end-to-end verification.