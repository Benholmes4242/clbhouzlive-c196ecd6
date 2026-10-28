# Course gallery — completed-edit stop report

## Result
Stopped after the first full suite failure. No app or test correction and no rerun followed the failure.

- Command: `bunx vitest run` (one full run).
- Before: last reported green **3,832 tests / 419 files**, CB119.1.
- After: **3,870 passed / 1 failed / 3,871 total**, **419 passed / 1 failed / 420 files**.
- Delta: **+39 tests / +1 file**, entirely `src/test/courseGallery.test.tsx` (36 explicit cases + 3 parameterized framing cases).
- Brief baseline **3,816 / 418** predates CB119: CB119 added 16 cases / one file; CB119.1 retargeted one case with no count change. Therefore 3,816 + 16 + 39 = 3,871 and 418 + 1 + 1 = 420. Historical results are reported from conversation history, not rerun here.
- No tests deleted; no existing test-count delta. Authorized retargets listed below preserve one case per old case.
- Pre-existing failures: **none** against CB119.1's green baseline. The earlier business CB118.1 watcher failure was already resolved by CB118.2 and did not recur.
- Latest automatic preview signal: **build OK, 2026-10-28T09:32:24Z**. No manual build/typecheck run.

## Exact new failure
`src/test/holeMediaTidy.test.tsx:53:19`

Case: `HOLE_MEDIA_TIDY stream-UID identity > the tag dialog renders the poster, never an img holding a video URL`

```text
TestingLibraryElementError: Unable to find an element with the alt text: Current video
```

Assertion:
```tsx
expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/poster.jpg');
```

The new shared ready-cover thumbnail path excludes a video fixture without a duration and shows the icon fallback instead. This existing assertion was not changed. The failure must be resolved under an explicit ruling; no correction was applied after the stop.

## Implemented diff
- Added `courseGallery` and gallery snapshot/replacement state to the canonical fullscreen store; nested restore preserves gallery state. Opens still use readOnly/syntheticPosts and canonical origin handling.
- Added `CourseGalleryChrome`, shared order/identity/filter/group helpers, course-only framing and gallery CSS tokens. Normal chrome remains the default outside gallery mode; canonical pager/HLS/sound/scrubber/swipe engine is retained.
- Added `useCourseGallery`: existing course-media reads page to exhaustion, hole reads retain `get_hole_media` attribution, and place contributor reads retain existing profile path. Gallery All order retains the Everything source order and joins tagged library media by identity.
- Hole cards and photographed coverage segments pass their tapped element to gallery opening; place cards pass their exact origin, Everything cards opt into a gallery callback, and Media hole/shot and shot-only links open once after reads settle.
- Removed inline HoleWalk panel, selected-hole state, panel scrolling, move-follow focus and obsolete page state. Rail/coverage/add-first remain.
- Added viewer single-shot ShotTagCard adapter with Cancel, preselection/removal, existing member paths and existing admin RPCs/queue source-ID resolution. Successful writes replace the live snapshot without advancing the shot.
- Shared tagger thumbnails and gallery squares now use ready-cover shimmer, fade, poster/candidate retries and final Camera/Video fallback.
- Added `media.gallery` copy to en, en-XA, de, es, ja and ko. Recorded shared catalogue filter-order ruling; mock rail order is not adopted.

## Verification limitations and remaining work
- Authenticated end-to-end and device visual checks are unavailable for this external/unmanaged Supabase project; no credentials requested. Browser visual checks were not attempted after the test stop.
- The new rule tests passed in the full run, but mocked/pure checks are not live write/readback verification. Admin/member persistence, real-video sound/swipes and exact mock geometry remain unverified.
- The full suite is **not green**. No completion or visual-match claim is made.
- Targeted tests were not separately run; the full run covered changed files.

## Protected scope
No SQL executed; no migration/migration file created; no deployed RPC or edge function edited/deployed; feed_config untouched; round_pool_cap unchanged at 30; no native/Median config changes; no publishing.

