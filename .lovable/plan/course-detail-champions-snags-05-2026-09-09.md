# Course Detail Champions Snags 05

## Scope
Correct the Champions footer, full-board sheet surface and golfer wording, and the sheet-only deficit labels. Preserve data sources, queries, RPCs, board selection, instrumentation, and every file on disk.

## Implementation
1. Remove the redundant **All boards** action from the Unclaimed section while retaining **All 18** as the only full-board entry. Keep the existing hairline primitive, rebalance its spacing, place the existing quiet note directly below it, and replace the assembled em dash with an ASCII comma.
2. Make the full-board sheet use the course-detail canvas token across its outer sheet, handle area, header, and body. Audit the scorecard, hole, map, claim, media, website, and review overlays reached from course detail; only align bottom-sheet surfaces that currently conflict with the same course canvas and leave fullscreen viewers/maps whose surface contract is intentionally different.
3. Reuse the course-scoped golfer pluralization introduced for Who plays here so the board header reads `1 golfer` / `N golfers`, while leaving genuine platform-member copy unchanged. Ensure all six locale files carry the English values.
4. Remove the misleading minus sign from deficit magnitudes. Route singular/plural copy through locale keys and preserve the existing category-aware units: shots, points, rounds, birdies, eagles, aces, albatrosses, and shots against handicap.
5. Leave the amber see-all and tenure treatments unchanged as requested, but report their exact sources and all matching course-detail occurrences. Keep the rank-one crown amber.
6. Record the retired Unclaimed action block for the later dead-file sweep without deleting its shared component or any file.

## Verification
- Typecheck and locale JSON validation.
- Browser checks at 390px, including the course page and open board sheet; capture 3x screenshots when a populated public course exposes the required states.
- Confirm All 18 preserves the active board and opens the same sheet.
- Confirm one balanced hairline, ASCII unclaimed sentence, golfer header, no deficit minus, and correct units on gross plus a non-scoring board.
- Re-audit course-detail overlays, amber see-alls, tenure amber, and changed file/line references for the ship report.
