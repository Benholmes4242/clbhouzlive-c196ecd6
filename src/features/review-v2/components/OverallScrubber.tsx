/**
 * OverallScrubber - the step 0 dial. Range 1.0 to 10.0 in 0.1 steps.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RV2 } from '../tokens';
import { FIGURE } from '@/lib/tokens/type';
import { bandColorOnDark as bandColor } from '../bandColor';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  caption: string;
  ariaLabel: string;
  /** Band markers for the axis, e.g. "Below 5.0" / "5.0 to 8.9" / "9.0 and up". */
  bandLabels: { low: string; mid: string; high: string };
  /** Live calibration against the member's OWN rated courses. Null hides it. */
  calibration?: string | null;
}


const MIN = 1;
const MAX = 10;
const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));
const snap = (n: number) => Math.round(clamp(n) * 10) / 10;
const toPct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

const MARK_5 = toPct(5);
const MARK_9 = toPct(9);

export function OverallScrubber({ value, onChange, caption, ariaLabel, bandLabels, calibration }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const ghostDragRef = useRef(false);
  const movedRef = useRef(false);
  const color = bandColor(value);
  const fillPct = value == null ? 0 : toPct(value);

  const pointerToValue = useCallback((clientX: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    onChange(snap(MIN + pct * (MAX - MIN)));
  }, [onChange]);

  const startDrag = useCallback((fromGhost: boolean) => {
    setDragging(true);
    ghostDragRef.current = fromGhost;
    movedRef.current = false;
  }, []);

  const endDrag = useCallback(() => {
    setDragging(false);
    ghostDragRef.current = false;
    movedRef.current = false;
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (ghostDragRef.current && value == null && !movedRef.current) {
        movedRef.current = true;
      }
      pointerToValue(e.clientX);
    };
    const onUp = () => endDrag();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, pointerToValue, endDrag, value]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = value ?? MIN;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(snap(current + 0.1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(snap(current - 0.1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(MIN);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(MAX);
    }
  };

  const showGhost = value == null;

  return (
    <div>
      <div
        style={{
          fontSize: 64,
          ...FIGURE,
          lineHeight: 1,
          letterSpacing: '-0.035em',
          color: value == null ? RV2.muted : color,
        }}
      >
        {value == null ? '--' : value.toFixed(1)}
      </div>
      <div style={{ fontSize: 13, color: RV2.secondary, margin: '6px 0 18px', minHeight: 17 }}>
        {caption}
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value == null ? 'Not scored' : undefined}
        aria-label={ariaLabel}
        onPointerDown={(e) => {
          startDrag(false);
          pointerToValue(e.clientX);
        }}
        onKeyDown={onKeyDown}
        style={{
          padding: '16px 0',
          background: 'transparent',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: 12,
          borderRadius: 999,
          background: RV2.track,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fillPct}%`,
            background: value == null ? 'transparent' : color,
            borderRadius: 999,
            transition: dragging ? 'none' : 'width 120ms ease',
          }}
        />
        {[MARK_5, MARK_9].map((m) => (
          <div
            key={m}
            aria-hidden
            style={{
              position: 'absolute',
              left: `${m}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: RV2.trackStrong,
              pointerEvents: 'none',
            }}
          />
        ))}
        {value != null && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: `${fillPct}%`,
              transform: 'translate(-50%, -50%)',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: RV2.ink,
              border: `2.5px solid ${color}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          />
        )}
        {showGhost && (
          <div
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation();
              startDrag(true);
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${toPct(MIN)}%`,
              transform: 'translate(-50%, -50%)',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'transparent',
              border: `1.5px solid ${RV2.muted}`,
              boxShadow: 'none',
              cursor: 'pointer',
              touchAction: 'none',
            }}
          />
        )}
      </div>
      </div>


      <div
        aria-hidden
        style={{
          display: 'flex',
          marginTop: 9,
          /* AXIS — STATED EXCEPTION. These are the three band tick labels
             under the track (POOR / GOOD / GREAT): coordinates on the scale,
             not language, and they sit in fixed percentage-width slots that a
             READ lift would collide. Floor 10. */
          fontSize: 10,
          ...FIGURE,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ width: `${MARK_5}%`, color: bandColor(1) }}>{bandLabels.low}</span>
        <span style={{ width: `${MARK_9 - MARK_5}%`, color: bandColor(5) }}>{bandLabels.mid}</span>
        <span style={{ flex: 1, color: bandColor(9) }}>{bandLabels.high}</span>
      </div>

      {calibration && (
        <div style={{ fontSize: 13, color: RV2.secondary, marginTop: 12 }}>{calibration}</div>
      )}
    </div>

  );
}
