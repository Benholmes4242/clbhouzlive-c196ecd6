import React, { useEffect, useMemo, useState } from 'react';
import {
  TripleStrip,
  KPICell,
  VerdictNumber,
  VerdictPill,
  verdictForDelta,
  type Verdict,
} from './_shared/darkAtoms';

import {
  useHandicapTrend,
  useHandicapHistory,
  useAllScores,
} from '@/lib/whs/hooks';
import { fmtHcp } from '@/lib/whs/format';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  connection: WhsConnection;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// Ring geometry — tighter 220 box with confident 14px stroke.
const RING_BOX = 220;
const STROKE_W = 14;
const CIRC_R = (RING_BOX - STROKE_W) / 2;     // 103
const CIRCUMFERENCE = 2 * Math.PI * CIRC_R;    // ≈ 647.16

function formatToday(): string {
  return new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()
    .replace(/,/g, '');
}

function arcGradient(verdict: Verdict): { from: string; to: string } {
  // Solid colour at both stops — eliminates the visible seam where the
  // linear gradient wraps around the top/bottom of the ring (T8).
  if (verdict === 'good') return { from: '#22C55E', to: '#22C55E' };
  if (verdict === 'bad') return { from: '#EF4444', to: '#EF4444' };
  return { from: '#F7931E', to: '#F7931E' };
}

// Form temperature label from a Stableford delta vs personal baseline.
function formLabel(periodAvg: number | null, allAvg: number | null): {
  label: string;
  verdict: 'warm' | 'cold' | 'neutral';
} {
  if (periodAvg == null || allAvg == null) return { label: '—', verdict: 'neutral' };
  const d = periodAvg - allAvg;
  if (d > 3.0) return { label: 'Hot', verdict: 'warm' };
  if (d > 1.0) return { label: 'Warm', verdict: 'warm' };
  if (d < -3.0) return { label: 'Cold', verdict: 'cold' };
  if (d < -1.0) return { label: 'Cold', verdict: 'cold' };
  return { label: 'Steady', verdict: 'neutral' };
}

