# FEED_PAGES_BY_SEEN_NOT_CURSOR — stopped

Date: 2026-11-18. No SQL, migrations, RPC changes, feed_config changes, maintenance-flag changes or round_pool_cap changes.

## Completed edits
- `useSuggestedFeed.ts`: sends `p_user_id`, `p_page_size: 60`, `p_viewer_actor_type`, `p_viewer_actor_id`; removes `p_cursor` entirely. Page 0 omits `p_seen_post_ids`; page >0 sends unique post ids flattened from `queryClient.getQueryData` for the exact existing query key, keeping the last 500 in cache order.
- `initialPageParam`: date/undefined → `0`. Next page: last-row date → `allPages.length` (last page index +1); zero/nonpositive raw rows terminate. Missing/non-numeric restored `rawRowCount` still terminates.
- Removed seen-id ref, identity-reset effect and returned `resetSeen`. Grouping, dedupe, query key, staleTime, focus revalidation, gcTime and remaining returned fields unchanged.
- Caller found: `useClubhouseFeedNav.ts` used `activeFeed.resetSeen()` in refresh and required it in its input type. Removed the field/call/dependency; refresh still resets active index, invokes onTabSwitch and awaits refetch. Page 0 now needs no exclusion reset. `Clubhouse.tsx` still uses that navigation hook and was not edited.
- Other `resetSeen` uses belong to CourseMedia and profile posts; left unchanged.
- Module-local ownership rule recorded beside `useSuggestedFeed`; no cross-area architecture change.

## Tests and STOP
Command: `npx vitest run src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx src/components/media-system/hooks/__tests__/useSuggestedFeed.refetch.test.ts --maxWorkers=2`

8 executed: 6 passed, 2 failed. Exact surviving failures:

1. `src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx:48:55`, **later pages exclude every earlier cached post, use numeric pages and dedupe output**:
   `AssertionError: expected [ 'a', 'b' ] to deeply equal [ 'a', 'b', 'c' ]`
   Assertion: `expect(result.current.posts.map(post => post.id)).toEqual(['a', 'b', 'c']);`
2. Same file `:67:40`, **restored old cursor pages still exclude their posts and continue at page index 2**:
   `AssertionError: expected true to be false // Object.is equality`
   Assertion: `expect(result.current.hasNextPage).toBe(false);`

The second test's immediately preceding cache pageParam assertion passed. This suggests observer notification timing, but that diagnosis is not verified; tests remain unedited after the failures. No reruns or full shards were started, per STOP rule. Typecheck not run after stopping. Preview build log reports `build OK` at 2026-11-18T07:20:38Z.

Inventory: previous reported full scope **9,142** (last run included one unrelated failure); expected new inventory **9,149**, +7 new cases in `useSuggestedFeed.paging.test.tsx`. Full-suite total is not measured this turn. Shards 1–4: **not run**.

New case names:
- first page sends the four fixed arguments with no cursor or exclusions
- later pages exclude every earlier cached post, use numeric pages and dedupe output
- restored old cursor pages still exclude their posts and continue at page index 2
- caps cached exclusions at the newest 500 unique ids in cache order
- a restored page without numeric rawRowCount cannot start another fetch
- a first-page refetch omits exclusions even when cached posts exist
- only reads the cache for the selected business actor

No tests deleted, renamed or assertion-rewritten. Existing `useSuggestedFeed.refetch.test.ts` mock adds `useQueryClient: () => ({ getQueryData: () => undefined })` for the new cache dependency; its original `expect(captured[0].refetchOnWindowFocus).toBe(true)` remains unchanged and passes. No existing test pinned cursor or resetSeen.

## Brief limitation and verification
The required 500-id cap cannot guarantee exclusion of **every** earlier post beyond 500 unique ids. Dedupe preserves unique rendered posts, but older dropped ids can be returned again; if server selection repeats nonempty batches, zero-row termination is not guaranteed. Implemented the explicitly requested cap without adding another stop heuristic or changing the RPC; acceptance A/C cannot be guaranteed for a >500-post candidate pool under these rules.

Authenticated network/restart/scroll verification unavailable: browser auth status is `external_unmanaged`. No account session or live RPC flow was exercised, and no signed-out/demo check is claimed as verification.

## Authorised correction — 2026-11-18 07:27 UTC — stopped again
- Corrected exclusions to `unique(cachedPages.slice(0, pageParam).flatMap(...post ids)).slice(-500)`. A full refetch of page N no longer excludes its own or later cached pages; normal append still covers all existing pages.
- Applied exactly the two authorised waits, expected values unchanged:
  - **later pages exclude every earlier cached post, use numeric pages and dedupe output**: `expect(result.current.posts.map(post => post.id)).toEqual(['a', 'b', 'c']);` → `await waitFor(() => expect(result.current.posts.map(post => post.id)).toEqual(['a', 'b', 'c']));`. Reason: wait for observer notification. This check passed.
  - **restored old cursor pages still exclude their posts and continue at page index 2**: `expect(result.current.hasNextPage).toBe(false);` → `await waitFor(() => expect(result.current.hasNextPage).toBe(false));`. Same reason; this test passed.
- Added one test, **a full refetch of page 1 excludes only cached page 0, not its own posts**. Cache `[a,b]`, `[c,d]`; asserts second RPC `p_seen_post_ids` equals `['a', 'b']`, and page 0 omits exclusions. Passed.
- No deleted or renamed tests; no other assertions changed.

Focused command (same as above): `npx vitest run src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx src/components/media-system/hooks/__tests__/useSuggestedFeed.refetch.test.ts --maxWorkers=2`.

**9 executed / 7 passed / 2 failed**. New failing checks, both left unchanged:
1. `src/components/media-system/hooks/__tests__/useSuggestedFeed.paging.test.tsx:53:40`, **later pages exclude every earlier cached post, use numeric pages and dedupe output** (a later check than the approved posts wait):
   `AssertionError: expected true to be false // Object.is equality`
   Assertion: `expect(result.current.hasNextPage).toBe(false);`
2. Same file `:91:55`, **a first-page refetch omits exclusions even when cached posts exist**:
   `AssertionError: expected [ 'old' ] to deeply equal [ 'fresh' ]`
   Assertion: `expect(result.current.posts.map(post => post.id)).toEqual(['fresh']);`

Stopped on these unexpected failures as requested. No rerun, shards or typecheck after this stop. Shards 1/2/3/4: not run. The passing cache/RPC assertions and earlier approved waits suggest the same observer-notification timing issue; not asserted as a confirmed diagnosis.

Expected inventory **9,150**, +1 from the previous stopped inventory of 9,149, +8 new cases overall versus last measured full scope **9,142**. Full-suite total remains unmeasured this turn. Preview build log: `build OK` at 2026-11-18T07:27:19Z. Authenticated checks and the 500-id limitation remain as documented above.