# Review videos — persisted poster boundary (STOP)

## Result and stop
Implemented the requested HTTP(S)-only persistedPoster helper, review poster write boundaries and database read safety nets. All six requested new regressions passed. Existing tests failed once after completed edits: **47 passed / 7 failed / 54 executed** across six focused files. Stopped immediately: no assertions changed, no reruns, no shards and no subsequent application repairs.

No SQL, migrations, feed_config, round_pool_cap, layout or style changes. Stored rows were not repaired; Ben owns those repairs. New local composer preview values remain unchanged at the original subscription/result/probe sites (formerly lines 132, 529, 700). Existing database-media hydration now sanitizes stored posters.

## Files changed
Application files:
- src/features/review-v2/lib/persistedPoster.ts (new helper and ownership header).
- src/features/review-v2/lib/reviewUploadController.ts.
- src/features/review-v2/hooks/useReviewMediaPipeline.ts.
- src/lib/courseMedia/composerHolePhotos.ts.
- src/lib/courseMedia/holePhotoData.ts.
- src/components/posts/useReviewMedia.ts.
- src/components/courses/useBrowseReviews.ts.
- src/components/explore-tab-new/courseled/hooks/useLatestReviews.ts.
- src/hooks/useCourseReviews.ts.
- src/hooks/useUserCourseMoments.ts.
- src/features/explore-magazine/useReviewPageEnrichment.ts.
- src/components/media-system/utils/feedMapper.ts.
- src/components/course-media-tab/hooks/useCoursePlaceMedia.ts.
- src/uploads/uploadPipeline.ts (legacy review insert only; post insert sites unchanged).

Tests/support: src/test/reviewVideoPoster.test.ts (new six cases), roadmap.md, this report and focused.log.

Root AGENTS.md remains unchanged: only 25 bytes of its protected budget remained; module-local ownership is recorded in the helper header, not compressed into existing protected rules.

## Every write site touched
1. reviewUploadController.ts, uploadAndPublishReview: p_media[].poster_url for publish_pending_review uses persistedPoster([input.posterUrl, r.posterUrl], r.streamId ?? input.streamId ?? null).
2. useReviewMediaPipeline.ts, insertMediaRow: course_review_media insert uses persistedPoster([item.posterUrl], item.streamId ?? null).
3. useReviewMediaPipeline.ts, uploadOne video branch: legacy course_review_media insert uses persistedPoster([poster], streamId); in-memory updates unchanged.
4. composerHolePhotos.ts, writeComposerHolePhoto: review-composer course_hole_media contribution uses persistedPoster([item.posterUrl], streamId).
5. uploadPipeline.ts, legacy review-media insertion: course_review_media poster uses persistedPoster([posterUrl], streamId); no routing of review-v2 into this legacy pipeline.
6. holePhotoData.ts, submitHolePhoto: posted review/member source course_hole_media contribution revalidates source poster with persistedPoster([source.posterUrl], source.streamId).
7. useCoursePlaceMedia.ts, submitCoursePlaceMedia: independently owned source contribution into course_place_media uses persistedPoster([owned.posterUrl], owned.streamId).

Audit: library-only hole/place upload writes already generate Stream thumbnails directly and accept no local poster candidate; retained unchanged. Review image-only legacy inserts do not write a poster. Metadata pollers do not write poster_url. Deletion and tagging/admin reads were not restructured.

## Every read site touched
1. holePhotoData.ts, holeMediaPoster: stored video poster through persistedPoster; stream_id supplies canonical fallback. Legacy media_url-based fallback retained behind HTTP(S) filtering when stream_id is absent. All its existing consumers receive the safety net, including reviewFeedPost/member-shot/gallery mappings.
2. useReviewMedia.ts, fetchReviewMedia: maps stored poster through persistedPoster with stream_id.
3. useReviewMediaPipeline.ts: existing database-media initialization sanitizes preview/poster. Newly added local files retain phone frames.
4. useBrowseReviews.ts, orderMedia: each embedded course_review_media poster sanitized.
5. useLatestReviews.ts, mapRow: first media poster sanitized; stream_id added to the existing embedded read and its row type.
6. useCourseReviews.ts: embedded media mapping sanitizes poster_url; stream_id added to the same read.
7. useUserCourseMoments.ts: poster sanitized; stream_id added to the same media read.
8. useReviewPageEnrichment.ts, pickReviewCardMedia: video eligibility and returned poster use persistedPoster so an invalid stored poster is missing and a Stream fallback can qualify.
9. feedMapper.ts, mapRowToFeedPost: review-sourced RPC thumbnail projection uses persistedPoster; ordinary post mapper branch unchanged.

No surface styles or layouts were changed. Broader Watch/activity post_media-specific readers were not rewritten as course_review_media readers.

## Test accounting and commands
Baseline: **9,383 tests / 837 files**, matching the prior complete copy-only run. Expected after: **9,389 tests / 838 files**, not full-suite verified. Delta: exactly six added cases in src/test/reviewVideoPoster.test.ts:
- (a) an https poster is kept as-is.
- (b) a blob: poster with a stream id becomes the Stream thumbnail URL (also asserts fetchReviewMedia read safety).
- (c) a data: poster with a stream id becomes the Stream thumbnail URL.
- (d) a blob: poster with no stream id becomes null.
- (e) the publish payload saves the Stream thumbnail, not the input blob: poster.
- (f) holeMediaPoster with a blob: poster_url and a stream id returns the Stream thumbnail.

