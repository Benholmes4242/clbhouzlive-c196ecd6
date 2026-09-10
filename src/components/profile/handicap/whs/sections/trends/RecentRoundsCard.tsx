import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { formatMonthYearLongGB } from '@/i18n/format';

import { useAllScores, useHandicapTrend } from '@/lib/whs/hooks';
import { computeRoundDeltas, type RoundWithDelta } from './computeRoundDeltas';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
// DARK_ROW_TITLE is the ONE definition shared with Records / Your courses.
import { DarkSectionHeader, DARK_ROW_TITLE } from '../_shared/darkAtoms';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';



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

// ONE page size for both the observer and the fallback button.
const INITIAL_COUNT = 50;
const LOAD_MORE_COUNT = 50;

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

/**
 * The filter is TWO states plus one course, never a scroller of courses.
 * A course is held by ID: two WHS course records can share a name, and
 * grouping on the name merged them into one chip and one count.
 */
type Filter =
  | { kind: 'all' }
  | { kind: 'counters' }
  | { kind: 'course'; id: string; name: string };

export const RecentRoundsCard: React.FC<Props> = ({ connectionId, userId = null, viewMode = 'owner', ownerFirstName = null, variant = 'section' }) => {
  const { t } = useTranslation('common');
  const { data: allRounds, isLoading } = useAllScores(connectionId);
  const { data: trend } = useHandicapTrend(connectionId);
  const [openScoreId, setOpenScoreId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState<number>(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rowLabels = useMemo(
    () => ({
      gross: t('handicap.form.archive.gross'),
      playedTo: t('handicap.form.archive.playedTo'),
      counts: t('handicap.form.archive.counts'),
      hcpHeld: t('handicap.form.archive.hcpHeld'),
      nineHoles: t('handicap.form.archive.nineHoles'),
    }),
    [t],
  );


  const rounds = useMemo(
    () => (allRounds ? computeRoundDeltas(allRounds, trend?.current ?? null) : []),
    [allRounds, trend?.current],
  );



  /** Every course the member has played, by ID, count descending. */
  const courses = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; count: number }>();
    for (const r of rounds) {
      const id = r.course_id;
      if (!id) continue;
      const existing = byId.get(id);
      if (existing) existing.count += 1;
      else byId.set(id, { id, name: r.course?.name ?? 'Unknown course', count: 1 });
    }
    return Array.from(byId.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [rounds]);

  const filteredRounds = useMemo(() => {
    if (filter.kind === 'all') return rounds;
    if (filter.kind === 'counters') return rounds.filter((r) => r.is_counter);
    return rounds.filter((r) => r.course_id === filter.id);
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

  const handleLoadMore = useCallback(() => setDisplayedCount((n) => n + LOAD_MORE_COUNT), []);

  const handleSetFilter = (next: Filter) => {
    setFilter(next);
    setDisplayedCount(INITIAL_COUNT);
  };

  // Auto-advance as the member approaches the end. The button below stays as
  // the fallback for environments where the observer never fires.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) handleLoadMore();
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, handleLoadMore, visibleRounds.length]);

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
          onOpenPicker={() => setPickerOpen(true)}
          anyCourseLabel={t('handicap.form.archive.anyCourse')}
          allLabel={t('handicap.form.archive.allRounds')}
          countersLabel={t('handicap.form.archive.counters')}
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


          {/* Observer target: the next page loads before the list runs out. */}
          {hasMore && <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />}

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

      <CoursePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        courses={courses}
        selectedId={filter.kind === 'course' ? filter.id : null}
        onSelect={(c) => {
          handleSetFilter({ kind: 'course', id: c.id, name: c.name });
          setPickerOpen(false);
        }}
        title={t('handicap.form.archive.pickCourse')}
      />

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

// ─── Counter mark (row) ─────────────────────────────────────────────
// This was an unrendered "OF WHICH n counters" right-slot summary. It is now
// the ROW mark the brief asks for: only a counter carries it, and only a
// marked row can ever carry an HCP figure beside it.
const CounterBadge: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: T.ink,
    }}
  >
    <span
      aria-hidden
      style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--hcp-amber)' }}
    />
    {label}
  </span>
);

