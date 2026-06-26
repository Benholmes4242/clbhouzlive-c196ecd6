import React, { useEffect, useState } from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import {
  FONT,
  INK,
  MONO,
  SC_ACE,
  SC_ALBATROSS,
  SC_EAGLE,
  SC_BIRDIE,
  SC_PAR,
  SC_BOGEY,
  SC_DOUBLE,
} from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

interface Props {
  h: CourseHole;
  maxAvg: number;
  isHardest?: boolean;
  isEasiest?: boolean;
}

const avgColorFor = (avg: number): string => {
  if (avg > 0.9) return SC_DOUBLE;
  if (avg > 0.45) return SC_BOGEY;
  if (avg > 0) return SC_PAR;
  return SC_BIRDIE;
};

const fmtAvg = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`;

const Stat: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      flex: 1,
      background: '#F8FAFC',
      borderRadius: 10,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: INK_MUTE,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 16,
        fontWeight: 600,
        color,
        fontFamily: MONO,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
  </div>
);

const BUCKETS: Array<{ key: keyof CourseHole['dist']; label: string; color: string }> = [
  { key: 'ace',       label: 'ACE',  color: SC_ACE },
  { key: 'albatross', label: 'ALB',  color: SC_ALBATROSS },
  { key: 'eagle',     label: 'EAG',  color: SC_EAGLE },
  { key: 'birdie',    label: 'BIRD', color: SC_BIRDIE },
  { key: 'par',       label: 'PAR',  color: SC_PAR },
  { key: 'bogey',     label: 'BOG',  color: SC_BOGEY },
  { key: 'double',    label: 'DBL+', color: SC_DOUBLE },
];

export const HoleRow: React.FC<Props> = ({ h, isHardest, isEasiest }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const avgColor = avgColorFor(h.avg_to_par);
  const tag = isHardest
    ? { label: 'HARDEST', c: SC_DOUBLE }
    : isEasiest
    ? { label: 'EASIEST', c: SC_BIRDIE }
    : null;

  const metaParts: string[] = [];
  if (h.yards != null) metaParts.push(`${h.yards} YDS`);
  if (h.stroke_index != null) metaParts.push(`SI ${h.stroke_index}`);

  const subPar = h.dist.ace + h.dist.albatross + h.dist.eagle + h.dist.birdie;
  const overPar = h.dist.bogey + h.dist.double;
  const parPct = h.dist.par;

  const bucketVals = BUCKETS.map((b) => h.dist[b.key] ?? 0);
  const peak = Math.max(0.01, ...bucketVals);

  const playsTo = (h.par + h.avg_to_par).toFixed(1);

  return (
    <div
      style={{
        margin: '10px 14px 0',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderRadius: 14,
        padding: '14px 14px 12px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '34%',
            background: '#F1F5F9',
            border: '1px solid rgba(15,23,42,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            flexShrink: 0,
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.hole_no}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: INK,
              letterSpacing: '0.01em',
            }}
          >
            Par {h.par}
            {metaParts.length > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  fontWeight: 600,
                  color: INK_MUTE,
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}
              >
                {metaParts.join(' · ')}
              </span>
            )}
          </div>
          {tag && (
            <div
              style={{
                marginTop: 3,
                display: 'inline-block',
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: tag.c,
              }}
            >
              {tag.label}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: avgColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtAvg(h.avg_to_par)}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: INK_MUTE,
            }}
          >
            AVG TO PAR
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Stat label="Sub-par" value={`${subPar.toFixed(1)}%`} color={SC_BIRDIE} />
        <Stat label="Par"     value={`${parPct.toFixed(1)}%`} color={SC_PAR} />
        <Stat label="Over-par" value={`${overPar.toFixed(1)}%`} color={SC_DOUBLE} />
      </div>

      {/* 7-bucket histogram */}
      <div style={{ position: 'relative', paddingTop: 14 }}>
        {/* Gridlines */}
        <div
          style={{
            position: 'absolute',
            inset: '14px 0 18px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ height: 1, background: 'rgba(15,23,42,0.05)' }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${BUCKETS.length}, 1fr)`,
            gap: 6,
            alignItems: 'end',
            height: 64,
          }}
        >
          {BUCKETS.map((b, i) => {
            const v = bucketVals[i];
            const isZero = v <= 0;
            const targetH = isZero ? 2 : Math.max(3, (v / peak) * 58);
            return (
              <div
                key={b.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  gap: 3,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: isZero ? 'rgba(15,23,42,0.28)' : INK,
                    fontFamily: MONO,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {isZero ? '·' : `${v < 1 ? v.toFixed(1) : v.toFixed(0)}%`}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: mounted ? targetH : 0,
                    background: isZero ? 'rgba(15,23,42,0.10)' : b.color,
                    borderRadius: 3,
                    transition: 'height 360ms cubic-bezier(.22,.61,.36,1)',
                    transitionDelay: `${i * 28}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Labels */}
        <div
          style={{
            marginTop: 6,
            display: 'grid',
            gridTemplateColumns: `repeat(${BUCKETS.length}, 1fr)`,
            gap: 6,
          }}
        >
          {BUCKETS.map((b) => (
            <div
              key={`${b.key}-lbl`}
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textAlign: 'center',
                color: INK_MUTE,
              }}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 2,
          paddingTop: 10,
          borderTop: '1px solid rgba(15,23,42,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: INK_MUTE,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          n = {h.rounds.toLocaleString()}
        </span>
        <span>
          PLAYS TO{' '}
          <span style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', color: INK }}>
            {playsTo}
          </span>
        </span>
      </div>
    </div>
  );
};

export default HoleRow;