No existing tests deleted, renamed, rewritten, or assertions changed. No count delta in existing files.

Executed once:
`bunx vitest run src/test/reviewVideoPoster.test.ts src/test/reviewUploadProgress.test.tsx src/test/reviewVideoTilePosters.test.tsx src/test/holeMediaVideos.test.tsx src/test/latestReviewsTwoReads.test.tsx src/test/userCourseMomentsReviewRead.test.tsx`

Full stdout/stderr: focused.log. Six new cases passed. Overall: 47 passed, 7 failed, 54 total; 4 files passed, 2 failed.

| Requested command | Result |
|---|---|
| bunx vitest run --shard=1/4 | Not run — stop rule |
| bunx vitest run --shard=2/4 | Not run — stop rule |
| bunx vitest run --shard=3/4 | Not run — stop rule |
| bunx vitest run --shard=4/4 | Not run — stop rule |

## Exact failures requiring a ruling (unchanged assertions)
All runner error output is retained verbatim in focused.log; failures below quote the failing assertions and runner words.

### src/test/holeMediaVideos.test.tsx — five failures
1. **34:143**, `includes encoded post video and its metadata`:
`expect(await fetchOwnMediaSources('course', 'member')).toEqual([{ url, createdAt: '2026-10-24', mediaType: 'video', streamId: source.stream_id, posterUrl: '/poster.jpg', durationSeconds: 42, width: 640, height: 480, ownerUserId: null, actorType: 'personal' }])`.
Runner: `AssertionError: expected [ { ownerUserId: null, …(9) } ] to deeply equal [ { …(10) } ]`.
Expected posterUrl `/poster.jpg`; received `https://customer-4ah4gni80ytefpck.cloudflarestream.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/thumbnails/thumbnail.jpg?height=300&fit=crop&time=1s`.

2. **41:171**, `tagged video writes its authoritative source metadata`:
`expect(f.insert).toHaveBeenCalledWith(expect.objectContaining({ hole_no: 7, media_type: 'video', media_url: url, stream_id: source.stream_id, poster_url: '/poster.jpg', duration_seconds: 42, width: 640, height: 480 }))`.
Runner: `AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ]`.
Expected poster_url `/poster.jpg`; received the same canonical URL above. Other shown source metadata remained unchanged.

3. **47:223**, `video-only hole uses poster and count one and opens the viewer with the stream — course gallery`:
`expect(tile.querySelector('img')).toHaveAttribute('src','/poster.jpg')`.
Runner: `Error: expect(element).toHaveAttribute("src", "/poster.jpg") // element.getAttribute("src") === "/poster.jpg"`.
Received canonical URL above.

4. **49:456**, `known-hole pile shows eligible video poster and duration`:
`expect(screen.getByRole('button', { name: 'Choose video' }).querySelector('img')).toHaveAttribute('src', '/poster.jpg')`.
Runner: `Error: expect(element).toHaveAttribute("src", "/poster.jpg") // element.getAttribute("src") === "/poster.jpg"`.
Received canonical URL above.

5. **50:379**, `batch uses video poster rather than manifest`:
`expect(screen.getByAltText('Current video')).toHaveAttribute('src', '/poster.jpg')`.
Runner: `Error: expect(element).toHaveAttribute("src", "/poster.jpg") // element.getAttribute("src") === "/poster.jpg"`.
Received `https://example.test/clip.m3u8`. This fixture supplies no stream id. The retained legacy media_url fallback can return a manifest unchanged; this is recorded as a remaining app issue, not repaired after the stop.

### src/test/reviewVideoTilePosters.test.tsx — two failures
6. **57:39**, `sheet video uses a Stream thumbnail and carries it into viewer opening`:
`expect(tile.querySelector('img')).toHaveAttribute('src', thumbnail)`.
Runner: `Error: expect(element).toHaveAttribute("src", "https://customer-4ah4gni80ytefpck.cloudflarestream.com/0123456789abcdef0123456789abcdef/thumbnails/thumbnail.jpg") // element.getAttribute("src") === "https://customer-4ah4gni80ytefpck.cloudflarestream.com/0123456789abcdef0123456789abcdef/thumbnails/thumbnail.jpg"`.

7. **74:39**, `Latest reviews small video tile derives the Stream thumbnail and viewer poster`:
`expect(tile.querySelector('img')).toHaveAttribute('src', thumbnail)`.
Same runner error as failure 6.

Both expect the older parameter-free thumbnail; both received `https://customer-4ah4gni80ytefpck.cloudflarestream.com/0123456789abcdef0123456789abcdef/thumbnails/thumbnail.jpg?height=300&fit=crop&time=1s`, generated by the specifically requested generateStreamThumbnailUrl(streamId) helper.

These are not assertions that a blob poster is saved. They protect relative poster paths or the earlier exact thumbnail URL. None were changed. Need Ben's ruling before any repair or further tests.

## Preview and live-flow limits
Latest harness entry: **2026-11-20T22:11:43Z — build OK**. The intermediate missing-helper-import compile state was resolved before tests. git diff --check passed.

Authenticated publication/readback is unavailable in this external_unmanaged project. The new publish test exercises the real controller payload with an already-uploaded video and a mocked server response, not a live save. Browser and physical-device verification were not run after the stop; no live repair or success is claimed.