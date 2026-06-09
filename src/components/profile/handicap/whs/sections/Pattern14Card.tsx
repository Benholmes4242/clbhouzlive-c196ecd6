import React, { useMemo, useState } from 'react';
import { useAllScores, useHandicapTrend } from '@/lib/whs/hooks';
import { DarkSectionHeader } from './_shared/darkAtoms';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { computeRoundDeltas }  from './trends/computeRoundDeltas';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
}

const Pattern14Card: React.FC<Props> = ({ connectionId }) => {
  const { data: allScores, isLoading } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);

  // Pre-compute handicap_delta for every round using the same helper
  // RecentRoundsCard uses. Counter-gated; null for non-counters or when
  // post-round index is unknown.
  const scoresWithDelta = useMemo(
    () => (allScores ? computeRoundDeltas(allScores, trend?.current ?? null) : []),
    [allScores, trend],
  );

  const rounds14 = useMemo(() => {
    if (!scoresWithDelta || scoresWithDelta.length === 0) return [];
    const newestFirst = [...scoresWithDelta].slice(0, 14);
    return newestFirst.reverse().map((r) => {
      const diff = r.handicap_differential;
      const hcp = r.handicap_index_at_time;
      const delta = diff != null && hcp != null ? diff - hcp : null;
      return {
        id: r.id,
        play_date: r.play_date,
        delta,
        handicapDelta: r.handicap_delta ?? null,
      };
    });
  }, [scoresWithDelta]);

  const olderRounds = useMemo(() => {
    if (!scoresWithDelta || scoresWithDelta.length <= 14) return [];
    const slice = [...scoresWithDelta].slice(14, 28);
    return slice.reverse().map((r) => {
      const diff = r.handicap_differential;
      const hcp = r.handicap_index_at_time;
      const delta = diff != null && hcp != null ? diff - hcp : null;
      return { id: r.id, play_date: r.play_date, delta };
    });
  }, [scoresWithDelta]);

  const fmtDate = (s: string): string =>
    new Date(s)
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      .toUpperCase();

  const mainCounter = useMemo<string | null>(() => {
    if (rounds14.length === 0) return null;
    const first = rounds14[0]?.play_date;
    if (!first) return null;
    return `${fmtDate(first)} → TODAY · ${rounds14.length} ROUNDS`;
  }, [rounds14]);

  const olderRange = useMemo<string | null>(() => {
    if (olderRounds.length === 0) return null;
    const first = olderRounds[0]?.play_date;
    const last = olderRounds[olderRounds.length - 1]?.play_date;
    if (!first || !last) return null;
    const a = fmtDate(first);
    const b = fmtDate(last);
    const range = a === b ? a : `${a} → ${b}`;
    const noun = olderRounds.length === 1 ? 'round' : 'rounds';
    return `${olderRounds.length} ${noun} from ${range}`;
  }, [olderRounds]);

  const counts = useMemo(() => {
    const acc = { better: 0, on: 0, worse: 0 };
    for (const r of rounds14) {
      const d = r.delta;
      if (d == null) continue;
      if (d <= -1) acc.better++;
      else if (d >= 1) acc.worse++;
      else acc.on++;
    }
    return acc;
  }, [rounds14]);

  const maxMag = useMemo(() => {
    const allDeltas = [
      ...rounds14.map((r) => r.delta),
      ...olderRounds.map((r) => r.delta),
    ].filter((d): d is number => d != null);
    if (allDeltas.length === 0) return 1;
    return Math.max(...allDeltas.map((d) => Math.abs(d)), 2);
  }, [rounds14, olderRounds]);

  if (isLoading || rounds14.length === 0) return null;

  const selectedRound = selectedScoreId
    ? rounds14.find((r) => r.id === selectedScoreId)
    : null;

  return (
    <>
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last 14 Rounds" right="SCORE DIFF VS HCP" />
        <div
          style={{
            margin: '0 16px',
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            fontFamily: FONT,
          }}
        >
          {/* ── SUMMARY STRIP ──────────────────────── */}
          <div
            style={{
              padding: '14px 16px 12px',
              borderBottom: '1px solid var(--hcp-line-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <SummaryStat value={counts.better} label="Better" color="var(--hcp-good-2)" />
            <SummaryStat value={counts.on} label="On pace" color="var(--hcp-t-100)" />
            <SummaryStat value={counts.worse} label="Worse" color="var(--hcp-bad)" />
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rounds14.length} rounds
            </span>
          </div>

          {/* ── MAIN HEATMAP ──────────────────────── */}
          <div style={{ padding: '20px 16px 14px' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                height: 80,
              }}
            >
              {rounds14.map((r) => {
                const dateLabel = fmtDate(r.play_date);
                const deltaLabel =
                  r.delta == null
                    ? 'no data'
                    : r.delta <= -1
                      ? 'better than handicap'
                        : r.delta >= 1
                        ? 'worse than handicap'
                        : 'on pace with handicap';
                return (
                  <PatternBar
                    key={r.id}
                    delta={r.delta}
                    maxMag={maxMag}
                    onClick={() => setSelectedScoreId(r.id)}
                    ariaLabel={`Round on ${dateLabel}, ${deltaLabel}. Tap to see details.`}
                  />
                );
              })}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'var(--hcp-line-2)',
                }}
              />
            </div>
            <div
              style={{
                height: 1,
                background: 'var(--hcp-line-2)',
                margin: '0 0 8px',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-40)',
              }}
            >
              <span>
                <span style={{ color: 'var(--hcp-t-60)' }}>←</span> Older
              </span>
              {mainCounter && (
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mainCounter}</span>
              )}
              <span>
                Newest <span style={{ color: 'var(--hcp-t-60)' }}>→</span>
              </span>
            </div>
          </div>

          {/* ── BEFORE THAT BAND ──────────────────── */}
          {olderRounds.length > 0 && (
            <div
              style={{
                padding: '12px 16px 14px',
                borderTop: '1px solid var(--hcp-line-2)',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--hcp-t-60)',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                  Before that
                </strong>
                {olderRange && <> · {olderRange}</>}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 3,
                  height: 22,
                }}
              >
                {olderRounds.map((r) => (
                  <PatternBar key={r.id} delta={r.delta} maxMag={maxMag} faded />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <RoundDetailSheet
        open={selectedScoreId != null}
        onClose={() => setSelectedScoreId(null)}
        scoreId={selectedScoreId ?? ''}
        connectionId={connectionId}
        handicapDelta={selectedRound?.handicapDelta ?? null}
      />
    </>
  );
};

const PatternBar: React.FC<{
  delta: number | null;
  maxMag: number;
  faded?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}> = ({ delta, maxMag, faded, onClick, ariaLabel }) => {
  const bucket: 'better' | 'on' | 'worse' | 'none' =
    delta == null
      ? 'none'
      : delta <= -1
        ? 'better'
        : delta >= 1
          ? 'worse'
          : 'on';

  const heightPct =
    bucket === 'on' || bucket === 'none'
      ? 0.12
      : Math.max(0.18, Math.min(1, Math.abs(delta as number) / maxMag));

  const fill =
    bucket === 'better'
      ? 'var(--hcp-good-2)'
      : bucket === 'worse'
        ? 'var(--hcp-bad)'
        : 'var(--hcp-bg-3)';

  const inner = (
    <div
      style={{
        width: '100%',
        height: `${heightPct * 100}%`,
        background: fill,
        borderRadius: '3px 3px 0 0',
        transition: 'transform 120ms ease',
      }}
    />
  );

  const container: React.CSSProperties = {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    opacity: faded ? 0.45 : 1,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        style={{
          ...container,
          border: 'none',
          padding: 0,
          background: 'transparent',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={(e) => {
          (e.currentTarget.firstChild as HTMLDivElement).style.transform = 'scaleY(0.92)';
          (e.currentTarget.firstChild as HTMLDivElement).style.transformOrigin = 'bottom';
        }}
        onTouchEnd={(e) => {
          (e.currentTarget.firstChild as HTMLDivElement).style.transform = 'scaleY(1)';
        }}
        onTouchCancel={(e) => {
          (e.currentTarget.firstChild as HTMLDivElement).style.transform = 'scaleY(1)';
        }}
      >
        {inner}
      </button>
    );
  }

  return <div style={container}>{inner}</div>;
};

const SummaryStat: React.FC<{
  value: number;
  label: string;
  color: string;
}> = ({ value, label, color }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
    <span
      style={{
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-60)',
      }}
    >
      {label}
    </span>
  </div>
);

export default Pattern14Card;
