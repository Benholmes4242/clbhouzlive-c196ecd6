import { useState, useRef, useCallback, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface PosterFramePickerProps {
  videoUrl: string;
  duration: number;
  onSelect: (timeSeconds: number) => void;
  initialTime?: number;
  trimStart?: number | null;
  trimEnd?: number | null;
}

export function PosterFramePicker({
  videoUrl,
  duration,
  onSelect,
  initialTime,
  trimStart,
  trimEnd,
}: PosterFramePickerProps) {
  const rangeStart = trimStart ?? 0;
  const rangeEnd = trimEnd ?? duration;
  const rangeDuration = rangeEnd - rangeStart;

  const [selectedTime, setSelectedTime] = useState(
    initialTime ?? Math.max(rangeStart, 1)
  );
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = selectedTime;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekTo = useCallback((time: number) => {
    const clamped = Math.max(rangeStart, Math.min(rangeEnd, time));
    const rounded = Math.round(clamped * 10) / 10;
    setSelectedTime(rounded);
    if (videoRef.current) {
      videoRef.current.currentTime = rounded;
    }
    onSelect(rounded);
  }, [rangeStart, rangeEnd, onSelect]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(rangeStart + pct * rangeDuration);
  }, [seekTo, rangeStart, rangeDuration]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(rangeStart + pct * rangeDuration);
  }, [isDragging, seekTo, rangeStart, rangeDuration]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const presets = [0, 0.25, 0.5, 0.75].map(pct => {
    const time = Math.round((rangeStart + pct * rangeDuration) * 10) / 10;
    return Math.max(rangeStart, Math.min(rangeEnd, time));
  });

  const positionPct = rangeDuration > 0
    ? ((selectedTime - rangeStart) / rangeDuration) * 100
    : 0;

  return (
    <div className="space-y-3">
      {/* Nav bar — matches Studio / MediaPreviewViewer pattern */}
      <div className="h-11 flex items-center justify-between px-4 bg-black">
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/70">
          <ImageIcon size={14} />
          Cover frame
        </span>
        <span className="text-xs font-medium tabular-nums text-primary">
          {formatTime(selectedTime)}
        </span>
      </div>

      <div className="px-4 space-y-3 pb-3">
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-contain"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = selectedTime;
            }
          }}
        />
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        className="relative h-10 rounded-lg bg-white/10 touch-none select-none cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
          style={{ left: `${positionPct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg z-20 pointer-events-none"
          style={{ left: `calc(${positionPct}% - 8px)` }}
        />
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {presets.map((t, i) => (
          <button
            key={i}
            onClick={() => seekTo(t)}
            className={`flex-1 px-2 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              Math.abs(selectedTime - t) < 0.5
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {formatTime(t)}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
