# Phase 1B: Integration — New Media Player into Clubhouse Page

## Overview

The legacy media engine has been nuked. The Clubhouse page currently shows a blank feed area. This brief wires the new media player engine into `Clubhouse.tsx` so videos play again, with ALL the existing Clubhouse UI overlay components sitting on top.

**Two key principles:**
1. The new media player engine handles ONLY video playback, scrolling, and preloading
2. The existing Clubhouse UI components (CinematicActionRail, CreatorCapsule, VideoScrubber, etc.) handle ALL user-facing overlay UI

---

## Step 1: Read Before Writing

Before making ANY changes, read these files completely to understand the current state:

1. `src/pages/Clubhouse.tsx` — understand what remains after the nuke, what hooks are still called, what UI is still rendered
2. `src/components/media-system/FullscreenMediaViewer.tsx` — understand how the new media player currently renders on `/mediaplayer` route, what components it uses, how it passes data
3. `src/components/media-system/FeedContainer.tsx` — understand props it expects, how it renders children, how it manages scroll/active index
4. `src/components/media-system/FeedItem.tsx` — understand props it expects, what it renders, how it communicates with VideoPlayer
5. `src/components/media-system/VideoPlayer.tsx` — understand how it receives video URLs, how it exposes the video element ref
6. `src/components/media-system/hooks/useSuggestedFeed.ts` — understand what it returns (posts, pagination, loading states)
7. `src/components/media-system/hooks/useFriendsFeed.ts` — same as above
8. `src/components/media-system/store/mediaStore.ts` — understand available state (activeIndex, isMuted, etc.)
9. `src/components/media-system/types/media.ts` — understand the FeedPost type and all its fields

Also read these UI overlay components to understand what props they expect:

10. `src/components/clubhouse/cinematic/CinematicActionRail.tsx` — full props interface
11. `src/components/clubhouse/cinematic/CreatorCapsule.tsx` — full props interface
12. `src/components/clubhouse/cinematic/CommentsPage.tsx` — full props interface
13. `src/components/video/VideoScrubber.tsx` — full props interface
14. `src/components/posts/FullscreenReviewPost.tsx` — full props interface
15. `src/components/clubhouse/Top100OverlayPills.tsx` — full props interface
16. `src/components/posts/user-post/overlays/MediaNavigationDots.tsx` — full props interface

**Only after reading ALL of these** should you proceed to implementation. You need to understand both sides of the bridge — the new engine's data shape and the existing UI's expected props — before connecting them.

---

## Step 2: Add Feed Data Hooks to Clubhouse.tsx

The old feed used `useInfiniteClubhouseShorts` and `useClubhouseFriendsShorts`. Replace with the new hooks.

**Import:**
```typescript
import { useSuggestedFeed } from '@/components/media-system/hooks/useSuggestedFeed';
import { useFriendsFeed } from '@/components/media-system/hooks/useFriendsFeed';
```

**Call both hooks** (both tabs stay mounted for instant switching, matching the existing pattern):
```typescript
const suggestedFeed = useSuggestedFeed(user?.id);
const friendsFeed = useFriendsFeed(user?.id);
const activeFeed = activeTab === 'foryou' ? suggestedFeed : friendsFeed;
```

Extract what's needed from the active feed:
```typescript
const posts = activeFeed.data?.pages.flatMap(page => page.posts) ?? [];
const isLoading = activeFeed.isLoading;
const hasNextPage = activeFeed.hasNextPage;
const fetchNextPage = activeFeed.fetchNextPage;
const isFetchingNextPage = activeFeed.isFetchingNextPage;
const refetch = activeFeed.refetch;
```

Note: The exact shape of what the hooks return depends on how `useSuggestedFeed` and `useFriendsFeed` are implemented (they use `useInfiniteQuery`). Read the hooks first and adapt the destructuring above to match their actual return types.

---

## Step 3: Render the New Media Player Engine

Replace the blank placeholder area in Clubhouse.tsx with the new media player components.

**Import:**
```typescript
import { VideoPoolProvider } from '@/components/media-system/VideoPoolProvider';
import FeedContainer from '@/components/media-system/FeedContainer';
import FeedItem from '@/components/media-system/FeedItem';
import { useMediaStore } from '@/components/media-system/store/mediaStore';
```

