# CB118.1 — Club loading identity: stop report

## Diff

Only two application lines changed in `src/pages/BusinessProfilePage.tsx`:

```diff
- const { data: clubCourses } = useQuery({
+ const { data: clubCourses, isPending: clubCoursesPending } = useQuery({

- if (authLoading || isLoading) {
+ if (authLoading || isLoading || (business?.club_id && clubCoursesPending)) {
```

The existing `<ProfileSurfaceSkeleton headline counters={4} tabs={3} />` is reused. Query key, enablement, cache settings, query function, hook order, error fallback and non-club layout are unchanged. A disabled no-club query cannot trigger this skeleton because the condition requires club_id.

No SQL, migration, deployed RPC/edge-function, feed_config or native/Median changes. round_pool_cap remains 30.

## Tests: before / after

`src/test/cb118BusinessVisiting.test.tsx`: **33 → 37 tests**, four additions:

1. **club_id with pending courses shows the existing skeleton and no Visiting, tabs or non-club sections** — pending query plus skeleton; no PageRoot, Visiting or tabs. Passed.
2. **resolved club courses render the club layout without an intermediate non-club card** — delayed read resolves to club Visiting after What golfers say; watches for non-club DOM insertions. Failed at the final watcher assertion.
3. **courses query error keeps the existing non-club fallback** — error status, Visiting, About tabs and posts retained. Passed.
4. **business without club_id never waits for pending club courses** — disabled query stays idle; loaded page/Visiting/About render without the skeleton. Passed.

The shared test PostgREST fixture now accepts the table name and an optional delayed/error response for `golf_courses`. Existing fixture response remains the default for all old cases. Added `act` import and fixture-response cleanup. No existing test assertion, name or expected value changed. No test deleted or renamed. `src/test/cb107ClubVisiting.test.tsx` is **unedited**.

## Commands and results

- `bunx vitest run src/test/cb118BusinessVisiting.test.tsx src/test/cb107ClubVisiting.test.tsx`: **58 passed / 1 failed / 59 total, 2 files**. All 22 CB107 tests passed.
- `bunx vitest run`: **3,804 passed / 8 failed / 3,812 total, 417 files** (411 passed files, 6 failed). No skipped tests reported.
- Previous reported full suite: **3,805 passed / 3 failed / 3,808 total, 417 files**. Inventory delta is exactly **+4**, solely the four named CB118.1 additions; no file-count change.
- Requested earlier Media green: 3,734 / 414. Intervening CB117 +22/+1, CB118 +33/+1, Media v3 +19/+1, this CB118.1 +4/+0 = **3,812 / 417**.
- Automatic preview result: **build OK at 2026-10-28T07:36:05Z**. No surviving compile error was reported.
- No browser/live signed-in verification performed after the stop. This is not an all-passing completion report.

## New test failure — stop

`src/test/cb118BusinessVisiting.test.tsx:274:28`

**CB118.1 club courses loading identity > resolved club courses render the club layout without an intermediate non-club card**

Tool words: `AssertionError: expected [ …(1) ] to have a length of +0 but got 1`.

Failing assertion: `expect(nonClubNodes).toHaveLength(0)`.

The watcher treats every `[data-posts-content]` node as non-club. The test's PostsTabContent mock uses that marker; the legitimate club-only ClubFromTheClub also renders PostsTabContent. Therefore the observed one-node result does not itself establish a transient non-club card. The loaded club seam and absent tablist assertions passed before this failure. No fixture, assertion or application correction followed the failure.

## Pre-existing failures

1. **Media failure remains:** `src/test/adminHoleTagging.test.tsx:127:85`, **admin block and batch > member own block stays before admin and uses unchanged member write**.
   Tool words: `TestingLibraryElementError: Found multiple elements with the role "button" and name "Hole 7"`.
   Unchanged and out of this brief's scope.
2. **Resolved unedited:** `src/test/cb107ClubVisiting.test.tsx:257:107`, **CB107 page integration > club Visiting follows What golfers say; contact rows and About are gone**.
   Previous tool words: `AssertionError: expected false to be true // Object.is equality`. Passed in both new runs.
3. **Resolved unedited:** `src/test/cb107ClubVisiting.test.tsx:273:43`, **CB107 page integration > Team stays conditional and moves into Visiting as Meet the team**.
   Previous tool words: `AssertionError: expected <div role="tablist" …(3)>…(3)</div> to be null`. Passed in both new runs.

## Additional unexpected full-suite failures

These six cases passed in the preceding Media v3 full run; they are newly observed failures, not labelled pre-existing. All are unchanged in CB118.1. No retest, timeout adjustment or test edit followed them.

For each, the tool reports:

```text
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

- `src/test/adminHoleTagging.test.tsx:114:3` — **admin block and batch > Remove tag calls admin_untag_hole_media with the row id and refreshes the same keys**.
- `src/test/coursesRailsUnlimited.test.tsx:152:3` — **loaded holes run and refresh > admin hole-tag predicate invalidation refetches the active infinite holes rail**.
- `src/test/holePhotoFastPaths.test.tsx:72:3` — **MEDIA_FAST_1 > successful next tags exact URL and hole then advances**.
- `src/test/holePhotoFastPaths.test.tsx:79:3` — **MEDIA_FAST_1 > a second and third photograph can be tagged to the same hole**.
- `src/test/holeTagBatchV3.test.tsx:30:3` — **selection and confirm > tapping the selected hole again deselects it and disables Tag; a different tap moves the selection**.
- `src/test/mediaV3.test.tsx:43:3` — **Media v3 selection rules > single has one selection across holes and places, and only submits on primary**.

## Remaining acceptance

The two requested CB107 regressions now pass unedited. The new watcher fixture failure, inherited Media lookup failure and six newly observed full-suite timeouts prevent all-green acceptance. Await authorization before any test or fixture correction. Application scope remains the two-line loading gate only.