// ─── Filter chips ───────────────────────────────────────────────────
// TWO state chips, always visible, plus ONE course chip that opens a picker.
// There is no horizontal scroller: a control whose remaining options are
// invisible is worse than a control with fewer options. The dead
// `.rrc-chips::-webkit-scrollbar` rule went with the scroller.
interface FilterChipsProps {
  filter: Filter;
  onChange: (next: Filter) => void;
  totalCount: number;
  counterCount: number;
  onOpenPicker: () => void;
  anyCourseLabel: string;
  allLabel: string;
  countersLabel: string;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  filter,
  onChange,
  totalCount,
  counterCount,
  onOpenPicker,
  anyCourseLabel,
  allLabel,
  countersLabel,
}) => (
  <div
    style={{
      marginTop: 12,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      paddingBottom: 2,
    }}
  >
    <FilterChip
      label={allLabel}
      count={totalCount}
      active={filter.kind === 'all'}
      onClick={() => onChange({ kind: 'all' })}
    />
    {counterCount > 0 && (
      <FilterChip
        label={countersLabel}
        count={counterCount}
        active={filter.kind === 'counters'}
        onClick={() => onChange({ kind: 'counters' })}
      />
    )}
    <FilterChip
      label={filter.kind === 'course' ? shortenCourseName(filter.name) : anyCourseLabel}
      active={filter.kind === 'course'}
      onClick={onOpenPicker}
      trailingChevron
    />
  </div>
);

const FilterChip: React.FC<{
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  trailingChevron?: boolean;
}> = ({ label, count, active, onClick, trailingChevron = false }) => (
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
    {count !== undefined && (
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
    )}
    {trailingChevron && <ChevronDown size={13} strokeWidth={2.5} style={{ opacity: active ? 0.8 : 0.55 }} />}
  </button>
);

// ─── Course picker ──────────────────────────────────────────────────
// EVERY course the member has played, count descending. One row per WHS
// course record, keyed on the id, so two records sharing a name stay two rows.
const CoursePickerSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  courses: { id: string; name: string; count: number }[];
  selectedId: string | null;
  onSelect: (c: { id: string; name: string }) => void;
  title: string;
}> = ({ open, onClose, courses, selectedId, onSelect, title }) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    variant="dark"
    surfaceColor="var(--hcp-bg-1)"
    className="hcp-dark"
    zIndexBase={1500}
    style={{
      height: 'auto',
      maxHeight: '75dvh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: FONT,
    }}
  >
    <div style={{ padding: '4px 16px 8px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: T.inkMute,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.inkFaded, marginTop: 3, fontVariantNumeric: 'tabular-nums lining-nums' }}>
        {courses.length} {courses.length === 1 ? 'course' : 'courses'}
      </div>
    </div>
    <div style={{ overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch' }}>
      {courses.map((c, i) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              width: '100%',
              padding: '13px 0',
              background: 'transparent',
              border: 'none',
              borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
              textAlign: 'left',
              fontFamily: FONT,
              cursor: 'pointer',
            }}
          >
            <span style={{ ...DARK_ROW_TITLE, minWidth: 0, overflowWrap: 'anywhere', fontWeight: active ? 700 : 600 }}>
              {c.name}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 700,
                color: active ? T.ink : T.inkMute,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {c.count}
            </span>
          </button>
        );
      })}
    </div>
  </BottomSheet>
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
  labels: { gross: string; playedTo: string; counts: string; hcpHeld: string; nineHoles: string };
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
  /**
   * THREE STATES, THREE RENDERINGS. Only a counter can move the index, so only
   * a counter carries a mark: COUNTS alone, COUNTS + HCP arrow when the index
   * moved, COUNTS + "HCP held" when it stayed inside the 0.05 dead band. A
   * non-counter carries nothing at all, so the blank is explained rather than
   * left to be interpreted.
   */
  const isCounter = !!round.is_counter;
  const heldFlat = isCounter && !deltaInfo && round.handicap_delta !== null;
  // Nine holes carries a mark on the DATE, not on a figure: gross scores stack
  // directly on one another here. PLAYED TO is already normalised to 18.
  const isNine = round.is_nine_hole === true || round.total_holes === 9;

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
