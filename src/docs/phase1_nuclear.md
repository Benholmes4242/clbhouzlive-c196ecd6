# Phase 1A: Nuclear Removal — Nuke + Disconnect Only

## Overview

Two operations in this brief:
1. **NUKE** — Delete all legacy media engine files and Phase 5 fullscreen player files from the codebase
2. **DISCONNECT** — Remove all imports/references to deleted files so the app compiles cleanly

**No integration in this brief.** After this is done, the Clubhouse page will render without a feed (blank area where the grid was). That's expected — integration comes in a separate brief after we verify the codebase is clean.

**Critical rule:** Every file deletion must be preceded by removing all imports of that file elsewhere. The app must compile after every step.

---

# SECTION 1: NUKE — File Deletions

## Step 1A: Delete Legacy Clubhouse Media Engine

These files are ONLY used by `ClubhouseVerticalGrid` and have zero non-legacy consumers:

| # | File to Delete | Reason |
|---|---|---|
| 1 | `src/components/grid/ClubhouseVerticalGrid.tsx` | Legacy feed renderer — replaced by new media player |
| 2 | `src/components/grid/hooks/useVerticalFeedLogic.ts` | Snap-scroll + IO logic — only used by ClubhouseVerticalGrid |
| 3 | `src/hooks/useClubhouseRuntimeBridge.ts` | Runtime bridge — only used by ClubhouseVerticalGrid |
| 4 | `src/hooks/useSoftResume.ts` | Audio ramp — only used by ClubhouseVerticalGrid |
| 5 | `src/hooks/useInfiniteFollowedPosts.tsx` | Legacy "For You" feed hook — only used by Clubhouse.tsx, replaced by `useSuggestedFeed` |
| 6 | `src/hooks/useClubhouseFriendsShorts.ts` | Legacy "Friends" feed hook — only used by Clubhouse.tsx, replaced by `useFriendsFeed` |
| 7 | `src/utils/clubhouseVideoPrefetch.ts` | Clubhouse-specific prefetch query — verify no other imports first, then delete |
| 8 | `src/components/clubhouse/SheetPlaybackContext.tsx` | Sheet playback coordination — verify no other imports first, then delete |

**Before deleting each file:** Search the entire codebase for imports of that file. If ANY non-legacy file imports it, do NOT delete — leave it and note it as "kept due to external dependency."

## Step 1B: Delete Phase 5 Fullscreen Player System

The Phase 5 fullscreen player and all its supporting files:

| # | File to Delete | Reason |
|---|---|---|
| 9 | `src/media/fullscreen/FullscreenMediaViewer.tsx` | Phase 5 fullscreen — being replaced |
| 10 | `src/media/fullscreen/FullscreenNavigation.tsx` | Phase 5 snap-scroll navigation |
| 11 | `src/media/fullscreen/FullscreenMediaItem.tsx` | Phase 5 single item renderer |
| 12 | `src/media/fullscreen/FullscreenOverlay.tsx` | Phase 5 overlay (action rail, creator) |
| 13 | `src/media/fullscreen/FullscreenControls.tsx` | Phase 5 play/mute controls |
| 14 | `src/media/fullscreen/FullscreenComments.tsx` | Phase 5 comments integration |
| 15 | `src/media/fullscreen/MediaCarousel.tsx` | Phase 5 horizontal media carousel |
| 16 | `src/media/fullscreen/PostOptionsMenu.tsx` | Phase 5 three-dot menu |
| 17 | `src/media/fullscreen/index.ts` | Phase 5 re-exports |
| 18 | `src/media/fullscreenAdapters.ts` | Phase 5 data adapters |
| 19 | `src/media/hooks/useFullscreenViewer.ts` | Phase 5 viewer state |
| 20 | `src/media/hooks/useSwipeNavigation.ts` | Phase 5 swipe gesture handling |

## Step 1C: Delete Fullscreen Player Context + Launch Hook

