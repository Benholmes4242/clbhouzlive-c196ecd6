# Post Composer — Media-First Rebuild (Part 2)

## Goal
Rebuild the post composer so media is the screen and the chrome floats over it. The bottom-nav Share item opens the OS picker immediately; cancelling still lands in a caption-first composer. Course tagging, actor selection, scheduling and drafts move to chips/avatar/dots on a dark canvas.

## What changes

### 1. Entry point — nav owns the picker
- `src/components/GlobalBottomNavigation.tsx`: replace the `post` tab's "open CreateSheetV2" path with a hidden `<input type="file" accept="image/*,video/*" multiple>` rendered by the nav. On the (+) tap call `input.click()` synchronously from the click handler, then open the composer with the chosen files.
- Cancelling the picker (no files) still opens the composer via `openPostStudio({ returnPath })` so there is no dead tap.
- `CreateSheetV2` is kept for the "Course review" path only; the Post option is removed from it.

### 2. Composer tokens go dark
- `src/features/_shared/composerTokens.ts`: add a `CT_DARK` export with the brief's values (`bg #0B0F14`, `surface #15171F`, `elev #1B222B`, `line rgba(248,250,252,0.09)`, `ink #F8FAFC`, `mute rgba(248,250,252,0.60)`, `dim rgba(248,250,252,0.34)`, `amber #F7931E`). Existing `CT` is untouched so review-v2 stays light.

### 3. StageComposer layout rebuild
- Header: close/back circular button, "New post", actor name on the right.
- Media stage: full-width, fixed 4/5 aspect, page counter when >1 item.
- FramePills moved between stage and filmstrip.
- Filmstrip: 46px thumbnails, active amber ring, trailing "+" tile that re-opens the picker.
- Caption: bare textarea on the dark canvas, placeholder "Say something about it", expands up to 4 lines while keeping the photo visible.
- Glass course chip docked bottom-left of the slide.
- Edit chip (AdjustSheet) top-right of slide; video Cover/Original chips stay.
- Bottom bar: actor avatar (opens ActorSheet), dots menu (schedule + drafts), full-width amber Share/Post pill.
- DETAILS panel and chevron rows removed.

### 4. Components touched / reused
- `src/features/post-v2/StageComposer.tsx` — main shell rebuilt.
- `src/features/post-v2/components/MediaStageV2.tsx` — fixed 4:5 stage, page counter, dark letterbox.
- `src/features/post-v2/components/MediaTray.tsx` — 46px filmstrip with dashed add tile and long-press-drag reorder.
- `src/features/post-v2/components/CaptionField.tsx` — bare expanding textarea on dark canvas.
- `src/features/post-v2/components/FramePills.tsx` — moved between stage and filmstrip; dark styling.
- `src/features/post-v2/components/DetailRows.tsx` — deleted (functionality moved to chips/dots).
- `src/features/post-v2/components/PostEmptyStage.tsx` — deleted; replaced by a minimal dark empty state with "Add photos or video" CTA.
- `src/features/post-v2/components/CreateSheetV2.tsx` — remove Post option, keep Course review.
- Existing sheets (`CourseTagSheet`, `ActorSheet`, `ScheduleSheetV2`, `DraftsSheetV2`, `ScheduledPostsSheetV2`, `AdjustSheet`, `CoverFrameSheet`) keep their current behaviour and props.

### 5. State / orchestration unchanged
- `useStageComposer`, `usePostSubmit`, `postUploadController`, analytics events, dirty close guard and submit gate stay as-is.
- `GlobalPostComposer.tsx` passes initial media from the store into `StageComposer`.

## Acceptance
- `#[0-9A-Fa-f]{6}` in `src/features/post-v2/` returns nothing.
- `fontWeight: [0-4][0-9][0-9]` in `src/features/post-v2/` returns nothing.
- `git diff -- src/features/review-v2/` is empty.
- TypeScript build passes.

## Risks / notes
- The OS picker must be triggered synchronously from the nav tap to satisfy iOS WKWebView user-activation rules.
- Long-press-drag reorder may be flaky in WebView; brief allows fallback to tap-to-promote if needed. I will implement long-press-drag and report.
- Device-only cases (picker timing, background upload survival) cannot be verified in the sandbox; they will be flagged for QA.
