# ER1 Explore top and Community

## Result
Golfers to watch no longer mounts. Four canonical tiles include Community; clipped selections scroll smoothly into view. Community uses the requested all-time pool, excludes own items, sorts newest first without member grouping, uses square poster-only MomentTiles, wraps names, truncates course names and opens the canonical viewer in displayed order. Six-square loading, retry and empty states included. Own personal Shorts/Long form are filtered before grouping/counts outside search; business actor rows remain; search retains own videos.

## Files touched
- src/features/explore-magazine/watch/WatchFeed.tsx
- src/features/explore-magazine/watch/watchFilters.ts
- src/features/explore-magazine/watch/ExploreTopControls.tsx
- src/features/explore-magazine/watch/explore-top.css
- src/test/ws1WatchTop.test.tsx
- src/test/er1ExploreCommunity.test.tsx (new)
- AGENTS.md
- roadmap.md
- Project memory: index and watch-chips-no-friends.
- ER1_REPORT.md (this report).

## Retained, now unused in the app
CreatorsRow.tsx and its useExplorePeopleRow.ts hook are retained unmodified. useFeaturedCreators.ts was already dormant and remains unchanged. Standalone CreatorsRow tests still exercise the retained implementation; none deleted. Creators to follow is untouched.

## Tests
Last reported baseline: 6,041 tests / 549 files. Final: **6,061 / 550**, +20 tests / +1 file, all from er1ExploreCommunity.test.tsx. ws1WatchTop remains 44 cases; no tests deleted. Every changed existing case/setup is quoted below. Added cases cover all-time query enablement/120 ceiling, removal, repeated-member grid order/viewer handoff/no autoplay, loading/error/empty, personal owner and actor fallback/business preservation, four search entry states, counts/Showing, both community exclusions and clipped selection scrolling.

Commands:
- bunx vitest run src/test/er1ExploreCommunity.test.tsx src/test/ws1WatchTop.test.tsx src/test/ws2WatchMiddle.test.tsx src/test/ws3WatchBottom.test.tsx --maxWorkers=2: **131/131**.
- Final focused after stylesheet dependency fix: bunx vitest run src/test/er1ExploreCommunity.test.tsx src/test/ws1WatchTop.test.tsx --maxWorkers=2: **64/64**.
- bunx vitest run --maxWorkers=2 --shard=1/4: **1,504 / 138 files**.
- Same command --shard=2/4: **1,504 / 138**.
- Same command --shard=3/4: **1,554 / 138**.
- Same command --shard=4/4: **1,499 / 136**.
Total **6,061 / 550**, zero failures, zero unhandled errors; all shard exit statuses 0. Outputs retained at /tmp/er1-shard-{1,2,3,4}.log. No pre-existing failures observed. Four full shards preceded the final stylesheet import and scoped overlay-only CSS correction; final focused tests passed after the import. No manual build/typecheck run, per environment instruction; latest automatic build is clean.

## Browser verification and limits
Real public /amateur at 404×970 displayed four tiles; Community selected, 76 real community items rendered in two columns. Screenshot /tmp/browser/er1/community.png. Browser verification identified and corrected the removed-row stylesheet dependency and suppressed shared centred play/duration overlays locally; Community keeps only the specified bottom-left mark. Signed-in member end-to-end exclusion/search verification unavailable: external_unmanaged authentication. Verified via real-provider regression tests instead; no signed-in proof claimed. Server exclusion changes reported by Ben were not independently audited or modified.

Frozen mock differences: unrelated lead, community rail and lower shelf geometry retained as shipped. No SQL, migrations, deployed functions/RPC edits, guest logic, wizard, news, round plots, native/Median or feed_config changes. round_pool_cap remains 30.

