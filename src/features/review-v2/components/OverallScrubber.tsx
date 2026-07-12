/**
 * OverallScrubber — 0-10 in 0.1 steps, drag + arrow-key a11y.
 * Big 44px readout with clbhouz-gold-shimmer at >= 9.0.
 * Fresh component — no imports from the legacy TickScrubber.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RV2 } from '../tokens';
import { getRatingTier, HERO_NUMBER_STYLE, ratingTextColor, rampForRating } from '@/lib/ratingTier';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

const clamp = (n: number) => Math.max(0, Math.min(10, n));
const step = (n: number) => Math.round(clamp(n) * 10) / 10;

export function OverallScrubber({ value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const display = value ?? 0;
  const tier = getRatingTier(value);
  const isGold = tier === 'EXCEPTIONAL';
  const color = ratingTextColor(value);
  const ramp = rampForRating(value);

  const pointerToValue = useCallback((clientX: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    onChange(step(pct * 10));
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => pointerToValue(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, pointerToValue]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (value == null) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(step(value + 0.1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(step(value - 0.1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(10);
    }
  };

  const fillPct = (display / 10) * 100;

  return (
    <div style={{ padding: '2px 0 4px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 2,
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <span
          className={isGold ? 'clbhouz-gold-shimmer-light' : undefined}
          style={{
            fontSize: 44,
            lineHeight: 1,
            ...HERO_NUMBER_STYLE,
            ...(isGold ? {} : { color: value == null ? RV2.muted : color }),
          }}
        >
          {value == null ? '—' : value.toFixed(1)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: RV2.muted, letterSpacing: '-0.02em' }}>
          /10
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value ?? 0}
        aria-label="Overall score"
        onPointerDown={(e) => {
          setDragging(true);
          pointerToValue(e.clientX);
        }}
        onKeyDown={onKeyDown}
        style={{
          position: 'relative',
          height: 44,
          padding: '16px 0',
          cursor: 'pointer',
          touchAction: 'none',
          outline: 'none',
        }}
      >
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: RV2.ghost,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${fillPct}%`,
              background: value == null
                ? 'transparent'
                : `linear-gradient(90deg, ${ramp.lo}, ${ramp.hi})`,
              transition: dragging ? 'none' : 'width 120ms ease',
            }}
          />
        </div>
        {value != null && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: `${fillPct}%`,
              transform: 'translate(-50%, -50%)',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `2px solid ${isGold ? '#F0A500' : RV2.amber}`,
              boxShadow: '0 2px 6px rgba(15,23,42,0.16)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: RV2.muted,
          marginTop: 2,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}
