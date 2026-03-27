import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { X, Play, Pause, ListMusic, Maximize2, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoPlaybackSafe } from "@/context/VideoPlaybackContext";
import { usePostData } from "@/hooks/usePostData";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoQueue } from "@/hooks/useVideoQueue";
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from "@/utils/cloudflareStreamTransform";
import UnifiedVideoPlayer, { UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { trackVideoCloseMini } from "@/lib/analytics/videoAnalytics";
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

type MiniVideo = {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  hlsUrl: string;
  posterUrl?: string;
};

const PROGRESS_THROTTLE_MS = 5000;

/**
 * MiniPlayer - YouTube-style mini video player
 * 
 * - Mobile: full-width bottom bar
 * - Desktop: bottom-right floating card
 * - Persists via VideoPlaybackContext
 * - Auto-resumes from progress
 */
export const MiniPlayer: React.FC = () => {
  const context = useVideoPlaybackSafe();
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore(s => s.markUserGestureUnmute);
  
  const videoElRef = useRef<UnifiedVideoPlayerRef>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastProgressSentAtRef = useRef<number>(0);
  const mediaId = useId();

  const { fetchPostWithDetails } = usePostData();

  const [videoData, setVideoData] = useState<MiniVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [miniProgress, setMiniProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorKey, setErrorKey] = useState(0); // For retry remounting
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Play-gated crossfade

  // Don't render if context doesn't exist or mini isn't open
  const activeVideoId = context?.activeVideoId;
  const isMiniOpen = context?.isMiniOpen ?? false;

  const { shouldResume, resumePosition, updateProgress, isLoading: progressLoading } =
    useVideoProgress(activeVideoId || "");
  
  // Queue for showing queue count
  const { queueLength } = useVideoQueue();

  // Load video details when activeVideoId changes
  useEffect(() => {
    if (!activeVideoId || !isMiniOpen) {
      setVideoData(null);
      setIsPlaying(false);
      setHasError(false);
      setPosterLoaded(false);
      setIsVideoPlaying(false);
      return;
    }

    // If we have meta from context, use it
    if (context?.miniMeta) {
      setVideoData({
        id: activeVideoId,
        title: context.miniMeta.title,
        creatorName: context.miniMeta.creatorName,
        hlsUrl: context.miniMeta.hlsUrl,
        posterUrl: context.miniMeta.posterUrl,
      });
      setLoading(false);
      setHasError(false);
      setPosterLoaded(false);
      setIsVideoPlaying(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const post = await fetchPostWithDetails(activeVideoId);
        if (cancelled) return;

        const media = post?.post_media?.[0];
        if (!post || !media) {
          setVideoData(null);
          setLoading(false);
          return;
        }

        const uid = uidFromNode(media) || uidFromNode({ media_url: media.media_url });
        const hlsUrl = uid ? generateHlsUrl(uid) : media.media_url;
        const posterUrl = media.poster_url || (uid ? generateThumbnailUrl(uid) : undefined);

        const user = Array.isArray(post.user) ? post.user[0] : post.user;

        const title = post.content?.split("\n")[0]?.substring(0, 100) || "Untitled Video";

        setVideoData({
          id: post.id,
          title,
          creatorName: user?.display_name || user?.username || "Unknown",
          creatorAvatarUrl: user?.profile_photo_url,
          hlsUrl,
          posterUrl,
        });
        setHasError(false);
        setPosterLoaded(false);
        setIsVideoPlaying(false);
      } catch {
        if (!cancelled) setVideoData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeVideoId, isMiniOpen, context?.miniMeta, fetchPostWithDetails]);

  // When progress info arrives, queue a seek
  useEffect(() => {
    if (!activeVideoId || !isMiniOpen) return;
    if (progressLoading) return;

    if (shouldResume && resumePosition > 0) {
      pendingSeekRef.current = resumePosition;
      const player = videoElRef.current;
      if (player) {
        try {
          player.seek(resumePosition);
          pendingSeekRef.current = null;
        } catch {
          // ignore
        }
      }
    } else {
      pendingSeekRef.current = null;
    }
  }, [activeVideoId, isMiniOpen, progressLoading, shouldResume, resumePosition]);

  const handleLoadedMetadata = useCallback(() => {
    const player = videoElRef.current;
    if (!player) return;

    if (pendingSeekRef.current !== null) {
      try {
        player.seek(pendingSeekRef.current);
      } catch {
        // ignore
      } finally {
        pendingSeekRef.current = null;
      }
    }
  }, []);

  // Progress updates: throttle every 5s + update visual progress bar
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!activeVideoId || !isMiniOpen) return;
      if (!duration || duration <= 0) return;

      setMiniProgress((currentTime / duration) * 100);

      const now = Date.now();
      if (now - lastProgressSentAtRef.current < PROGRESS_THROTTLE_MS) return;

      lastProgressSentAtRef.current = now;
      updateProgress(currentTime, duration);
    },
    [activeVideoId, isMiniOpen, updateProgress]
  );

  const flushMiniProgress = useCallback(() => {
    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }
  }, [updateProgress]);

  // Flush progress on tab hide / page unload
  useEffect(() => {
    if (!activeVideoId || !isMiniOpen) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushMiniProgress();
      }
    };
    const handlePageHide = () => flushMiniProgress();
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [activeVideoId, isMiniOpen, flushMiniProgress]);

  const handleTogglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const player = videoElRef.current;
      if (!player) return;

      const el = player.getVideoElement();
      if (el?.paused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'miniplayer', reason: 'user' });
        setIsPlaying(true);
      } else {
        MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
        setIsPlaying(false);
      }
    },
    [mediaId]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const player = videoElRef.current;
      if (player) {
        const duration = player.getDuration();
        if (duration > 0) {
          const currentTime = player.getCurrentTime();
          updateProgress(currentTime, duration);
          if (activeVideoId) {
            trackVideoCloseMini(activeVideoId, currentTime);
          }
        }
      }

      if (activeVideoId) {
        MediaRuntime.requestPause({ id: `mini-${activeVideoId}`, reason: 'visibility' });
      }
      setIsPlaying(false);
      setMiniProgress(0);
      context?.closeMini();
    },
    [context, updateProgress, activeVideoId]
  );

  const handleOpenFull = useCallback(() => {
    if (!activeVideoId || !context) return;

    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }

    context.openFull(activeVideoId);
  }, [activeVideoId, context, updateProgress]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsVideoPlaying(true);
  }, []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setErrorKey(prev => prev + 1);
  }, []);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGloballyMuted) markUserGestureUnmute();
    toggleGlobalMute();
  }, [toggleGlobalMute, isGloballyMuted, markUserGestureUnmute]);

  // Handle video ended - advance to next in queue
  const handleEnded = useCallback(() => {
    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }

    const next = context?.consumeNext?.();
    if (next?.videoId) {
      context?.openMini(next.videoId, next.meta || undefined);
      return;
    }

    context?.closeMini();
  }, [context, updateProgress]);

  const isVisible = !!activeVideoId && isMiniOpen;

  const containerClass = useMemo(
    () =>
      cn(
        "fixed z-[90]",
        "left-0 right-0",
        "md:left-auto md:right-4 md:bottom-4 md:w-[360px]",
        "pointer-events-none"
      ),
    []
  );

  if (!isVisible) return null;

  return (
    <div 
      className={containerClass} 
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Mini player" 
      role="dialog"
    >
      <div
        className={cn(
          "pointer-events-auto relative",
          "bg-card/95 backdrop-blur-xl border border-border/30",
          "rounded-none md:rounded-2xl",
          "shadow-2xl",
          "overflow-hidden",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
      >
        {/* Progress bar at top edge */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-background/10">
          <div 
            className="h-full bg-primary transition-all duration-200 ease-linear"
            style={{ width: `${miniProgress}%` }}
          />
        </div>
        
        <div
          className={cn(
            "p-2 md:p-3",
            "flex gap-3 items-center"
          )}
        >
          {/* Thumbnail / mini video - click opens full */}
          <div 
            className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={hasError ? undefined : handleOpenFull}
            role="button"
            tabIndex={0}
            aria-label="Open full player"
          >
            {!loading && videoData?.hlsUrl && !hasError ? (
              <>
                {/* Shimmer base layer */}
                {!posterLoaded && !isVideoPlaying && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}

                {/* Poster with fade-in */}
                {videoData.posterUrl && (
                  <img
                    src={videoData.posterUrl}
                    alt=""
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-150",
                      posterLoaded ? "opacity-100" : "opacity-0",
                      isVideoPlaying ? "opacity-0" : ""
                    )}
                    onLoad={() => setPosterLoaded(true)}
                  />
                )}

                {/* Video player - visible after play fires */}
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-150",
                  isVideoPlaying ? "opacity-100" : "opacity-0"
                )}>
                  <UnifiedVideoPlayer
                    key={`${activeVideoId}-${errorKey}`}
                    ref={videoElRef}
                    src={videoData.hlsUrl}
                    posterUrl={videoData.posterUrl}
                    autoplay
                    muted={isGloballyMuted}
                    loop={false}
                    className="w-full h-full"
                    objectFit="cover"
                    surface="miniplayer"
                    managedByMediaRuntime={true}
                    onLoadedData={handleLoadedMetadata}
                    onTimeUpdate={(currentTime, duration) => handleTimeUpdate(currentTime, duration)}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnded}
                    onError={handleError}
                  />
                </div>
              </>
            ) : hasError ? (
              /* Error state overlay */
              <div 
                className="w-full h-full flex flex-col items-center justify-center bg-muted cursor-pointer"
                onClick={handleRetry}
              >
                {videoData?.posterUrl && (
                  <img src={videoData.posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                )}
                <AlertTriangle className="w-4 h-4 text-white/60 relative z-10 mb-0.5" />
                <span className="text-white/60 text-[9px] relative z-10">Tap to retry</span>
              </div>
            ) : (
              <div className="w-full h-full animate-pulse bg-muted" />
            )}
          </div>

        {/* Title + creator + next up indicator */}
        <div className="min-w-0 flex-1">
          <div className="text-foreground text-sm font-medium truncate">
            {videoData?.title || "Loading..."}
          </div>
          <div className="text-muted-foreground text-xs truncate">
            {videoData?.creatorName || ""}
          </div>
          {/* Queue trigger + Next up indicator */}
          <div className="flex items-center gap-2 mt-1">
            {queueLength > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  context?.openQueue?.();
                }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ListMusic className="w-3 h-3" />
                Queue: {queueLength}
              </button>
            )}
            {context?.nextVideoId && context?.nextMeta && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  context?.openQueue?.();
                }}
                className="text-[10px] text-primary/80 hover:text-primary truncate max-w-[120px] text-left"
              >
                Next: {context.nextMeta.title}
              </button>
            )}
          </div>
        </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute toggle */}
            <button
              onClick={handleMuteToggle}
              className={cn(
                "w-8 h-8 rounded-full",
                "bg-background/10 hover:bg-background/20",
                "text-foreground flex items-center justify-center transition"
              )}
              aria-label={isGloballyMuted ? "Unmute" : "Mute"}
              type="button"
            >
              {isGloballyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleTogglePlay}
              className={cn(
                "w-9 h-9 rounded-full",
                "bg-background/10 hover:bg-background/20",
                "text-foreground flex items-center justify-center transition"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
              type="button"
            >
              {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
            </button>

            {/* Expand button (opens full player) */}
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenFull(); }}
              className={cn(
                "w-9 h-9 rounded-full hidden md:flex",
                "bg-background/10 hover:bg-background/20",
                "text-foreground/80 hover:text-foreground items-center justify-center transition"
              )}
              aria-label="Open full player"
              type="button"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              className={cn(
                "w-11 h-11 rounded-full",
                "bg-background/10 hover:bg-background/20",
                "text-foreground/80 hover:text-foreground flex items-center justify-center transition"
              )}
              aria-label="Close mini player"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
