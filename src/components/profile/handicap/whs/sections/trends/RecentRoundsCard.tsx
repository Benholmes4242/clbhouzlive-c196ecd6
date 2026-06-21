import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

import { useAllScores, useHandicapTrend } from '@/lib/whs/hooks';
import { computeRoundDeltas, type RoundWithDelta } from './computeRoundDeltas';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
import SectionHeader from '../SectionHeader';


interface Props {
  connectionId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  inkFaded: 'var(--hcp-t-40)',
  ink25: 'var(--hcp-t-20)',
  hairline: 'var(--hcp-line-2)',
  ink04: 'var(--hcp-bg-2)',
  ink06: 'var(--hcp-bg-3)',
  ink10: 'var(--hcp-line-2)',
  cardBg: 'var(--hcp-bg-1)',
  amber: '#F7931E',
  gold: '#FBBC2E',
  amberInk: '#854F0B',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const INITIAL_COUNT = 30;
const LOAD_MORE_COUNT = 15;

// ─── Format helpers ─────────────────────────────────────────────────
const fmtDiff = (d: number | null | undefined): string => {
  if (d === null || d === undefined) return '—';
  if (d > 0) return `+${d.toFixed(1)}`;
  if (d < 0) return `\u2212${Math.abs(d).toFixed(1)}`;
  return '0.0';
};

const diffColor = (d: number | null | undefined): string => {
  if (d === null || d === undefined) return T.inkMute;
  if (d < 0) return 'var(--hcp-good-deep)';
  if (d > 0) return 'var(--hcp-bad)';
  return T.inkSoft;
};

/**
 * Trim noisy suffixes from course names for compact chip display.
 * The full name stays as the filter key — only the display label changes.
 */
function shortenCourseName(name: string): string {
  return name
    .replace(/\s+(Golf\s+Club|Golf\s+Course|Country\s+Club|Course)$/i, '')
    .trim();
}

interface HcpDeltaInfo {
  sign: string;
  value: string;
  color: string;
  glow: string;
}
const fmtHcpDelta = (n: number | null): HcpDeltaInfo | null => {
  if (n === null || Math.abs(n) < 0.05) return null;
  if (n < 0) {
    return {
      sign: '\u2193',
      value: Math.abs(n).toFixed(1),
      color: 'var(--hcp-good-deep)',
      glow: 'none',
    };
  }
  return {
    sign: '\u2191',
    value: n.toFixed(1),
    color: 'var(--hcp-bad)',
    glow: 'none',
  };
};

const fmtRelativeDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const fmtMonth = (iso: string): string => {
  try {
    return format(new Date(iso), 'MMMM yyyy');
  } catch {
    return iso;
  }
};

type FilterKey = 'all' | 'counters' | string;

export const RecentRoundsCard: React.FC<Props> = ({ connectionId, viewMode = 'owner', ownerFirstName = null }) => {
  const { data: allRounds, isLoading } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [displayedCount, setDisplayedCount] = useState<number>(INITIAL_COUNT);

  const rounds = useMemo(
    () => (allRounds ? computeRoundDeltas(allRounds, trend?.current ?? null) : []),
    [allRounds, trend?.current],
  );


  const courseNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rounds) {
      const name = r.course?.name;
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [rounds]);

  const filteredRounds = useMemo(() => {
    if (filter === 'all') return rounds;
    if (filter === 'counters') return rounds.filter((r) => r.is_counter);
    return rounds.filter((r) => r.course?.name === filter);
  }, [rounds, filter]);

  const visibleRounds = filteredRounds.slice(0, displayedCount);
  const hasMore = filteredRounds.length > displayedCount;
  const counterCount = useMemo(() => rounds.filter((r) => r.is_counter).length, [rounds]);

  const grouped = useMemo(() => {
    const groups: { month: string; rounds: RoundWithDelta[] }[] = [];
    for (const r of visibleRounds) {
      const month = fmtMonth(r.play_date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) {
        last.rounds.push(r);
      } else {
        groups.push({ month, rounds: [r] });
      }
    }
    return groups;
  }, [visibleRounds]);

  const openDelta = openScoreId
    ? rounds.find((r) => r.id === openScoreId)?.handicap_delta ?? null
    : null;

  const handleLoadMore = () => setDisplayedCount((n) => n + LOAD_MORE_COUNT);

