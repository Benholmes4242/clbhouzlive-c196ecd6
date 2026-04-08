// VideoTrimmer — Dark amber waveform trim handles
import React, { useRef, useState, useCallback } from 'react';
import type { StudioMediaItem } from '../types';

interface VideoTrimmerProps {
  item: StudioMediaItem;
  onTrimChange: (trimStart: number, trimEnd: number) => void;
}

const HANDLE_WIDTH = 20;
const MIN_TRIM_DURATION = 1;

export function VideoTrimmer({ item, onTrimChange }: VideoTrimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const duration = item.duration ?? 0;
  const trimStart = item.trimStart;
  const trimEnd = item.trimEnd ?? duration;

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
      let time = Math.round(percentToTime(percent) * 10) / 10;

      if (isDragging === 'start') {
        time = Math.max(0, Math.min(time, trimEnd - MIN_TRIM_DURATION));
        onTrimChange(time, trimEnd);
      } else {
        time = Math.max(trimStart + MIN_TRIM_DURATION, Math.min(time, duration));
        onTrimChange(trimStart, time);
      }
    },
    [isDragging, trimStart, trimEnd, duration, onTrimChange]
  );

  const handlePointerUp = useCallback(() => setIsDragging(null), []);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden touch-none select-none"
        style={{ height: 56, background: 'rgba(255,255,255,0.04)' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center justify-evenly px-1">
          {Array.from({ length: 44 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.8) * 15 + ((i * 37 + 11) % 13);
            const barPercent = (i / 44) * 100;
            const isInSelection = barPercent >= startPercent && barPercent <= endPercent;
            return (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 2,
                  height: `${height}%`,
                  background: isInSelection ? '#F7931E' : 'rgba(255,255,255,0.12)',
                  transition: 'background 150ms',
                }}
              />
            );
          })}
        </div>

        {/* Dimmed before trim */}
        <div className="absolute inset-y-0 left-0 z-10" style={{ width: `${startPercent}%`, background: 'rgba(0,0,0,0.55)' }} />

        {/* Selected region — amber top/bottom border */}
        <div className="absolute inset-y-0 z-10" style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
          borderTop: '2px solid #F7931E',
          borderBottom: '2px solid #F7931E',
        }} />

        {/* Dimmed after trim */}
        <div className="absolute inset-y-0 right-0 z-10" style={{ width: `${100 - endPercent}%`, background: 'rgba(0,0,0,0.55)' }} />

        {/* Start handle — amber, 20px */}
        <div onPointerDown={handlePointerDown('start')} className="absolute inset-y-0 z-20 flex items-center cursor-ew-resize" style={{ left: `calc(${startPercent}% - ${HANDLE_WIDTH / 2}px)` }}>
          <div className="flex items-center justify-center" style={{
            width: HANDLE_WIDTH, height: '100%',
            background: '#F7931E',
            borderRadius: '6px 0 0 6px',
            boxShadow: '0 0 8px rgba(247,147,30,0.30)',
          }}>
            <div className="rounded-full" style={{ width: 2, height: 20, background: 'rgba(13,13,13,0.50)' }} />
          </div>
        </div>

        {/* End handle — amber, 20px */}
        <div onPointerDown={handlePointerDown('end')} className="absolute inset-y-0 z-20 flex items-center cursor-ew-resize" style={{ left: `calc(${endPercent}% - ${HANDLE_WIDTH / 2}px)` }}>
          <div className="flex items-center justify-center" style={{
            width: HANDLE_WIDTH, height: '100%',
            background: '#F7931E',
            borderRadius: '0 6px 6px 0',
            boxShadow: '0 0 8px rgba(247,147,30,0.30)',
          }}>
            <div className="rounded-full" style={{ width: 2, height: 20, background: 'rgba(13,13,13,0.50)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
