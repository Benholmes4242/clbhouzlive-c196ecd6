/**
 * BRIEF_YOU_TAB_REBUILD §3.4 — YOUR FORM HERE.
 *
 * TEN, not five. A distribution needs a sample; a TREND needs two samples to
 * compare, so this section stays quiet until there are ten rounds here and then
 * compares the last ten with the ten before them.
 *
 * The line is local and deliberately plain: one stroke through the member's
 * gross scores, oldest to newest. No callouts, no axis.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER, aboutFig } from '../about/AboutSection';
import { YouSentence } from './youBits';
import type { YouRound } from './YourRoundsHere';

/** §3.4 — the trend threshold. */
const MIN_ROUNDS = 10;
const LINE_HEIGHT = 46;

const TrendLine: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  /* A lower gross is a better round, so the scale is inverted: better is up. */
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = ((v - min) / span) * (LINE_HEIGHT - 4) + 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 100 ${LINE_HEIGHT}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: LINE_HEIGHT, marginTop: 16 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={A.AMBER}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface Props {
  /** Most recent first, capped at the last twenty. */
  rounds: YouRound[];
  /** Every round here — the gate is the true count, not the capped list. */
  total: number;
}

const YourFormHere: React.FC<Props> = ({ rounds, total }) => {
  const { t } = useTranslation('courses');
  const heading = t('courseDetail.youTab.sections.form');

  const withGross = rounds.filter((r): r is YouRound & { gross: number } => r.gross != null);

  if (total < MIN_ROUNDS || withGross.length < MIN_ROUNDS) {
    return (
      <AboutSection heading={heading}>
        <YouSentence quiet>
          {total <= 1
            ? t('courseDetail.youTab.form.one')
            : t('courseDetail.youTab.form.thin', { count: total, rounds: formatNumber(total) })}
        </YouSentence>
      </AboutSection>
    );
  }

  const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const lastTen = withGross.slice(0, 10).map((r) => r.gross);
  const previousTen = withGross.slice(10, 20).map((r) => r.gross);
  const average = mean(lastTen);
  /* Oldest first for drawing: a line reads left to right in time. */
  const line = [...withGross].reverse().map((r) => r.gross);

  const delta = previousTen.length >= 3 ? average - mean(previousTen) : null;
  const better = delta != null && delta < 0;
  const best = Math.min(...withGross.map((r) => r.gross));
  const worst = Math.max(...withGross.map((r) => r.gross));

  return (
    <AboutSection heading={heading} meta={t('courseDetail.youTab.form.meta')}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ ...aboutFig(30, A.INK), lineHeight: 1 }}>{average.toFixed(1)}</span>
        {delta != null && Math.abs(delta) >= 0.05 ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: SANS,
              /* A lower gross is an improvement; the direction, not the sign,
                 carries the colour. */
              color: better ? A.GREEN : A.INK,
              ...FIGS,
            }}
          >
            {t('courseDetail.youTab.form.vsPrevious', {
              delta: `${better ? '\u2212' : '+'}${Math.abs(delta).toFixed(1)}`,
            })}
          </span>
        ) : null}
      </div>

      <TrendLine values={line} />

      <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
        <span style={ABOUT_KICKER}>
          {t('courseDetail.youTab.form.best')} {best}
        </span>
        <span style={ABOUT_KICKER}>
          {t('courseDetail.youTab.form.worst')} {worst}
        </span>
      </div>
    </AboutSection>
  );
};

export default YourFormHere;