  const handleSetFilter = (next: FilterKey) => {
    setFilter(next);
    setDisplayedCount(INITIAL_COUNT);
  };

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <style>{`
        .rr-last-row > button[data-feedrow="true"] { border-bottom: none; }
      `}</style>
      <SectionHeader
        eyebrow="RECENT ROUNDS"
        title={`${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'} tracked`}
        sub={
          viewMode === 'friend'
            ? `${ownerFirstName ? `${ownerFirstName}'s` : 'Their'} full posted history.`
            : 'Your full posted history.'
        }
        right={counterCount > 0 ? <CounterBadge count={counterCount} /> : undefined}
      />


      <div style={{ padding: '0 20px' }}>
      {!isLoading && rounds.length > 0 && (
        <FilterChips
          filter={filter}
          onChange={handleSetFilter}
          totalCount={rounds.length}
          counterCount={counterCount}
          courseNames={courseNames}
        />
      )}

      {isLoading ? (
        <SkeletonStack />
      ) : rounds.length === 0 ? (
        <EmptyState viewMode={viewMode} ownerFirstName={ownerFirstName} />
      ) : visibleRounds.length === 0 ? (
        <FilteredEmptyState />
      ) : (
        <>
          {grouped.map(({ month, rounds: monthRounds }) => (
            <div key={month} style={{ marginTop: 16 }}>
              <MonthDivider month={month} count={monthRounds.length} />
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {monthRounds.map((round) => (
                  <FeedCard
                    key={round.id}
                    round={round}
                    onTap={() => setOpenScoreId(round.id)}
                  />
                ))}
              </div>
            </div>
          ))}


          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '12px 16px',
                background: T.ink04,
                border: `1px solid ${T.hairline}`,
                borderRadius: 12,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                color: T.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span>Load older rounds</span>
              <span style={{ color: T.inkMute, fontWeight: 600 }}>
                · {filteredRounds.length - displayedCount} more
              </span>
              <ChevronDown size={14} strokeWidth={2.5} />
            </button>
          )}
        </>
      )}
      </div>

      <RoundDetailSheet
        scoreId={openScoreId}
        open={!!openScoreId}
        onClose={() => setOpenScoreId(null)}
        handicapDelta={openDelta}
      />
    </section>
  );
};

// ─── Counter badge (right slot) ─────────────────────────────────────
const CounterBadge: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ textAlign: 'right' }}>
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        color: T.inkFaded,
        marginBottom: 4,
      }}
    >
      OF WHICH
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 13,
        fontWeight: 700,
        color: T.ink,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: 'var(--hcp-amber)',
        }}
      />
      {count} {count === 1 ? 'counter' : 'counters'}
    </div>
  </div>
);

// ─── Filter chips ───────────────────────────────────────────────────
interface FilterChipsProps {
  filter: FilterKey;
  onChange: (next: FilterKey) => void;
  totalCount: number;
  counterCount: number;
  courseNames: { name: string; count: number }[];
}

const FilterChips: React.FC<FilterChipsProps> = ({
  filter,
  onChange,
  totalCount,
  counterCount,
  courseNames,
}) => (
  <div
    style={{
      marginTop: 14,
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      paddingBottom: 2,
    }}
  >
    <style>{`.rrc-chips::-webkit-scrollbar{display:none}`}</style>
    <FilterChip
      label="All rounds"
      count={totalCount}
      active={filter === 'all'}
      onClick={() => onChange('all')}
    />
    {counterCount > 0 && (
      <FilterChip
        label="Counters"
        count={counterCount}
        active={filter === 'counters'}
        onClick={() => onChange('counters')}
      />
    )}
    {courseNames.length >= 2 &&
      courseNames.slice(0, 4).map((c) => (
        <FilterChip
          key={c.name}
          label={shortenCourseName(c.name)}
          count={c.count}
          active={filter === c.name}
          onClick={() => onChange(c.name)}
        />
      ))}
  </div>
);

const FilterChip: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 12px',
      borderRadius: 999,
      border: 'none',
      background: active ? T.ink : T.ink04,
      color: active ? 'var(--hcp-bg-1)' : T.ink,
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '-0.005em',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      maxWidth: 200,
    }}
  >
    <span
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        opacity: active ? 0.7 : 0.5,
      }}
    >
      {count}
    </span>
  </button>
);

