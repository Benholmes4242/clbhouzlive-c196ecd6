import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import { useRecentRounds } from '@/lib/whs/hooks';
import { computeRoundDeltas, type RoundWithDelta } from './computeRoundDeltas';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';

interface Props {
  connectionId: string;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  hairline: 'rgba(15,23,42,0.08)',
  cardBg: '#FFFFFF',
  greenInk: '#065F46',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const fmtDiff = (d: number | null | undefined): string => {
  if (d === null || d === undefined) return '—';
  if (d > 0) return `+${d.toFixed(1)}`;
  if (d < 0) return `\u2212${Math.abs(d).toFixed(1)}`;
  return '0.0';
};

const fmtDate = (iso: string): string => {
  try {
    return format(new Date(iso), 'EEE d MMM');
  } catch {
    return iso;
  }
};

export const RecentRoundsCard: React.FC<Props> = ({ connectionId }) => {
  const { data: recent, isLoading } = useRecentRounds(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);

  const rounds = useMemo(
    () => (recent ? computeRoundDeltas(recent) : []),
    [recent],
  );

  const openDelta = openScoreId
    ? rounds.find((r) => r.id === openScoreId)?.handicap_delta ?? null
    : null;

  return (
    <section style={{ padding: '0 20px', marginBottom: 28, fontFamily: FONT }}>
      <SectionHeader count={rounds.length} />

      {isLoading ? (
        <SkeletonStack />
      ) : rounds.length === 0 ? (
        <EmptyState />
      ) : (
        rounds.map((round) => (
          <RoundTile
            key={round.id}
            round={round}
            onTap={() => setOpenScoreId(round.id)}
          />
        ))
      )}

      <RoundDetailSheet
        scoreId={openScoreId}
        open={openScoreId !== null}
        onClose={() => setOpenScoreId(null)}
        handicapDelta={openDelta}
      />
    </section>
  );
};

const SectionHeader: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ padding: '0 4px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <h3
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: T.ink,
          fontFamily: FONT,
        }}
      >
        Recent rounds
      </h3>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.inkMute,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        Last {count}
      </span>
    </div>
  </div>
);

interface TileProps {
  round: RoundWithDelta;
  onTap: () => void;
}

const RoundTile: React.FC<TileProps> = ({ round, onTap }) => {
  const isCounter = round.is_counter;
  const courseName = round.course?.name ?? 'Unknown course';
  const showImpactPill =
    isCounter && round.handicap_delta !== null && round.handicap_delta !== 0;

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`View detail for ${courseName} on ${fmtDate(round.play_date)}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: isCounter ? 'none' : `1px solid ${T.hairline}`,
        background: isCounter ? T.greenInk : T.cardBg,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.opacity = '0.85')}
      onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
      onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {round.adjusted_gross !== null && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 12,
            top: -2,
            margin: 0,
            fontSize: 56,
            fontWeight: 200,
            color: isCounter ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.06)',
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.06em',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {round.adjusted_gross}
        </span>
      )}

      <div style={{ position: 'relative' }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: isCounter ? '#fff' : T.ink,
            fontFamily: FONT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
            maxWidth: '72%',
            marginBottom: 5,
          }}
        >
          {courseName}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            maxWidth: '78%',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isCounter ? 'rgba(255,255,255,0.70)' : T.inkMute,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: FONT,
            }}
          >
            {fmtDate(round.play_date)}
          </span>

          <span style={{ color: isCounter ? 'rgba(255,255,255,0.30)' : T.hairline }}>·</span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isCounter ? 'rgba(255,255,255,0.85)' : T.inkMute,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtDiff(round.handicap_differential)} vs hcp
          </span>

          {showImpactPill && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                padding: '2px 6px 2px 4px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {round.handicap_delta! < 0 ? (
                <ArrowDown size={10} strokeWidth={2.6} />
              ) : (
                <ArrowUp size={10} strokeWidth={2.6} />
              )}
              {Math.abs(round.handicap_delta!).toFixed(1)} hcp
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const SkeletonStack: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse"
        style={{
          height: 60,
          background: 'rgba(15,23,42,0.04)',
          borderRadius: 12,
          marginBottom: 8,
        }}
      />
    ))}
  </>
);

const EmptyState: React.FC = () => (
  <div
    style={{
      padding: '40px 16px 48px',
      textAlign: 'center',
      background: T.cardBg,
      border: `1px solid ${T.hairline}`,
      borderRadius: 12,
      fontFamily: FONT,
    }}
  >
    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink }}>
      No rounds yet
    </p>
    <p
      style={{
        margin: '6px 0 0',
        fontSize: 12,
        color: T.inkMute,
        lineHeight: 1.5,
      }}
    >
      Your rounds will appear here as soon as they sync from your handicap provider.
    </p>
  </div>
);

export default RecentRoundsCard;
