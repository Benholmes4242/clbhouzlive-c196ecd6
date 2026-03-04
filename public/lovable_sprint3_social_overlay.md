# Sprint 3: Social Overlay Rebuild — World-Class Standard

Every overlay component rebuilt from scratch on the new `FeedPost` data layer. No porting from the old Clubhouse system. Every field from the RPC used. Every interaction writes to Supabase.

---

# Section 1: Like System — Full Rebuild

The like system is currently broken: `isLikedByMe` is ignored, no Supabase mutation exists, and the count never updates on tap. This section rebuilds it completely.

## 1A: Fix `FeedItem.tsx` — Wire `isLikedByMe`

### Current (BROKEN):
```typescript
const [isLiked, setIsLiked] = useState(false);
```

### Replace with:
```typescript
const [isLiked, setIsLiked] = useState(post.isLikedByMe);
const [localLikeCount, setLocalLikeCount] = useState(post.likeCount);

// Sync if post data changes (e.g. refetch after pull-to-refresh)
useEffect(() => {
  setIsLiked(post.isLikedByMe);
  setLocalLikeCount(post.likeCount);
}, [post.id, post.isLikedByMe, post.likeCount]);
```

## 1B: Create `hooks/useLikeMutation.ts` — New File

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LikeMutationParams {
  postId: string;
  userId: string;
  isLiked: boolean; // current state BEFORE toggle
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: LikeMutationParams) => {
      if (isLiked) {
        // Unlike: delete the row
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Like: insert a row
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onError: (error, variables) => {
      console.error('[Like] Mutation failed:', error);
      // The optimistic UI in FeedItem will be reverted via the onError callback
    },
    onSettled: () => {
      // Invalidate feed queries to refresh like counts on next fetch
      // Don't refetch immediately — let the optimistic UI handle it
      queryClient.invalidateQueries({
        queryKey: ['media-feed'],
        refetchType: 'none', // Don't refetch, just mark stale
      });
    },
  });
}
```

## 1C: Wire the mutation in `FeedItem.tsx`

```typescript
import { useLikeMutation } from '../hooks/useLikeMutation';
import { useSupabaseSession } from '@/hooks/useSupabaseSession'; // or your auth hook

// Inside FeedItem component:
const { user } = useSupabaseSession();
const likeMutation = useLikeMutation();

const handleLike = useCallback(() => {
  if (!user?.id) return;

  // Optimistic UI update
  const wasLiked = isLiked;
  setIsLiked(!wasLiked);
  setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

  // Fire mutation
  likeMutation.mutate(
    { postId: post.id, userId: user.id, isLiked: wasLiked },
    {
      onError: () => {
        // Revert optimistic update on failure
        setIsLiked(wasLiked);
        setLocalLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      },
    }
  );
}, [isLiked, post.id, user?.id, likeMutation]);
```

Pass `isLiked` and `localLikeCount` to `SocialOverlay` instead of the raw `post` fields:

```typescript
<SocialOverlay
  post={post}
  isLiked={isLiked}
  likeCount={localLikeCount}
  onLike={handleLike}
  onDoubleTapLike={handleLike} // same path
  // ... other props
/>
```

## 1D: Update `SocialOverlay.tsx` — Like button

The like button should:
- Show filled amber heart when liked (`post.isLikedByMe` / optimistic state)
- Show outline heart when not liked
- Display `localLikeCount` (from FeedItem, not `post.likeCount`)
- Scale animation on tap (existing)
- Haptic on tap (existing)

### Like button icon color:
```typescript
// Liked state
color: isLiked ? '#F59E0B' : 'rgba(255,255,255,0.9)'
fill: isLiked ? '#F59E0B' : 'none'
```

The amber `#F59E0B` matches the Clbhouz accent color.

---

# Section 2: Review Post Banner — Complete Build

Review posts need a distinctive overlay that shows course info and rating. This is a signature Clbhouz feature.

## 2A: Create `ReviewBanner.tsx` — New File

This component renders at the TOP of the video frame for review posts, showing:
- Course name (left-aligned, bold)
- Region/location (below course name, muted)
- Rating badge (right-aligned, large number + quality label)

### Props:
```typescript
interface ReviewBannerProps {
  review: ReviewData;       // from FeedPost.review
  isVisible: boolean;       // hide during scrub
}
```

