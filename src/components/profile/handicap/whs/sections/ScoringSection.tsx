/**
 * ScoringSection — SECTION F of the one-page handicap brief.
 *
 * Flat replacement for the points half of StablefordCard: no panel, no radius,
 * no tint. Points average on the left at the page's 21 headline figure, three
 * band counts to the right in equal columns.
 *
 * WHAT IS GONE FROM THIS SECTION, BY CONSTRUCTION:
 *  - The distribution ring: its three segments were the three counts drawn a
 *    second time, less legibly.
 *  - The SCORING RANGE strip (worst / median / best): the counts carry the
 *    spread and the median restated the average above it.
 *  - The 30D / 90D / ALL chips: one window, 90 days, stated in the meta.
 *  - The POINTS / SCORE STATS segmented control is NOT folded in here. It is
 *    reported, not moved: SCORE STATS renders its own hole-by-hole content
 *    (birdie+/par/bogey/double+ and the career milestone ladder) which has no
 *    other home on this page yet.
 *
 * NINE-HOLE ROUNDS ARE EXCLUDED ENTIRELY. Eighteen points off nine holes is
 * half a round, not a bad day, and stableford is not restated on an
 * eighteen-hole basis the way a differential is. They are out of the average,
 * out of the vs-prior comparison and out of all three counts, and the meta
 * states the basis.
 *
 * pointsTone, never indexTone: MORE points is BETTER, and the inversion is
 * decided once in tokens.ts.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { WhsScore } from '@/lib/whs/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { HcpSection } from './HcpSection';
import { CHART, DEAD_BAND, pointsTone, toneColor } from '../charts';

/** One window. Ninety days. Stated in the meta, not in a control. */
const WINDOW_DAYS = 90;
/** Below this the spread does not mean anything, so it is not drawn. */
const MIN_ROUNDS = 10;

const IN_ZONE = 36;
const SOLID_LOWER = 33;

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

interface Props {
  scores: WhsScore[];
}

interface Windowed {
  current: number[];
  prior: number[];
}

/** Eighteen-hole rounds with a real stableford total, split into the two windows. */
function windows(scores: WhsScore[]): Windowed {
  const now = Date.now();
  const span = WINDOW_DAYS * 86_400_000;
  const currentStart = now - span;
  const priorStart = now - 2 * span;

  const current: number[] = [];
  const prior: number[] = [];

  for (const s of scores) {
    // A zero stableford is an incomplete sync, not a zero-point round.
    if (s.stableford_points == null || s.stableford_points <= 0) continue;
    if (s.is_nine_hole) continue;
    const t = new Date(s.play_date).getTime();
    if (t >= currentStart) current.push(s.stableford_points);
    else if (t >= priorStart) prior.push(s.stableford_points);
  }

  return { current, prior };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const ScoringSection: React.FC<Props> = ({ scores }) => {
  const { t } = useTranslation(['common']);

  const { current, prior } = useMemo(() => windows(scores), [scores]);

  const n = current.length;
  const withheld = n < MIN_ROUNDS;

  const withheldFired = useRef(false);
  useEffect(() => {
    if (!withheld || withheldFired.current) return;
    withheldFired.current = true;
    analyticsEvents.track('handicap_section_withheld', {
      section: 'scoring',
      sample: n,
      required: MIN_ROUNDS,
    });
  }, [withheld, n]);

  // ── Withheld: fewer than ten eighteen-hole rounds in the window ───────
  if (withheld) {
    return (
      <HcpSection
        hairline
        kicker={t('common:handicap.scoring.eyebrow')}
        heading={t('common:handicap.scoring.heading')}
        meta={t('common:handicap.scoring.metaWithheld', { count: n })}
      >
        <p style={{ margin: 0, fontSize: 13, color: CHART.MUTE, lineHeight: 1.55 }}>
          {t('common:handicap.scoring.withheldBody', { count: n })}
        </p>
      </HcpSection>
    );
  }

  const avg = mean(current);
  const priorAvg = prior.length >= MIN_ROUNDS ? mean(prior) : null;
  const delta = priorAvg != null ? avg - priorAvg : null;
  const showDelta = delta != null && Math.abs(delta) >= DEAD_BAND;

  const inZone = current.filter((p) => p >= IN_ZONE).length;
  const solid = current.filter((p) => p >= SOLID_LOWER && p < IN_ZONE).length;
  const offDay = current.filter((p) => p < SOLID_LOWER).length;

  const bands = [
    { count: inZone, label: t('common:handicap.scoring.inZone'), range: '36+', color: CHART.DOWN },
    { count: solid, label: t('common:handicap.scoring.solid'), range: '33\u201335', color: CHART.AMBER },
    { count: offDay, label: t('common:handicap.scoring.offDay'), range: '<33', color: CHART.MUTE },
  ];

  return (
    <HcpSection
      hairline
      kicker={t('common:handicap.scoring.eyebrow')}
      heading={t('common:handicap.scoring.heading')}
      meta={t('common:handicap.scoring.meta', { count: n, days: WINDOW_DAYS })}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        {/* THE AVERAGE */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 700, color: CHART.INK, lineHeight: 1, ...FIG }}>
            {avg.toFixed(1)}
          </div>
          <div style={{ ...KICKER, marginTop: 6 }}>{t('common:handicap.scoring.pointsAvg')}</div>
          {showDelta && delta != null && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 700,
                color: toneColor(pointsTone(avg - delta, avg)),
                ...FIG,
              }}
            >
              {t('common:handicap.scoring.vsPrior', {
                delta: `${delta > 0 ? '+' : '\u2212'}${Math.abs(delta).toFixed(1)}`,
                days: WINDOW_DAYS,
              })}
            </div>
          )}
        </div>

        {/* THE THREE COUNTS */}
        <div style={{ display: 'flex', flex: 1, minWidth: 0, gap: 12 }}>
          {bands.map((b) => (
            <div key={b.label} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: b.count === 0 ? CHART.MUTE : b.color,
                  lineHeight: 1,
                  ...FIG,
                }}
              >
                {b.count}
              </div>
              <div style={{ ...KICKER, marginTop: 6 }}>{b.label}</div>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  color: CHART.DIM,
                  ...FIG,
                }}
              >
                {b.range}
              </div>
            </div>
          ))}
        </div>
      </div>
    </HcpSection>
  );
};

export default ScoringSection;