const HeroHandicapCardDark: React.FC<Props> = ({ connection }) => {
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history90, isLoading: history90Loading } = useHandicapHistory(connection.id, 90);
  const { data: allScores } = useAllScores(connection.id);

  const handicap = trend?.current ?? null;

  // 90-day delta derived from the same snapshots that drive the chart.
  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    const oldest = history90[0].handicap_index;
    const latest = history90[history90.length - 1].handicap_index;
    return latest - oldest;
  }, [history90]);

  // Starting handicap (90d ago) — used to lock the tier.
  const startingHcp = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[0].handicap_index;
  }, [history90]);

  type Tier = 'div0' | 'div1' | 'div2' | 'div3';

  const TIER_TARGET: Record<Tier, number> = {
    div0: 0.5,
    div1: 1.0,
    div2: 2.0,
    div3: 3.0,
  };

  const TIER_LABEL: Record<Tier, string> = {
    div0: 'DIV 0',
    div1: 'DIV 1',
    div2: 'DIV 2',
    div3: 'DIV 3',
  };

  // Tier locked from starting handicap if available, otherwise current.
  const tier = useMemo<Tier | null>(() => {
    const baseHcp = startingHcp ?? handicap;
    if (baseHcp == null) return null;
    if (baseHcp < 0) return 'div0';
    if (baseHcp <= 10) return 'div1';
    if (baseHcp <= 20) return 'div2';
    return 'div3';
  }, [startingHcp, handicap]);

  // Verdict drives ring colour + pill + tag word.
  const verdict: Verdict = useMemo(() => {
    if (delta90 == null) return 'neutral';
    if (Math.abs(delta90) <= 0.2) return 'mid';
    return verdictForDelta(delta90); // negative = good (handicap going down)
  }, [delta90]);

  // Animate ring fill from empty → target on mount.
  const [animatedHcp, setAnimatedHcp] = useState<number | null>(null);
  useEffect(() => {
    if (handicap == null) return;
    setAnimatedHcp(null);
    const t = setTimeout(() => setAnimatedHcp(handicap), 30);
    return () => clearTimeout(t);
  }, [handicap]);

  // Ring fill = improvement over 90d vs tier-specific target (0-1 clamped).
  const fillFraction = useMemo(() => {
    if (delta90 == null || tier == null) return 0;
    const improvement = -delta90; // delta is negative when improving
    if (improvement <= 0) return 0;
    return Math.min(improvement / TIER_TARGET[tier], 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delta90, tier]);

  const dashOffset = CIRCUMFERENCE * (1 - fillFraction);

  const grad = arcGradient(verdict);

  // Scratch zone: half-step below current displayed value (e.g. 1.8 → 1.6).
  const scratchZone = useMemo(() => {
    if (handicap == null) return null;
    return (Math.floor(handicap * 5) / 5).toFixed(1);
  }, [handicap]);


  // ── KPI strip data ────────────────────────────────────────────────
  const scores = (allScores ?? []) as any[];
  const counters = scores.filter((s) => s?.is_counter !== false);

  // 90-day window — shared by Scoring + Form.
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

  const scoringAvg90 = useMemo<number | null>(() => {
    const vals = recent90
      .map((s) => s?.adjusted_gross)
      .filter((v: any): v is number => typeof v === 'number');
    if (vals.length < 3) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [recent90]);

  const roundCount90 = recent90.length;

  const periodAvgPts90 = useMemo<number | null>(() => {
    const v = recent90.map((s) => s?.stableford_points).filter((p: any): p is number => typeof p === 'number');
    if (v.length < 3) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }, [recent90]);

  // Lifetime stableford baseline — used only as the comparison anchor for Form's label.
  const lifetimeAvgPts = useMemo<number | null>(() => {
    const v = scores.map((s) => s?.stableford_points).filter((p: any): p is number => typeof p === 'number');
    if (v.length === 0) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }, [scores]);

  const form = formLabel(periodAvgPts90, lifetimeAvgPts);

  const best = useMemo(() => {
    const withDiff = counters.filter(
      (s) => typeof s?.handicap_differential === 'number',
    );
    if (withDiff.length === 0) return null;
    let bestRow = withDiff[0];
    for (const r of withDiff) {
      if (r.handicap_differential < bestRow.handicap_differential) bestRow = r;
    }
    const date = bestRow.play_date
      ? new Date(bestRow.play_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : null;
    const courseName: string | undefined = bestRow.course?.name;
    return {
      diff: bestRow.handicap_differential as number,
      courseName: courseName ?? null,
      date: date ?? null,
    };
  }, [counters]);

  const isLoading = trendLoading || history90Loading;

  return (
    <section
      style={{
        background: 'var(--hcp-bg-0)',
        borderBottom: '1px solid var(--hcp-line)',
        padding: '4px 0 22px',
        fontFamily: FONT,
      }}
    >
      <DarkSectionHeader eyebrow="Index · 90D" right={formatToday()} />

      {/* Ring */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 0 6px',
        }}
      >
        <div style={{ position: 'relative', width: RING_BOX, height: RING_BOX }}>
          <svg
            width={RING_BOX}
            height={RING_BOX}
            viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            <defs>
              <linearGradient id="hcp-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={grad.from} />
                <stop offset="100%" stopColor={grad.to} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              r={CIRC_R}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE_W}
            />
            {/* Progress arc */}
            <circle
              cx={RING_BOX / 2}
              cy={RING_BOX / 2}
              r={CIRC_R}
              fill="none"
              stroke="url(#hcp-arc-grad)"
              strokeWidth={STROKE_W}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={animatedHcp == null ? CIRCUMFERENCE : dashOffset}
              style={{
                transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,0.61,0.36,1)',
              }}
            />
          </svg>

          {/* Inner content — just the number; verdict implied by ring colour + change chip below */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {handicap == null && !isLoading ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-60)',
                  textAlign: 'center',
                  padding: '0 20px',
                }}
              >
                Connect WHS to start
              </span>
            ) : (
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: 'var(--hcp-t-100)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isLoading ? '—' : fmtHcp(handicap)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change chip + tier pill — anchored below ring */}
      {!isLoading && (tier != null || delta90 != null) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            flexWrap: 'wrap',
          }}
        >
          {tier && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '5px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.10em',
                color: 'var(--hcp-t-60)',
                textTransform: 'uppercase',
              }}
            >
              {TIER_LABEL[tier]}
            </span>
          )}

          {delta90 != null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                background:
                  verdict === 'good' ? 'rgba(34, 197, 94, 0.14)' :
                  verdict === 'bad'  ? 'rgba(239, 68, 68, 0.14)' :
                  'rgba(247, 147, 30, 0.14)',
                border:
                  verdict === 'good' ? '1px solid rgba(34, 197, 94, 0.25)' :
                  verdict === 'bad'  ? '1px solid rgba(239, 68, 68, 0.25)' :
                  '1px solid rgba(247, 147, 30, 0.25)',
                fontSize: 12,
                fontWeight: 700,
                color:
                  verdict === 'good' ? '#4ADE80' :
                  verdict === 'bad'  ? '#F87171' :
                  '#F7931E',
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden
              >
                {verdict === 'good' ? (
                  <>
                    <path d="M12 5v14" />
                    <path d="M19 12l-7 7-7-7" />
                  </>
                ) : verdict === 'bad' ? (
                  <>
                    <path d="M12 19V5" />
                    <path d="M5 12l7-7 7 7" />
                  </>
                ) : (
                  <path d="M5 12h14" />
                )}
              </svg>
              {Math.abs(delta90).toFixed(1)} over 90 days
              {verdict === 'good' && (
                <span style={{ fontSize: 13, lineHeight: 1, marginLeft: 2 }}>🔥</span>
              )}
            </span>
          )}
        </div>
      )}



      {/* TripleStrip */}
      <TripleStrip variant="flush">
        <KPICell
          label="Scoring"
          value={
            scoringAvg90 != null ? (
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
                {scoringAvg90.toFixed(1)}
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--hcp-t-100)', letterSpacing: 0 }}>
                  avg
                </span>
              </span>
            ) : (
              '—'
            )
          }
          meta={
            scoringAvg90 != null
              ? `${roundCount90} rounds`
              : roundCount90 === 0
                ? 'no rounds'
                : `< 3 rounds`
          }
        />
        <KPICell
          label="Form"
          value={form.label}
          meta={periodAvgPts90 != null ? `${periodAvgPts90.toFixed(1)} pts avg` : '—'}
          verdict={form.verdict}
        />
        <KPICell
          label="Best"
          value={
            best ? (
              <VerdictNumber
                value={best.diff}
                digits={1}
                forceVerdict={best.diff < 0 ? 'good' : 'neutral'}
                size="lg"
              />
            ) : (
              '—'
            )
          }
          meta={
            best?.courseName ? (
              <span
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'center',
                  lineHeight: 1.25,
                }}
              >
                {best.courseName}
              </span>
            ) : (
              '—'
            )
          }
        />
      </TripleStrip>
    </section>
  );
};

export default HeroHandicapCardDark;