**Render:**
The new media player's `FeedContainer` and `FeedItem` handle video playback and vertical scrolling. Look at how `FullscreenMediaViewer.tsx` (the `/mediaplayer` route) currently renders these components and replicate that pattern inside `Clubhouse.tsx`, replacing the TODO placeholder.

The key structure should be something like:
```tsx
<VideoPoolProvider>
  <FeedContainer
    posts={posts}
    // ... other props FeedContainer expects
  />
</VideoPoolProvider>
```

**Important:** `FeedContainer` may render `FeedItem` components internally (check its implementation). If so, just pass `posts` and let it handle the rest. If it expects a render function or children, match whatever pattern `FullscreenMediaViewer.tsx` uses.

**Fullscreen container styling:**
The feed should fill the entire screen like it did before. Use the same container approach the Clubhouse page previously used — likely a full-height div with the appropriate safe area handling. The `FeedItem` components already use `100dvh` height.

---

## Step 4: Expose Active Post Data for Overlays

The UI overlay components need to know which post is currently active so they can display the right creator info, like counts, etc.

**Read the active index from the media store:**
```typescript
const activeIndex = useMediaStore((s) => s.activeIndex);
const activePost = posts[activeIndex] ?? null;
```

This gives us the current `FeedPost` object that all overlay components will read from.

---

## Step 5: Wire CinematicActionRail

Read `CinematicActionRail.tsx` to find its exact props interface. Then map from `FeedPost` fields.

The mapping will look approximately like this (adapt to match the actual prop names after reading the component):

```typescript
<CinematicActionRail
  // Engagement counts
  likesCount={activePost?.likeCount ?? 0}
  commentsCount={activePost?.commentCount ?? 0}
  isLiked={activePost?.isLikedByMe ?? false}
  
  // Handlers
  onLike={() => handleLike(activePost)}
  onComment={() => setCommentsOpen(true)}
  onShare={() => handleShare(activePost)}
  onMore={() => setMoreOptionsOpen(true)}
  
  // Media state
  isVideo={true}
  hasNextMedia={(activePost?.mediaItems?.length ?? 0) > 1}
  onNextMedia={() => handleNextMedia()}
  
  // Audio
  isMuted={isMuted}
  onMuteToggle={toggleMute}
  
  // ... any other props the component requires
/>
```

**For the like handler**, use the `useLikeMutation` hook from `src/components/media-system/hooks/useLikeMutation.ts` which was built in Sprint 3. Wire it with optimistic UI:

```typescript
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';

const likeMutation = useLikeMutation();
const [localLikeState, setLocalLikeState] = useState<Map<string, { isLiked: boolean; count: number }>>(new Map());

const handleLike = useCallback((post: FeedPost) => {
  if (!user?.id || !post) return;
  
  const current = localLikeState.get(post.id) ?? { isLiked: post.isLikedByMe, count: post.likeCount };
  const newState = { isLiked: !current.isLiked, count: current.isLiked ? current.count - 1 : current.count + 1 };
  
  setLocalLikeState(prev => new Map(prev).set(post.id, newState));
  
  likeMutation.mutate(
    { postId: post.id, userId: user.id, isLiked: current.isLiked },
    { onError: () => setLocalLikeState(prev => new Map(prev).set(post.id, current)) }
  );
}, [user?.id, localLikeState, likeMutation]);
```

Then read like state from the map:
```typescript
const activeLikeState = localLikeState.get(activePost?.id ?? '') ?? {
  isLiked: activePost?.isLikedByMe ?? false,
  count: activePost?.likeCount ?? 0,
};
```

---

## Step 6: Wire CreatorCapsule

Read `CreatorCapsule.tsx` to find its exact props interface. Map from `FeedPost`:

```typescript
<CreatorCapsule
  user={{
    name: activePost?.displayName ?? '',
    avatar: activePost?.avatarUrl ?? '',
    username: activePost?.username ?? '',
    id: activePost?.userId ?? '',
  }}
  caption={activePost?.caption ?? ''}
  isReview={activePost?.isReview ?? false}
  reviewData={activePost?.review ?? null}
  isFollowed={activePost?.isFollowedByMe ?? false}
  onFollow={() => handleFollow(activePost)}
  onProfile={() => navigateToProfile(activePost)}
  onReviewTap={() => navigateToReview(activePost)}
  // ... any other props
/>
```

