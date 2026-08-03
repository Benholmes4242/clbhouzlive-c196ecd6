/**
 * NextRoundWatch - what the next round does to the index.
 *
 * Carries THREE things, in this order and nothing else:
 *   1. the verdict state label plus its "why" sentence
 *   2. the NextRoundBand
 *   3. the explanation line
 *
 * Renders NOTHING when fewer than 20 rounds exist or the projection is not
 * usable. No empty container, no placeholder band.
 *
 * Direction is never decided here: it goes through indexTone(), so the
 * handicap inversion (index up = red) stays owned by the chart tokens.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/lib/analytics/events';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from './_shared/darkAtoms';
import { NextRoundBand, CHART, CHART_FONT, LABEL_STYLE, indexTone, toneColor } from '../charts';

const MIN_ROUNDS = 20;
const SCALE_PAD = 6;

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

const NextRoundWatch: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { t } = useTranslation(['common']);
  const { data: allScores, isLoading } = useAllScores(connectionId);

  const projection = useMemo(() => {
    if (!allScores || allScores.length < MIN_ROUNDS || currentHandicap == null) return null;
    return projectNextRound(allScores.slice(0, 20), currentHandicap);
  }, [allScores, currentHandicap]);

  const last5Avg = useMemo(() => {
    if (!allScores) return null;
    const diffs = allScores
      .slice(0, 5)
      .map((r) => r.handicap_differential)
      .filter((d): d is number => typeof d === 'number');
    if (diffs.length === 0) return null;
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }, [allScores]);

  if (isLoading || !projection || !projection.hasData || currentHandicap == null) return null;

  const { cutTarget, settleAt, settleAtRaw, counterDropping } = projection;
  if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;

  // Direction of travel of the INDEX if the next round does not count.
  const tone = indexTone(currentHandicap, settleAtRaw);
  const color = toneColor(tone);

  const stateLabel =
    tone === 'up'
      ? t('common:handicap.nextRound.stateUp')
      : tone === 'down'
        ? t('common:handicap.nextRound.stateDown')
        : t('common:handicap.nextRound.stateFlat');

  const settle = settleAt.toFixed(1);
  const cut = cutTarget.toFixed(1);

  const why =
    tone === 'up'
      ? counterDropping
        ? t('common:handicap.nextRound.whyUpCounterDropping', { settle, cut })
        : t('common:handicap.nextRound.whyUp', { settle, cut })
      : tone === 'down'
        ? t('common:handicap.nextRound.whyDown', { settle })
        : t('common:handicap.nextRound.whyFlat', { settle });

  // The band scale is centred on the cut target. A red zone only exists when
  // the index actually rises without a counter.
  const lo = cutTarget - SCALE_PAD;
  const hi = cutTarget + SCALE_PAD;
  const rise = tone === 'up' ? cutTarget : hi;

  const explanation =
    last5Avg != null
      ? last5Avg <= cutTarget
        ? t('common:handicap.nextRound.explainInside', { avg: last5Avg.toFixed(1) })
        : t('common:handicap.nextRound.explainOutside', {
            avg: last5Avg.toFixed(1),
            gap: (last5Avg - cutTarget).toFixed(1),
          })
      : t('common:handicap.nextRound.explainFallback');

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <DarkSectionHeader
        eyebrow={t('common:handicap.nextRound.eyebrow')}
        right={<span style={{ ...LABEL_STYLE }}>{t('common:handicap.nextRound.sample')}</span>}
      />

      <div
        style={{
          margin: '0 16px',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        {/* 1. verdict state label + why */}
        <div style={{ ...LABEL_STYLE, color }}>{stateLabel}</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: CHART.INK,
            lineHeight: 1.35,
            margin: '8px 0 16px',
          }}
        >
          {why}
        </p>

        {/* 2. the band */}
        <NextRoundBand cut={cutTarget} rise={rise} lo={lo} hi={hi} />

        {/* 3. explanation line */}
        <p
          style={{
            fontSize: 12,
            color: CHART.MUTE,
            lineHeight: 1.4,
            margin: '14px 0 0',
          }}
        >
          {explanation}
        </p>
      </div>
    </section>
  );
};

export default NextRoundWatch;
