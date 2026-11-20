# Fullscreen stack and white review upload progress — STOPPED

## Files changed
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx`: passes `reserve={likeState.count > 0}`; also omits the enclosing likers wrapper at zero, so Full review is genuinely the last stack child and no empty trailing wrapper remains. Positive likes retain the existing row and reserve. `stackBottom`, feed usages, media and playback unchanged.
- `src/index.css`: `--review-upload-amber: #F7931E` → `--review-upload-fill: #F8FAFC`; ring stroke and batch-bar background now consume the fill token. Track/tick/failure/dictation untouched. Production-source grep finds no retired amber token.
- `src/test/fullscreenStackAndUploadWhite.test.tsx`: three requested cases added.
- `roadmap.md`: records this stop.
- This report and full logs in this directory.

## Test changes and inventory
No existing test deleted, renamed, rewritten or assertion changed; therefore no existing assertion old → new entries. Existing feed and standalone reserve tests remain unchanged. The existing fullscreen source-reserve regex in likedByCollapse also remains unchanged and passes (it matches the conditional reserve).

Added cases:
1. `(a) a zero-like review has no reserve and Full review is the last stack child`: asserts absent `[data-liked-by-reserve]` and `[data-liked-by-row]`, and last child identity against `[data-full-review]` (not translated words).
2. `(b) a post with three likes keeps the real LikedByRow while avatars load`: asserts present `[data-liked-by-row]` and conditional reserve in source. The populated LikedByRow uses this attribute; `[data-liked-by-reserve]` is the empty-state-only marker, not the populated row. No shared marker behavior changed.
3. `(c) the white fill token owns both upload progress fills and retires amber`: asserts #F8FAFC token, both consumers, and absent retired token in index.css.

Last verified complete suite: **9,352** (c1fc4b3ca7). This request: **9,352 → expected 9,355**, solely +3 cases in fullscreenStackAndUploadWhite.test.tsx. No verified new full-suite total.

## Exact commands and per-shard totals
Each executed command retained full stdout/stderr; no reruns.

| Command | Executed | Passed | Failed | Files | Full output |
|---|---:|---:|---:|---:|---|
| `bunx vitest run src/test/fullscreenStackAndUploadWhite.test.tsx src/test/likedByCollapse.test.tsx src/test/cb56LikedByReserve.test.tsx src/test/reviewUploadProgress.test.tsx` | 35 | 35 | 0 | 4 | focused.log |
| `bunx vitest run --shard=1/4` | 2,293 | 2,289 | 4 | 209 | shard-1.log |
| `bunx vitest run --shard=2/4` | Not run | — | — | — | Stopped per brief |
| `bunx vitest run --shard=3/4` | Not run | — | — | — | Stopped per brief |
| `bunx vitest run --shard=4/4` | Not run | — | — | — | Stopped per brief |

## Unexpected failures — untouched
1. `src/test/activeRing.test.tsx:202:30`, `WhoToFollowRail > a card without media keeps its figures and its avatar opens the post, not the profile`:
   `TestingLibraryElementError: Unable to find role="button" and name "Open Danny Holmes's latest post"`
2. `src/test/activeRing.test.tsx:210:18`, `WhoToFollowRail > a card without activity shows figures and a large avatar without an avatar button`:
   `TestingLibraryElementError: Unable to find role="button" and name "Open Danny Holmes's latest post"`
3. `src/test/memberShotPosts.test.ts:155:81`, `syntheticPosts gates for synthetic post ids (BRIEF_SYNTHETIC_SHOT_GATES) > synthetic fullscreen slides never mount the post_views tracker or post-keyed likers`:
   `AssertionError: expected '/**\n * ImmersiveFullscreenChrome — p…' to contain '{!syntheticPosts && <div style={{ poi…'`
   Exact expected string: `{!syntheticPosts && <div style={{ pointerEvents:`. The added positive-count wrapper condition changes this source substring; the synthetic gate remains intact. No source/test repair after failure.
4. `src/test/ms1MessagesHeadToHead.test.tsx:405:3`, `ThreadV2Page header > names the member at 17px with "{count} rounds together · last {d MMM}" under it`:
   `Error: Test timed out in 15000ms.`
   `If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".`

## Surviving harness errors — also reported, not repaired
Harness entry `2026-11-20T19:24:00Z`:
```text
src/test/fullscreenStackAndUploadWhite.test.tsx(27,48): error TS2353: Object literal may only specify known properties, and 'url' does not exist in type 'MediaItem'.
src/test/fullscreenStackAndUploadWhite.test.tsx(41,52): error TS2739: Type '{ rating: number; courseId: string; courseName: string; }' is missing the following properties from type 'ReviewData': reviewId, courseImageUrl
```
These are errors in the new test fixtures despite Vitest passing them; no successful build claimed. No manual build/typecheck. Following the stop instruction, no failed-test repairs or subsequent shards were attempted. Browser/device 14px comparison and authenticated end-to-end flow remain unverified. No SQL, migrations, feed_config, pool-cap, shared architecture or unrelated application changes.