| # | File to Delete | Reason |
|---|---|---|
| 21 | `src/contexts/FullscreenPlayerContext.tsx` | Context provider for Phase 5 fullscreen — no longer needed |
| 22 | `src/hooks/useUnifiedFullscreen.ts` | Launch hook used by 21+ surfaces — being removed |
| 23 | `src/hooks/useUnifiedFullscreenLogic.ts` | Extracted fullscreen logic — verify imports, then delete |

## Step 1D: Delete Legacy Fullscreen Viewer

| # | File to Delete | Reason |
|---|---|---|
| 24 | `src/media/MediaFullscreenViewer.tsx` | Pre-Phase-5 legacy fullscreen — already superseded |

## Step 1E: Delete Grid Directory Cleanup

After deleting `ClubhouseVerticalGrid.tsx`:

| # | File to Check | Action |
|---|---|---|
| 25 | `src/components/grid/index.ts` | If this only re-exports `ClubhouseVerticalGrid`, delete the entire file. If it exports other things, remove only the ClubhouseVerticalGrid export. |
| 26 | `src/components/grid/hooks/` directory | If empty after deleting `useVerticalFeedLogic.ts`, delete the directory |
| 27 | `src/components/grid/` directory | If empty after above, delete the directory |

---

# SECTION 2: DISCONNECT — Remove All References

After deleting files, every import of those files elsewhere will cause compilation errors. Fix them ALL.

## Step 2A: Fix `src/pages/Clubhouse.tsx`

This is the biggest change. Remove:
- `import ClubhouseVerticalGrid from ...`
- `import { useInfiniteClubhouseShorts } from ...` (or equivalent)
- `import { useClubhouseFriendsShorts } from ...` (or equivalent)
- `import { HLSPoolManager } from ...` (if imported for keep-alive)
- The `<ClubhouseVerticalGrid ... />` render and all its props
- Any `useEffect` for HLSPoolManager keep-alive
- Any state/refs that only served `ClubhouseVerticalGrid` (e.g., `onActiveVideoRefChange`, `onFirstFrameReady`)

