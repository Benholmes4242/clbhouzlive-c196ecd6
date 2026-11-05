# Also this week — hero board sizes and gaps

Brief: `BRIEF_Also_this_week_hero_board_sizes_and_gaps_pasted.md`; signed-off mock `build-also-this-week-spacing-signed-off.html` (Proposed tab values verified against the brief — they match exactly). Sizes and gaps only; no copy, data or behaviour changes. OverviewSectionHead untouched.

## Product changes
- `src/features/tourhub/overview/sections/alsoWeek.css`:
  - `.also-event` padding 18px 24px 16px → **14px 20px 12px**
  - `.also-sit` margin-top 12 → **8px**; `.also-board` margin-top 12 → **10px**
  - Chase strip unchanged (`.also-chase` 12px, `.also-track` 34px, pips/ticks/axis as before)
  - Grid `.also-bh,.also-br`: `30px minmax(0,1fr) 38px 30px 42px` → **`24px minmax(0,1fr) 40px 40px 40px`**, column-gap 4px kept
  - `.also-bh`: min-height **24px**, padding-bottom **0**, **10px**/700, .08em, colour dim → **var(--tour-board-mute)**
  - `.also-br` min-height 38 → **33px**; your row margin/padding 24 → **20px**
  - `.also-pos` 12.5px/700 → **11px/800**, letter-spacing **.04em**; leader still ink
  - `.also-who` gap 9 → **8px**; `.also-name` 14 → **13.5px**/600
  - `.also-today` 12.5 → **13px**/700; `.also-thru` 12 → **13px**/600 mute; `.also-tot` 16px/800 → **15px/700**
  - Tie bracket: `.also-br .tour-tie` left 25 → **19px**; your row 49 → **39px**
  - `.also-win` margin-top 14 → **10px**; `.also-facts` 14 → **10px**; `.also-yours` 12 → **10px**
  - `.also-gap` unchanged
- `src/features/tourhub/overview/sections/AlsoWeekEvent.tsx`: board row avatar default `size=26` → **`size=22`**. Winner face (46) and yours stack (22) are explicit and unchanged.

## Tests
- New `src/test/alsoWeekSpacing.test.ts` (11 tests): card padding, board grid, header, row min-height, your-row bleed, pos/who/name/today/thru/tot sizes, tie offsets, finished/upcoming gaps, unchanged chase strip, 22px face default.
- No existing test asserted an old value from the brief's list, so none were updated. No tests rewritten or deleted.
- Focused: `alsoWeekSpacing` + `alsoWeekSection` + `alsoWeekRebuild` = **72/72 passed**.

## 320px check
Playwright at 320×1800 on `/tourhub`: `.also-week` width 320, zero overflowing elements across `.also-event`, `.also-bh`, `.also-br`, `.also-track`, `.also-axis`. Screenshot: `/tmp/browser/also-week/screenshots/also_week_320.png` — boards and chase axes fit; tie bracket visible on T2 rows.

## Shards (`--maxWorkers=2`)
- Shard 1: **1,759 passed** (150 files)
- Shard 2: 1,614 passed, **12 failed** — all in `src/test/ws1WatchTop.test.tsx`, the same 12 pre-existing FW1 lead-fixture failures named in FW1_REPORT.md (fixture doesn't mock the featured read)
- Shard 3: 1,729 passed, **1 failed** — `src/test/ws2WatchMiddle.test.tsx` "WS2 order on For you", the same pre-existing FW1 fixture failure reported after the FW1 addendum
- Shard 4: **1,683 passed** (148 files)
- Total: 6,785 passed / 13 failed across 598 files. All 13 failures are the named pre-existing FW1 fixture failures; none are caused by this brief. Logs: `docs/verification/also-week-spacing/`.

## Not verified
- Browser check was signed-out (guest); the signed-in "your row" bleed and tie bracket at 39px were verified by CSS assertion only.
