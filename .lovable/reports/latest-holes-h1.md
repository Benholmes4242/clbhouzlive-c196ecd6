# Latest holes H1 — 16 November 2026

## Delivered
Rail-only H1: top-right 40px hole figure and uppercase par/yardage label; absent par omits the label. Removed Option A kicker/par line and their local tokens. Exact corner/bottom mock scrims are global semantic tokens scoped to this tile; shared scrims unchanged. Bottom stack retains name/credit styling and now uses exported shortCoursePart, the viewer's existing helper. Duration, tile dimensions, queries, pagination and tap payload unchanged. Fullscreen viewer untouched.

## Verification
Focused: `npx vitest run src/test/latestHolesSection.test.tsx src/test/coursesRailsUnlimited.test.tsx src/test/coursesPhotoTopScrims.test.tsx --maxWorkers=2` — 57 passed.
Four separate sequential commands `npx vitest run --maxWorkers=2 --shard=1/4`, then 2/4, 3/4, 4/4:
**2,268 / 2,158 / 2,229 / 2,244 = 8,899 executed and passed**, 773 files, no failures/skips.
Baseline 8,894 → 8,899: +5 cases, all in latestHolesSection.test.tsx: two parameterised “the rail uses the viewer shortCoursePart for %s” cases for Ballybunion Golf Club (Old) and Trump International Golf Links; three “H1 number and label with par $par and yards $yards” cases (4/303, 4/null, null/null). No deletions.

Live public /courses, pale-sky Royal County Down (Championship) tile: 320/375/430 screenshots visually checked. Document, #root and body scrollWidth equal 320/375/430 respectively. Number/label, two-line name and credit fit inside 220×293 tiles without overlap. No fixtures or guest minting. Tile tap exercised at each width; canonical opening is additionally covered by the unchanged payload tests.
Harness build OK at 2026-11-16T07:20:01Z.

## Authorised test changes
Ben explicitly approved replacing the five Option A tests with H1 checks. They were replaced one-for-one, not deleted; their old names and old assertions follow. Other changes are the brief-authorised aria-label and scrim/figure stack expectations only; all query providers preserved. The existing letter-spacing stack assertion now protects the H1 number rather than the removed kicker.

### Replaced: the kicker reads the hole as a word, above the course name
Reason: H1 supersedes Option A on this tile, with explicit approval.
```tsx
expect([...kicks].map(k => k.textContent)).toEqual(['THE FIRST', 'THE NINTH', 'THE EIGHTEENTH']);
expect(kicks[0].parentElement?.firstElementChild).toBe(kicks[0]);
expect(kicks[0].nextElementSibling?.className).toBe('latest-hole-course');
```

### Replaced: the par line sits between the course name and the byline, in sentence case
Reason: H1 supersedes Option A on this tile, with explicit approval.
```tsx
expect([...stack.children].map(c => c.className)).toEqual(['latest-hole-kick', 'latest-hole-course', 'latest-hole-par', 'latest-hole-credit']);
expect(stack.querySelector('.latest-hole-par')?.textContent).toBe('Par 3 · 182 yards');
expect(stack.querySelector('.latest-hole-par')?.textContent).not.toMatch(/YDS|yds/);
```

### Replaced: the numeral, the PAR/YDS block and the Plays pill are all absent
Reason: H1 supersedes Option A on this tile, with explicit approval.
```tsx
expect(view.container.querySelector('.latest-hole-figure')).toBeNull();
expect(view.container.querySelector('.latest-hole-number')).toBeNull();
expect(view.container.querySelector('.latest-hole-label')).toBeNull();
expect(view.container.querySelector('.latest-hole-plays')).toBeNull();
expect(view.container.querySelector('[data-hole-plays]')).toBeNull();
expect(view.container.textContent).not.toMatch(/Plays|YDS|yds/);
expect(view.container.textContent).not.toMatch(/\bPAR\b/);
```

### Replaced: a long course name clamps to two lines and still leaves room for the par line and byline
Reason: H1 supersedes Option A on this tile, with explicit approval.
```tsx
expect(course.textContent).toBe('Sundridge Park Golf Club (East Course)');
expect(course.querySelector('br')).toBeNull();
expect(card.querySelector('.latest-hole-par')?.textContent).toBe('Par 3 · 182 yards');
expect(card.querySelector('.latest-hole-credit')?.textContent).toBe('Thomas Holmes · Jun 2025');
expect(css).toMatch(/\.latest-hole-course\s*\{[^}]*-webkit-line-clamp: 2;[^}]*overflow: hidden;/);
```