**For the follow handler**, use `useFollowMutation` from Sprint 3:
```typescript
import { useFollowMutation } from '@/components/media-system/hooks/useFollowMutation';
```

Wire it the same optimistic pattern as likes — maintain a local follow override map.

---

## Step 7: Wire VideoScrubber

The scrubber needs a reference to the active `<video>` element. The new media player's video pool provides this.

Read `VideoScrubber.tsx` to understand what it expects. It likely needs a `videoRef` or direct access to the video element's `currentTime` and `duration`.

**To get the active video element from the pool:**
The `VideoPoolProvider` / `useVideoPoolContext` should expose a way to get the video element for a given URL. Read the pool's public API and wire accordingly:

```typescript
import { useVideoPoolContext } from '@/components/media-system/VideoPoolProvider';

const pool = useVideoPoolContext();
const activeVideoElement = pool?.getElement(activePost?.mediaItems?.[0]?.hlsUrl);
```

Pass this to the scrubber. If the scrubber expects a `ref`, wrap it appropriately.

**If the scrubber can't easily integrate with the pool-based system**, keep the new media player's own `Scrubber` component instead. The Clubhouse `VideoScrubber` may expect a direct `<video>` ref that the pool architecture doesn't expose the same way. In that case, render the media-system `Scrubber` instead and style it to match the Clubhouse version visually.

---

## Step 8: Wire Audio (Temporary Bridge)

For now, bridge the mute state from the new media player's store to the overlay components:

```typescript
const isMuted = useMediaStore((s) => s.isMuted);
const toggleMute = useMediaStore((s) => s.toggleMute);
```

Pass `isMuted` and `toggleMute` to `CinematicActionRail`'s mute props. This is a temporary bridge — the full audio system rebuild comes later.

---

## Step 9: Wire Remaining Overlays

### CommentsPage
Read its props. It likely needs a `postId` and open/close state:
```typescript
const [commentsOpen, setCommentsOpen] = useState(false);

{commentsOpen && activePost && (
  <CommentsPage
    postId={activePost.id}
    onClose={() => setCommentsOpen(false)}
    // ... other props
  />
)}
```

### FullscreenReviewPost
Only render for review posts:
```typescript
{activePost?.isReview && activePost?.review && (
  <FullscreenReviewPost
    review={activePost.review}
    // ... read the component's props and map accordingly
  />
)}
```

### Top100OverlayPills
If the active post's course is in the Top 100:
```typescript
// Only if this data is available in FeedPost or from a separate hook
```

### MediaNavigationDots
For multi-media posts:
```typescript
{(activePost?.mediaItems?.length ?? 0) > 1 && (
  <MediaNavigationDots
    total={activePost.mediaItems.length}
    current={currentMediaIndex}
    onDotTap={setCurrentMediaIndex}
    // ... read the component's props
  />
)}
```

### ClubhouseMusicPlayer
If the post has music metadata:
```typescript
// Wire if FeedPost has music data, otherwise skip for now
```

### TextOverlayRenderer
If the post has studio text overlays:
```typescript
// Wire if FeedPost has text overlay data, otherwise skip for now
```

---

## Step 10: Handle Tab Switching

The `ClubhouseTabToggle` already manages `activeTab` state via `useClubhouseTab` context. When the tab changes:

1. The `activeFeed` variable switches between `suggestedFeed` and `friendsFeed`
2. `posts` array updates
3. The `FeedContainer` should reset to the top (index 0)

**Reset active index on tab change:**
```typescript
useEffect(() => {
  if (prevTabRef.current !== activeTab) {
    useMediaStore.getState().setActiveIndex(0);
    // Also reset any local state (like overrides, follow overrides, etc.)
    setLocalLikeState(new Map());
    prevTabRef.current = activeTab;
  }
}, [activeTab]);
```

**Key for FeedContainer:** Pass `key={activeTab}` to the `FeedContainer` component so it fully remounts when tabs switch, resetting scroll position and all internal state:
```tsx
<FeedContainer key={activeTab} posts={posts} ... />
```

