import { useState, useRef, useCallback, useEffect } from 'react';
import { Scissors } from 'lucide-react';

interface VideoTrimmerProps {
  videoUrl: string;
  duration: number;
  onTrimChange: (trimStart: number | null, trimEnd: number | null) => void;
  initialStart?: number;
  initialEnd?: number;
}

export function VideoTrimmer({
  videoUrl,
  duration,
  onTrimChange,
  initialStart,
  initialEnd,
}: VideoTrimmerProps) {
  const [startTime, setStartTime] = useState(initialStart ?? 0);
  const [endTime, setEndTime] = useState(initialEnd ?? duration);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [isEnabled, setIsEnabled] = useState(
    initialStart !== undefined || initialEnd !== undefined
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync endTime if duration wasn't available on mount
  useEffect(() => {
    if (endTime === 0 && duration > 0) {
      setEndTime(duration);
    }
  }, [duration, endTime]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeFromPointer = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * duration * 10) / 10;
  }, [duration]);

  const handlePointerDown = useCallback((handle: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const time = getTimeFromPointer(e.clientX);

    if (isDragging === 'start') {
      const newStart = Math.min(time, endTime - 1);
      setStartTime(Math.max(0, newStart));
      if (videoRef.current) videoRef.current.currentTime = Math.max(0, newStart);
    } else {
      const newEnd = Math.max(time, startTime + 1);
      setEndTime(Math.min(duration, newEnd));
      if (videoRef.current) videoRef.current.currentTime = Math.min(duration, newEnd);
    }
  }, [isDragging, startTime, endTime, duration, getTimeFromPointer]);

  const handlePointerUp = useCallback(() => {
    if (isDragging && isEnabled) {
      const trimStart = startTime > 0.1 ? startTime : null;
      const trimEnd = endTime < duration - 0.1 ? endTime : null;
      onTrimChange(trimStart, trimEnd);
    }
    setIsDragging(null);
  }, [isDragging, isEnabled, startTime, endTime, duration, onTrimChange]);

  const toggleTrim = useCallback(() => {
    if (isEnabled) {
      setIsEnabled(false);
      setStartTime(0);
      setEndTime(duration);
      onTrimChange(null, null);
    } else {
      setIsEnabled(true);
      const trimStart = startTime > 0.1 ? startTime : null;
      const trimEnd = endTime < duration - 0.1 ? endTime : null;
      onTrimChange(trimStart, trimEnd);
    }
  }, [isEnabled, startTime, endTime, duration, onTrimChange]);

  const clipDuration = endTime - startTime;
  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (endTime / duration) * 100 : 100;

  return (
    <div className="space-y-2">
      {/* Nav bar — matches Studio / MediaPreviewViewer pattern */}
      <div className="h-11 flex items-center justify-between px-4 bg-black">
        <button
          onClick={toggleTrim}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            isEnabled ? 'text-primary' : 'text-white/50'
          }`}
        >
          <Scissors size={14} />
          {isEnabled ? 'Trim enabled' : 'Trim video'}
        </button>
        {isEnabled && (
          <div className="flex items-center gap-2 text-[11px] font-medium tabular-nums">
            <span className="text-primary">{formatTime(startTime)}</span>
            <span className="text-white/40">—</span>
            <span className="text-primary">{formatTime(endTime)}</span>
            <span className="text-white/40">({formatTime(clipDuration)})</span>
          </div>
        )}
      </div>

      <div className="px-4 space-y-2 pb-3">

      {/* Track */}
      {isEnabled && (
        <div
          ref={trackRef}
          className="relative h-11 rounded-lg overflow-hidden bg-white/10 touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Dimmed region before start */}
          <div
            className="absolute inset-y-0 left-0 bg-black/60 z-10 pointer-events-none"
            style={{ width: `${startPct}%` }}
          />
          {/* Dimmed region after end */}
          <div
            className="absolute inset-y-0 right-0 bg-black/60 z-10 pointer-events-none"
            style={{ width: `${100 - endPct}%` }}
          />
          {/* Active region border */}
          <div
            className="absolute inset-y-0 border-2 border-primary rounded-sm z-20 pointer-events-none"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          />
          {/* Start handle */}
          <div
            className="absolute inset-y-0 w-6 z-30 flex items-center justify-center cursor-ew-resize"
            style={{ left: `calc(${startPct}% - 12px)` }}
            onPointerDown={handlePointerDown('start')}
          >
            <div className="w-1 h-7 rounded-full bg-primary shadow-lg" />
          </div>
          {/* End handle */}
          <div
            className="absolute inset-y-0 w-6 z-30 flex items-center justify-center cursor-ew-resize"
            style={{ left: `calc(${endPct}% - 12px)` }}
            onPointerDown={handlePointerDown('end')}
          >
            <div className="w-1 h-7 rounded-full bg-primary shadow-lg" />
          </div>
        </div>
      )}

      {/* Hidden video for seeking during drag */}
      {isEnabled && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
          className="hidden"
        />
      )}
      </div>
    </div>
  );
}
