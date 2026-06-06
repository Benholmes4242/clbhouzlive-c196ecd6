import React, { useMemo } from 'react';

import {
  useHandicapTrend,
  useHandicapHistory,
  useAllScores,
} from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

type Tier = 'div0' | 'div1' | 'div2' | 'div3';

const TIER_LABEL: Record<Tier, string> = {
  div0: 'DIV 0',
  div1: 'DIV 1',
  div2: 'DIV 2',
  div3: 'DIV 3',
};

const HeroHandicapCardDark: React.FC<Props> = ({ connection }) => {
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history90, isLoading: history90Loading } = useHandicapHistory(connection.id, 90);
  const { data: allScores } = useAllScores(connection.id);

  const handicap = trend?.current ?? null;

  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[history90.length - 1].handicap_index - history90[0].handicap_index;
  }, [history90]);

  const startingHcp = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[0].handicap_index;
  }, [history90]);

  const tier = useMemo<Tier | null>(() => {
    const baseHcp = startingHcp ?? handicap;
    if (baseHcp == null) return null;
    if (baseHcp < 0) return 'div0';
    if (baseHcp <= 10) return 'div1';
    if (baseHcp <= 20) return 'div2';
    return 'div3';
  }, [startingHcp, handicap]);

  // ── Scoring avg (90d) ────────────────────────────────────────────
  const scores = (allScores ?? []) as any[];
  const ninetyDaysAgo = Date.now() - 90 * 86_400_000;
  const recent90 = useMemo(
    () =>
      scores.filter((s) => {
        if (!s?.play_date) return false;
        const t = new Date(s.play_date).getTime();
        return Number.isFinite(t) && t >= ninetyDaysAgo;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scores],
  );

  const scoringAvg = useMemo<number | null>(() => {
    const vals = recent90
      .map((s) => s?.adjusted_gross)
      .filter((v: any): v is number => typeof v === 'number');
    if (vals.length < 3) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [recent90]);

  const roundCount = recent90.length;

  // ── Best differential ───────────────────────────────────────────
  const bestDiff = useMemo<number | null>(() => {
    const counters = scores.filter((s) => s?.is_counter !== false);
    const withDiff = counters.filter((s) => typeof s?.handicap_differential === 'number');
    if (withDiff.length === 0) return null;
    let best = withDiff[0].handicap_differential as number;
    for (const r of withDiff) {
      if ((r.handicap_differential as number) < best) best = r.handicap_differential as number;
    }
    return best;
  }, [scores]);

  const isLoading = trendLoading || history90Loading;

  const trendColor =
    delta90 == null
      ? 'var(--hcp-t-60)'
      : delta90 > 0
        ? 'var(--hcp-bad-2)'
        : delta90 < 0
          ? 'var(--hcp-good-2)'
          : 'var(--hcp-t-60)';
  const trendArrow = delta90 == null ? '' : delta90 > 0 ? '↑' : delta90 < 0 ? '↓' : '';

  return (
    <section
      style={{
        padding: '16px 16px 22px',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 16,
          padding: 18,
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-40)',
            marginBottom: 6,
          }}
        >
          WHS Index · 90 days
        </div>

        {/* big index + tier, trend right */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            {isLoading ? (
              <div
                style={{
                  width: 96,
                  height: 48,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: 54,
                  fontWeight: 800,
                  color: 'var(--hcp-t-100)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {handicap != null ? handicap.toFixed(1) : '—'}
              </span>
            )}
            {tier && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-60)', letterSpacing: '0.06em' }}>
                {TIER_LABEL[tier]}
              </span>
            )}
          </div>

          {delta90 != null && !isLoading && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: trendColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {trendArrow} {Math.abs(delta90).toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--hcp-t-40)', fontWeight: 600 }}>over 90 days</div>
            </div>
          )}
        </div>

        {/* labelled columns */}
        <div
          style={{
            display: 'flex',
            borderTop: '1px solid var(--hcp-line-2)',
            marginTop: 16,
            paddingTop: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--hcp-t-40)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: 3,
                textTransform: 'uppercase',
              }}
            >
              Scoring Avg
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--hcp-t-100)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {scoringAvg != null ? scoringAvg.toFixed(1) : '—'}{' '}
              <span style={{ fontSize: 11, color: 'var(--hcp-t-40)', fontWeight: 600 }}>
                · {roundCount} {roundCount === 1 ? 'round' : 'rounds'}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid var(--hcp-line-2)', paddingLeft: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--hcp-t-40)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: 3,
                textTransform: 'uppercase',
              }}
            >
              Best Diff
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: bestDiff != null && bestDiff < 0 ? 'var(--hcp-good-2)' : 'var(--hcp-t-100)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {bestDiff != null ? (bestDiff > 0 ? '+' : '') + bestDiff.toFixed(1) : '—'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHandicapCardDark;
