# PREVIEW_FIX_2_CLOSE — verification report

## 1. Shard 3 re-run (after the play-button grid fix)

Command: `bunx vitest run --shard=3/4 --maxWorkers=2`

- **161 test files passed, 1,876 tests passed, 0 failures** (duration 234.8s).
- The earlier `fixOverflowSource.test.ts` failure (play button's inline grid lacking declared columns) does not recur — the `gridTemplateColumns: 'minmax(0, 1fr)'` fix holds end-to-end.
- Known pre-existing failures named by the brief: `tourIsland.test.tsx:235` did **not** appear in this shard; the three FS_NOTCH failures did **not** appear. No new failures. No STOP condition triggered.

## 2. Playwright WebKit diagnosis (390×844) — BLOCKED BY ENVIRONMENT, not by code

Setup succeeded: Playwright WebKit 26.4 launches; real clips generated with ffmpeg (`test.mp4` H.264/AAC, `test.mov` HEVC hvc1); the composer route `/post-v2` loads signed-out and its own library file input accepts the upload (tile appears in the draft).

**Blocker:** the Preview button never enables. `canSubmit = !submitting && !saving && hasContent && !!activeActor` (StageComposer.tsx:535). Signed-out, `activeActor` (useComposerActor → useActiveActor) stays null: there is no signed-in profile, and the guest-mint guard (FIX Guest logins) deliberately blocks automated browsers (WebDriver/HeadlessChrome) from minting a guest. Probed for 18s after upload: Preview and Share both remain `disabled`, no `<video>` element mounts. This is the guard working as designed, not a regression from PREVIEW_FIX_2.

Auth status is `external_unmanaged`: no session can be minted or injected for this project, so the composer's own-file-input diagnosis (mp4/HEVC playback, loadeddata, play() resolution, tap-to-play button, swipe pause/resume) cannot be executed in this sandbox.

**What is verified instead:** the LocalBlobVideo hardening (imperative `muted`/`defaultMuted`/`playsInline` priming, `load()` on source change, `canplay` retry, 2000ms tap-to-play fallback) is covered by `src/test/previewFix2.test.tsx` (10 tests) and the focused preview/composer suite (23/23) from the original build, all still green in shard 3.

## 3. Browser checks (taps, back, share footer, 320×568) — BLOCKED

Same cause: the preview cannot be opened without an actor, so in-preview tap isolation, back-navigation, footer share and the 320×568 pinned-footer layout could not be exercised in a live browser. These remain covered by the jsdom tests (`previewFix2.test.tsx`, composer footer tests).

## 4. Feed / profile video / fullscreen viewer — BLOCKED

Signed-out, `/` and `/clubhouse` redirect to `/auth`; `/index` renders with zero `<video>` elements. No public route plays video, so the "still plays exactly as before" confirmation could not be done in a browser. No code in the shared engine/feed/fullscreen paths was touched by PREVIEW_FIX_2 (changes were scoped to `PostPreview.tsx`, the `LocalBlobVideo` branch of `InlineVideo.tsx`, and the shared `ShareFooter.tsx`), so there is no code path by which those surfaces could have changed.

## Code changes in this close-out

None. No check that could run failed; the blocked checks are environment limits (external unmanaged auth + the by-design guest-mint block for automated browsers), not code failures.

## Standing prohibitions

No SQL, no migrations, no RPC/edge-function changes, `feed_config` untouched, `round_pool_cap` still 30, no native/Median changes. Guest browsing, review wizard, news and round plots untouched.

## Pre-existing failures named

- `tourIsland.test.tsx:235` width assertion — known pre-existing; did not appear in shard 3.
- Three FS_NOTCH failures (`fsNotch1.test.tsx:37`, `fullscreenBand.test.ts:65`, `:75`) — known; did not appear in shard 3.
