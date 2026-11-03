# ER2 — Creators to follow and By region

## Result
- `useWatchSpotlights` requests `p_limit: 5`, retaining the existing per-visit cache, server row order, snap rail, dots, WS6.1 width and full-width single-card behavior.
- Heading is **Creators to follow** using the existing English key. Each card starts from `row.following`, with per-visit overrides, independent toggles and no repick/reorder. Following uses the signed-off neutral fill/edge/text through existing global tokens.
- One rail-owned `useRecentActivity` call receives all actor ids in displayed order. Cards reuse unchanged `ActiveRing` and `ActiveAvatarDoor`; active avatars navigate to `/post/{latest-id}` without triggering the head's profile door. Inactive avatars retain the shared equal-sized card slot.
- Only the Your patch chip was removed from region tiles; ordering, navigation, tracking, counts, imagery and geometry remain.
- Generated Supabase types already include `following: boolean`; no type regeneration or type-file edit was necessary.

## Files touched
1. `src/features/explore-magazine/watch/CreatorSpotlight.tsx`
2. `src/features/explore-magazine/watch/useWatchBottom.ts`
3. `src/features/explore-magazine/watch/RegionsShelf.tsx`
4. `src/features/explore-magazine/watch/spotlight.css`
5. `public/locales/en/courses.json`
6. `src/test/ws3WatchBottom.test.tsx`
7. `src/test/ws2WatchMiddle.test.tsx`
8. `src/test/er2CreatorsRegion.test.tsx` — new
9. `AGENTS.md` — local ownership pointer inside its managed section; no existing rule removed or compressed
10. `roadmap.md`
11. `ER2_REPORT.md` — this report

Persistent requirements recorded in `mem://features/watch/er2-creators-region` and indexed in `mem://index.md`.

## Authorised existing test changes
No tests were deleted. No existing fixture data was changed.

### `ws3WatchBottom.test.tsx` (41 → 41)
- Renamed **“By region → Creator to follow → Top 100 on film → Long form → the community rail”** to the plural heading. Assertions remain `expect(before(regions, spotlight)).toBe(true)` and the remaining unchanged ordering assertions. Reason: ER2 plural heading; ordering is frozen.
- **“hides, heading included, with no row and on error”**: `expect(headingByText('Creator to follow')).toBeNull()` → `expect(headingByText('Creators to follow')).toBeNull()`. Reason: test must protect absence of the new heading.
- Renamed **“plural read calls limit three and caches picks within one visit”** to **“plural read calls limit five and caches picks within one visit”**. `expect(f.rpc).toHaveBeenCalledWith('get_watch_spotlights', { p_limit: 3 })` → same assertion with `p_limit: 5`. Existing one-call/same-visit and two-call/new-visit assertions retained.
- Added an empty activity-hook mock to this existing isolated component suite, avoiding unrelated RPC calls. The new ER2 suite below exercises the real activity hook and canonical door/ring components.

### `ws2WatchMiddle.test.tsx` (26 → 26)
- Renamed **“shows Your patch only on the home region, and singular/plural counts”** to **“shows no Your patch on any region, and retains singular/plural counts”**.
- `expect(patch).toHaveLength(1)` → `expect(patch).toHaveLength(0)`.
- `expect(container.querySelector('[data-region-tile="Kent"] [data-your-patch]')).not.toBeNull()` → `.toBeNull()`.
- Reason: ER2 explicitly removes every patch chip. All three singular/plural assertions remain unchanged.

## New tests and reconciliation
Last reported baseline: **6,061 passing tests / 550 files** (ER1).
Final: **6,071 passing tests / 551 files**. Delta **+10 tests / +1 file**, exclusively `er2CreatorsRegion.test.tsx`:
1. renders the plural heading from the real English provider
2. reads five spotlights and preserves all five rows in server order
3. starts a following row as Following and other rows as Follow
4. unfollowing affects only that card without reordering or repicking
5. keeps per-card overrides when the same visit remounts
6. one activity RPC serves all five actor ids in card order
7. active post avatar uses the canonical ring and opens its latest post, not its profile
8. active review avatar uses the canonical ring and opens its latest post, not its profile
9. active round avatar uses the canonical ring and opens its latest post, not its profile
10. inactive avatars are not doors and retain the same padded head slot

Real QueryClientProvider, MemoryRouter and English I18nextProvider are used. The real spotlight read, activity read, ActiveRing, ActiveAvatarDoor and SquircleAvatar render in these tests; only the service boundary/session/follow mutation are substituted.

## Commands and results
Focused:
`bunx vitest run src/test/er2CreatorsRegion.test.tsx src/test/ws3WatchBottom.test.tsx src/test/ws2WatchMiddle.test.tsx src/test/activeRing.test.tsx --maxWorkers=2`
**104/104 passed across four files**, zero failures/unhandled errors. Output: `/tmp/er2/focused.log`.

Full suite:
- `bunx vitest run --maxWorkers=2 --shard=1/4` — **1,504 / 138 files**
- `bunx vitest run --maxWorkers=2 --shard=2/4` — **1,504 / 138 files**
- `bunx vitest run --maxWorkers=2 --shard=3/4` — **1,509 / 138 files**
- `bunx vitest run --maxWorkers=2 --shard=4/4` — **1,554 / 137 files**

Sum: **6,071/6,071 passed / 551 files; zero failures and zero unhandled errors**. No pre-existing failure observed. New file redistributes shard membership, so compare suite totals rather than individual shard deltas. Complete logs remain in `/tmp/er2/shard-{1,2,3,4}.log`. No failing shard exists.

Automatic preview build: latest `/tmp/observability/build-errors.log` entry **2026-11-03T10:21:14Z — build OK**. No manual build or typecheck was run, following the environment's automatic-check requirement.

## Browser evidence and limitations
Real public `/amateur`, Chromium **404×970**:
- Three live creator cards, plural heading and dots visibly rendered; cards measure **340px**, each head **65.796875px**.
- Eight region tiles; **zero** `data-your-patch` chips.
- **Zero page errors**, no document horizontal overflow.
- Screenshots inspected: `/tmp/browser/er2/creator-rail.png` and `/tmp/browser/er2/public-explore.png`.
- Public cards are inactive, so active/inactive equality, latest-post isolation and server-following rows are verified in real-component regressions, not claimed as live authenticated browser evidence.
- Authentication status is `external_unmanaged`: authenticated end-to-end follow writes/readback and live activity rings cannot be verified here. No credentials requested, session invented or guest gating bypassed.
- Frozen differences from the illustrative mock remain authoritative in the build: original region name/count positions, scrim and text sizes, and existing ShelfHeading typography were not changed. The mock's old clear inactive wrapper is not adopted: ER2 explicitly requires importing the current canonical inactive-card ActiveRing with its thin band.

## Scope
No SQL, migrations, migration files, RPC edits, edge-function edits/deployments, feed_config changes, pool-cap changes, native/Median changes or shared activity-ring/read/door changes. Guest browsing, review wizard, news and round plots untouched. `round_pool_cap` remains 30.