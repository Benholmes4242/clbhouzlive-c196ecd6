# Feed review glass — completed after shard-4 ruling

## Scope and files
Original implementation is commit `d5f705191a`; this ruling changes no application code.

- `src/components/feed/ReviewPostCard.tsx`: mediaFirst reviews with media put the course door, first non-empty review region/subcountry/country and canonical card-variant ReviewScoreRow in an absolute FS_GLASS strip. Conditional 42% fade and strip disappear when no name or usable score exists. Caption retains the unchanged two-line bold-name body and full-review door; feed footer actions, likes and comments stay with FeedCard. Standard/no-media course weight changes from 800 to 700. Header adds REVIEW and conditional TOP 100 stamps.
- `src/components/feed/feedReviewGlass.css`: scoped fade.
- `src/components/feed/InlineVideo.tsx`: bottom-left mute and bottom-right duration move above the measured strip.
- `src/components/feed/MediaCarousel.tsx`: bottom-centre dots move above the strip. No separate carousel counter exists in this component.
- `src/components/feed/CardFeed.tsx`, `src/components/posts-tab/LightCardFeed.tsx`: one provider around each host's loaded posts.
- `src/hooks/feed/useTop100CourseIds.tsx`: shared batching and context; header documents ownership. ReviewBottomSheet's independent read is unchanged.
- Six `src/locales/{en,en-XA,de,es,ja,ko}/common.json` files: feed.reviewPost.pillReview and pillTop100.
- Tests: `feedReviewGlass.test.tsx`, `cb109MediaFirstEverywhere.test.tsx`, `profileFeedInViewGate.test.tsx`.
- `roadmap.md` and this report.

Fullscreen viewer, owner/follow controls, media dimensions, round and normal post layouts are unchanged. No SQL, migrations, feed_config or round_pool_cap changes.

## Controls and measurement
ResizeObserver measures the strip and sets `--review-glass-h` on the media host; cleanup removes it. Mute and duration use `calc(var(--review-glass-h, -12px) + 18px)` (absent variable gives the original 6px). Carousel dots use `calc(var(--review-glass-h, -8px) + 18px)` (absent variable gives the original 10px). With the strip present each sits at its height + 18px. The strip/fade pass pointer events through; only CourseNameLink accepts them.

## Top 100 read and cache
Each host extracts unique sorted loaded review course ids, then reads:

```text
from('course_top100_memberships')
  .select('course_id, top100_lists!inner(slug, is_active)')
  .eq('top100_lists.is_active', true)
  .in('course_id', missingCourseIds)
```

`activeTop100CourseIds` resolves qualifying memberships. Batch key: `['courses','feed-review-top100',ids]`; per-course cache key: `['courses','feed-top100-course',id]`, storing positive and negative membership for 60 seconds. Pagination batches only missing/stale ids. Loading/error returns no stamp; retry is disabled. Cards consume context, not per-card reads.

## Test changes, before / after
- New `feedReviewGlass.test.tsx`: 0 → 10 cases, named (a), (a2), (b), (c), (c2), (c3), (c4), (d), (e), (f), covering overlay/caption ownership, region fallback, preserved standard/no-media layout, REVIEW availability, active batching/cache, pending/error absence, pointer/course door, offsets and empty omission.
- Authorized existing `cb109MediaFirstEverywhere.test.tsx`, “photo review orders reviewer, media, actions, likes, review block, comments and Add-a-comment”: `expect(order(container)).toEqual(markers)` → `expect(order(container)).toEqual([markers[0], markers[1], markers[5], markers[2], markers[3], markers[6], markers[7], markers[8], markers[9]])`. Scores are now on media before the footer; retired below-photo subject is absent. All other assertions and title retained. Case count unchanged.
- Authorized ruling: `profileFeedInViewGate.test.tsx` previously had no useTop100CourseIds stand-in; added exactly the supplied three-export mock, with provider returning children and both hooks returning empty Sets. React was already imported. All six cases, titles and assertions remain byte-unchanged; 6 → 6 cases. The old harness lacked QueryClient while all feed reads were mocked; this mock closes that gap without application changes.
- No tests deleted or renamed.

## Verification
Earlier focused review run: 44/44 across five files; command:
`bunx vitest run src/test/feedReviewGlass.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/reviewPostCard.test.tsx src/test/reviewPostScoreCompact.test.tsx src/test/reviewPostScoreBlockB2.test.tsx --maxWorkers=2`.

Ruling focused command: `bunx vitest run src/test/profileFeedInViewGate.test.tsx --maxWorkers=2`: **6/6**, 181ms tests, 3.81s run; full output `/tmp/feed-review-glass-ruling-focused.log`.

Full rerun: each command separately, sequentially, result read before the next:

| Command | Passed tests | Files | Duration | Full output |
| --- | ---: | ---: | ---: | --- |
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,257 | 208 | 398.59s | `/tmp/feed-review-glass-ruling-shard-1.log` |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 2,296 | 208 | 312.30s | `/tmp/feed-review-glass-ruling-shard-2.log` |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,299 | 208 | 318.29s | `/tmp/feed-review-glass-ruling-shard-3.log` |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 2,412 | 206 | 314.16s | `/tmp/feed-review-glass-ruling-shard-4.log` |

**9,264 executed / 9,264 passed across 830 files**, against last complete baseline **9,254**, reconciled as ten new feedReviewGlass cases. This ruling adds zero cases. Earlier stopped run is not counted as a full pass. No unexpected failure in this rerun.

Harness preview compilation: latest entry `build 2026-11-20T06:55:14Z — build OK`. No standalone typecheck was run for this test-mock-only ruling.

## Real-post 390/320 check
Not possible in this environment: managed browser authentication status is `external_unmanaged`, so Lovable cannot mint or restore a signed-in session for this external Supabase project. Andrew Yetzes's real Camiral media review was not exercised at 390/320; no authenticated browser/device or exact visual-match claim is made. Ben's signed-in device check remains outstanding.