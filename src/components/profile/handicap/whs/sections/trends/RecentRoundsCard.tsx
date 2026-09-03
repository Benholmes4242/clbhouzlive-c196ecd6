import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { formatMonthYearLongGB } from '@/i18n/format';

import { useAllScores, useHandicapTrend } from '@/lib/whs/hooks';
import { computeRoundDeltas, type RoundWithDelta } from './computeRoundDeltas';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
// DARK_ROW_TITLE is the ONE definition shared with Records / Your courses.
import { DarkSectionHeader, DARK_ROW_TITLE } from '../_shared/darkAtoms';
import { Skeleton } from '@/components/ui/skeleton';



interface Props {
  connectionId: string;
  /** Profile owner - threaded to RoundDetailSheet so the card can name and own the round. */
  userId?: string | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
  /**
   * 'section' keeps the section header and top margin (legacy in-page use).
   * 'sheet' suppresses BOTH so the list can be hosted inside
   * RoundsArchiveSheet - the chips and month groups are untouched either way.
   */
  variant?: 'section' | 'sheet';
}


// This palette only resolves inside a `.hcp-dark` ancestor - any host that
// portals this component (e.g. a BottomSheet) MUST re-apply className="hcp-dark".
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
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const INITIAL_COUNT = 30;
const LOAD_MORE_COUNT = 15;

// ─── Format helpers ─────────────────────────────────────────────────
// Absent renders NOTHING - the column keeps its width via the label beneath.
const fmtDiff = (d: number | null | undefined): string => {
  if (d === null || d === undefined) return '';
  if (d > 0) return `+${d.toFixed(1)}`;
  if (d < 0) return `\u2212${Math.abs(d).toFixed(1)}`;
  return '0.0';
};

// The differential is a signed, ARROWLESS figure - a score, not a movement.
// It renders in ink. The only coloured thing on a row is the HCP arrow.


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
    color: 'var(--hcp-t-60)',
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
    return formatMonthYearLongGB(iso);
  } catch {
    return iso;
  }
};

type FilterKey = 'all' | 'counters' | string;

export const RecentRoundsCard: React.FC<Props> = ({ connectionId, userId = null, viewMode = 'owner', ownerFirstName = null, variant = 'section' }) => {
  const { t } = useTranslation('common');
  const { data: allRounds, isLoading } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [displayedCount, setDisplayedCount] = useState<number>(INITIAL_COUNT);

  const rowLabels = useMemo(
    () => ({
      gross: t('handicap.form.archive.gross'),
      playedTo: t('handicap.form.archive.playedTo'),
    }),
    [t],
  );


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

  const inSheet = variant === 'sheet';

  return (
    <section style={{ marginTop: inSheet ? 0 : 32, fontFamily: FONT }}>
      <style>{`
        .rr-last-row > button[data-feedrow="true"] { border-bottom: none; }
      `}</style>
      {!inSheet && (
        <DarkSectionHeader
          eyebrow="RECENT ROUNDS"
          title={`${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'} tracked`}
          sub={
            viewMode === 'friend'
              ? `${ownerFirstName ? `${ownerFirstName}'s` : 'Their'} full posted history.`
              : 'Your full posted history.'
          }
        />
      )}



      <div style={{ padding: inSheet ? 0 : '0 16px' }}>
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
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {monthRounds.map((round) => (
                  <FeedCard
                    key={round.id}
                    round={round}
                    labels={rowLabels}
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
        connectionId={connectionId}
        profileUserId={userId}
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
        fontSize: 11,
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
      marginTop: 12,
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
      cursor: 'pointer',
      maxWidth: 190,
      overflow: 'hidden',
    }}
  >
    {/* A chip may clip at 190; it must never ellipsise at 160. */}
    <span
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums lining-nums',
        opacity: active ? 0.7 : 0.5,
      }}
    >
      {count}
    </span>
  </button>
);

// ─── Month header ───────────────────────────────────────────────────
// Label left, count right, nothing between.
const MonthDivider: React.FC<{ month: string; count: number }> = ({
  month,
  count,
}) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: T.inkMute,
        textTransform: 'uppercase',
      }}
    >
      {month}
    </span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: T.inkFaded,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {count} {count === 1 ? 'round' : 'rounds'}
    </span>
  </div>
);



// ─── Feed row ───────────────────────────────────────────────────────
// A row is three columns and nothing else: a 42px right-aligned GROSS
// column, the course and its meta, and a 52px right-aligned PLAYED TO
// column. No border, no tile, no capsule - the two figure columns must
// align down the whole archive, which is the only thing an archive is for.
interface FeedCardProps {
  round: RoundWithDelta;
  onTap: () => void;
  labels: { gross: string; playedTo: string };
}

const FIGURE_LABEL: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: T.inkFaded,
  marginTop: 4,
  whiteSpace: 'nowrap',
};

const FeedCard: React.FC<FeedCardProps> = ({ round, onTap, labels }) => {
  const courseName = round.course?.name ?? 'Unknown course';
  const deltaInfo = fmtHcpDelta(round.handicap_delta);
  const diffText = fmtDiff(round.handicap_differential);

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
        alignItems: 'flex-start',
        gap: 13,
        width: '100%',
        padding: '13px 0',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        fontFamily: FONT,
        cursor: 'pointer',
      }}
    >
      {/* Gross - a figure, not a tile. No colour when the round counts. */}
      <div style={{ width: 42, flexShrink: 0, textAlign: 'right' }}>
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: '-0.045em',
            color: T.ink,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums lining-nums',
            minHeight: 21,
          }}
        >
          {round.adjusted_gross ?? ''}
        </div>
        <div style={FIGURE_LABEL}>{labels.gross}</div>
      </div>

      {/* Course + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>
          {courseName}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: T.inkMute,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
            lineHeight: 1.2,
            marginTop: 3,
          }}
        >
          <span>{weekday} {dayOfMonth}</span>
          {deltaInfo && (
            <>
              <span aria-hidden style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: 'var(--hcp-t-30)' }} />
              <span style={{ color: deltaInfo.color, fontWeight: 700, letterSpacing: '0.02em' }}>
                HCP {deltaInfo.sign} {deltaInfo.value}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Played to - a figure in ink. No pill, no tint, no green. */}
      <div style={{ width: 70, flexShrink: 0, textAlign: 'right' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: T.ink,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums lining-nums',
            minHeight: 15,
          }}
        >
          {diffText}
        </div>
        <div style={FIGURE_LABEL}>{labels.playedTo}</div>
      </div>
    </button>
  );
};


// ─── Skeleton ───────────────────────────────────────────────────────
// Shape follows the new row: no border, no card - a flat 46px band.
const SkeletonStack: React.FC = () => (
  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column' }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{ padding: '13px 0' }}>
        <Skeleton variant="dark" style={{ height: 34, borderRadius: 8 }} />
      </div>
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
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
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
