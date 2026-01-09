/**
 * UnifiedFullscreenViewer - Single unified fullscreen media player
 * 
 * Works across all Clbhouz surfaces (Watch, Profile, Explore, Course Details, etc.)
 * by using the adapter pattern to normalize different data structures.
 * 
 * Features:
 * - Vertical swipe navigation (post-to-post)
 * - Horizontal swipe navigation (media-to-media within post)
 * - Action rail: Mute, Like, Comment, Share
 * - Creator capsule with music indicator
 * - CommentsPage (right slide-in)
 * - Video scrubber
 * - Studio edits (filters, crops, text overlays)
 * - Top 100 badges
 * - MediaRuntime integration
 * - Infinite scroll
 * - Keyboard navigation
 * - Landscape + Portrait support
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { FeedAdapter, NormalizedItem } from '@/types/feed-adapter';
import { useUnifiedFullscreenLogic } from '@/hooks/useUnifiedFullscreenLogic';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { useSoftResume } from '@/hooks/useSoftResume';
import { supabase } from '@/integrations/supabase/client';

import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { cn } from '@/lib/utils';

import { CinematicActionRail, CreatorCapsule, CommentsPage } from '@/components/clubhouse/cinematic';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { Top100OverlayPills } from '@/components/clubhouse/Top100OverlayPills';
import { ClubhouseMusicPlayer } from '@/components/clubhouse/ClubhouseMusicPlayer';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { FullscreenReviewPost } from '@/components/posts/FullscreenReviewPost';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { InlineSpinner } from '@/components/ui/InlineSpinner';

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

// ============ Types ============

export interface UnifiedFullscreenViewerProps<T> {
  // Data
  items: T[];
  adapter: FeedAdapter<T>;
  
  // Navigation
  initialIndex: number;
  onIndexChange?: (index: number) => void;
  
  // Infinite scroll
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  
  // Features
  allowLandscape?: boolean;
  focusItemId?: string;
  
  // Callbacks
  onClose: () => void;
  onLike?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onFollow?: (creatorId: string) => void;
  onFirstFrameReady?: () => void;
  
  // Optional customization
  showActionRail?: boolean;
  showCreatorCapsule?: boolean;
  showVideoScrubber?: boolean;
}

// ============ Main Component ============

export function UnifiedFullscreenViewer<T>({
  items,
  adapter,
  initialIndex,
  onIndexChange,
  onLoadMore,
  hasMore,
  isLoadingMore,
  allowLandscape = true,
  focusItemId,
  onClose,
  onLike,
  onComment,
  onShare,
  onFollow,
  onFirstFrameReady,
  showActionRail = true,
  showCreatorCapsule = true,
  showVideoScrubber = true,
}: UnifiedFullscreenViewerProps<T>) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const queryClient = useQueryClient();
  const { softResume } = useSoftResume();

  // Use unified fullscreen logic hook
  const logic = useUnifiedFullscreenLogic({
    items,
    adapter,
    initialIndex,
    onIndexChange,
    onLoadMore,
    hasMore,
    isLoadingMore,
    allowLandscape,
    focusItemId,
    onClose,
    onFirstFrameReady,
  });

  const normalizedItems = logic.getNormalizedItems();
  const currentItem = normalizedItems[logic.currentIndex];

  // Local state
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{ [key: string]: number }>({});
  const [showTapHeart, setShowTapHeart] = useState<Record<string, boolean>>({});
  const [videoControlsVisible, setVideoControlsVisible] = useState<Record<string, boolean>>({});
  const [videosPlaying, setVideosPlaying] = useState<Record<string, boolean>>({});
  const [activeVideoEl, setActiveVideoEl] = useState<HTMLVideoElement | null>(null);
  
  const lastTapRef = useRef<Record<string, number>>({});
  const controlsHideTimers = useRef<Record<string, number>>({});
  const pausedByCommentsRef = useRef(false);
  const pausedPostIdRef = useRef<string | null>(null);

  // Post engagement hook
  const currentPostEngagement = usePostEngagement(currentItem?.id || null);

  // Follow status query
  const { data: isFollowing } = useQuery({
    queryKey: ['user-follows', user?.id, currentItem?.creator?.id],
    queryFn: async () => {
      if (!user?.id || !currentItem?.creator?.id || user.id === currentItem?.creator?.id) {
        return null;
      }
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', currentItem.creator.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') return false;
      return !!data;
    },
    enabled: !!user?.id && !!currentItem?.creator?.id && user.id !== currentItem?.creator?.id
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

  const handleFollowToggle = useCallback(() => {
    const targetUserId = currentItem?.creator?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    followMutation.mutate({ targetUserId, action: isFollowing ? 'unfollow' : 'follow' });
    onFollow?.(targetUserId);
  }, [currentItem?.creator?.id, user?.id, isFollowing, followMutation, onFollow]);

  // Comments modal handling
  useEffect(() => {
    if (!currentItem) return;
    
    if (commentsModalOpen) {
      pausedByCommentsRef.current = true;
      pausedPostIdRef.current = currentItem.id;
    } else if (pausedByCommentsRef.current && pausedPostIdRef.current) {
      pausedByCommentsRef.current = false;
      pausedPostIdRef.current = null;
    }
  }, [commentsModalOpen, currentItem]);

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
        onLike?.(postId);
      }
      
      setShowTapHeart(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setShowTapHeart(prev => ({ ...prev, [postId]: false }));
      }, 450);
      
      return true;
    }
    return false;
  }, [currentPostEngagement, onLike]);

  // Single tap handler for video play/pause
  const handleVideoSingleTap = useCallback((postId: string, e: React.MouseEvent | React.TouchEvent) => {
    const isDoubleTap = handleDoubleTap(postId, e);
    if (isDoubleTap) return;
    
    setTimeout(() => {
      const wasDouble = Date.now() - (lastTapRef.current[postId] || 0) < 300;
      if (wasDouble) return;
      
      setVideosPlaying(prev => ({ ...prev, [postId]: !prev[postId] }));
      
      setVideoControlsVisible(prev => ({ ...prev, [postId]: true }));
      if (controlsHideTimers.current[postId]) {
        clearTimeout(controlsHideTimers.current[postId]);
      }
      controlsHideTimers.current[postId] = window.setTimeout(() => {
        setVideoControlsVisible(prev => ({ ...prev, [postId]: false }));
      }, 2000);
    }, 320);
  }, [handleDoubleTap]);

  // Media navigation touch handlers
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

  const handleComment = useCallback(() => {
    if (currentItem) {
      setCommentsModalOpen(true);
      onComment?.(currentItem.id);
    }
  }, [currentItem, onComment]);

  const handleShare = useCallback(() => {
    if (currentItem) {
      onShare?.(currentItem.id);
    }
  }, [currentItem, onShare]);

  // Loading state
  if (normalizedItems.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <InlineSpinner size="lg" className="border-white border-t-transparent" />
      </div>,
      document.body
    );
  }

  const content = (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-[10001] w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Scrollable Content */}
      <div
        ref={logic.scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={logic.handleScroll}
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
        {normalizedItems.map((item, index) => {
          const distance = Math.abs(index - logic.currentIndex);
          const isNearbyItem = distance <= 1;
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = item.media[currentMediaIndex] || item.media[0];
          const hasMultipleMedia = item.media.length > 1;

          // Get studio edits from media
          const studioEdits = currentMedia?.studio_edits as any;
          const musicData = studioEdits?.music;
          const postHasMusic = !!musicData?.url || !!musicData?.r2Key;
          const audioMode = studioEdits?.audioMode || 'original';
          
          // Filter and crop classes
          const filterId = (currentMedia as any)?.filter_id ?? studioEdits?.filter ?? null;
          const filterClass = getFilterClass(filterId);
          const cropClass = getCropWrapperClass(studioEdits?.crop);
          const pixelLayerStyle = getPixelLayerStyle(studioEdits);
          
          const shouldMuteVideoForMusic = audioMode === 'music_only' && postHasMusic;
          const videoMuted = isGloballyMuted || shouldMuteVideoForMusic;

          // Placeholder for far items
          if (!isNearbyItem) {
            const placeholderPosterUrl = currentMedia?.media_type === 'video'
              ? generateStreamThumbnailUrl(uidFromNode({ src: currentMedia.media_url }) || '', { height: 600 })
              : currentMedia?.media_url;
            
            return (
              <div
                key={item.id}
                data-postid={item.id}
                ref={(el) => el && logic.registerItemRef(index, el)}
                className="relative w-full snap-start snap-always bg-black"
                style={{ 
                  height: '100svh',
                  minHeight: '100svh',
                  maxHeight: '100svh',
                  width: '100vw',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always'
                }}
              >
                {placeholderPosterUrl && (
                  <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
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

          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : item.media.length - 1
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex < item.media.length - 1 ? currentMediaIndex + 1 : 0
            }));
          };

          return (
            <div
              key={item.id}
              data-postid={item.id}
              ref={(el) => el && logic.registerItemRef(index, el)}
              className="relative w-full snap-start snap-always"
              style={{
                height: '100svh',
                minHeight: '100svh',
                maxHeight: '100svh',
                width: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Media Content */}
              <div 
                onClick={(e) => {
                  if (currentMedia?.media_type === 'video') {
                    handleVideoSingleTap(item.id, e);
                  }
                }}
                onTouchStart={(e) => handleMediaTouchStart(e, item.id, hasMultipleMedia)}
                onTouchEnd={(e) => handleMediaTouchEnd(e, item.id, hasMultipleMedia, currentMediaIndex, item.media.length)}
                className="relative w-full h-full z-10"
                style={{ paddingBottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))' }}
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

                {currentMedia?.media_type === 'video' ? (
                  <>
                    <div className={cn("absolute inset-0", cropClass)}>
                      <div 
                        className={cn("w-full h-full", filterClass)}
                        style={pixelLayerStyle}
                      >
                        <VideoWithAutoplay
                          key={currentMedia.id || `${item.id}-media-${currentMediaIndex}`}
                          ref={(el) => {
                            logic.registerVideoRef(item.id, el);
                            if (index === logic.currentIndex && el) {
                              setActiveVideoEl(el);
                            }
                          }}
                          src={currentMedia.media_url}
                          muted={videoMuted}
                          className="w-full h-full"
                          isMobile={isMobile}
                          eagerMount={index === 0 && logic.currentIndex === 0}
                          shouldAttach={index === 0 && logic.currentIndex === 0 ? true : !!logic.shouldAttachMap[item.id]}
                          autoplay={index === 0 && logic.currentIndex === 0 ? true : !!logic.autoplayMap[item.id]}
                          isNearby={isNearbyItem}
                          isActive={index === logic.currentIndex}
                          postId={currentMedia.id || `${item.id}-media-${currentMediaIndex}`}
                          onFirstFrameReady={index === 0 ? logic.handleFirstFrameReady : undefined}
                        />
                      </div>
                    </div>
                    
                    {/* Video play/pause indicator */}
                    {videoControlsVisible[item.id] && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-hud-bg backdrop-blur-md border border-hud-border animate-fade-in">
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
                    
                    {/* Music Player */}
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
                        isActive={index === logic.currentIndex}
                        isGloballyMuted={isGloballyMuted}
                        postId={item.id}
                        hideUI
                      />
                    )}
                    
                    {/* Text overlays */}
                    {studioEdits?.textOverlays?.length > 0 && (
                      <TextOverlayRenderer
                        textOverlays={studioEdits.textOverlays}
                        isEditable={false}
                      />
                    )}
                    
                    {/* Review overlay for video review posts */}
                    {item.isReview && item.reviewData && (
                      <div className="absolute inset-0 pointer-events-none">
                        <FullscreenReviewPost
                          mode="live"
                          courseId={item.course?.id || ''}
                          courseName={item.course?.name || 'Course'}
                          heroSubtitle={item.course ? `${item.course.region || ''}, ${item.course.country || ''}`.replace(/^, |, $/g, '') : ''}
                          rating={item.reviewData.rating}
                          reviewText={item.caption || ''}
                          media={item.media.map((m) => ({
                            id: m.id,
                            media_type: m.media_type,
                            media_url: m.media_url,
                            poster_url: m.poster_url || null,
                            stream_id: null,
                            display_order: null,
                            created_at: null,
                          }))}
                          initialIndex={currentMediaIndex}
                          dotsBottomOffset={0}
                          renderMedia={false}
                          hideCarouselArrows={true}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full bg-black overflow-hidden">
                    <div className={cn("absolute inset-0", cropClass)}>
                      <div 
                        className={cn("w-full h-full", filterClass)}
                        style={pixelLayerStyle}
                      >
                        <img
                          key={currentMedia?.id || `${item.id}-media-${currentMediaIndex}`}
                          src={currentMedia?.media_url}
                          alt={item.caption || 'Content image'}
                          className="absolute inset-0 w-full h-full object-cover select-none"
                          style={{ objectPosition: 'center center' }}
                          draggable={false}
                          loading="eager"
                          onLoad={() => {
                            if (index === 0) logic.handleFirstFrameReady();
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Review overlay for image review posts */}
                    {item.isReview && item.reviewData && (
                      <div className="absolute inset-0 pointer-events-none">
                        <FullscreenReviewPost
                          mode="live"
                          courseId={item.course?.id || ''}
                          courseName={item.course?.name || 'Course'}
                          heroSubtitle={item.course ? `${item.course.region || ''}, ${item.course.country || ''}`.replace(/^, |, $/g, '') : ''}
                          rating={item.reviewData.rating}
                          reviewText={item.caption || ''}
                          media={item.media.map((m) => ({
                            id: m.id,
                            media_type: m.media_type,
                            media_url: m.media_url,
                            poster_url: m.poster_url || null,
                            stream_id: null,
                            display_order: null,
                            created_at: null,
                          }))}
                          initialIndex={currentMediaIndex}
                          dotsBottomOffset={0}
                          renderMedia={false}
                          hideCarouselArrows={true}
                        />
                      </div>
                    )}
                    
                    {/* Readability gradient for images */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                      style={{
                        height: '35vh',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
                      }}
                    />
                  </div>
                )}

                {/* Media navigation dots */}
                {hasMultipleMedia && (
                  <MediaNavigationDots
                    mediaCount={item.media.length}
                    currentIndex={currentMediaIndex}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30"
                  />
                )}

                {/* Top 100 Badges */}
                {item.course?.id && (
                  <Top100OverlayPills courseId={item.course.id} />
                )}

                {/* Media navigation arrows */}
                {hasMultipleMedia && (() => {
                  const SLOT_HEIGHT = 64;
                  const ICON_SIZE = 44;
                  const GAP = 12;
                  const RAIL_BOTTOM_OFFSET_PX = 80 - (SLOT_HEIGHT - ICON_SIZE);
                  const MAX_SLOTS = 5;
                  const totalHeight = MAX_SLOTS * SLOT_HEIGHT + (MAX_SLOTS - 1) * GAP;
                  const arrowBottom = `calc(env(safe-area-inset-bottom, 0px) + ${RAIL_BOTTOM_OFFSET_PX + totalHeight - ICON_SIZE}px)`;

                  return (
                    <>
                      {currentMediaIndex > 0 && (
                        <button
                          onClick={handlePrevMedia}
                          className="fixed left-4 z-30 p-0 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                          style={{ bottom: arrowBottom }}
                          aria-label="Previous media"
                        >
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                      )}
                      {!item.isReview && currentMediaIndex < item.media.length - 1 && (
                        <button
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

              {/* Video Scrubber overlay */}
              {showVideoScrubber && currentMedia?.media_type === 'video' && index === logic.currentIndex && activeVideoEl && (
                <div className="absolute inset-0 z-[95] pointer-events-none">
                  <div
                    className="absolute left-0 right-0 pointer-events-auto"
                    style={{
                      bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
                    }}
                  >
                    <VideoScrubber
                      videoEl={activeVideoEl}
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
      {commentsModalOpen && currentItem && (
        <CommentsPage
          isOpen={commentsModalOpen}
          postId={currentItem.id}
          videoThumbnail={(() => {
            const currentMediaIdx = mediaIndices[currentItem.id] || 0;
            const currentMedia = currentItem.media[currentMediaIdx] || currentItem.media[0];
            return currentMedia?.media_url
              ? generateStreamThumbnailUrl(uidFromNode({ src: currentMedia.media_url }) || '', { height: 400 })
              : undefined;
          })()}
          aspectRatio={(() => {
            const currentMediaIdx = mediaIndices[currentItem.id] || 0;
            const currentMedia = currentItem.media[currentMediaIdx] || currentItem.media[0];
            // Try to get aspect ratio from media dimensions or default to portrait (9:16)
            if (currentMedia?.width && currentMedia?.height) {
              return currentMedia.width / currentMedia.height;
            }
            return currentMedia?.aspect_ratio || 0.5625; // 9:16 portrait default
          })()}
          isReview={currentItem.isReview}
          reviewRating={currentItem.reviewData?.rating}
          creatorName={currentItem.creator.name}
          creatorAvatar={currentItem.creator.avatar}
          creatorHomeClub={currentItem.creator.homeClub}
          creatorHandicap={currentItem.creator.handicap}
          caption={currentItem.caption}
          courseId={currentItem.course?.id}
          courseName={currentItem.course?.name}
          courseCountry={currentItem.course?.country}
          courseSubCountry={currentItem.course?.sub_country}
          courseRegion={currentItem.course?.region}
          onClose={() => setCommentsModalOpen(false)}
        />
      )}

      {/* Cinematic Action Rail */}
      {showActionRail && currentItem && (() => {
        const currentMediaIdx = mediaIndices[currentItem.id] || 0;
        const hasNextMedia = currentMediaIdx < currentItem.media.length - 1;
        const hasPrevMedia = currentMediaIdx > 0;
        
        return (
          <CinematicActionRail
            postId={currentItem.id}
            likesCount={currentPostEngagement.likesCount}
            commentsCount={currentPostEngagement.commentsCount}
            hasLiked={currentPostEngagement.hasLiked}
            isMuted={isGloballyMuted}
            isVisible={true}
            onLike={() => {
              currentPostEngagement.toggleLike();
              onLike?.(currentItem.id);
            }}
            onComment={handleComment}
            onShare={handleShare}
            onMuteToggle={() => setGlobalMute(!isGloballyMuted)}
            isReviewPost={currentItem.isReview}
            onNextMedia={() => {
              setMediaIndices(prev => ({
                ...prev,
                [currentItem.id]: currentMediaIdx + 1
              }));
            }}
            onPrevMedia={() => {
              setMediaIndices(prev => ({
                ...prev,
                [currentItem.id]: currentMediaIdx - 1
              }));
            }}
            hasNextMedia={hasNextMedia}
            hasPrevMedia={hasPrevMedia}
          />
        );
      })()}

      {/* Creator Capsule */}
      {showCreatorCapsule && currentItem && (() => {
        const currentMediaItem = currentItem.media[0] as any;
        const currentStudioEdits = currentMediaItem?.studio_edits;
        const currentMusicData = currentStudioEdits?.music;
        const currentAudioMode = currentStudioEdits?.audioMode || 'original';
        const showMusicTrack = currentAudioMode === 'music_only' && currentMusicData?.title;
        
        const handleReviewTap = () => {
          if (currentItem.course?.id) {
            navigate(`/courses/${currentItem.course.id}?tab=reviews`);
          }
        };
        
        return (
          <CreatorCapsule
            user={{
              id: currentItem.creator.id,
              name: currentItem.creator.name,
              username: currentItem.creator.username,
              avatar: currentItem.creator.avatar
            }}
            caption={removeGolfCourseFromContent(currentItem.caption || '')}
            golfCourse={currentItem.course}
            musicTrack={showMusicTrack ? {
              title: currentMusicData.title,
              artist: currentMusicData.artist
            } : null}
            isMusicPlaying={showMusicTrack && !isGloballyMuted}
            isFollowing={isFollowing === true}
            isOwnPost={currentItem.creator.id === user?.id}
            isVisible={true}
            onFollow={handleFollowToggle}
            onMusicTap={() => setGlobalMute(!isGloballyMuted)}
            isReview={currentItem.isReview}
            reviewData={currentItem.reviewData}
            onReviewTap={handleReviewTap}
          />
        );
      })()}
    </div>
  );

  return createPortal(content, document.body);
}

export default UnifiedFullscreenViewer;
