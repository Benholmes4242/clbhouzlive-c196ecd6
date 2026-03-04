import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useRealtimePersonalPosts } from '@/hooks/useRealtimePersonalPosts';
import { ActivityGridV2, useActivityPostsV2 } from './activity/v2';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { CreatorProfileSection } from './CreatorProfileSection';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { useUserFollow } from '@/hooks/useUserFollow';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProfileContentGrid, ContentFilter, GridPost } from '@/components/grids';
import { ContentFilterPills, FilterOption } from '@/components/common/ContentFilterPills';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { logProfile, createLifecycleLogger, logQueryState, profileTiming, logMediaState, logInteraction } from './debug';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { useQueryClient } from '@tanstack/react-query';
import { postKeys } from '@/queryKeys/posts';
import { AlertCircle } from 'lucide-react';

// Minimum videos ready before showing feed
const MINIMUM_READY_COUNT = 2;

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  onAchievementsClick?: () => void;
}

// Filter labels for display
const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'longform', label: 'Long-form' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'images', label: 'Images' },
];

// Adapter: Convert UnifiedMediaItem to GridPost for ProfileContentGrid
function unifiedToGridPost(item: UnifiedMediaItem): GridPost {
  return {
    id: item.postId || item.id,
    content: item.courseName || null,
    created_at: new Date().toISOString(),
    user_id: item.creator?.id,
    course_id: item.golfCourseId || null,
    like_count: item.likes || 0,
    comment_count: 0,
    post_media: item.url ? [{
      id: item.id,
      media_type: item.type as 'video' | 'image',
      media_url: item.playbackUrl || item.url,
      poster_url: item.thumbnailUrl || null,
      stream_id: null,
      duration_seconds: item.durationSeconds || null,
      width: item.mediaWidth || null,
      height: item.mediaHeight || null,
      aspect_ratio: item.aspectRatio || null,
      studio_edits: item.studioEdits || null,
      filter_id: item.filterId || null,
    }] : [],
  };
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  onAchievementsClick
}) => {
  // Debug: Lifecycle tracking
  const lifecycle = useRef(createLifecycleLogger('ActivityFeed'));
  
  // Debug: Mount/unmount tracking
  useEffect(() => {
    profileTiming.start('ActivityFeed:load');
    lifecycle.current.onMount({
      userId,
      isOwnProfile,
    });
    return () => {
      lifecycle.current.onUnmount();
    };
  }, []);
  
  // V2: Cursor-based infinite query
  const { 
    items, 
    isLoading, 
    isFetchingNextPage, 
    hasMore, 
    fetchNextPage,
    refetch,
    isError,
  } = useActivityPostsV2(userId);

  const queryClient = useQueryClient();
  
  // Memoize item counts to prevent recalculation on every render
  const { totalItems, videoCount, imageCount } = useMemo(() => {
    let videos = 0;
    let images = 0;
    items.forEach(item => {
      if (item.type === 'video') videos++;
      else images++;
    });
    return { totalItems: items.length, videoCount: videos, imageCount: images };
  }, [items]);
  
  // Track previous values to prevent duplicate logs
  const prevLogState = useRef({ totalItems: 0, isLoading: true });
  
  // Debug: Log query state changes - uses stable primitives as dependencies
  useEffect(() => {
    // Only log when loading state changes
    if (prevLogState.current.isLoading !== isLoading) {
      logQueryState('ActivityFeed:posts', {
        isLoading,
        isFetching: isFetchingNextPage,
        isSuccess: totalItems > 0,
      });
    }
    
    // Only log posts ready ONCE when data first loads (not on every items reference change)
    if (!isLoading && totalItems > 0 && prevLogState.current.totalItems !== totalItems) {
      profileTiming.end('ActivityFeed:load');
      logProfile('data', 'ActivityFeed', '📦 Posts ready', {
        totalItems,
        videoCount,
        imageCount,
        hasMore,
      });
    }
    
    // Update ref for next comparison
    prevLogState.current = { totalItems, isLoading };
  }, [totalItems, isLoading, isFetchingNextPage, hasMore, videoCount, imageCount]);
  
  // Realtime subscription for post_media inserts - secondary safety net
  useRealtimePersonalPosts(userId);
  
  // Content filter state - matching Business Profile
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  
  // Track current fullscreen post and creator
  const [currentFullscreenPostId, setCurrentFullscreenPostId] = useState<string | null>(null);
  const [currentCreatorId, setCurrentCreatorId] = useState<string | null>(null);

  // Convert UnifiedMediaItem[] to GridPost[] for ProfileContentGrid
  const gridPosts = useMemo(() => {
    return items.map(unifiedToGridPost);
  }, [items]);

  // ============ ADAPTIVE PREFETCH (TikTok-level: 3-20 ahead based on network/scroll) ============
  const {
    config: prefetchConfig,
    onIndexChange: onPrefetchIndexChange,
  } = useAdaptivePrefetch();

  // Ready tracking state
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  
  const markReady = useCallback((id: string) => {
    setReadySet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  
  const isReady = useCallback((id: string) => readySet.has(id), [readySet]);

  // Callback ref to prevent stale closures
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;

  // Create video URL map for HLS prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      if (item.type === 'video' && item.playbackUrl) {
        const streamId = uidFromNode({ src: item.playbackUrl });
        if (streamId) {
          map.set(item.postId || item.id, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [items]);

  // Extract video post IDs only
  const videoPostIds = useMemo(() => 
    items
      .filter(item => item.type === 'video')
      .map(item => item.postId || item.id),
    [items]
  );

  // Scroll position tracking state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Trigger adaptive prefetch when posts load or index changes
  useEffect(() => {
    if (videoPostIds.length > 0 && videoUrlMap.size > 0) {
      // Prefetch based on adaptive config
      const { prefetchAhead, prefetchBehind, preloadManifests } = prefetchConfig;
      
      if (preloadManifests) {
        // Prefetch ahead
        for (let i = currentIndex; i < Math.min(currentIndex + prefetchAhead, videoPostIds.length); i++) {
          const url = videoUrlMap.get(videoPostIds[i]);
          if (url) preloadHlsManifest(url);
        }
        // Prefetch behind
        for (let i = Math.max(0, currentIndex - prefetchBehind); i < currentIndex; i++) {
          const url = videoUrlMap.get(videoPostIds[i]);
          if (url) preloadHlsManifest(url);
        }
      }
      
      // Track scroll velocity
      onPrefetchIndexChange();
    }
  }, [videoPostIds, videoUrlMap, currentIndex, prefetchConfig, onPrefetchIndexChange]);

  // Track scroll position using IntersectionObserver
  useEffect(() => {
    const cards = document.querySelectorAll('[data-profile-post-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-profile-post-id');
            const index = items.findIndex(item => (item.postId || item.id) === postId);
            if (index !== -1 && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      { 
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [items, currentIndex]);

  // Calculate ready count
  const readyCount = useMemo(() => {
    let count = 0;
    videoPostIds.forEach(id => {
      if (readySet.has(id)) count++;
    });
    return count;
  }, [videoPostIds, readySet]);

  // Are we ready to show content?
  const isFeedReady = readyCount >= Math.min(MINIMUM_READY_COUNT, videoPostIds.length) || videoPostIds.length === 0;

  // Engagement hooks for fullscreen
  const { toggleLike } = usePostEngagement(currentFullscreenPostId);
  const { toggleFollow } = useUserFollow(currentCreatorId);
  const { deletePost } = usePostDeletion();
  const { user } = useSupabaseSession();

  // Share handler
  const handleSharePost = useCallback((postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: shareUrl,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Copied to clipboard');
      }).catch(() => {
        toast.error("Couldn't copy link");
      });
    }
  }, []);

  // Delete handler - includes actor info for proper cache invalidation
  const handleDeletePost = useCallback(async (postId: string) => {
    await deletePost(postId, 'personal', userId);
  }, [deletePost, userId]);
  const navigate = useNavigate();
  const location = useLocation();

  // Edit handler - navigate to post wizard in edit mode
  const handleEditPost = useCallback((postId: string) => {
    navigate('/create-moment', { state: { editPostId: postId, backgroundLocation: location } });
  }, [navigate, location]);

  // TODO: Wire to new media player
  const openFullscreen = (...args: any[]) => console.log('[Fullscreen] TODO: Wire to new media player', args);

  // Handle item click for ActivityGridV2 - open unified fullscreen player
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    setCurrentFullscreenPostId(item.postId || item.id || null);
    setCurrentCreatorId(item.creator?.id || null);
    openFullscreen(items, index);
  }, [items, openFullscreen]);

  // Handle item click for ProfileContentGrid
  const handleGridPostTap = useCallback((post: GridPost, index: number) => {
    // Find the corresponding UnifiedMediaItem for fullscreen
    const itemIndex = items.findIndex(item => (item.postId || item.id) === post.id);
    if (itemIndex >= 0) {
      setCurrentFullscreenPostId(post.id);
      setCurrentCreatorId(items[itemIndex]?.creator?.id || null);
      openFullscreen(items, itemIndex);
    }
  }, [items, openFullscreen]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  // Pull-to-refresh handler
  const handlePullToRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...postKeys.actorPosts('personal', userId), 'v2'],
    });
  }, [queryClient, userId]);

  // Error state
  if (isError && !isLoading && items.length === 0) {
    return (
      <PullToRefreshContainer onRefresh={handlePullToRefresh}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">Couldn't load posts</p>
          <button
            onClick={() => refetch()}
            className="rounded-full bg-emerald-600 text-white text-sm font-medium px-5 py-2 active:scale-[0.97] transition-transform"
          >
            Try Again
          </button>
        </div>
      </PullToRefreshContainer>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      {/* Creator Profile Section - shows only for creators */}
      <CreatorProfileSection
        userId={userId}
        isOwnProfile={isOwnProfile}
        className="mb-4"
      />

      {/* Filter Chips - shared component */}
      <div className="px-2 py-3">
        <ContentFilterPills
          filters={FILTER_OPTIONS}
          activeFilter={activeFilter}
          onFilterChange={(filter) => setActiveFilter(filter as ContentFilter)}
        />
      </div>

      {/* Content Grid */}
      <div className="px-0 pb-16">
        {activeFilter === 'all' ? (
          // "All" filter uses ActivityGridV2 with premium PP→L layout
          <ActivityGridV2
            items={items}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onItemClick={handleItemClick}
            isReady={isReady}
            onReady={(id) => markReadyRef.current(id)}
            isFeedReady={isFeedReady}
            isOwnProfile={isOwnProfile}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
          />
        ) : (
          // Specific filters use ProfileContentGrid (shared with Business Profile)
          <ProfileContentGrid
            posts={gridPosts}
            filter={activeFilter}
            onPostTap={handleGridPostTap}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            canCreate={isOwnProfile}
            onCreatePost={() => {
              // Navigate to post creation
              window.location.href = '/post/create';
            }}
            profileType="personal"
            profileName={profileDisplayName}
            isTaggedTab={false}
            isReady={isReady}
            onReady={(id) => markReadyRef.current(id)}
          />
        )}
      </div>

      {/* Unified Fullscreen Player - rendered via context provider in App.tsx */}

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={profileDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isOwnProfile}
      />

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />
    </PullToRefreshContainer>
  );
};

export default ActivityFeed;
