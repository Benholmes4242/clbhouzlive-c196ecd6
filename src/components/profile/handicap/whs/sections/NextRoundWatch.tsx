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
 * Direction is never decided here: it goes through directionTone(), so the
 * handicap inversion (index up = red) stays owned by the chart tokens.
 */
import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from './_shared/darkAtoms';
import { NextRoundBand, CHART, CHART_FONT, LABEL_STYLE, directionTone, toneColor } from '../charts';

const MIN_ROUNDS = 20;
const SCALE_PAD = 6;

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

const NextRoundWatch: React.FC<Props> = ({ connectionId, currentHandicap }) => {
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
  const tone = directionTone(currentHandicap, settleAtRaw);
  const color = toneColor(tone);

  const stateLabel =
    tone === 'up' ? 'At risk' : tone === 'down' ? 'Drifting down' : 'Holding';

  const why =
    tone === 'up'
      ? counterDropping
        ? `A counting round is rolling off, so the index settles at ${settleAt.toFixed(1)} unless you beat ${cutTarget.toFixed(1)}.`
        : `Anything worse than ${cutTarget.toFixed(1)} leaves the index at ${settleAt.toFixed(1)}.`
      : tone === 'down'
        ? `The window is improving on its own: the index reaches ${settleAt.toFixed(1)} even without a counter.`
        : `The window is stable: the index stays near ${settleAt.toFixed(1)} whatever the next round does.`;

  // The band scale is centred on the cut target. A red zone only exists when
  // the index actually rises without a counter.
  const lo = cutTarget - SCALE_PAD;
  const hi = cutTarget + SCALE_PAD;
  const rise = tone === 'up' ? cutTarget : hi;

  const explanation =
    last5Avg != null
      ? last5Avg <= cutTarget
        ? `Your last 5 average is ${last5Avg.toFixed(1)}, inside the cut zone.`
        : `Your last 5 average is ${last5Avg.toFixed(1)}, ${(last5Avg - cutTarget).toFixed(1)} outside the cut zone.`
      : 'Best 8 of the last 20 differentials set the index. Beat the cut target and one of them is replaced.';

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <DarkSectionHeader
        eyebrow="Next round"
        right={<span style={{ ...LABEL_STYLE }}>Last 20 rounds</span>}
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
