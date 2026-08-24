// Poster-only chassis (Stage B5, BRIEF_VIDEO_TEARDOWN.md).
// All hls / <video> / MediaRuntime / seek / progress playback logic severed.
// The mini bar renders the poster thumbnail; controls remain as inert UI shells
// (play/pause toggle only flips local state) until the new video engine lands.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, Play, Pause, Maximize2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideoPlaybackSafe } from "@/context/VideoPlaybackContext";
import { usePostData } from "@/hooks/usePostData";
import { uidFromNode, generateHlsUrl, generateThumbnailUrl } from "@/utils/cloudflareStreamTransform";
import { trackVideoCloseMini } from "@/lib/analytics/videoAnalytics";
import { VideoEngine } from '@/video/VideoEngine';
import { MuteButton } from '@/audio/MuteButton';

type MiniVideo = {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  hlsUrl: string;
  posterUrl?: string;
};

export const MiniPlayer: React.FC = () => {
  const context = useVideoPlaybackSafe();

  const { fetchPostWithDetails } = usePostData();

  const [videoData, setVideoData] = useState<MiniVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);

  const activeVideoId = context?.activeVideoId;
  const isMiniOpen = context?.isMiniOpen ?? false;

  // Queue drawer removed (PR-5); MiniPlayer is Continue Watching only.

  useEffect(() => {
    if (!activeVideoId || !isMiniOpen) {
      setVideoData(null);
      setIsPlaying(false);
      setHasError(false);
      setPosterLoaded(false);
      return;
    }

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
      } catch {
        if (!cancelled) setVideoData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeVideoId, isMiniOpen, context?.miniMeta, fetchPostWithDetails]);

  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Inert shell — no engine to drive. Toggles UI only.
    // PR-5 one-thing-plays coordination: when the PiP starts, silence engine-managed lanes.
    // Reverse direction (engine play pausing PiP) is deferred to the Continue Watching migration.
    setIsPlaying(p => {
      const next = !p;
      if (next) {
        try { VideoEngine.pauseAll(); } catch { /* engine may be uninitialized */ }
      }
      return next;
    });
  }, []);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVideoId) {
      trackVideoCloseMini(activeVideoId, 0);
    }
    setIsPlaying(false);
    context?.closeMini();
  }, [context, activeVideoId]);

  const handleOpenFull = useCallback(() => {
    if (!activeVideoId || !context) return;
    context.openFull(activeVideoId);
  }, [activeVideoId, context]);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
  }, []);

  // Mute is owned by MuteButton (session store) — no local handler needed.

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
          "bg-card/95 backdrop-blur-xl border border-border/[0.03]",
          "rounded-none md:rounded-2xl",
          "shadow-2xl",
          "overflow-hidden",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
      >
        {/* Inert progress bar (no source of truth yet) */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-background/10" />

        <div className={cn("p-2 md:p-3", "flex gap-3 items-center")}>
          {/* Poster tile — tap opens full player */}
          <div
            className="relative w-24 h-14 md:w-28 md:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={hasError ? undefined : handleOpenFull}
            role="button"
            tabIndex={0}
            aria-label="Open full player"
          >
            {!loading && videoData && !hasError ? (
              <>
                {!posterLoaded && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
                {videoData.posterUrl && (
                  <img
                    src={videoData.posterUrl}
                    alt=""
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-150",
                      posterLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setPosterLoaded(true)}
                  />
                )}
              </>
            ) : hasError ? (
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

          {/* Title + creator + queue */}
          <div className="min-w-0 flex-1">
            <div className="text-foreground text-sm font-medium truncate">
              {videoData?.title || "Loading..."}
            </div>
            <div className="text-muted-foreground text-xs truncate">
              {videoData?.creatorName || ""}
            </div>
            {/* Queue/Next buttons removed in PR-5 with the drawer. */}
          </div>

          {/* Controls (inert shells) */}
          <div className="flex items-center gap-1">
            <MuteButton size="sm" />

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
