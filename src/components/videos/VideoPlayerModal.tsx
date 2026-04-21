import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X, ArrowLeft, Play, Heart, MapPin, Bookmark, Share2, ChevronDown, ChevronUp, MoreVertical, PlayCircle, ListPlus, ListMusic } from 'lucide-react';
import QueueDrawer from '@/components/videos/QueueDrawer';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UnifiedVideoPlayer, { UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { usePostData } from '@/hooks/usePostData';
import { useRelatedLongFormVideos } from '@/hooks/useRelatedLongFormVideos';
import { useAutoplayPreference } from '@/hooks/useAutoplayPreference';
import { useFollow } from '@/hooks/useFollow';
import { useVideoQueue } from '@/hooks/useVideoQueue';
import { useVideoPlaybackSafe } from '@/context/VideoPlaybackContext';
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

interface VideoDataTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index: number;
  end_index: number;
}

interface VideoData {
  id: string;
  title: string;
  description: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  hlsUrl: string;
  posterUrl: string;
  views: number;
  createdAt: string;
  golfCourseName?: string;
  golfCourseId?: string;
  durationSeconds?: number;
  category?: string;
  studioEdits?: any;
  filterId?: string | null;
  tags?: VideoDataTag[];
}

/**
 * VideoPlayerModal - YouTube-style fullscreen modal video player
 * 
 * - Route-backed: /video/:videoId
 * - Fullscreen modal with backdrop blur
 * - Resume playback support
 * - Up Next + Recommended videos
 * - Feed stays mounted underneath
 */
