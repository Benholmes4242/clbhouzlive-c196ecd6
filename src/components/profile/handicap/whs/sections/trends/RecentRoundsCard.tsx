import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAllScores } from '@/lib/whs/hooks';
import { computeRoundDeltas, type RoundWithDelta } from './computeRoundDeltas';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';

interface Props {
  connectionId: string;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  inkFaded: 'rgba(15,23,42,0.40)',
  hairline: 'rgba(15,23,42,0.08)',
  cardBg: '#FFFFFF',
  greenInk: '#065F46',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const PAGE_SIZE = 15;

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
  const { data: allRounds, isLoading } = useAllScores(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);

  const rounds = useMemo(
    () => (allRounds ? computeRoundDeltas(allRounds) : []),
    [allRounds],
  );

  const totalPages = Math.max(1, Math.ceil(rounds.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rounds.length);
  const visibleRounds = rounds.slice(start, end);

  const canGoOlder = safePageIndex < totalPages - 1;
  const canGoNewer = safePageIndex > 0;

  const goOlder = () => {
    if (!canGoOlder) return;
    setDirection(-1);
    setPageIndex((p) => p + 1);
  };
  const goNewer = () => {
    if (!canGoNewer) return;
    setDirection(1);
    setPageIndex((p) => p - 1);
  };

  const openDelta = openScoreId
    ? rounds.find((r) => r.id === openScoreId)?.handicap_delta ?? null
    : null;

  return (
    <section style={{ padding: '0 20px', marginBottom: 28, fontFamily: FONT }}>
      <SectionHeader
        rangeStart={start + 1}
        rangeEnd={end}
        total={rounds.length}
        pageIndex={safePageIndex}
        totalPages={totalPages}
        canGoOlder={canGoOlder}
        canGoNewer={canGoNewer}
        onOlder={goOlder}
        onNewer={goNewer}
        showControls={!isLoading && rounds.length > PAGE_SIZE}
      />

      {isLoading ? (
        <SkeletonStack />
      ) : rounds.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            key={safePageIndex}
            style={{
              animation:
                direction === -1
                  ? 'recent-rounds-slide-from-right 280ms cubic-bezier(0.32, 0.72, 0, 1)'
                  : direction === 1
                    ? 'recent-rounds-slide-from-left 280ms cubic-bezier(0.32, 0.72, 0, 1)'
                    : undefined,
            }}
          >
            {visibleRounds.map((round) => (
              <RoundTile
                key={round.id}
                round={round}
                onTap={() => setOpenScoreId(round.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && totalPages > 1 && totalPages <= 10 && (
        <FooterDots pageIndex={safePageIndex} totalPages={totalPages} />
      )}

      <RoundDetailSheet
        scoreId={openScoreId}
        open={openScoreId !== null}
        onClose={() => setOpenScoreId(null)}
        handicapDelta={openDelta}
      />

      <style>{`
        @keyframes recent-rounds-slide-from-right {
          from { transform: translateX(28px); opacity: 0.4; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes recent-rounds-slide-from-left {
          from { transform: translateX(-28px); opacity: 0.4; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </section>
  );
};

interface SectionHeaderProps {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  pageIndex: number;
  totalPages: number;
  canGoOlder: boolean;
  canGoNewer: boolean;
  onOlder: () => void;
  onNewer: () => void;
  showControls: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  rangeStart,
  rangeEnd,
  total,
  pageIndex,
  totalPages,
  canGoOlder,
  canGoNewer,
  onOlder,
  onNewer,
  showControls,
}) => (
  <div style={{ padding: '0 4px 12px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: showControls ? 8 : 0,
      }}
    >
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
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {total === 0 ? 'No rounds' : `${rangeStart}\u2013${rangeEnd} of ${total}`}
      </span>
    </div>

    {showControls && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <NavChip label="Newer" icon="left" disabled={!canGoNewer} onClick={onNewer} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.inkMute,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Page {pageIndex + 1} of {totalPages}
        </span>
        <NavChip label="Older" icon="right" disabled={!canGoOlder} onClick={onOlder} />
      </div>
    )}
  </div>
);

interface NavChipProps {
  label: 'Newer' | 'Older';
  icon: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}

const NavChip: React.FC<NavChipProps> = ({ label, icon, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label === 'Newer' ? 'Newer rounds' : 'Older rounds'}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: icon === 'left' ? '6px 10px 6px 8px' : '6px 8px 6px 10px',
      borderRadius: 999,
      border: `1px solid ${T.hairline}`,
      background: disabled ? 'transparent' : T.cardBg,
      color: disabled ? T.inkFaded : T.inkSoft,
      fontSize: 11,
      fontWeight: 700,
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: FONT,
      letterSpacing: '0.02em',
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {icon === 'left' && <ChevronLeft size={13} strokeWidth={2.4} />}
    {label}
    {icon === 'right' && <ChevronRight size={13} strokeWidth={2.4} />}
  </button>
);

const FooterDots: React.FC<{ pageIndex: number; totalPages: number }> = ({
  pageIndex,
  totalPages,
}) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
    {Array.from({ length: totalPages }).map((_, i) => (
      <span
        key={i}
        style={{
          width: i === pageIndex ? 16 : 5,
          height: 5,
          borderRadius: 3,
          background: i === pageIndex ? T.ink : 'rgba(15,23,42,0.20)',
          transition: 'all 200ms ease',
        }}
      />
    ))}
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
        border: `1px solid ${T.hairline}`,
        background: T.cardBg,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
        padding: '12px 14px 12px 16px',
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
      }}
      onMouseDown={(e) => (e.currentTarget.style.opacity = '0.85')}
      onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
      onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {isCounter && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: T.greenInk,
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: T.ink,
              fontFamily: FONT,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
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
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.inkMute,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: FONT,
              }}
            >
              {fmtDate(round.play_date)}
            </span>

            <span style={{ color: T.hairline }}>·</span>

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.inkMute,
                fontFamily: FONT,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtDiff(round.handicap_differential)} vs hcp
            </span>

            {isCounter && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(5,150,105,0.12)',
                  color: T.greenInk,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  fontFamily: FONT,
                }}
              >
                COUNTER
              </span>
            )}

            {showImpactPill && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  background: round.handicap_delta! < 0 ? 'rgba(5,150,105,0.12)' : 'rgba(159,18,57,0.12)',
                  color: round.handicap_delta! < 0 ? T.greenInk : '#9F1239',
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

        {round.adjusted_gross !== null && (
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: T.ink,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {round.adjusted_gross}
          </span>
        )}
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
