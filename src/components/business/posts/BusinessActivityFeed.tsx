/**
 * BusinessActivityFeed - Premium activity feed with Activity/Tagged sub-tabs
 * Phase 1-6 implementation for business profile posts
 * Now with infinite scroll, duration-based video filters, shared grid system,
 * AND video ready queue + LoadingBoundary pattern for smooth loading
 */

import React, { useState, useCallback, useMemo, useLayoutEffect, useRef, useEffect } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { useBusinessTaggedPosts, useHideTaggedPost } from '@/hooks/useBusinessTaggedPosts';
import { useInfiniteBusinessPosts } from '@/hooks/useInfiniteBusinessPosts';
import { useInfiniteBusinessTaggedPosts } from '@/hooks/useInfiniteBusinessTaggedPosts';
import { useRealtimeBusinessPosts } from '@/hooks/useRealtimeBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useActiveActor } from '@/context/ActiveActorContext';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';

import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Plus, Users, RefreshCw, Loader2 } from 'lucide-react';
import BusinessPostCard from './BusinessPostCard';
import TaggedPostCard from './TaggedPostCard';
import { toast } from 'sonner';

// Shared grid components
import { 
  ProfileContentGrid, 
  ContentFilter,
  GridPost 
} from '@/components/grids';

// Fullscreen player integration
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { UnifiedMediaItem } from '@/components/shared/grid/types';

interface BusinessActivityFeedProps {
  businessId: string;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  membership: BusinessMembership | null;
}

type FeedTab = 'activity' | 'tagged';
type FilterType = ContentFilter;

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'longform', label: 'Long-form' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'images', label: 'Images' },
];

// Minimum videos ready before showing content
const MINIMUM_READY_COUNT = 2;