// ─── Month divider ──────────────────────────────────────────────────
const MonthDivider: React.FC<{ month: string; count: number }> = ({
  month,
  count,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.16em',
        color: T.inkMute,
        textTransform: 'uppercase',
      }}
    >
      {month}
    </span>
    <span
      style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(to right, ${T.hairline}, transparent)`,
      }}
    />
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: T.inkFaded,
      }}
    >
      {count} {count === 1 ? 'round' : 'rounds'}
    </span>
  </div>
);


// ─── Feed card ──────────────────────────────────────────────────────
interface FeedCardProps {
  round: RoundWithDelta;
  onTap: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ round, onTap }) => {
  const courseName = round.course?.name ?? 'Unknown course';
  const deltaInfo = fmtHcpDelta(round.handicap_delta);
  const isCounter = round.is_counter;

  const d = new Date(round.play_date);
  const dayOfMonth = d.getDate();
  const weekday = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];

  return (
    <button
      type="button"
      onClick={onTap}
      data-feedrow="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        padding: '11px 13px',
        background: T.cardBg,
        border: '1px solid var(--hcp-line)',
        borderRadius: 14,
        textAlign: 'left',
        fontFamily: FONT,
        cursor: 'pointer',
      }}
    >
      {/* Score-first hero tile */}
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCounter ? 'rgba(5,150,105,0.10)' : 'var(--hcp-bg-2)',
          border: isCounter ? '1px solid rgba(5,150,105,0.30)' : '1px solid transparent',
        }}
      >
        <span
          style={{
            fontSize: 21,
            fontWeight: 800,
            color: isCounter ? 'var(--hcp-good-deep)' : T.ink,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {round.adjusted_gross ?? '\u2014'}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: isCounter ? 'var(--hcp-good-deep)' : T.inkFaded,
            marginTop: 2,
          }}
        >
          GROSS
        </span>
      </div>

      {/* Course + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: T.ink,
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.15,
          }}
        >
          {courseName}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: T.inkMute,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          <span>{weekday} {dayOfMonth}</span>
          {isCounter && (
            <>
              <span aria-hidden style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: 'var(--hcp-t-30)' }} />
              <span style={{ color: 'var(--hcp-good-deep)', fontWeight: 700 }}>counts</span>
            </>
          )}
          {deltaInfo && (
            <>
              <span aria-hidden style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: 'var(--hcp-t-30)' }} />
              <span style={{ color: deltaInfo.color, fontWeight: 700, letterSpacing: '0.02em', textShadow: deltaInfo.glow }}>
                HCP {deltaInfo.sign} {deltaInfo.value}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Differential pill */}
      <span
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 800,
          color: diffColor(round.handicap_differential),
          background:
            round.handicap_differential != null && round.handicap_differential < 0
              ? 'rgba(5,150,105,0.10)'
              : 'rgba(220,38,38,0.10)',
          fontVariantNumeric: 'tabular-nums',
          padding: '6px 10px',
          borderRadius: 999,
          letterSpacing: '-0.01em',
        }}
      >
        {fmtDiff(round.handicap_differential)}
      </span>
    </button>
  );
};

// ─── Skeleton ───────────────────────────────────────────────────────
const SkeletonStack: React.FC = () => (
  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 72,
          borderRadius: 12,
          background: T.ink04,
          border: `1px solid ${T.hairline}`,
        }}
      />
    ))}
  </div>
);

// ─── Empty states ───────────────────────────────────────────────────
const EmptyState: React.FC<{ viewMode?: 'owner' | 'friend'; ownerFirstName?: string | null }> = ({
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const isFriend = viewMode === 'friend';
  const body = isFriend
    ? `${ownerFirstName ? `${ownerFirstName}'s` : 'Their'} rounds will appear here once they sync from England Golf.`
    : 'Your rounds will appear here as soon as they sync from your handicap provider.';
  return (
    <div
      style={{
        marginTop: 24,
        padding: '28px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 6 }}>
        No rounds yet
      </div>
      <div style={{ fontSize: 12, color: T.inkMute, lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  );
};

const FilteredEmptyState: React.FC = () => (
  <div
    style={{
      marginTop: 20,
      padding: '20px 16px',
      textAlign: 'center',
      fontSize: 12,
      color: T.inkMute,
    }}
  >
    No rounds match this filter.
  </div>
);

export default RecentRoundsCard;
