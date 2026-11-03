# HB2_EXPLORE report — COMPLETE

## Status
HB2 is complete. The authorized one-line ER3 mock correction preserves the real scroll-helper exports and overrides only its existing spy. No product code or other line in ER3 changed in this correction. All four shards pass, browser folded/docked checks are complete, and the latest automatic build is clean.

## Final verification
Commands: `bunx vitest run --maxWorkers=2 --shard=1/4`, `--shard=2/4`, `--shard=3/4` (rerun after authorized correction), `--shard=4/4`.

| Shard | Passed tests | Passed files |
| --- | ---: | ---: |
| 1 | 1,581 | 140 |
| 2 | 1,524 | 140 |
| 3 | 1,546 | 140 |
| 4 | 1,611 | 139 |
| Total | **6,262** | **559** |

Zero failed tests, failed suites or Vitest unhandled errors in the final four shard outputs. Shards 1/2 retain their successful results from before the one-file ER3 mock correction, as requested. The corrected ER3 suite passes 20/20. `guestScrollLockShortPage.test.tsx` passes 5/5 and is untouched. No additional missing-export correction was needed. Automatic build entry at 15:23:02Z: `build OK`; no manual build/typecheck command was run.

Final logs: `/tmp/hb2/shard-1.log`, `/tmp/hb2/shard-2.log`, `/tmp/hb2/shard-3-correction.log`, `/tmp/hb2/shard-4.log`. The full original failing shard remains at `/tmp/hb2/shard-3.log`.

Authorized diff in `src/test/er3LongFormRails.test.tsx` (one mock only; every test and assertion unchanged):
```diff
-vi.mock('@/lib/getScrollParent', () => ({ scrollPageToTop: f.scroll }));
+vi.mock('@/lib/getScrollParent', async (orig) => ({ ...(await orig<Record<string, unknown>>()), scrollPageToTop: f.scroll }));
```

Reason: HB2 reaches the real nav-direction store through IslandDock; keeping real exports supplies `getPageScrollTop` without replacing product behavior or changing ER3's `scrollPageToTop` spy.

### Historical interrupted full-suite attempt (resolved)
Commands: `bunx vitest run --maxWorkers=2 --shard=1/4`, then `--shard=2/4`, then `--shard=3/4`.
- Shard 1: 1,581 passed / 140 files.
- Shard 2: 1,524 passed / 140 files.
- Shard 3: 1,526 passed / 139 passing files; 1 failed suite (140 files total). The ER3 suite failed to collect, so its 20 cases did not execute.
- Shard 4: not run after the stop.
- Executed total so far: 4,631 passed. No full-suite success or zero-error claim.

```text
FAIL  src/test/er3LongFormRails.test.tsx [ src/test/er3LongFormRails.test.tsx ]
Error: [vitest] No "getPageScrollTop" export is defined on the "@/lib/getScrollParent" mock. Did you forget to return it from "vi.mock"?
❯ getScrollTop src/hooks/useScrollDirection.ts:70:12
❯ registerNavScroller src/hooks/useScrollDirection.ts:118:14
❯ autoRegisterRoots src/hooks/useScrollDirection.ts:186:3
❯ src/hooks/useScrollDirection.ts:194:5
```

Complete shard output retained at `/tmp/hb2/shard-1.log`, `/tmp/hb2/shard-2.log`, `/tmp/hb2/shard-3.log`. ER3 was green in the prior baseline; this newly exposed mock failure is not claimed as pre-existing. Latest automatic build at 15:09:03Z: `build OK`; no manual build/typecheck run.

