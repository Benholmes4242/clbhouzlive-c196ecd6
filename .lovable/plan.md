# Glass Cards G3

## Scorecard clubhouse foot
- Use `useFeedCommentPreview` with the resolved one-item post ID list; do not add another comment query.
- Add preview readiness to the G2 supporting map so it joins the existing 120ms coalesced settle and never becomes subject data.
- Pass the backing post ID, surface like count, settled preview, count, and existing comment-sheet action into the shared scorecard.
- Keep `RoundEngagementActions` unchanged, then render `LikedByRow` at an 8px gap, a content-backed `FeedCommentPreview` at an 8px gap with no top rule or viewer prompt, and the existing action grid at 14px.
- Keep page-mode behavior additive and preserve the no-post collapse.

## Review header and foot
- Move the reviewer avatar, name, and metadata into the fixed header beneath the course identity and verdict.
- Replace the two text buttons with the same 17px icon-over-label action geometry as the scorecard: PROFILE, COURSE, SHARE.
- Preserve profile and course navigation. COURSE remains disabled at 0.4 opacity without a course ID.
- Implement SHARE as a native share-sheet action for the exact review URL, with the existing `Link copied` clipboard fallback and `review_share_opened` analytics. Do not close the card for sharing.
- Always use equal columns for present actions: three when the review and course IDs exist, otherwise PROFILE and COURSE as two halves with SHARE omitted.
- Add a review reaction read in the portal, include it in G2 supporting readiness, and pass the live surface count/state into the sheet.
- Render the unchanged heart action followed by `LikedByRow`, using the surface count and `source="review"`; add no comment glyph or preview.

## Shared review-liker source
- Extend the likes source type through `LikedByRow`, `LikesSheet`, `usePostLikers`, and `usePostLikes` with `review`.
- For reviews, read personal actors from `content_reactions` filtered by `target_type='review'` and the review ID, newest first, capped at 200; retain existing enrichment, ordering, blocked-member filtering, and surface-count rules.

## Explore review quote
- For lead reviews only, set the headline to 20px while keeping the existing three-line clamp, 1.12 line height, and -0.02em tracking.
- Leave standard and pair cards unchanged.

## Verification
- Add focused coverage for scorecard foot order, count authority, comment-content gating, and coalesced readiness.
- Add review-sheet coverage for moved identity, heart/liked-by, no comments, exact action columns, disabled COURSE, native share payload/fallback, and review liker reads.
- Confirm the scorecard and review foot/card heights cold and warm, including the busiest round, and confirm internal scrolling at the 82dvh ceiling.
- Measure the lead review tile at 320px, 390px, and 430px before and after; confirm its total height and footer clearance do not change.
- Run focused tests and TypeScript checks. Report the intentional mismatch: scorecard SHARE opens the composer, while review SHARE sends a link.

## Data report
- Current database snapshot: 175 reviews total; 6 have at least one review reaction; median likes among liked reviews is 1.5.
- No schema change is included; review comments remain out of scope.
