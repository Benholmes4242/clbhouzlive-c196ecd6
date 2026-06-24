// LuminousCellRating — ten luminous squircle cells, tap to jump, drag to fine-tune.
// Drop-in replacement for TickScrubber: same props, same tierFor export, same haptics.

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { getRatingTier, HERO_NUMBER_STYLE, TIER_LABEL_STYLE, ratingTextColor, rampForRating } from '@/lib/ratingTier';

const INK = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';

type Tier = { label: string; gold: boolean } | null;
// Delegates to the canonical `getRatingTier` so thresholds live in one place.
function tierFor(score: number | null): Tier {
  if (score == null) return null;
  const tier = getRatingTier(score);
  switch (tier) {
    case 'EXCEPTIONAL': return { label: 'Exceptional', gold: true };
    case 'EXCELLENT':   return { label: 'Excellent',   gold: false };
    case 'GOOD':        return { label: 'Good',        gold: false };
    case 'FAIR':        return { label: 'Fair',        gold: false };
    default:            return { label: 'Poor',        gold: false };
  }
}

const snap = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number) => Math.max(0, Math.min(10, v));

interface LuminousCellRatingProps {
  value: number | null;
  onChange: (v: number) => void;
  hero?: boolean;
  ariaLabel?: string;
}

const CELL_COUNT = 10;

