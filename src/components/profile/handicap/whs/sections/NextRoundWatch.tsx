/**
 * NextRoundWatch - what the next round does to the index, in golf English.
 *
 * TWO states only. The index cannot fall on its own: settleAt is the mean of
 * the best 8 of the REMAINING 19, so dropping the oldest round either leaves
 * the top 8 untouched (settleAt === current) or replaces a counter with a
 * worse round (settleAt > current). It can never be lower.
 *
 *   cannot rise -> "Your handicap can't go up next round."
 *   will rise   -> "Your handicap goes up to {settle} next round" + sub.
 *
 * The card carries ONE sentence and ONE chart. No state label, no explanation
 * paragraph, no raise threshold - none is computed.
 *
 * Renders NOTHING below 20 rounds or when the projection is unusable.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from './_shared/darkAtoms';
import { Last5AgainstTarget } from '../charts/Last5AgainstTarget';
import { CHART, CHART_FONT, indexTone } from '../charts';

const MIN_ROUNDS = 20;
const KICKER = {
  fontFamily: CHART_FONT,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase' as const,
  color: CHART.DIM,
};

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

  /** Last five differentials, OLDEST FIRST for the chart. */
  const last5 = useMemo(() => {
    if (!allScores) return [];
    return allScores
      .slice(0, 5)
      .map((r) => r.handicap_differential)
      .filter((d): d is number => typeof d === 'number' && !Number.isNaN(d))
      .reverse();
  }, [allScores]);

  // Fire once per mount when the card is actually rendered. Never awaited.
  const firedRef = useRef(false);
  const shownPayload = useMemo(() => {
    if (!projection || !projection.hasData || currentHandicap == null) return null;
    const { cutTarget, settleAtRaw } = projection;
    if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;
    return {
      cut: Number(cutTarget.toFixed(1)),
      rise: Number((settleAtRaw - currentHandicap).toFixed(1)),
      counting: Math.min(8, allScores?.length ?? 0),
    };
  }, [projection, currentHandicap, allScores]);

  useEffect(() => {
    if (!shownPayload || firedRef.current) return;
    firedRef.current = true;
    analyticsEvents.track('handicap_next_round_shown', shownPayload);
  }, [shownPayload]);

  const tone =
    projection && currentHandicap != null
      ? indexTone(currentHandicap, projection.settleAtRaw)
      : null;

  // Should be unreachable: a falling index means the stored value is stale.
  const impossibleRef = useRef(false);
  useEffect(() => {
    if (tone !== 'down' || impossibleRef.current || !projection || currentHandicap == null) return;
    impossibleRef.current = true;
    analyticsEvents.track('handicap_next_round_impossible_state', {
      settle: projection.settleAt,
      cut: projection.cutTarget,
      current: currentHandicap,
    });
  }, [tone, projection, currentHandicap]);

  if (isLoading || !projection || !projection.hasData || currentHandicap == null) return null;

  const { cutTarget, settleAt, settleAtRaw } = projection;
  if (!Number.isFinite(cutTarget) || !Number.isFinite(settleAtRaw)) return null;

  const willRise = tone === 'up';
  const cut = cutTarget.toFixed(1);
  const settle = settleAt.toFixed(1);

  const line = willRise
    ? t('common:handicap.nextRound.lineRise', { settle })
    : t('common:handicap.nextRound.lineHold');
  const sub = willRise
    ? t('common:handicap.nextRound.subRise', { cut })
    : t('common:handicap.nextRound.subHold', { cut });

  const counting = last5.filter((v) => v <= cutTarget).length;

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <DarkSectionHeader
        eyebrow={t('common:handicap.nextRound.eyebrow')}
        right={<span style={KICKER}>{t('common:handicap.nextRound.sample')}</span>}
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
        <p
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: CHART.INK,
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          {line}
        </p>
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 400,
            color: CHART.MUTE,
            lineHeight: 1.45,
            margin: '6px 0 18px',
          }}
        >
          {sub}
        </p>

        <Last5AgainstTarget
          values={last5}
          cut={cutTarget}
          targetLabel={t('common:handicap.nextRound.countsAt', { cut })}
          footLabel={t('common:handicap.nextRound.lastRounds', {
            count: counting,
            total: last5.length,
          })}
        />
      </div>
    </section>
  );
};

export default NextRoundWatch;
