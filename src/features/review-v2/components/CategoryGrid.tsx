/**
 * CategoryGrid - step 1. Four rows, fixed order, each 1.0 to 10.0 in 0.1 steps.
 * There is deliberately no reference to the overall score on this step.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RV2 } from '../tokens';
import { FIGURE } from '@/lib/tokens/type';
import { bandColorOnDark as bandColor } from '../bandColor';
import type { CategoryKey } from '../types';

export interface CategoryCopy {
  key: CategoryKey;
  label: string;
  hint: string;
}

interface Props {
  values: Record<CategoryKey, number | null>;
  onChange: (key: CategoryKey, v: number) => void;
  cats: CategoryCopy[];
}

const MIN = 1;
const MAX = 10;
const clamp = (n: number) => Math.max(MIN, Math.min(MAX, n));
const snap = (n: number) => Math.round(clamp(n) * 10) / 10;
const toPct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

function CategoryRow({
  label,
  hint,
  value,
  onChange,
  last,
}: {
  label: string;
  hint: string;
  value: number | null;
  onChange: (v: number) => void;
  last: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const color = bandColor(value);
  const fillPct = value == null ? 0 : toPct(value);

  const pointerToValue = useCallback((clientX: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    onChange(snap(MIN + pct * (MAX - MIN)));
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
    <div
      style={{
        padding: '13px 0',
        borderBottom: last ? 'none' : `1px solid ${RV2.hairline}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: RV2.ink }}>{label}</span>
        <span
          style={{
            fontSize: 18,
            ...FIGURE,
            letterSpacing: '-0.03em',
            color: value == null ? RV2.secondary : color,
          }}
        >
          {value == null ? '--' : value.toFixed(1)}
        </span>
      </div>
      <div style={{ fontSize: 11, color: RV2.secondary, marginBottom: 10 }}>{hint}</div>
      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value ?? 1}
        aria-label={label}
        onPointerDown={(e) => {
          setDragging(true);
          pointerToValue(e.clientX);
        }}
        onKeyDown={onKeyDown}
        style={{
          padding: '18.5px 0',
          margin: '-0.5px 0',
          background: 'transparent',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: 7,
          borderRadius: 999,
          background: RV2.track,
        }}
      >
        {value != null && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${fillPct}%`,
                background: color,
                borderRadius: 999,
                transition: dragging ? 'none' : 'width 120ms ease',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: `${fillPct}%`,
                transform: 'translate(-50%, -50%)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: RV2.ink,
                border: `2px solid ${color}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export function CategoryGrid({ values, onChange, cats }: Props) {
  return (
    <div
      style={{
        background: RV2.cardBg,
        borderRadius: 18,
        border: `1px solid ${RV2.hairline}`,
        padding: '2px 16px',
      }}
    >
      {cats.map((c, i) => (
        <CategoryRow
          key={c.key}
          label={c.label}
          hint={c.hint}
          value={values[c.key]}
          onChange={(v) => onChange(c.key, v)}
          last={i === cats.length - 1}
        />
      ))}
    </div>
  );
}