export const VideoPlayerModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId } = useParams<{ videoId: string }>();
  const videoRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoAreaRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const startTargetRef = useRef<EventTarget | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Up Next autoplay state
  const [showUpNextOverlay, setShowUpNextOverlay] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(5);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const upNextCancelledRef = useRef(false);
  const upNextTimerRef = useRef<number | null>(null);
  const upNextIntervalRef = useRef<number | null>(null);
  const lastInteractionTsRef = useRef<number>(Date.now());
  
  // Autoplay preference (persisted)
  const { autoplayEnabled, setAutoplayEnabled } = useAutoplayPreference();
  
  // Video queue for continuous playback
  const { queue, queueMeta, playNext, enqueue, popNext, peekNext, getMeta, setQueueFromRelated, queueLength, removeFromQueue, clearQueue, moveQueueItem } = useVideoQueue();
  
  // Mini-player context (optional - may not exist in all app shells)
  const videoPlayback = useVideoPlaybackSafe();
  
  // Mark user interaction (resets autoplay eligibility timer)
  const markInteraction = useCallback(() => {
    lastInteractionTsRef.current = Date.now();
  }, []);
  
  const { fetchPostWithDetails } = usePostData();
  const { progress, shouldResume, resumePosition, updateProgress, clearProgress, isLoading: progressLoading } = useVideoProgress(videoId || '');
  const { likesCount, hasLiked, toggleLike, isTogglingLike } = usePostEngagement(videoId || null);
  
  // Follow hook for creator
  const { isFollowing, toggle: toggleFollow, busy: isTogglingFollow, ensureInitial: ensureFollowInitial } = useFollow(videoData?.creatorUserId);
  
  // Fetch related videos for recommendations - only fetch once videoData exists
  const { videos: relatedVideos, upNextVideo, isLoading: relatedLoading } = useRelatedLongFormVideos(
    videoData ? (videoId || '') : '', // Empty string skips fetch until videoData is ready
    {
      limit: 10,
      creatorUserId: videoData?.creatorUserId,
      courseId: videoData?.golfCourseId,
      category: videoData?.category,
    }
  );
  
  // Initialize queue from related videos ONLY when queue is empty (Fix 2: don't overwrite user queue)
  useEffect(() => {
    if (!videoId) return;
    if (queue.length > 0) return; // Don't overwrite existing queue
    if (relatedVideos.length === 0) return;
    
    // Build meta map for related videos
    const metaMap: Record<string, { title: string; thumbnailUrl: string; creatorName: string; durationSeconds?: number }> = {};
    relatedVideos.forEach(v => {
      metaMap[v.id] = {
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        creatorName: v.creatorName,
        durationSeconds: v.durationSeconds,
      };
    });
    
    setQueueFromRelated(relatedVideos.map(v => v.id), videoId, metaMap);
  }, [videoId, relatedVideos, queue.length, setQueueFromRelated]);
  
  // Helper to clear up next timers
  const clearUpNextTimers = useCallback(() => {
    if (upNextTimerRef.current) {
      clearTimeout(upNextTimerRef.current);
      upNextTimerRef.current = null;
    }
    if (upNextIntervalRef.current) {
      clearInterval(upNextIntervalRef.current);
      upNextIntervalRef.current = null;
    }
  }, []);
  
  // Reset state when videoId changes (for in-modal navigation)
  useEffect(() => {
    setVideoData(null);
    setIsLoading(true);
    setShowResumeOverlay(false);
    setHasAutoStarted(false);
    setShowUpNextOverlay(false);
    setUpNextCountdown(5);
    setShowFullDescription(false);
    upNextCancelledRef.current = false;
    clearUpNextTimers();
  }, [videoId, clearUpNextTimers]);
  
  // Fetch video data on mount or when videoId changes
  useEffect(() => {
    if (!videoId) return;
    
    const loadVideo = async () => {
      setIsLoading(true);
      try {
        const post = await fetchPostWithDetails(videoId);
        if (!post) {
          console.error('Post not found');
          handleClose();
          return;
        }
        
        // Extract video from post_media
        const media = post.post_media?.[0];
        if (!media) {
          console.error('No media found for post');
          handleClose();
          return;
        }
        
        // Get HLS URL and poster
        const uid = uidFromNode(media) || uidFromNode({ media_url: media.media_url });
        const hlsUrl = uid ? generateHlsUrl(uid) : media.media_url;
        const posterUrl = media.poster_url || (uid ? generateThumbnailUrl(uid) : '');
        
        // Get creator info - user is an array from the join
        const user = Array.isArray(post.user) ? post.user[0] : post.user;
        
        // Get golf course and category tags if present
        const postTags = post.post_tags as any[] | undefined;
        const golfTag = postTags?.find((tag: any) => 
          tag.tagged_entity?.entity_type === 'golf_club' || 
          tag.tagged_entity?.entity_type === 'golf_course'
        );
        const categoryTag = postTags?.find((tag: any) => 
          tag.tagged_entity?.entity_type === 'video_category'
        );
        
        setVideoData({
          id: post.id,
          title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          description: post.content || '',
          creatorUserId: post.user_id,
          creatorName: user?.display_name || 'Golfer',
          creatorAvatarUrl: user?.profile_photo_url,
          hlsUrl,
          posterUrl,
          views: 0,
          createdAt: post.created_at,
          golfCourseName: golfTag?.tagged_entity?.name,
          golfCourseId: golfTag?.tagged_entity?.entity_id,
          durationSeconds: media.duration_seconds,
          category: categoryTag?.tagged_entity?.slug,
          studioEdits: media.studio_edits,
          filterId: media.filter_id ?? (media.studio_edits as any)?.filter ?? null,
          tags: postTags
            ?.filter((tag: any) => {
              const et = tag.tagged_entity?.entity_type;
              return et === 'user' || et === 'business';
            })
            .map((tag: any) => ({
              id: tag.id,
              entity_type: tag.tagged_entity?.entity_type,
              entity_id: tag.tagged_entity?.entity_id,
              name: tag.tagged_entity?.name || 'Unknown',
              username: tag.tagged_entity?.username || null,
              start_index: tag.start_index ?? 0,
              end_index: tag.end_index ?? 0,
            })) || [],
        });
      } catch (err) {
        console.error('Error loading video:', err);
        handleClose();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVideo();
  }, [videoId, fetchPostWithDetails]);
  
  // Ensure follow status is loaded when video data is ready
  useEffect(() => {
    if (videoData?.creatorUserId) {
      ensureFollowInitial();
    }
  }, [videoData?.creatorUserId, ensureFollowInitial]);
  
  // Handle resume logic once progress is loaded
  useEffect(() => {
    if (progressLoading || !videoData || hasAutoStarted) return;
    
    if (shouldResume && resumePosition > 0) {
      setShowResumeOverlay(true);
    } else {
      setHasAutoStarted(true);
    }
  }, [progressLoading, videoData, shouldResume, resumePosition, hasAutoStarted]);
  
  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Flush progress helper
  const flushProgress = useCallback(() => {
    const player = videoRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }
  }, [updateProgress]);
  
  // 6B-4: Flush progress on tab hide / page unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushProgress();
      }
    };
    const handlePageHide = () => flushProgress();
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [flushProgress]);
  
  const handleClose = useCallback(() => {
    // Flush progress before closing
    flushProgress();
    
    // Open mini-player if context is available and we have video data
    if (videoPlayback && videoId && videoData) {
      videoPlayback.openMini(videoId, {
        title: videoData.title,
        creatorName: videoData.creatorName,
        thumbnailUrl: videoData.posterUrl || '',
        hlsUrl: videoData.hlsUrl,
        posterUrl: videoData.posterUrl || '',
      });
    }
    
    // Navigate back
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/discover?main=videos');
    }
  }, [navigate, flushProgress, videoPlayback, videoId, videoData]);
  
  const handleCreatorClick = () => {
    if (videoData?.creatorUserId) {
      navigate(`/profile/${videoData.creatorUserId}`);
    }
  };
  
  const handleResumeClick = () => {
    setShowResumeOverlay(false);
    setHasAutoStarted(true);
    
    // Store pending seek - will be applied on loadedmetadata/canplay
    if (resumePosition > 0) {
      pendingSeekRef.current = resumePosition;
      // Also try immediate seek in case video is already ready
      const player = videoRef.current;
      if (player) {
        player.seek(resumePosition);
        pendingSeekRef.current = null;
      }
    }
  };
  
  // Apply pending seek when video metadata is ready
  const handleLoadedMetadata = useCallback(() => {
    const player = videoRef.current;
    if (player && pendingSeekRef.current !== null) {
      player.seek(pendingSeekRef.current);
      pendingSeekRef.current = null;
    }
  }, []);
  
  const handleStartFromBeginning = () => {
    setShowResumeOverlay(false);
    setHasAutoStarted(true);
  };
  
  // Progress tracking - wired directly to HLS player's onTimeUpdate
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (duration > 0) {
      updateProgress(currentTime, duration);
    }
  }, [updateProgress]);
  
  // Base navigation function for video selection
  const navigateToVideo = useCallback((newVideoId: string) => {
    // Flush progress before navigating to new video
    flushProgress();
    const backgroundLocation = location.state?.backgroundLocation;
    navigate(`/video/${newVideoId}`, { 
      state: { backgroundLocation, fromVideo: true },
      replace: false 
    });
  }, [navigate, location.state?.backgroundLocation, flushProgress]);
  
  // Get next video from queue (or fall back to upNextVideo)
  // Uses queueMeta to show correct info even if video isn't in relatedVideos
  const nextQueuedVideo = useMemo(() => {
    const nextId = peekNext();
    if (nextId) {
      // First check if it's in related videos
      const fromRelated = relatedVideos.find(v => v.id === nextId);
      if (fromRelated) return fromRelated;
      
      // Fall back to queueMeta (for videos added from feed/elsewhere)
      const meta = getMeta(nextId);
      if (meta) {
        return {
          id: nextId,
          title: meta.title,
          thumbnailUrl: meta.thumbnailUrl,
          creatorName: meta.creatorName,
          durationSeconds: meta.durationSeconds,
        };
      }
    }
    return upNextVideo;
  }, [peekNext, relatedVideos, upNextVideo, getMeta]);
  
  // 6B-3: Sync queue "next" to playback context for mini-player
  useEffect(() => {
    if (!videoPlayback) return;
    
    const nextId = peekNext();
    if (!nextId) {
      // Fallback to upNextVideo
      if (upNextVideo) {
        videoPlayback.setNext(upNextVideo.id, {
          title: upNextVideo.title,
          creatorName: upNextVideo.creatorName,
          thumbnailUrl: upNextVideo.thumbnailUrl,
        });
      } else {
        videoPlayback.setNext(null, null);
      }
      return;
    }
    
    // Use queueMeta for best info
    const meta = getMeta(nextId);
    videoPlayback.setNext(nextId, meta ? {
      title: meta.title,
      creatorName: meta.creatorName,
      thumbnailUrl: meta.thumbnailUrl,
    } : null);
  }, [peekNext, getMeta, upNextVideo, videoPlayback]);
  
  // Start up next countdown - uses queue
  const startUpNextCountdown = useCallback(() => {
    // Gate: need a next video (from queue or upNext)
    const nextVideo = nextQueuedVideo;
    if (!nextVideo) return;
    // Gate: don't autoplay if resume overlay is showing or video hasn't started
    if (showResumeOverlay || !hasAutoStarted) return;
    // Gate: don't autoplay if user was recently interacting (4s threshold)
    if (Date.now() - lastInteractionTsRef.current < 4000) return;
    
    upNextCancelledRef.current = false;
    setShowUpNextOverlay(true);
    setUpNextCountdown(5);
    
    // Countdown interval
    upNextIntervalRef.current = window.setInterval(() => {
      setUpNextCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    
    // Autoplay timer - only auto-navigate if autoplay is ON
    const expectedNextId = peekNext() || nextVideo.id;
    upNextTimerRef.current = window.setTimeout(() => {
      if (!upNextCancelledRef.current && nextVideo && autoplayEnabled) {
        setShowUpNextOverlay(false);
        clearUpNextTimers();
        popNext(expectedNextId); // 6B-4: Pop with expected ID for safety
        navigateToVideo(nextVideo.id);
      }
    }, 5000);
  }, [nextQueuedVideo, showResumeOverlay, hasAutoStarted, autoplayEnabled, clearUpNextTimers, navigateToVideo, popNext, peekNext]);
  
  const handleVideoEnded = useCallback(() => {
    clearProgress();
    startUpNextCountdown();
  }, [clearProgress, startUpNextCountdown]);
  
  const handleCancelUpNext = useCallback(() => {
    markInteraction();
    upNextCancelledRef.current = true;
    setShowUpNextOverlay(false);
    clearUpNextTimers();
  }, [clearUpNextTimers, markInteraction]);
  
  const handlePlayNow = useCallback(() => {
    const nextVideo = nextQueuedVideo;
    if (!nextVideo) return;
    markInteraction();
    clearUpNextTimers();
    setShowUpNextOverlay(false);
    const expectedId = peekNext() || nextVideo.id;
    popNext(expectedId); // 6B-4: Pop with expected ID for safety
    navigateToVideo(nextVideo.id);
  }, [nextQueuedVideo, clearUpNextTimers, navigateToVideo, markInteraction, popNext, peekNext]);
  
  // Navigate to another video within the modal - also cancels any up next countdown
  const handleVideoSelect = useCallback((newVideoId: string) => {
    markInteraction();
    // Cancel any pending up next autoplay
    upNextCancelledRef.current = true;
    setShowUpNextOverlay(false);
    clearUpNextTimers();
    navigateToVideo(newVideoId);
  }, [clearUpNextTimers, navigateToVideo, markInteraction]);
  
  // Toggle autoplay preference - cancel countdown if turning off
  const handleAutoplayToggle = useCallback((enabled: boolean) => {
    markInteraction();
    setAutoplayEnabled(enabled);
    if (!enabled) {
      // Immediately cancel any running countdown
      upNextCancelledRef.current = true;
      setShowUpNextOverlay(false);
      clearUpNextTimers();
    }
  }, [setAutoplayEnabled, clearUpNextTimers, markInteraction]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearUpNextTimers();
    };
  }, [clearUpNextTimers]);
  
  // Swipe down to dismiss (mobile) - protected from player interaction
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startTargetRef.current = e.target;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    
    // Don't dismiss if started on video player area (prevents conflict with scrubbing)
    const videoArea = videoAreaRef.current;
    if (videoArea && startTargetRef.current && videoArea.contains(startTargetRef.current as Node)) {
      return;
    }
    
    const deltaY = e.touches[0].clientY - startYRef.current;
    // If swiped down more than 100px, dismiss
    if (deltaY > 100) {
      handleClose();
      startYRef.current = null;
    }
  };
  
  const handleTouchEnd = () => {
    startYRef.current = null;
    startTargetRef.current = null;
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };
  
  // Split related videos: first is "up next", rest are recommendations
  const recommendedVideos = useMemo(() => {
    return relatedVideos.slice(1);
  }, [relatedVideos]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-xl overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => { markInteraction(); handleTouchMove(e); }}
      onTouchEnd={handleTouchEnd}
      onMouseMove={markInteraction}
      onScroll={markInteraction}
      onKeyDown={markInteraction}
    >
      {/* Main content - scrollable on mobile */}
      <ScrollArea className="flex-1 h-full">
        <div className="flex flex-col lg:flex-row min-h-full">
          {/* Left column: Video player + info */}
          <div className="flex-1 flex flex-col">
            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent" style={{ paddingTop: "calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)" }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                
                {!isLoading && videoData && (
                  <button
                    onClick={handleCreatorClick}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <SquircleAvatar
                      src={videoData.creatorAvatarUrl}
                      alt={videoData.creatorName}
                      userId={videoData.creatorUserId}
                      size={32}
                      hideRing
                    />
                    <span className="text-white font-medium text-sm">{videoData.creatorName}</span>
                  </button>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors lg:hidden"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Video area - centered 16:9 */}
            <div ref={videoAreaRef} className="flex-1 flex items-center justify-center px-4 py-4">
              {isLoading ? (
                <div className="w-full max-w-4xl aspect-video bg-muted/20 overflow-hidden animate-pulse relative">
                  {/* Video skeleton with gradient shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" style={{ animationName: 'shimmer' }} />
                  {/* Center play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/30 ml-1" />
                    </div>
                  </div>
                  {/* Bottom gradient with skeleton controls */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                      {/* Progress bar skeleton */}
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-white/30 rounded-full" />
                      </div>
                      {/* Time skeleton */}
                      <div className="w-16 h-3 bg-white/20 rounded" />
                    </div>
                  </div>
                </div>
              ) : videoData ? (
                <div className="relative w-full max-w-4xl aspect-video overflow-hidden bg-black">
                  {/* Filtered pixel layer with crop/rotate */}
                  {(() => {
                    const cropClass = getCropWrapperClass(videoData.studioEdits?.crop);
                    const pixelStyle = getPixelLayerStyle(videoData.studioEdits);
                    return (
                      <div className={cn("w-full h-full", cropClass)}>
                        <div className={cn("w-full h-full", getFilterClass(videoData.filterId))} style={pixelStyle}>
                          <UnifiedVideoPlayer
                            ref={videoRef}
                            src={videoData.hlsUrl}
                            posterUrl={videoData.posterUrl}
                            autoplay={hasAutoStarted && !showResumeOverlay}
                            loop={false}
                            muted={false}
                            className="w-full h-full"
                            objectFit="contain"
                            surface="fullscreen"
                            showMuteButton={false}
                            controls
                            scrubber
                            onEnded={handleVideoEnded}
                            onTimeUpdate={(currentTime, duration) => handleTimeUpdate(currentTime, duration)}
                            onLoadedData={handleLoadedMetadata}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Text overlays from studio edits */}
                  {videoData.studioEdits?.textOverlays && videoData.studioEdits.textOverlays.length > 0 && (
                    <TextOverlayRenderer
                      textOverlays={videoData.studioEdits.textOverlays}
                      isEditable={false}
                    />
                  )}
                  
                  {/* Resume overlay */}
                  {showResumeOverlay && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-4">
                        <p className="text-white/70 text-sm">Resume watching?</p>
                        <Button
                          onClick={handleResumeClick}
                          className="gap-2 bg-primary hover:bg-primary/90"
                        >
                          <Play className="h-4 w-4" />
                          Resume at {formatTime(resumePosition)}
                        </Button>
                        <button
                          onClick={handleStartFromBeginning}
                          className="text-white/60 hover:text-white text-sm underline"
                        >
                          Start from beginning
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Up Next autoplay overlay */}
                  {showUpNextOverlay && nextQueuedVideo && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        {/* Thumbnail */}
                        <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
                          {nextQueuedVideo.thumbnailUrl && (
                            <img 
                              src={nextQueuedVideo.thumbnailUrl} 
                              alt={nextQueuedVideo.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/60 text-xs mb-0.5">
                            {autoplayEnabled ? `Up next in ${upNextCountdown}` : 'Up next'}
                          </p>
                          <p className="text-white font-medium text-sm line-clamp-1">{nextQueuedVideo.title}</p>
                          <p className="text-white/50 text-xs line-clamp-1">{nextQueuedVideo.creatorName}</p>
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelUpNext}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handlePlayNow}
                            className="bg-primary hover:bg-primary/90 gap-1.5"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Play now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Bottom info area */}
            <div className="px-4 py-4">
              {isLoading ? (
                <div className="max-w-4xl mx-auto space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/4 bg-white/10" />
                </div>
              ) : videoData ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Title */}
                  <h1 className="text-white text-lg md:text-xl font-semibold line-clamp-2">
                    {videoData.title}
                  </h1>
                  
                  {/* Views + Date row */}
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <span>{formatViews(videoData.views)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(videoData.createdAt), { addSuffix: true })}</span>
                  </div>
                  
                  {/* Creator row with Follow button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleCreatorClick}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <SquircleAvatar
                        src={videoData.creatorAvatarUrl}
                        alt={videoData.creatorName}
                        userId={videoData.creatorUserId}
                        size={40}
                        hideRing
                      />
                      <span className="text-white font-medium">{videoData.creatorName}</span>
                    </button>
                    
                    <Button
                      variant={isFollowing === 'following' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleFollow()}
                      disabled={isTogglingFollow || isFollowing === 'unknown'}
                      className={cn(
                        "min-w-[90px]",
                        isFollowing === 'following' 
                          ? "border-white/20 text-white/80 hover:bg-white/10" 
                          : "bg-primary hover:bg-primary/90"
                      )}
                    >
                      {isFollowing === 'following' ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                  
                  {/* Action buttons row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Like button */}
                    <button
                      onClick={() => toggleLike()}
                      disabled={isTogglingLike}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
                        hasLiked 
                          ? "bg-like/20 text-like" 
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      )}
                    >
                      <Heart 
                        className={cn("h-4 w-4", hasLiked && "fill-like text-like")} 
                      />
                      <span className="text-sm font-medium">{likesCount}</span>
                    </button>
                    
                    {/* Save button (stub) */}
                    <button
                      onClick={() => toast.info('Coming soon')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                    >
                      <Bookmark className="h-4 w-4" />
                      <span className="text-sm font-medium">Save</span>
                    </button>
                    
                    {/* Share button */}
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/video/${videoData.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    
                    {/* Course badge */}
                    {videoData.golfCourseName && (
                      <Badge variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/20 gap-1">
                        <MapPin className="h-3 w-3" />
                        {videoData.golfCourseName}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description - expandable */}
                  {videoData.description && videoData.description.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <div 
                        className={cn(
                          "text-white/80 text-sm whitespace-pre-wrap",
                          !showFullDescription && "line-clamp-2"
                        )}
                      >
                        <PostContentWithTags
                          content={videoData.description}
                          tags={videoData.tags || []}
                        />
                      </div>
                      {videoData.description.length > 100 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="flex items-center gap-1 text-white/60 hover:text-white text-sm mt-2 transition-colors"
                        >
                          {showFullDescription ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              More
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Up Next section - shows on mobile, hidden on desktop (right sidebar) */}
            <div className="lg:hidden px-4 pb-6">
              {!relatedLoading && upNextVideo && (
                <div className="space-y-3">
                  {/* Autoplay toggle + Up next header + Queue count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white/80 font-medium text-sm">Up next</h3>
                      {queueLength > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsQueueDrawerOpen(true); }}
                          className="flex items-center gap-1 text-white/50 hover:text-white/80 text-xs transition-colors"
                        >
                          <ListMusic className="h-3 w-3" />
                          Queue: {queueLength}
                        </button>
                      )}
                    </div>
                    <label 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-white/60 text-xs">Autoplay</span>
                      <Switch
                        checked={autoplayEnabled}
                        onCheckedChange={handleAutoplayToggle}
                        className="data-[state=checked]:bg-primary scale-75"
                      />
                    </label>
                  </div>
                  <UpNextTile video={upNextVideo} onClick={() => handleVideoSelect(upNextVideo.id)} onPlayNext={playNext} onEnqueue={enqueue} />
                  
                  {/* Recommended list */}
                  {recommendedVideos.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-white/80 font-medium text-sm">Recommended</h3>
                      <div className="space-y-3">
                        {recommendedVideos.slice(0, 5).map((video) => (
                          <RecommendedTile 
                            key={video.id} 
                            video={video} 
                            onClick={() => handleVideoSelect(video.id)}
                            onPlayNext={playNext}
                            onEnqueue={enqueue}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right sidebar: Up Next + Recommended (desktop only) */}
          <div className="hidden lg:block w-96 border-l border-white/10 p-4">
            {relatedLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-5 w-24 bg-white/10" />
                <Skeleton className="aspect-video w-full bg-white/10 rounded-lg" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-40 aspect-video bg-white/10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-3 w-2/3 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Up Next - primary tile */}
                {upNextVideo && (
                  <>
                    {/* Autoplay toggle + Up next header + Queue count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white/80 font-medium text-sm">Up next</h3>
                        {queueLength > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsQueueDrawerOpen(true); }}
                            className="flex items-center gap-1 text-white/50 hover:text-white/80 text-xs transition-colors"
                          >
                            <ListMusic className="h-3 w-3" />
                            Queue: {queueLength}
                          </button>
                        )}
                      </div>
                      <label 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-white/60 text-xs">Autoplay</span>
                        <Switch
                          checked={autoplayEnabled}
                          onCheckedChange={handleAutoplayToggle}
                          className="data-[state=checked]:bg-primary scale-75"
                        />
                      </label>
                    </div>
                    <UpNextTile video={upNextVideo} onClick={() => handleVideoSelect(upNextVideo.id)} onPlayNext={playNext} onEnqueue={enqueue} />
                  </>
                )}
                
                {/* Recommended list */}
                {recommendedVideos.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-white/80 font-medium text-sm">Recommended</h3>
                    <div className="space-y-3">
                      {recommendedVideos.map((video) => (
                        <RecommendedTile 
                          key={video.id} 
                          video={video} 
                          onClick={() => handleVideoSelect(video.id)}
                          onPlayNext={playNext}
                          onEnqueue={enqueue}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      
      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueDrawerOpen}
        onClose={() => setIsQueueDrawerOpen(false)}
        queue={queue}
        queueMeta={queueMeta}
        nowPlayingId={videoId}
        nowPlayingMeta={videoData ? { title: videoData.title, thumbnailUrl: videoData.posterUrl, creatorName: videoData.creatorName } : null}
        nextId={peekNext()}
        nextMeta={peekNext() ? getMeta(peekNext()!) : null}
        onPlayNow={(id) => {
          setIsQueueDrawerOpen(false);
          removeFromQueue(id);
          handleVideoSelect(id);
        }}
        onPlayNext={(id) => {
          const meta = getMeta(id);
          playNext(id, meta || undefined);
        }}
        onRemove={removeFromQueue}
        onClear={clearQueue}
        onReorder={moveQueueItem}
      />
    </div>
  );
};

// Up Next primary tile - larger format
interface UpNextTileProps {
  video: {
    id: string;
    title: string;
    creatorName: string;
    creatorAvatarUrl?: string;
    thumbnailUrl: string;
    duration: string;
    durationSeconds?: number;
    views?: number;
  };
  onClick: () => void;
  onPlayNext?: (id: string, meta?: { title: string; thumbnailUrl: string; creatorName: string; durationSeconds?: number }) => void;
  onEnqueue?: (id: string, meta?: { title: string; thumbnailUrl: string; creatorName: string; durationSeconds?: number }) => void;
}

const UpNextTile: React.FC<UpNextTileProps> = ({ video, onClick, onPlayNext, onEnqueue }) => {
  const meta = { title: video.title, thumbnailUrl: video.thumbnailUrl, creatorName: video.creatorName, durationSeconds: video.durationSeconds };
  return (
    <div 
      className="group cursor-pointer rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/20 flex items-center justify-center">
            <Play className="h-8 w-8 text-white/30" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
        
        {/* Queue menu - top right */}
        {(onPlayNext || onEnqueue) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Video options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-zinc-900 border-white/10 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onPlayNext?.(video.id, meta); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Play next</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onEnqueue?.(video.id, meta); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <ListPlus className="h-4 w-4" />
                <span>Add to queue</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>
      </div>
      
      <div className="p-3">
        <h4 className="text-white font-medium text-sm line-clamp-2 leading-snug">
          {video.title}
        </h4>
        <div className="flex items-center gap-2 mt-2">
          {video.creatorAvatarUrl ? (
            <img src={video.creatorAvatarUrl} alt="" className="w-5 h-5 rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
              {video.creatorName.charAt(0)}
            </div>
          )}
          <span className="text-white/60 text-xs truncate">{video.creatorName}</span>
        </div>
      </div>
    </div>
  );
};

// Recommended tile - compact horizontal format
interface RecommendedTileProps {
  video: {
    id: string;
    title: string;
    creatorName: string;
    thumbnailUrl: string;
    duration: string;
    durationSeconds?: number;
    views?: number;
  };
  onClick: () => void;
  onPlayNext?: (id: string, meta?: { title: string; thumbnailUrl: string; creatorName: string; durationSeconds?: number }) => void;
  onEnqueue?: (id: string, meta?: { title: string; thumbnailUrl: string; creatorName: string; durationSeconds?: number }) => void;
}

const RecommendedTile: React.FC<RecommendedTileProps> = ({ video, onClick, onPlayNext, onEnqueue }) => {
  const meta = { title: video.title, thumbnailUrl: video.thumbnailUrl, creatorName: video.creatorName, durationSeconds: video.durationSeconds };
  
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return `${views}`;
  };

  return (
    <div 
      className="group flex gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-1 -mx-1 transition-colors"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative w-40 aspect-video rounded overflow-hidden shrink-0">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/20 flex items-center justify-center">
            <Play className="h-5 w-5 text-white/30" />
          </div>
        )}
        
        {/* Queue menu - top right */}
        {(onPlayNext || onEnqueue) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Video options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-zinc-900 border-white/10 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onPlayNext?.(video.id, meta); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Play next</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onEnqueue?.(video.id, meta); }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <ListPlus className="h-4 w-4" />
                <span>Add to queue</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded">
          {video.duration}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-white text-sm font-medium line-clamp-2 leading-snug">
          {video.title}
        </h4>
        <p className="text-white/50 text-xs mt-1 truncate">{video.creatorName}</p>
        {video.views !== undefined && video.views > 0 && (
          <p className="text-white/40 text-xs">{formatViews(video.views)} views</p>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
