/**
 * ClubhouseVerticalGrid - Clubhouse vertical feed using UniversalMediaGrid patterns
 * 
 * This component wraps the unified grid hooks and types while maintaining
 * Clubhouse-specific features like cinematic overlays, double-tap likes,
 * and the runtime bridge.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
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
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';
import { logClubhouseFiltering } from '@/utils/clubhouseTelemetry';
import { logFirstCardRender } from '@/utils/bootTimeline';

import { ClubhouseMusicPlayer } from '@/components/clubhouse/ClubhouseMusicPlayer';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';

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
  /** Initial post index for deep linking (e.g., from focusPostId) */
  initialIndex?: number;
}

// ============ VideoWithAutoplay Component ============

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
}>(({ src, muted, className, isMobile: isMobileProp = false, shouldAttach = false, autoplay = false, isNearby = true, isActive = true, postId, eagerMount = false, onFirstFrameReady }, ref) => {
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : null;
  const poster = uid ? generateStreamThumbnailUrl(uid, { height: 600 }) : undefined;

  const playerRef = React.useRef<HLSPlayerRef>(null);

  React.useImperativeHandle(ref, () => playerRef.current?.getElement() as HTMLVideoElement);

  React.useEffect(() => {
    if (!playerRef.current) return;
    if (shouldAttach || eagerMount) {
      playerRef.current.attach();
    } else if (!isNearby) {
      playerRef.current.detach();
    }
  }, [shouldAttach, isNearby, eagerMount]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {hlsUrl ? (
        <div className="absolute inset-0" style={{ objectPosition: 'center center' }}>
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            muted={muted}
            loop
            autoplay={autoplay && isActive && (shouldAttach || eagerMount)}
            showMuteButton={false}
            showPlayButton={false}
            showScrubber={false}
            objectFit="cover"
            className="absolute inset-0 w-full h-full"
            managedByMediaRuntime
            externallyManaged={true}
            mediaId={postId}
            onLoadedData={onFirstFrameReady}
          />
        </div>
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
}), (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.muted === nextProps.muted &&
    prevProps.shouldAttach === nextProps.shouldAttach &&
    prevProps.autoplay === nextProps.autoplay &&
    prevProps.isNearby === nextProps.isNearby &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.postId === nextProps.postId &&
    prevProps.eagerMount === nextProps.eagerMount
  );
});

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
  initialIndex = 0
}) => {
  const { user } = useSupabaseSession();
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

  // Filter posts
  const filteredPosts = useMemo(() => {
    // Log A: Incoming posts before any filtering
    const reviewPostsIncoming = posts.filter(p => p.categories?.includes('review'));
    if (reviewPostsIncoming.length > 0) {
      console.log('[ClubhouseAudit] Incoming posts to grid:', {
        totalCount: posts.length,
        reviewPosts: reviewPostsIncoming.map(p => ({
          id: p.id,
          type: p.type,
          hasVideo: p.type === 'video',
          durationSeconds: p.durationSeconds,
          mediaCount: p.media?.length,
          firstMediaType: p.media?.[0]?.media_type,
          width: (p.media?.[0] as any)?.width,
          height: (p.media?.[0] as any)?.height,
        }))
      });
    }

    const shortsOnly = posts.filter(post => {
      // Review posts bypass video-only requirement
      const isReviewPost = post.categories?.includes('review');
      
      if (isReviewPost) {
        // Review posts: allow if they have any media (photo or video)
        const hasMedia = post.media && post.media.length > 0;
        if (!hasMedia) {
          console.log('[ClubhouseAudit] Review post rejected: no media', { id: post.id });
          return false;
        }
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

    // Log B: Final filtered list
    const reviewPostsFinal = filtered.filter(p => p.categories?.includes('review'));
    if (reviewPostsIncoming.length > 0) {
      console.log('[ClubhouseAudit] Final filtered posts:', {
        originalCount: posts.length,
        filteredCount: filtered.length,
        reviewPostsKept: reviewPostsFinal.map(p => p.id),
        reviewPostsLost: reviewPostsIncoming.filter(r => !reviewPostsFinal.some(f => f.id === r.id)).map(p => p.id)
      });
    }

    if (posts.length > 0) {
      logClubhouseFiltering(posts.length, filtered.length);
    }
    
    return filtered;
  }, [posts, isPortrait]);


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
    
    if (commentsModalOpen) {
      // Mark that WE paused it + track which post, then pause
      pausedByCommentsRef.current = true;
      pausedPostIdRef.current = activePostId;
      runtimeBridge.requestPause(activePostId, 'user');
    } else if (pausedByCommentsRef.current && pausedPostIdRef.current) {
      // Only resume the specific post we paused with soft audio ramp
      const pausedPostIndex = filteredPosts.findIndex(p => p.id === pausedPostIdRef.current);
      const videoRef = videoRefs.current[pausedPostIndex];
      
      if (videoRef && !isGloballyMuted) {
        // Use soft resume for smooth audio fade-in
        softResume(videoRef, isGloballyMuted);
      } else {
        // Fallback to regular resume
        runtimeBridge.requestPlay(pausedPostIdRef.current!, 'user');
      }
      
      pausedByCommentsRef.current = false;
      pausedPostIdRef.current = null;
    }
  }, [commentsModalOpen, onCommentsOpenChange, currentPost?.id, runtimeBridge]);

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
      
      if (isCurrentlyPlaying) {
        runtimeBridge.requestPause(postId, 'user');
        setVideosPlaying(prev => ({ ...prev, [postId]: false }));
      } else {
        runtimeBridge.requestPlay(postId, 'user');
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
  }, [handleDoubleTap, onDismissNavOverlay, runtimeBridge, onMeaningfulInteraction, videoRefs]);

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
    console.log('Share clicked');
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
          // TEMPORARY DEBUG LOG - Review metadata verification
          if (item.categories?.includes('review')) {
            console.log('[ClubhouseAudit] Review post rendering:', {
              id: item.id,
              hasSourceReviewId: !!(item as any).sourceReviewId,
              sourceReviewId: (item as any).sourceReviewId,
              hasRating: !!(item as any).reviewRating,
              reviewRating: (item as any).reviewRating,
              hasCourseName: !!(item as any).courseName,
              courseName: (item as any).courseName,
              hasGolfCourse: !!item.golfCourse,
              golfCourseName: item.golfCourse?.name,
              hasMedia: !!item.media?.[0],
              mediaType: item.type,
              mediaCount: item.media?.length
            });
          }
          
          const distance = Math.abs(index - currentIndex);
          const isNearbyItem = distance <= 1;

          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
            }));
          };

          const placeholderPosterUrl = (() => {
            const media = currentMedia;
            if (media.media_type === 'video') {
              const uid = uidFromNode({ src: media.media_url });
              return uid ? generateStreamThumbnailUrl(uid, { height: 600 }) : undefined;
            }
            return media.media_url;
          })();
          
          // Get filter info for placeholder rendering too
          const placeholderMediaItem = item.media?.[0] as any;
          const placeholderStudioEdits = placeholderMediaItem?.studio_edits;
          const placeholderFilterId = placeholderMediaItem?.filter_id ?? placeholderStudioEdits?.filter ?? null;
          const placeholderFilterClass = getFilterClass(placeholderFilterId);
          
          // Lightweight placeholder for far items
          if (!isNearbyItem) {
            return (
              <div
                key={item.id}
                data-postid={item.id}
                ref={(el) => el && registerItemRef(index, el)}
                className="relative w-full snap-start snap-always bg-black"
                style={{ 
                  height: '100svh',
                  minHeight: '100svh',
                  maxHeight: '100svh',
                  width: '100vw',
                  maxWidth: '100vw',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always'
                }}
              >
                {placeholderPosterUrl && (
                  <div className={cn("absolute inset-0 w-full h-full", placeholderFilterClass)}>
                    <img
                      src={placeholderPosterUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
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
                scrollSnapStop: 'always'
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
                          // Enforce immediate autoplay for the very first card on initial landing
                          eagerMount={index === 0 && currentIndex === 0}
                          shouldAttach={index === 0 && currentIndex === 0 ? true : !!shouldAttachMap[item.id]}
                          autoplay={index === 0 && currentIndex === 0 ? true : !!autoplayMap[item.id]}
                          isNearby={isNearbyItem}
                          isActive={index === currentIndex}
                          postId={item.id}
                          onFirstFrameReady={index === 0 ? handleFirstFrameReady : undefined}
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
                      <FullscreenReviewPost
                        mode="live"
                        courseId={item.golfCourse?.id || ''}
                        courseName={(item as any).courseName || item.golfCourse?.name || 'Course'}
                        heroSubtitle={item.golfCourse ? `${item.golfCourse.region || ''}, ${item.golfCourse.country || ''}`.replace(/^, |, $/g, '') : ''}
                        rating={(item as any).reviewRating ?? 0}
                        reviewText={(item as any).content || item.title || ''}
                        media={(item.media || []).map((m: any) => ({
                          id: m.id || `${item.id}-${Math.random()}`,
                          media_type: m.media_type || 'image',
                          media_url: m.media_url || '',
                          poster_url: m.poster_url || null,
                          stream_id: m.stream_id || null,
                          display_order: m.display_order ?? null,
                          created_at: m.created_at || null,
                        }))}
                        initialIndex={currentMediaIndex}
                        dotsBottomOffset={120}
                      />
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
                      <FullscreenReviewPost
                        mode="live"
                        courseId={item.golfCourse?.id || ''}
                        courseName={(item as any).courseName || item.golfCourse?.name || 'Course'}
                        heroSubtitle={item.golfCourse ? `${item.golfCourse.region || ''}, ${item.golfCourse.country || ''}`.replace(/^, |, $/g, '') : ''}
                        rating={(item as any).reviewRating ?? 0}
                        reviewText={(item as any).content || item.title || ''}
                        media={(item.media || []).map((m: any) => ({
                          id: m.id || `${item.id}-${Math.random()}`,
                          media_type: m.media_type || 'image',
                          media_url: m.media_url || '',
                          poster_url: m.poster_url || null,
                          stream_id: m.stream_id || null,
                          display_order: m.display_order ?? null,
                          created_at: m.created_at || null,
                        }))}
                        initialIndex={currentMediaIndex}
                        dotsBottomOffset={120}
                      />
                    ) : (
                      <>
                        {/* Text overlays from studio_edits - OUTSIDE filter layer */}
                        {studioEdits?.textOverlays?.length > 0 && (
                          <TextOverlayRenderer
                            textOverlays={studioEdits.textOverlays}
                            isEditable={false}
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

                {/* Navigation Arrows */}
                {hasMultipleMedia && (
                  <>
                    <button
                      data-control="media-nav"
                      onClick={handlePrevMedia}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-0 w-10 h-10 flex items-center justify-center"
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      data-control="media-nav"
                      onClick={handleNextMedia}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-0 w-10 h-10 flex items-center justify-center"
                      aria-label="Next media"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
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
          videoThumbnail={
            filteredPosts[currentIndex].media?.[0]?.media_url
              ? generateStreamThumbnailUrl(uidFromNode({ src: filteredPosts[currentIndex].media?.[0]?.media_url || '' }) || '', { height: 400 })
              : undefined
          }
          creatorName={filteredPosts[currentIndex].user?.name}
          creatorAvatar={filteredPosts[currentIndex].user?.avatar}
          creatorHomeClub={filteredPosts[currentIndex].user?.homeClub}
          creatorHandicap={filteredPosts[currentIndex].user?.handicap}
          caption={filteredPosts[currentIndex].title || filteredPosts[currentIndex].ctaDescription}
          courseId={filteredPosts[currentIndex].golfCourse?.id}
          courseName={filteredPosts[currentIndex].golfCourse?.name}
          courseCountry={filteredPosts[currentIndex].golfCourse?.country}
          courseSubCountry={filteredPosts[currentIndex].golfCourse?.sub_country}
          courseRegion={filteredPosts[currentIndex].golfCourse?.region}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId('');
          }}
        />
      )}

      {/* Cinematic Action Rail */}
      {filteredPosts[currentIndex] && (
        <CinematicActionRail
          postId={filteredPosts[currentIndex].id}
          likesCount={currentPostEngagement.likesCount}
          commentsCount={currentPostEngagement.commentsCount}
          hasLiked={currentPostEngagement.hasLiked}
          isMuted={isGloballyMuted}
          isVisible={true}
          onLike={() => {
            currentPostEngagement.toggleLike();
            onMeaningfulInteraction?.();
          }}
          onComment={() => handleComment(filteredPosts[currentIndex].id)}
          onShare={() => {
            handleShare();
            onMeaningfulInteraction?.();
          }}
          onMuteToggle={() => {
            setGlobalMute(!isGloballyMuted);
            onMeaningfulInteraction?.();
          }}
        />
      )}

      {/* Creator Capsule */}
      {filteredPosts[currentIndex] && (() => {
        const currentMediaItem = filteredPosts[currentIndex].media?.[0] as any;
        const currentStudioEdits = currentMediaItem?.studio_edits;
        const currentMusicData = currentStudioEdits?.music;
        const currentAudioMode = currentStudioEdits?.audioMode || 'original';
        const showMusicTrack = currentAudioMode === 'music_only' && currentMusicData?.title;
        
        return (
          <CreatorCapsule
            user={{
              id: filteredPosts[currentIndex].user?.id || '',
              name: filteredPosts[currentIndex].user?.name || 'Unknown User',
              username: filteredPosts[currentIndex].user?.username,
              avatar: filteredPosts[currentIndex].user?.avatar
            }}
            caption={removeGolfCourseFromContent(
              (filteredPosts[currentIndex].title as string | null) ?? 
              (filteredPosts[currentIndex].ctaDescription as string | null) ?? ''
            )}
            golfCourse={filteredPosts[currentIndex].golfCourse}
            musicTrack={showMusicTrack ? {
              title: currentMusicData.title,
              artist: currentMusicData.artist
            } : null}
            isMusicPlaying={showMusicTrack && !isGloballyMuted}
            isFollowing={isFollowing === true}
            isOwnPost={filteredPosts[currentIndex].user?.id === user?.id}
            isVisible={true}
            onFollow={handleFollowToggle}
            onMusicTap={() => setGlobalMute(!isGloballyMuted)}
          />
        );
      })()}

    </div>
  );
};

export default ClubhouseVerticalGrid;
