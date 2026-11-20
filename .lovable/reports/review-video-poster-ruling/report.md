# Review video poster ruling — combined suite PASS

## Result
Applied Ben's ruling in app code. Relative and remote stored posters are preserved; case-insensitive `blob:`, `data:`, `file:`, `capacitor:` and `filesystem:` posters are rejected. All nine database readers filter stored values only and preserve their original fallback ownership. All seven poster write sites retain their existing `persistedPoster` calls.

All four shards ran once, sequentially, as separate commands. **9,390 / 9,390 tests passed across 838 files**, zero failures, skips or test deletions. This verifies both the poster work and the preceding scores-below build (`b324dfa264`).

No SQL, migrations, feed_config, round_pool_cap, layout, style, local new-media preview or legacy manifest fallback changes.

## Files changed in this ruling
Application:
- `src/features/review-v2/lib/persistedPoster.ts`: add `isLocalPoster` and `usablePoster`; first usable candidate wins, otherwise existing write-side Stream fallback. Ownership header distinguishes stored-value filtering from write-side fallback.
- `src/lib/courseMedia/holePhotoData.ts`.
- `src/components/posts/useReviewMedia.ts`.
- `src/components/explore-tab-new/courseled/hooks/useLatestReviews.ts`.
- `src/components/courses/useBrowseReviews.ts`.
- `src/hooks/useCourseReviews.ts`.
- `src/hooks/useUserCourseMoments.ts`.
- `src/features/explore-magazine/useReviewPageEnrichment.ts`.
- `src/components/media-system/utils/feedMapper.ts`.
- `src/features/review-v2/hooks/useReviewMediaPipeline.ts`.

Tests/support: `src/test/reviewVideoPoster.test.ts`, `roadmap.md`, this report, `shard-1.log`, `shard-2.log`, `shard-3.log`, `shard-4.log`.

Root AGENTS.md is unchanged: its protected budget has only 25 bytes available; module-local ownership is recorded in the helper header.

## Every read site and stream_id audit
| Reader | Change / restored fallback | stream_id disposition |
|---|---|---|
| holeMediaPoster | `usablePoster(media.poster_url) || streamPosterFrom(buildHlsUrl(media.stream_id || media.media_url) || media.media_url) || ''` for video; image unchanged | Existing field kept; read by the original HLS fallback. No select/type addition in 19ecc4a. |
| fetchReviewMedia | `usablePoster(m.poster_url)` only; consumer owns thumbnail fallback | Pre-existing select/type kept; returned as `streamId` for consumers. |
| useLatestReviews / mapRow | `usablePoster(media?.poster_url)` only | Reverted both 19ecc4a additions: embedded select's `stream_id` and Row's `stream_id?: string | null`; no remaining read. |
| useBrowseReviews / orderMedia | `usablePoster(m.poster_url)` only | Pre-existing select/type kept; mapped to media item's `streamId`. |
| useCourseReviews | `usablePoster(m.poster_url)` only | Reverted 19ecc4a select addition `stream_id`; no remaining read. No row-type addition existed. |
| useUserCourseMoments | `usablePoster(media.poster_url) ?? undefined` | Reverted 19ecc4a select addition `stream_id`; no remaining read. No row-type addition existed. |
| useReviewPageEnrichment / pickReviewCardMedia | Video qualification and returned poster use `usablePoster`; no manufactured poster qualifies a video | Pre-existing select/type kept; selected video returns `streamId`. |
| feedMapper / mapRowToFeedPost | Review thumbnail is `usablePoster(row.poster_url) || (streamId ? buildThumbnailUrl(streamId) : undefined)`; ordinary post branch unchanged | Pre-existing RPC/type kept; used by HLS, original thumbnail fallback and returned media identity. |
| useReviewMediaPipeline database initialization | `previewUrl: usablePoster(m.poster_url) ?? m.media_url`; `posterUrl: usablePoster(m.poster_url)` | Pre-existing field kept; mapped to item `streamId`. No added select/type in 19ecc4a. |

**All stream_id select/type additions in 19ecc4a were reverted:** useLatestReviews (select and Row type), useCourseReviews (select), useUserCourseMoments (select). None of those additions were kept. Existing identities remain in the other six readers.

The original no-stream-id `media_url` manifest fallback remains exactly in place and is not filtered or redesigned.