export function BusinessActivityFeed({
  businessId,
  businessName,
  businessLogo,
  followerCount = 0,
  membership,
}: BusinessActivityFeedProps) {
  // Use infinite scroll hooks
  const {
    items: activityPosts,
    isLoading: postsLoading,
    hasMore: hasMoreActivity,
    fetchNextPage: fetchMoreActivity,
    isFetchingNextPage: isFetchingActivity,
  } = useInfiniteBusinessPosts({ businessId, filterType: 'all' });

  const {
    items: taggedPosts,
    isLoading: taggedLoading,
    hasMore: hasMoreTagged,
    fetchNextPage: fetchMoreTagged,
    isFetchingNextPage: isFetchingTagged,
  } = useInfiniteBusinessTaggedPosts({ businessId, filterType: 'all' });

  useRealtimeBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { hidePost } = useHideTaggedPost(businessId);

  const [feedTab, setFeedTab] = useState<FeedTab>('activity');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Infinite scroll observer refs
  const activityObserverRef = useRef<HTMLDivElement>(null);
  const taggedObserverRef = useRef<HTMLDivElement>(null);

  // ============ ADAPTIVE PREFETCH (TikTok-level: 3-20 range) ============
  const { config: prefetchConfig, onIndexChange: onPrefetchIndexChange } = useAdaptivePrefetch();
  
  // Video ready queue with adaptive prefetch distances
  const {
    initiatePrefetch,
    markReady,
    isReady,
    readySet,
  } = useVideoReadyQueue({
    prefetchAhead: prefetchConfig.prefetchAhead,
    prefetchBehind: prefetchConfig.prefetchBehind,
    onVideoReady: (id) => console.log(`[BusinessActivityFeed] Video ${id.substring(0, 8)} marked ready`),
  });

  // Callback ref to prevent stale closures
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;


  const canManage = membership?.canManage ?? false;
  const hasPreloadedFirst = useRef(false);

  // Get filtered posts - apply client-side filter for duration
  const filteredActivityPosts = useMemo(() => {
    if (activeFilter === 'all') return activityPosts;
    
    return activityPosts.filter((post) => {
      const hasVideo = post.post_media?.some((m: any) => m.media_type === 'video');
      const hasImage = post.post_media?.some((m: any) => m.media_type === 'image');
      
      if (activeFilter === 'longform') {
        return post.post_media?.some((m: any) => 
          m.media_type === 'video' && (m.duration_seconds || 0) >= 240
        );
      }
      if (activeFilter === 'shorts') {
        return post.post_media?.some((m: any) => {
          const duration = m.duration_seconds || 0;
          return m.media_type === 'video' && duration > 0 && duration < 240;
        });
      }
      if (activeFilter === 'images') return hasImage && !hasVideo;
      return true;
    });
  }, [activityPosts, activeFilter]);

  const filteredTaggedPosts = useMemo(() => {
    if (activeFilter === 'all') return taggedPosts;
    
    return taggedPosts.filter((post) => {
      const hasVideo = post.post_media?.some((m: any) => m.media_type === 'video');
      const hasImage = post.post_media?.some((m: any) => m.media_type === 'image');
      
      if (activeFilter === 'longform') {
        return post.post_media?.some((m: any) => 
          m.media_type === 'video' && (m.duration_seconds || 0) >= 240
        );
      }
      if (activeFilter === 'shorts') {
        return post.post_media?.some((m: any) => {
          const duration = m.duration_seconds || 0;
          return m.media_type === 'video' && duration > 0 && duration < 240;
        });
      }
      if (activeFilter === 'images') return hasImage && !hasVideo;
      return true;
    });
  }, [taggedPosts, activeFilter]);

  const filteredPosts = feedTab === 'activity' ? filteredActivityPosts : filteredTaggedPosts;
  const hasMore = feedTab === 'activity' ? hasMoreActivity : hasMoreTagged;
  const isFetching = feedTab === 'activity' ? isFetchingActivity : isFetchingTagged;
  const fetchMore = feedTab === 'activity' ? fetchMoreActivity : fetchMoreTagged;

  // Create video URL map for HLS prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredPosts.forEach(post => {
      const media = post.post_media?.[0];
      if (media?.media_type === 'video' && media.media_url) {
        const streamId = uidFromNode({ src: media.media_url });
        if (streamId) {
          map.set(post.id, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [filteredPosts]);

  // Extract video post IDs only
  const videoPostIds = useMemo(() => 
    filteredPosts
      .filter(p => p.post_media?.[0]?.media_type === 'video')
      .map(p => p.id),
    [filteredPosts]
  );

  // Calculate ready count from the readySet
  const readyCount = useMemo(() => {
    let count = 0;
    videoPostIds.forEach(id => {
      if (readySet.has(id)) count++;
    });
    return count;
  }, [videoPostIds, readySet]);

  // Are we ready to show content?
  const isFeedReady = readyCount >= Math.min(MINIMUM_READY_COUNT, videoPostIds.length) || videoPostIds.length === 0;

  // Convert business posts to UnifiedMediaItem[] for fullscreen player
  const fullscreenPlaylist = useMemo((): UnifiedMediaItem[] => {
    return filteredPosts
      .filter(p => p.post_media?.[0]?.media_type === 'video')
      .map(p => {
        const media = p.post_media?.[0] as any;
        const userProfile = (p as any).user_profiles;
        const post = p as any;
        return {
          id: media?.id || p.id,
          postId: p.id,
          type: 'video' as const,
          url: media?.media_url || '',
          thumbnailUrl: media?.poster_url || undefined,
          playbackUrl: media?.media_url || undefined,
          durationSeconds: media?.duration_seconds || null,
          likes: post.like_count || post.post_likes?.[0]?.count || 0,
          courseName: post.golf_courses?.name || post.course_ratings?.golf_courses?.name || undefined,
          golfCourseId: post.golf_courses?.id || post.course_ratings?.golf_courses?.id || undefined,
          creator: {
            id: p.user_id || businessId,
            name: userProfile?.display_name || userProfile?.username || businessName || '',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || businessLogo || undefined,
          },
          mediaWidth: media?.width || undefined,
          mediaHeight: media?.height || undefined,
          aspectRatio: media?.aspect_ratio || undefined,
          studioEdits: media?.studio_edits || undefined,
          filterId: media?.filter_id || undefined,
          isReview: !!post.course_ratings,
          reviewRating: post.course_ratings?.overall_rating || undefined,
          sourceReviewId: post.course_ratings?.id || undefined,
        };
      });
  }, [filteredPosts, businessId, businessName, businessLogo]);

  // Unified fullscreen player hook
  const { openFullscreen } = useUnifiedFullscreen('unified', {
    allowLandscape: true,
    onLoadMore: hasMore ? fetchMore : undefined,
    hasMore,
    isLoadingMore: isFetching,
  });

  // Handle post tap to open fullscreen viewer
  const handlePostTap = useCallback((post: GridPost, index: number) => {
    // Find the tapped post's index in the video-only playlist
    const playlistIndex = fullscreenPlaylist.findIndex(item => item.postId === post.id);
    if (playlistIndex >= 0) {
      openFullscreen(fullscreenPlaylist, playlistIndex, post.id);
    }
  }, [fullscreenPlaylist, openFullscreen]);

  // Trigger prefetch when posts load or index changes
  useEffect(() => {
    if (videoPostIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoPostIds, currentIndex, videoUrlMap);
    }
  }, [videoPostIds, videoUrlMap, currentIndex, initiatePrefetch]);

  // Track scroll position using IntersectionObserver + trigger adaptive prefetch
  useEffect(() => {
    const cards = document.querySelectorAll('[data-business-post-id]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-business-post-id');
            const index = filteredPosts.findIndex(p => p.id === postId);
            if (index !== -1 && index !== currentIndex) {
              setCurrentIndex(index);
              // Notify adaptive prefetch of scroll event for velocity tracking
              onPrefetchIndexChange();
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
  }, [filteredPosts, currentIndex, onPrefetchIndexChange]);

  // Lazy loading - only mount posts near viewport
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: filteredPosts.length,
    initialVisible: 3,
    preloadViewports: 2,
    estimatedRowHeight: 400,
  });

  // Paced loading state (Watch tab standard)
  const MIN_LOADING_DISPLAY_MS = 600;
  const loadStartTimeRef = useRef<number>(0);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const prevPostsCountRef = useRef(filteredPosts.length);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);

  // Infinite scroll observer for Activity tab - Watch tab standard: rootMargin 0px
  useEffect(() => {
    if (feedTab !== 'activity' || !hasMoreActivity) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingActivity && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          loadStartTimeRef.current = Date.now();
          console.log('[BusinessActivityFeed] 📜 Loading more activity posts...');
          fetchMoreActivity();
          setTimeout(() => { loadingMoreRef.current = false; }, 1000);
        }
      },
      { rootMargin: '0px' } // Watch tab standard: trigger at bottom
    );

    if (activityObserverRef.current) {
      observer.observe(activityObserverRef.current);
    }

    return () => observer.disconnect();
  }, [feedTab, hasMoreActivity, fetchMoreActivity, isFetchingActivity]);

  // Infinite scroll observer for Tagged tab - Watch tab standard: rootMargin 0px
  useEffect(() => {
    if (feedTab !== 'tagged' || !hasMoreTagged) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingTagged && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          loadStartTimeRef.current = Date.now();
          console.log('[BusinessActivityFeed] 📜 Loading more tagged posts...');
          fetchMoreTagged();
          setTimeout(() => { loadingMoreRef.current = false; }, 1000);
        }
      },
      { rootMargin: '0px' } // Watch tab standard: trigger at bottom
    );

    if (taggedObserverRef.current) {
      observer.observe(taggedObserverRef.current);
    }

    return () => observer.disconnect();
  }, [feedTab, hasMoreTagged, fetchMoreTagged, isFetchingTagged]);

  // Handle paced loading when new posts arrive
  useEffect(() => {
    const prevCount = prevPostsCountRef.current;
    const newCount = filteredPosts.length;
    
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        setIsPacingDelay(true);
        const timer = setTimeout(() => {
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          setTimeout(() => setNewlyLoadedStartIndex(null), 500);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        setTimeout(() => setNewlyLoadedStartIndex(null), 500);
      }
    }
    
    prevPostsCountRef.current = newCount;
  }, [filteredPosts.length]);

  // Show loading indicator
  const showBottomLoader = isFetching || isPacingDelay;

  // Eager preload first video's HLS manifest on mount
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    
    const firstVideoPost = activityPosts.find((p: any) => 
      p.post_media?.some((m: any) => m.media_type === 'video')
    );
    
    if (firstVideoPost) {
      const videoMedia = firstVideoPost.post_media?.find((m: any) => m.media_type === 'video');
      if (videoMedia?.media_url) {
        const uid = uidFromNode({ media_url: videoMedia.media_url });
        if (uid) {
          preloadHlsManifest(generateStreamHlsUrl(uid));
          hasPreloadedFirst.current = true;
        }
      }
    }
  }, [activityPosts]);

  const handleCreatePost = useCallback(() => {
    const businessActor = availableActors.find(
      (a) => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
    setIsComposerOpen(true);
  }, [businessId, availableActors, setActiveActor]);

  const handleComposerSubmit = useCallback(
    async (data: any) => {
      if (!user) return;
      setIsSubmitting(true);

      await submitPost({
        user,
        content: data.caption || '',
        mediaFiles: data.files || [],
        mediaItems: data.mediaItems,
        selectedTags: [],
        courseInfo: data.selectedCourse,
        studioEditsByMediaId: data.studioEditsByMediaId,
        actorType: 'business',
        actorId: businessId,
        onSuccess: () => {
          setIsComposerOpen(false);
          setComposerMedia([]);
          setIsSubmitting(false);
          queryClient.invalidateQueries({ queryKey: ['business-posts-infinite', businessId] });
          queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
          queryClient.invalidateQueries({ queryKey: ['actor-posts-count', 'business', businessId] });
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    },
    [user, businessId, submitPost, queryClient]
  );

  const handleComposerClose = useCallback(() => {
    setIsComposerOpen(false);
    setComposerMedia([]);
  }, []);

  const handleHideTaggedPost = useCallback(async (postId: string) => {
    try {
      await hidePost(postId);
      queryClient.invalidateQueries({ queryKey: ['business-tagged-posts-infinite', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-tagged-posts', businessId] });
      toast.success('Post hidden from Tagged');
    } catch (error) {
      toast.error('Failed to hide post');
    }
  }, [hidePost, businessId, queryClient]);

  const isLoading = feedTab === 'activity' ? postsLoading : taggedLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        {/* Sub-tabs skeleton */}
        <div className="flex justify-center py-2 gap-4">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
        {/* Filter pills skeleton */}
        <div className="flex justify-center py-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
        {/* Post cards skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-sq-md border border-border/50 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-sq-sm bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-64 bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs: Activity / Tagged */}
      <div className="flex justify-center border-b border-border/50 bg-white">
        <button
          onClick={() => setFeedTab('activity')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            feedTab === 'activity'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Activity
          {feedTab === 'activity' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setFeedTab('tagged')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            feedTab === 'tagged'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tagged
          {feedTab === 'tagged' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Controls container */}
      <div className="flex flex-col items-center gap-[10px] py-3">
        {/* Filter pills */}
        <div className="w-full max-w-[520px] mx-auto flex justify-center gap-2 px-4">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeFilter === key
                  ? 'bg-[#e2e8f0] text-slate-800'
                  : 'bg-white text-foreground border border-border hover:bg-muted/50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Create post CTA - only on Activity tab for admins */}
        {feedTab === 'activity' && canManage && (
          <div className="w-full max-w-[520px] mx-auto px-4">
            <button
              onClick={handleCreatePost}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'min-h-[46px] rounded-sq-md',
                'bg-white border border-border/60',
                'text-foreground text-sm font-medium',
                'shadow-sm hover:shadow-md',
                'transition-all duration-150',
                'active:scale-[0.98] active:shadow-sm'
              )}
            >
              <Plus className="h-4 w-4" />
              Create post
            </button>
          </div>
        )}
      </div>

      {/* Feed content */}
      {filteredPosts.length === 0 ? (
        <EmptyState 
          tab={feedTab} 
          filter={activeFilter}
          canManage={canManage}
          businessName={businessName}
          onCreatePost={handleCreatePost}
        />
      ) : activeFilter !== 'all' ? (
        /* Use shared grid system for longform/shorts/images filters */
        <div
          className="-mx-5 px-0 mt-3"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div className="py-3 md:py-4">
            <ProfileContentGrid
              posts={filteredPosts as unknown as GridPost[]}
              filter={activeFilter}
              onPostTap={handlePostTap}
              isLoading={isFetching}
              hasMore={hasMore}
              onLoadMore={fetchMore}
              canCreate={canManage && feedTab === 'activity'}
              onCreatePost={handleCreatePost}
              profileType="business"
              profileName={businessName}
              isTaggedTab={feedTab === 'tagged'}
            />
          </div>
        </div>
      ) : (
        /* Use original card layout for 'all' filter with LoadingBoundary */
        <div
          className="-mx-5 px-0 mt-3"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          {/* LoadingBoundary - show skeleton until videos are ready */}
          {!isFeedReady ? (
            <BusinessActivitySkeleton />
          ) : (
            <div className="flex flex-col gap-3 md:gap-4 py-3 md:py-4">
              {feedTab === 'activity' ? (
                <>
                  {filteredPosts.map((post, index) => {
                    const isVideo = post.post_media?.[0]?.media_type === 'video';
                    return (
                      <div
                        key={post.id}
                        ref={(el) => registerTile(index, el)}
                        data-lazy-index={index}
                        data-business-post-id={post.id}
                      >
                        {visibleIndices.has(index) ? (
                          <BusinessPostCard
                            post={post as unknown as BusinessPost}
                            businessId={businessId}
                            businessName={businessName}
                            businessLogo={businessLogo}
                            followerCount={followerCount}
                            canManage={canManage}
                            isVideoReady={isVideo ? isReady(uidFromNode({ src: post.post_media?.[0]?.media_url }) || post.id) : true}
                            onReady={(id) => markReadyRef.current(id)}
                          />
                        ) : (
                          <div className="bg-white rounded-sq-md border border-border/50 overflow-hidden min-h-[300px]">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-sq-sm bg-muted relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-muted rounded relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                  </div>
                                  <div className="h-3 w-24 bg-muted rounded relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="h-48 bg-muted relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-shimmer-down" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Infinite scroll trigger for Activity */}
                  {hasMoreActivity && (
                    <div ref={activityObserverRef} className="h-4" />
                  )}
                  
                  {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
                  {showBottomLoader && feedTab === 'activity' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* End state for Activity */}
                  {!hasMoreActivity && filteredPosts.length > 0 && !showBottomLoader && (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
                      <p className="text-xs font-medium">You've seen all posts</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredPosts.map((post, index) => {
                    const isVideo = post.post_media?.[0]?.media_type === 'video';
                    return (
                      <div
                        key={post.id}
                        ref={(el) => registerTile(index, el)}
                        data-lazy-index={index}
                        data-business-post-id={post.id}
                      >
                        {visibleIndices.has(index) ? (
                          <TaggedPostCard
                            post={post as any}
                            canManage={canManage}
                            onHide={handleHideTaggedPost}
                            isVideoReady={isVideo ? isReady(uidFromNode({ src: post.post_media?.[0]?.media_url }) || post.id) : true}
                            onReady={(id) => markReadyRef.current(id)}
                          />
                        ) : (
                          <div className="bg-white rounded-sq-md border border-border/50 overflow-hidden min-h-[300px]">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                </div>
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-muted rounded relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                  </div>
                                  <div className="h-3 w-24 bg-muted rounded relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="h-48 bg-muted relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-shimmer-down" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Infinite scroll trigger for Tagged */}
                  {hasMoreTagged && (
                    <div ref={taggedObserverRef} className="h-4" />
                  )}
                  
                  {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
                  {showBottomLoader && feedTab === 'tagged' && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* End state for Tagged */}
                  {!hasMoreTagged && filteredPosts.length > 0 && !showBottomLoader && (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
                      <p className="text-xs font-medium">You've seen all tagged posts</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Composer Modal */}
      <EnhancedCreateMomentModalCinematic
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        onSubmit={handleComposerSubmit}
        isSubmitting={isSubmitting}
        mediaItems={composerMedia}
        onMediaChange={setComposerMedia}
        initialActorOverride={{ type: 'business', id: businessId }}
      />
    </div>
  );
}

// Skeleton for LoadingBoundary - TikTok-level with staggered shimmer
function BusinessActivitySkeleton() {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return (
    <div className="flex flex-col gap-4 py-3 md:py-4">
      {[0, 1, 2].map(i => (
        <div 
          key={i} 
          className="bg-white rounded-sq-md border border-border/50 overflow-hidden"
          style={{ 
            animationDelay: prefersReducedMotion ? '0ms' : `${i * 100}ms`,
          }}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sq-sm bg-muted relative overflow-hidden">
                {!prefersReducedMotion && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-muted rounded relative overflow-hidden">
                  {!prefersReducedMotion && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                  )}
                </div>
                <div className="h-3 w-20 bg-muted rounded relative overflow-hidden">
                  {!prefersReducedMotion && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
            {!prefersReducedMotion && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-shimmer-down" />
            )}
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({
  tab,
  filter,
  canManage,
  businessName,
  onCreatePost,
}: {
  tab: FeedTab;
  filter: FilterType;
  canManage: boolean;
  businessName?: string;
  onCreatePost: () => void;
}) {
  // Filter-specific empty states
  if (filter === 'longform') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
          <ImageIcon className="h-7 w-7 text-[#64748b]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No long-form videos yet</p>
        <p className="text-sm text-muted-foreground">
          {tab === 'activity' ? 'Share video content 4+ minutes to engage your followers.' : 'No long-form videos have tagged this business yet.'}
        </p>
      </div>
    );
  }

  if (filter === 'shorts') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
          <ImageIcon className="h-7 w-7 text-[#64748b]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No shorts yet</p>
        <p className="text-sm text-muted-foreground">
          {tab === 'activity' ? 'Share short videos under 4 minutes.' : 'No short videos have tagged this business yet.'}
        </p>
      </div>
    );
  }

  if (filter === 'images') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
          <ImageIcon className="h-7 w-7 text-[#64748b]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No images yet</p>
        <p className="text-sm text-muted-foreground">
          {tab === 'activity' ? 'Share photos to showcase your business.' : 'No image posts have tagged this business yet.'}
        </p>
      </div>
    );
  }

  // Activity tab empty state
  if (tab === 'activity') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
          <ImageIcon className="h-7 w-7 text-[#64748b]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No posts yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          {canManage
            ? 'Create your first update for your members.'
            : `No posts yet from ${businessName || 'this business'}.`}
        </p>
        {canManage && (
          <button
            className="rounded-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 text-sm font-medium transition-colors"
            onClick={onCreatePost}
          >
            Create your first post
          </button>
        )}
      </div>
    );
  }

  // Tagged tab empty state
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center">
        <Users className="h-7 w-7 text-[#64748b]" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">No tagged posts yet</p>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        When golfers or businesses tag {businessName || 'this club'}, you'll see it here.
      </p>
    </div>
  );
}

export default BusinessActivityFeed;