**Do NOT remove:**
- `ClubhouseTopBar` and its imports
- Tab state management (`activeTab`)
- Like/comment mutation logic (if it's reusable)
- Any UI components not related to the media engine
- Navigation, auth, profile switching logic

## Step 2B: Fix `src/App.tsx` (or wherever `FullscreenPlayerProvider` is rendered)

- Remove `import { FullscreenPlayerProvider } from ...`
- Remove `<FullscreenPlayerProvider>` wrapper from the component tree
- If `FullscreenPlayerProvider` wraps the entire app, carefully unwrap it without breaking the tree

## Step 2C: Fix All 21+ `useUnifiedFullscreen` Consumers

For EVERY file that imports `useUnifiedFullscreen`, the import will break. For each one:

1. Remove the `import { useUnifiedFullscreen } from ...` line
2. Remove the `const { openFullscreen } = useUnifiedFullscreen()` call (or however it's destructured)
3. Find every `openFullscreen(...)` call in that file
4. Replace with a **temporary no-op**: `// TODO: Wire to new media player` + `console.log('[Fullscreen] Tapped post:', postId)`
5. If the `openFullscreen` call is inside an `onClick` handler, keep the handler but make it a no-op with the console.log

**Files to fix (from audit):**
- `src/components/feed/PostContent.tsx`
- `src/components/clubhouse/MiniProfileSheet.tsx`
- `src/components/courses/phase5/CourseMoments.tsx`
- `src/components/courses/course-detail/CourseReviewsTab.tsx`
- `src/components/courses/course-detail/CourseMediaTab.tsx`
- `src/components/profile/CreatorProfileSection.tsx`
- `src/components/profile/HighlightsCarousel.tsx`
- `src/components/channels/ChannelsFeed.tsx`
- `src/pages/PostDeepLinkPage.tsx`
- **Search for ALL other files** that import `useUnifiedFullscreen` — the audit found 21+, so there may be more than the 9 listed above. Find every single one.

## Step 2D: Fix `src/media/index.ts` (or any re-export barrel files)

- Remove re-exports of deleted files (`MediaFullscreenViewer`, fullscreen components)
- If `src/media/runtime/index.ts` re-exports `useClubhouseRuntimeBridge`, remove that export

## Step 2E: Fix Any Other Broken Imports

After all the above, run a full TypeScript compilation check. For any remaining errors:
- If the error is an import of a deleted file → remove the import and any code that depends on it
- If the error is a missing type → check if the type was defined in a deleted file and recreate it if needed elsewhere
- If the error is a missing context → the component was consuming `FullscreenPlayerContext` and needs the consumption removed

---

# SECTION 3: VERIFICATION

After all changes, verify:

## 3A: Compilation
- `npm run build` or `tsc --noEmit` passes with zero errors
- No broken imports anywhere in the codebase

## 3B: Deleted Files
Confirm these files/directories no longer exist:
- `src/components/grid/ClubhouseVerticalGrid.tsx`
- `src/components/grid/hooks/useVerticalFeedLogic.ts`
- `src/hooks/useClubhouseRuntimeBridge.ts`
- `src/hooks/useSoftResume.ts`
- `src/hooks/useInfiniteFollowedPosts.tsx`
- `src/hooks/useClubhouseFriendsShorts.ts`
- `src/utils/clubhouseVideoPrefetch.ts`
- `src/media/fullscreen/` (entire directory)
- `src/media/fullscreenAdapters.ts`
- `src/media/hooks/useFullscreenViewer.ts`
- `src/media/hooks/useSwipeNavigation.ts`
- `src/media/MediaFullscreenViewer.tsx`
- `src/contexts/FullscreenPlayerContext.tsx`
- `src/hooks/useUnifiedFullscreen.ts`
- `src/hooks/useUnifiedFullscreenLogic.ts`

## 3C: No Legacy References
Search the entire codebase for these strings — ALL must return zero results:
- `ClubhouseVerticalGrid` — zero results
- `useVerticalFeedLogic` — zero results
- `useClubhouseRuntimeBridge` — zero results
- `useSoftResume` — zero results
- `MediaFullscreenViewer` — zero results
- `FullscreenPlayerContext` — zero results
- `useUnifiedFullscreen` — zero results
- `FullscreenPlayerProvider` — zero results
- `useInfiniteClubhouseShorts` — zero results
- `useClubhouseFriendsShorts` — zero results

## 3D: Other Surfaces Still Work
- Profile page loads (tapping posts shows TODO log, not crash)
- Discover page loads
- Course pages load
- Clubhouse page loads (blank feed area is expected — integration comes next)
- No white screens or crashes on any route

---

# SECTION 4: IMPLEMENTATION ORDER

```
Step 1: Delete files from Section 1 (1A → 1B → 1C → 1D → 1E)
Step 2: Fix all broken imports from Section 2 (2A → 2B → 2C → 2D → 2E)
Step 3: Verify compilation — fix any remaining TypeScript errors
Step 4: Run verification checklist (Section 3)
```

Do steps 1-2 together as one batch (deletion + disconnection). Then step 3 to ensure clean compilation. Then step 4 to verify nothing is left over.

---

# IMPORTANT NOTES

1. **Do NOT delete any file in `src/components/media-system/`** — that's the NEW system we're keeping
2. **Do NOT delete shared infrastructure** — `GlobalAudioContext`, `MediaRuntime`, `HLSPlayer`, `HLSPoolManager`, `hlsBlobCache`, `posterPrefetch`, `useVideoReadyQueue`, `useAudioFade`, `DecoderLimitManager`, `videoTelemetry` — these are used by other parts of the app
3. **Do NOT delete UI overlay components** — `CinematicActionRail`, `CreatorCapsule`, `CommentsPage`, `FullscreenReviewPost`, `Top100OverlayPills`, `ClubhouseMusicPlayer`, `TextOverlayRenderer`, `MediaNavigationDots`, `VideoScrubber`
4. **Every `useUnifiedFullscreen` consumer** gets a temporary no-op replacement, NOT a crash — the surfaces still render, they just don't open a fullscreen player when tapped until they're rebuilt
5. **The Clubhouse page will have a blank feed area after this** — that's expected. The `ClubhouseVerticalGrid` render is removed but nothing replaces it yet. Integration comes in a separate brief.
