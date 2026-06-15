import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { haptic } from '@/utils/haptics';
import { registerAudioSource, unregisterAudioSource } from '@/utils/globalVideoMute';
import { useHlsPool } from '@/media/hooks/useHlsPool';
import { usePausedFirstFrame } from '@/media/hooks/usePausedFirstFrame';
import { useGaplessLoop } from '@/utils/video/GaplessLoop';
import { fsTimeStart, fsTimeEnd, fsEvent, logTileLife } from '@/media/mobileVideoDebug';

interface SnapVideoPlayerProps {
  hlsUrl: string;
  mp4Url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  isActive: boolean;
  activeIndex: number;
  feedIndex: number;
  isSuggestedFeed: boolean;
  onFirstFrameReady?: () => void;
  isFullscreen?: boolean;
  postId?: string;
}

export const SnapVideoPlayer = memo(function SnapVideoPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  width,
  height,
  duration,
  isActive,
  activeIndex,
  feedIndex,
  isSuggestedFeed,
  onFirstFrameReady,
  isFullscreen = false,
  postId,
}: SnapVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [attachToken, setAttachToken] = useState(0);

  const firstFrameFiredRef = useRef(false);

  const isMuted = useClubhouseStore(s => s.isMuted);
  const userPaused = useClubhouseStore(s => s.userPaused);

  const pool = useHlsPool();
  const { hasFirstFrame, reset } = usePausedFirstFrame(videoRef, isActive, attachToken);

  // Register with global audio mutex
  useEffect(() => {
    const id = `snap-video-${feedIndex}`;
    registerAudioSource(id, () => {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
      }
    });
    return () => unregisterAudioSource(id);
  }, [feedIndex]);

  const aspect = (height ?? 1) > 0 && (width ?? 0) > 0
    ? (height as number) / (width as number)
    : 1.0;
  const objectFit: 'cover' | 'contain' = isFullscreen
    ? 'contain'
    : (isSuggestedFeed ? 'cover' : (aspect >= 1.5 ? 'cover' : 'contain'));

  // ── Attach/teardown via shared hook (pool-aware demote-not-destroy) ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const distance = Math.abs(feedIndex - activeIndex);
    let cancelled = false;

    if (isActive || distance <= 2) {
      video.muted = useClubhouseStore.getState().isMuted;
      video.playsInline = true;
      pool.attach(hlsUrl, video, mp4Url).then(() => {
        if (cancelled) return;
        setAttachToken((t) => t + 1);
        try { if (video.currentTime < 0.001) video.currentTime = 0.001; } catch {}
      });
      return () => { cancelled = true; };
    } else {
      pool.teardown(hlsUrl);
      reset();
      try { video.removeAttribute('src'); video.load(); } catch {}
      setShowReplay(false);
      useClubhouseStore.getState().setActiveVideoElement(null, null);
    }
  }, [isActive, feedIndex, activeIndex, hlsUrl, mp4Url]);

  // ── Active-element store registration (shell concern) ──
  // Hook owns play(); we own the global active-element pointer.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = useClubhouseStore.getState().isMuted;
      useClubhouseStore.getState().setActiveVideoElement(video, videoRef);
    } else {
      try { video.pause(); } catch {}
    }
  }, [isActive]);

  // First-frame ready callback (fires once per mount when hook signals frame).
  useEffect(() => {
    if (hasFirstFrame && !firstFrameFiredRef.current) {
      firstFrameFiredRef.current = true;
      onFirstFrameReady?.();
      // Timing: first frame painted → blur is now gone. Ends the blur-visible span.
      fsTimeEnd(`slide:${feedIndex}`, `🎞️ FRAME_PAINTED #${feedIndex} (blur→video)`);
      // If this is the slide the viewer opened on, also close the open→visible span.
      if (isActive) fsTimeEnd('open', `✅ OPEN→FRAME #${feedIndex} (tap→video visible)`);
    }
  }, [hasFirstFrame, onFirstFrameReady, feedIndex, isActive]);

  // Timing: when this slide becomes active, start the blur-visible span.
  // The gap between this and FRAME_PAINTED IS the blur-on-screen duration.
  useEffect(() => {
    if (isActive && !hasFirstFrame) {
      fsTimeStart(`slide:${feedIndex}`);
      fsEvent(`👁️ BLUR_VISIBLE #${feedIndex}`, { hasFrame: hasFirstFrame });
      logTileLife(`fs${feedIndex}`, feedIndex, 'ACTIVE', { hasFirstFrame });
    }
  }, [isActive, hasFirstFrame, feedIndex]);

  // ── Sync muted state ──
  useEffect(() => {
    const video = videoRef.current;
    if (video && isActive) {
      video.muted = isMuted;
    }
  }, [isMuted, isActive]);

  // ── Sync userPaused ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;
    if (userPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [userPaused, isActive]);

  // Seamless loop while this slide is active (RAF-based, no seek-black seam).
  useGaplessLoop(videoRef, isActive, false);

  // ── Continue-watching seek (event-based, no DOM poll) ──
  const pendingSeekRef = useRef<number | null>(null);
  useEffect(() => {
    if (!postId) return;
    const onSeek = (e: Event) => {
      const detail = (e as CustomEvent).detail as { postId: string; seconds: number };
      if (!detail?.postId || detail.postId !== postId || !detail.seconds) return;
      const video = videoRef.current;
      if (!video) { pendingSeekRef.current = detail.seconds; return; }
      if (isFinite(video.duration) && video.duration > 0) {
        try { video.currentTime = Math.min(detail.seconds, video.duration - 1); } catch {}
      } else {
        pendingSeekRef.current = detail.seconds;
      }
    };
    window.addEventListener('continue-watching:seek', onSeek as EventListener);
    return () => window.removeEventListener('continue-watching:seek', onSeek as EventListener);
  }, [postId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      if (pendingSeekRef.current != null && isFinite(video.duration) && video.duration > 0) {
        try { video.currentTime = Math.min(pendingSeekRef.current, video.duration - 1); } catch {}
        pendingSeekRef.current = null;
      }
    };
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('durationchange', onMeta);
    };
  }, []);

  // ── Tap handling (single tap = play/pause) ──
  const handleTap = useCallback(() => {
    const store = useClubhouseStore.getState();
    store.setUserPaused(!store.userPaused);
  }, []);

  // ── Replay handler ──
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setShowReplay(false);
    video.currentTime = 0;
    video.play().catch(() => {});
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#0A0E14' }}
      onClick={handleTap}
    >
      {/* Backdrop — blurred thumbnail in fullscreen, solid matte otherwise. */}
      {isFullscreen && thumbnailUrl ? (
        <div aria-hidden="true" className="absolute inset-0" style={{
          backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
        }} />
      ) : (
        <div className="absolute inset-0" style={{ background: '#0A0E14' }} aria-hidden="true" />
      )}

      {/* Crisp first-frame poster — instant arrival frame at same object-fit
          as the video, sitting above the blur and below the video. No decoder
          cost. Fades out as the decoded video fades in (identical frame). */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit,
            zIndex: 1,
            opacity: hasFirstFrame ? 0 : 1,
            transition: 'opacity 120ms ease-out',
          }}
        />
      )}

      {/* Video element — fades in over the crisp poster (seamless crossfade). */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit,
          zIndex: 2,
          opacity: hasFirstFrame ? 1 : 0,
          transition: 'opacity 120ms ease-out',
        }}
      />

      {/* Buffering indicator — subtle bottom bar */}
      {isActive && !hasFirstFrame && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            zIndex: 3,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Replay overlay */}
      {showReplay && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10, background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { e.stopPropagation(); handleReplay(); }}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

export default SnapVideoPlayer;
