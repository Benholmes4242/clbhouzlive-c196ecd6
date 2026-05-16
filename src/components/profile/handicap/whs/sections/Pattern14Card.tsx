import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { DarkSectionHeader, DarkCard } from './_shared/darkAtoms';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
}

const Pattern14Card: React.FC<Props> = ({ connectionId }) => {
  const { data: allScores, isLoading } = useAllScores(connectionId);

  const rounds14 = useMemo(() => {
    if (!allScores || allScores.length === 0) return [];
    const newestFirst = [...allScores].slice(0, 14);
    return newestFirst.reverse().map((r: any) => {
      const diff = r.handicap_differential;
      const hcp = r.handicap_index_at_time;
      const delta = diff != null && hcp != null ? diff - hcp : null;
      return { id: r.id, play_date: r.play_date, delta };
    });
  }, [allScores]);

  const olderRounds = useMemo(() => {
    if (!allScores || allScores.length <= 14) return [];
    const slice = [...allScores].slice(14, 21);
    return slice.reverse().map((r: any) => {
      const diff = r.handicap_differential;
      const hcp = r.handicap_index_at_time;
      const delta = diff != null && hcp != null ? diff - hcp : null;
      return { id: r.id, play_date: r.play_date, delta };
    });
  }, [allScores]);

  if (isLoading || rounds14.length === 0) return null;

  const firstDate = rounds14[0]?.play_date;
  const firstDateLabel = firstDate
    ? new Date(firstDate)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        .toUpperCase()
    : null;

  return (
    <>
      <DarkSectionHeader eyebrow="Last 14 Rounds" right="SCORE DIFF VS HCP" />
      <DarkCard>
        <div style={{ padding: '14px 16px 16px', fontFamily: FONT }}>
          {/* Inner header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.01em',
              }}
            >
              Pattern
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 9.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
              }}
            >
              <LegendDot color="var(--hcp-good)" />
              <span>Under</span>
              <span style={{ color: 'var(--hcp-t-40)' }}>·</span>
              <LegendDot color="var(--hcp-bad)" />
              <span>Over</span>
            </span>
          </div>

          {/* Main 14-square row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(14, 1fr)',
              gap: 4,
            }}
          >
            {rounds14.map((r) => (
              <PatternSquare key={r.id} delta={r.delta} />
            ))}
          </div>

          {/* Older row */}
          {olderRounds.length > 0 && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid var(--hcp-line)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--hcp-t-40)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 48,
                }}
              >
                {firstDateLabel ?? ''}
              </span>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flex: '0 0 auto',
                }}
              >
                {olderRounds.map((r) => (
                  <PatternSquare key={r.id} delta={r.delta} faded size={18} />
                ))}
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 9.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--hcp-t-60)',
                  minWidth: 44,
                  textAlign: 'right',
                }}
              >
                TODAY
              </span>
            </div>
          )}
        </div>
      </DarkCard>
    </>
  );
};

const PatternSquare: React.FC<{ delta: number | null; faded?: boolean; size?: number }> = ({
  delta,
  faded,
  size,
}) => {
  const { bg } = colorForDelta(delta);
  return (
    <div
      style={{
        width: size ?? '100%',
        height: size,
        aspectRatio: size ? undefined : '1 / 1',
        background: bg,
        borderRadius: 4,
        opacity: faded ? 0.45 : 1,
      }}
    />
  );
};

const LegendDot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      display: 'inline-block',
    }}
  />
);

function colorForDelta(delta: number | null): { bg: string } {
  if (delta == null) return { bg: 'var(--hcp-bg-3)' };
  if (delta <= -3) return { bg: 'var(--hcp-good)' };
  if (delta <= -1) return { bg: 'rgba(34,197,94,0.55)' };
  if (delta < 0) return { bg: 'rgba(34,197,94,0.20)' };
  if (delta < 1) return { bg: 'rgba(239,68,68,0.20)' };
  if (delta < 3) return { bg: 'rgba(239,68,68,0.55)' };
  return { bg: 'var(--hcp-bad)' };
}

export default Pattern14Card;