## Existing cases changed or retargeted
### reads For you · Shorts · Long form, in that order, with no Community chip
Original assertions / changed setup:
```tsx
expect(tabs.map((tab) => tab.textContent)).toEqual(['For you', 'Shorts', 'Long form']);
expect(tabs[0].getAttribute('aria-selected')).toBe('true');
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### maps the old values: all → For you, quick → Shorts, community → For you
Original assertions / changed setup:
```tsx
expect(mapWatchFilter('all')).toBe('all');
expect(mapWatchFilter('quick')).toBe('quick');
expect(mapWatchFilter('long')).toBe('long');
expect(mapWatchFilter('community')).toBe('all');
expect(mapWatchFilter(null)).toBe('all');
expect(WATCH_CHIPS).toEqual(['all', 'quick', 'long']);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### a linked community entry lands on For you
Original assertions / changed setup:
```tsx
expect(tabs[0].getAttribute('aria-selected')).toBe('true');
expect(tabs.map((tab) => tab.textContent)).toEqual(['For you', 'Shorts', 'Long form']);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### no you card is rendered and no plus or composer path exists
Original assertions / changed setup:
```tsx
expect(cards).toHaveLength(1);
expect(cards[0].getAttribute('aria-label')).toBe('Name a');
expect(screen.queryByText('You')).toBeNull();
expect(container.querySelector('[data-explore-plus]')).toBeNull();
expect(usePostStudioStore.getState().isOpen).toBe(false);
expect(f.track).not.toHaveBeenCalledWith('explore_row_you_tapped');
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### shows the Golfers to watch heading through the shelf heading without a sub-line
Original assertions / changed setup:
```tsx
expect(within(row).getByText('Golfers to watch')).toBeTruthy();
expect(row.querySelectorAll('[data-explore-card]')[0].previousElementSibling).toBeNull();
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### each tier prints its own lines 2 and 3, with line 3 inked only when new
Original assertions / changed setup:
```tsx
expect(lines).toEqual([
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### names reserve two lines so lines 2 and 3 share a top offset across one- and two-line names
Original assertions / changed setup:
```tsx
expect(kids).toEqual(['explore-card-ring', 'explore-card-name', 'explore-card-why', 'explore-card-detail']);
expect(nameRule).toContain('min-height:calc(13px * 1.25 * 2)');
expect(nameRule).toContain('-webkit-line-clamp:2');
expect(nameRule).toContain('line-height:1.25');
expect(nameRule).not.toContain('nowrap');
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### has_new opens the permitted posts oldest first at index zero
Original assertions / changed setup:
```tsx
await vi.waitFor(() => expect(f.openWithOrigin).toHaveBeenCalledWith(expect.objectContaining({ posts: [{ id: 'old' }, { id: 'new' }], index: 0, openedFrom: 'explore-people' })));
expect(f.loadPosts).toHaveBeenCalledWith(['old', 'new'], expect.objectContaining({ userId: 'me', actorType: 'personal' }));
expect(f.track).toHaveBeenCalledWith('explore_row_tapped', { tier: 'following', position: 1, has_new: true });
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### a quiet card goes to the existing profile destination without loading posts
Original assertions / changed setup:
```tsx
expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/profile/h-a');
expect(f.loadPosts).not.toHaveBeenCalled();
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### See all appears only at 21 or more others, the rail caps at 20 and has no See all tile
Original assertions / changed setup:
```tsx
expect(within(first.container.querySelector('[data-watch-creators="row"]') as HTMLElement).queryByText('See all')).toBeNull();
expect(within(row).getByText('See all')).toBeTruthy();
expect(cardsOf(second.container)).toHaveLength(20);
expect(within(row.querySelector('[data-explore-rail]') as HTMLElement).queryByText('See all')).toBeNull();
expect(within(row).queryByText('Name c20')).toBeNull();
expect(showsPeopleSeeAll(20)).toBe(false);
expect(showsPeopleSeeAll(21)).toBe(true);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### hides for anonymous guests even when people return
Original assertions / changed setup:
```tsx
expect(container.querySelector('[data-watch-creators]')).toBeNull();
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### the whole section, heading included, is hidden when only you comes back
Original assertions / changed setup:
```tsx
expect(container.querySelector('[data-watch-creators]')).toBeNull();
expect(screen.queryByText('Golfers to watch')).toBeNull();
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### the loading skeleton is a heading place plus three card placeholders
Original assertions / changed setup:
```tsx
expect(skeleton.querySelectorAll('.explore-head-skeleton')).toHaveLength(1);
expect(skeleton.querySelectorAll('.explore-card-skeleton')).toHaveLength(3);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### See all opens the same sheet with the larger list, without you, and the follow action
Original assertions / changed setup:
```tsx
expect(f.track).toHaveBeenCalledWith('explore_row_see_all');
const sheet = screen.getByTestId('bottom-sheet'); expect(within(sheet).getByText('Name extra')).toBeTruthy();
expect(within(sheet).queryByText('You')).toBeNull();
await vi.waitFor(() => expect(f.follow.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ targetActorType: 'personal', targetActorId: 'extra' })));
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### explore_row_viewed fires once per session at 50 percent visibility
Original assertions / changed setup:
```tsx
expect(f.track.mock.calls.filter(([name]) => name === 'explore_row_viewed')).toHaveLength(1);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### search opens with Cancel and Cancel clears the query and restores chips
Original assertions / changed setup:
```tsx
mountFeed(); expect(screen.queryByRole('searchbox')).toBeNull();
const input = screen.getByRole('searchbox'); expect(document.activeElement).toBe(input);
fireEvent.change(input, { target: { value: 'walton' } }); expect(screen.queryByRole('tablist')).toBeNull();
fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(screen.queryByRole('searchbox')).toBeNull();
expect(screen.getAllByRole('tab')).toHaveLength(3);
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.

### neither block renders on the Shorts or Long form chips
Original assertions / changed setup:
```tsx
expect(container.querySelector('[data-watch-creators="row"]')).toBeTruthy();
expect(container.querySelector('[data-watch-lead="upright"]')).toBeTruthy();
expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
expect(container.querySelector('[data-watch-lead]')).toBeNull();
expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
expect(container.querySelector('[data-watch-lead]')).toBeNull();
```
Reason: ER1 restores Community/four chips, removes the row from Explore, or mounts the retained dormant CreatorsRow directly to preserve its original assertions.