### Rating quality labels — derive from numeric rating:
```typescript
function getRatingLabel(rating: number): string {
  if (rating >= 9.0) return 'OUTSTANDING';
  if (rating >= 8.0) return 'EXCELLENT';
  if (rating >= 7.0) return 'VERY GOOD';
  if (rating >= 6.0) return 'GOOD';
  if (rating >= 5.0) return 'AVERAGE';
  return 'BELOW AVERAGE';
}

function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#F59E0B'; // Amber — outstanding
  if (rating >= 8.0) return '#D97706'; // Darker amber — excellent
  if (rating >= 7.0) return '#059669'; // Emerald — very good
  if (rating >= 6.0) return '#0D9488'; // Teal — good
  return '#6B7280';                     // Gray — average/below
}
```

### Layout spec:
```
┌─────────────────────────────────────────────┐
│  Course Name                          9.4   │
│  Region, Country                OUTSTANDING │
└─────────────────────────────────────────────┘
```

### Styling:
- Position: absolute, top of video frame, below safe area and tab toggle
- Top offset: `calc(max(env(safe-area-inset-top, 0px), 47px) + 48px)` (below tab toggle)
- Background: `rgba(0, 0, 0, 0.55)` with `backdrop-filter: blur(12px)` — NO, wait. Previous audit removed backdrop-filter for iOS perf. Use solid `rgba(0, 0, 0, 0.65)` instead.
- Left/right padding: 16px
- Top/bottom padding: 12px
- Border radius: 12px
- Margin: 0 12px (inset from screen edges)
- Course name: `fontSize: 15, fontWeight: 600, color: '#FFFFFF'`
- Region: `fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)'`
- Rating number: `fontSize: 28, fontWeight: 700, color: getRatingColor(rating)`
- Quality label: `fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: getRatingColor(rating), textTransform: 'uppercase'`

### Location/region data:
The `FeedPost.review` type currently has `courseName`, `courseId`, `rating`, `courseImageUrl`. It does NOT have region/location.

**Option A (recommended for now):** Don't show region. Just show course name + rating. The banner still looks great with two elements.

**Option B (requires RPC update):** Add `course_country` and `course_region` to the RPC return columns by joining on `golf_courses` table fields. This is a future enhancement.

For now, implement Option A:

```
┌─────────────────────────────────────────────┐
│  Pleasington Golf Club                9.4   │
│                                 OUTSTANDING │
└─────────────────────────────────────────────┘
```

### Fade behavior:
- Fade in on mount with 300ms opacity transition
- Hide during scrubber interaction (`isVisible` prop)
- Hide when caption is expanded (overlay conflict)

## 2B: Wire `ReviewBanner` into `FeedItem.tsx`

```typescript
{post.isReview && post.review && (
  <ReviewBanner
    review={post.review}
    isVisible={!isScrubbing && !isCaptionExpanded}
  />
)}
```

Position it inside the FeedItem's overlay container, above the SocialOverlay.

---

# Section 3: Creator Capsule — Complete Rebuild

The creator capsule is the bottom-left info block. Currently it's a flat display of avatar + username + caption. Rebuild it as an expandable capsule with two states.

## 3A: Create `CreatorCapsule.tsx` — New File

### Props:
```typescript
interface CreatorCapsuleProps {
  post: FeedPost;
  isFollowed: boolean;
  onFollow: () => void;
  onProfile: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}
```

### Collapsed State (default):
```
┌──────────────────────────────────────┐
│  [Avatar] Creator Name  ✓  ▾        │
│           Course / Caption preview   │
└──────────────────────────────────────┘
```

- Avatar: 36×36px circle, `post.avatarUrl` with fallback to initials circle
- Creator name: `post.displayName` (NOT `username`), `fontSize: 14, fontWeight: 600, color: '#FFFFFF'`
- Verified badge: Blue checkmark circle after name, only shown when `post.isVerified === true`. Size 14×14px.
- Chevron: Small `▾` indicator that the capsule is tappable
- Subtitle line: 
  - For review posts: `post.review.courseName` in amber `#F59E0B`
  - For regular posts: First line of `post.caption`, truncated to ~40 chars
  - `fontSize: 12, color: 'rgba(255,255,255,0.6)'`

### Expanded State (on tap):
```
┌──────────────────────────────────────┐
│  [Avatar] Creator Name  ✓  ▴        │
│           @username                  │
│                                      │
│  📍 Course Name                  ▸   │
│     Region, Country                  │
│                                      │
│  [Follow]  [Profile]                 │
└──────────────────────────────────────┘
```

