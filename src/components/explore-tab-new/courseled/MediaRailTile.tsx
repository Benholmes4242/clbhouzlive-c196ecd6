import { useEffect, useRef, useState } from 'react';

import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { r } from '@/lib/radius';

import type { CommunityLibraryItem } from './hooks/useCommunityLibrary';
import { autoplayBlocked, registerReviewVideo } from './reviewVideoAutoplay';
import { attachTileHls } from './tileHlsPlayer';

/**
 * THE MEDIA RAIL TILE — one implementation, two surfaces.
 *
 * Lifted verbatim out of GalleryTab so Watch's rails and the Amateur page's
 * clips rail cannot drift: poster first, muted, looping, playsInline, elected by
 * the group's IntersectionObserver, poster-only under reduced motion or
 * Save-Data. The GROUP is passed in, so each page owns its own player budget.
 */
export function MediaRailTile({
  item,
  index,
  width,
  autoplayGroup,
  maxPlaying = 2,
  onPress,
}: {
  item: CommunityLibraryItem;
  index: number;
  width: number;
  autoplayGroup: string;
  maxPlaying?: number;
  onPress: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const hostRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const mountVideo = item.kind === 'video' && !!item.hlsUrl && !failed && !autoplayBlocked(reducedMotion);

  useEffect(() => {
    const el = hostRef.current;
    if (!mountVideo || !el) return;
    return registerReviewVideo(autoplayGroup, el, setActive, { threshold: 0.5, maxPlaying });
  }, [mountVideo, autoplayGroup, maxPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video || !item.hlsUrl) return;
    const attachment = attachTileHls(video, item.hlsUrl, () => setFailed(true));
    video.muted = true;
    video.currentTime = 0;
    const play = video.play();
    play?.catch(() => setPlaying(false));
    return () => {
      setPlaying(false);
      video.pause();
      video.currentTime = 0;
      attachment.detach();
    };
  }, [active, item.hlsUrl]);

  return (
    <button
      ref={hostRef}
      data-gallery-video-index={index}
      type="button"
      onClick={onPress}
      style={{ width, flex: `0 0 ${width}px`, padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', width, aspectRatio: width === 176 ? '3 / 4' : '16 / 10', overflow: 'hidden', borderRadius: r.sm, background: A.PANEL }}>
        {item.thumbnail && <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {mountVideo && (
          <video
            ref={videoRef}
            poster={item.thumbnail ?? undefined}
            muted
            loop
            playsInline
            preload="none"
            disableRemotePlayback
            aria-hidden
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={(event) => {
              if (event.currentTarget.getAttribute('src')) setFailed(true);
            }}
            style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', opacity: playing ? 1 : 0, transition: 'opacity 140ms linear', pointerEvents: 'none' }}
          />
        )}
        <GlassDurationBadge seconds={item.duration} />
      </div>
      <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.displayName}</div>
    </button>
  );
}

export default MediaRailTile;
