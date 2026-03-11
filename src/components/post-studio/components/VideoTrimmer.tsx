// VideoTrimmer — Canvas-based waveform trim handles
// Two amber drag handles for start/end, selected region overlay

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { StudioMediaItem } from '../types';

interface VideoTrimmerProps {
  item: StudioMediaItem;
  onTrimChange: (trimStart: number, trimEnd: number) => void;
}

const HANDLE_WIDTH = 16;
const MIN_TRIM_DURATION = 1; // seconds

export function VideoTrimmer({ item, onTrimChange }: VideoTrimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const duration = item.duration ?? 0;
  const trimStart = item.trimStart;
  const trimEnd = item.trimEnd ?? duration;

  // Convert time to percentage
  const timeToPercent = (time: number) => (duration > 0 ? (time / duration) * 100 : 0);
  const percentToTime = (percent: number) => (percent / 100) * duration;

  const startPercent = timeToPercent(trimStart);
  const endPercent = timeToPercent(trimEnd);

  const handlePointerDown = useCallback(
    (handle: 'start' | 'end') => (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(handle);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      let time = percentToTime(percent);

      // Snap to 0.1s increments
      time = Math.round(time * 10) / 10;

      if (isDragging === 'start') {
        const maxStart = trimEnd - MIN_TRIM_DURATION;
        time = Math.max(0, Math.min(time, maxStart));
        onTrimChange(time, trimEnd);
      } else {
        const minEnd = trimStart + MIN_TRIM_DURATION;
        time = Math.max(minEnd, Math.min(time, duration));
        onTrimChange(trimStart, time);
      }
    },
    [isDragging, trimStart, trimEnd, duration, onTrimChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const trimDuration = trimEnd - trimStart;

  return (
    <div className="w-full space-y-2">
      {/* Duration label */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(trimStart)} — {formatTimestamp(trimEnd)}{' '}
          <span className="text-foreground font-medium">({Math.round(trimDuration)}s)</span>
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative h-14 rounded-lg overflow-hidden bg-muted touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Unselected region: before start */}
        <div
          className="absolute inset-y-0 left-0 bg-black/50 z-10"
          style={{ width: `${startPercent}%` }}
        />

        {/* Selected region */}
        <div
          className="absolute inset-y-0 z-10"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
            backgroundColor: 'hsl(var(--primary) / 0.2)',
            borderTop: '2px solid hsl(var(--primary))',
            borderBottom: '2px solid hsl(var(--primary))',
          }}
        />

        {/* Unselected region: after end */}
        <div
          className="absolute inset-y-0 right-0 bg-black/50 z-10"
          style={{ width: `${100 - endPercent}%` }}
        />

        {/* Start handle */}
        <div
          onPointerDown={handlePointerDown('start')}
          className="absolute inset-y-0 z-20 flex items-center cursor-ew-resize"
          style={{ left: `calc(${startPercent}% - ${HANDLE_WIDTH / 2}px)` }}
        >
          <div className="w-4 h-full bg-primary rounded-l-md flex items-center justify-center">
            <div className="w-0.5 h-5 bg-primary-foreground rounded-full" />
          </div>
        </div>

        {/* End handle */}
        <div
          onPointerDown={handlePointerDown('end')}
          className="absolute inset-y-0 z-20 flex items-center cursor-ew-resize"
          style={{ left: `calc(${endPercent}% - ${HANDLE_WIDTH / 2}px)` }}
        >
          <div className="w-4 h-full bg-primary rounded-r-md flex items-center justify-center">
            <div className="w-0.5 h-5 bg-primary-foreground rounded-full" />
          </div>
        </div>

        {/* Waveform placeholder — visual bars */}
        <div className="absolute inset-0 flex items-center justify-evenly px-2 opacity-30">
          {Array.from({ length: 40 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.8) * 15 + Math.random() * 10;
            return (
              <div
                key={i}
                className="w-0.5 bg-foreground rounded-full"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
