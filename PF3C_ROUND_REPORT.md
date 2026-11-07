# PF3C_ROUND — round videos close-out

## Summary
PF3C adds round-bound hole chapters, description pre-marks, a pinned Mark the holes page, composer chapter scores and a default-on following-scorecard switch. Round videos use a playback-following score chip and an About scorecard grid. Marks/details save best-effort after the attached-round post patch; mismatched drafts and changed/removed rounds clear their marks. Scores come from attached-round context and shared hole shapes, never stored in video chapters.

Original focused suite **198/198**. Original four fresh shards **1,973 / 1,810 / 1,942 / 1,877**, **zero failures**, total **7,602 tests/663 files**. At320px, all four requested actual-component surfaces fit in9- and18-hole fixtures with no horizontal overflow. Device/publication integration checks remain with Ben.

This close-out changed only `PF3C_ROUND_REPORT.md` and the PF3C task status in `roadmap.md`. No production or test changes, no SQL/migrations, no server/deployed RPC/edge-function changes, no guest/review/news/round-plot changes, no feed_config/cap/native/Median changes. Temporary browser files remain under `/tmp/browser/pf3c`, outside the app.

## PF3C implementation files
New:
- `src/features/post-v2/components/video/MarkHolesPage.tsx` — local-video marking/seek/select/move/clear page; Back/Done retain marks.
- `src/features/post-v2/components/video/RoundVideoFields.tsx` — round chapter preview, score figures and following switch.
- `src/features/post-v2/components/video/roundVideoCreator.css` — opt-in round composer/marking geometry.
- `src/features/video-details/roundVideoModel.ts` — canonical round/chapter score resolution.
- `src/features/video-details/RoundVideoScore.tsx` — following chip and About scorecard grid.
- `src/features/video-details/round-video.css` — round viewer geometry and score tones.
- Three PF3C test files listed below.

Extended:
- `src/features/post-v2/lib/videoDetails.ts` — round-bound marks, spacing/order validation, pre-mark parsing, chapters and draft restoration fields.
- `src/features/post-v2/hooks/useStageComposer.ts` — preserve matching marks; clear on round/course changes.
- `src/features/post-v2/components/video/VideoComposerFields.tsx` — opt-in round chapters while preserving ordinary video fields.
- `src/features/post-v2/StageComposer.tsx` — own-round eligibility/context, pre-marks, Mark-page handoff and submit round length.
- `src/features/post-v2/lib/videoDetailsWrites.ts` — score_follows plus validated hole chapters, non-blocking.
- `src/features/post-v2/hooks/usePostSubmit.ts` — attached-round patch precedes details/chapters.
- `src/features/video-details/videoDetailsModel.ts` — live hole-chapter/score-follow normalization and canonical chapter selection.
- `src/features/video-details/VideoAboutSheet.tsx` — optional round grid first, scored hole chapters, Show all and scorecard handoff.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` — shared round-hole-shapes collection/passing.
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx` — round chapter/chip/About integration and shared scorecard callback.
- `src/components/feed/FeedCard.tsx` — attached-round-aware canonical chapter selection.
- `src/index.css` — round-video semantic paint tokens.
- `roadmap.md` and the PF3C plan/spec records — implementation tracking.

The existing generic `video_data` draft carrier accommodates the new fields; no new persistence schema or migration was introduced. This inventory describes PF3C feature ownership from the implementation/source evidence, not unrelated changes made by later W1 or tight-chip work.

## Test counts
| New file | Executed cases in original logs |
|---|---:|
| `src/test/pf3cRoundRules.test.ts` |30|
| `src/test/pf3cRoundUi.test.tsx` |21|
| `src/test/pf3cRoundWrites.test.tsx` |13|
| **Total added** |**64**|

The rules file has parameterized cases: count30 is the runner's executed count, not the number of `it` declarations. Coverage includes ten-second boundaries and nine-hole lengths, all four premark forms, timestamp fallback, mismatched draft rules, chip scores/tones/Intro/off states, grid seeking/disabled holes/expansion, marking interactions, default switch and submit ordering/failure handling.

Baseline PF3B **7,538 tests/660 files** → original PF3C **7,602/663**, **+64 tests/+3 files**, reconciled by the three files above. No existing tests deleted, renamed or rewritten for PF3C; no assertions changed in this close-out.

