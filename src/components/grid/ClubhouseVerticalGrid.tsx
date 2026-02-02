/**
 * ClubhouseVerticalGrid - Clubhouse vertical feed using UniversalMediaGrid patterns
 * 
 * This component wraps the unified grid hooks and types while maintaining
 * Clubhouse-specific features like cinematic overlays, double-tap likes,
 * and the runtime bridge.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { LoadingBoundary } from '@/components/ui/LoadingBoundary';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { useUserTop100CourseIds } from '@/hooks/useUserTop100CourseIds';
import { useClubhouseRuntimeBridge } from '@/hooks/useClubhouseRuntimeBridge';
import { useSoftResume } from '@/hooks/useSoftResume';

import { Top100OverlayPills } from '@/components/clubhouse/Top100OverlayPills';
import { Squircle } from '@/components/ui/squircle';
import { CinematicActionRail, CreatorCapsule, CommentsPage } from '@/components/clubhouse/cinematic';
import { VideoScrubber } from '@/components/video/VideoScrubber';

import { useVerticalFeedLogic } from './hooks/useVerticalFeedLogic';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';

import { logFirstCardRender } from '@/utils/bootTimeline';

import { ClubhouseMusicPlayer } from '@/components/clubhouse/ClubhouseMusicPlayer';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { isReviewPost, extractReviewData, extractUserData } from '@/lib/postHelpers';
import { prefetchPosterWithFallback, isPosterFailed } from '@/utils/posterPrefetch';
import { hlsBlobCache } from '@/utils/hlsBlobCache';

interface ClubhouseVerticalGridProps {
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onCurrentPostChange?: (index: number) => void;
  onScroll?: (scrollTop: number) => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
  onActiveVideoRefChange?: (ref: HTMLVideoElement | null) => void;
  onCommentsOpenChange?: (isOpen: boolean) => void;
  onProfileOpenChange?: (isOpen: boolean) => void;
  chromeState?: 'visible' | 'hidden';
  onPostDetailsOpen?: () => void;
  onDismissNavOverlay?: () => void;
  onNavOverlayRequest?: () => void;
  onTopZoneChange?: (isAtTop: boolean) => void;
  onMeaningfulInteraction?: () => void;
  onFirstFrameReady?: () => void;
  /** Post ID to focus on for deep linking (finds index in filteredPosts) */
  focusPostId?: string;
}

// ============ VideoWithAutoplay Component ============
// INSTANT VIDEO: Mounts paused with preload="auto" to decode first frame
// before playing. Eliminates loading spinners and poster→video jump.

