# Discover fixed header and two tabs

## Pre-build findings

- Amateur News already uses `useAmateurStories`: a direct `amateur_stories` query, newest first, capped at 40. The existing lead, row, date/tag, and reaction treatments are reusable.
- Review media already comes through the paginated `useLatestReviews` path: 24 reviews per page with nested `course_review_media`. It currently chooses one cover image, so the presentation model will expose the already-returned media count for `+N`; no extra per-tile query or SQL is needed.
- Clips and Videos have capped RPC-backed Watch feeds and an existing direct `post_media` hook, but the current Discover hooks fetch up to 2,000 posts on mount and classify by duration in the browser. The new tab will use capped, tab-enabled reads rather than mounting those full-pool hooks.
- Round media has no existing dedicated hook or RPC. The existing RPC shape does not expose round linkage, but a capped direct query can filter published `posts.whs_score_id` and join `post_media`; therefore no new SQL is required.
- Moments currently use a course-tagged direct query capped at 500, not a small lazy read. The new tab will request only the six-item sample it renders.
- `course_hole_media` has no client section and remains excluded as requested.
- `college_media` is not used.
- Brief inconsistency: `/community` was deleted and currently redirects to `/explore`. A Moments “See all” link can target `/community` literally, but it immediately returns to Discover and is not a functioning destination. This will be reported, not silently replaced.

## Implementation

1. Change only the `/explore` chrome registry rule to `chrome: none`, leaving Discover immersive and every other route untouched. Build a Discover-owned fixed header that reuses the existing HCP gating/behavior, profile menu, and search overlay.
2. Add local, non-persisted Circuit / News & media tabs. Reset document scroll on tab changes and keep the URL unchanged.
3. Keep the current Circuit hero, filter, board, and complete Courses Played region unchanged. Offset its hero below the fixed header and move the filter sticky offset beneath the full safe-area-aware header.
4. Build News & media in the requested order using existing news/reaction/media primitives and new capped, tab-enabled direct reads where the old Discover hooks are too broad.
5. Add the footer search scoped only to the capped News & media results.
6. Verify cold `/explore`, in-app navigation, tab switching, sticky behavior, and unchanged chrome on Clubhouse, Courses, and Watch. Measure the rendered header and compare its vertical cost with the prior islands.

## Technical notes

- Header height: safe area + 46px control row + tab strip + 1px edge, published as a Discover CSS variable for the sticky filter.
- No SQL, URL state, persistence, app-shell padding, or changes outside Discover route presentation/data reads.
- The `/community` redirect means acceptance item S4.6 cannot be fully satisfied without a separate routing decision.
