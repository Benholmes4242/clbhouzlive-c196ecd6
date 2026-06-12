import React from 'react';
import { TrendingDown, TrendingUp, Award, Flame, MapPin } from 'lucide-react';
import { Eyebrow } from './_shared/Eyebrow';
import {
  T100,
  T60,
  T40,
  AMBER,
  AMBER_TINT,
  BG_2,
  FONT,
  TAB,
} from './_shared/tokens';

export interface TheirFormHandicap {
  handicap_index: number | null;
  trend_delta: number | null;
  badges_earned: number;
  active_streaks: number;
  last_round: {
    course_name: string | null;
    adjusted_gross: number | null;
    play_date: string;
  } | null;
}

interface Props {
  handicap: TheirFormHandicap;
}

export const TheirFormSection: React.FC<Props> = ({ handicap }) => {
  const delta = handicap.trend_delta;
  // Per brief: 0 is a real value (flat). "no 30d data" only when null.
  const noData = delta === null || delta === undefined;
  const isImproving = !noData && (delta as number) < -0.3;
  const isDeclining = !noData && (delta as number) > 0.3;
  const isFlat = !noData && !isImproving && !isDeclining;

  const chipBg = isImproving ? 'var(--hcp-good-deep-tint)' : isDeclining ? 'var(--hcp-bad-deep-tint)' : BG_2;
  const chipColor = isImproving ? 'var(--hcp-good-deep)' : isDeclining ? 'var(--hcp-bad-deep)' : T60;

  return (
    <div style={{ padding: '4px 20px 14px', fontFamily: FONT }}>
      <Eyebrow label="THEIR FORM" />
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginTop: 8,
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: T100,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            ...TAB,
          }}
        >
          {handicap.handicap_index?.toFixed(1) ?? '—'}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 999,
            background: chipBg,
            color: chipColor,
            ...TAB,
          }}
        >
          {isImproving && <TrendingDown size={11} strokeWidth={2.4} />}
          {isDeclining && <TrendingUp size={11} strokeWidth={2.4} />}
          <span>
            {noData
              ? 'no 30d data'
              : isFlat
                ? 'flat'
                : `${Math.abs(delta as number).toFixed(1)} in 30d`}
          </span>
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 10,
          fontSize: 12,
          color: T60,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Award size={12} strokeWidth={2} />
          {handicap.badges_earned}{' '}
          {handicap.badges_earned === 1 ? 'badge' : 'badges'}
        </span>
        <span style={{ color: T40 }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Flame size={12} strokeWidth={2} />
          {handicap.active_streaks}{' '}
          {handicap.active_streaks === 1 ? 'streak' : 'streaks'}
        </span>
      </div>
      {handicap.last_round && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
            fontSize: 12,
            color: T60,
          }}
        >
          <MapPin size={12} strokeWidth={2} />
          <span>
            Last round —{' '}
            {(handicap.last_round.course_name ?? 'Course').replace(
              ' Course',
              '',
            )}
            {handicap.last_round.adjusted_gross != null && (
              <> · {handicap.last_round.adjusted_gross}</>
            )}
            {' · '}
            {fmtRelative(handicap.last_round.play_date)}
          </span>
        </div>
      )}
    </div>
  );
};

function fmtRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
  });
}
