# FIX_GRID_1 — scoped stop: clearance guard conflicts with the three-page limit

## Completed edits
- `src/features/chrome-v2/island-back.css`: added only `pointer-events:auto` to `.island-back.island-back`; all other rules unchanged.
- `src/pages/WatchGridPage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `src/pages/RoundsPage.tsx`: imported CHROME_CLEARANCE, changed root paddingTop and corrected its clearance comment.
- `src/pages/FindPeoplePage.tsx`: imported CHROME_CLEARANCE and changed only root paddingTop.
- `roadmap.md`: recorded this task.
- Project memory `mem://features/chrome/fix-grid-one.md` and `mem://index.md`: saved the user's tap/clearance requirements.
- `FIX_GRID_1_REPORT.md`: this stop report.

## Contradiction blocking the required guard
Brief §2 limits page changes to **“exactly” WatchGridPage, RoundsPage, FindPeoplePage**, and requires a guard **“listing every src file that contains 'var(--island-clearance)' and failing if any of them is the page for a registry rule with bleed: true, with PlayerPage as the one named, commented exception.”**

There is another live bleeding consumer, not just the PlayerPage exception:
- `src/components/manage/ManagePageShell.tsx:55`: `paddingTop: headerB ? 'var(--island-clearance)' : undefined,`
- `src/features/activity-v2/ActivityPageV2.tsx:524–526`: renders `ManagePageShell` with `headerB`.
- `src/features/chrome-v2/registry.ts:115`: `/notificationmessages` has `bleed: true`.

Thus Activity inherits the same zero-clearance bug. A truthful guard following callers will fail on Activity. Treating ManagePageShell only as a `/manage/*` consumer would falsely pass; adding a second exception would contradict the brief's one-exception requirement. No guard/test has been added or run to manufacture a pass. No Activity or ManagePageShell edits made. Await permission to fix Activity's shell clearance or explicitly exclude it from this guard.

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
Before: last pick-follow-up full run **6,462 tests /575 files**. After: unchanged inventory **6,462 /575**; no tests edited/added/deleted/renamed yet. Focused and four full shards not run because the required guard contradicts the frozen scope; no failure has been newly triggered, and no passing total is claimed for this task. No manual build/typecheck. Latest automatic build observed **2026-11-03T21:43:03Z — build OK**.

No SQL, migrations, migration files, deployed RPC/edge functions, feed_config, native/Median, guest browsing, wizard, news or round plots changed; round_pool_cap remains30. No pre-existing test failure reproduced. Historical resolved failures are listed in DEFAULT_B1_REPORT.md.