---

## Step 11: Handle Infinite Scroll

When the user nears the end of the feed, trigger loading more posts. The `FeedContainer` should have an `onLoadMore` prop or similar mechanism.

Read `FeedContainer.tsx` to see how it signals "near end of list." Wire it to the feed hook's `fetchNextPage`:

```typescript
<FeedContainer
  posts={posts}
  onLoadMore={hasNextPage ? fetchNextPage : undefined}
  isLoadingMore={isFetchingNextPage}
  // ...
/>
```

If `FeedContainer` doesn't have an `onLoadMore` prop, it may use an internal mechanism (like detecting when `activeIndex` is within N posts of the end). Check its implementation and wire accordingly.

---

## Step 12: Handle Pull-to-Refresh

The `FeedContainer` likely has a `onRefresh` prop. Wire it:

```typescript
<FeedContainer
  onRefresh={async () => {
    await activeFeed.refetch();
    setLocalLikeState(new Map());
  }}
  // ...
/>
```

---

## Step 13: Skeleton / Loading State

While the feed is loading, show the Clubhouse skeleton:

```typescript
{isLoading ? (
  <ClubhouseSkeletonShimmer visible={true} />
) : (
  <VideoPoolProvider>
    <FeedContainer key={activeTab} posts={posts} ... />
  </VideoPoolProvider>
)}
```

Use whatever skeleton component the Clubhouse page already has (`useClubhouseSkeletonTiming` or `ClubhouseSkeletonShimmer`).

---

## Step 14: Z-Index & Positioning

The overlay components need to float above the video feed. Set up the z-index stack:

```
z-index layers:
- Video feed (FeedContainer + FeedItems): z-0 (base)
- Review overlay (FullscreenReviewPost): z-10
- Scrubber: z-20
- Action rail (CinematicActionRail): z-30
- Creator capsule: z-30
- Top bar (ClubhouseTopBar): z-40
- Carousel dots: z-30
- Comments sheet: z-50
- More options sheet: z-50
```

The overlay components likely already have their own z-index values from the old Clubhouse feed. Read their existing styles and preserve them. The key requirement is that the `FeedContainer` sits at the base layer.

---

## Step 15: Safe Area Handling

The Clubhouse page handles safe areas. Ensure:
- The top bar respects `env(safe-area-inset-top)` (already handled by `ClubhouseTopBar`)
- The scrubber respects `env(safe-area-inset-bottom)` 
- The `FeedItem` videos bleed behind the safe areas for immersive fullscreen (no black bars)
- The bottom tab bar clearance is correct

---

## Implementation Order

```
Step 1:  Read all files listed (both engine and overlay components)
Step 2:  Add feed hooks to Clubhouse.tsx
Step 3:  Render FeedContainer + VideoPoolProvider
Step 4:  Expose activePost from mediaStore
Step 5:  Wire CinematicActionRail with like mutation
Step 6:  Wire CreatorCapsule with follow mutation
Step 7:  Wire VideoScrubber (or use media-system Scrubber)
Step 8:  Wire audio bridge
Step 9:  Wire remaining overlays (comments, review, dots)
Step 10: Wire tab switching with key reset
Step 11: Wire infinite scroll
Step 12: Wire pull-to-refresh
Step 13: Wire skeleton loading
Step 14: Verify z-index stacking
Step 15: Verify safe areas
```

Build each step, verify it works, then move to the next. The feed should be playable after steps 1-4. The overlays come online one by one in steps 5-9. Polish in steps 10-15.

---

## What Success Looks Like

After this integration:
- Navigate to `/clubhouse`
- Suggested tab loads videos from `get_suggested_feed` RPC
- Friends tab loads videos from `get_friends_feed` RPC
- Videos play via the new engine (pool-based HLS, spring physics scroll, gapless loop)
- Swipe up/down to navigate between videos
- CinematicActionRail shows on right side with real like/comment/share counts
- Like button works with optimistic UI + Supabase mutation
- CreatorCapsule shows at bottom with real creator info, expand/collapse works
- Scrubber shows progress, seekable
- Pull-to-refresh works
- Tab switching resets feed
- Loading skeleton shows during initial load
- All overlay styling matches the pre-nuke Clubhouse page exactly
