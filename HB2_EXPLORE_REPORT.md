# HB2_EXPLORE report — STOPPED

## Status
The authorized corrections are applied: the probe retains its real-browser measurement but falls back to 56px when nonpositive; the docked controls stay mounted for the exit animation. The unchanged boundary assertion now passes. A different existing test fails because its placeholder query finds both mounted search fields. Per the stop rule, no further correction, browser check or full shard followed.

Command: `bunx vitest run src/test/hb2ExploreDock.test.tsx src/test/headerB1.test.tsx src/test/islandSquircle.test.tsx src/test/ws1WatchTop.test.tsx src/test/er1ExploreCommunity.test.tsx --maxWorkers=2`

Latest result: 5 files; 91 passed, 1 failed, 92 total. HB2's 10 cases all pass.

```text
FAIL  src/test/ws1WatchTop.test.tsx > WS1 chips > the search placeholder reads Search videos and creators
TestingLibraryElementError: Found multiple elements with the placeholder text of: Search videos and creators
❯ src/test/ws1WatchTop.test.tsx:319:19
```

Full correction log: `/tmp/hb2/focused-correction.log`. Latest automatic build: 15:06:52Z, `build OK`. The existing placeholder test is untouched. It passed before always-mounted docking; it is a new regression, not a pre-existing failure.

### Resolved historical stop

```text
FAIL  src/test/hb2ExploreDock.test.tsx > HB2 Explore island dock > observes the page root with the island boundary, adding no scroll listener
AssertionError: expected '-0px 0px 0px 0px' to be '-56px 0px 0px 0px' // Object.is equality
Expected: "-56px 0px 0px 0px"
Received: "-0px 0px 0px 0px"
❯ src/test/hb2ExploreDock.test.tsx:50:167
```

The original log is at `/tmp/hb2/focused.log`. The original boundary failure is resolved by the explicitly authorized nonpositive-measurement fallback, without changing its expectation.

## Ruling applied
Every docked tile uses `rgba(14,14,16,0.84)` with `blur(22px) saturate(150%)`. The selected tile alone uses `rgba(40,40,46,0.9)` with the same blur and its `rgba(255,255,255,0.28)` edge. This ruling is saved for HB3's Courses / Top 100 switch, which is not built here.

## Files touched
- `src/features/chrome-v2/registry.ts`
- `src/features/chrome-v2/IslandDock.tsx` (new)
- `src/features/chrome-v2/island-dock.css` (new)
- `src/features/explore-magazine/watch/ExploreTopControls.tsx`
- `src/features/explore-magazine/watch/explore-top.css`
- `src/features/explore-magazine/watch/WatchFeed.tsx`
- `src/index.css`
- `src/test/hb2ExploreDock.test.tsx` (new, 10 cases)
- `AGENTS.md`, `roadmap.md`, project memory

`ChromeIsland.tsx` was not changed.

## Tests
No pre-HB2 test was changed. Read-only discovery found no existing test that asserts `/amateur` scrollAway or `.explore-top-sticky`. The full-suite baseline is 6,252 tests / 558 files; the candidate is 6,262 / 559 (+10 tests / +1 file solely `hb2ExploreDock.test.tsx`). This correction adds one case, “docked row stays mounted while hidden, inert and aria-hidden for exit animation” (9 → 10). Full shards were not run because of the new stop.

Authorized rewrites within the new HB2 file (no count delta):
- “no docked controls while the in-place row remains visible”: replaced `expect(dock().querySelector('[role="tablist"]')).toBeNull()` with `expect(within(dock()).queryByRole('tablist')).toBeNull()`; the row now remains mounted but inaccessible as required.
- “hidden dock is aria-hidden, inert and contains no focusable controls”: replaced `expect(dock().querySelector('button,input,[tabindex]')).toBeNull()` with accessibility queries asserting no exposed button/tab; the inert mounted row preserves the authorized exit animation.
- The observer test still asserts `expect(options?.rootMargin).toBe('-56px 0px 0px 0px')` unchanged.

The Courses mock was mistakenly attached and is ignored until HB3 is separately sent. No Courses implementation was added.

## Unverified
Browser screenshots, the docked row's top and computed background, the four full shards, signed-in readback.