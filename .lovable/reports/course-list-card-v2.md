# Course list card V2

## Delivered
- One shared card for Courses browse and Top 100: 150px straight-edged photo, one exact local scrim, position/name/area only on photo; shared shortCoursePart names.
- Sort-led figures for seven lenses, singular round/rating labels, canonical fmtToPar with Level and true minus, under-par TOPAR_RED, gold course records, missing-figure rounds fallback.
- Browse positions computed on the full loaded list before search. Top 100 existing official/community rank handling remains unchanged.
- Member count from row.members / Top 100 playerCount; up to three canonical 22px faces, 17px overlaps, canvas ring, first on top. Browse context and holder ids share one user_profiles read; Top 100 opts out of redundant context and gets holder identity/photo through the same holder hook.
- 30px holder face and conditional record row; Lowest rounds omits repeated gross. Best rated/community omit repeated overall; CategoryScores unchanged. Top 100 no-rounds copy replaces lead/faces/record.
- Both photo-height exports 150; both card gaps zero, existing shells read those exports. App font inherited as explicitly chosen; shared CategoryScores remains unchanged, including its existing font declaration.
- Removed old fades, difficulty sentences, You played chip, best-by members line and RankBadge. Viewer, Latest holes, server ordering/eligibility, navigation, srcset and paging unchanged.

## Verification
Baseline: **8,899** from Latest holes H1. After: **8,927**, exactly **+28** (25 courseListCardV2 cases, 3 courseListFacesV2 cases). No test deleted; existing coursesListPhotoCards retains 15 tests.

Focused commands:
- `npx vitest run src/test/courseListCardV2.test.tsx src/test/coursesListPhotoCards.test.tsx src/components/courses/Top100CoursesHubPanel.test.tsx src/test/courseRatingConsistency.test.ts --maxWorkers=2`: 67 passed.
- `npx vitest run src/test/courseListFacesV2.test.tsx --maxWorkers=2`: 3 passed. First attempted in the same tool batch as creation: runner reported “No test files found”; rerun after file save passed, no failing assertion.

Four separate sequential commands, all passed, zero failed/skipped:
- `npx vitest run --maxWorkers=2 --shard=1/4`: 2,258, 194 files.
- `npx vitest run --maxWorkers=2 --shard=2/4`: 2,181, 194 files.
- `npx vitest run --maxWorkers=2 --shard=3/4`: 2,230, 194 files.
- `npx vitest run --maxWorkers=2 --shard=4/4`: 2,258, 193 files.
Total **8,927**, 775 files. Shard redistribution follows addition of two test files, not removals. Logs retained in /tmp/course-card-v2-shard1.log through shard4.log.

## Render checks
- Public live /courses: 320/375/430; document/root/body widths exactly viewport widths. Bright sky/photo inspected at 320. Screenshot reference rendered from uploaded HTML.
- Real BrowseCourseCard rendered in browser-owned temporary mount at 320/375/430: seven browse lenses and both Top 100 modes, each with full/long-name/long-holder, no record, no ratings and no rounds (108 combinations). No horizontal overflow. Long name/holder ellipses stay in their cells. This matrix is fixture-based presentation verification, not an authenticated flow.
- Live search: second course remains position 2 after exact-name search. Live Top 100 official and Golfers' orders opened. Card tap reached /courses/5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96.
- Authenticated browser session unavailable for external unmanaged backend; live signed-in member-face rendering remains unverified. Public data may supply counts without visible profile faces; no identities invented. Batched face union/order verified through 3 focused tests.
- Build log latest entry build OK (2026-11-16T07:58:43Z before report-only edits).

## Authorised existing test replacements

### `the plays sentence keeps its wording and may wrap instead of overflowing`
Old assertions:
```ts
expect(line).toBeTruthy();
expect(line!.textContent).toContain('on average');
expect(line!.style.whiteSpace).not.toBe('nowrap');
```
Why: explicitly replaced photo heights or removed plays/best-by content; replaced one-for-one, count unchanged.

### `a card with nothing under the name is still a 190px photo card`
Old assertions:
```ts
expect(box.style.minHeight).toBe('190px');
expect(PHOTO_H).toBe(190);
expect(view.container.textContent).not.toContain('Plays to');
expect(view.container.textContent).not.toContain('COURSE RECORD');
```
Why: explicitly replaced photo heights or removed plays/best-by content; replaced one-for-one, count unchanged.

### `the Top 100 card is the card it was: members line, best-by record, its own photo height`
Old assertions:
```ts
expect(view.container.textContent).toContain('12 members');
expect(view.container.textContent).toMatch(/Best 62 by Thomas/);
expect(view.container.textContent).not.toContain('COURSE RECORD');
expect(view.container.textContent).not.toContain('GROSS');
expect(view.container.querySelector('div[style*="height: 178px"]')).not.toBeNull();
expect(TOP100_PHOTO_H).toBe(178);
```
Why: explicitly replaced photo heights or removed plays/best-by content; replaced one-for-one, count unchanged.

## Added test inventory