const VideoWithAutoplay = React.memo(forwardRef<HTMLVideoElement, {
  src: string;
  muted: boolean;
  className: string;
  isMobile?: boolean;
  shouldAttach?: boolean;
  autoplay?: boolean;
  isNearby?: boolean;
  isActive?: boolean;
  postId: string;
  eagerMount?: boolean;
  onFirstFrameReady?: () => void;
  /** Pre-computed poster URL for instant background display */
  posterUrl?: string;
}>(({ src, muted, className, isMobile: isMobileProp = false, shouldAttach = false, autoplay = false, isNearby = true, isActive = true, postId, eagerMount = false, onFirstFrameReady, posterUrl: externalPosterUrl }, ref) => {
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : null;
  // INSTANT VIDEO: Use external poster URL if provided (prefetched), fallback to generating
  // Skip if poster is known to have failed loading
  const generatedPosterUrl = externalPosterUrl || (uid ? generateStreamThumbnailUrl(uid, { height: 800, fit: 'cover' }) : undefined);
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : undefined;

  const playerRef = React.useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = React.useRef(false);
  const [hasFirstFrame, setHasFirstFrame] = React.useState(false);

  React.useImperativeHandle(ref, () => playerRef.current?.getElement() as HTMLVideoElement);

  React.useEffect(() => {
    if (!playerRef.current) return;
    
    if (shouldAttach || eagerMount) {
      playerRef.current.attach();
    } else if (!isNearby) {
      playerRef.current.detach();
    }
  }, [shouldAttach, isNearby, eagerMount]);

  // Reset ready flag when src changes
  React.useEffect(() => {
    hasReportedReadyRef.current = false;
    setHasFirstFrame(false);
  }, [src]);

  // INSTANT VIDEO: Use loadeddata for first frame (faster than canplaythrough)
  const handleLoadedData = React.useCallback(() => {
    setHasFirstFrame(true);
  }, []);

  // INSTANT VIDEO: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = React.useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
          muted={muted}
          loop
          // Autoplay when visible and ready to attach
          autoplay={autoplay && isActive && (shouldAttach || eagerMount)}
          showMuteButton={false}
          showPlayButton={false}
          showScrubber={false}
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
          managedByMediaRuntime={false}
          externallyManaged={false}
          mediaId={uid || postId}
          // INSTANT VIDEO: preload="auto" to buffer ahead
          preload="auto"
          onLoadedData={handleLoadedData}
          onCanPlayThrough={handleCanPlayThrough}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
      
      {/* Readability gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
        }}
      />
    </div>
  );
}), (prevProps, nextProps) => (
  prevProps.src === nextProps.src &&
  prevProps.muted === nextProps.muted &&
  prevProps.shouldAttach === nextProps.shouldAttach &&
  prevProps.autoplay === nextProps.autoplay &&
  prevProps.isNearby === nextProps.isNearby &&
  prevProps.isActive === nextProps.isActive &&
  prevProps.postId === nextProps.postId &&
  prevProps.eagerMount === nextProps.eagerMount
));

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

// ============ Main Component ============

const ClubhouseVerticalGrid: React.FC<ClubhouseVerticalGridProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onCurrentPostChange,
  onScroll,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onActiveVideoRefChange,
  onCommentsOpenChange,
  onProfileOpenChange,
  chromeState = 'visible',
  onPostDetailsOpen,
  onDismissNavOverlay,
  onNavOverlayRequest,
  onTopZoneChange,
  onMeaningfulInteraction,
  onFirstFrameReady,
  focusPostId,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const queryClient = useQueryClient();
  
  const PORTRAIT_MIN_AR = 1.2;

  // Portrait filter helper
  const isPortrait = useCallback((media?: { width?: number; height?: number; aspect_ratio?: number }) => {
    if (!media) return false;
    if (media.width && media.height) return media.height / media.width >= PORTRAIT_MIN_AR;
    if (media.aspect_ratio) return 1 / media.aspect_ratio >= PORTRAIT_MIN_AR;
    return false;
  }, []);

  // Filter and deduplicate posts
  const filteredPosts = useMemo(() => {
    // First deduplicate by post ID to prevent React key collisions
    const seen = new Set<string>();
    const dedupedPosts = posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });

    const shortsOnly = dedupedPosts.filter(post => {
      // Review posts bypass video-only requirement
      const isReviewPost = post.categories?.includes('review');
      
      if (isReviewPost) {
        // Review posts: allow if they have any media (photo or video)
        const hasMedia = post.media && post.media.length > 0;
        if (!hasMedia) return false;
        return true; // Allow review posts through
      }
      
      // Non-review posts: require video with duration < 120s
      if (post.type !== 'video') return false;
      if (typeof post.durationSeconds !== 'number') return false;
      if (post.durationSeconds >= 120) return false;
      return true;
    });

    if (!FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) return shortsOnly;
    
    const filtered = shortsOnly.filter(post => {
      // Review posts bypass portrait check
      if (post.categories?.includes('review')) {
        return true;
      }
      
      const media = post.media?.[0];
      if (!media) return false;
      const mediaWithDimensions = media as any;
      return isPortrait({
        width: mediaWithDimensions.width,
        height: mediaWithDimensions.height,
        aspect_ratio: mediaWithDimensions.aspect_ratio
      });
    });

    return filtered;
  }, [posts, isPortrait]);

  // Create videoUrlMap for ready queue prefetch
  // CRITICAL: Use stream UIDs, not post IDs, for cache consistency
  // The HLSPlayer extracts stream UID from the HLS URL for cache lookup
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredPosts.forEach(post => {
      if (post.media?.[0]?.media_url) {
        const streamId = uidFromNode({ src: post.media[0].media_url });
        if (streamId) {
          // Key is stream UID, value is full HLS URL
          map.set(streamId, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [filteredPosts]);

  // POSTER PREFETCH: Create map of post ID -> poster thumbnail URL for instant display
  const posterUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredPosts.forEach(post => {
      if (post.media?.[0]?.media_url) {
        const streamId = uidFromNode({ src: post.media[0].media_url });
        if (streamId) {
          // Generate poster URL with height optimized for mobile displays
          map.set(post.id, generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' }));
        }
      }
    });
    return map;
  }, [filteredPosts]);

  // CRITICAL: Use stream UIDs for video IDs to match cache keys
  const videoIds = useMemo(() => {
    return filteredPosts.map(post => {
      const streamId = uidFromNode({ src: post.media?.[0]?.media_url });
      return streamId || post.id; // Fallback to post ID if no stream UID
    });
  }, [filteredPosts]);

  // Map postId → mediaId (cloudflare UID) for tap handlers
  // This ensures tap-to-pause/play uses the correct runtime registration ID
  const postIdToMediaId = useMemo(() => {
    const map = new Map<string, string>();
    filteredPosts.forEach(post => {
      const streamId = uidFromNode({ src: post.media?.[0]?.media_url });
      map.set(post.id, streamId || post.id);
    });
    return map;
  }, [filteredPosts]);

  // Calculate initial index from focusPostId in FILTERED posts (fixes race condition)
  const initialIndex = useMemo(() => {
    if (!focusPostId || filteredPosts.length === 0) return 0;
    
    const idx = filteredPosts.findIndex(p => p.id === focusPostId);
    
    if (idx === -1) {
      return 0;
    }
    
    return idx;
  }, [focusPostId, filteredPosts]);

  // Use vertical feed logic hook
  const {
    scrollViewRef,
    currentIndex,
    visualIndex,
    shouldAttachMap,
    autoplayMap,
    itemRefs,
    videoRefs,
    handleScroll: internalHandleScroll,
    handleFirstFrameReady,
    registerItemRef,
    registerVideoRef,
    isNearby,
  } = useVerticalFeedLogic({
    posts: filteredPosts,
    onCurrentIndexChange: onCurrentPostChange,
    onLoadMore,
    hasMore,
    isLoadingMore,
    onFirstFrameReady,
    initialIndex,
  });

  // Video ready queue for Instagram-style prefetch
  const {
    initiatePrefetch,
    markReady,
    isReady,
  } = useVideoReadyQueue({
    prefetchAhead: 12,
    prefetchBehind: 6,
    // Removed verbose logging callback to reduce console spam
  });

  // Stable refs to prevent dependency loops
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;
  const initiatePrefetchRef = useRef(initiatePrefetch);
  initiatePrefetchRef.current = initiatePrefetch;
  const videoIdsRef = useRef(videoIds);
  videoIdsRef.current = videoIds;
  const videoUrlMapRef = useRef(videoUrlMap);
  videoUrlMapRef.current = videoUrlMap;
  const posterUrlMapRef = useRef(posterUrlMap);
  posterUrlMapRef.current = posterUrlMap;

  // Trigger prefetch when posts load or index changes
  // CRITICAL: Use refs and minimal deps to prevent infinite loops
  // POSTER PREFETCH: Prefetch 5 posters in each direction for instant display
  const postsLengthRef = useRef(0);
  const lastPrefetchIndexRef = useRef(-1);
  
  useEffect(() => {
    const shouldPrefetch = 
      (filteredPosts.length !== postsLengthRef.current) || // New posts loaded
      (Math.abs(currentIndex - lastPrefetchIndexRef.current) >= 2); // Scrolled (more aggressive for posters)
    
    if (shouldPrefetch && videoIdsRef.current.length > 0 && videoUrlMapRef.current.size > 0) {
      postsLengthRef.current = filteredPosts.length;
      lastPrefetchIndexRef.current = currentIndex;
      
      // Prefetch HLS manifests
      initiatePrefetchRef.current(videoIdsRef.current, currentIndex, videoUrlMapRef.current);
      
      // POSTER PREFETCH: Prefetch poster images with fallback support
      const posterPrefetchAhead = 5;
      const posterPrefetchBehind = 5;
      const startIdx = Math.max(0, currentIndex - posterPrefetchBehind);
      const endIdx = Math.min(filteredPosts.length, currentIndex + posterPrefetchAhead + 1);
      
      // Collect stream UIDs for posts in range
      const streamUidsToFetch: string[] = [];
      for (let i = startIdx; i < endIdx; i++) {
        const post = filteredPosts[i];
        if (post?.media?.[0]?.media_url) {
          const streamId = uidFromNode({ src: post.media[0].media_url });
          if (streamId) {
            streamUidsToFetch.push(streamId);
          }
        }
      }
      
      // Prefetch with fallback support (batched, 4 at a time)
      if (streamUidsToFetch.length > 0) {
        const prefetchBatch = async () => {
          const batchSize = 4;
          for (let i = 0; i < streamUidsToFetch.length; i += batchSize) {
            const batch = streamUidsToFetch.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(uid => prefetchPosterWithFallback(uid, undefined, 800))
            );
          }
        };
        prefetchBatch();
      }
    }
  }, [filteredPosts.length, currentIndex, filteredPosts]); // Minimal dependencies

  // Runtime bridge
  const runtimeBridge = useClubhouseRuntimeBridge({
    posts: filteredPosts,
    currentIndex,
    videoRefs,
    itemRefs,
  });

  // Soft resume hook for smooth audio ramp
  const { softResume, cancelRamp } = useSoftResume();

  // State for modals and interactions
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  
  const [showTapHeart, setShowTapHeart] = useState<Record<string, boolean>>({});
  const [videoControlsVisible, setVideoControlsVisible] = useState<Record<string, boolean>>({});
  const [videosPlaying, setVideosPlaying] = useState<Record<string, boolean>>({});
  const lastTapRef = useRef<Record<string, number>>({});
  const controlsHideTimers = useRef<Record<string, number>>({});
  
  // Active video element for scrubber
  const [activeVideoEl, setActiveVideoEl] = useState<HTMLVideoElement | null>(null);
  
  // Update active video element when current index changes
  useEffect(() => {
    const currentPostId = filteredPosts[currentIndex]?.id;
    if (currentPostId) {
      const videoEl = videoRefs.current[currentPostId];
      setActiveVideoEl(videoEl || null);
    }
  }, [currentIndex, filteredPosts]);

  // Current post data
  const currentPost = filteredPosts[currentIndex];
  const currentPostEngagement = usePostEngagement(currentPost?.id || null);

  // Top 100 data
  const { data: playedTop100CourseIds = [] } = useUserTop100CourseIds();
  const playedSet = useMemo(() => new Set(playedTop100CourseIds), [playedTop100CourseIds]);
  const currentCourseId = currentPost?.golfCourse?.id;

  // Track if we paused video due to comments modal (don't resume if user paused manually)
  const pausedByCommentsRef = useRef(false);
  const pausedPostIdRef = useRef<string | null>(null);

  // Notify parent of comments state + pause/resume video
  useEffect(() => {
    onCommentsOpenChange?.(commentsModalOpen);
    
    const activePostId = currentPost?.id;
    if (!activePostId) return;
    
    // CRITICAL FIX: Use mediaId (cloudflare UID) for runtime calls
    const activeMediaId = postIdToMediaId.get(activePostId) || activePostId;
    
    if (commentsModalOpen) {
      // Mark that WE paused it + track which post, then pause
      pausedByCommentsRef.current = true;
      pausedPostIdRef.current = activePostId;
      runtimeBridge.requestPause(activeMediaId, 'user');
    } else if (pausedByCommentsRef.current && pausedPostIdRef.current) {
      // Only resume the specific post we paused with soft audio ramp
      const pausedPostIndex = filteredPosts.findIndex(p => p.id === pausedPostIdRef.current);
      const videoRef = videoRefs.current[pausedPostIndex];
      const pausedMediaId = postIdToMediaId.get(pausedPostIdRef.current) || pausedPostIdRef.current;
      
      if (videoRef && !isGloballyMuted) {
        // Use soft resume for smooth audio fade-in
        softResume(videoRef, isGloballyMuted);
      } else {
        // Fallback to regular resume
        runtimeBridge.requestPlay(pausedMediaId, 'user');
      }
      
      pausedByCommentsRef.current = false;
      pausedPostIdRef.current = null;
    }
  }, [commentsModalOpen, onCommentsOpenChange, currentPost?.id, runtimeBridge, postIdToMediaId, filteredPosts, videoRefs, isGloballyMuted, softResume]);

  // Follow status query
  const { data: isFollowing } = useQuery({
    queryKey: ['user-follows', user?.id, filteredPosts[currentIndex]?.user?.id],
    queryFn: async () => {
      if (!user?.id || !filteredPosts[currentIndex]?.user?.id || user.id === filteredPosts[currentIndex]?.user?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', filteredPosts[currentIndex]?.user?.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') return false;
      return !!data;
    },
    enabled: !!user?.id && !!filteredPosts[currentIndex]?.user?.id && user.id !== filteredPosts[currentIndex]?.user?.id
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (action === 'follow') {
        const { data, error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetUserId })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['user-follows', user?.id, variables.targetUserId], variables.action === 'follow');
    },
  });

  const handleFollowToggle = () => {
    const targetUserId = filteredPosts[currentIndex]?.user?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    followMutation.mutate({ targetUserId, action: isFollowing ? 'unfollow' : 'follow' });
  };

  // Double-tap like handler
  const handleDoubleTap = useCallback((postId: string, e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    const timeDiff = now - lastTap;
    lastTapRef.current[postId] = now;
    
    if (timeDiff < 300 && timeDiff > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      if (!currentPostEngagement.hasLiked) {
        currentPostEngagement.toggleLike();
      }
      
      setShowTapHeart(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setShowTapHeart(prev => ({ ...prev, [postId]: false }));
      }, 450);
      
      return true;
    }
    return false;
  }, [currentPostEngagement]);

  // Single tap handler
  const handleVideoSingleTap = useCallback((postId: string, e: React.MouseEvent | React.TouchEvent) => {
    const isDoubleTap = handleDoubleTap(postId, e);
    if (isDoubleTap) return;
    
    onDismissNavOverlay?.();
    
    setTimeout(() => {
      const wasDouble = Date.now() - (lastTapRef.current[postId] || 0) < 300;
      if (wasDouble) return;
      
      const videoEl = videoRefs.current[postId];
      const isCurrentlyPlaying = videoEl && !videoEl.paused;
      
      // CRITICAL FIX: Use mediaId (cloudflare UID) for runtime calls, not postId
      // The video is registered with cloudflare UID, so pause/play must use the same ID
      const mediaId = postIdToMediaId.get(postId) || postId;
      
      if (isCurrentlyPlaying) {
        runtimeBridge.requestPause(mediaId, 'user');
        setVideosPlaying(prev => ({ ...prev, [postId]: false }));
      } else {
        runtimeBridge.requestPlay(mediaId, 'user');
        setVideosPlaying(prev => ({ ...prev, [postId]: true }));
      }
      
      onMeaningfulInteraction?.();
      
      setVideoControlsVisible(prev => ({ ...prev, [postId]: true }));
      if (controlsHideTimers.current[postId]) {
        clearTimeout(controlsHideTimers.current[postId]);
      }
      controlsHideTimers.current[postId] = window.setTimeout(() => {
        setVideoControlsVisible(prev => ({ ...prev, [postId]: false }));
      }, 2000);
    }, 320);
  }, [handleDoubleTap, onDismissNavOverlay, runtimeBridge, onMeaningfulInteraction, videoRefs, postIdToMediaId]);

  // Media navigation handlers
  const handleMediaTouchStart = useCallback((e: React.TouchEvent, postId: string, hasMultipleMedia: boolean) => {
    if (hasMultipleMedia) {
      (e.currentTarget as any).touchStartX = e.touches[0].clientX;
      (e.currentTarget as any).touchStartY = e.touches[0].clientY;
    }
  }, []);

  const handleMediaTouchEnd = useCallback((
    e: React.TouchEvent,
    postId: string,
    hasMultipleMedia: boolean,
    currentMediaIndex: number,
    mediaItemsLength: number
  ) => {
    if (!hasMultipleMedia) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchStartX = (e.currentTarget as any).touchStartX || 0;
    const touchStartY = (e.currentTarget as any).touchStartY || 0;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setMediaIndices(prev => ({
          ...prev,
          [postId]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItemsLength - 1
        }));
      } else {
        setMediaIndices(prev => ({
          ...prev,
          [postId]: currentMediaIndex < mediaItemsLength - 1 ? currentMediaIndex + 1 : 0
        }));
      }
    }
  }, []);

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  };

  const handleShare = () => {
    // Share action handled by native share sheet
  };

  // Scroll handler with parent callback
  const handleScroll = useCallback(() => {
    internalHandleScroll();
    if (scrollViewRef.current && onScroll) {
      onScroll(scrollViewRef.current.scrollTop);
    }
  }, [internalHandleScroll, onScroll]);

  if (filteredPosts.length === 0) {
    return (
      <div className="fixed inset-0 z-10 bg-black flex items-center justify-center">
        <InlineSpinner size="lg" className="border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 bg-black overflow-hidden">
      {/* Scrollable Content */}
      <div
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollBehavior: isMobile ? 'auto' : 'smooth',
          overscrollBehavior: 'none',
          touchAction: 'pan-y'
        }}
      >
      {filteredPosts.map((item, index) => {
          const distance = Math.abs(index - currentIndex);
          const isNearbyItem = distance <= 1;

          // Build media items array, filtering out invalid/duplicate entries
          const rawMediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          // Filter to only valid, unique media items.
          // IMPORTANT: Deduplicate by canonical identity (Stream ID for video, base URL for images)
          // so a single video doesn't appear as multiple media due to URL variants.
          const seenKeys = new Set<string>();
          const mediaItems = rawMediaItems.filter((m: any) => {
            const url = (m?.media_url || m?.url) as string | undefined;
            if (!url) return false;

            const baseUrl = url.split('?')[0];
            const declaredType = (m?.media_type || m?.mediaType || m?.type) as string | undefined;
            const inferredType = declaredType || (url.includes('.m3u8') || url.includes('/manifest/') ? 'video' : 'image');

            const streamId = (m?.stream_id || m?.streamId || (inferredType === 'video' ? uidFromNode({ src: url }) : undefined)) as
              | string
              | undefined;

            const key = inferredType === 'video'
              ? `video:${streamId || baseUrl}`
              : `image:${baseUrl}`;

            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            const newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1;
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: newIndex
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            const newIndex = currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0;
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: newIndex
            }));
          };

          const currentPosterUrl = (() => {
            const media = currentMedia;
            if (!media?.media_url) return undefined;

            let url: string | undefined;
            if (media.media_type === 'video') {
              const posterFromDb = (media as any).poster_url as string | null | undefined;
              if (posterFromDb) {
                url = posterFromDb;
              } else {
                const streamId = (media as any).stream_id || uidFromNode({ src: media.media_url });
                url = streamId ? generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' }) : undefined;
              }
            } else {
              url = media.media_url;
            }
            
            // Skip failed poster URLs
            return url && !isPosterFailed(url) ? url : undefined;
          })();
          
          // Get filter info for placeholder rendering too
          const placeholderMediaItem = item.media?.[0] as any;
          const placeholderStudioEdits = placeholderMediaItem?.studio_edits;
          const placeholderFilterId = placeholderMediaItem?.filter_id ?? placeholderStudioEdits?.filter ?? null;
          const placeholderFilterClass = getFilterClass(placeholderFilterId);
          
          // Lightweight placeholder for far items - USE BACKGROUND IMAGE FOR INSTANT DISPLAY
          if (!isNearbyItem) {
            return (
              <div
                key={item.id}
                data-postid={item.id}
                ref={(el) => el && registerItemRef(index, el)}
                className="relative w-full snap-start snap-always"
                style={{ 
                  height: '100svh',
                  minHeight: '100svh',
                  maxHeight: '100svh',
                  width: '100vw',
                  maxWidth: '100vw',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  // INSTANT POSTER: Background image shows immediately during scroll
                  backgroundColor: 'hsl(var(--clubhouse-bg-page))',
                  backgroundImage: currentPosterUrl ? `url(${currentPosterUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* Filter overlay if needed */}
                {placeholderFilterClass && placeholderFilterClass !== '' && (
                  <div className={cn("absolute inset-0 w-full h-full pointer-events-none", placeholderFilterClass)} />
                )}
              </div>
            );
          }

          if (index === 0) {
            logFirstCardRender(item.id);
          }
          
          // Music debug logging for Clubhouse
          const mediaItem = item.media?.[0] as any;
          const studioEdits = mediaItem?.studio_edits;
          const musicData = studioEdits?.music;
          const postHasMusic = !!musicData?.url || !!musicData?.r2Key;
          const audioMode = studioEdits?.audioMode || 'original';
          
          // Filter: prefer filter_id column, fallback to studioEdits.filter
          const filterId = mediaItem?.filter_id ?? studioEdits?.filter ?? null;
          const filterClass = getFilterClass(filterId);
          
          // Get crop/rotate/adjustments from studioEdits
          const cropClass = getCropWrapperClass(studioEdits?.crop);
          const pixelLayerStyle = getPixelLayerStyle(studioEdits);
          
          // When audioMode is 'music_only', the video's original audio should be muted
          // so the music track can play instead
          const shouldMuteVideoForMusic = audioMode === 'music_only' && postHasMusic;
          const videoMuted = isGloballyMuted || shouldMuteVideoForMusic;
          
          return (
            <div
              key={item.id}
              data-postid={item.id}
              ref={(el) => el && registerItemRef(index, el)}
              className="relative w-full snap-start snap-always"
              style={{
                height: '100svh',
                minHeight: '100svh',
                maxHeight: '100svh',
                width: '100vw',
                maxWidth: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                // INSTANT POSTER: Background image shows immediately during scroll
                // This prevents the dark navy flash before video loads
                backgroundColor: 'hsl(var(--clubhouse-bg-page))',
                backgroundImage: currentPosterUrl ? `url(${currentPosterUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Media Content - with padding for navbar + safe area */}
              <div 
                onClick={(e) => {
                  if (currentMedia.media_type === 'video') {
                    handleVideoSingleTap(item.id, e);
                  }
                }}
                onTouchStart={(e) => handleMediaTouchStart(e, item.id, hasMultipleMedia)}
                onTouchEnd={(e) => handleMediaTouchEnd(e, item.id, hasMultipleMedia, currentMediaIndex, mediaItems.length)}
                className="relative w-full h-full z-10"
                style={{ paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))' }}
                data-media-container
              >
                {/* Double-tap heart burst */}
                {showTapHeart[item.id] && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
                    <div className="text-white opacity-0 scale-75 animate-[heart-burst_0.45s_ease-out_forwards]">
                      <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {currentMedia.media_type === 'video' ? (
                  <>
                    {/* Crop wrapper */}
                    <div className={cn("absolute inset-0", cropClass)}>
                      {/* Filtered + rotated pixel layer for video */}
                      <div 
                        className={cn("w-full h-full", filterClass)}
                        style={pixelLayerStyle}
                      >
                        <VideoWithAutoplay
                          key={currentMedia.id || `${item.id}-media-${currentMediaIndex}`}
                          ref={(el) => {
                            registerVideoRef(item.id, el);
                            if (index === currentIndex && el) {
                              setActiveVideoEl(el);
                              onActiveVideoRefChange?.(el);
                            }
                          }}
                          src={currentMedia.media_url}
                          muted={videoMuted}
                          className="w-full h-full"
                          isMobile={isMobile}
                          // INSTANT POSTER: Use the exact poster URL used by the container
                          posterUrl={currentPosterUrl}
                          // Enforce immediate autoplay for the very first card on initial landing
                          eagerMount={index === 0 && currentIndex === 0}
                          // Review posts can contain video media even when post.type !== 'video'.
                          // If the active carousel media is a video, force attach+autoplay.
                           // CRITICAL: Never allow autoplay=true while the player is still detached.
                           // shouldAttachMap updates can be deferred via requestIdleCallback; autoplayMap can flip first.
                           // If we want autoplay (or this is the active card), force attach immediately.
                           shouldAttach={
                             index === 0 && currentIndex === 0
                               ? true
                               : (
                                   index === currentIndex ||
                                   !!shouldAttachMap[item.id] ||
                                   !!autoplayMap[item.id] ||
                                   (item.categories?.includes('review') && index === currentIndex)
                                 )
                           }
                           autoplay={
                             index === 0 && currentIndex === 0
                               ? true
                               : (
                                   index === currentIndex ||
                                   !!autoplayMap[item.id] ||
                                   (item.categories?.includes('review') && index === currentIndex)
                                 )
                           }
                          isNearby={isNearbyItem}
                          isActive={index === currentIndex}
                          postId={currentMedia.id || `${item.id}-media-${currentMediaIndex}`}
                          onFirstFrameReady={() => {
                            // CRITICAL: Mark ready using stream UID, not post ID
                            const streamId = uidFromNode({ src: currentMedia.media_url });
                            if (streamId) markReadyRef.current(streamId);
                            // Also call parent callback for first video
                            if (index === 0) handleFirstFrameReady();
                          }}
                        />
                      </div>
                    </div>
                    
                    {videoControlsVisible[item.id] && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                        <div 
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-hud-bg backdrop-blur-md border border-hud-border animate-fade-in"
                        >
                          {videosPlaying[item.id] !== false ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Music Player - audio only, no UI (soundwave moved to CreatorCapsule) */}
                    {postHasMusic && musicData && (
                      <ClubhouseMusicPlayer
                        music={{
                          trackId: musicData.trackId,
                          title: musicData.title,
                          artist: musicData.artist,
                          url: musicData.url,
                          r2Key: musicData.r2Key,
                          startAt: musicData.startAt,
                          volume: musicData.volume,
                        }}
                        isActive={index === currentIndex}
                        isGloballyMuted={isGloballyMuted}
                        postId={item.id}
                        hideUI
                      />
                    )}
                    
                    {/* Text overlays from studio_edits */}
                    {studioEdits?.textOverlays?.length > 0 && (
                      <TextOverlayRenderer
                        textOverlays={studioEdits.textOverlays}
                        isEditable={false}
                      />
                    )}
                    
                    {/* Review overlay for video review posts */}
                    {item.categories?.includes('review') && (item as any).sourceReviewId && (
                      <div className="absolute inset-0 pointer-events-none">
                        <FullscreenReviewPost
                          mode="live"
                          courseId={item.golfCourse?.id || ''}
                          courseName={(item as any).courseName || item.golfCourse?.name || 'Course'}
                          heroSubtitle={item.golfCourse ? `${item.golfCourse.region || ''}, ${item.golfCourse.country || ''}`.replace(/^, |, $/g, '') : ''}
                          rating={(item as any).reviewRating ?? 0}
                          reviewText={(item as any).content || item.title || ''}
                          reviewId={(item as any).sourceReviewId || item.id}
                          media={(item.media || []).map((m: any) => ({
                            id: m.id || `${item.id}-media`,
                            media_type: m.media_type || 'image',
                            media_url: m.url || m.media_url || '',
                            poster_url: m.posterUrl || m.poster_url || null,
                            stream_id: m.streamId || m.stream_id || null,
                            display_order: m.display_order ?? null,
                            created_at: m.created_at || null,
                          }))}
                          initialIndex={mediaIndices[item.id] || 0}
                          dotsBottomOffset={0}
                          renderMedia={false}
                          hideCarouselArrows={true}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full bg-black overflow-hidden">
                    {/* Crop wrapper */}
                    <div className={cn("absolute inset-0", cropClass)}>
                      {/* Filtered + rotated pixel layer for image */}
                      <div 
                        className={cn("w-full h-full", filterClass)}
                        style={pixelLayerStyle}
                      >
                        <img
                          key={currentMedia.id || `${item.id}-media-${currentMediaIndex}`}
                          src={currentMedia.media_url}
                          alt={item.title || 'Content image'}
                          className="absolute inset-0 w-full h-full object-cover select-none"
                          style={{ objectPosition: 'center center' }}
                          draggable={false}
                          loading="eager"
                          onLoad={() => {
                            if (index === 0) handleFirstFrameReady();
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Review overlay - conditionally rendered */}
                    {item.categories?.includes('review') && (item as any).sourceReviewId ? (
                      <div className="absolute inset-0 pointer-events-none">
                        <FullscreenReviewPost
                          mode="live"
                          courseId={item.golfCourse?.id || ''}
                          courseName={(item as any).courseName || item.golfCourse?.name || 'Course'}
                          heroSubtitle={item.golfCourse ? `${item.golfCourse.region || ''}, ${item.golfCourse.country || ''}`.replace(/^, |, $/g, '') : ''}
                          rating={(item as any).reviewRating ?? 0}
                          reviewText={(item as any).content || item.title || ''}
                          reviewId={(item as any).sourceReviewId || item.id}
                          media={(item.media || []).map((m: any) => ({
                            id: m.id || `${item.id}-media`,
                            media_type: m.media_type || 'image',
                            media_url: m.url || m.media_url || '',
                            poster_url: m.posterUrl || m.poster_url || null,
                            stream_id: m.streamId || m.stream_id || null,
                            display_order: m.display_order ?? null,
                            created_at: m.created_at || null,
                          }))}
                          initialIndex={mediaIndices[item.id] || 0}
                          dotsBottomOffset={0}
                          renderMedia={false}
                          hideCarouselArrows={true}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Text overlays from studio_edits - OUTSIDE filter layer */}
                        {studioEdits?.textOverlays?.length > 0 && (
                          <TextOverlayRenderer
                            textOverlays={studioEdits.textOverlays}
                            isEditable={false}
                          />
                        )}
                        
                        {/* Multi-media navigation dots for non-review posts */}
                        {hasMultipleMedia && (
                          <MediaNavigationDots
                            mediaCount={mediaItems.length}
                            currentIndex={currentMediaIndex}
                            onJump={(index) => {
                              setMediaIndices(prev => ({
                                ...prev,
                                [item.id]: index
                              }));
                            }}
                            bottomOffset="calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 180px)"
                          />
                        )}
                        
                        <div 
                          className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                          style={{
                            height: '35vh',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
                          }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Navigation Arrows - aligned with top slot of CinematicActionRail */}
                {hasMultipleMedia && (() => {
                  // Match CinematicActionRail geometry (stable; no jumping when Next Media slot disappears)
                  const SLOT_HEIGHT = 64;
                  const ICON_SIZE = 44;
                  const GAP = 12;

                  // CinematicActionRail bottom = calc(env(safe-area-inset-bottom, 0px) + 80px - (SLOT_HEIGHT - ICON_SIZE))
                  // With SLOT_HEIGHT=64 and ICON_SIZE=44 => 80 - 20 = 60
                  const RAIL_BOTTOM_OFFSET_PX = 80 - (SLOT_HEIGHT - ICON_SIZE); // 60

                  // Always assume the "max" rail layout (5 slots: Next Media + Mute + Like + Comment + Share)
                  // so the arrows remain anchored even when Next Media is not currently rendered.
                  const MAX_SLOTS = 5;
                  const totalHeight = MAX_SLOTS * SLOT_HEIGHT + (MAX_SLOTS - 1) * GAP;

                  // Align arrow (44x44) center with the top slot's circular button center.
                  // Top circle center = railBottom + totalHeight - (ICON_SIZE / 2)
                  // Arrow center = arrowBottom + (ICON_SIZE / 2)
                  // => arrowBottom = railBottom + totalHeight - ICON_SIZE
                  const arrowBottom = `calc(env(safe-area-inset-bottom, 0px) + ${RAIL_BOTTOM_OFFSET_PX + totalHeight - ICON_SIZE}px)`;

                  const isReviewItem = isReviewPost(item);
                  return (
                    <>
                      {/* Left arrow - positioned to match the top slot of action rail */}
                      {currentMediaIndex > 0 && (
                        <button
                          data-control="media-nav"
                          onClick={handlePrevMedia}
                          className="fixed left-4 z-30 p-0 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                          style={{ bottom: arrowBottom }}
                          aria-label="Previous media"
                        >
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                      )}
                      {/* Right arrow - only for non-review posts (review posts use CinematicActionRail) */}
                      {!isReviewItem && currentMediaIndex < mediaItems.length - 1 && (
                        <button
                          data-control="media-nav"
                          onClick={handleNextMedia}
                          className="fixed right-4 z-30 p-0 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                          style={{ bottom: arrowBottom }}
                          aria-label="Next media"
                        >
                          <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Overlay layer above video (not clipped) */}
              {currentMedia.media_type === 'video' && index === currentIndex && (activeVideoEl || videoRefs.current[item.id]) && (
                <div className="absolute inset-0 z-[95] pointer-events-none">
                  <div
                    className="absolute left-0 right-0 pointer-events-auto"
                    style={{
                      bottom:
                        'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
                    }}
                  >
                    <VideoScrubber
                      videoEl={(activeVideoEl || videoRefs.current[item.id]) as HTMLVideoElement}
                      mediaId={item.id}
                      height={2.5}
                      className="pointer-events-auto"
                    />
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {isLoadingMore && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-white/70">Loading more posts...</div>
          </div>
        )}
      </div>

      <style>{`
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .snap-y { scrollbar-width: none !important; scroll-snap-type: y mandatory; }
        .snap-start { scroll-snap-align: start; scroll-snap-stop: always; }
      `}</style>

      {/* Comments Page */}
      {commentsModalOpen && selectedPostId && filteredPosts[currentIndex] && (
        <CommentsPage
          isOpen={commentsModalOpen}
          postId={selectedPostId}
          videoThumbnail={(() => {
            const post = filteredPosts[currentIndex];
            const currentMediaIdx = mediaIndices[post?.id] || 0;
            const mediaItems = post?.media && post.media.length > 0 ? post.media : [{
              id: `${post?.id}-single`,
              media_type: post?.type as 'video' | 'image',
              media_url: post?.src
            }];
            const currentMedia = mediaItems[currentMediaIdx] || mediaItems[0];
            const mediaAny = currentMedia as any;
            
            // 1. Use poster_url directly if available
            if (mediaAny?.poster_url) {
              return mediaAny.poster_url;
            }
            
            // 2. For images, use media_url directly
            if (mediaAny?.media_type === 'image' && mediaAny?.media_url) {
              return mediaAny.media_url;
            }
            
            // 3. Generate from Cloudflare Stream URL
            if (mediaAny?.media_url) {
              const uid = uidFromNode({ src: mediaAny.media_url });
              if (uid) {
                return generateStreamThumbnailUrl(uid, { height: 400 });
              }
            }
            
            return undefined;
          })()}
          aspectRatio={(() => {
            const post = filteredPosts[currentIndex];
            const currentMediaIdx = mediaIndices[post?.id] || 0;
            const mediaItems = post?.media && post.media.length > 0 ? post.media : [];
            const currentMedia = mediaItems[currentMediaIdx] || mediaItems[0];
            const mediaAny = currentMedia as any;
            
            // First try media-level aspect ratio
            if (mediaAny?.aspect_ratio) {
              return mediaAny.aspect_ratio;
            }
            // Then try media dimensions
            if (mediaAny?.width && mediaAny?.height) {
              return mediaAny.width / mediaAny.height;
            }
            // Then try post-level dimensions
            if (post?.width && post?.height) {
              return post.width / post.height;
            }
            return 0.5625; // 9:16 portrait default
          })()}
          isReview={isReviewPost(filteredPosts[currentIndex])}
          creatorName={filteredPosts[currentIndex]?.user?.name}
          creatorAvatar={filteredPosts[currentIndex]?.user?.avatar}
          creatorHomeClub={filteredPosts[currentIndex]?.user?.homeClub}
          creatorHandicap={filteredPosts[currentIndex]?.user?.handicap}
          caption={filteredPosts[currentIndex]?.title || filteredPosts[currentIndex]?.ctaDescription}
          courseId={filteredPosts[currentIndex]?.golfCourse?.id}
          courseName={filteredPosts[currentIndex]?.golfCourse?.name}
          courseCountry={filteredPosts[currentIndex]?.golfCourse?.country}
          courseSubCountry={filteredPosts[currentIndex]?.golfCourse?.sub_country}
          courseRegion={filteredPosts[currentIndex]?.golfCourse?.region}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId('');
          }}
        />
      )}

      {/* Cinematic Action Rail */}
      {filteredPosts[currentIndex] && (() => {
        const currentPost = filteredPosts[currentIndex];
        const mediaItems = currentPost.media && currentPost.media.length > 0 ? currentPost.media : [{
          id: `${currentPost.id}-single`,
          media_type: currentPost.type as 'video' | 'image',
          media_url: currentPost.src
        }];
        const currentMediaIdx = mediaIndices[currentPost.id] || 0;
        const hasNextMedia = currentMediaIdx < mediaItems.length - 1;
        const hasPrevMedia = currentMediaIdx > 0;
        
        return (
          <CinematicActionRail
            postId={currentPost.id}
            likesCount={currentPostEngagement.likesCount}
            commentsCount={currentPostEngagement.commentsCount}
            hasLiked={currentPostEngagement.hasLiked}
            isMuted={isGloballyMuted}
            isVisible={true}
            onLike={() => {
              currentPostEngagement.toggleLike();
              onMeaningfulInteraction?.();
            }}
            onComment={() => handleComment(currentPost.id)}
            onShare={() => {
              handleShare();
              onMeaningfulInteraction?.();
            }}
            onMuteToggle={() => {
              setGlobalMute(!isGloballyMuted);
              onMeaningfulInteraction?.();
            }}
            isReviewPost={isReviewPost(currentPost)}
            onNextMedia={() => {
              const newIndex = currentMediaIdx + 1;
              setMediaIndices(prev => ({
                ...prev,
                [currentPost.id]: newIndex
              }));
            }}
            onPrevMedia={() => {
              const newIndex = currentMediaIdx - 1;
              setMediaIndices(prev => ({
                ...prev,
                [currentPost.id]: newIndex
              }));
            }}
            hasNextMedia={hasNextMedia}
            hasPrevMedia={hasPrevMedia}
          />
        );
      })()}

      {/* Creator Capsule - Adaptive for regular posts and review posts */}
      {filteredPosts[currentIndex] && (() => {
        const currentPost = filteredPosts[currentIndex];
        const currentMediaItem = currentPost.media?.[0] as any;
        const currentStudioEdits = currentMediaItem?.studio_edits;
        const currentMusicData = currentStudioEdits?.music;
        const currentAudioMode = currentStudioEdits?.audioMode || 'original';
        const showMusicTrack = currentAudioMode === 'music_only' && currentMusicData?.title;
        
        // Detect review posts and extract data using unified helper
        const isReview = isReviewPost(currentPost);
        const reviewData = extractReviewData(currentPost);
        
        // Handle review capsule tap - navigate to course reviews with review highlighted
        const handleReviewTap = () => {
          if (reviewData?.courseId) {
            // Navigate to course reviews tab with reviewId for deep linking
            const reviewId = reviewData.sourceReviewId || currentPost.id;
            navigate(`/courses/${reviewData.courseId}?tab=reviews&review=${reviewId}`);
          }
        };
        
        return (
          <CreatorCapsule
            user={{
              id: currentPost.user?.id || '',
              name: currentPost.user?.name || 'Unknown User',
              username: currentPost.user?.username,
              avatar: currentPost.user?.avatar
            }}
            caption={removeGolfCourseFromContent(
              (currentPost.title as string | null) ?? 
              (currentPost.ctaDescription as string | null) ?? ''
            )}
            golfCourse={currentPost.golfCourse}
            musicTrack={showMusicTrack ? {
              title: currentMusicData.title,
              artist: currentMusicData.artist
            } : null}
            isMusicPlaying={showMusicTrack && !isGloballyMuted}
            isFollowing={isFollowing === true}
            isOwnPost={currentPost.user?.id === user?.id}
            isVisible={true}
            onFollow={handleFollowToggle}
            onMusicTap={() => setGlobalMute(!isGloballyMuted)}
            // Review mode props
            isReview={isReview}
            reviewData={reviewData}
            onReviewTap={handleReviewTap}
          />
        );
      })()}

    </div>
  );
};

export default ClubhouseVerticalGrid;
