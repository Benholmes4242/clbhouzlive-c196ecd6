import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { TOPAR_OVER_DARK, TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { FONT, INK, SANS, SC_BIRDIE, SC_DOUBLE } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

interface Props {
  hardest: CourseHole;
  easiest: CourseHole;
}

const AVG_EPSILON = 0.05;

/**
 * MICRO_BRIEF_TOPAR_LIGHT_ON_DARK_SURFACES.
 * The two fills below are a SEMANTIC PAIR (under par left of centre, over par
 * right of it), not a ramp, so they take the dark-surface branch of the theme
 * pair rather than the neutral ramp used by the distribution bar. The _LIGHT
 * values were the light branch used unconditionally on a dark card — the
 * over-par side (#0F172A, the former INK) was invisible.
 */

const MiniDifficultyBar: React.FC<{ avg: number; maxAbs: number }> = ({ avg, maxAbs }) => {
  const scale = Math.max(0.01, maxAbs);
  const magnitude = Math.min(1, Math.abs(avg) / scale) * 50;
  const isOver = avg > AVG_EPSILON;
  const isUnder = avg < -AVG_EPSILON;
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: '100%',
        height: 4,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 1,
          background: 'rgba(255,255,255,0.14)',
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
            background: TOPAR_UNDER_DARK,
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
            background: TOPAR_OVER_DARK,
          }}
        />
      )}
    </div>
  );
};

const Card: React.FC<{
  tone: 'hard' | 'easy';
  label: string;
  hole: CourseHole;
  maxAbs: number;
}> = ({ tone, label, hole, maxAbs }) => {
  const { t } = useTranslation(['courses']);
  const tint = tone === 'hard' ? 'rgba(29,93,191,0.05)' : 'rgba(210,34,45,0.05)';
  const border = tone === 'hard' ? 'rgba(29,93,191,0.18)' : 'rgba(210,34,45,0.18)';
  const eyebrow = tone === 'hard' ? SC_DOUBLE : SC_BIRDIE;
  const playsTo = (hole.par + hole.avg_to_par).toFixed(1);
  return (
    <div
      style={{
        flex: 1,
        background: tint,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: eyebrow,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 200,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: SANS,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hole.hole_no}
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: INK_MUTE,
            fontFamily: SANS,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {t('courses:holes.playsToInline', { playsTo })}
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginTop: -2,
          fontFamily: SANS,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {hole.stroke_index != null
          ? t('courses:holes.parAndSi', { par: hole.par, si: hole.stroke_index })
          : t('courses:holes.parLabel', { par: hole.par })}
      </div>
      <MiniDifficultyBar avg={hole.avg_to_par} maxAbs={maxAbs} />
    </div>
  );
};

export const HoleFeatureCards: React.FC<Props> = ({ hardest, easiest }) => {
  const { t } = useTranslation(['courses']);
  const maxAbs = Math.max(
    0.01,
    Math.abs(hardest.avg_to_par),
    Math.abs(easiest.avg_to_par),
  );
  return (
    <div
      style={{
        padding: '16px 16px',
        display: 'flex',
        gap: 12,
      }}
    >
      <Card tone="hard" label={t('courses:holes.hardestTitle')} hole={hardest} maxAbs={maxAbs} />
      <Card tone="easy" label={t('courses:holes.easiestTitle')} hole={easiest} maxAbs={maxAbs} />
    </div>
  );
};

export default HoleFeatureCards;
