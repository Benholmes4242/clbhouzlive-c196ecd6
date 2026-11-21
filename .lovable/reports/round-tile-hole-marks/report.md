# Round tiles — Clubhouse hole-mark grammar

## Result and stop
Round-tile changes implemented. Focused checks **63/63 passed**. The first two full shards ran sequentially, as separate commands; shard two stopped on the unchanged stylesheet-read fixture from the preceding hole-tile build (`fa8af59324`). No repair, rerun, or remaining shards after the failure.

```text
FAIL src/test/fullscreenHoleTileRow.test.tsx > fullscreen hole tile row > (d) declares the narrow-phone padding and detail size in CSS
TypeError: The URL must be of scheme file
 ❯ src/test/fullscreenHoleTileRow.test.tsx:69:17
const css = readFileSync(new URL('../components/fullscreen-feed/fullscreen-hole-tile.css', import.meta.url), 'utf8');
```

The error occurs before that case's CSS assertions. This brief does not authorize changing it. The prior hole-tile fixture ruling is needed to resume full-suite verification.

## Files changed
1. `src/components/courses/course-detail/about/latelyRules.ts`: NineCell.mark now uses HoleMarkGrade; latelyNines calls the canonical BoardRound.holeMarkGrade. Removed NineMark and nineMark after searching all src importers (no external consumers). OUT/IN structure and total calculation unchanged. Local shared-grade authority recorded beside NineCell.
2. `src/features/explore-magazine/watch/lately-tile.css`: replaced the four old grade shapes with birdie/eagle/bogey/double/triple shapes. Birdie is a red circle; eagle a double gold ring; bogey a muted square; double an inset double blue square with no blue figure override; triple a filled dark-blue square. Declared `--lately-nine-surface: #252529`. Figure ink remains inherited #F8FAFC for every grade. Existing grid cells centre the marks; existing nines/OUT/IN dimensions stay unchanged. Existing max-width 250px container query retains 18px base marks and now supplies 14px eagle, 16px bogey, 17px double/triple dimensions.
3. `src/features/explore-magazine/watch/RoundCard.tsx`: renders no figure for the canonical empty grade, including missing-par/unplayed holes; documented shared grading in its header. Other score figures, header/line, tile size and interactions unchanged.
4. `src/test/courseLatelyTiles.test.tsx`: only the two expressly authorized existing assertions below and one added case changed. Existing case names, mocks and all other assertions unchanged.
5. `roadmap.md`, this report, `focused.log`, `shard-1.log`, `shard-2.log`: status and complete runner output.

No SQL, migration files, feed_config or round_pool_cap changes. No edits to Clubhouse HoleMarks, BoardRound, leaderboard.css, CourseLatelySection or Standout section layout. No new architecture save to root AGENTS.md because it is at its budget; local ownership belongs in the edited module headers.

## Authorized assertions — old → new
`src/test/courseLatelyTiles.test.tsx`, case `(e) every band, blank unplayed holes and totals`:

```text
expect(nines[0].cells.map((c) => c.mark)).toEqual(['under', 'par', 'bogey', 'double', 'triple', 'under', 'par', 'par', 'par']);
→
expect(nines[0].cells.map((c) => c.mark)).toEqual(['birdie', 'par', 'bogey', 'double', 'triple', 'eagle', 'par', 'par', 'par']);
```
Why: the brief expressly replaces the merged under grade with canonical birdie/eagle grades.

```text
expect(nines[1].cells.slice(7).map((c) => c.mark)).toEqual(['blank', 'blank']);
→
expect(nines[1].cells.slice(7).map((c) => c.mark)).toEqual(['empty', 'empty']);
```
Why: the brief expressly replaces blank with the shared empty grade.

Every other existing assertion is unchanged. No tests deleted, renamed or replaced.

## Count reconciliation
Last fully verified baseline: **9,390/9,390 across 838 files**.

Immediately before this request: **expected inventory 9,394 across 839 files**, not a verified full pass. The intervening +4 are all in `fullscreenHoleTileRow.test.tsx` from `fa8af59324`:
- `(a) places the hole tile last inside the shot author row`
- `(b) keeps only the kicker when no detail is present`
- `(c) omits the tile and retains the single-line name for a place shot`
- `(d) declares the narrow-phone padding and detail size in CSS` — remains failed as above.

After this request: **expected inventory 9,395 across 839 files**. Delta **+1**: `courseLatelyTiles.test.tsx` goes **15 → 16** with `(e4) two and three under par render eagle with the canonical double-ring and double-square CSS`. It asserts two-under and three-under holes both render eagle and reads the actual eagle/double rules with the file's existing filesystem-path pattern to assert both box shadows. New case passes; no test-count delta from the two authorized array updates.

## Commands and results
| Command | Files | Passed | Failed | Full output |
| --- | ---: | ---: | ---: | --- |
| `bunx vitest run src/test/courseLatelyTiles.test.tsx src/test/coursesStandoutRounds.test.tsx src/test/cs1CourseLately.test.tsx` | 3 | 63 | 0 | focused.log |
| `bunx vitest run --shard=1/4` | 210 | 2,297 | 0 | shard-1.log |
| `bunx vitest run --shard=2/4` | 210 | 2,282 | 1 | shard-2.log |
| `bunx vitest run --shard=3/4` | — | — | — | Not run: stop rule |
| `bunx vitest run --shard=4/4` | — | — | — | Not run: stop rule |

Full-suite execution so far: **4,580 executed / 4,579 passed / 1 failed**, excluding the duplicate 63 focused checks. Full suite remains unverified at expected 9,395. Focused file totals: courseLatelyTiles **16/16**, coursesStandoutRounds **36/36**, cs1CourseLately **11/11**. courseLatelyTiles also passes **16/16** within shard two. Existing jsdom container-query parser diagnostics remain in complete logs; runner reports no additional failed tests/unhandled errors.

## Preview and requested real-round screenshots
Latest observed preview harness entry: `=== build 2026-11-21T07:59:38Z ===` / `build OK`. No manual build or typecheck performed.

**320/390 Farleigh tile beside the same Clubhouse post: not captured.** No authenticated session can be minted for this externally managed Supabase project (`external_unmanaged`), and the subsequent shard failure triggered the explicit stop rule before browser verification. Real Danny Akers hole 11/12 data, both live rail appearances, grade-by-grade comparison and no-overflow at 320 remain unverified; no synthetic Farleigh round was presented as real evidence.