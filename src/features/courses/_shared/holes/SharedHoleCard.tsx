import React, { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { INK, INK_MUTE } from '@/features/courses/_shared/tokens';
import { TOPAR_OVER_LIGHT, TOPAR_UNDER_LIGHT } from '@/features/tourhub/_shared/tokens';
import { formatNumber } from '@/i18n/format';

import {
  FONT,
  MONO,
  SC_BIRDIE,
  SC_DOUBLE,
  SC_PAR,
} from '@/features/courses/components/holes/_constants';
import { SharedHoleDistributionBar } from './SharedHoleDistributionBar';
import type { SharedHole } from './types';

export interface SharedHoleCardProps {
  hole: SharedHole;
  /** Difficulty-bar scale — max |avg_to_par| across the surface's holes. */
  maxAbs: number;
  /** Surface supplies the count label ('rounds' for courses, 'players' for tournaments). */
  countLabel: 'rounds' | 'players';
  expanded: boolean;
  onToggle: () => void;
  /** Optional feature tag (HARDEST / EASIEST) rendered under the Par line. */
  tag?: 'hardest' | 'easiest' | null;
}

const AVG_EPSILON = 0.05;

function avgColorFor(avg: number): string {
  if (avg > AVG_EPSILON) return TOPAR_OVER_LIGHT;
  if (avg < -AVG_EPSILON) return TOPAR_UNDER_LIGHT;
  return INK_MUTE;
}

// fmtAvg: |v|<0.005 -> \u00B10.00; v>0 -> "+"+2dp; v<0 -> \u2212+abs 2dp.
function fmtAvg(v: number): string {
  if (Math.abs(v) < 0.005) return `\u00B10.00`;
  if (v > 0) return `+${v.toFixed(2)}`;
  return `\u2212${Math.abs(v).toFixed(2)}`;
}

// Diverging difficulty bar: centre baseline; UNDER par grows LEFT (red),
// OVER par grows RIGHT (blue). Each side width = min(1, |avg|/maxAbs) * 50%.
const DifficultyBar: React.FC<{ avg: number; maxAbs: number }> = ({ avg, maxAbs }) => {
  const scale = Math.max(0.01, maxAbs);
  const magnitude = Math.min(1, Math.abs(avg) / scale) * 50; // percent
  const isOver = avg > AVG_EPSILON;
  const isUnder = avg < -AVG_EPSILON;
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: '100%',
        height: 5,
        background: '#eef1f5',
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      {/* Centre baseline tick */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 1,
          background: 'rgba(15,23,42,0.14)',
          transform: 'translateX(-0.5px)',
        }}
      />
      {isUnder && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: '50%',
            width: `${magnitude}%`,
            background: TOPAR_UNDER_LIGHT,
            borderRadius: '5px 0 0 5px',
            transition: 'width 240ms ease',
          }}
        />
      )}
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: `${magnitude}%`,
            background: TOPAR_OVER_LIGHT,
            borderRadius: '0 5px 5px 0',
            transition: 'width 240ms ease',
          }}
        />
      )}
    </div>
  );
};

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

export const SharedHoleCard: React.FC<SharedHoleCardProps> = ({
  hole,
  maxAbs,
  countLabel,
  expanded,
  onToggle,
  tag = null,
}) => {
  const { t } = useTranslation(['courses']);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setMounted(false);
      return;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  const avgColor = avgColorFor(hole.avg_to_par);
  const tagInfo =
    tag === 'hardest'
      ? { label: t('courses:holes.hardest'), c: SC_DOUBLE }
      : tag === 'easiest'
      ? { label: t('courses:holes.easiest'), c: SC_BIRDIE }
      : null;

  const subPar =
    (hole.dist.ace ?? 0) +
    (hole.dist.albatross ?? 0) +
    (hole.dist.eagle ?? 0) +
    (hole.dist.birdie ?? 0);
  const overPar = (hole.dist.bogey ?? 0) + (hole.dist.double ?? 0);
  const parPct = hole.dist.par ?? 0;

  const playsTo = (hole.par + hole.avg_to_par).toFixed(1);

  const countText = countLabel === 'players'
    ? t('courses:holes.players', { count: hole.rounds, formattedCount: formatNumber(hole.rounds) })
    : t('courses:holes.rounds', { count: hole.rounds, formattedCount: formatNumber(hole.rounds) });

  return (
    <div
      style={{
        margin: '12px 16px 0',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderRadius: 14,
        padding: '12px 14px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header = toggle */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={t('courses:holes.detailsA11y', { holeNo: hole.hole_no })}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        {/* Hole tile — 42px slate */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#F8FAFC',
            border: '1px solid rgba(15,23,42,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: INK,
            flexShrink: 0,
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hole.hole_no}
        </div>

        {/* Middle column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 800,
              color: INK,
              letterSpacing: '0.005em',
            }}
          >
            {t('courses:holes.parLabel', { par: hole.par })}
            {(hole.yards != null || hole.stroke_index != null) && (
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
                {hole.yards != null ? t('courses:holes.yards', { yards: hole.yards }) : ''}
                {hole.yards != null && hole.stroke_index != null ? ` \u00B7 ` : ''}
                {hole.stroke_index != null ? t('courses:holes.strokeIndex', { index: hole.stroke_index }) : ''}
              </span>
            )}
          </div>
          {tagInfo && (
            <div
              style={{
                marginTop: 3,
                display: 'inline-block',
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: tagInfo.c,
              }}
            >
              {tagInfo.label}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <DifficultyBar avg={hole.avg_to_par} maxAbs={maxAbs} />
          </div>
        </div>

        {/* Right — AVG TO PAR */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 21,
              fontWeight: 800,
              color: avgColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtAvg(hole.avg_to_par)}
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
            {t('courses:holes.avgToPar')}
          </div>
        </div>

        <ChevronDown
          size={16}
          strokeWidth={2.2}
          style={{
            flexShrink: 0,
            color: '#94A3B8',
            marginLeft: 2,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 180ms ease',
          }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat label="Sub-par" value={`${subPar.toFixed(1)}%`} color={SC_BIRDIE} />
            <Stat label="Par" value={`${parPct.toFixed(1)}%`} color={SC_PAR} />
            <Stat label="Over-par" value={`${overPar.toFixed(1)}%`} color={SC_DOUBLE} />
          </div>

          <SharedHoleDistributionBar dist={hole.dist} mode="chart" mounted={mounted} />

          {/* Footer */}
          <div
            style={{
              paddingTop: 12,
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: INK_MUTE,
                background: 'rgba(15,23,42,0.05)',
                padding: '3px 9px',
                borderRadius: 20,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" opacity="0.55" />
                <path
                  d="M3 19c0-3 2.7-5 6-5s6 2 6 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
              {countText}
            </span>
            <span>
              PLAYS TO{' '}
              <span
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  color: INK,
                  fontWeight: 800,
                }}
              >
                {playsTo}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedHoleCard;
