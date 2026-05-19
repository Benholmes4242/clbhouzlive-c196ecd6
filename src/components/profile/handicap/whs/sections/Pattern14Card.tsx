import React, { useMemo, useState } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { DarkSectionHeader, DarkCard } from './_shared/darkAtoms';
import RoundDetailSheet from './round-detail/RoundDetailSheet';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
}

const Pattern14Card: React.FC<Props> = ({ connectionId }) => {
  const { data: allScores, isLoading } = useAllScores(connectionId);
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);

  const rounds14 = useMemo(() => {
    if (!allScores || allScores.length === 0) return [];
    const newestFirst = [...allScores].slice(0, 14);
    return newestFirst.reverse().map((r: any) => {
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
  }, [allScores]);

  const olderRounds = useMemo(() => {
    if (!allScores || allScores.length <= 14) return [];
    const slice = [...allScores].slice(14, 28);
    return slice.reverse().map((r: any) => {
      const diff = r.handicap_differential;
      const hcp = r.handicap_index_at_time;
      const delta = diff != null && hcp != null ? diff - hcp : null;
      return { id: r.id, play_date: r.play_date, delta };
    });
  }, [allScores]);

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

  if (isLoading || rounds14.length === 0) return null;

  const selectedRound = selectedScoreId
    ? rounds14.find((r) => r.id === selectedScoreId)
    : null;

  return (
    <>
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last 14 Rounds" right="SCORE DIFF VS HCP" />
        <DarkCard>
          <div style={{ padding: '14px 16px 16px', fontFamily: FONT }}>
            {/* Direction labels above the main grid */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-40)',
              }}
            >
              <span><span style={{ color: 'var(--hcp-t-60)' }}>←</span> Older</span>
              <span>Newest <span style={{ color: 'var(--hcp-t-60)' }}>→</span></span>
            </div>

            {/* Main 14-square row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(14, 1fr)',
                gap: 4,
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
                        : 'on handicap';
                return (
                  <PatternSquare
                    key={r.id}
                    delta={r.delta}
                    onClick={() => setSelectedScoreId(r.id)}
                    ariaLabel={`Round on ${dateLabel}, ${deltaLabel}. Tap to see details.`}
                  />
                );
              })}
            </div>

            {/* Date+count line under the grid */}
            {mainCounter && (
              <div
                style={{
                  marginTop: 8,
                  textAlign: 'right',
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-40)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {mainCounter}
              </div>
            )}

            {/* Legend — 3 buckets */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--hcp-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--hcp-t-80)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LegendSwatch color="var(--hcp-good)" />
                <span style={{ color: 'var(--hcp-t-100)' }}>Better</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LegendSwatch color="var(--hcp-bg-3)" bordered />
                <span style={{ color: 'var(--hcp-t-100)' }}>On handicap</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LegendSwatch color="var(--hcp-bad)" />
                <span style={{ color: 'var(--hcp-t-100)' }}>Worse</span>
              </span>
            </div>

            {/* Older row */}
            {olderRounds.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--hcp-line)',
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
                  <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>Before that</strong>
                  {olderRange && <> · {olderRange}</>}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${olderRounds.length}, 1fr)`,
                    gap: 4,
                  }}
                >
                  {olderRounds.map((r) => (
                    <PatternSquare key={r.id} delta={r.delta} faded />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DarkCard>
      </section>

      <RoundDetailSheet
        variant="user"
        open={selectedScoreId != null}
        onClose={() => setSelectedScoreId(null)}
        scoreId={selectedScoreId ?? ''}
        connectionId={connectionId}
        handicapDelta={selectedRound?.handicapDelta ?? null}
      />
    </>
  );
};

const PatternSquare: React.FC<{
  delta: number | null;
  faded?: boolean;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}> = ({ delta, faded, size, onClick, ariaLabel }) => {
  const { bg } = colorForDelta(delta);
  const baseStyle: React.CSSProperties = {
    width: size ?? '100%',
    height: size,
    aspectRatio: size ? undefined : '1 / 1',
    background: bg,
    borderRadius: 4,
    opacity: faded ? 0.45 : 1,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        style={{
          ...baseStyle,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          transition: 'transform 120ms ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
        }}
        onTouchEnd={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onTouchCancel={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      />
    );
  }

  return <div style={baseStyle} />;
};

const LegendSwatch: React.FC<{ color: string; bordered?: boolean }> = ({ color, bordered }) => (
  <span
    style={{
      width: 12,
      height: 12,
      borderRadius: 3,
      background: color,
      border: bordered ? '1px solid var(--hcp-line)' : 'none',
      display: 'inline-block',
    }}
  />
);

function colorForDelta(delta: number | null): { bg: string } {
  if (delta == null) return { bg: 'var(--hcp-bg-3)' };
  // 3-bucket scale: better, on-handicap (within ±1), worse.
  if (delta <= -1) return { bg: 'var(--hcp-good)' };
  if (delta >= 1) return { bg: 'var(--hcp-bad)' };
  return { bg: 'var(--hcp-bg-3)' };
}

export default Pattern14Card;
