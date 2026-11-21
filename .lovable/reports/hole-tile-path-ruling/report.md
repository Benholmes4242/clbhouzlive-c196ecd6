# Hole-tile test-path ruling — combined verification

## Exact authorised change
Only `src/test/fullscreenHoleTileRow.test.tsx:69` changed in code:
```text
readFileSync(new URL('../components/fullscreen-feed/fullscreen-hole-tile.css', import.meta.url), 'utf8')
→ readFileSync('src/components/fullscreen-feed/fullscreen-hole-tile.css', 'utf8')
```
Reason: use the repository's filesystem-path convention; the URL fixture threw before its assertions. All four cases, every assertion, stylesheet and app files are unchanged. No tests deleted, renamed or added in this ruling. No SQL, migrations, feed_config or round_pool_cap changes.

## One full run, separate sequential commands
| Command | Passing files | Passed / executed | Full output |
|---|---:|---:|---|
| `bunx vitest run --shard=1/4` | 210 | 2,297 / 2,297 | shard-1.log |
| `bunx vitest run --shard=2/4` | 210 | 2,283 / 2,283 | shard-2.log |
| `bunx vitest run --shard=3/4` | 210 | 2,360 / 2,360 | shard-3.log |
| `bunx vitest run --shard=4/4` | 209 | 2,455 / 2,455 | shard-4.log |

**9,395 / 9,395 passed, zero failures, 839 files.** Both builds fa8af59 and f8cf523 are covered. fullscreenHoleTileRow passes 4/4; courseLatelyTiles passes 16/16. No additional focused run or shard rerun.

## Count reconciliation
Last verified baseline: 9,390 tests / 838 files. Inventory before this ruling: 9,395 / 839 files; after: unchanged 9,395 / 839 files, now fully passed.
The complete +5 since the baseline:
- fullscreenHoleTileRow.test.tsx `(a) places the hole tile last inside the shot author row` (+1).
- fullscreenHoleTileRow.test.tsx `(b) keeps only the kicker when no detail is present` (+1).
- fullscreenHoleTileRow.test.tsx `(c) omits the tile and retains the single-line name for a place shot` (+1).
- fullscreenHoleTileRow.test.tsx `(d) declares the narrow-phone padding and detail size in CSS` (+1).
- courseLatelyTiles.test.tsx `(e4) two and three under par render eagle with the canonical double-ring and double-square CSS` (+1).
No other difference; file delta +1 is fullscreenHoleTileRow.test.tsx. Shard allocation differs from the earlier baseline, but no cases are missing or added beyond the five named above.

## Screenshots and limits
Ten screenshots capture the actual ImmersiveFullscreenChrome at 390×786 and 320×786: Woking first, Sundridge video, eighteenth, fourteenth without detail, and long name. `all-hole-states.png` presents all ten. Supplied mock photography is the background; isolated fixture inputs drive the actual app viewer. These are **isolated presentation checks, not authenticated live gallery captures**. No app/stylesheet/verification files were added to serve them; Playwright intercepted a temporary localhost document. Capture setup is retained alongside screenshots.

Observed at both widths: no page horizontal overflow, no tile content overflow, no wrapping of hole/detail text. At 320 detail is 14px; at 390 it is 15px. Long name wraps to two lines and visibly ellipsizes; no-detail tile shrinks to its kicker. Video state retains actual View post, video row and action pills. The fixture has no attached live video lane, so time reads 0:00 / 0:00; it does not verify playback. No browser page errors in successful captures. Frozen mock-context differences were not changed (viewer status row absent for signed-out fixture; fallback avatar initials).

**Danny Akers' real Farleigh round beside its Clubhouse score post at 390/320: not captured.** Browser auth status is `external_unmanaged`; no authenticated session is available to restore or mint for this project. No invented round data is presented as real evidence. Both Courses Standout and course Lately real-round comparisons remain unverified, including live hole 11/12 readback. This limitation does not invalidate the completed 9,395-test run.

Latest preview harness entry observed: `=== build 2026-11-21T08:24:01Z ===` / `build OK`.

## Files for this ruling
- src/test/fullscreenHoleTileRow.test.tsx — authorised path only.
- roadmap.md — status/accounting.
- .lovable/reports/hole-tile-path-ruling/ — this report, four complete logs, screenshot evidence and capture setup.
