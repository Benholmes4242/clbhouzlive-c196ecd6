/** Ready active hole slides and batch heroes share the review-tile election
 * and HLS attachment, never engine lanes or audioDuck. Covered players unregister
 * so clearing a cover requires a fresh in-view election before resuming. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { autoplayBlocked, registerReviewVideo } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { buildHlsUrl } from '@/utils/streamId';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';

export function HoleInlineVideo({ media, alt, fit, autoplayGroup, active, paused = false, fallback }: {
  media: { media_url: string; stream_id?: string | null; poster_url?: string | null; duration_seconds?: number | null };
  alt: string; fit: 'cover' | 'contain'; autoplayGroup: string;
  active: boolean; paused?: boolean; fallback?: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const isOpen = useFullscreenFeedStore(state => state.isOpen);
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [won, setWon] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const blocked = autoplayBlocked(reducedMotion);
  const mountVideo = active && !blocked && !failed;
  const eligible = mountVideo && !paused && !isOpen;
  const poster = holeMediaPoster({ ...media, media_type: 'video' });
  const hlsUrl = buildHlsUrl(media.stream_id || media.media_url)
    || (/\.m3u8(?:\?|$)/.test(media.media_url) ? media.media_url : '');

  useEffect(() => {
    const host = hostRef.current;
    if (!eligible || !host) return;
    return registerReviewVideo(autoplayGroup, host, setWon, { threshold: 0.5, maxPlaying: 1 });
  }, [eligible, autoplayGroup]);

  useEffect(() => {
    const video = videoRef.current;
    if (!eligible || !won || !video) return;
    if (!hlsUrl) { setFailed(true); return; }
    let disposed = false;
    const attachment = attachTileHls(video, hlsUrl, () => { if (!disposed) setFailed(true); });
    video.muted = true;
    video.currentTime = 0;
    void video.play()?.catch(() => { if (!disposed) setPlaying(false); });
    return () => {
      disposed = true;
      setPlaying(false);
      video.pause();
      video.currentTime = 0;
      attachment.detach();
    };
  }, [eligible, won, hlsUrl]);

  return <div ref={hostRef} className="absolute inset-0">
    <img src={poster} alt={alt} className="h-full w-full" style={{ objectFit: fit }} />
    {mountVideo && <video ref={videoRef} poster={poster} muted loop playsInline preload="none"
      disableRemotePlayback aria-hidden tabIndex={-1}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ objectFit: fit, opacity: playing ? 1 : 0, transition: 'opacity 140ms linear' }}
      onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onError={event => { if (event.currentTarget.getAttribute('src')) setFailed(true); }} />}
    {(blocked || failed) && fallback}
  </div>;
}