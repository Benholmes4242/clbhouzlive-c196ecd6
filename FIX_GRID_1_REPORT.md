# FIX_GRID_1 — STOP: new source-guard syntax failure

## Completed edits
- `src/features/chrome-v2/island-back.css`: added only `pointer-events:auto` to `.island-back.island-back`; all other rules unchanged.
- `src/pages/WatchGridPage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `src/pages/RoundsPage.tsx`: imported CHROME_CLEARANCE, changed root paddingTop and corrected its clearance comment.
- `src/pages/FindPeoplePage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `src/components/manage/ManagePageShell.tsx`: approved headerB-only paddingTop correction and CHROME_CLEARANCE import. Non-headerB marginTop and FixedPageHeader remain unchanged.
- New `src/test/fixGridClearance.test.ts`: intended eight source/clearance guard cases; collection currently blocked by syntax error.
- `src/test/headerB1.test.tsx`: added two real ChromeIsland/WatchGridPage back-navigation cases (history and fallback); existing cases/assertions unchanged. Scoped grid/video mocks added.
- `roadmap.md`: recorded this task.
- Project memory `mem://features/chrome/fix-grid-one.md` and `mem://index.md`: saved the user's tap/clearance requirements.
- `FIX_GRID_1_REPORT.md`: this stop report.

## Earlier scope stop — resolved by explicit user approval
Brief §2 limits page changes to **“exactly” WatchGridPage, RoundsPage, FindPeoplePage**, and requires a guard **“listing every src file that contains 'var(--island-clearance)' and failing if any of them is the page for a registry rule with bleed: true, with PlayerPage as the one named, commented exception.”**

There is another live bleeding consumer, not just the PlayerPage exception:
- `src/components/manage/ManagePageShell.tsx:55`: `paddingTop: headerB ? 'var(--island-clearance)' : undefined,`
- `src/features/activity-v2/ActivityPageV2.tsx:524–526`: renders `ManagePageShell` with `headerB`.
- `src/features/chrome-v2/registry.ts:115`: `/notificationmessages` has `bleed: true`.

User approved changing only the shell's headerB paddingTop to CHROME_CLEARANCE, adding it to the source guard, and leaving PlayerPage the sole exception. Implemented. Grep `rg -n -U '<ManagePageShell[^>]*headerB' src` confirms the only product caller is `src/features/activity-v2/ActivityPageV2.tsx:524–526`. Final literal-clearance grep lists only PlayerPage. ActivityPageV2 itself remains unchanged.

## Direct island-child audit
- Slot left capsule: `ChromeIsland.tsx` wraps every slot with `glassStyle`, inline pointerEvents auto; slot internals inherit it.
- Legacy back left capsule: glassStyle inline auto.
- Logo left capsule: glassStyle inline auto.
- Condensing back capsule: `.island-back.island-back` CSS now explicitly auto; this was the sole missing root owner.
- Member right capsule: glassStyle inline auto.
- Guest right capsule: glassStyle inline auto, preserved; intentionally hidden Log in/search internals remain non-interactive while folded.
No additional root requires a tap fix. Island-row gaps retain pointerEvents none.

## PlayerPage exception, unchanged
`src/features/tourhub/player-v2/PlayerPage.tsx:51` still uses the old variable. At rest its first section is **not a full-bleed hero image**: HeroSection begins with a tour/country/college identity kicker and normal visible player-name h1 next to a 118×124 avatar (`HeroSection.tsx:22–26`; `playerPage.css:7–18`). Hero top padding is26px; identity adds10px and h1 margin8px. The h1 is not hidden in source/CSS, although zero clearance can place it beneath the islands. The shell's title prop is not a separate visible heading. No player code changed or live visual claim made.

## Counts/check status
Before: last pick-follow-up full run **6,462 tests /575 files**. Intended after: **6,472 /576**, +10/+1: headerB1 16→18 (+2 history/fallback cases) and eight cases in new fixGridClearance (+8). Guard suite did not collect, so 6,472 is an intended inventory, not a verified executed or passing total. No existing tests rewritten, deleted or renamed; no old-padding expectation found needing an update.

Focused command: `bunx vitest run src/test/fixGridClearance.test.ts src/test/headerB1.test.tsx src/test/g2dVideoGrids.test.tsx src/test/g2cRoundsHeader.test.tsx src/test/g2eFindPeopleHeader.test.tsx src/test/g2fActivityHeader.test.tsx --maxWorkers=2`.
Result: **50 tests passed**, five files passed, **one failed suite**. headerB1 18/18 (both new navigation cases pass), G2F9/9, G2C7/7, G2E7/7, G2D9/9. Full output retained `/tmp/fix-grid/focused.log` (1,997 bytes). No four-shard runs after the new failure.

Exact new failure:
```text
FAIL src/test/fixGridClearance.test.ts
Error: x Expected '}', got '<eof>'
/dev-server/src/test/fixGridClearance.test.ts:89:1
Plugin: vite:react-swc
```
Automatic build at2026-11-03T21:50:42Z also reports:
```text
src/test/fixGridClearance.test.ts(89,4): error TS1005: '}' expected.
```
Source inspection identifies the missing closing brace after sourceFiles(), before moduleFile() at line16. Stopped without correcting it, per ANY NEW FAILURE STOP AND REPORT. Build is **not clean** in the current state. No manual build/typecheck or browser validation run. No pre-existing failure reproduced; this syntax failure is newly introduced.

No SQL, migrations, migration files, deployed RPC/edge functions, feed_config, native/Median, guest browsing, wizard, news or round plots changed; round_pool_cap remains30. No pre-existing test failure reproduced. Historical resolved failures are listed in DEFAULT_B1_REPORT.md.