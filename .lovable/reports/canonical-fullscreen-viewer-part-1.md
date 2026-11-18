# CANONICAL_FULLSCREEN_VIEWER part 1 — build report

## What changed
- `src/lib/reviews/reviewFeedPost.ts` is the one review → FeedPost adapter (plus `latestReviewInput`). It sets `engagementTarget: { type: 'review', id }` and derives video posters with `holeMediaPoster` (a playback URL is never a poster).
- It replaces all three old builders and the review card's viewer post:
  - `CourseReviewsTab.buildReviewFeedPost` now calls the adapter.
  - `browse/latestReviewFeedPost.ts` is **deleted**.
  - AboutMediaStrip's review parents use the adapter.
  - `ReviewBottomSheet` builds its viewer post from its own props and media through the adapter. It no longer calls `get_review_post`; `useReviewPost.ts` is now unused by the app but is kept because five tests mock its path.
- `FeedPost.engagementTarget` is new. When it is absent, the post is the target, as before.
- New hook `useViewerEngagement.ts` routes review targets:
  - Like count and viewer-liked come from `useStoryEngagement('review', ids)`.
  - The toggle is `useContentReactions.toggle('review', id)`. A local optimistic value holds until the `story-engagement/review` refetch.
  - The comment count comes from the same read. Share uses the shared `shareReview` (extracted from ReviewBottomSheet, same behaviour).
  - `handleLike` / the post like mutation is never called for a review target. Double-tap uses the same routing.
- CommentsSheetV2 opens with `targetType="review"` on the review id. LikedByRow uses `source="review"` and the review subject.
- **More is hidden for review targets**: MoreOptionsDrawer has no review mode.
- readOnly is removed from these review opens: ReviewRailSlot, CourseReviewsTab and AboutMediaStrip. ReviewBottomSheet never passed it.
- AboutMediaStrip:
  - Review parents come from one batched `course_ratings` read by id, using `WORDS_SELECT` (useBrowseReviews' columns) under viewer RLS.
  - Post parents get the course header from one `golf_courses` row.
  - **Post parents stay readOnly**: no client read returns post like/comment counts and viewer-liked by id. A per-post flag, `FeedPost.readOnly`, keeps this possible inside an otherwise interactive open. The overlay treats `store.readOnly || activePost.readOnly` as read-only; SnapFeed still gets the open-wide flag.
- Course photos (syntheticPosts) now use the canonical layout:
  - The same back circle and course header, with no rating chip anywhere. `courseChip`, `showCourseChip` and the `useCourseRatingAggregates` read are removed.
  - The author row comes from memberShot, with the added month in the sub-row.
  - A glass hole strip appears only for ordinal hole kickers ("The fourth" / "The 21st", from holeOrdinal). It never appears for place labels or "Through members' eyes".
  - "View post ›" sits on its own line in the Full review style. The canonical video row is used. There are no pills.
- `MemberShotCredit.tsx` and `member-shot-credit.css` are deleted, along with their two now-unused `--member-shot-*` CSS variables. `memberShotPosts.ts` is unchanged. CourseGalleryChrome is untouched.

## Tests changed (authorised by §6)
- memberShotCredit.test.tsx:
  - "shows only the active item caption and follows horizontal carousel position" was rewritten as "the canonical author row follows the active item and horizontal carousel position". It asserted `getByText("Through members' eyes")` and the credit text inside the old block. It now asserts the shot author row, the date and the hole strip.
  - "synthetic opens render no reserved footer or old author row and no relative time" was rewritten as "synthetic opens render the canonical stack with no old credit block, profile door or relative time". It asserted `.member-shot-text` textContent `"Through members' eyesRoyal PortrushThomas Holmes · Mar 2026"`.
  - "a missing avatar uses the active member initial…" now finds the name in `[data-fullscreen-shot-author]`. It previously found it via the credit-block text.
  - "synthetic scrubber bottom is the safe-area string" was rewritten as "synthetic scrubber uses the canonical inset video row with time". It asserted `bottom: 'env(safe-area-inset-bottom, 0px)'`, the full-width scrubber.
  - "caption bottom switches between image and active video clearance…" was rewritten as "the canonical video row (left mute) appears only while the active item is a video". It asserted the `member-shot-caption-video` class and the CSS `bottom: calc(24px + env(safe-area-inset-bottom))`.
  - Fixture: item b now carries `detail: 'Par 4 · 412 yards'` separately from its title.
- latestHolesSwipeCaption.test.tsx:
  - "detail renders only when present…" moved from `.member-shot-detail` to `[data-fullscreen-hole-strip]`.
  - "empty detail is omitted" moved from `.member-shot-detail` toBeNull to: the strip text is the kicker only.
  - "all member-shot titles use one-line ellipsis with a shrinking text column" was rewritten as "course-photo course names use the canonical header name element". It read member-shot-credit.css.
  - "Latest from the courses caption keeps its title alone without detail" was renamed to "…opens name the course in the header with no hole strip or members kicker". It asserted `.member-shot-title`.
  - "rating and course navigation follow horizontal active-shot changes, and the top bar carries no course name" was rewritten as "course header and navigation follow horizontal active-shot changes, with no rating chip". It asserted `getByRole('button', { name: 'clbhouz rating 8.6' })` and `queryByRole('button', { name: /^Open / })).toBeNull()`.
  - "legacy review/golfCourse/post precedence… (synthetic true)": the door was `/^clbhouz rating/` and is now the header's `Open …` name in both modes.
- fullscreenViewerRedesign.test.tsx: "(a) a real post header has no rating chip; the member-shot viewer keeps it" was renamed to "(a) neither a real post nor a course photo header has a rating chip". It asserted `getByRole('button', { name: /^clbhouz rating/ })` on the shot.
- businessAuthorAppWide.test.tsx: "neither fullscreen surface passes a one-letter fallback prop" was renamed to "the one fullscreen chrome passes no one-letter fallback prop". It read `MemberShotCredit.tsx`.
- proLabelCoverage.test.ts: the WIRED entry `MemberShotCredit.tsx` was replaced with `ImmersiveFullscreenChrome.tsx`, which now imports InlineProMemberName. The case count is unchanged.
- pf2HoleGuide.test.tsx: the three "PF2 View post pill" cases were rewritten against the canonical chrome:
  - "renders only with a sourcePostId and lifts the caption only then" became "renders only with a sourcePostId, on its own line in the Full review style". It asserted the `member-shot-caption-lifted` class.
  - "the tap reports the post and never reaches the slide" became "the tap opens the post and never reaches the slide".
  - "video shots use the video geometry classes" became "video shots keep View post in the stack with the canonical video row below it". It asserted `member-shot-caption-video` / `member-shot-viewpost-video`.
- latestReviewMediaTaps.test.tsx (deleted builder):
  - The import moved to `reviewFeedPost(latestReviewInput(...))`.
  - `options: { readOnly: true, hasNextPage: false }` became `{ hasNextPage: false }`, and engagementTarget is now asserted.
  - "carries dimensions with 1080 fallback and keeps zero engagement read-only shape" was renamed to "…and routes engagement to the review".
- No tests were deleted.

## Tests added
`src/test/canonicalFullscreenViewer.test.tsx` adds six cases, (a) to (f), as listed in §6.

## Totals
- Before: 9,095. After: 9,101 (2,226 / 2,258 / 2,282 / 2,335), four shards run sequentially, no failures.
- The difference is the six new cases. Rewritten cases kept their counts. Typecheck is clean.

## Not checked
iPhone and signed-in browser checks: review like/comment pills against live data, and the course-photo appearance.
