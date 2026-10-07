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
import React, { useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatDate } from '@/i18n/format';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER, aboutFig } from '../about/AboutSection';
import CenteredStatStrip from '../about/CenteredStatStrip';
import { YouLinkRow, YouSentence } from './youBits';
import type { YouRound } from './YourRoundsHere';

/** §3.4 — the trend threshold. */
const MIN_ROUNDS = 10;
const LINE_HEIGHT = 46;

const HIT = 30;
const DOT = 8;

/**
 * The line stays a stretched SVG. The hit targets are HTML buttons placed at
 * each point's percentage coordinates, with the dot drawn in its own SQUARE
 * svg — a circle inside the stretched viewBox would be squashed into an ellipse.
 * `values` is OLDEST FIRST; the index handed back is that drawing index.
 */
const TrendLine: React.FC<{
  values: number[];
  selected: number | null;
  onSelect: (drawIndex: number) => void;
  label: (drawIndex: number) => string;
}> = ({ values, selected, onSelect, label }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  /* A lower gross is a better round, so the scale is inverted: better is up. */
  const coords = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    y: ((v - min) / span) * (LINE_HEIGHT - 4) + 2,
  }));
  const points = coords.map((c) => `${c.x},${c.y}`).join(' ');
  return (
    <div style={{ position: 'relative', height: LINE_HEIGHT, marginTop: 16 }}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 100 ${LINE_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: LINE_HEIGHT }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={A.INK}
          strokeOpacity={0.8}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {coords.map((c, i) => {
        const on = selected === i;
        return (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            aria-label={label(i)}
            onClick={() => onSelect(i)}
            style={{
              position: 'absolute',
              left: `calc(${c.x}% - ${HIT / 2}px)`,
              top: c.y - HIT / 2,
              width: HIT,
              height: HIT,
              padding: 0,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg aria-hidden="true" width={DOT} height={DOT} viewBox="0 0 8 8" style={{ display: 'block' }}>
              <circle
                cx={4}
                cy={4}
                r={on ? 4 : 2.5}
                fill={on ? A.AMBER : A.INK}
                fillOpacity={on ? 1 : selected != null ? 0.35 : 0.8}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

interface Props {
  /** Most recent first, capped at the last twenty. */
  rounds: YouRound[];
  /** Every round here — the gate is the true count, not the capped list. */
  total: number;
  courseId: string;
  /** The SAME round-opening callback YourRoundsHere receives — one route in. */
  onOpenRound: (round: YouRound) => void;
}

const YourFormHere: React.FC<Props> = ({ rounds, total, courseId, onOpenRound }) => {
  const { t } = useTranslation('courses');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const drawn = [...withGross].reverse();
  const line = drawn.map((r) => r.gross);
  const selectedIndex = selectedId ? drawn.findIndex((r) => r.whsScoreId === selectedId) : -1;
  const sel = selectedIndex >= 0 ? drawn[selectedIndex] : null;
  /* Comparison basis: the member's own average over the rounds drawn. */
  const shownMean = mean(line);

  const onSelect = (i: number) => {
    const round = drawn[i];
    if (!round) return;
    if (round.whsScoreId === selectedId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(round.whsScoreId);
    analyticsEvents.track('course_you_form_round_selected', {
      course_id: courseId,
      whs_score_id: round.whsScoreId,
    });
  };

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
              color: better ? A.GREEN : A.RED,
              ...FIGS,
            }}
          >
            {t(better ? 'courseDetail.youTab.form.better' : 'courseDetail.youTab.form.worse', {
              delta: Math.abs(delta).toFixed(1),
            })}
          </span>
        ) : null}
      </div>

      <TrendLine
        values={line}
        selected={selectedIndex >= 0 ? selectedIndex : null}
        onSelect={onSelect}
        label={(i) => t('courseDetail.youTab.form.pointLabel', {
          date: formatDate(drawn[i].playDate),
          score: drawn[i].gross,
        })}
      />

      {sel ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...ABOUT_KICKER, flex: 1, minWidth: 0 }}>
              {formatDate(sel.playDate)}
            </span>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              style={{ ...ABOUT_KICKER, color: A.MUTE, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
            >
              {t('courseDetail.youTab.clear')}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <CenteredStatStrip
              items={[
                { label: t('courseDetail.youTab.form.gross'), value: String(sel.gross), tone: A.AMBER_DEEP },
                {
                  label: t('courseDetail.youTab.form.toPar'),
                  value: toParParts(sel.toPar, 0)?.text ?? '\u2014',
                  tone: toParParts(sel.toPar, 0)?.tone ?? A.INK,
                },
                { label: t('courseDetail.youTab.form.vsAverage'), value: toParParts(sel.gross - shownMean, 1)?.text ?? '\u2014' },
              ]}
            />
          </div>
          <YouLinkRow label={t('courseDetail.youTab.form.openScorecard')} onPress={() => onOpenRound(sel)} />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={ABOUT_KICKER}>
            {t('courseDetail.youTab.form.best', { score: best })}
          </span>
          <span style={ABOUT_KICKER}>
            {t('courseDetail.youTab.form.worst', { score: worst })}
          </span>
        </div>
      )}
    </AboutSection>
  );
};

export default YourFormHere;
