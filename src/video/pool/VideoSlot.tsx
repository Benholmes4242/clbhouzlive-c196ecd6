/**
 * VideoSlot — reparents a pooled <video> element into a card's slot.
 *
 * Renders:
 *   - a positioned container that hosts the pooled <video> via appendChild
 *   - a poster <img> underneath, cross-faded out only after the pooled
 *     element commits its first frame (`loadeddata`)
 *
 * This component is the ONLY consumer of `VideoPool.acquire/release`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { VideoPool, type PoolSurface } from './VideoPool';

interface VideoSlotProps {
  slotKey: string;             // stable id, e.g. postId
  hlsUrl: string;
  posterUrl?: string;
  isActive: boolean;
  muted: boolean;
  objectFit?: 'cover' | 'contain';
  surface?: PoolSurface;       // 'inline' (default) or 'fullscreen'
  onFirstFrame?: () => void;
}

export const VideoSlot: React.FC<VideoSlotProps> = ({
  slotKey,
  hlsUrl,
  posterUrl,
  isActive,
  muted,
  objectFit = 'cover',
  surface = 'inline',
  onFirstFrame,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [firstFrame, setFirstFrame] = useState(false);

  // Reparent a pooled <video> into this slot on mount / url change.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const video = VideoPool.acquire(slotKey, hlsUrl, surface);
    video.style.objectFit = objectFit;
    if (host.firstChild !== video) host.appendChild(video);

    const onLoaded = () => {
      setFirstFrame(true);
      onFirstFrame?.();
    };
    // If already decoded (warm hit), fire immediately.
    if (video.readyState >= 2) onLoaded();
    else video.addEventListener('loadeddata', onLoaded, { once: true });

    return () => {
      video.removeEventListener('loadeddata', onLoaded);
      VideoPool.release(slotKey);
      // Do NOT remove the element from `host` — React will unmount `host`
      // itself and the pooled <video> continues living in the pool.
    };
  }, [slotKey, hlsUrl, objectFit, surface, onFirstFrame]);

  // Drive play/pause + mute from props on whichever element currently owns this slot.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const video = host.querySelector('video') as HTMLVideoElement | null;
    if (!video) return;
    video.muted = muted;
    if (isActive) {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay guard */ });
    } else {
      try { video.pause(); } catch { /* ignore */ }
    }
  }, [isActive, muted]);

  return (
    <>
      {posterUrl && (
        <img
          src={posterUrl}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full transition-opacity duration-200"
          style={{
            objectFit,
            objectPosition: 'center',
            opacity: firstFrame ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}
      <div
        ref={hostRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 2 }}
      />
    </>
  );
};

export default VideoSlot;
