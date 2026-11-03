# ER3 — Long form woven rails: stopped at focused validation

## Implemented
- For you outside search caps the top Shorts shelf at `SHORTS_SHELF_COUNT = 10`. Shorts chip and search result shelf remain uncapped.
- Rail positions: community after 3; Shorts after 13; community after 23; alternating every ten long-form videos. No rail at the last video. Each takes at most ten unseen shorts or grouped members; fewer than three skips that slot without shifting alternation.
- Page-owned allocation uses separate shown sets for shorts and members. Clips can fetch one extra page per eligible Shorts slot before rendering; in-flight attempts are isolated, and an insufficient refill never loops indefinitely. Community keeps the 72-candidate read.
- Shorts rail rendering is shared with the original shelf, including its existing Poster/AutoplayLayer, dimensions, title reservation and viewer indexing. Community retains its original MomentTile coordinator group and rail-local viewer order. Shorts See all shares one select-and-scroll callback.

## STOP — exact failure
Command:
`bunx vitest run src/test/er3LongFormRails.test.tsx src/test/er1ExploreCommunity.test.tsx src/test/ws1WatchTop.test.tsx src/test/ws2WatchMiddle.test.tsx src/test/ws3WatchBottom.test.tsx src/test/watchPageRules.test.ts --maxWorkers=2`

**157 passed / 1 failed / 158 total across six files**. No pre-existing test failed. No unhandled error was reported. Existing CreatorFollowPill/CreatorsRow act warnings appeared in the WS1 suite; all its cases passed.

```text
FAIL src/test/er3LongFormRails.test.tsx > ER3 woven rails > 40 long videos weave the right headings after 3, 13, 23 and 33
AssertionError: expected '8:20NUntitled videoName 2' to contain 'Title 2'

Expected: "Title 2"
Received: "8:20NUntitled videoName 2"

❯ src/test/er3LongFormRails.test.tsx:54:136
```

The new case's position/title assertion fails; its preceding position and heading assertions passed. Its local fixture supplies `caption`, but the rendered long card uses its existing title fallback. No fixture, assertion or component was changed after the failure. Full output preserved: `/tmp/er3/focused.log` (also appended to the sandbox execution log).

Four full shards and browser comparison were **not run** after this new failure, following the stop rule. No full-suite passing claim.

## Test counts
Last reported green baseline: **6,071 tests / 551 files** (ER2).
Candidate inventory: **6,091 tests / 552 files**, exclusively **+20 cases / +1 new file** `er3LongFormRails.test.tsx`. This is an inventory, not a full-suite result. Existing files lose no tests.

New cases (expanded table cases counted separately):
1. uses ten top shorts, ten-video intervals and three-item minimum
2. top For you shelf shows ten while the Shorts grid shows everything
3. 40 long videos weave the right headings after 3, 13, 23 and 33 — failed
4. no short or grouped member repeats across the page and windows keep their existing order
5. fewer than three unseen shorts skips those slots without changing later community positions
6. fewer than three community members skips the slot without changing the next Shorts position
7–10. never adds a rail after the final video at position 3 / 13 / 23 / 33
11–13. does not weave rails on the quick / long / community chip
14. search disables all woven rails and restores the full top result shelf
15. More shorts See all selects Shorts and scrolls to the top
16. community See all keeps the existing destination
17. takes one extra clips page before a short rail renders, once for that slot
18. an insufficient one-page refill skips the rail instead of retrying forever
19. community keeps the 72 candidate read and shares the original autoplay group across rails
20. opens a later short at its correct index in the complete loaded viewer pool

Tests use real MemoryRouter, QueryClientProvider and English I18nextProvider.

## Authorised existing case changes
- `ws1WatchTop.test.tsx` (44 → 44): **“the community rail is still in For you”** and **“the community rail's See all routes to /media?kind=community”** receive three local distinct members instead of one, satisfying the new minimum-three rule. Assertions unchanged: `expect(screen.getByText('From the community')).toBeTruthy()`, `expect(loc.getAttribute('data-path')).toBe('/media')`, `expect(loc.getAttribute('data-search')).toBe('?kind=community')`.
- `ws3WatchBottom.test.tsx` (41 → 41): shared seed used by the two **WS3 order on For you** cases (**“By region → Creators to follow → Top 100 on film → Long form → the community rail”**, **“none of the three on the Shorts chip; Long form keeps its own view”**) now contains `moment('a'), moment('b'), moment('c')` instead of `moment('a')`. Assertions unchanged, including `expect(before(longForm, community)).toBe(true)`. Reason: minimum-three rail, frozen chip exclusions.
- `er1ExploreCommunity.test.tsx` (20 → 20): **“excludes own community items before rail member grouping”** retains the same own-plus-one-other fixture. `expect(container.querySelectorAll('[data-watch-card="community"]')).toHaveLength(1)` → `.toHaveLength(0)`. `expect(container.querySelector('[data-watch-rail="community"]')?.textContent).not.toContain('own')` → `expect(container.querySelector('[data-watch-rail="community"]')).toBeNull()`. Reason: exclusion leaves one unseen member, so ER3 requires the entire rail to be absent.
- No deleted or renamed cases. Other existing assertions unchanged.

## Files touched
1. `src/features/explore-magazine/watch/WatchFeed.tsx`
2. `src/features/explore-magazine/watch/watchRules.ts`
3. `src/test/ws1WatchTop.test.tsx`
4. `src/test/ws3WatchBottom.test.tsx`
5. `src/test/er1ExploreCommunity.test.tsx`
6. `src/test/er3LongFormRails.test.tsx` — new
7. `AGENTS.md` — managed-section local ownership pointer, no existing rule compressed
8. `roadmap.md`
9. `ER3_REPORT.md` — new report

Persistent requirements recorded in `mem://features/watch/er3-woven-rails` and `mem://index.md`.

## Build and scope
Latest automatic preview build observed: **2026-11-03T10:37:46Z — build OK**. No manual build/typecheck run.
No SQL, migrations, RPC or edge-function edits/deployments, feed_config changes, pool-cap changes, native/Median changes. Guest browsing, review wizard, news, round plots and shared autoplay/read modules untouched. `round_pool_cap` remains 30.
Authenticated end-to-end and mock comparison remain unverified; validation stopped before browser work.