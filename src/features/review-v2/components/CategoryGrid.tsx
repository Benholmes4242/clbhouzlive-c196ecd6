/**
 * CategoryGrid — four mini-scrubbers (Design / Condition / Clubhouse /
 * Facilities), each 0-10 in 0.1 steps with a one-decimal readout.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RV2 } from '../tokens';
import { getRatingTier, HERO_NUMBER_STYLE, rampForRating, ratingTextColor } from '@/lib/ratingTier';
import type { CategoryKey } from '../types';

interface Props {
  values: Record<CategoryKey, number | null>;
  onChange: (key: CategoryKey, v: number) => void;
}

const CATS: { key: CategoryKey; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'condition', label: 'Condition' },
  { key: 'clubhouse', label: 'Clubhouse' },
  { key: 'facilities', label: 'Facilities' },
];

const clamp = (n: number) => Math.max(0, Math.min(10, n));
const step = (n: number) => Math.round(clamp(n) * 10) / 10;

function MiniScrub({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const tier = getRatingTier(value);
  const isGold = tier === 'EXCEPTIONAL';
  const color = ratingTextColor(value);
  const ramp = rampForRating(value);
  const display = value ?? 0;
  const pct = (display / 10) * 100;

  const pointerToValue = useCallback((clientX: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const p = (clientX - r.left) / r.width;
    onChange(step(p * 10));
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

  const onKey = (e: React.KeyboardEvent) => {
    if (value == null) {
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        onChange(5);
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(step(value + 0.1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(step(value - 0.1));
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid ${RV2.hairline}`,
        borderRadius: RV2.panelRadius,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 96,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: RV2.amber,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          {label}
        </span>
        <span
          className={isGold ? 'clbhouz-gold-shimmer-light' : undefined}
          style={{
            fontSize: 22,
            lineHeight: 1,
            ...HERO_NUMBER_STYLE,
            ...(isGold ? {} : { color: value == null ? RV2.muted : color }),
          }}
        >
          {value == null ? '—' : value.toFixed(1)}
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value ?? 0}
        aria-label={label}
        onPointerDown={(e) => {
          setDragging(true);
          pointerToValue(e.clientX);
        }}
        onKeyDown={onKey}
        style={{
          position: 'relative',
          height: 30,
          padding: '12px 0',
          cursor: 'pointer',
          touchAction: 'none',
          outline: 'none',
        }}
      >
        <div style={{ height: 5, borderRadius: 3, background: RV2.ghost, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${pct}%`,
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
              left: `${pct}%`,
              transform: 'translate(-50%, -50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `2px solid ${isGold ? '#F0A500' : RV2.amber}`,
              boxShadow: '0 1px 4px rgba(15,23,42,0.14)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function CategoryGrid({ values, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {CATS.map((c) => (
        <MiniScrub
          key={c.key}
          label={c.label}
          value={values[c.key]}
          onChange={(v) => onChange(c.key, v)}
        />
      ))}
    </div>
  );
}
