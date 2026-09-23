/**
 * OverallScrubber - the step 0 dial. Range 1.0 to 10.0 in 0.1 steps.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RV2 } from '../tokens';
import { FIGURE } from '@/lib/tokens/type';
/* THE COMPOSER PREVIEWS THE COURSE PAGE, so it takes the COURSE PAGE'S RULE:
   9.0 and above is green, everything else is mute. One implementation, imported
   — the three-band composer scale (bandColorOnDark) is no longer used here
   because a score shown at 8.4 in amber while the course page shows it mute was
   the composer promising something the ranking does not print. */
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  caption: string;
  ariaLabel: string;
  /** Live calibration against the member's OWN rated courses. Null hides it. */
  calibration?: string | null;
  /** Untouched dial: numeral, fill and handle render quiet. Fill width stays. */
  muted?: boolean;
}


const MIN = 1;
const MAX = 10;
const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));
const snap = (n: number) => Math.round(clamp(n) * 10) / 10;
const toPct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

const MARK_5 = toPct(5);
const MARK_9 = toPct(9);

export function OverallScrubber({ value, onChange, caption, ariaLabel, calibration, muted }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const ghostDragRef = useRef(false);
  const movedRef = useRef(false);
  const liveColor = courseSubScoreTone(value);
  const color = muted ? RV2.muted : liveColor;
  const fillColor = muted ? RV2.trackStrong : liveColor;
  const handleBorder = muted ? RV2.trackStrong : liveColor;
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
        {value == null ? '\u2014' : value.toFixed(1)}
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
            background: value == null ? 'transparent' : fillColor,
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
        {/* THE HANDLE. Unset and set render IDENTICALLY: same 26px, same solid
            off-white fill, same shadow. A hollow ring read as unloaded content
            on device. The unset state is carried by the EMPTY TRACK and the
            BLANK NUMERAL, not by a weaker handle.
            courseSubScoreTone(null) is the MUTE tier, so no green leaks in
            before the member has scored 9.0 or above. */}
        <div
          aria-hidden
          onPointerDown={value == null ? (e) => {
            // TAP IS NOT A SCORE. A solid handle invites a tap, and a tap that
            // committed would silently score the course 1.0. Arm the drag but
            // write NOTHING: only pointermove commits a value. Stopping
            // propagation keeps the track's own tap-to-commit off the handle.
            e.stopPropagation();
            startDrag(true);
          } : undefined}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${fillPct}%`,
            transform: 'translate(-50%, -50%)',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: RV2.ink,
            border: `2.5px solid ${handleBorder}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            pointerEvents: value == null ? 'auto' : 'none',
            cursor: value == null ? 'pointer' : undefined,
            touchAction: 'none',
            transition: dragging ? 'none' : 'left 120ms ease',
          }}
        />
      </div>
      </div>


      <div
        aria-hidden
        style={{
          display: 'flex',
          marginTop: 9,
          /* AXIS — STATED EXCEPTION. Coordinates on the scale, not language,
             sitting in fixed percentage-width slots that a READ lift would
             collide. Floor 10.
             THESE USED TO NAME BANDS (POOR / GOOD / GREAT) in three band
             colours. Under the course page's two-tone rule the first two colours
             become identical and a three-colour legend reads as broken, so the
             row now MARKS THE TRACK with three plain numerals in one quiet
             tone — 1, 5 and 10 sit exactly over the track's own two tick
             marks and its end. */
          fontSize: 10,
          ...FIGURE,
          letterSpacing: '0.10em',
          color: RV2.muted,
        }}
      >
        <span style={{ width: `${MARK_5}%` }}>1</span>
        <span style={{ width: `${MARK_9 - MARK_5}%` }}>5</span>
        <span style={{ flex: 1 }}>10</span>
      </div>

      {calibration && (
        <div style={{ fontSize: 13, color: RV2.secondary, marginTop: 12 }}>{calibration}</div>
      )}
    </div>

  );
}