The later W1 run7,607/664 added five cases/one file independently. The later tight-chip work expects another three cases/one file but stopped on its own focused flex assertion. Neither is part of the original PF3C totals, and neither was silently repaired or rerun here.

## Original commands and results
Focused198passed/14files, retained `/tmp/pf3c/focused.log`.

Each original shard ran separately:
| Command | Passed tests | Passed files |
|---|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` |1,973|166|
| `bunx vitest run --maxWorkers=2 --shard=2/4` |1,810|166|
| `bunx vitest run --maxWorkers=2 --shard=3/4` |1,942|166|
| `bunx vitest run --maxWorkers=2 --shard=4/4` |1,877|165|
| **Total** |**7,602**|**663**|

Read back from `/tmp/pf3c/shard1.log` through `shard4.log`, originally run18:07–18:25UTC on7November2026. No test rerun was requested/performed in this report-only close-out. No failures in the original run: the named pre-existing `profileCoursesRecord.test.tsx:76` and `tourIsland.test.tsx:235` did not recur.

## 320px browser results
Real React components bundled temporarily with the app's CSS and JSX mode, served through Playwright's request interception on localhost. Viewport **320×844**, Chromium, no sign-in, no guest mint, no authenticated reads or writes. Used existing component-test-shaped inputs with **9 and18 holes**, six marked holes and shared canonical scoring functions. Providers: real MemoryRouter/QueryClientProvider; no production file edits.

| Requested view | Result in both9/18-hole fixtures |
|---|---|
| Mark the holes | **No horizontal overflow**: root client/scroll width320/320; selected first-hole row with Clear also fits, client/scroll286/286 and right edge303px. Header/player controls/action/Done remain within screen. List scrolls vertically. |
| Following scorecard chip | **No overflow**: measured chip90.30px wide, content client/scroll88/88; sixth-hole “6TH · PAR 4”, score and through-total fit. |
| About sheet scorecard grid | **No overflow**: About client/scroll320/320; correct9 or18 equal columns; active outline and dim unmarked cells visible. Show all expanded all7chapter rows within screen. |
| Composer round chapters | **No overflow**: client/scroll320/320; Intro + first4holes, +2more door, matched header and default-on switch visible; supporting text wraps inside its column. |

Measured every descendant of each surface for bounding boxes outside the0–320px screen: **none**. Final browser run recorded **zero page errors**. Screenshots reviewed for all four18-hole surfaces;9-hole variants also rendered/measured and captured. Evidence: `/tmp/browser/pf3c/results.json`, `browser.log`, screenshot files, `render.tsx`, `check.py`.

Harness-only setup initially needed app build constants and automatic JSX; those were supplied in the temporary bundle, never in production. Fixture video deliberately had no actual media response, so the player controls/geometry rendered but **decoding, real video aspect-ratio settlement and playback are not verified**. The chip was rendered under a fixture top-bar anchor, not the full live fullscreen chrome. No claim of native notch positioning or complete composer/viewer lifecycle verification is made.

## Brief checks1–5 / Ben's device
1. **Partial component evidence; Ben still needed.** Mark/select/move/clear and chapter preview are covered by original tests and320px rendering. Real own-round attach→mark4holes→publish→readback is not run. Ben confirms chapter/detail rows himself; no SQL was run here.
2. **Ben device needed.** Chip score calculation and sheet seek/close callbacks have tests. Live playback crossing marks, actual seek, fullscreen safe-area placement and nested scorecard return need device verification.
3. **Test-covered; device confirmation remains.** Switch-off keeps canonical hole chapters and hides chip/Scorecard in original cases; real saved switch-off playback/readback not verified.
4. **Test-covered; device confirmation remains.** Matching/mismatched drafts and round changes clear marks in hook tests. Actual composer removal and timestamp fallback after live save/restore still need Ben.
5. **Completed for the four requested component surfaces at320px**,9/18holes, no overflow. Ben still checks real-media/native fullscreen and full-composer integration on device; fixture checks do not replace those.

PF3A/PF3B preservation is supported by the original focused/full suites, not by a newly performed live publishing flow. Potential integration areas—feed-specific scorecard handoff, asynchronous context/draft settlement and nested-sheet lifecycle—remain device verification, not silently claimed complete.