# Course Media fullscreen shot selection

## Changes
- `src/components/course-media-tab/hooks/useCourseGallery.ts`: missing/empty start ids cannot match absent tags; resolution remains id → canonical key → hole → first shot. Opening publishes the selected media index synchronously. Hydration preserves the opening media id until the pager changes position, then preserves the swiped shot. Per-hook sequence and exact options-object ownership reject late builds from earlier opens, including a remounted hook.
- `src/components/course-media-tab/CourseMediaTabNew.tsx`: Everything passes the tapped item's canonical `holeMediaKey` as an additional start fallback.
- `src/test/courseGalleryOpening.test.tsx`: ten new regression cases, using the real fullscreen store and QueryClient provider; only source reads and origin/borrowing setup are isolated.
- `AGENTS.md`: points gallery opening/hydration ownership to the hook header.
- `roadmap.md`: records this request and completion.
- `COURSE_MEDIA_FULLSCREEN_REPORT.md`: this report.

## Identity audit
`CourseMediaCanonGrid.tsx:252,280,304` passes `posts[i]` to FeedCard; `feed-cards/FeedCard.tsx:169` emits that exact feedPost. Tile keys and start ids use its first media item's id. `courseGallery.ts:32-39` gives each GalleryShot that item's id and deduplicates on canonical identity. Page-only tags may use tag-row ids whereas the completed build may retain feed-item ids; tag-id matching remains supported, and Everything now also supplies the canonical key. Stream ids survive page extras and canonical matching. Member hole/place sources join by the same key. No separate admin fullscreen grid identity mismatch was found; admin tagging remains untouched.

## Verification
Focused command:
`bunx vitest run src/test/courseGalleryOpening.test.tsx src/test/courseGalleryPrefetch.test.tsx src/test/courseGallery.test.tsx --maxWorkers=2`

Result: **60/60 tests across 3 files**, including all ten new cases. Existing cases and assertions were not edited, deleted or renamed.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, for N = 1, 2, 3, 4.

| Shard | Files | Passed tests | Exit |
|---|---:|---:|---:|
| 1/4 | 136 | 1,481 | 0 |
| 2/4 | 136 | 1,433 | 0 |
| 3/4 | 136 | 1,485 | 0 |
| 4/4 | 135 | 1,512 | 0 |
| Total | **543** | **5,911** | **All clean** |

Baseline: last reported clean full suite **5,901 / 542 files**, confirmed by PROFILE_CLEANUP_V1_REPORT.md's final V1.3 section. After: **5,911 / 543 files**. Entire delta: ten added cases in the new `courseGalleryOpening.test.tsx`; no other test inventory changes. No pre-existing failures, new failures or unhandled errors observed.

New cases: undefined id/hole 16; undefined/empty id default; hole-tag id; place-tag id; canonical Stream key; hole 9→16→17 positions; Everything A→B; changed-tag cold hydration before pager publication; swipe preservation; A's build resolving after B's newer open.

Full output retained at `/tmp/course-gallery-focused.log` and `/tmp/course-gallery-shard1.log` through `shard4.log`.

The automatic preview verification reports `build OK` at 2026-11-02T18:26:21Z. Manual typechecks/builds were not invoked because the environment requires those checks to run through its automatic harness; a separate standalone typecheck result is therefore not claimed.

## Limits and protected scope
The reported authenticated Yas Links device flow could not be exercised here: authentication availability is `external_unmanaged`. Real-store regression checks establish shot/index behavior, but no device or authenticated browser readback is claimed.

No SQL, migrations, RPC/edge-function edits, feed_config changes, round_pool_cap changes, native/Median changes, guest browsing, review wizard, news or round-plot edits.