- Slides down with spring animation (Framer Motion `animate={{ height: 'auto' }}`)
- `@username`: `post.username`, `fontSize: 12, color: 'rgba(255,255,255,0.5)'`
- Course info: Only shown for review posts. Course name tappable → navigate to course detail page
- Location pin icon: `📍` or Lucide `MapPin` icon, 12px, amber color
- Follow button: Pill shape, `height: 32px, borderRadius: 16px`
  - Not following: `background: '#FFFFFF', color: '#000000', text: 'Follow'`
  - Following: `background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', text: 'Following'`
- Profile button: Pill shape, same height, `background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', text: 'Profile'`
- Button gap: 8px between Follow and Profile

### Background:
- `background: 'rgba(0, 0, 0, 0.55)'`
- `borderRadius: 16px`
- `padding: 12px`
- Max width: `75%` of screen (don't stretch full width)

### Close behavior:
- Tap chevron to collapse
- Tap anywhere outside the capsule to collapse
- Auto-collapse when user swipes to next video
- Collapse when scrubber is engaged

### Business actor handling:
When `post.actorType === 'business'`:
- Show business logo instead of personal avatar
- Show business name instead of display name
- Follow button uses `business_follows` table (different from `user_follows`)
- No `@username` line (businesses don't have usernames in the same way)

## 3B: Avatar Fallback

When `post.avatarUrl` is empty or fails to load:
```typescript
// Generate initials from displayName
const initials = post.displayName
  .split(' ')
  .map(w => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

// Render initials in a colored circle
// Color derived from userId for consistency:
const hue = parseInt(post.userId.slice(0, 8), 16) % 360;
const bgColor = `hsl(${hue}, 45%, 55%)`;
```

---

# Section 4: Follow System — Complete Build

## 4A: Create `hooks/useFollowMutation.ts` — New File

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowParams {
  targetUserId: string;
  targetActorType: 'personal' | 'business';
  targetActorId: string;
  currentUserId: string;
  isFollowed: boolean; // current state BEFORE toggle
}

export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, targetActorType, targetActorId, currentUserId, isFollowed }: FollowParams) => {
      if (targetActorType === 'business') {
        // Business follow/unfollow
        if (isFollowed) {
          const { error } = await supabase
            .from('business_follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('business_id', targetActorId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('business_follows')
            .insert({ follower_id: currentUserId, business_id: targetActorId });
          if (error) throw error;
        }
      } else {
        // Personal follow/unfollow
        if (isFollowed) {
          const { error } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_follows')
            .insert({ follower_id: currentUserId, following_id: targetUserId });
          if (error) throw error;
        }
      }
    },
    onSettled: () => {
      // Mark feed queries stale (don't refetch immediately)
      queryClient.invalidateQueries({
        queryKey: ['media-feed'],
        refetchType: 'none',
      });
    },
  });
}
```

## 4B: Follow State in `FeedItem.tsx`

```typescript
const [isFollowed, setIsFollowed] = useState(post.isFollowedByMe);
const followMutation = useFollowMutation();

useEffect(() => {
  setIsFollowed(post.isFollowedByMe);
}, [post.id, post.isFollowedByMe]);

const handleFollow = useCallback(() => {
  if (!user?.id) return;

  const wasFollowed = isFollowed;
  setIsFollowed(!wasFollowed);

  followMutation.mutate(
    {
      targetUserId: post.userId,
      targetActorType: post.actorType,
      targetActorId: post.actorId,
      currentUserId: user.id,
      isFollowed: wasFollowed,
    },
    {
      onError: () => {
        setIsFollowed(wasFollowed);
      },
    }
  );
}, [isFollowed, post.userId, post.actorType, post.actorId, user?.id, followMutation]);
```

## 4C: Cross-Post Follow Sync

When the user follows a creator on one post, ALL other posts by the same creator in the current feed should update. This happens naturally when the feed refetches (stale query), but for immediate visual feedback:

In `FullscreenMediaViewer`, maintain a `Map<string, boolean>` of follow overrides keyed by `userId`:

```typescript
const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

