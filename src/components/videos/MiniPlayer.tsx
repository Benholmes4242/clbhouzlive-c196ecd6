import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { X, Play, Pause, ListMusic, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoPlaybackSafe } from "@/context/VideoPlaybackContext";
import { usePostData } from "@/hooks/usePostData";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoQueue } from "@/hooks/useVideoQueue";
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from "@/utils/cloudflareStreamTransform";
import UnifiedVideoPlayer, { UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { trackVideoCloseMini } from "@/lib/analytics/videoAnalytics";
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

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
  
  const videoElRef = useRef<UnifiedVideoPlayerRef>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastProgressSentAtRef = useRef<number>(0);
  const mediaId = useId();

  const { fetchPostWithDetails } = usePostData();

  const [videoData, setVideoData] = useState<MiniVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [miniProgress, setMiniProgress] = useState(0); // For visual progress bar

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

  // When progress info arrives, queue a seek (mini-player should "just continue")
  useEffect(() => {
    if (!activeVideoId || !isMiniOpen) return;
    if (progressLoading) return;

    if (shouldResume && resumePosition > 0) {
      pendingSeekRef.current = resumePosition;
      // If the video is already ready, attempt immediate seek
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

      // Update visual progress bar (always)
      setMiniProgress((currentTime / duration) * 100);

      const now = Date.now();
      if (now - lastProgressSentAtRef.current < PROGRESS_THROTTLE_MS) return;

      lastProgressSentAtRef.current = now;
      updateProgress(currentTime, duration);
    },
    [activeVideoId, isMiniOpen, updateProgress]
  );

  // Flush progress helper for mini-player
  const flushMiniProgress = useCallback(() => {
    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }
  }, [updateProgress]);

  // 6B-4: Flush progress on tab hide / page unload
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

      // Check if playing by attempting to get element state
      const el = player.getVideoElement();
      if (el?.paused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'fullscreen', reason: 'user' });
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

      // Flush progress once on close
      const player = videoElRef.current;
      if (player) {
        const duration = player.getDuration();
        if (duration > 0) {
          const currentTime = player.getCurrentTime();
          updateProgress(currentTime, duration);
          // Track analytics
          if (activeVideoId) {
            trackVideoCloseMini(activeVideoId, currentTime);
          }
        }
      }

      // CLEANUP_PAUSE: Stop playback when closing mini player
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

    // Flush progress before opening full player
    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }

    context.openFull(activeVideoId);
  }, [activeVideoId, context, updateProgress]);

  // Track play state from player
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  // 6B-3: Handle video ended - advance to next in queue
  const handleEnded = useCallback(() => {
    // Flush progress at end
    const player = videoElRef.current;
    if (player) {
      const duration = player.getDuration();
      if (duration > 0) {
        updateProgress(player.getCurrentTime(), duration);
      }
    }

    // Try to advance to next
    const next = context?.consumeNext?.();
    if (next?.videoId) {
      // Switch mini to next item
      context?.openMini(next.videoId, next.meta || undefined);
      return;
    }

    // Nothing queued → close mini
    context?.closeMini();
  }, [context, updateProgress]);

  const isVisible = !!activeVideoId && isMiniOpen;

  // Responsive container:
  // - mobile: full-width bottom bar (above bottom nav)
  // - desktop: bottom-right floating card
  const containerClass = useMemo(
    () =>
      cn(
        "fixed z-[90]",
        "left-0 right-0 bottom-16", // mobile: full width, above bottom nav
        "md:left-auto md:right-4 md:bottom-4 md:w-[360px]", // desktop: floating
        "pointer-events-none"
      ),
    []
  );

  if (!isVisible) return null;

  return (
    <div className={containerClass} aria-label="Mini player" role="dialog">
      <div
        className={cn(
          "pointer-events-auto relative",
          "bg-zinc-900/95 backdrop-blur-xl border border-white/10",
          "rounded-none md:rounded-2xl",
          "shadow-2xl",
          "overflow-hidden",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
      >
        {/* Progress bar at top edge */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
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
            className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleOpenFull}
            role="button"
            tabIndex={0}
            aria-label="Open full player"
          >
            {!loading && videoData?.hlsUrl ? (
              <>
                <UnifiedVideoPlayer
                  key={activeVideoId} // 6B-4: Key by activeVideoId to prevent stale audio
                  ref={videoElRef}
                  src={videoData.hlsUrl}
                  posterUrl={videoData.posterUrl}
                  autoplay
                  muted={true}  // Muted in mini to avoid audio issues / iOS restrictions
                  loop={false}
                  className="w-full h-full"
                  objectFit="cover"
                  surface="grid"
                  onLoadedData={handleLoadedMetadata}
                  onTimeUpdate={(currentTime, duration) => handleTimeUpdate(currentTime, duration)}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                />
                {/* Muted indicator */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 backdrop-blur-md bg-black/35 border border-white/10 rounded text-[10px] text-white/60">
                  🔇
                </div>
              </>
            ) : (
              <div className="w-full h-full animate-pulse bg-white/10" />
            )}
          </div>

        {/* Title + creator + next up indicator */}
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-medium truncate">
            {videoData?.title || "Loading..."}
          </div>
          <div className="text-white/60 text-xs truncate">
            {videoData?.creatorName || ""}
          </div>
          {/* 6B-3.3: Queue trigger + Next up indicator */}
          <div className="flex items-center gap-2 mt-1">
            {queueLength > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  context?.openQueue?.();
                }}
                className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors"
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlay}
              className={cn(
                "w-9 h-9 rounded-full",
                "bg-white/10 hover:bg-white/20",
                "text-white flex items-center justify-center transition"
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
                "bg-white/10 hover:bg-white/20",
                "text-white/80 hover:text-white items-center justify-center transition"
              )}
              aria-label="Open full player"
              type="button"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleClose}
              className={cn(
                "w-9 h-9 rounded-full",
                "bg-white/10 hover:bg-white/20",
                "text-white/80 hover:text-white flex items-center justify-center transition"
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