export function LuminousCellRating({
  value,
  onChange,
  hero = false,
  ariaLabel,
}: LuminousCellRatingProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);
  const [cellSize, setCellSize] = useState({ w: 0, h: 0 });
  const touched = value != null;
  const v = value ?? 0;
  const tier = tierFor(value);
  const lastTick = useRef<number>(touched ? v : -1);

  // Layout: heights per variant. Gap proportional.
  const rowHeight = 16;
  const gap = 6;

  // Measure cell box for true 34% squircle radius.
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const cellW = (w - gap * (CELL_COUNT - 1)) / CELL_COUNT;
      setCellSize({ w: cellW, h: rowHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gap, rowHeight]);

  const radius = rowHeight / 2;

  const commit = useCallback(
    (nv: number) => {
      const prev = lastTick.current;
      if (prev >= 0) {
        const intCross = Math.floor(nv) !== Math.floor(prev);
        const halfCross = Math.floor(nv * 2) !== Math.floor(prev * 2);
        if (intCross) triggerHaptic('medium');
        else if (halfCross) triggerHaptic('light');
      }
      lastTick.current = nv;
      onChange(nv);
    },
    [onChange]
  );

  const valueFromClientX = useCallback((clientX: number): number => {
    const el = rowRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(snap(ratio * 10));
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setActive(true);
    try {
      rowRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    const nv = valueFromClientX(e.clientX);
    if (!touched) lastTick.current = nv; // no haptic on first touch
    commit(nv);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const nv = valueFromClientX(e.clientX);
    if (nv !== lastTick.current) commit(nv);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    setActive(false);
    try {
      rowRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nv = touched ? v : 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nv = clamp(snap((touched ? v : 0) + 0.1));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
      nv = clamp(snap((touched ? v : 0) - 0.1));
    else if (e.key === 'Home') nv = 0;
    else if (e.key === 'End') nv = 10;
    else return;
    e.preventDefault();
    if (!touched) lastTick.current = nv;
    commit(nv);
  };

  const ramp = rampForRating(v);
  const tierKey = getRatingTier(v);
  const fillGradient = `linear-gradient(180deg, ${ramp.hi} 0%, ${ramp.mid} 22%, ${ramp.lo} 100%)`;
  const glowSeam = tierKey === 'EXCEPTIONAL'
    ? 'rgba(255,194,61,0.55)'
    : (tierKey === 'EXCELLENT' || tierKey === 'GOOD')
    ? 'rgba(247,147,30,0.55)'
    : 'rgba(138,149,164,0.55)';
  const glowCell = tierKey === 'EXCEPTIONAL'
    ? 'rgba(255,194,61,0.32)'
    : (tierKey === 'EXCELLENT' || tierKey === 'GOOD')
    ? 'rgba(247,147,30,0.28)'
    : 'rgba(138,149,164,0.28)';
  const fillTransition = active ? 'none' : 'width 160ms cubic-bezier(.22,.61,.36,1), background 160ms';
  const activeCell = active && touched ? Math.ceil(v) - 1 : -1;

  // For each cell: 0..1 fill ratio. value*10 ∈ [0,10]; cell i (0..9) is filled for value > i.
  const cellFill = (i: number): number => {
    if (!touched) return 0;
    const score10 = v; // 0..10
    if (score10 >= i + 1) return 1;
    if (score10 <= i) return 0;
    return score10 - i; // 0..1
  };

  return (
    <div>
      {hero && (
        <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                ...HERO_NUMBER_STYLE,
                fontSize: 66,
                lineHeight: 1,
                color: touched ? ratingTextColor(v) : 'rgba(15,23,42,0.16)',
                transform: active ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 140ms ease, color 160ms ease',
                display: 'inline-block',
              }}
            >
              {touched ? v.toFixed(1) : '0.0'}
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, color: INK_FAINT }}>/10</span>
          </div>
          <div style={{ height: 18, marginTop: 5 }}>
            {tier ? (
              <span
                style={{
                  ...TIER_LABEL_STYLE,
                  fontSize: 11,
                  color: ratingTextColor(v),
                  transition: 'color 160ms ease',
                }}
              >
                {tier.label}
              </span>
            ) : (
              <span
                style={{
                  ...TIER_LABEL_STYLE,
                  fontSize: 11,
                  fontWeight: 700,
                  color: INK_FAINT,
                }}
              >
                Tap or swipe to rate
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={rowRef}
        role="slider"
        aria-label={ariaLabel || 'Rating'}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={touched ? v : undefined}
        aria-valuetext={touched ? `${v.toFixed(1)} out of 10` : 'Not set'}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKeyDown}
        style={{
          position: 'relative',
          display: 'flex',
          gap,
          height: rowHeight,
          marginTop: hero ? 8 : 0,
          touchAction: 'none',
          userSelect: 'none',
          cursor: active ? 'grabbing' : 'pointer',
          outline: 'none',
        }}
      >
        {/* Seam-glow underlay: between consecutive filled cells, render a soft radial. */}
        {touched && cellSize.w > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: `-${Math.round(rowHeight * 0.25)}px 0`,
              pointerEvents: 'none',
              zIndex: 0,
              filter: 'blur(10px)',
              opacity: 0.7,
              transition: active ? 'none' : 'opacity 160ms ease',
            }}
          >
            {Array.from({ length: CELL_COUNT - 1 }).map((_, i) => {
              const leftFilled = cellFill(i) >= 1;
              const rightFilled = cellFill(i + 1) > 0;
              if (!leftFilled || !rightFilled) return null;
              const seamX =
                (i + 1) * cellSize.w + i * gap + gap / 2;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: seamX - rowHeight * 0.6,
                    top: 0,
                    bottom: 0,
                    width: rowHeight * 1.2,
                    background: `radial-gradient(ellipse at center, ${glowSeam} 0%, transparent 65%)`,
                  }}
                />
              );
            })}
          </div>
        )}

        {Array.from({ length: CELL_COUNT }).map((_, i) => {
          const ratio = cellFill(i);
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                flex: 1,
                height: '100%',
                borderRadius: radius,
                background: 'rgba(15,23,42,0.04)',
                overflow: 'hidden',
                zIndex: 1,
                transform: i === activeCell ? 'scaleY(1.06)' : 'scaleY(1)',
                boxShadow: [
                  ratio > 0
                    ? `0 0 ${hero ? 14 : 6}px ${glowCell}`
                    : null,
                  `inset 0 1.5px 3px rgba(15,23,42,${ratio > 0 ? 0.1 : 0.16})`,
                  `inset 0 0 0 0.5px rgba(15,23,42,0.05)`,
                ]
                  .filter(Boolean)
                  .join(', '),
                transition: active
                  ? 'transform 140ms cubic-bezier(.22,.61,.36,1)'
                  : 'box-shadow 160ms ease, transform 140ms cubic-bezier(.22,.61,.36,1)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${ratio * 100}%`,
                  background: ratio > 0 ? fillGradient : 'transparent',
                  transition: active
                    ? 'none'
                    : `width 160ms cubic-bezier(.22,.61,.36,1) ${i * 18}ms, background 160ms ${i * 18}ms`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 3,
                    right: 3,
                    top: 1,
                    height: 2,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.45)',
                    opacity: ratio > 0 ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { tierFor };
export default LuminousCellRating;
// Note: INK is retained for parity with TickScrubber's palette imports.
void INK;
