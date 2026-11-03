# FIX_GRID_1 — complete after authorised syntax correction

## Completed edits
- `src/features/chrome-v2/island-back.css`: added only `pointer-events:auto` to `.island-back.island-back`; all other rules unchanged.
- `src/pages/WatchGridPage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `src/pages/RoundsPage.tsx`: imported CHROME_CLEARANCE, changed root paddingTop and corrected its clearance comment.
- `src/pages/FindPeoplePage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `src/components/manage/ManagePageShell.tsx`: approved headerB-only paddingTop correction and CHROME_CLEARANCE import. Non-headerB marginTop and FixedPageHeader remain unchanged.
- New `src/test/fixGridClearance.test.ts`: eight source/clearance guard cases, now passing after the explicitly requested missing-brace correction.
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
Before: last pick-follow-up full run **6,462 tests /575 files**. After: **6,472 /576**, all executed and passed, +10/+1: headerB1 16→18 (+2 history/fallback cases) and eight cases in new fixGridClearance (+8). No existing tests rewritten, deleted or renamed; no old-padding expectation found needing an update.

Focused command: `bunx vitest run src/test/fixGridClearance.test.ts src/test/headerB1.test.tsx src/test/g2dVideoGrids.test.tsx src/test/g2cRoundsHeader.test.tsx src/test/g2eFindPeopleHeader.test.tsx src/test/g2fActivityHeader.test.tsx --maxWorkers=2`.
Initial result: **50 tests passed**, five files passed, **one failed suite**. Original full output retained `/tmp/fix-grid/focused.log` (1,997 bytes). After the user explicitly requested fixing preview typecheck errors, only the missing sourceFiles closing brace was added; no assertion or case changed. Repeated focused command: **58/58 across6 files**, full output `/tmp/fix-grid/focused-after-brace.log`.

Full commands `bunx vitest run --shard=N/4 --maxWorkers=2`, individually N=1–4:

| Shard | Tests passed | Files passed |
|---|---:|---:|
|1|1645|144|
|2|1537|144|
|3|1638|144|
|4|1652|144|
|Total|6472|576|

**0 failures and 0 Vitest unhandled errors** in the final full run. Complete shard logs `/tmp/fix-grid/shard1.log`–`shard4.log`. Temporary logs do not survive sandbox resets.

New cases by name: headerB1 adds “FIX_GRID_1 top100 back uses history navigation without opening the underlying video” and fallback equivalent. fixGridClearance adds “back squircle explicitly opts into pointer events”; “a pass-through island row cannot strand the back capsule”; four file-specific “consumes measured clearance instead of the old reservation” cases for WatchGridPage, RoundsPage, FindPeoplePage and ManagePageShell; “Activity alone opts into the shell branch with measured root padding”; “no bleeding page or shared shell consumes old clearance except the named PlayerPage”. The guard traces actual App lazy imports/routes and shared source imports; it does not assume shell filenames identify their callers. No new module architecture or product defaults introduced.

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
The initial failure was stopped and reported without correction. Subsequent explicit preview-error instruction authorised adding the missing brace after sourceFiles(), before moduleFile(). Final automatic preview build: **2026-11-03T21:51:47Z — build OK**. No manual build/typecheck or browser validation run; real-component navigation tests pass, but live authenticated hit-testing remains unverified. No pre-existing failure reproduced; the newly introduced syntax failure is now cleared. Historical resolved failures remain listed in DEFAULT_B1_REPORT.md.

No SQL, migrations, migration files, deployed RPC/edge functions, feed_config, native/Median, guest browsing, wizard, news or round plots changed; round_pool_cap remains30. No pre-existing test failure reproduced. Historical resolved failures are listed in DEFAULT_B1_REPORT.md.