### src/test/courseListCardV2.test.tsx
- it.each([
- ] as const)('%s has the sort figure', (lens, value, label) => {
- it.each(['rated', 'toughest', 'scoreable', 'lowest', 'longest', 'chase'] as StatLens[])('%s falls back to rounds when missing', lens => {
- it('one round and one rating have singular labels', () => {
- it('under par uses true minus and the under tone', () => {
- it('rounded zero reads Level', () => {
- it('search preserves the position from the full loaded list', () => {
- it.each(['Ballybunion Golf Club (Old)', 'Trump International Golf Links'])('shares shortCoursePart for %s', name => {
- it.each([[undefined, '869'], [12, '8.3']] as const)('Top 100 order with official reference %s leads with %s', (officialRank, value) => {
- it('Lowest rounds retains the holder but omits repeated gross', () => {
- it('Best rated omits the repeated ratings lead but keeps four categories', () => {
- it('zero members suppresses supplied faces and count', () => {
- it('Top 100 no rounds suppresses lead, faces and record', () => {

### src/test/courseListFacesV2.test.tsx
- it('resolves players and holder in one profile read, preserving server face order', async () => {
- it('Top 100 opts out of a second player-context read', async () => {
- it('empty lists make no requests', () => {

## Exact existing test diff
```diff
diff --git a/src/test/coursesListPhotoCards.test.tsx b/src/test/coursesListPhotoCards.test.tsx
index bce7a1febb..3a1180eede 100644
--- a/src/test/coursesListPhotoCards.test.tsx
+++ b/src/test/coursesListPhotoCards.test.tsx
@@ -211,20 +211,17 @@ describe('courses list photo cards — the record row', () => {
 });
 
 describe('courses list photo cards — the card body', () => {
-  it('the plays sentence keeps its wording and may wrap instead of overflowing', () => {
+  it('the removed plays sentence is absent', () => {
     const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} holder={RECORD_HOLDER} onClick={() => {}} />);
-    const line = Array.from(view.container.querySelectorAll('div')).find((el) => el.textContent?.startsWith('Plays to'));
-    expect(line).toBeTruthy();
-    expect(line!.textContent).toContain('on average');
-    expect(line!.style.whiteSpace).not.toBe('nowrap');
+    expect(view.container.textContent).not.toContain('Plays to');
   });
 
-  it('a card with nothing under the name is still a 190px photo card', () => {
+  it('both cards use a 150px straight-edge photo', () => {
     const bare = { ...fx.rows[1], course_record: null, avg_to_par: null, rounds: 0 } as StatBrowseRow;
     const view = render(<BrowseCourseCard row={bare} onClick={() => {}} />);
-    const box = view.container.querySelector('button > div') as HTMLElement;
-    expect(box.style.minHeight).toBe('190px');
-    expect(PHOTO_H).toBe(190);
+    expect((view.container.querySelector('.course-list-photo') as HTMLElement).style.height).toBe('150px');
+    expect(PHOTO_H).toBe(150);
+    expect(TOP100_PHOTO_H).toBe(150);
     expect(view.container.textContent).not.toContain('Plays to');
     expect(view.container.textContent).not.toContain('COURSE RECORD');
   });
@@ -238,21 +235,12 @@ describe('courses list photo cards — the card body', () => {
     expect(container).toBeTruthy();
   });
 
-  it('the Top 100 card is the card it was: members line, best-by record, its own photo height', () => {
-    const view = render(
-      <BrowseCourseCard
-        row={fx.rows[0] as StatBrowseRow}
-        variant="top100"
-        recordHolder="Thomas"
-        players={[]}
-        onClick={() => {}}
-      />,
-    );
+  it('Top 100 replaces its members best-by line and photo height', () => {
+    const view = render(<BrowseCourseCard row={fx.rows[0] as StatBrowseRow} variant="top100" recordHolder="Thomas" holder={RECORD_HOLDER} players={[]} onClick={() => {}} />);
     expect(view.container.textContent).toContain('12 members');
-    expect(view.container.textContent).toMatch(/Best 62 by Thomas/);
-    expect(view.container.textContent).not.toContain('COURSE RECORD');
-    expect(view.container.textContent).not.toContain('GROSS');
-    expect(view.container.querySelector('div[style*="height: 178px"]')).not.toBeNull();
-    expect(TOP100_PHOTO_H).toBe(178);
+    expect(view.container.textContent).not.toMatch(/Best 62 by Thomas/);
+    expect(view.container.querySelector('.course-list-record')).not.toBeNull();
+    expect((view.container.querySelector('.course-list-photo') as HTMLElement).style.height).toBe('150px');
+    expect(TOP100_PHOTO_H).toBe(150);
   });
 });

```

## Constraints
No SQL, migration files, backend deployments, feed_config or round_pool_cap changes. No unrelated business font/branding drift edits. Missing detailed memory files were not recreated; current brief and injected current memory rules govern. No change to chipForLens.

Implementation auto-saved in maintenance checkpoint e7569db7d6. Final build checked: build OK at 2026-11-16T08:14:35Z.
