/**
 * SnapVideoPlayer — poster-only chassis (Stage B4 of the video teardown).
 *
 * All hls/<video>/.play()/pool/seek/loop logic has been severed. This file
 * exists as an inert shell that renders the poster where the video used to
 * be, preserving layout, blurred-fill backdrop, object-fit selection, and
 * the tap-pause UI (as a store toggle only — no playback to pause).
 *
 * The file + export are intentionally kept so upstream feed code (FeedCard,
 * MediaCarousel, FeedSlide, etc.) continues to import without churn. When
 * the new VideoEngine lands it will re-mount here.
 */
import React, { useCallback, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { VideoSlot } from '@/video/pool/VideoSlot';

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
  thumbnailUrl,
  width,
  height,
  isActive,
  isSuggestedFeed,
  isFullscreen = false,
  postId,
  onFirstFrameReady,
}: SnapVideoPlayerProps) {
  const userPaused = useClubhouseStore((s) => s.userPaused);
  const aspect = (height ?? 1) > 0 && (width ?? 0) > 0
    ? (height as number) / (width as number)
    : 1;
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const screenAspect = vv && vv.width > 0
    ? vv.height / vv.width
    : (typeof window !== 'undefined' && window.innerWidth > 0
        ? window.innerHeight / window.innerWidth
        : 2.17);
  const FULL_BLEED_RATIO = 0.85;
  const objectFit: 'cover' | 'contain' = isFullscreen
    ? (aspect >= screenAspect * FULL_BLEED_RATIO ? 'cover' : 'contain')
    : (isSuggestedFeed ? 'cover' : (aspect >= 1.5 ? 'cover' : 'contain'));
  const isFullBleed = isFullscreen && objectFit === 'cover';

  // Tap toggles the store's userPaused flag — kept as an inert UI shell so
  // the tap-pause affordance still round-trips through the store when the
  // new engine is wired back in.
  const handleTap = useCallback(() => {
    const store = useClubhouseStore.getState();
    store.setUserPaused(!store.userPaused);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#0A0E14' }}
      onClick={handleTap}
    >
      {/* Blurred-fill backdrop — only when letterboxing (contain). */}
      {isFullscreen && thumbnailUrl && !isFullBleed ? (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(60px) saturate(1.3) brightness(0.55)', transform: 'scale(1.4)', willChange: 'transform',
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.6)', transform: 'scale(1.05)', opacity: 0.5,
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.35) 100%)',
          }} />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ background: '#0A0E14' }} aria-hidden="true" />
      )}

      {/* Pooled <video> path — always on. Poster fallback when no HLS. */}
      {hlsUrl ? (
        <VideoSlot
          slotKey={postId || hlsUrl}
          hlsUrl={hlsUrl}
          posterUrl={thumbnailUrl}
          isActive={isActive && !userPaused}
          muted={true}
          objectFit={objectFit}
          onFirstFrame={onFirstFrameReady}
        />
      ) : (
        thumbnailUrl && (
          <img
            src={thumbnailUrl}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit,
              objectPosition: 'center',
              zIndex: 1,
            }}
          />
        )
      )}
    </div>
  );
});

export default SnapVideoPlayer;
