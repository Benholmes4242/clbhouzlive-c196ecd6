/**
 * VideoSlot — reparents a pooled <video> element into a card's slot.
 *
 * Renders:
 *   - a positioned container that hosts the pooled <video> via appendChild
 *   - a poster <img> underneath, cross-faded out only after the pooled
 *     element commits its first real decoded frame (readyState >= 2 AND
 *     videoWidth > 0).
 *
 * Audio: registers with AudioBroker. Active, non-locally-muted slots claim
 * focus; the broker decides which single element is unmuted globally.
 */
import React, { useEffect, useRef, useState } from 'react';
import { VideoPool } from './VideoPool';
import { AudioBroker, type AudioPolicy } from './AudioBroker';

interface VideoSlotProps {
  slotKey: string;             // stable id, e.g. postId
  hlsUrl: string;
  posterUrl?: string;
  isActive: boolean;
  muted?: boolean;
  objectFit?: 'cover' | 'contain';
  onFirstFrame?: () => void;
  audioPolicy?: AudioPolicy;
  /** Optional start time (seconds) to seek to after the source loads. */
  startPosition?: number;
}

export const VideoSlot: React.FC<VideoSlotProps> = ({
  slotKey,
  hlsUrl,
  posterUrl,
  isActive,
  muted = false,
  objectFit = 'cover',
  onFirstFrame,
  audioPolicy = 'inline-session',
  startPosition = -1,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [firstFrame, setFirstFrame] = useState(false);
  const acquiredRef = useRef<{ slotKey: string; hlsUrl: string } | null>(null);
  const startPosRef = useRef(startPosition);
  startPosRef.current = startPosition;

  // Reparent a pooled <video> into this slot on mount / url change.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const video = VideoPool.acquire(slotKey, hlsUrl);
    acquiredRef.current = { slotKey, hlsUrl };
    video.style.objectFit = objectFit;
    if (host.firstChild !== video) host.appendChild(video);

    const markReady = () => {
      if ((video as HTMLVideoElement).videoWidth > 0) {
        setFirstFrame(true);
        onFirstFrame?.();
      }
    };

    // Warm hit: element may already have decoded frames.
    if (video.readyState >= 2 && video.videoWidth > 0) {
      markReady();
    } else {
      video.addEventListener('loadeddata', markReady, { once: true });
      // Fallback: timeupdate also signals a committed frame.
      video.addEventListener('timeupdate', function onTime() {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          video.removeEventListener('timeupdate', onTime);
          markReady();
        }
      });
    }

    // Register with the audio broker under this slot.
    AudioBroker.register(slotKey, video, audioPolicy);

    return () => {
      video.removeEventListener('loadeddata', markReady);
      AudioBroker.unregister(slotKey);
      VideoPool.release(slotKey);
      acquiredRef.current = null;
      // Do NOT remove the element from `host` — React will unmount `host`
      // itself and the pooled <video> continues living in the pool.
    };
  }, [slotKey, hlsUrl, objectFit, onFirstFrame, audioPolicy]);

  // Apply startPosition once the active source is loaded.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const video = host.querySelector('video') as HTMLVideoElement | null;
    if (!video || startPosRef.current <= 0) return;

    const apply = () => {
      try {
        if (Math.abs(video.currentTime - startPosRef.current) > 0.5) {
          video.currentTime = startPosRef.current;
        }
      } catch { /* ignore */ }
    };

    if (video.readyState >= 2) {
      apply();
    } else {
      const handler = () => { apply(); video.removeEventListener('loadeddata', handler); };
      video.addEventListener('loadeddata', handler, { once: true });
      return () => video.removeEventListener('loadeddata', handler);
    }
  }, [slotKey, hlsUrl, startPosition]);

  // Drive play/pause + local mute + focus claim from props.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const video = host.querySelector('video') as HTMLVideoElement | null;
    if (!video) return;

    if (isActive) {
      if (muted) {
        AudioBroker.releaseFocus(slotKey);
      } else {
        AudioBroker.claimFocus(slotKey);
      }
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay guard */ });
    } else {
      AudioBroker.releaseFocus(slotKey);
      try { video.pause(); } catch { /* ignore */ }
    }
  }, [isActive, muted, slotKey]);

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
