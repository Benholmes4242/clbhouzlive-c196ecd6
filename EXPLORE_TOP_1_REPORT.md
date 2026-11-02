# EXPLORE_TOP_1 report

## Result
Signed-off top control row and people row implemented. Ben resolved You as white even without has_new and authorised opening search first in the existing placeholder test. No pre-existing failures remain; no new failures observed.

## Files touched
- src/features/explore-magazine/watch/WatchFeed.tsx
- src/features/explore-magazine/watch/ExploreTopControls.tsx (new)
- src/features/explore-magazine/watch/CreatorsRow.tsx
- src/features/explore-magazine/watch/useExplorePeopleRow.ts (new)
- src/features/explore-magazine/watch/explore-top.css (new)
- src/components/ui/RailChips.tsx
- src/lib/publishedPostViewer.ts (new)
- src/pages/PostDeepLinkPage.tsx
- src/features/admin/lib/retiredEvents.ts
- src/index.css
- src/test/ws1WatchTop.test.tsx
- roadmap.md
- EXPLORE_TOP_1_REPORT.md (new)

Ownership is recorded in the new module headers and the updated RailChips header, following the root AGENTS.md instruction to keep module-local facts in headers. Shared loader retains the published singular select, blocked lookup/fail-open behaviour, full ActivityPost mapping and active-actor liked lookup; deep-link preview, redirects and fullscreen lifecycle remain unchanged.

## Verification and count reconciliation
Baseline: 5,932 tests / 545 files (last reported WS1.2).
After: 5,936 tests / 545 files, all passing. The only inventory delta is ws1WatchTop.test.tsx: 35 -> 39 (+4), because the authorised Creators describe block changes from 10 cases to 14. No other test file changed. The separately authorised search-placeholder case retains its name and existing assertion, adding the search-button click first.

