# Explore review tile A1

## Scope
- Change only on-photo review cards at non-`pair` size in `ExploreCard`; preserve every other content kind and every `pair` card.
- Keep the 340px photograph, rating chip, scrim, shadows, radius, chip lane, bottom lane, and `kickerParts` behavior unchanged.

## Implementation
1. Replace the review card’s kicker/enrichment/who-line stack with three groups spaced 12px apart and padded `0 16px 16px`:
   - an identity row reusing the existing member-name resolution, viewer-amber styling, avatar, and tap behavior;
   - the existing review quote, clamped to two lines;
   - an optional four-column breakdown rail.
2. Build the identity row so the member name yields first, the course name remains visible, and the nonshrinking right group contains `scope · date` or date alone.
3. Render Design, Condition, Clubhouse, and Facilities as a semantic list only when all four scores exist. Each item gets a visible one-line ellipsized label and an aria-label containing its full localized label and numeric score.
4. Size each fill from `score / 10`; obtain the standout decision from `courseSubScoreTone`, using shared green for standout scores and the specified on-photo neutral token otherwise.
5. Move review photo count above one into a top-right glass chip matching the rating-chip treatment; remove the review-only strongest-area lane.
6. Delete `amateur.stream.enrichment.strongest` and its four area children from all six locale files only after confirming no remaining source references; retain `photos` and reuse the existing `review.subscore.*` labels.

## Verification
- Update the focused Explore hero-card tests because their old assertions intentionally require the retired enrichment lane, separate kicker, and three-line review quote.
- Add checks for all-or-none breakdown rendering, semantic/list accessibility, score labels, photo-count thresholds, long-name truncation priorities, scope/date and date-only identity rows, viewer amber, and unchanged pair/non-review paths.
- Measure all six localized labels in a 390px card and report each locale’s widest label and whether ellipsis is required.
- Verify at 390px with a screenshot, run the existing Explore test set, and run TypeScript checking.