### src/test/latestHolesSection.test.tsx — exact authorised diff
```diff
diff --git a/src/test/latestHolesSection.test.tsx b/src/test/latestHolesSection.test.tsx
index 3bd5d65121..b3508ad5eb 100644
--- a/src/test/latestHolesSection.test.tsx
+++ b/src/test/latestHolesSection.test.tsx
@@ -29,6 +29,7 @@ vi.mock('@/components/course-media-tab/hooks/useCourseGallery', () => ({ useCour
 vi.mock('@tanstack/react-query', async importOriginal => ({ ...await importOriginal<typeof import('@tanstack/react-query')>(), useInfiniteQuery: (options: unknown) => { f.rpc(options); return { data: { pages: [f.latest] }, isLoading: f.loading, isFetched: !f.loading, isError: f.error, hasNextPage: false, isFetching: f.loading, isFetchingNextPage: false, fetchNextPage: vi.fn() }; } }));
 
 import { LatestHolesSection } from '@/components/courses/browse/LatestHolesSection';
+import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
 import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
 import type { LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
 import { courseWalkHoles, deriveHoleWalk, UNSCORED_HOLE_COUNT } from '@/lib/courseMedia/holeWalk';
@@ -71,7 +72,7 @@ describe('BRIEF_COURSES_LATEST_HOLES', () => {
     f.latest = f.latest.slice(0, count); mountRail(); expect(screen.queryAllByRole('button')).toHaveLength(0);
   });
   it('three cards retain RPC order and the specified query contract', () => {
-    mountRail(); expect(screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(['The fourth, Course first, Par 3 · 182 yards, Thomas Holmes · Jun 2025', 'The fourth, Course second, Par 3 · 182 yards, Thomas Holmes · Jun 2025', 'The fourth, Course third, Par 3 · 182 yards, Thomas Holmes · Jun 2025']);
+    mountRail(); expect(screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(['Hole 4, Course first, Par 3, 182 yards, Thomas Holmes · Jun 2025', 'Hole 4, Course second, Par 3, 182 yards, Thomas Holmes · Jun 2025', 'Hole 4, Course third, Par 3, 182 yards, Thomas Holmes · Jun 2025']);
     expect(f.rpc).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['gam_rpc', 'get_latest_hole_media', 'infinite', expect.anything(), false], staleTime: 60_000 }));
     const options = f.rpc.mock.calls[0][0];
     const request = options.queryFn({ pageParam: undefined });
@@ -82,16 +83,18 @@ describe('BRIEF_COURSES_LATEST_HOLES', () => {
     f.latest = [latest('first'), latest('second', { course_id: 'course-first', course_name: 'Course first' }), latest('third')];
     mountRail(); const cards = screen.getAllByRole('button');
     expect(cards).toHaveLength(3);
-    expect(cards.map(c => c.getAttribute('aria-label'))).toEqual(['The fourth, Course first, Par 3 · 182 yards, Thomas Holmes · Jun 2025', 'The fourth, Course first, Par 3 · 182 yards, Thomas Holmes · Jun 2025', 'The fourth, Course third, Par 3 · 182 yards, Thomas Holmes · Jun 2025']);
+    expect(cards.map(c => c.getAttribute('aria-label'))).toEqual(['Hole 4, Course first, Par 3, 182 yards, Thomas Holmes · Jun 2025', 'Hole 4, Course first, Par 3, 182 yards, Thomas Holmes · Jun 2025', 'Hole 4, Course third, Par 3, 182 yards, Thomas Holmes · Jun 2025']);
   });
   it('an RPC error hides even cached rows', () => { f.error = true; mountRail(); expect(screen.queryAllByRole('button')).toHaveLength(0); });
   it('loading draws the shell without interactive cards', () => { f.loading = true; const view = mountRail(); expect(view.container.querySelector('section[aria-hidden]')).not.toBeNull(); expect(screen.queryAllByRole('button')).toHaveLength(0); });
-  it('the par line states par and yardage, and an unscored hole states neither', () => {
+  it('the corner figure shows par and yards, par only, or the number alone', () => {
     f.latest = [latest('first'), latest('second', { par: null, yards: null }), latest('third', { yards: null })];
     const view = mountRail();
-    expect(screen.getByText('Par 3 · 182 yards')).toBeInTheDocument();
-    expect(screen.getByText('Par 3')).toBeInTheDocument();
-    expect(view.container.querySelectorAll('.latest-hole-par')).toHaveLength(2);
+    const figures = view.container.querySelectorAll('.latest-hole-figure');
+    expect([...figures].map(figure => figure.querySelector('.latest-hole-number')?.textContent)).toEqual(['4', '4', '4']);
+    expect(figures[0].querySelector('.latest-hole-label')?.textContent).toBe('PAR 3 · 182 YDS');
+    expect(figures[1].querySelector('.latest-hole-label')).toBeNull();
+    expect(figures[2].querySelector('.latest-hole-label')?.textContent).toBe('PAR 3');
   });
   it('credit uses the added date and ignores EXIF capture', () => {
     f.latest = [latest('first'), latest('second', { exif_captured_at: '2020-01-05T12:00:00Z' }), latest('third', { exif_captured_at: null })];
@@ -122,44 +125,54 @@ describe('BRIEF_COURSES_LATEST_HOLES', () => {
   it('the kicker reads "Through members\' eyes"', () => {
     mountRail(); expect(screen.getByText("Through members' eyes")).toBeInTheDocument(); expect(screen.getByText('Latest holes')).toBeInTheDocument();
   });
-  /* BRIEF_LATEST_HOLES_OPTION_A — the tile is the viewer's bottom stack. */
-  it('the kicker reads the hole as a word, above the course name', () => {
+  /* H1 replaces the five Option A tile tests with Ben's explicit approval. */
+  it('the hole numbers live in the corner figure rather than an amber kicker', () => {
     f.latest = [latest('first', { hole_no: 1 }), latest('second', { hole_no: 9 }), latest('third', { hole_no: 18 })];
-    const view = mountRail(); const kicks = view.container.querySelectorAll('.latest-hole-kick');
-    expect([...kicks].map(k => k.textContent)).toEqual(['THE FIRST', 'THE NINTH', 'THE EIGHTEENTH']);
-    expect(kicks[0].parentElement?.firstElementChild).toBe(kicks[0]);
-    expect(kicks[0].nextElementSibling?.className).toBe('latest-hole-course');
+    const view = mountRail();
+    expect([...view.container.querySelectorAll('.latest-hole-number')].map(n => n.textContent)).toEqual(['1', '9', '18']);
+    expect(view.container.querySelector('.latest-hole-kick')).toBeNull();
   });
-  it('the par line sits between the course name and the byline, in sentence case', () => {
+  it('the bottom stack contains only the course name and byline', () => {
     const view = mountRail(); const stack = view.container.querySelector('.latest-hole-name') as HTMLElement;
-    expect([...stack.children].map(c => c.className)).toEqual(['latest-hole-kick', 'latest-hole-course', 'latest-hole-par', 'latest-hole-credit']);
-    expect(stack.querySelector('.latest-hole-par')?.textContent).toBe('Par 3 · 182 yards');
-    expect(stack.querySelector('.latest-hole-par')?.textContent).not.toMatch(/YDS|yds/);
+    expect([...stack.children].map(c => c.className)).toEqual(['latest-hole-course', 'latest-hole-credit']);
   });
-  it('the numeral, the PAR/YDS block and the Plays pill are all absent', () => {
+  it('the numeral and PAR/YDS return while the Plays pill remains absent', () => {
     const view = mountRail();
-    expect(view.container.querySelector('.latest-hole-figure')).toBeNull();
-    expect(view.container.querySelector('.latest-hole-number')).toBeNull();
-    expect(view.container.querySelector('.latest-hole-label')).toBeNull();
+    expect(view.container.querySelectorAll('.latest-hole-figure')).toHaveLength(3);
+    expect(view.container.querySelector('.latest-hole-label')?.textContent).toBe('PAR 3 · 182 YDS');
     expect(view.container.querySelector('.latest-hole-plays')).toBeNull();
     expect(view.container.querySelector('[data-hole-plays]')).toBeNull();
-    expect(view.container.textContent).not.toMatch(/Plays|YDS|yds/);
-    expect(view.container.textContent).not.toMatch(/\bPAR\b/);
+    expect(view.container.querySelector('.latest-hole-par')).toBeNull();
   });
-  it('a long course name clamps to two lines and still leaves room for the par line and byline', () => {
+  it('a short course name retains the two-line clamp and byline', () => {
     f.latest[0] = latest('first', { course_name: 'Sundridge Park Golf Club (East Course)' });
     const view = mountRail(); const card = view.container.querySelectorAll('.latest-hole-card')[0];
     const course = card.querySelector('.latest-hole-course') as HTMLElement;
-    expect(course.textContent).toBe('Sundridge Park Golf Club (East Course)');
+    expect(course.textContent).toBe(shortCoursePart('Sundridge Park Golf Club (East Course)'));
     expect(course.querySelector('br')).toBeNull();
-    expect(card.querySelector('.latest-hole-par')?.textContent).toBe('Par 3 · 182 yards');
     expect(card.querySelector('.latest-hole-credit')?.textContent).toBe('Thomas Holmes · Jun 2025');
     const css = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/latestHoles.css'), 'utf8');
     expect(css).toMatch(/\.latest-hole-course\s*\{[^}]*-webkit-line-clamp: 2;[^}]*overflow: hidden;/);
   });
+  it.each(['Ballybunion Golf Club (Old)', 'Trump International Golf Links'])('the rail uses the viewer shortCoursePart for %s', name => {
+    f.latest[0] = latest('first', { course_name: name });
+    const view = mountRail();
+    expect(view.container.querySelector('.latest-hole-course')?.textContent).toBe(shortCoursePart(name));
+    expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-label', `Hole 4, ${shortCoursePart(name)}, Par 3, 182 yards, Thomas Holmes · Jun 2025`);
+  });
+  it.each([
+    { par: 4, yards: 303, label: 'PAR 4 · 303 YDS' },
+    { par: 4, yards: null, label: 'PAR 4' },
+    { par: null, yards: null, label: null },
+  ])('H1 number and label with par $par and yards $yards', ({ par, yards, label }) => {
+    f.latest[0] = latest('first', { hole_no: 9, par, yards });
+    const view = mountRail(); const figure = view.container.querySelector('.latest-hole-figure');
+    expect(figure?.querySelector('.latest-hole-number')?.textContent).toBe('9');
+    expect(figure?.querySelector('.latest-hole-label')?.textContent ?? null).toBe(label);
+  });
   it('a tap opens the canonical viewer readOnly on the tapped shot across the whole rail', () => {
     mountRail();
-    fireEvent.click(screen.getByRole('button', { name: 'The fourth, Course second, Par 3 · 182 yards, Thomas Holmes · Jun 2025' }));
+    fireEvent.click(screen.getByRole('button', { name: 'Hole 4, Course second, Par 3, 182 yards, Thomas Holmes · Jun 2025' }));
     expect(f.holeRpc).not.toHaveBeenCalled();
     expect(f.open).toHaveBeenCalledTimes(1);
     const args = f.open.mock.calls[0][0] as { posts: Array<{ id: string; displayName: string; courseName?: string; mediaItems: Array<{ id: string }> }>; index: number; mediaId: string | null; openedFrom: string; options?: { readOnly?: boolean } };
@@ -180,7 +193,7 @@ describe('BRIEF_COURSES_LATEST_HOLES', () => {
   });
   it('a tap opens immediately with no network wait', () => {
     f.holeRpc.mockReturnValue(new Promise(() => {}));
-    mountRail(); const card = screen.getByRole('button', { name: 'The fourth, Course second, Par 3 · 182 yards, Thomas Holmes · Jun 2025' });
+    mountRail(); const card = screen.getByRole('button', { name: 'Hole 4, Course second, Par 3, 182 yards, Thomas Holmes · Jun 2025' });
     fireEvent.click(card);
     expect(f.open).toHaveBeenCalledTimes(1);
     expect(f.holeRpc).not.toHaveBeenCalled();
@@ -201,7 +214,7 @@ describe('BRIEF_COURSES_LATEST_HOLES', () => {
   });
   it('card type reads the signed-off mock letter-spacing and the rail declares no will-change', () => {
     const css = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/latestHoles.css'), 'utf8');
-    expect(css).toMatch(/\.latest-hole-kick\s*\{[^}]*letter-spacing: 1\.2px;/);
+    expect(css).toMatch(/\.latest-hole-number\s*\{[^}]*letter-spacing: -0\.05em;/);
     expect(css).toMatch(/\.latest-hole-course\s*\{[^}]*letter-spacing: -0\.03em;/);
     expect(css).not.toContain('will-change');
   });

```