const handleFollowChange = useCallback((userId: string, isFollowed: boolean) => {
  setFollowOverrides(prev => {
    const next = new Map(prev);
    next.set(userId, isFollowed);
    return next;
  });
}, []);
```

Pass `followOverrides` down to `FeedItem`. In `FeedItem`, check:
```typescript
const effectiveIsFollowed = followOverrides.get(post.userId) ?? post.isFollowedByMe;
```

This gives instant cross-post sync without refetching the entire feed.

---

# Section 5: Caption Overlay — Polish

The caption overlay is mostly working. Polish it:

## 5A: Use `displayName` instead of `username`

In `SocialOverlay.tsx`, change:
```typescript
// Before:
{post.username || 'Clbhouz User'}

// After:
{post.displayName || post.username || 'Unknown'}
```

## 5B: Add timestamp

Show relative time below the caption:
```typescript
function getRelativeTime(createdAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
```

Display below the caption text, `fontSize: 11, color: 'rgba(255,255,255,0.4)'`.

---

# Section 6: Share Button — Wire to DB

## 6A: Create share record

After the Web Share API call succeeds (or falls back to clipboard), insert a row:

```typescript
// In SocialOverlay share handler:
const handleShare = async () => {
  haptic('medium');

  const shareUrl = `https://clbhouz.com/post/${post.id}`;
  const shareData = { title: post.displayName, text: post.caption, url: shareUrl };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copied');
    }

    // Record the share in Supabase
    if (user?.id) {
      supabase
        .from('post_shares')
        .insert({ post_id: post.id, user_id: user.id })
        .then(({ error }) => {
          if (error && !error.message.includes('duplicate')) {
            console.error('[Share] DB error:', error);
          }
        });
    }
  } catch (e) {
    // User cancelled share sheet — don't record
  }
};
```

## 6B: Display share count

In the action rail, show `post.shareCount` below the share icon (same pattern as like/comment counts). Only display if > 0.

---

# Section 7: More Options Button — New Build

## 7A: Create `MoreOptionsSheet.tsx` — Bottom Sheet

Add a three-dot button at the bottom of the right-side action rail. On tap, open a bottom sheet with:

- **Report** — `flag` icon, text "Report this post"
- **Not interested** — `eye-off` icon, text "Not interested"  
- **Copy link** — `link` icon, text "Copy link"
- **About this account** — `info` icon, text "About this account"

For now, these can be placeholders that show toasts ("Coming soon"). The important thing is the button exists and the sheet opens, so the UI feels complete.

### Sheet styling (Clbhouz standard):
- `border-radius: 20px 20px 0 0` (top corners)
- Close button: `width: 44px, height: 44px` (tap target spec)
- Drag handle: `width: 36px, height: 4px, borderRadius: 2px, background: 'rgba(255,255,255,0.3)'`
- Use Vaul-based bottom sheet via shadcn (existing pattern in the app)
- Background: `#1A1A1A`

---

# Section 8: Action Rail — Rebuild Layout

The right-side action rail needs to include all buttons in the correct order, top to bottom:

```
  [Carousel Arrow]   ← only for multi-media posts
  [Like ❤️ + count]
  [Comment 💬 + count]
  [Share ✈️ + count]
  [More ⋯]
```

### Spacing:
- Between items: 20px gap
- Icon size: 26px (within 44×44px tap target)
- Count text: `fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)'`
- Count margin-top: 2px below icon
- Position: right: 12px, bottom aligned above the creator capsule

### Carousel Arrow:
Only render when `post.mediaItems.length > 1`. Shows a chevron-right icon inside a glassmorphic circle (`rgba(0,0,0,0.35)`, `borderRadius: 50%`, `width: 36px, height: 36px`). Tap advances the carousel.

### Mute button:
Move the mute button OUT of the action rail. Place it independently, positioned below the tab toggle on the right side. It's a global control, not a per-post action.

---

# Section 9: "Read Review" Link

For review posts, add a tappable "Read review ›" link in the creator capsule area (below the creator name, above the caption):

```typescript
{post.isReview && (
  <button
    onClick={() => {
      // Navigate to the review detail / course page
      // For now: toast or navigate
      haptic('light');
    }}
    style={{
      background: 'none',
      border: 'none',
      color: '#F59E0B',
      fontSize: 13,
      fontWeight: 600,
      padding: 0,
      cursor: 'pointer',
    }}
  >
    Read review ›
  </button>
)}
```

---

# Section 10: Verified Badge