## New test inventory (+39)
- `All preserves Everything order`
- `Holes orders hole number then existing panel order`
- `place filter sorts newest first`
- `filters omit empty places and use shared order with exact counts`
- `no tagged holes means no Holes filter`
- `Holes grid groups holes in numeric order`
- `place grid has exactly one group`
- `All grid uses holes then catalogue places then untagged`
- `a doubly tagged shot appears only once in All grid`
- `owner untagged shot permits Tag`
- `owner tagged shot permits Retag`
- `admin untagged shot permits Tag`
- `admin tagged shot permits Retag`
- `another golfer has no tagging action`
- `signed-out has no tagging action`
- `hole info retains par yards stroke index and measured loss`
- `unknown yards omit only the yards from hole title`
- `unscored holes use ordinal fallback without invented score stats`
- `place information uses its literal title and member count`
- `Conditions age comes from latest added shot`
- `untagged shot has no hole or place info but retains credit`
- `gallery is one synthetic horizontal carousel with stable item ids`
- `filter replacement lands on first shot without nested opening`
- `replacement honors start shot id`
- `hole strip exists only on Holes`
- `shot hole jumps to its first shot`
- `empty hole leaves selected shot unchanged`
- `grid filter changes retain grid mode`
- `grid square returns to same shot fullscreen`
- `successful tagging keeps shot and updates exact filter counts`
- `removing a filtered tag keeps the shot by changing to All`
- `hole cards pass origin and hole straight to gallery with no inline panel`
- `shot coverage segment passes its exact origin`
- `place card passes the approved newest list and exact origin`
- `thumbnail fallback exhausts candidates into an icon, never an empty box`
- `tagger video thumbnail uses poster and generated candidate before icon`
- Parameterized framing: `750 by 1000 → contain`, `749 by 1000 → cover`, `1500 by 1000 → contain`.

## Authorized existing-case retarget inventory
Each quoted block records the old assertions; the corresponding case now protects the course-gallery replacement or retained data rule. No tests were removed.

### src/test/holeWalk.test.tsx
- Old: `selection keeps the sparse rail and full coverage mounted`
- New: `selection keeps the sparse rail and full coverage mounted — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('selection keeps the sparse rail and full coverage mounted', () => {
    render(<HoleWalk available holes={[hole(1), hole(3)]} rows={[photo('a', 1), photo('b', 3)]} totalMedia={0} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 3' }));
    expect(screen.getByRole('button', { name: 'Hole 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hole 3' })).toHaveAttribute('aria-pressed', 'true');
  });
```

### src/test/holeWalk.test.tsx
- Old: `eight photos reconcile as eight selectable thumbnails including the active shot`
- New: `eight photos reconcile as eight selectable thumbnails including the active shot — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('eight photos reconcile as eight selectable thumbnails including the active shot', () => {
    render(<HoleWalk available holes={[hole(9)]} rows={Array.from({ length: 8 }, (_, i) => photo(String(i), 9))} totalMedia={8} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 9' }));
    expect(screen.getAllByRole('button', { name: /^Show shot \d of 8$/ })).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Show shot 1 of 8' })).toHaveAttribute('aria-current', 'true');
  });
```

### src/test/holeWalk.test.tsx
- Old: `hole 4 opens its existing region directly under the rail`
- New: `hole 4 opens its existing region directly under the rail — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('hole 4 opens its existing region directly under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
  });
```

### src/test/holeWalk.test.tsx
- Old: `hole 18 opens its region under the rail`
- New: `hole 18 opens its region under the rail — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('hole 18 opens its region under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 18' }));
    const panel = screen.getByRole('region', { name: 'Hole 18' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
  });
```

### src/test/holeWalk.test.tsx
- Old: `tapping tile 4 again closes its region and clears aria-pressed`
- New: `tapping tile 4 again closes its region and clears aria-pressed — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('tapping tile 4 again closes its region and clears aria-pressed', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    const button = screen.getByRole('button', { name: 'Hole 4' });
    fireEvent.click(button); fireEvent.click(button);
    expect(screen.queryByRole('region')).toBeNull();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
```

### src/test/holeWalk.test.tsx
- Old: `switching from hole 4 to hole 11 retains one region under the rail`
- New: `switching from hole 4 to hole 11 retains one region under the rail — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('switching from hole 4 to hole 11 retains one region under the rail', () => {
    render(<HoleWalk available holes={Array.from({ length: 18 }, (_, i) => hole(i + 1))} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 11' }));
    const panel = screen.getByRole('region', { name: 'Hole 11' });
    expect(panel.parentElement?.previousElementSibling).toHaveClass('media-v2-hole-rail');
    expect(panel.nextElementSibling).toBeNull();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });
```

