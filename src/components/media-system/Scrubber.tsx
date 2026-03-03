/**
 * Scrubber — thin progress bar at the bottom of each video.
 * Phase 1: Visual only (no seeking interaction).
 * - 2px height, white at 60% opacity for played progress
 * - Buffered range at 30% opacity
 */
import { useEffect, useState, useRef } from 'react';

interface ScrubberProps {
  videoElement: HTMLVideoElement | null;
}

export function Scrubber({ videoElement }: ScrubberProps) {
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!videoElement) return;

    const update = () => {
      const dur = videoElement.duration;
      if (dur && isFinite(dur)) {
        setProgress(videoElement.currentTime / dur);

        // Get buffered end
        if (videoElement.buffered.length > 0) {
          const buffEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
          setBuffered(buffEnd / dur);
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoElement]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px]">
      {/* Buffered range */}
      <div
        className="absolute inset-0"
        style={{
          width: `${buffered * 100}%`,
          backgroundColor: 'rgba(255,255,255,0.3)',
        }}
      />
      {/* Played progress */}
      <div
        className="absolute inset-0"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: 'rgba(255,255,255,0.6)',
          transition: 'width 100ms linear',
        }}
      />
    </div>
  );
}
