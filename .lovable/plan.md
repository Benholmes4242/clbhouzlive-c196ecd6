# Wire stories in Clubhouse

## Goal
Inject recent Tour Wire stories into the resolved Clubhouse feed after every third social post, without changing feed ranking, post behavior, loading gates, or backend queries.

## Implementation

### 1. Add a reversible client-side merge
- Add a small feed-injection utility beside the Clubhouse feed code with:
  - `WIRE_SLIDE_CADENCE = 3`
  - `WIRE_STORY_MAX_AGE_DAYS = 14`
  - a single `injectWireStories(posts, stories)` function returning a discriminated list of post and Wire items.
- Filter stories to published, already-live, image-backed stories from the last 14 days, preserving newest-first order from `useTourStories`.
- Insert one unique story after each complete group of three posts; never insert before or into a feed containing fewer than three posts, and stop once stories are exhausted.
- Keep the call isolated in `Clubhouse.tsx`, so disabling the feature means removing that call and passing the original post list.

### 2. Fetch stories independently of feed readiness
- Call `useTourStories(null)` in `Clubhouse.tsx` for the all-tour list.
- Derive merged items only after story data arrives; posts and the existing skeleton/round-data gates continue to render from the social feed immediately.
- Treat loading and query failure as an empty editorial set: no Wire skeleton, error, toast, or blocked feed.
- Preserve the existing `['tour-stories', 'list']` React Query cache key, shared with the News tab and Overview preview.

### 3. Render Wire items safely inside the virtual feed
- Extend `CardFeed` to accept the discriminated merged list while retaining the raw `posts` array for post-only behavior: media activation, video warming, reactions, comments, fullscreen navigation, course/round batching, and active-index state.
- Render Wire items as non-observed editorial slides so they never enter post/video/fullscreen state.
- Keep each post's canonical post index for all existing callbacks and stores, while Virtuoso keys Wire items by story ID.
- Give Wire slides the same 8px feed separator beneath them and update snapshot length validation to use the merged item count.

### 4. Build the shared-news Wire slide
- Add a `WireFeedSlide` under `src/features/tourhub/news/` with no avatar, follow, like, comment, or share controls.
- Anatomy: amber mark + localized `FROM THE WIRE`, shared relative time at right, 176px lead image, quiet white kicker, 19/700 headline at `-0.02em`, dark foot gradient, 13px muted standfirst, and localized `READ THE STORY` action.
- Use the existing story route `/tour/news/:slug` for both the slide and action.
- Extract/reuse the News feature’s image-overlay/meta primitives where needed so kicker, headline, image crop, and `storyTime` formatting stay aligned with `LeadStory`; preserve the News tab, story page, and Overview behavior.
- Use the existing semantic dark/amber/quiet tokens, with only a faint amber surface tint.

### 5. Locale and verification
- Add ASCII `news.fromWire` and `news.readStory` strings to all six `tourhub.json` locale files.
- Add focused tests for 0/2/3/6/30 posts, insufficient stories, duplicate prevention, image-less stories, age boundary, draft/scheduled exclusion, and exhausted stories.
- Verify in Clubhouse that posts paint before Wire data, a failed/slow Wire query leaves the normal feed intact, story taps route correctly, and injected slides expose no member-post affordances.

## Expected cadence
- 3 posts: 1 slide when one eligible story exists.
- 6 posts: up to 2 slides.
- 30 posts: up to 10 slides.
- All counts are capped by the number of unique eligible stories.

## Known constraint
`useTourStories(null)` intentionally fetches the shared newest-first list (currently capped at 40) and the 14-day/image eligibility is applied client-side. This preserves the single shared query/cache requested and requires no SQL or ranker change.