### src/test/coursesRailsUnlimited.test.tsx — exact authorised diff
```diff
diff --git a/src/test/coursesRailsUnlimited.test.tsx b/src/test/coursesRailsUnlimited.test.tsx
index f4f5596066..0894de9244 100644
--- a/src/test/coursesRailsUnlimited.test.tsx
+++ b/src/test/coursesRailsUnlimited.test.tsx
@@ -100,8 +100,8 @@ describe.each(kinds)('$kind unlimited rail', spec => {
     await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size)); nextVisible();
     await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size + 2));
     const labels = Array.from(cards(view, spec)).map(card => card.getAttribute('aria-label'));
-    expect(labels.filter(label => label === 'The fourth, Course 2, Par 4 · 400 yards, Member · Oct 2026' || label === 'Open Course 2 shot 1 of 3')).toHaveLength(1);
-    expect(labels.slice(-2)).toEqual(spec.kind === 'holes' ? ['The fourth, Course 50, Par 4 · 400 yards, Member · Oct 2026', 'The fourth, Course 51, Par 4 · 400 yards, Member · Oct 2026'] : ['Open Course 50 shot 1 of 3', 'Open Course 51 shot 1 of 3']);
+    expect(labels.filter(label => label === 'Hole 4, Course 2, Par 4, 400 yards, Member · Oct 2026' || label === 'Open Course 2 shot 1 of 3')).toHaveLength(1);
+    expect(labels.slice(-2)).toEqual(spec.kind === 'holes' ? ['Hole 4, Course 50, Par 4, 400 yards, Member · Oct 2026', 'Hole 4, Course 51, Par 4, 400 yards, Member · Oct 2026'] : ['Open Course 50 shot 1 of 3', 'Open Course 51 shot 1 of 3']);
   });
   it('shows exactly one end skeleton only while the next page is in flight', async () => {
     pages = [page(spec)]; const view = mount(spec);
@@ -130,7 +130,7 @@ describe('loaded holes run and refresh', () => {
     pages = [page(spec), page(spec, 50, 3)]; const view = mount(spec);
     await waitFor(() => expect(cards(view, spec)).toHaveLength(20)); nextVisible();
     await waitFor(() => expect(cards(view, spec)).toHaveLength(23));
-    fireEvent.click(screen.getByRole('button', { name: 'The fourth, Course 51, Par 4 · 400 yards, Member · Oct 2026' }));
+    fireEvent.click(screen.getByRole('button', { name: 'Hole 4, Course 51, Par 4, 400 yards, Member · Oct 2026' }));
     expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'h-51', options: { readOnly: true, syntheticPosts: true } }));
     expect(f.open.mock.calls[0][0].posts.map((post: { mediaItems: Array<{ id: string }> }) => post.mediaItems[0].id)).toEqual([...Array.from({ length: 20 }, (_, i) => `h-${i}`), 'h-50', 'h-51', 'h-52']);
     expect(f.open.mock.calls[0][0].index).toBe(21);
@@ -158,7 +158,7 @@ describe('loaded holes run and refresh', () => {
     fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
     pages = [page(spec, 50, 3)];
     fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
-    await screen.findByRole('button', { name: 'The fourth, Course 50, Par 4 · 400 yards, Member · Oct 2026', hidden: true });
+    await screen.findByRole('button', { name: 'Hole 4, Course 50, Par 4, 400 yards, Member · Oct 2026', hidden: true });
     expect(requests(spec)).toHaveLength(2);
     expect(f.rpc).toHaveBeenCalledWith('admin_tag_hole_media', { p_course_id: 'course', p_media_id: 'untagged', p_hole_no: 4 });
     expect(view.cache.getQueryData(['gam_rpc', spec.name, 'infinite', 'admin', false])).toMatchObject({ pages });

```

