// LuminousCellRating — Apple-finish continuous capsule. Drop-in for TickScrubber.
// Same props, same tierFor export, same haptics/snap/keyboard contract.

import React, { useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { getRatingTier, HERO_NUMBER_STYLE, TIER_LABEL_STYLE, ratingTextColor, rampForRating } from '@/lib/ratingTier';

const INK = '#0F172A';
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
  compact?: boolean;
  ariaLabel?: string;
}

export function LuminousCellRating({
  value,
  onChange,
  hero = false,
  compact = false,
  ariaLabel,
}: LuminousCellRatingProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);
  const touched = value != null;
  const v = value ?? 0;
  const tier = tierFor(value);
  const lastTick = useRef<number>(touched ? v : -1);

  const rowHeight = compact ? 20 : hero ? 24 : 26;
  const radius = rowHeight / 2;
  const fillPct = touched ? v * 10 : 0;

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
  const glowColor =
    tierKey === 'EXCEPTIONAL'
      ? 'rgba(255,194,61,0.9)'
      : tierKey === 'EXCELLENT' || tierKey === 'GOOD'
      ? 'rgba(247,147,30,0.85)'
      : 'rgba(138,149,164,0.8)';
  const restGlow = tierKey === 'EXCEPTIONAL' ? 0.22 : 0;
  const glowOpacity = active ? 0.6 : restGlow;
  const fillTransition = active
    ? 'none'
    : 'width 200ms cubic-bezier(.22,.61,.36,1), background 180ms ease';
  const glowTransition = active
    ? 'none'
    : 'opacity 220ms ease, width 200ms cubic-bezier(.22,.61,.36,1)';

  return (
    <div>
      {hero && (
        <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                ...HERO_NUMBER_STYLE,
                fontSize: 'clamp(44px, 14vw, 66px)',
                lineHeight: 1,
                color: touched ? ratingTextColor(v) : 'rgba(15,23,42,0.16)',
                transform: active ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 140ms ease, color 160ms ease',
                display: 'inline-block',
              }}
            >
              {touched ? v.toFixed(1) : '0.0'}
            </span>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(148,163,184,0.7)' }}>/10</span>
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
          height: rowHeight,
          marginTop: hero ? 8 : 0,
          borderRadius: radius,
          background: 'rgba(118,118,128,0.12)',
          boxShadow: 'inset 0 0 0 0.5px rgba(15,23,42,0.05)',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          cursor: active ? 'grabbing' : 'pointer',
          outline: 'none',
        }}
      >
        {/* Bloom glow behind fill */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${fillPct}%`,
            filter: 'blur(12px)',
            opacity: glowOpacity,
            background: `linear-gradient(90deg, transparent 0%, ${glowColor} 100%)`,
            transition: glowTransition,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Continuous fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${ramp.lo} 0%, ${ramp.mid} 70%, ${ramp.hi} 100%)`,
            transition: fillTransition,
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Top sheen */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%)',
              pointerEvents: 'none',
            }}
          />
          {/* Leading edge highlight */}
          {fillPct > 1 && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '18%',
                bottom: '18%',
                right: 0,
                width: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.5)',
                filter: active ? 'blur(0.5px)' : 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Whole-number notch overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const x = ((i + 1) / 10) * 100;
            const filled = fillPct >= x;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '26%',
                  bottom: '26%',
                  left: `${x}%`,
                  width: 1,
                  background: filled ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.07)',
                  transition: 'background 180ms ease',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { tierFor };
export default LuminousCellRating;
// Note: INK is retained for parity with TickScrubber's palette imports.
void INK;
