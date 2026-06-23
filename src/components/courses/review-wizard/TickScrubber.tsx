// TickScrubber — horizontal ruler dragged under a fixed needle.
// 0–10 in 0.1 steps. Gold tier at ≥9.0. Hero variant (big readout) + compact variant.
// Built per the signed-off mock in ReviewWizardFinal.jsx.

import React, { useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '@/lib/ui/haptics';

const INK = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const AMBER = '#F7931E';
const GOLD = '#FFB800';
const GOLD_DEEP = '#D97706';

type Tier = { label: string; gold: boolean } | null;
function tierFor(score: number | null): Tier {
  if (score == null) return null;
  if (score >= 9.0) return { label: 'Exceptional', gold: true };
  if (score >= 7.5) return { label: 'Excellent', gold: false };
  if (score >= 6.0) return { label: 'Good', gold: false };
  if (score >= 4.0) return { label: 'Fair', gold: false };
  return { label: 'Poor', gold: false };
}
const snap = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number) => Math.max(0, Math.min(10, v));

interface TickScrubberProps {
  value: number | null;
  onChange: (v: number) => void;
  hero?: boolean;
  ariaLabel?: string;
}

export function TickScrubber({ value, onChange, hero = false, ariaLabel }: TickScrubberProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; v: number } | null>(null);
  const [active, setActive] = useState(false);
  const touched = value != null;
  const v = value ?? 5.0;
  const tier = tierFor(value);
  const PXPER = hero ? 26 : 17;
  const accent = tier?.gold ? GOLD_DEEP : AMBER;
  const lastTick = useRef(v);

  const commit = useCallback(
    (nv: number) => {
      const prev = lastTick.current;
      const intCross = Math.floor(nv) !== Math.floor(prev);
      const halfCross = Math.floor(nv * 2) !== Math.floor(prev * 2);
      if (intCross) triggerHaptic('medium');
      else if (halfCross) triggerHaptic('light');
      lastTick.current = nv;
      onChange(nv);
    },
    [onChange]
  );

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, v };
    setActive(true);
    try {
      wrapRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    if (!touched) {
      lastTick.current = 5.0;
      onChange(5.0);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dv = -((e.clientX - drag.current.x) / PXPER) * 0.1;
    const nv = clamp(snap(drag.current.v + dv));
    if (nv !== lastTick.current) commit(nv);
  };
  const onUp = () => {
    drag.current = null;
    setActive(false);
  };

  // Keyboard a11y: arrow keys ±0.1
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nv = v;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nv = clamp(snap(v + 0.1));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nv = clamp(snap(v - 0.1));
    else if (e.key === 'Home') nv = 0;
    else if (e.key === 'End') nv = 10;
    else return;
    e.preventDefault();
    if (!touched) {
      lastTick.current = nv;
      onChange(nv);
    } else {
      commit(nv);
    }
  };

  const offset = -(v * 10) * PXPER;

  return (
    <div>
      {hero && (
        <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontSize: 68,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                color: touched ? (tier?.gold ? GOLD_DEEP : INK) : 'rgba(15,23,42,0.16)',
                transform: active ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 140ms ease',
                display: 'inline-block',
              }}
            >
              {touched ? v.toFixed(1) : '–.–'}
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, color: INK_FAINT }}>/10</span>
          </div>
          <div style={{ height: 18, marginTop: 5 }}>
            {tier ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: tier.gold ? GOLD_DEEP : INK_MUTE,
                }}
              >
                {tier.label}
              </span>
            ) : (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: INK_FAINT }}>
                Drag to set your rating
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={wrapRef}
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
          height: hero ? 66 : 44,
          overflow: 'hidden',
          cursor: active ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          marginTop: hero ? 4 : 0,
          maskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)',
          outline: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            transform: `translateX(${offset}px)`,
            display: 'flex',
            alignItems: 'flex-start',
            transition: drag.current ? 'none' : 'transform 110ms cubic-bezier(.22,.61,.36,1)',
            paddingTop: hero ? 14 : 9,
          }}
        >
          {Array.from({ length: 101 }).map((_, i) => {
            const major = i % 10 === 0;
            const mid = i % 5 === 0;
            const filled = touched && i <= v * 10;
            return (
              <div
                key={i}
                style={{
                  width: PXPER,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: major ? 2 : 1.5,
                    height: major
                      ? hero
                        ? 24
                        : 16
                      : mid
                      ? hero
                        ? 16
                        : 11
                      : hero
                      ? 9
                      : 6,
                    borderRadius: 1,
                    background: filled ? (tier?.gold ? GOLD : AMBER) : 'rgba(15,23,42,0.16)',
                    transition: 'background 120ms',
                  }}
                />
                {major && hero && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: INK_FAINT,
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {i / 10}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: hero ? 2 : 0,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: hero ? 9 : 5,
            transform: 'translateX(-50%)',
            width: 3,
            height: hero ? 32 : 22,
            borderRadius: 2,
            background: accent,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
}

export { tierFor };
export default TickScrubber;
