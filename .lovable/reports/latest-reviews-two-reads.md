# URGENT FIX: Latest reviews heading with no rails

- useBrowseReviews: two parallel reads (media: `course_review_media!inner` + `.not('course_review_media.media_url','is',null)`, limit 40; words: plain embed + `.not('review','is',null).neq('review','')`, limit 60), merged, deduped by id (keeping the row with the fuller media list), sorted created_at desc, capped at 80; either error throws. Key now `['courses','browse-reviews-v2',…]`. Header updated.
- mapRow returns null with no non-blank text and no usable media.
- LatestReviewsSection renders only when a review qualifies for a rail; shell while loading; otherwise null.

## Tests
- Changed (authorised: encodes single read / old key), `persistedCourseSignals.test.tsx`:
  - mock chain `for (const method of ['select', 'eq', 'in', 'order', 'limit'])` → adds `'not', 'neq'` (the chain mock lacked the words/media filters the new reads call).
  - `query.queryKey[1] === 'browse-reviews' ?` → `'browse-reviews-v2'`.
- Added `latestReviewsTwoReads.test.tsx`, 4 cases (a)–(d). One of my own new assertions in (b) was wrong on first run (it rejected the course join's `!inner`); corrected to check the media embed before the full run.
- Deleted: none.

## Totals
Before 9,089 → after **9,093/9,093** (2,224 / 2,249 / 2,284 / 2,336), +4 added. No failures. Typecheck clean.

## LATEST_REVIEWS_CONTENT_ORDER
- useBrowseReviews selects review_date; both reads order review_date desc, nulls last. Pool sorted by contentAt (newest usable media created_at, else review_date ?? created_at), then POOL_CAP 80. LatestReview gains optional contentAt; `at` unchanged. Key bumped to browse-reviews-v3.
- Updated assertion: persistedCourseSignals.test.tsx:85 `query.queryKey[1] === 'browse-reviews-v2'` → `'browse-reviews-v3'` (key bump).
- Added 4 tests in latestReviewsTwoReads.test.tsx ("Latest reviews content-led order" a–d).
- Shards: 2,226 / 2,262 / 2,282 / 2,344 passed + 4 failed (9,118 total, 9,114 + 4). STOPPED: the 4 failures are the pre-existing reviewReceiptNextCourse.test.tsx `media.discardRemovals is not a function` mock gap awaiting ruling; reproduce in isolation.
