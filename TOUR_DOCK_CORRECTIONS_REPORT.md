# Tour docking and portrait corrections

## Changes
- Added `useDockedStuck`: compares row top against `chromeClearancePx() + 1`, uses passive capture-phase scroll observation (including #root), requestAnimationFrame coalescing, resize observation and unmount cleanup.
- Added one page-level `DockBlur` per Schedule/Leaderboards page, outside sticky rows, at z-index 1. Uses the requested 72% dark ground and 20px/140% frost through global semantic tokens. Sticky rows remain at z-index 2.
- Schedule: each week reports its docking state; the page shows its single frost when any week docks. Height consumes the existing `--tour-week-h` with 41px fallback. Only stuck rows become transparent; normal/current-week paint and bottom hairlines remain.
- Leaderboards: forwards an opt-in `dockBlur` through LiveBoard to BoardTable. BoardTable reports measured header height and docking state. The opted-in strip becomes transparent and delegates blur to the page sibling. FullBoardSheet and other default callers keep their existing paint/filter/top behaviour.
- Players: only HeroImg height changed, to `min(250px, calc(420px - ${CHROME_CLEARANCE} - 52px))`. Right -60, bottom anchoring and masks unchanged.
- Local ownership is documented in the new module and week-header comments. Additional AGENTS.md note could not fit its protected size budget; no existing rules were compressed or removed.

## Tests
No existing tests deleted, renamed, rewritten or repaired.
Added six cases in `src/test/tourDockCorrections.test.tsx`:
1. `useDockedStuck is false below clearance and true at clearance, coalescing scroll reads`
2. `Schedule renders one page-level frost, hidden at rest and visible for stuck headers`
3. `week headers retain their normal backgrounds until stuck, then become transparent`
4. `LeaderboardTab opts its real BoardTable into page frost and reports measured header height`
5. `FullBoardSheet does not opt in and default BoardTable paint remains unchanged`
6. `HeroImg constrains height with min(250px and CHROME_CLEARANCE without changing anchoring`

Focused command: `bunx vitest run src/test/tourDockCorrections.test.tsx src/test/scheduleIslands.test.ts src/test/leaderboardsPage.test.tsx src/test/playersIslands.test.tsx src/test/boardHeadersNoPosPlayer.test.tsx --maxWorkers=2` — **45 passed, zero failures**.

Fresh full-suite commands ran separately:

| Command | Passed | Failed |
| --- | ---: | ---: |
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 2,113 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,929 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 2,068 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,981 | 0 |

Total **8,091 executed, 8,091 passed, zero failed**. Before: last reported **8,085**. Delta **+6**, exactly the new cases above. Shard assignment redistributes case counts when files enter the suite.
Logs: `/tmp/tour-dock-focused.log`, `/tmp/tour-dock-shard{1,2,3,4}.log`.
Latest preview diagnostic: **build OK**, 2026-11-10T17:35:31Z.

## Browser verification limitation
At 390×844, the live Schedule, Leaderboards and Players URLs all displayed **“App couldn't start”** before their pages rendered. Thus actual page docking, backdrop appearance and portrait clearance were not visually verified; no 320/430 or device result is claimed. Screenshots: `/tmp/browser/tour-dock/schedule.png`, `live.png`, `players.png`. No unrelated app-start repair was made.