### src/test/coursesPhotoTopScrims.test.tsx — exact authorised diff
```diff
diff --git a/src/test/coursesPhotoTopScrims.test.tsx b/src/test/coursesPhotoTopScrims.test.tsx
index bb28435835..66024c38af 100644
--- a/src/test/coursesPhotoTopScrims.test.tsx
+++ b/src/test/coursesPhotoTopScrims.test.tsx
@@ -66,20 +66,23 @@ describe('Courses photo top scrims', () => {
     const card = screen.getAllByRole('button')[0];
     const photo = card.querySelector('[data-photo]') ?? card;
     const children = Array.from(photo.children) as HTMLElement[];
-    const layers = children.filter(child => child.style.background.includes('linear-gradient'));
+    const layers = children.filter(child => child.style.background.includes('linear-gradient') || child.classList.contains('latest-hole-scrim'));
     expect(layers).toHaveLength(2);
     const top = layers[1];
     expect(top.nextElementSibling).not.toBeNull();
     expect(top.nextElementSibling?.textContent).toMatch(/941|20\.5|14|194/);
-    expect(source(name)).toContain('background: SCRIM_STANDOUT_TOP');
+    if (name === 'LatestHolesSection') {
+      expect(source(name)).toContain("background: 'var(--latest-hole-corner-scrim)'");
+      expect(source(name)).toContain("background: 'var(--latest-hole-bottom-scrim)'");
+    } else expect(source(name)).toContain('background: SCRIM_STANDOUT_TOP');
     if (name === 'LatestCoursesSection') expect(source(name)).toContain("background: 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 45%)'");
-    else expect(source(name)).toContain('background: SCRIM_STANDOUT');
+    else if (name !== 'LatestHolesSection') expect(source(name)).toContain('background: SCRIM_STANDOUT');
   });
   it('an eleven-second video retains course and member/date text beside its shared player', () => {
     f.holes[0] = { ...f.holes[0], course_name: 'Tralee Golf Club', media_type: 'video', duration_seconds: 11, poster_url: '/sky.jpg' };
     mount(<LatestHolesSection />);
-    const card = screen.getByRole('button', { name: 'The third, Tralee Golf Club, Par 3 · 194 yards, Andrew Yetzes · Apr 2026' });
-    expect(within(card).getByText('Tralee Golf Club')).toBeInTheDocument();
+    const card = screen.getByRole('button', { name: 'Hole 3, Tralee, Par 3, 194 yards, Andrew Yetzes · Apr 2026' });
+    expect(within(card).getByText('Tralee')).toBeInTheDocument();
     expect(within(card).getByText('Andrew Yetzes · Apr 2026')).toBeInTheDocument();
     expect(within(card).getByText('0:11')).toHaveClass('glass-chip');
     expect(card.querySelector('.latest-hole-name')).not.toBeNull();
@@ -92,9 +95,9 @@ describe('Courses photo top scrims', () => {
     const media = card.querySelector<HTMLElement>('.latest-hole-media');
     expect(media?.style.zIndex).toBe('0');
     expect(media?.style.position).toBe('absolute');
-    const layers = Array.from(card.children).filter(child => (child as HTMLElement).style.background.includes('linear-gradient')) as HTMLElement[];
+    const layers = Array.from(card.children).filter(child => ((child as HTMLElement).style.background.includes('linear-gradient') || child.classList.contains('latest-hole-scrim'))) as HTMLElement[];
     expect(layers.map(layer => layer.style.zIndex)).toEqual(['1', '1']);
-    for (const selector of ['.latest-hole-name', ...(media_type === 'video' ? ['.latest-hole-video'] : [])]) {
+    for (const selector of ['.latest-hole-figure', '.latest-hole-name', ...(media_type === 'video' ? ['.latest-hole-video'] : [])]) {
       expect(card.querySelector<HTMLElement>(selector)?.style.zIndex).toBe('2');
     }
     expect(media?.querySelector('img')).not.toBeNull();
@@ -107,7 +110,7 @@ describe('Courses photo top scrims', () => {
     const big = screen.getByRole('button', { name: 'Open Course a shot 1 of 14' });
     expect(big.style.isolation).toBe('isolate');
     expect((big.firstElementChild as HTMLElement).style.zIndex).toBe('0');
-    const gradients = Array.from(big.children).filter(child => (child as HTMLElement).style.background.includes('linear-gradient')) as HTMLElement[];
+    const gradients = Array.from(big.children).filter(child => ((child as HTMLElement).style.background.includes('linear-gradient') || child.classList.contains('latest-hole-scrim'))) as HTMLElement[];
     expect(gradients.map(layer => layer.style.zIndex)).toEqual(['1', '1']);
     expect((within(big).getByText('14').parentElement as HTMLElement).style.zIndex).toBe('2');
     expect((within(big).getByText('Course a').parentElement as HTMLElement).style.zIndex).toBe('2');

```

## Constraints
No SQL/migrations, backend changes, feed_config, round_pool_cap or native configuration edits. No viewer edits. No unexpected or pre-existing failures appeared.