## Seven write sites preserved
No call-site changes to:
1. reviewUploadController / uploadAndPublishReview publish payload.
2. useReviewMediaPipeline / insertMediaRow.
3. useReviewMediaPipeline / uploadOne legacy video insert.
4. composerHolePhotos / writeComposerHolePhoto.
5. uploadPipeline legacy review-media insert.
6. holePhotoData / submitHolePhoto.
7. useCoursePlaceMedia / submitCoursePlaceMedia.

Only the shared helper's candidate validation changes their behavior, as authorized.

## Authorized new-file assertions — old → new
`src/test/reviewVideoPoster.test.ts`: **6 → 7 cases**. Cases (a)–(f) retain their names. No other tests changed in this ruling.

- Case (b): `expect((await fetchReviewMedia('review'))[0]?.posterUrl).toBe(thumbnail)` → `expect((await fetchReviewMedia('review'))[0]?.posterUrl).toBeNull()`.
  Why: the reader filters the blob stored value; its consumer derives the fallback, while the separate persistedPoster assertion still expects the write-side thumbnail.
- Case (f): `expect(holeMediaPoster({ media_type: 'video', media_url: generateStreamHlsUrl(streamId), poster_url: 'blob:https://clbhouz.co.uk/preview', stream_id: streamId })).toBe(thumbnail)` → same call with `.toBe(generateStreamHlsUrl(streamId).replace('/manifest/video.m3u8', '/thumbnails/thumbnail.jpg'))`.
  Why: restores the original parameter-free `streamPosterFrom` URL, not the write helper's `?height=300&fit=crop&time=1s` URL.
- Added case **(g) persistedPoster keeps a relative /poster.jpg**: no previous assertion → `expect(persistedPoster(['/poster.jpg'], streamId)).toBe('/poster.jpg')`.
  Why: explicitly authorized relative-poster regression; preserves the stored path despite a Stream id.

All seven stopped assertions in `holeMediaVideos.test.tsx` (five) and `reviewVideoTilePosters.test.tsx` (two) remain byte-unchanged and pass. No test deleted, renamed or otherwise rewritten.

## Sequential full-suite commands and totals
Every command retained complete stdout/stderr in its corresponding log, with no output suppression inside the saved log. Non-failing existing jsdom CSS and React/i18next warnings remain recorded.

| Command | Test files passed | Tests passed | Failed | Full output |
|---|---:|---:|---:|---|
| `bunx vitest run --shard=1/4` | 210 | 2,297 | 0 | shard-1.log |
| `bunx vitest run --shard=2/4` | 210 | 2,287 | 0 | shard-2.log |
| `bunx vitest run --shard=3/4` | 210 | 2,352 | 0 | shard-3.log |
| `bunx vitest run --shard=4/4` | 208 | 2,454 | 0 | shard-4.log |
| **Full suite** | **838** | **9,390** | **0** | All four logs |

Protected/combined file results within the shards:
- holeMediaVideos: 16/16; reviewVideoTilePosters: 5/5 — all seven prior failures cleared unchanged.
- reviewVideoPoster: 7/7.
- reviewGridScores: 7/7; reviewPlayedWith: 23/23; feedReviewGlass: 10/10; canonicalFullscreenViewer: 13/13; fullscreenViewerRedesign: 10/10 — preceding scores-below focused scope passes in the full suite.

## Inventory reconciliation
- Last full verified baseline: **9,383 / 837 files**.
- Original poster build 19ecc4a: **+6 cases** in reviewVideoPoster: (a) HTTPS kept; (b) blob + Stream write fallback and read safety; (c) data + Stream write fallback; (d) blob without Stream yields null; (e) publish payload sanitization; (f) hole poster sanitization. Expected inventory then **9,389 / 838 files**.
- Scores-below build b324dfa264: **+0 / −0 cases**, six authorized case renames and assertions recorded individually in `.lovable/reports/review-scores-below/report.md`; this ruling changes none of them.
- This ruling: **+1 case (g)** in reviewVideoPoster, **−0 cases**, **0 renames**; two authorized assertion replacements above have zero count delta.
- Final verified: **9,383 + 6 + 0 + 1 = 9,390 / 838 files**. Before this ruling 9,389; after 9,390. No unexplained delta.

## Preview and end-to-end limits
Latest harness log: **2026-11-20T22:32:03Z — build OK**. `git diff --check` clean; no manual builds or typechecks run.

Authenticated live publication/readback remains unavailable (`external_unmanaged`); no hosted data repair, phone check or real-session save/readback is claimed. The full suite exercises the actual publish controller with mocked service responses and the actual reader/consumer paths. This ruling makes no presentation changes; prior scores-below 320/390 screenshots and browser findings remain in that build's report, not represented as a fresh live-feed check.