Small blue checkmark shown after the creator's display name, ONLY when `post.isVerified === true`.

```typescript
{post.isVerified && (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
    <circle cx="7" cy="7" r="7" fill="#3B82F6" />
    <path d="M4.5 7L6.5 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)}
```

---

# Section 11: Inline Styles Cleanup

Move all repeated inline `<style>` blocks to a single CSS file:

## Create `styles/mediaPlayer.css` — New File

```css
/* VideoPlayer keyframes */
@keyframes fadeInOverlay {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeOutOverlay {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}

@keyframes heartPop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  15% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  30% { transform: translate(-50%, -50%) scale(0.95); opacity: 1; }
  45% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
  80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* Scrubber keyframes */
@keyframes loopPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* PullToRefresh keyframes */
@keyframes pullRotate {
  to { transform: rotate(360deg); }
}

/* ReviewBanner */
@keyframes bannerFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* CreatorCapsule */
@keyframes capsuleSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Import once in `FullscreenMediaViewer.tsx`:
```typescript
import '../styles/mediaPlayer.css';
```

Remove ALL inline `<style>` blocks from VideoPlayer.tsx, Scrubber.tsx, PullToRefresh.tsx, and any new components.

---

# Section 12: File Summary

### New Files
| File | Purpose |
|---|---|
| `hooks/useLikeMutation.ts` | Like/unlike Supabase mutation |
| `hooks/useFollowMutation.ts` | Follow/unfollow Supabase mutation (personal + business) |
| `ReviewBanner.tsx` | Review post overlay with course name + rating badge |
| `CreatorCapsule.tsx` | Expandable creator info with follow, profile, verified badge |
| `MoreOptionsSheet.tsx` | Three-dot menu bottom sheet |
| `styles/mediaPlayer.css` | Shared keyframes and styles |

### Modified Files
| File | Changes |
|---|---|
| `FeedItem.tsx` | Wire `isLikedByMe`, `isFollowedByMe`, optimistic state, mutations |
| `SocialOverlay.tsx` | Receive `isLiked`/`likeCount`/`isFollowed` as props, add share count, add more button, use `displayName`, add timestamp, add verified badge, restructure action rail |
| `VideoPlayer.tsx` | Remove inline `<style>` blocks |
| `Scrubber.tsx` | Remove inline `<style>` block |
| `PullToRefresh.tsx` | Remove inline `<style>` block |
| `FullscreenMediaViewer.tsx` | Add follow overrides map for cross-post sync, import CSS |

### NOT Modified
| File | Reason |
|---|---|
| Video engine (useVideoPool, hlsManager, etc.) | No changes needed |
| Feed hooks (useSuggestedFeed, useFriendsFeed) | No changes needed |
| Feed algorithm (feedAlgorithm.ts, feedMapper.ts) | No changes needed |
| FeedContainer.tsx | No changes needed |
| Spring physics | No changes needed |

---

# Section 13: Implementation Order

```
Step 1: Like System
  - Create useLikeMutation.ts
  - Update FeedItem.tsx: wire isLikedByMe, optimistic state, mutation
  - Update SocialOverlay.tsx: receive isLiked/likeCount as props
  - Test: like a post, refresh, verify it persists

Step 2: Follow System
  - Create useFollowMutation.ts
  - Update FeedItem.tsx: wire isFollowedByMe, optimistic state, mutation
  - Test: follow a creator, verify in Supabase

Step 3: Creator Capsule
  - Create CreatorCapsule.tsx with collapsed/expanded states
  - Wire displayName, username, avatarUrl, isVerified, actorType
  - Wire follow button to useFollowMutation
  - Wire profile button (navigation placeholder)
  - Wire review course info for review posts
  - Add "Read review" link for review posts

Step 4: Review Banner
  - Create ReviewBanner.tsx
  - Wire to FeedItem for review posts
  - Implement rating labels and colors

Step 5: Action Rail + More Options
  - Restructure right-side action rail order
  - Add share count display
  - Create MoreOptionsSheet.tsx
  - Add More button to action rail
  - Move mute button out of rail

Step 6: Polish
  - Add verified badge
  - Add relative timestamp
  - Create mediaPlayer.css and remove inline styles
  - Test all interactions end-to-end
```

Build each step completely, test it, then move to the next. The like system is the foundation — everything else builds on the pattern it establishes (optimistic state + mutation + RPC field).
