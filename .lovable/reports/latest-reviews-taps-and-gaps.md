# LATEST_REVIEWS_TAPS_AND_GAPS — stopped

## Implemented
- Record placeholder waits for holders.settled, with 26px squircle, two holder bars and two gross bars; uses existing Skeleton shimmer and real row margin. Non-record facts retain fallback.
- Removed media label and its shell bar; section's HEAD_GAP remains 12. Written-only label has zero extra top margin; combined rails keep 24.
- Media tiles use isolated Button targets; text/disc/ambient retain sheet tap. openWithOrigin receives up-to-20 media reviews in rail order, every media, tapped mediaId/origin/poster, readOnly:true, hasNextPage:false, courses-latest-reviews ownership and required analytics.
- Local latestReviewFeedPost adapter mirrors CourseReviewsTab's shape and its zero-engagement readOnly safety note. Chosen to avoid changing the frozen CourseReviewsTab surface. Dimensions selected/carried with 1080 fallback.
- LatestReviewsSection owns paddingBottom 34 (normal 14 end + following section's 20 top equivalent). Next section unchanged. This is not yet a measured acceptance result.

## Files / line references
- `src/components/courses/CoursesPageHero.tsx`: 116, 165, 230, 275, 294, 295, 296, 298, 299, 302, 303, 307
- `src/components/courses/ReviewRailSlot.tsx`: 29, 80, 83, 132, 146, 150, 158, 161, 163, 173, 176, 218, 224, 231, 233, 262, 278, 313, 316, 326, 330
- `src/components/courses/browse/LatestReviewsSection.tsx`: 8, 20
- `src/components/courses/browse/sectionShells.tsx`: 6, 48, 49, 55, 60, 77, 86, 90, 91, 93, 94, 100, 101, 104, 105, 107, 108, 110, 130, 146, 155, 159, 188, 209, 213, 215, 216, 217, 218, 219, 223, 224, 229, 230, 231, 236, 241, 246, 247, 249, 251, 252, 253, 258, 259, 264, 265, 266, 278, 286, 287, 290
- `src/components/courses/useBrowseReviews.ts`: 54, 66, 67, 110, 111
- `src/components/explore-tab-new/courseled/hooks/useLatestReviews.ts`: 39, 40
- `src/components/courses/browse/latestReviewFeedPost.ts`: 7, 16
- `src/test/latestReviewMediaTaps.test.tsx`: 13, 20, 48, 49, 50
- `src/test/latestReviewHeroLoading.test.tsx`: 16, 19, 24
- `src/test/coursesPageV5Sections.test.tsx`: 17, 73, 103, 110

## Test accounting
Baseline before request **9,160**; expected after **9,164** (+3 latestReviewMediaTaps, +1 latestReviewHeroLoading). No deletion/rename. One authorized assertion update in coursesPageV5Sections.test.tsx, case “a review appears once across the two rails, each under its label”: `expect(labels).toEqual(['SEEN ON THE COURSE', 'WRITTEN REVIEWS'])` → `expect(labels).toEqual(['WRITTEN REVIEWS'])`; reason: explicitly removed media label. Other existing assertions unchanged.
New cases: “opens the third tile with every media and adjacent review, without opening the sheet”; “keeps text and written card taps on the review sheet”; “carries dimensions with 1080 fallback and keeps zero engagement read-only shape”; “shows only the record-shaped placeholder until settled, even with cached matching data”.

## Verification / STOP
Command: `npx vitest run src/test/latestReviewMediaTaps.test.tsx src/test/latestReviewHeroLoading.test.tsx src/test/whatsBeenPlayedHero.test.tsx src/test/coursesPageV5Sections.test.tsx src/test/whatsBeenPlayedV6.test.tsx src/test/cb69CourseNameLink.test.tsx src/test/courseRatingConsistency.test.ts src/test/fixOverflowSource.test.ts src/test/reviewMentionsPreview.test.tsx --maxWorkers=2`.
**81 executed / 80 passed / 1 failed**, 9 files (8 passed / 1 failed). Media entry tests 3/3 pass; existing focused tests pass. Unexpected failure in new hero regression:
```
FAIL src/test/latestReviewHeroLoading.test.tsx > Latest reviews hero record waiting > shows only the record-shaped placeholder until settled, even with cached matching data
AssertionError: expected <div aria-hidden="true" …(3)>…(3)</div> to be null
❯ src/test/latestReviewHeroLoading.test.tsx:24:67
expect(container.querySelector('[data-hero-record-loading]')).toBeNull();
```
The initial placeholder/no-crown checks passed; the test's second render retains the placeholder. Likely the memoized CoursesPageHero skips the same-props rerender while a plain mock flag changes; not confirmed by a rerun. No fixture repair or component workaround applied. STOPPED immediately; four shards not started (all totals unavailable). Needs explicit ruling on this test before further verification.
Harness build OK at 10:20:29 UTC, after correcting an intermediate unsupported Button variant to ghost. No surviving build error.
390px gap measurements **not run**; both measured numbers unavailable. 320px containment and canonical viewer swipe/browser acceptance **not run**, blocked by stop; no authenticated acceptance claim.
No brief/data contradiction established. No SQL, migrations, maintenance/feed_config changes; round_pool_cap unchanged. Existing record hook and CourseReviewsTab/viewer remain untouched.
Logs: `/tmp/latest-taps-suite/focused.log`.

## Approved fresh-mount closeout — 2026-11-18
- Changed only latestReviewHeroLoading.test.tsx:23 to `rerender(<MemoryRouter key="settled"><CoursesPageHero /></MemoryRouter>)`; all five assertions preserved. Case “shows only the record-shaped placeholder until settled, even with cached matching data” retains its original name and count **1 → 1**. Reason: explicitly approved fresh mount bypasses memoization of identical props with a non-reactive mock. No component changes in this follow-up.
- Focused command `npx vitest run src/test/latestReviewHeroLoading.test.tsx --maxWorkers=2`: **1/1 passed**.
- Sequential commands: `npx vitest run --maxWorkers=2 --shard=1/4`, then `--shard=2/4`, then `--shard=3/4`, then `--shard=4/4`.
- Shards **2,296 / 2,267 / 2,267 / 2,334 = 9,164 passed / 9,164 executed**, **809 files**, zero failures. Before/after this follow-up **9,164 → 9,164**, zero delta. Against last passing 9,160: +3 latestReviewMediaTaps cases and +1 latestReviewHeroLoading case, listed above. Different shard distributions reflect Vitest allocation, not added/removed tests.
- Preview at 390px: **34px above Latest reviews**, **34px below the written rail to Every course played**; measured element rectangle edges. Title-to-first-mosaic **12px**. At 320px document/root scroll widths both **320px**, no page overflow; screenshots reviewed at both widths.
- Important measurement limitation: external unmanaged Supabase, public Courses visit. What's been played is signed-in-only and absent; the actual preceding visible rail is Latest holes. Its bottom-to-In golfers' words seam measured 34px. The signed-in What's been played seam is not browser-measured; source uses the same 14px end + 20px next top. Do not represent this as authenticated acceptance of the exact requested seam.
- Screenshots/log script: `/tmp/browser/latest-gaps/reviews390.png`, `reviews320.png`, `check_gaps.py`. Suite logs `/tmp/latest-taps-rerun/shard1–4.log`, COMPLETE status.
- Harness build OK at 10:25:24 UTC; no manual build/typecheck. Canonical viewer sideways/vertical swipes and authenticated cold load remain unverified in browser; media entry and record state assertions pass in the suite. No SQL, migrations or frozen-setting changes.
