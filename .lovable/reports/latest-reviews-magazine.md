# LATEST_REVIEWS_MAGAZINE — awaiting brief/mock ruling

2026-11-18. Uploaded brief and signed-off HTML read; no feature code or tests changed for this request.

## Contradiction requiring a ruling
- Brief §3: **“CARD WIDTH (both rails): min(300px, 100vw - 64px)”**.
- Signed-off HTML line 106: **`.wr{position:relative;width:min(290px,calc(var(--w) - 64px));...}`**.

These disagree for written cards at 390px: 300px versus 290px. Neither authority has been silently chosen. Asked Ben which written-card width to use. Implementation and its full-suite check are held under the brief/mock conflict rule.

Baseline for the eventual implementation: **9,156/9,156** passed in four sequential shards, detailed in two-rulings-suite-closeout.md. No test count delta in this request.
## Build (after width ruling: written 290px, media 300px, mock wins)
- Files: useBrowseReviews.ts (media embed, text filter dropped, ordered media, Top 100 read `course_top100_memberships` + `top100_lists!inner(slug,is_active)` via activeTop100CourseIds, key ['courses','browse-reviews-top100', ids]); useLatestReviews.ts (ReviewMediaItem, optional media/top100); ReviewRailSlot.tsx (old REVIEW card replaced by media + written rails); LatestReviewsSection.tsx (kicker "In golfers' words"); sectionShells.tsx (two-rail shell).
- Tests updated (old REVIEW card pins): coursesPageV5Sections "V5 §4 Latest reviews card B" 4 tests → 7 magazine tests; whatsBeenPlayedV6 §5 media-line now " · " separator, footer test rewritten for new footer, click target data-review-course; reviewMentionsPreview fixture uses LatestReview shape. Mock evidence: footer separator " · " (mock) replaces V6 " & ".
- Brief note: shortAge shows month ("Nov") past 6 days, not "2w" as the brief's example says.
- Focused 27/27; typecheck clean; shard 1: 2,293 passed. Shards 2–4 were still running at handoff; total unconfirmed.
