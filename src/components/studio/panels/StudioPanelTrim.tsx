import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

type StudioPanelTrimProps = {
  trimStart: number;
  trimEnd: number;
  duration: number;
  onTrimChange: (start: number, end: number) => void;
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const BAR_COUNT = 40;

export default function StudioPanelTrim({ trimStart, trimEnd, duration, onTrimChange }: StudioPanelTrimProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const clipDuration = trimEnd - trimStart;

  const handlePointerDown = useCallback((handle: 'start' | 'end', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(handle);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * duration;

    if (dragging === 'start') {
      onTrimChange(Math.min(time, trimEnd - 0.5), trimEnd);
    } else {
      onTrimChange(trimStart, Math.max(time, trimStart + 0.5));
    }
  }, [dragging, duration, trimStart, trimEnd, onTrimChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleReset = () => {
    onTrimChange(0, duration);
  };

  // Generate fake waveform heights
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const seed = Math.sin(i * 3.7 + 1.3) * 0.5 + 0.5;
    return 0.2 + seed * 0.8;
  });

  return (
    <div className="flex flex-col h-full px-4 pt-3 pb-4">
      {/* Waveform track */}
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: 64,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 8px', gap: 2 }}>
          {bars.map((h, i) => {
            const barPct = (i / BAR_COUNT) * 100;
            const inRange = barPct >= startPct && barPct <= endPct;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * 70}%`,
                  borderRadius: 1.5,
                  background: inRange ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.10)',
                  transition: 'background 0.15s',
                }}
              />
            );
          })}
        </div>

        {/* Selection border overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${startPct}%`,
          width: `${endPct - startPct}%`,
          border: '1.5px solid rgba(255,255,255,0.90)',
          borderRadius: 10,
          boxShadow: '0 0 16px rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }} />

        {/* Start handle */}
        <div
          onPointerDown={(e) => handlePointerDown('start', e)}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${startPct}%`,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 40,
            borderRadius: 5,
            background: '#ffffff',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          <div style={{ width: 2, height: 16, background: 'rgba(0,0,0,0.30)', borderRadius: 1 }} />
        </div>

        {/* End handle */}
        <div
          onPointerDown={(e) => handlePointerDown('end', e)}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${endPct}%`,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 40,
            borderRadius: 5,
            background: '#ffffff',
            cursor: 'ew-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          <div style={{ width: 2, height: 16, background: 'rgba(0,0,0,0.30)', borderRadius: 1 }} />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-3">
        {/* Duration pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.70)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(clipDuration)} clip · {fmt(duration)} total
        </div>

        {/* Reset button */}
        {(trimStart > 0 || trimEnd < duration) && (
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.60)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
