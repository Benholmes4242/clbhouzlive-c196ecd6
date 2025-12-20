import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoPlaybackSafe } from "@/context/VideoPlaybackContext";
import { usePostData } from "@/hooks/usePostData";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from "@/utils/cloudflareStreamTransform";
import FlickerFreeHLSPlayer from "@/components/ui/FlickerFreeHLSPlayer";

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
  
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastProgressSentAtRef = useRef<number>(0);

  const { fetchPostWithDetails } = usePostData();

  const [videoData, setVideoData] = useState<MiniVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Don't render if context doesn't exist or mini isn't open
  const activeVideoId = context?.activeVideoId;
  const isMiniOpen = context?.isMiniOpen ?? false;

  const { shouldResume, resumePosition, updateProgress, isLoading: progressLoading } =
    useVideoProgress(activeVideoId || "");

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
      const el = videoElRef.current;
      if (el && el.readyState >= 1) {
        try {
          el.currentTime = resumePosition;
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
    const el = videoElRef.current;
    if (!el) return;

    if (pendingSeekRef.current !== null) {
      try {
        el.currentTime = pendingSeekRef.current;
      } catch {
        // ignore
      } finally {
        pendingSeekRef.current = null;
      }
    }
  }, []);

  // Progress updates: throttle every 5s
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!activeVideoId || !isMiniOpen) return;
      if (!duration || duration <= 0) return;

      const now = Date.now();
      if (now - lastProgressSentAtRef.current < PROGRESS_THROTTLE_MS) return;

      lastProgressSentAtRef.current = now;
      updateProgress(currentTime, duration);
    },
    [activeVideoId, isMiniOpen, updateProgress]
  );

  const handleTogglePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const el = videoElRef.current;
      if (!el) return;

      try {
        if (el.paused) {
          await el.play();
          setIsPlaying(true);
        } else {
          el.pause();
          setIsPlaying(false);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Flush progress once on close
      const el = videoElRef.current;
      if (el && el.duration > 0) {
        updateProgress(el.currentTime, el.duration);
      }

      // Pause and close
      try {
        el?.pause();
      } catch {
        // ignore
      }
      setIsPlaying(false);
      context?.closeMini();
    },
    [context, updateProgress]
  );

  const handleOpenFull = useCallback(() => {
    if (!activeVideoId || !context) return;

    // Flush progress before opening full player
    const el = videoElRef.current;
    if (el && el.duration > 0) {
      updateProgress(el.currentTime, el.duration);
    }

    context.openFull(activeVideoId);
  }, [activeVideoId, context, updateProgress]);

  // Track play state from player
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

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
    <div className={containerClass} aria-label="Mini player">
      <div
        className={cn(
          "pointer-events-auto",
          "bg-zinc-900/95 backdrop-blur-xl border border-white/10",
          "rounded-none md:rounded-2xl",
          "shadow-2xl",
          "p-2 md:p-3",
          "flex gap-3 items-center",
          "cursor-pointer hover:bg-zinc-800/95 transition-colors",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
        onClick={handleOpenFull}
        role="button"
        tabIndex={0}
      >
        {/* Thumbnail / mini video */}
        <div className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          {!loading && videoData?.hlsUrl ? (
            <FlickerFreeHLSPlayer
              ref={videoElRef as any}
              hlsUrl={videoData.hlsUrl}
              poster={videoData.posterUrl}
              autoplay
              playsInline
              muted={false}
              loop={false}
              className="w-full h-full"
              objectFit="cover"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-white/10" />
          )}
        </div>

        {/* Title + creator */}
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-medium truncate">
            {videoData?.title || "Loading..."}
          </div>
          <div className="text-white/60 text-xs truncate">
            {videoData?.creatorName || ""}
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
  );
};

export default MiniPlayer;