Focused command: `bunx vitest run src/test/ws1WatchTop.test.tsx --maxWorkers=2`: 39/39.
Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4` for N=1,2,3,4.
- Shard 1: 1,492 tests / 137 files, exit 0.
- Shard 2: 1,460 tests / 137 files, exit 0.
- Shard 3: 1,526 tests / 137 files, exit 0.
- Shard 4: 1,458 tests / 134 files, exit 0.
All four: zero failures, zero unhandled errors. Full output retained in `/tmp/explore-top/shard1.log` through `shard4.log`; focused output in `/tmp/explore-top/focused.log`. React act warnings exist in the focused output; these are warnings, not unhandled errors.
Automatic typecheck/build: `build OK` at 2026-11-02T21:18:42Z. Intermediate onDepart/required posterUrl errors were cleared before full verification; no surviving error.

Live preview at /amateur (390x844): three chips, search-button open, focused search field and Cancel -> three restored chips verified. Element screenshots inspected: `/tmp/browser/explore-top/controls.png`, `/tmp/browser/explore-top/search.png`. Guest people row absent as required. Member people-row/fullscreen/composer end-to-end and member screenshot parity are unavailable because authentication is `external_unmanaged`; not claimed verified. No credentials requested or guest gating bypassed.

## Authorised search case before/after
Before:
```tsx
it('the search placeholder reads Search videos and creators', () => {
  mountFeed();
  expect(screen.getByPlaceholderText('Search videos and creators')).toBeTruthy();
});
```
After:
```tsx
it('the search placeholder reads Search videos and creators', () => {
  mountFeed();
  fireEvent.click(screen.getByRole('button', { name: 'Search videos and creators' }));
  expect(screen.getByPlaceholderText('Search videos and creators')).toBeTruthy();
});
```
Why: the signed-off initial state now exposes a search button rather than a field; the original placeholder assertion remains unchanged.

## Authorised Creators block: every original case and assertion
The following complete before/after blocks quote every changed, removed and replacement case, rather than silently dropping old assertions. Old minimum-three/eight threshold, weekly rings, second lines, business tiles and business destinations are retired because the server supplies personal day-post people rows with new rules. The old WS1.2 styling-only case is replaced by equal-slot structural coverage; avatar/ring geometry and clipping are specified in scoped CSS. Follow-sheet and session-view coverage remain with the new read/event names. Four additional net cases cover the requested search, restoration and opt-in chip behaviour and guest/You distinctions. Old pure-rule cases outside this block remain unchanged as legacy helper coverage.

### Before
```tsx
describe('WS1 Creators row', () => {
  it('hides, heading included, when the read returns fewer than three', () => {
    f.creators = { data: [creator('a'), creator('b')], isFetched: true, isError: false };
    const { container } = mountFeed();
    expect(screen.queryByText('Creators')).toBeNull();
    expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
  });

  it('shows the skeleton while loading: the heading place plus five squircles', () => {
    f.creators = { data: [], isFetched: false, isError: false };
    const { container } = mountFeed();
    const skeleton = container.querySelector('[data-watch-creators="skeleton"]');
    expect(skeleton).toBeTruthy();
    expect(skeleton!.querySelectorAll('span').length).toBe(5);
  });

  it('See all appears only when the read returns more than eight', () => {
    f.creators = { data: Array.from({ length: 8 }, (_, i) => creator(`c${i}`)), isFetched: true, isError: false };
    const eight = mountFeed();
    expect(within(eight.container.querySelector('[data-watch-creators="row"]') as HTMLElement).queryByText('See all')).toBeNull();
    eight.unmount();
    f.creators = { data: Array.from({ length: 9 }, (_, i) => creator(`c${i}`)), isFetched: true, isError: false };
    const nine = mountFeed();
    expect(within(nine.container.querySelector('[data-watch-creators="row"]') as HTMLElement).getByText('See all')).toBeTruthy();
  });

  it('a creator with a video this week wears the ring and reads "{n} this week"', () => {
    f.creators = {
      data: [creator('a', { videos_7d: 2 }), creator('b'), creator('c')],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    expect(screen.getByText('2 this week')).toBeTruthy();
    expect(container.querySelectorAll('[data-creator-ring="true"]').length).toBe(1);
  });

  it('WS1.2: the ring wrapper is the avatar box (flex, 1/1.05, 34%) and the scroller leaves vertical room', () => {
    f.creators = {
      data: [creator('a', { videos_7d: 1 }), creator('b'), creator('c')],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    const ring = container.querySelector('[data-creator-ring="true"]') as HTMLElement;
    expect(ring.style.display).toBe('flex');
    expect(ring.style.aspectRatio).toBe('1 / 1.05');
    expect(ring.style.borderRadius).toBe('34%');
    const scroller = container.querySelector('[data-watch-creators="row"] .no-scrollbar') as HTMLElement;
    const [padTop, , padBottom] = scroller.style.padding.split(' ');
    expect(parseFloat(padTop)).toBeGreaterThanOrEqual(4);
    expect(parseFloat(padBottom ?? padTop)).toBeGreaterThanOrEqual(4);
  });

  it('otherwise the second line is the area through shortCourseName, omitted when null', () => {
    f.creators = {
      data: [
        creator('a', { area: 'Royal County Down Golf Club (Championship)' }),
        creator('b'),
        creator('c'),
      ],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    expect(screen.getByText('Royal County Down · Championship')).toBeTruthy();
    expect(container.querySelectorAll('[data-creator-line="area"]').length).toBe(1);
  });

  it('a person with no photo gets initials; a business with no logo gets the black name tile', () => {
    f.creators = {
      data: [
        creator('a', { display_name: 'Danny Holmes' }),
        creator('b', { actor_type: 'business', display_name: 'Golf Life', handle: 'golf-life' }),
        creator('c', { avatar_url: 'https://example.com/a.jpg' }),
      ],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    const tile = container.querySelector('[data-creator-avatar="business-tile"]');
    expect(tile?.textContent).toBe('Golf Life');
    const avatars = container.querySelectorAll('[data-sq-avatar]');
    expect(avatars[0].textContent).toBe('D');
    expect(avatars[1].textContent).toBe('img');
  });

  it('taps route to the profile for a person and /business/{slug} for a business', () => {
    f.creators = {
      data: [
        creator('a', { handle: 'jayk' }),
        creator('b', { actor_type: 'business', display_name: 'Golf Life', handle: 'golf-life' }),
        creator('c'),
      ],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    fireEvent.click(screen.getByText('Name a'));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/profile/jayk');
    /* The black tile and the name line both read "Golf Life"; tap the cell. */
    fireEvent.click(container.querySelector('[data-watch-creator="business"]')!);
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/business/golf-life');
    expect(f.track).toHaveBeenCalledWith('watch_creator_tapped', { actor_type: 'business', position: 2 });
  });

  it('See all opens the sheet, which lists every creator and follows through useToggleFollow', async () => {
    const nine = Array.from({ length: 9 }, (_, i) => creator(`c${i}`));
    f.creators = { data: nine, isFetched: true, isError: false };
    f.creatorsSheet = { data: [...nine, creator('extra')], isFetched: true, isError: false };
    const { container } = mountFeed();
    fireEvent.click(within(container.querySelector('[data-watch-creators="row"]') as HTMLElement).getByText('See all'));
    expect(f.track).toHaveBeenCalledWith('watch_creators_see_all');
    const sheet = screen.getByTestId('bottom-sheet');
    expect(within(sheet).getByText('Name extra')).toBeTruthy();
    fireEvent.click(within(sheet).getAllByText('Follow')[0]);
    await vi.waitFor(() => {
      expect(f.follow.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ targetActorType: 'personal', targetActorId: 'c0' }),
      );
    });
  });

  it('watch_creators_viewed fires once per session at 50% visible', () => {
    f.creators = { data: [creator('a'), creator('b'), creator('c')], isFetched: true, isError: false };
    mountFeed();
    fireVisible();
    expect(f.track).toHaveBeenCalledWith('watch_creators_viewed');
    fireVisible();
    expect(f.track.mock.calls.filter(([name]) => name === 'watch_creators_viewed').length).toBe(1);
  });
});


```

### After
```tsx
const person = (id: string, over: Partial<ExplorePerson> = {}): ExplorePerson => ({ tier: 'quiet', actor_id: id, display_name: `Name ${id}`, handle: `h-${id}`, avatar_url: null, is_verified: false, is_creator: false, has_new: false, new_post_ids: [], latest_at: null, ...over });
const people = (...others: ExplorePerson[]) => { f.creators = { data: [person('me', { tier: 'you' }), ...others], isFetched: true, isError: false }; };

describe('WS1 Creators row', () => {
  it('You is first with a plus and opens the existing composer', () => {
    people(person('a'));
    const { container } = mountFeed();
    const row = container.querySelector('[data-watch-creators="row"]') as HTMLElement;
    const buttons = within(row).getAllByRole('button');
    expect(buttons[0].getAttribute('aria-label')).toBe('You');
    expect(buttons[0].querySelector('[data-explore-plus]')).not.toBeNull();
    fireEvent.click(buttons[0]);
    expect(usePostStudioStore.getState().isOpen).toBe(true);
    expect(usePostStudioStore.getState().initialActorId).toBe('me');
    expect(f.track).toHaveBeenCalledWith('explore_row_you_tapped');
  });
  it('only has_new wears a ring and quiet names are muted while You stays ink', () => {
    people(person('a', { has_new: true }), person('b'));
    const { container } = mountFeed();
    expect(container.querySelectorAll('[data-creator-ring="true"]')).toHaveLength(1);
    expect(screen.getByText('Name a').getAttribute('data-name-ink')).toBe('ink');
    expect(screen.getByText('Name b').getAttribute('data-name-ink')).toBe('mute');
    expect(screen.getByText('You').getAttribute('data-name-ink')).toBe('ink');
  });
  it('all names occupy the same sibling slot without a second line', () => {
    people(person('a', { has_new: true }), person('b'));
    const { container } = mountFeed();
    const buttons = within(container.querySelector('[data-watch-creators="row"]') as HTMLElement).getAllByRole('button');
    for (const button of buttons) {
      expect(button.children).toHaveLength(2);
      expect(button.children[0].classList.contains('explore-person-ring')).toBe(true);
      expect(button.children[1].classList.contains('explore-person-name')).toBe(true);
    }
  });
  it('has_new opens the permitted posts oldest first at index zero', async () => {
    people(person('a', { tier: 'following', has_new: true, new_post_ids: ['old', 'new'] }));
    mountFeed(); fireEvent.click(screen.getByRole('button', { name: 'Name a' }));
    await vi.waitFor(() => expect(f.openWithOrigin).toHaveBeenCalledWith(expect.objectContaining({ posts: [{ id: 'old' }, { id: 'new' }], index: 0, openedFrom: 'explore-people' })));
    expect(f.loadPosts).toHaveBeenCalledWith(['old', 'new'], expect.objectContaining({ userId: 'me', actorType: 'personal' }));
    expect(f.track).toHaveBeenCalledWith('explore_row_tapped', { tier: 'following', position: 2, has_new: true });
  });
  it('a quiet tile goes to the existing profile destination without loading posts', () => {
    people(person('a')); mountFeed(); fireEvent.click(screen.getByRole('button', { name: 'Name a' }));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/profile/h-a');
    expect(f.loadPosts).not.toHaveBeenCalled();
  });
  it('See all appears only at 21 others and the row caps others at 20', () => {
    people(...Array.from({ length: 20 }, (_, i) => person(`c${i}`)));
    const first = mountFeed();
    expect(within(first.container.querySelector('[data-watch-creators="row"]') as HTMLElement).queryByText('See all')).toBeNull();
    first.unmount(); people(...Array.from({ length: 21 }, (_, i) => person(`c${i}`)));
    const second = mountFeed(); const row = second.container.querySelector('[data-watch-creators="row"]') as HTMLElement;
    expect(within(row).getByText('See all')).toBeTruthy();
    expect(within(row).getAllByRole('button')).toHaveLength(22);
    expect(within(row).queryByText('Name c20')).toBeNull();
  });
  it('hides for anonymous guests even when people return', () => {
    f.anonymous = true; people(person('a')); const { container } = mountFeed();
    expect(container.querySelector('[data-watch-creators]')).toBeNull();
  });
  it('hides when only You returns', () => {
    people(); const { container } = mountFeed(); expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
  });
  it('the loading skeleton has five avatar and name pairs and no heading', () => {
    f.creators = { data: [], isFetched: false, isError: false }; const { container } = mountFeed();
    const skeleton = container.querySelector('[data-watch-creators="skeleton"]') as HTMLElement;
    expect(skeleton.querySelectorAll('.explore-person-ring')).toHaveLength(5);
    expect(skeleton.querySelectorAll('.explore-name-skeleton')).toHaveLength(5);
    expect(skeleton.querySelector('h2')).toBeNull();
  });
  it('See all opens the same sheet with the larger people list and follow action', async () => {
    people(...Array.from({ length: 21 }, (_, i) => person(`c${i}`)));
    f.creatorsSheet = { data: [person('extra')], isFetched: true, isError: false };
    const { container } = mountFeed(); fireEvent.click(within(container.querySelector('[data-watch-creators="row"]') as HTMLElement).getByText('See all'));
    expect(f.track).toHaveBeenCalledWith('explore_row_see_all');
    const sheet = screen.getByTestId('bottom-sheet'); expect(within(sheet).getByText('Name extra')).toBeTruthy();
    fireEvent.click(within(sheet).getByText('Follow'));
    await vi.waitFor(() => expect(f.follow.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ targetActorType: 'personal', targetActorId: 'extra' })));
  });
  it('explore_row_viewed fires once per session at 50 percent visibility', () => {
    people(person('a')); mountFeed(); fireVisible(); fireVisible();
    expect(f.track.mock.calls.filter(([name]) => name === 'explore_row_viewed')).toHaveLength(1);
  });
  it('search opens with Cancel and Cancel clears the query and restores chips', () => {
    mountFeed(); expect(screen.queryByRole('searchbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Search videos and creators' }));
    const input = screen.getByRole('searchbox'); expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: 'walton' } }); expect(screen.queryByRole('tablist')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
  it('a restored query opens directly into the field state', () => {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ExploreTopControls query="walton" onQuery={() => {}} options={[]} value="all" onChange={() => {}} ariaLabel="Filters" placeholder="Search videos and creators" sticky={false} /></QueryClientProvider></MemoryRouter>);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('walton');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });
  it('RailChips lg leaves default and sm caller selection behaviour unchanged', () => {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}>{(['lg', 'md', 'sm'] as const).map((size) => <RailChips key={size} size={size} options={[{ id: 'a', label: size }, { id: 'b', label: `${size} other` }]} value="a" onChange={() => {}} ariaLabel={size} />)}</QueryClientProvider></MemoryRouter>);
    for (const size of ['lg', 'md', 'sm']) {
      const tabs = within(screen.getByRole('tablist', { name: size })).getAllByRole('tab');
      expect(tabs[0].getAttribute('aria-selected')).toBe('true'); expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    }
    expect(screen.getByRole('tablist', { name: 'lg' }).classList.contains('explore-lg-chips')).toBe(true);
    expect(screen.getByRole('tablist', { name: 'md' }).classList.contains('explore-lg-chips')).toBe(false);
    expect(screen.getByRole('tablist', { name: 'sm' }).classList.contains('explore-lg-chips')).toBe(false);
  });
});


```

## Scope fences
No SQL, migrations, migration files, deployed RPC or edge-function edits, feed_config edits, round_pool_cap changes, native/Median changes, guest-browsing policy changes, review-wizard changes, news changes or round-plot changes. Watch lead, Continue watching and lower shelves/views remain unchanged. Existing sm/md RailChips selection behaviour is preserved; lg is opt-in. The mock annotation was not built.
