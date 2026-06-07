/**
 * InlineVideo — muted autoplay video used inside a FeedCard / MediaCarousel slide.
 *
 * Phase 2 of the Clubhouse card feed.
 *
 * Lifecycle:
 *  - When `isActive` becomes true, attach HLS via the shared
 *    `attachHlsToTile` helper (mirrors Watch/Friends autoplay surfaces) and
 *    start playback muted.
 *  - When `isActive` is false, pause and tear down the HLS instance so we
 *    never have more than one video buffering or playing.
 *  - The visible poster is the media's thumbnail. Tap is handled by the
 *    parent (opens fullscreen).
 */
import React, { useEffect, useRef } from 'react';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import type { MediaItem } from '@/components/media-system/types/media';

interface Props {
  item: MediaItem;
  isActive: boolean;
  objectFit?: 'cover' | 'contain';
}

export const InlineVideo: React.FC<Props> = ({ item, isActive, objectFit = 'cover' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const attachedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && !attachedRef.current) {
      attachedRef.current = true;
      const hlsUrl = item.hlsUrl || '';
      const mp4 = item.mp4Url;
      video.muted = true;
      video.playsInline = true;
      if (hlsUrl) {
        attachHlsToTile({ hlsUrl, mp4Fallback: mp4, video })
          .then((hls) => { hlsRef.current = hls; })
          .catch(() => {});
      } else if (mp4) {
        video.src = mp4;
        video.play().catch(() => {});
      }
    } else if (!isActive && attachedRef.current) {
      attachedRef.current = false;
      try { video.pause(); } catch {}
      try { hlsRef.current?.destroy?.(); } catch {}
      hlsRef.current = null;
      try { video.removeAttribute('src'); video.load(); } catch {}
    }
  }, [isActive, item.hlsUrl, item.mp4Url]);

  useEffect(() => () => {
    try { hlsRef.current?.destroy?.(); } catch {}
    hlsRef.current = null;
  }, []);

  return (
    <video
      ref={videoRef}
      poster={item.thumbnailUrl || undefined}
      muted
      playsInline
      preload="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit,
        display: 'block',
      }}
    />
  );
};

InlineVideo.displayName = 'InlineVideo';
