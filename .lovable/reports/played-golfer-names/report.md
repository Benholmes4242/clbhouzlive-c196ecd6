# Courses page: name the golfers in the faces line

`golfersLine(names, viewer, total, hadRounds)` in playedRings.ts; new pure `orderGolfers(rows, groupFaces, faces, viewerId)` (distinct user_ids; viewer first; newest play_date, ties whs_score_id desc; rows → group.faces when none; name = display_name → faces displayName → username). PlayedTile takes optional `viewerId`; WhoPlayingSection and PlayedTileSheet pass the existing session user id. No new reads. Styling, faces stack, tap target and single-line ellipsis unchanged.

Suite: before 9,810 / 868 files (9,809 passed, 1 known failure). After 9,820 / 869 (9,819 passed): shards 2,401 / 2,432 / 2,447 / 2,540. Delta +10 tests, +1 file = new `src/test/playedGolferNames.test.ts` (10 cases). Sole failure unchanged: `overviewRoundParity.test.tsx:82` casing.

Changed assertions (old wording):
- whatsBeenPlayedV6.test.tsx, renamed "faces line says golfers, with no chevron" → "faces line names the golfers, with no chevron":
  - `golfersLine(1, 2)` → `{ bold: '1 golfer', rest: ' played 2 rounds lately' }` became `golfersLine(['Andrew Yetzes'], false, 1, true)` → `{ bold: 'Andrew Yetzes', rest: ' played here lately' }`
  - `golfersLine(11, 1)` → `'11 golfers' / ' played 1 round lately'` became 11 names → `'Andrew, Ben and 9 others' / ' played here lately'`
  - `golfersLine(2, 0)` → `'2 golfers' / ' shared it lately'` became `'Andrew and Ben' / ' shared it lately'`
  - rendered `toBe('2 golfers played 2 rounds lately')` became `toBe('ann and bob played here lately')` (fixture names are lowercase "ann Smith"); not named in the brief, same rule.
- whatsBeenPlayedV2.test.tsx (not named in the brief, same rule):
  - `toBe('3 golfers played 4 rounds lately')` → `toBe('raj, tom and ben played here lately')`
  - `toContain('2 golfers')` → `toContain('Raj and Mason')` (shared-only case; `'shared it lately'` assertion unchanged)

Captures (placeholder fixture, real PlayedTile; sheet cases inside the real BottomSheet): sheet 1 / 3 / 8 golfers, 8 with viewer, inline 3, at 390 and 320 (`*_line.png` crops). Line height 18px (one line) everywhere; page scrollWidth equals viewport. At 390 all fit; at 320 the 3- and 8-golfer lines ellipsise inside the line (right edge 304). No live data or phone.