### Browser verification
Live `/amateur`, fresh signed-out Chromium at 390×844, with `--sat:47px` injected before app mount in the browser response only. Real `#root` is the registered page scroller (844px tall, 4,472px scroll height); no app fixture or product affordance was added.
- Scroll down to 650: dock hidden, opacity 0; left island 46px wide. Screenshot `/tmp/browser/hb2/folded.png`.
- Scroll back up to 610: dock shown, opacity 1; top **109px**, left island 131px wide. Screenshot `/tmp/browser/hb2/docked.png`.
- Search/unselected tiles: computed `rgba(14, 14, 16, 0.84)`; selected tile: `rgba(40, 40, 46, 0.9)` with `rgba(255, 255, 255, 0.28)` border. All compute `blur(22px) saturate(1.5)`.
- Guest right capsule outerHTML byte-identical before/after folding. Docked Shorts tap reads back as SHORTS selected in the in-place row. No page errors.
- Reduced-motion runtime transition duration is `1e-05s` (the app-wide reduced-motion override); the dock's own reduced-motion CSS declares `transition:none`. It is effectively instant.
Screenshots inspected visually; browser output `/tmp/hb2/browser.log`. Signed-in member checks remain unavailable with external_unmanaged authentication.

### Latest focused run
Same focused command below: **92/92 passed**, 5/5 files; `/tmp/hb2/focused-final.log`.

Authorized existing case change, no count delta: `ws1WatchTop.test.tsx`, “the search placeholder reads Search videos and creators”: replaced `expect(screen.getByPlaceholderText('Search videos and creators')).toBeTruthy()` with `expect(within(inPlace).getByPlaceholderText('Search videos and creators')).toBeTruthy()`, after locating `[data-explore-controls="in-place"]` with a null guard. Added `if (dockedField) expect(dockedField.closest('[aria-hidden="true"][inert]')).not.toBeNull()` beside it. This preserves the placeholder assertion while allowing the mandated hidden mounted copy. No other case in that file or product code changed in this correction.

### Earlier verification history

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
- `src/test/ws1WatchTop.test.tsx` (one explicitly authorized assertion scope and hidden-field assertion)
- `src/test/er3LongFormRails.test.tsx` (one explicitly authorized partial-module mock; quoted above)
- `AGENTS.md`, `roadmap.md`, project memory
- `HB2_EXPLORE_REPORT.md`

`ChromeIsland.tsx` was not changed.

## Tests
One pre-HB2 case was changed under explicit authorization, quoted above; its count remains unchanged. The ER3 mock change rewrites no case or assertion and has zero count delta. Read-only discovery found no existing test that asserts `/amateur` scrollAway or `.explore-top-sticky`. The full-suite baseline is **6,252 tests / 558 files**; final result is **6,262 / 559**, +10 tests / +1 file solely `hb2ExploreDock.test.tsx`. The mount correction added its tenth case (9 → 10). No test was deleted or renamed. All historical failures are resolved; no pre-existing unresolved failure was encountered.

The ten added cases reconcile the full-suite delta by name:
1. `/amateur opts into soft fading and squircle condensation without scrollAway`
2. `no docked controls while the in-place row remains visible`
3. `only a row above the island boundary qualifies, not a row below the viewport`
4. `appears below open islands, hides folded, and returns on up scroll`
5. `docked filters update the same in-place selection and vice versa`
6. `hidden dock is aria-hidden, inert and contains no focusable controls`
7. `docked row stays mounted while hidden, inert and aria-hidden for exit animation`
8. `focused docked search remains shown and shares query with the in-place field`
9. `observes the page root with the island boundary, adding no scroll listener`
10. `reduced motion disables dock transitions`

Authorized rewrites within the new HB2 file (no count delta):
- “no docked controls while the in-place row remains visible”: replaced `expect(dock().querySelector('[role="tablist"]')).toBeNull()` with `expect(within(dock()).queryByRole('tablist')).toBeNull()`; the row now remains mounted but inaccessible as required.
- “hidden dock is aria-hidden, inert and contains no focusable controls”: replaced `expect(dock().querySelector('button,input,[tabindex]')).toBeNull()` with accessibility queries asserting no exposed button/tab; the inert mounted row preserves the authorized exit animation.
- The observer test still asserts `expect(options?.rootMargin).toBe('-56px 0px 0px 0px')` unchanged.

The Courses mock was mistakenly attached and is ignored until HB3 is separately sent. No Courses implementation was added.

## Unverified
Signed-in member readback remains unavailable with external_unmanaged authentication; the live guest browser flow and real shared-state tests were verified. Courses/HB3 is intentionally not implemented. No SQL, migrations, deployed RPC/edge-function edits, guest product changes, review wizard, news, round plots, feed_config or native/Median edits were made; round_pool_cap remains 30.