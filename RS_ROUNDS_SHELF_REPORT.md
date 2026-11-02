# RS — Rounds this week shelf on Explore (RS + RS.1 close-out)

No SQL, migrations or migration files. No deployed RPC or edge-function edits. `feed_config` untouched, `round_pool_cap` stays at 30, no native/Median config changes. RS.1 made no code changes.

## Diff
- **New** `src/pages/RoundsPage.tsx`: today's `ScoresLeaderboardsPage`, mounted the way ExploreMagazine mounted it (`useAmateurBoardState(userId, true)`, the same row/member/course handlers, the existing gate). It has its own `useScorecardOpener` and a `RoundDetailSheet` on that same opener. Header follows the Find people pattern: 36px round back button and a centred 17/700 "Rounds" title. Back goes to history, or `/amateur` if there's none. Bottom space is `NAV_CLEARANCE`. Fires `rounds_page_viewed`. Keeps the CB44 session hold.
- **New** `src/features/explore-magazine/watch/RoundsThisWeekShelf.tsx` and `roundsShelfRules.ts`:
  - Reads circle rounds from the last 14 days via `useStandoutRounds` (limit 4). If the circle has fewer than 2 rows, it falls back to everyone and the sub-line says "Everyone".
  - Feats come from `useFeatsWindow` (year). A feat shows only if its latest play date is within 14 days and it has a score id. Order is ace, albatross, eagle, clean card, with at most 2.
  - Cards run round, round, feat, round, round, feat.
  - Hole strips are batched through `useRoundHoleShapes`, using the brief's palette.
  - The door row always shows. The loading skeleton holds space for the heading, two cards and the door. A read error hides the shelf and logs a warning.
  - Analytics: `rounds_shelf_viewed` (once per session per scope, at 50% visible), `rounds_shelf_card_tapped`, `rounds_door_tapped`.
- `WatchFeed.tsx`: new optional `onOpenRound` / `onOpenMember` props. The shelf mounts once, directly after Quick hits, only on the All chip (`onAll`, so not during a search).
- `exploreViewMemory.ts`: `EXPLORE_VIEWS` is now `['watch']` (or `['all','watch']` with the trial flag on), and `SCOPED_VIEWS = []`. A remembered `scores` falls through to Watch.
- `App.tsx`: lazy `/rounds` route. `chrome-v2/registry.ts`: `/rounds` uses `chrome: 'none'`, `tone: 'dark'`, `bleed: false`.
- Six `courses.json` locale files: `amateur.roundsShelf.*` and `amateur.roundsPage.title`.

## Removals from ExploreMagazine
- Removed the Rounds/Watch sticky view-chip row: `RailChips`, the sticky scrim hook/component, `scrollPageToTop`, `Z`, `changeView`.
- Removed the Scores mount and everything only it used: `useAmateurBoardState`, `BoardFilterPanel` (its `boardPanelOpen` was never set to true), the board filter types/components, `ScoresStandingSlot`, `UnknownConnectionFallback` (now on `/rounds`), `boardRowPress`, `BoardRow`.
- Removed the Scores shelves: the `CircleShelf` / `circle` shelf kind and `useCircleSize`. Also removed `SCOPED_VIEWS` and `writeExploreView` from use, and the scores branches in the stream, fallback, course-candidate and grid conditions.
- `openCommunity` now only sets the Watch entry. `revealCard` uses a fixed 56px offset because the chip row is gone.
- Guest gating is unchanged: `useGuestScrollGate('explore')` stays in `AmateurPage`.

## Redirect
`AmateurPage` sends `/amateur?view=scores` to `/rounds` with `replace`. It removes only `view` and keeps every other query parameter. The redirect sits below all hooks, so hook order is unchanged.

## Chrome ruling
`/rounds` uses `chrome: 'none'` with Find people spacing, per Ben. The page owns its safe-area header and does not use `CHROME_CLEARANCE`, since that includes the island row this page doesn't have. Bottom space is `NAV_CLEARANCE`.

## Test changes (old → new)
`src/test/exploreAllTabTrial.test.ts`: 3 → 4 tests. None deleted. The brief authorised moving the view-switch tests.
- `'hides All while the flag is off'`: title kept, assertion changed. `expect(EXPLORE_VIEWS).toEqual(['scores', 'watch'])` → `expect(EXPLORE_VIEWS).toEqual(['watch'])`. Why: the Rounds view left Explore.
- `'a remembered all lands on Standings'` → `'a remembered all falls to Watch'`. `expect(readExploreView()).toBe('scores')` → `toBe('watch')`. Why: Watch is now the first view Explore can reach.
- New: `'a remembered scores falls to Watch'`, `expect(readExploreView()).toBe('watch')`.
- `'defaults to the first view in the strip'` is unchanged.
- Note: the earlier summary said "two retitles". The repository history shows **one** retitle and one assertion change with the same title, as quoted above.

`src/test/rsRoundsShelf.test.tsx` is a new file with 22 tests. It covers the rules, the circle→everyone fallback, card ordering, the cards, scorecard taps, the door and navigation, empty and error states, the `/rounds` route, gate and back button, the redirect, and Explore opening on Watch with no switch.

## Full suite (`npx vitest run --shard=N/4`)
- RS run: shard 1 **1,433**, shard 2 **1,387**, shard 3 **1,492**, shard 4 **1,417**. Total **5,729/5,729 across 533 files**.
- Against the 5,706/532 baseline: **+23 / +1** = rsRoundsShelf +22 (new file) and exploreAllTabTrial +1. No other deltas.
- RS.1 shard 4 rerun (`--maxWorkers=2`, today): **1,472/1,472 across 132 files**, 0 failures. This includes the later FIX-WTF tests (+10/+1). The current suite total is therefore 5,739/534, as recorded in `FIX_WTF_RAIL_REPORT.md`.

## Shard-1 one-off failure
- On the first RS run (started 10:26), shard 1 reported `1 failed | 1432 passed (1433)`. That command printed only `tail -4` of each shard, so the saved log has the counts but **not the test name, file or error**. I can't recover them.
- Shard 1 then passed 1,433/1,433 on rerun, and later full runs have been green.
- **Unidentified.** I can't confirm or rule out that it touches RS files. I'm recording it as an unidentified flake that didn't reproduce, and nothing was changed.
- No other pre-existing failures.