### src/test/holeWalk.test.tsx
- Old: `switching holes resets the displayed photograph to the first`
- New: `switching holes resets the displayed photograph to the first — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('switching holes resets the displayed photograph to the first', () => {
    render(<HoleWalk available holes={[hole(4), hole(11)]} rows={[photo('a', 4), photo('b', 4), photo('c', 11)]} totalMedia={3} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 11' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-photo img')).toHaveAttribute('src', '/photo-a.jpg');
  });
```

### src/test/holeWalk.test.tsx
- Old: `scrolls only when the region is %s the viewport (below/visible)`
- New: `gallery opening never scrolls the page when the former panel would be %s the viewport (below/visible)`
- Why: Inline-panel conditional scrolling was explicitly removed.

```tsx
  it.each([['below', window.innerHeight + 1, 1], ['visible', 100, 0]] as const)('scrolls only when the region is %s the viewport', (_state, top, calls) => {
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
    try {
      render(<HoleWalk available holes={[hole(4)]} rows={[photo('4', 4), photo('11', 11), photo('18', 18)]} totalMedia={3} onAddFirst={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
      expect(scroll).toHaveBeenCalledTimes(calls);
      if (calls) expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    } finally { rect.mockRestore(); HTMLElement.prototype.scrollIntoView = original; }
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `three shots render three slides, a "1 / 3" chip and a three-button strip with the first current`
- New: `three shots render three slides, a "1 / 3" chip and a three-button strip with the first current — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('three shots render three slides, a "1 / 3" chip and a three-button strip with the first current', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    expect(panel().querySelectorAll('.hole-walk-slide')).toHaveLength(3);
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('1 / 3');
    const buttons = screen.getAllByRole('button', { name: /^Show shot \d of 3$/ });
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute('aria-current', 'true');
    expect(buttons[1]).not.toHaveAttribute('aria-current');
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `tapping strip button 2 makes it current, moves the chip and the owner row follows that shot`
- New: `tapping strip button 2 makes it current, moves the chip and the owner row follows that shot — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('tapping strip button 2 makes it current, moves the chip and the owner row follows that shot', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)], { memberId: 'u2', onMove: () => {}, onRemove: () => {} });
    expect(panel().querySelector('.hole-walk-owner')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 3' }));
    expect(screen.getByRole('button', { name: 'Show shot 2 of 3' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Show shot 1 of 3' })).not.toHaveAttribute('aria-current');
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('2 / 3');
    expect(panel().querySelector('.hole-walk-owner')).not.toBeNull();
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `one shot renders no chip and no strip`
- New: `one shot renders no chip and no strip — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('one shot renders no chip and no strip', () => {
    walk([shot('a')]);
    expect(panel().querySelector('.hole-walk-slide')).not.toBeNull();
    expect(panel().querySelector('.hole-walk-frame-count')).toBeNull();
    expect(panel().querySelector('.hole-walk-strip')).toBeNull();
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `the caption reads the added-to-clbhouz month and ignores the EXIF capture date`
- New: `the caption reads the added-to-clbhouz month and ignores the EXIF capture date — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('the caption reads the added-to-clbhouz month and ignores the EXIF capture date', () => {
    walk([shot('a')]);
    const caption = panel().querySelector('.hole-walk-caption');
    expect(caption?.textContent).toBe('Thomas Holmes · Mar 2026');
    expect(caption?.textContent).not.toContain('2025');
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `a video slide shows its poster with the decorative disc and never a playable element`
- New: `a video slide shows its poster with the decorative disc and never a playable element — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('a video slide shows its poster with the decorative disc and never a playable element', () => {
    const motion = vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
    walk([video('c', 42)]);
    expect(panel().querySelector('.hole-walk-play-disc')).not.toBeNull();
    expect(panel().querySelector('video')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
    motion.mockRestore();
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `tapping the second slide opens the canonical viewer readOnly on that shot, credited to its member`
- New: `tapping the second slide opens the canonical viewer readOnly on that shot, credited to its member — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('tapping the second slide opens the canonical viewer readOnly on that shot, credited to its member', async () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[1] as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    const args = lastOpen();
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].mediaItems.map(item => item.id)).toEqual(['a', 'b', 'c']);
    expect(args.index).toBe(0);
    expect(args.mediaId).toBe('b');
    expect(args.openedFrom).toBe('course-media');
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
    expect(args.posts[0].displayName).toBe('Royal Portrush Golf Club (Dunluce) · The fourteenth');
    expect(args.posts[0].courseName).toBe('Royal Portrush Golf Club (Dunluce)');
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `a processing video slide does not open the viewer and is not in its posts`
- New: `a processing video slide does not open the viewer and is not in its posts — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('a processing video slide does not open the viewer and is not in its posts', async () => {
    walk([shot('a'), video('p', null)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[1] as HTMLElement);
    expect(f.open).not.toHaveBeenCalled();
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[0] as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    expect(lastOpen().posts).toHaveLength(1);
    expect(lastOpen().posts[0].mediaItems.map(item => item.id)).toEqual(['a']);
    expect(lastOpen().posts[0].displayName).toBe('Royal Portrush Golf Club (Dunluce) · The fourteenth');
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `opening the viewer leaves the frame where it was`
- New: `opening the viewer leaves the frame where it was — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('opening the viewer leaves the frame where it was', async () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[1] as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    expect(lastOpen().index).toBe(0);
    expect(lastOpen().mediaId).toBe('b');
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('1 / 3');
    expect(screen.getByRole('button', { name: 'Show shot 1 of 3' })).toHaveAttribute('aria-current', 'true');
  });
```

### src/test/holePanelCarousel.test.tsx
- Old: `a video shot reaches the viewer with its stream hlsUrl`
- New: `a video shot reaches the viewer with its stream hlsUrl — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('a video shot reaches the viewer with its stream hlsUrl', async () => {
    walk([video('c', 42)]);
    fireEvent.click(panel().querySelector('.hole-walk-slide') as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    const item = lastOpen().posts[0].mediaItems[0];
    expect(item.type).toBe('video');
    expect(item.hlsUrl).toContain('/manifest/video.m3u8');
  });
```

### src/test/holeWalkNoRounds.test.tsx
- Old: `selected unscored photographed hole has its kicker but no title or stats`
- New: `selected unscored photographed hole has its kicker but no title or stats — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('selected unscored photographed hole has its kicker but no title or stats', () => {
    render(<HoleWalk available scored={false} holes={unscored()} rows={f.rows} totalMedia={8} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel).toHaveClass('hole-walk-panel-unscored');
    expect(panel.querySelector('.hole-walk-title')).toBeNull(); expect(panel.querySelector('.hole-walk-stats')).toBeNull();
    expect(panel.querySelector('.hole-walk-kicker')?.textContent).toBe('The fourth');
    expect(document.querySelector('.hole-walk-quiet')).toBeNull();
  });
```

### src/test/holeWalkNoRounds.test.tsx
- Old: `omitted scored prop preserves the existing panel title and stats without quiet copy`
- New: `omitted scored prop preserves the existing panel title and stats without quiet copy — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('omitted scored prop preserves the existing panel title and stats without quiet copy', () => {
    const view = render(<HoleWalk available holes={[hole(4)]} rows={[photo(4)]} totalMedia={1} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-title')?.textContent).toBe('Par 4 · 412 yards');
    expect(panel.querySelector('.hole-walk-stats')).not.toBeNull(); expect(panel).not.toHaveClass('hole-walk-panel-unscored');
    expect(view.container.querySelector('.hole-walk-quiet')).toBeNull();
  });
```

### src/test/holeWalkNoRounds.test.tsx
- Old: `Media with photos and empty analysis renders four shot cards and eighteen coverage segments`
- New: `Media with photos and empty analysis renders four shot cards and eighteen coverage segments — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('Media with photos and empty analysis renders four shot cards and eighteen coverage segments', () => {
    const view = mountTab();
    expect(view.container.querySelectorAll('.media-v2-hole-card')).toHaveLength(4);
    expect(view.container.querySelectorAll('.media-v2-coverage button')).toHaveLength(18);
    expect(f.known).toHaveBeenLastCalledWith(numbers);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    expect(screen.getByRole('region', { name: 'Hole 4' })).toHaveClass('hole-walk-panel-unscored');
  });
```

### src/test/holeWalkNoRounds.test.tsx
- Old: `Media automatically restores real scored holes when analysis receives rounds`
- New: `Media automatically restores real scored holes when analysis receives rounds — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('Media automatically restores real scored holes when analysis receives rounds', () => {
    const view = mountTab(); fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    f.analysis = { available: true, total_rounds: 10, holes: [hole(4)] };
    view.rerender(view.make());
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel).not.toHaveClass('hole-walk-panel-unscored'); expect(panel.querySelector('.hole-walk-stats')).not.toBeNull();
    expect(panel.querySelector('.hole-walk-title')?.textContent).toBe('Par 4 · 412 yards');
    expect(view.container.querySelectorAll('.media-v2-hole-card')).toHaveLength(1); expect(f.known).toHaveBeenLastCalledWith([4]);
  });
```

### src/test/holeTagOwnerControls.test.tsx
- Old: `renders for the member’s own approved active item`
- New: `renders for the member’s own approved active item — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('renders for the member’s own approved active item', () => { walk([row()]); expect(ownerRow()).not.toBeNull(); });
```

### src/test/holeTagOwnerControls.test.tsx
- Old: `is hidden for another member’s item`
- New: `is hidden for another member’s item — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('is hidden for another member’s item', () => { walk([row({ user_id: 'other' })]); expect(ownerRow()).toBeNull(); });
```

### src/test/holeTagOwnerControls.test.tsx
- Old: `is hidden without a member`
- New: `is hidden without a member — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('is hidden without a member', () => { walk([row()], { memberId: undefined }); expect(ownerRow()).toBeNull(); });
```

### src/test/holeTagOwnerControls.test.tsx
- Old: `is hidden without move and remove callbacks`
- New: `is hidden without move and remove callbacks — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('is hidden without move and remove callbacks', () => { walk([row()], { onMove: undefined, onRemove: undefined }); expect(ownerRow()).toBeNull(); });
```

### src/test/holeTagOwnerControls.test.tsx
- Old: `hides when a strip thumbnail of someone else’s item is viewed`
- New: `hides when a strip thumbnail of someone else’s item is viewed — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('hides when a strip thumbnail of someone else’s item is viewed', () => {
    walk([row(), row({ id: 'theirs', user_id: 'other', media_url: '/theirs.jpg' })]);
    expect(ownerRow()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    expect(ownerRow()).toBeNull();
  });
```

### src/test/holeMediaVideos.test.tsx
- Old: `video-only hole uses poster and count one and opens the viewer with the stream`
- New: `video-only hole uses poster and count one and opens the viewer with the stream — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('video-only hole uses poster and count one and opens the viewer with the stream', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    f.rpc.mockResolvedValue({ data: [{ ...row, member_id: row.user_id, member_avatar_url: null }], error: null });
    render(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[row]} totalMedia={1} onAddFirst={() => {}} /></QueryClientProvider>);
    const tile = screen.getByRole('button', { name: 'Hole 7' });
    expect(tile.querySelector('img')).toHaveAttribute('src', '/poster.jpg');
    expect(tile.querySelector('.media-v2-hole-count')).toHaveTextContent('1 shot');
    fireEvent.click(tile);
    const panel = screen.getByRole('region');
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
    const slide = panel.querySelector('.hole-walk-slide') as HTMLElement;
    expect(slide.querySelector('img')).toHaveAttribute('src', '/poster.jpg');
    expect(slide.querySelector('.hole-walk-play-disc')).toBeTruthy();
    fireEvent.click(slide);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    const args = f.open.mock.calls[0][0] as { posts: Array<{ mediaItems: Array<{ type: string; hlsUrl?: string }> }>; options?: { readOnly?: boolean } };
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].mediaItems[0].type).toBe('video');
    expect(args.posts[0].mediaItems[0].hlsUrl).toContain(`/${source.stream_id}/manifest/video.m3u8`);
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
    expect(f.attach).not.toHaveBeenCalled();
  });
```

### src/test/holeMediaTidy.test.tsx
- Old: `a hole with one item offers "Add a photo or video" to a member and passes the hole`
- New: `a hole with one item offers "Add a photo or video" to a member and passes the hole — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('a hole with one item offers "Add a photo or video" to a member and passes the hole', () => {
    const chosen: number[] = [];
    render(<HoleWalk available holes={[hole(7)]} rows={[row(7)]} totalMedia={1} onAddFirst={n => chosen.push(n)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a photo or video' }));
    expect(chosen).toEqual([7]);
  });
```

### src/test/holeMediaTidy.test.tsx
- Old: `an empty hole keeps "Add the first" and never shows the more button`
- New: `an empty hole keeps "Add the first" and never shows the more button — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('an empty hole keeps "Add the first" and never shows the more button', () => {
    render(<HoleWalk available holes={[hole(1), hole(7)]} rows={[row(1)]} focus={{ hole: 7, id: '', nonce: 1 }} totalMedia={1} onAddFirst={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add the first' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add a photo or video' })).toBeNull();
  });
```

### src/test/holeLibraryVideosStage2.test.tsx
- Old: `null duration has no playable element; metadata refresh makes the shot open in the viewer`
- New: `null duration has no playable element; metadata refresh makes the shot open in the viewer — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('null duration has no playable element; metadata refresh makes the shot open in the viewer', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    f.rpc.mockResolvedValue({ data: [{ ...row, duration_seconds: 42, member_avatar_url: null }], error: null });
    const view = render(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[row]} totalMedia={1} onAddFirst={() => {}} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull(); expect(view.container.querySelector('video')).toBeNull();
    expect(view.container.querySelector('.hole-media-processing')).toBeInTheDocument();
    fireEvent.click(view.container.querySelector('.hole-walk-slide') as HTMLElement);
    expect(f.open).not.toHaveBeenCalled();
    view.rerender(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[{ ...row, duration_seconds: 42 }]} totalMedia={1} onAddFirst={() => {}} /></QueryClientProvider>);
    expect(view.container.querySelector('.hole-media-processing')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
    fireEvent.click(view.container.querySelector('.hole-walk-slide') as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    const args = f.open.mock.calls[0][0] as { posts: Array<{ mediaItems: Array<{ type: string }> }>; options?: { readOnly?: boolean } };
    expect(args.posts).toHaveLength(1);
    expect(args.posts[0].mediaItems[0].type).toBe('video');
    expect(args.options).toEqual({ readOnly: true, syntheticPosts: true });
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `registers only the active ready slide with the one-player half-visible election`
- New: `registers only the active ready slide with the one-player half-visible election — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('registers only the active ready slide with the one-player half-visible election', () => {
    walk(); expect(f.register).toHaveBeenCalledTimes(1);
    expect(f.register).toHaveBeenCalledWith('hole-walk', expect.any(Element), expect.any(Function), { threshold: 0.5, maxPlaying: 1 });
    const slides = document.querySelectorAll('.hole-walk-slide'); const video = slides[0].querySelector('video');
    expect(video?.muted).toBe(true); expect(video?.loop).toBe(true); expect(video?.playsInline).toBe(true);
    expect(slides[0].querySelector('.hole-walk-play-disc')).toBeNull(); expect(slides[1].querySelector('video')).toBeNull();
    expect(slides[1].querySelector('img')).toHaveAttribute('src', '/a.jpg');
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `changing the active shot detaches its video and elects the next slide`
- New: `changing the active shot detaches its video and elects the next slide — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('changing the active shot detaches its video and elects the next slide', () => {
    walk(); win(); fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    expect(f.detach).toHaveBeenCalledTimes(1); expect(f.register).toHaveBeenCalledTimes(2);
    const slides = document.querySelectorAll('.hole-walk-slide'); expect(slides[0].querySelector('video')).toBeNull(); expect(slides[1].querySelector('video')).not.toBeNull();
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `attachment failure releases the player and restores the poster disc`
- New: `attachment failure releases the player and restores the poster disc — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('attachment failure releases the player and restores the poster disc', () => {
    walk([row('a')]); win(); act(() => f.attach.mock.calls[0][2]());
    expect(document.querySelector('.hole-walk-slide video')).toBeNull(); expect(document.querySelector('.hole-walk-play-disc')).not.toBeNull(); expect(f.detach).toHaveBeenCalledTimes(1);
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `a ready autoplay slide still opens its tapped shot in the canonical viewer`
- New: `a ready autoplay slide still opens its tapped shot in the canonical viewer — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('a ready autoplay slide still opens its tapped shot in the canonical viewer', async () => {
    walk(); win(); fireEvent.click(document.querySelector('.hole-walk-slide') as Element);
    await waitFor(() => expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'a', options: { readOnly: true, syntheticPosts: true } })));
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `image and processing slides do not register or create a player`
- New: `image and processing slides do not register or create a player — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('image and processing slides do not register or create a player', () => {
    walk([row('a', 'image'), row('b', 'video', null)]);
    expect(document.querySelector('.hole-walk-slide img')).toHaveAttribute('src', media.media_url);
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 2' }));
    expect(document.querySelector('.hole-media-processing')).not.toBeNull(); expect(f.register).not.toHaveBeenCalled(); expect(document.querySelector('video')).toBeNull();
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `batch-open pauses the underlying walk and Close releases it`
- New: `batch-open pauses the underlying walk and Close releases it — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('batch-open pauses the underlying walk and Close releases it', async () => {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><CourseMediaTabNew courseId="course" /></QueryClientProvider></MemoryRouter>);
    expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(false);
    const row = document.querySelector('.media-v2-untagged');
    if (!row) throw new Error('Missing member untagged row');
    fireEvent.click(row); await screen.findByRole('dialog');
    expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(f.walkProps.mock.lastCall?.[0].mediaPaused).toBe(false);
  });
```

### src/test/holeInlineAutoplay.test.tsx
- Old: `%s keeps the poster and disc without a video (reduced motion/Save-Data)`
- New: `unchanged name; direct preserved HoleInlineVideo mount`
- Why: The retired inline panel no longer hosts the component; standalone library behavior remains protected.

```tsx
expect(document.querySelector('.hole-walk-play-disc')).not.toBeNull(); expect(f.register).not.toHaveBeenCalled();
```

### src/test/memberShotViewerPolish.test.tsx
- Old: `hole walk fetches the shared hole key on tap, opens tapped id and uses server avatars and order`
- New: `hole walk fetches the shared hole key on tap, opens tapped id and uses server avatars and order — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('hole walk fetches the shared hole key on tap, opens tapped id and uses server avatars and order', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const row = { id: 'b', course_id: 'course', hole_no: 15, user_id: 'member', media_url: '/b.jpg', media_type: 'image', status: 'approved' } as HolePhoto;
    const hole = { hole_no: 15, par: 4, yards: 412, avg_to_par: 0, rounds: 10 } as CourseHole;
    const rows = ['a', 'b'].map(id => ({ id, course_id: 'course', hole_no: 15, media_url: `/${id}.jpg`, media_type: 'image', member_name: 'Benjamin Holmes', member_avatar_url: '/ben.jpg', added_at: '2026-01-11T10:00:00Z', par: 4, yards: 412 }));
    f.rpc.mockResolvedValue({ data: rows, error: null });
    render(<QueryClientProvider client={cache}><HoleWalk available holes={[hole]} rows={[row]} totalMedia={1} courseName="Druids Glen Golf Club" onAddFirst={() => {}} /></QueryClientProvider>);
    expect(f.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 15' }));
    expect(f.rpc).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('region').querySelector('.hole-walk-slide') as HTMLElement);
    await waitFor(() => expect(f.open).toHaveBeenCalledTimes(1));
    expect(f.rpc).toHaveBeenCalledWith('get_hole_media', { p_course_id: 'course', p_hole_no: 15 });
    expect(cache.getQueryData(['hole-media', 'course', 15])).toEqual(rows);
    const args = f.open.mock.calls[0][0] as { mediaId: string; posts: FeedPost[] };
    expect(args.mediaId).toBe('b');
    expect(args.posts[0].mediaItems.map(item => item.id)).toEqual(['a', 'b']);
    expect(args.posts[0].mediaItems[1].memberShot?.avatarUrl).toBe('/ben.jpg');
  });
```

### src/test/courseMediaV2.test.tsx
- Old: `place tiles open exactly their sorted approved rows`
- New: `unchanged`
- Why: Preserve the exact ordered rows and also assert the tapped origin for the canonical gallery.

```tsx
expect(open).toHaveBeenCalledWith('views', [row('a', 'views')]);
```

### src/test/latestHolesSection.test.tsx
- Old: `Media deep link opens hole four with the selected shot, not its first shot`
- New: `Media deep link opens hole four with the selected shot, not its first shot — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('Media deep link opens hole four with the selected shot, not its first shot', () => {
    f.rows = [photo(4, 'first'), photo(4, 'selected')]; mountTab();
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-frame-count')).toHaveTextContent('2 / 2');
    expect(panel.querySelectorAll('.hole-walk-thumbnail')[1]).toHaveAttribute('aria-current', 'true');
    expect(panel.querySelectorAll('.hole-walk-slide')[1].querySelector('img')).toHaveAttribute('src', '/photo-selected.jpg');
  });
```

### src/test/latestHolesSection.test.tsx
- Old: `missing linked shot falls back to the hole first shot`
- New: `missing linked shot falls back to the hole first shot — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('missing linked shot falls back to the hole first shot', () => {
    f.rows = [photo(4, 'first'), photo(4, 'other')]; mountTab();
    const panel = screen.getByRole('region', { name: 'Hole 4' });
    expect(panel.querySelector('.hole-walk-frame-count')).toHaveTextContent('1 / 2');
    expect(panel.querySelectorAll('.hole-walk-thumbnail')[0]).toHaveAttribute('aria-current', 'true');
    expect(panel.querySelectorAll('.hole-walk-slide')[0].querySelector('img')).toHaveAttribute('src', '/photo-first.jpg');
  });
```

### src/test/latestHolesSection.test.tsx
- Old: `unknown hole never opens a panel`
- New: `unknown hole never opens a panel — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('unknown hole never opens a panel', () => { mountTab('/courses/course?tab=media&hole=99&shot=selected'); expect(screen.queryByRole('region')).toBeNull(); });
```

### src/test/latestHolesSection.test.tsx
- Old: `deep link waits for known holes and does not reapply after user selection`
- New: `deep link waits for known holes and does not reapply after user selection — course gallery`
- Why: Inline hole-panel behavior is retired; retain its underlying shot, hole, readiness, attribution or action data in the course gallery.

```tsx
  it('deep link waits for known holes and does not reapply after user selection', () => {
    f.analysis = null; const view = mountTab(); expect(screen.queryByRole('region')).toBeNull();
    f.analysis = emptyAnalysis; f.rows = [photo(4, 'selected'), photo(7)]; view.rerender(view.make()); expect(screen.getByRole('region', { name: 'Hole 4' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); view.rerender(view.make()); expect(screen.getByRole('region', { name: 'Hole 7' })).toBeInTheDocument();
  });
```

## Per-file count reconciliation
- `src/test/holeWalk.test.tsx`: unchanged case declarations (20 before / 20 after); parameter populations retained.
- `src/test/holePanelCarousel.test.tsx`: unchanged case declarations (12 before / 12 after); parameter populations retained.
- `src/test/holeWalkNoRounds.test.tsx`: unchanged case declarations (13 before / 13 after); parameter populations retained.
- `src/test/holeInlineAutoplay.test.tsx`: unchanged case declarations (11 before / 11 after); parameter populations retained.
- `src/test/holeTagOwnerControls.test.tsx`: unchanged case declarations (17 before / 17 after); parameter populations retained.
- `src/test/holeMediaVideos.test.tsx`: unchanged case declarations (14 before / 14 after); parameter populations retained.
- `src/test/holeMediaTidy.test.tsx`: unchanged case declarations (9 before / 9 after); parameter populations retained.
- `src/test/latestHolesSection.test.tsx`: unchanged case declarations (21 before / 21 after); parameter populations retained.
- `src/test/holeLibraryVideosStage2.test.tsx`: unchanged case declarations (14 before / 14 after); parameter populations retained.
- `src/test/memberShotViewerPolish.test.tsx`: unchanged case declarations (2 before / 2 after); parameter populations retained.
- `src/test/courseMediaV2.test.tsx`: unchanged case declarations (9 before / 9 after); parameter populations retained.
