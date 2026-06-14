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
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
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
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && !attachedRef.current) {
      attachedRef.current = true;
      const hlsUrl = item.hlsUrl || '';
      const mp4 = item.mp4Url;
      video.muted = isMuted;
      video.playsInline = true;

      const armFirstFrame = () => {
        const v = video as any;
        if (typeof v.requestVideoFrameCallback === 'function') {
          v.requestVideoFrameCallback(() => setHasFirstFrame(true));
        } else {
          const onPlaying = () => setHasFirstFrame(true);
          video.addEventListener('playing', onPlaying, { once: true });
        }
      };

      if (hlsUrl) {
        attachHlsToTile({ hlsUrl, mp4Fallback: mp4, video })
          .then((hls) => { hlsRef.current = hls; armFirstFrame(); })
          .catch(() => {});
      } else if (mp4) {
        video.src = mp4;
        video.play().catch(() => {});
        armFirstFrame();
      }
    } else if (!isActive && attachedRef.current) {
      attachedRef.current = false;
      setHasFirstFrame(false);
      try { video.pause(); } catch {}
      try { hlsRef.current?.destroy?.(); } catch {}
      hlsRef.current = null;
      try { video.removeAttribute('src'); video.load(); } catch {}
    }
  }, [isActive, item.hlsUrl, item.mp4Url, isMuted]);

  // Reactively update muted state on the live element without re-attaching HLS
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  // Reset poster when deactivated
  useEffect(() => {
    if (!isActive) setHasFirstFrame(false);
  }, [isActive]);

  useEffect(() => () => {
    try { hlsRef.current?.destroy?.(); } catch {}
    hlsRef.current = null;
  }, []);

  return (
    <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
      {item.thumbnailUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${item.thumbnailUrl})`,
            backgroundSize: objectFit === 'contain' ? 'contain' : 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: hasFirstFrame ? 0 : 1,
            transition: 'opacity 200ms ease-out',
            zIndex: 1,
          }}
        />
      )}
      <video
        ref={videoRef}
        muted={isMuted}
        playsInline
        preload="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
          backgroundColor: 'transparent',
          zIndex: 2,
        }}
      />
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isMuted) markUserGestureUnmute();
            toggleMute();
          }}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 36,
            height: 36,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 5,
          }}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
