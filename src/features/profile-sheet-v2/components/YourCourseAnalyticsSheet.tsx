/**
 * YourCourseAnalyticsSheet
 *
 * Course analytics entry point sheet, opened from the profile sheet.
 * List of courses the member has imported rounds at (gam_user_courses RPC),
 * most-rounds first. Search field above the list uses the shared
 * useCourseSearch hook so members can jump to a course they have no rounds at.
 *
 * The figure on each row is the member's OWN average to par at that course.
 * It carries no tone: it is a fact about their play, not a claim about the
 * course. The list is sorted by last played, most recent first.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import {
  A,
  CAPTION,
  NUM,
  RAMP,
  SANS,
  StatRow,
  Action,
} from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS, KICKER as KICKER_METRICS, TITLE as TITLE_METRICS, FIGS } from '@/lib/tokens/type';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatMonthYearShortGB, formatDayMonthYearShortGB } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';

/** Canonical metrics from the shared module; this sheet keeps its palette. */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };
const KICKER: React.CSSProperties = { ...KICKER_METRICS, color: A.INK };
const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };

const CHEVRON = '\u203A';
const DOT = '\u00B7';


interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  /** True when we know user has a live WHS connection. */
  synced: boolean;
}

/** Format a signed number to N decimal places: "+1.2", "-0.4", "0.0".
 *  Rounds FIRST and branches on the rounded value, so -0.04 renders "0.0"
 *  and never "-0.0". */
function fmtSigned(n: number, digits: number): string {
  const rounded = Number(n.toFixed(digits));
  const abs = Math.abs(rounded).toFixed(digits);
  if (rounded > 0) return `+${abs}`;
  if (rounded < 0) return `-${abs}`;
  return abs; // exact zero: no sign
}

/**
 * Rare-outcome rule (moved out of the deleted ScoringPill): a bucket with a
 * non-zero COUNT that would round to 0% renders one decimal place, floored at
 * 0.1%, so a single eagle across 1,800 holes reads "0.1%" and not "0%".
 */
function fmtBucketPct(pct: number, pctExact: number, count: number): string {
  if (count > 0 && pct === 0) {
    const oneDec = Math.max(0.1, Number(pctExact.toFixed(1)));
    return `${oneDec.toFixed(1)}%`;
  }
  return `${pct}%`;
}

/**
 * These rows EXPAND, so each one owns a card rather than sharing one panel:
 * an open row's block has to visibly belong to it. Open state raises the
 * border to heavier ink - no colour, no shadow, no scale.
 */
const CARD = (open = false): React.CSSProperties => ({
  background: '#FFFFFF',
  border: `1px solid ${open ? 'rgba(14,18,22,0.16)' : A.BORDER}`,
  borderRadius: 14,
  overflow: 'hidden',
});

/** Card list container: the 10px gap replaces per-card margin, so the last
 *  card carries no trailing space. */
const CARD_LIST: React.CSSProperties = {
  margin: '0 20px',
  display: 'grid',
  gap: 10,
};


function Row({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div style={CARD()}>

    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.99]"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 20px',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: SANS,
      }}
    >
      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13.5,
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontWeight: 500, fontSize: 11.5, color: A.DIM, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      <span style={{ color: A.DIM, fontSize: 16 }}>{CHEVRON}</span>
    </button>
    </div>
  );
}

/**
 * Down caret for the rows that EXPAND IN PLACE. Deliberately NOT the right
 * chevron used by the rows that navigate: two behaviours, two glyphs.
 */
function ExpandCaret({ open }: { open: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      style={{
        display: 'block',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 160ms ease',
      }}
    >
      <path
        d="M3.5 5.5 L7 9 L10.5 5.5"
        fill="none"
        stroke={A.DIM}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function hasScoringData(course: UserAnalyticsCourse): boolean {
  // Gate on COUNTS, not percentages: a course with rounds but no hole-level
  // enrichment has no distribution at all, which is different from a
  // distribution of zeros.
  return (
    course.eagles_plus_count !== null &&
    course.birdies_count !== null &&
    course.pars_count !== null &&
    course.bogeys_plus_count !== null
  );
}

/**
 * Row for the "my courses" list.
 *
 * TWO DELIBERATE BEHAVIOURS, do not unify them:
 *   - WITH distribution data: the row is a button that EXPANDS in place
 *     (like HoleRow) and the expanded block ends with the quiet Action that
 *     opens the course.
 *   - WITHOUT distribution data: there is nothing to expand, so the row keeps
 *     the original tap-to-navigate behaviour and keeps its chevron. Removing
 *     that would strand those courses with no route at all.
 */
function AnalyticsCourseRow({
  course,
  expanded,
  onToggle,
  onOpen,
}: {
  course: UserAnalyticsCourse;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (from: 'expanded' | 'row') => void;
}) {
  const { t } = useTranslation('courses');
  const hasAvg = course.avg_to_par !== null && course.avg_to_par !== undefined;
  const avgVal = hasAvg ? (course.avg_to_par as number) : null;
  const hasScoring = hasScoringData(course);

  const meta = [
    t('yourCourses.roundsCount', { count: course.rounds_count }),
    course.last_played
      ? t('yourCourses.lastPlayedMeta', { date: formatDayMonthYearShortGB(course.last_played) })
      : null,
  ]
    .filter(Boolean)
    .join(` ${DOT} `);


  const segs = hasScoring
    ? [
        {
          key: 'eagles',
          bg: RAMP.birdie,
          label: t('yourCourses.pillEaglesLong'),
          pct: course.eagles_plus_pct as number,
          pctExact: course.eagles_plus_pct_exact as number,
          count: course.eagles_plus_count as number,
        },
        {
          key: 'birdies',
          bg: RAMP.birdie,
          label: t('yourCourses.pillBirdiesLong'),
          pct: course.birdies_pct as number,
          pctExact: course.birdies_pct_exact as number,
          count: course.birdies_count as number,
        },
        {
          key: 'pars',
          bg: RAMP.par,
          label: t('yourCourses.pillParsLong'),
          pct: course.pars_pct as number,
          pctExact: course.pars_pct_exact as number,
          count: course.pars_count as number,
        },
        {
          key: 'bogeys',
          bg: RAMP.bogey,
          label: t('yourCourses.pillBogeysLong'),
          pct: course.bogeys_plus_pct as number,
          pctExact: course.bogeys_plus_pct_exact as number,
          count: course.bogeys_plus_count as number,
        },
      ]
    : [];
  const segTotal = segs.reduce((s, x) => s + (x.pct ?? 0), 0) || 1;

  const body = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasScoring ? '1fr 16px 52px 14px' : '1fr 16px 52px',
        gap: '0 10px',
        alignItems: 'end',
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13.5,
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course.course_name}
        </div>
        <div
          style={{
            ...LABEL,
            // The shared LABEL tracking (0.13em) is tuned for two- or three-word
            // captions. This line runs to ~24 characters, where that tracking costs
            // more width than the words do. Relaxed HERE ONLY.
            letterSpacing: '0.06em',
            color: A.MUTE,
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {meta}
        </div>
      </div>

      {!hasScoring && (
        <span
          style={{
            color: A.DIM,
            fontSize: 16,
            lineHeight: 1.2,
            alignSelf: 'start',
            gridColumn: avgVal != null ? 2 : 3,
          }}
        >
          {CHEVRON}
        </span>
      )}

      {avgVal != null && (
        <div style={{ width: 52, textAlign: 'right', minWidth: 0, gridColumn: 3 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: A.INK }}>
            {fmtSigned(avgVal, 1)}
          </div>
          <div
            style={{
              ...LABEL,
              letterSpacing: '0.06em',
              color: A.MUTE,
              marginTop: 3,
            }}
          >
            {t('yourCourses.avgToPar')}
          </div>
        </div>
      )}

      {hasScoring && (
        <span
          style={{
            gridColumn: 4,
            alignSelf: 'center',
            // The grid's 10px column gap plus this -2px lands the caret 8px
            // from the AVG block, per spec.
            marginLeft: -2,
          }}
        >
          <ExpandCaret open={expanded} />
        </span>
      )}

      {hasScoring && (
        <span
          style={{
            gridColumn: '1 / -1',
            marginTop: 9,
            height: 5,
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            background: A.TRACK,
          }}
        >
          {segs.map((s) => (
            <i key={s.key} style={{ width: `${((s.pct ?? 0) / segTotal) * 100}%`, background: s.bg }} />
          ))}
        </span>
      )}
    </div>
  );

  const shell: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    background: 'transparent',
    border: 0,
    textAlign: 'left',
    fontFamily: SANS,
  };

  // No distribution: same card, right chevron, tap-to-navigate.
  if (!hasScoring) {
    return (
      <div style={CARD()}>
        <button
          type="button"
          onClick={() => onOpen('row')}
          className="active:scale-[0.99]"
          style={{ ...shell, cursor: 'pointer' }}
        >
          {body}
        </button>
      </div>
    );
  }

  return (
    <div style={CARD(expanded)}>

      <button type="button" onClick={onToggle} aria-expanded={expanded} style={{ ...shell, cursor: 'pointer' }}>
        {body}
      </button>
      {expanded && (
        <div style={{ padding: '0 20px 14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {segs.map((s) => (
              <div key={s.key} style={{ textAlign: 'center', minWidth: 0 }}>
                {/*
                  EAGLES+ folds into the BIRDIE band on the bar, so a solid
                  swatch here would repeat the birdie colour on two labels.
                  It reads instead as a hairline rule: part of that band, not
                  a band of its own.
                */}
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: s.key === 'eagles' ? 'transparent' : s.bg,
                    borderTop: s.key === 'eagles' ? `1px solid ${A.HAIRLINE}` : undefined,
                    marginBottom: 6,
                  }}
                />
                <div style={LABEL}>{s.label}</div>
                <div style={{ ...NUM, fontSize: 15, color: A.INK, marginTop: 2 }}>
                  {fmtBucketPct(s.pct ?? 0, s.pctExact ?? 0, s.count ?? 0)}
                </div>
              </div>
            ))}
          </div>
          <StatRow
            size={16}
            items={[
              { label: t('yourCourses.colRounds'), value: course.rounds_count },
              ...(avgVal != null
                ? // YOUR AVG carries no colour: it is the member's own score.

                  [{ label: t('yourCourses.colYourAvg'), value: fmtSigned(avgVal, 1) }]
                : []),
              ...(course.last_played
                ? [
                    {
                      label: t('yourCourses.colLastPlayed'),
                      value: formatMonthYearShortGB(course.last_played),
                    },
                  ]
                : []),
            ]}
          />
          <Action
            label={t('yourCourses.openAnalytics')}
            onClick={() => onOpen('expanded')}
            style={{ marginTop: 10 }}
          />
        </div>
      )}
    </div>
  );
}

export default function YourCourseAnalyticsSheet({ open, onClose, onNavigate, synced }: Props) {
  const { t } = useTranslation('courses');
  const [q, setQ] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: myCourses = [], isLoading } = useUserAnalyticsCourses({ enabled: open });
  const { data: searchResults = [], isFetching: searching } = useCourseSearch(q);

  const showBuildingState = synced && !isLoading && myCourses.length === 0;
  const showList = myCourses.length > 0;
  const showSearchField = showList; // per brief: search only when list non-empty
  const searchActive = q.trim().length >= 2;

  // Sorted CLIENT-SIDE, not in the RPC: gam_user_courses is shared with the
  // Phase C rail and the Phase E chip provider, which want most-played first.
  // Nulls last, ties broken on rounds so a same-day pair is stable.
  const listItems = useMemo<UserAnalyticsCourse[]>(() => {
    return [...myCourses].sort((a, b) => {
      const ta = a.last_played ? Date.parse(a.last_played) : null;
      const tb = b.last_played ? Date.parse(b.last_played) : null;
      if (ta == null && tb == null) return (b.rounds_count ?? 0) - (a.rounds_count ?? 0);
      if (ta == null) return 1;
      if (tb == null) return -1;
      if (tb !== ta) return tb - ta;
      return (b.rounds_count ?? 0) - (a.rounds_count ?? 0);
    });
  }, [myCourses]);

  /**
   * The member's own pooled average, used ONLY by the header sheetSub (it no
   * longer feeds the rows): shots over par per round, WEIGHTED by rounds.
   * A course with 103 rounds describes their game far better than one with 2,
   * and an unweighted mean would make small-sample courses look dramatic.
   * Consequence: the most-played course usually sits close to zero.
   *
   * Null when fewer than two courses have a non-null avg_to_par - a single
   * course cannot be compared with itself.
   */
  const baseline = useMemo<number | null>(() => {
    const rated = listItems.filter((c) => c.avg_to_par !== null && c.avg_to_par !== undefined);
    if (rated.length < 2) return null;
    let num = 0;
    let den = 0;
    for (const c of rated) {
      const w = c.rounds_count ?? 0;
      num += (c.avg_to_par as number) * w;
      den += w;
    }
    if (den <= 0) return null;
    return num / den;
  }, [listItems]);

  const totalRounds = useMemo(
    () => listItems.reduce((s, c) => s + (c.rounds_count ?? 0), 0),
    [listItems],
  );

  useEffect(() => {
    if (!open) setExpandedIds(new Set());
  }, [open]);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      viewedRef.current = false;
      return;
    }
    if (viewedRef.current || isLoading) return;
    viewedRef.current = true;
    analyticsEvents.track('course_analytics_sheet_viewed', {
      courses: listItems.length,
      rounds: totalRounds,
      has_baseline: baseline != null,
      with_distribution: listItems.filter(hasScoringData).length,
    });
  }, [open, isLoading, listItems, totalRounds, baseline]);

  // Debounced search telemetry. Never logs the query text.
  useEffect(() => {
    const query = q.trim();
    if (!open || query.length === 0) return;
    const id = setTimeout(() => {
      analyticsEvents.track('course_analytics_searched', {
        query_length: query.length,
        results: searchResults.length,
      });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  const go = useCallback(
    (courseId: string, from: 'expanded' | 'row') => {
      analyticsEvents.track('course_analytics_course_opened', { course_id: courseId, from });
      onClose();
      // Small delay so sheet close doesn't jank the route transition.
      setTimeout(() => onNavigate(`/courses/${courseId}?tab=holes`), 40);
    },
    [onClose, onNavigate],
  );

  const toggle = useCallback(
    (course: UserAnalyticsCourse) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(course.course_id)) {
          next.delete(course.course_id);
        } else {
          next.add(course.course_id);
          analyticsEvents.track('course_analytics_row_expanded', {
            course_id: course.course_id,
            rounds: course.rounds_count,
            
          });
        }
        return next;
      });
    },
    [],
  );

  const signedBaseline = baseline != null ? fmtSigned(baseline, 1) : null;
  const subLine =
    signedBaseline != null
      ? t('yourCourses.sheetSub', {
          courses: listItems.length,
          rounds: totalRounds,
          avg: signedBaseline,
        })
      : t('yourCourses.sheetSubNoAvg', { courses: listItems.length, rounds: totalRounds });

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="your-course-analytics-title"
      zIndexBase={10000}
      maxHeight="95dvh"
      // Make the sheet panel a flex column so we can pin the header and
      // scroll only the list. `overflow: hidden` keeps the rounded top
      // corners clipping the scroll region.
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        style={{
          fontFamily: SANS,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          // Figures inherit tabular-nums lining-nums from here down, so the bucket
          // percentage column stacks its decimals and % signs.
          ...FIGS,
        }}
      >
        {/* Fixed header (does NOT scroll) */}
        <div style={{ padding: '8px 20px 12px', flexShrink: 0 }}>
          <div style={KICKER}>{t('yourCourses.sheetEyebrow')}</div>
          <h2
            id="your-course-analytics-title"
            style={{
              margin: '4px 0 0',
              ...TITLE,
            }}
          >
            {t('yourCourses.sheetTitle')}
          </h2>
          {showList && <div style={{ ...LABEL, marginTop: 5 }}>{subLine}</div>}
        </div>

        {/* Fixed search field (only when we already have a list) */}
        {showSearchField && (
          <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: '#FFFFFF',
                border: `0.5px solid ${A.BORDER}`,
                borderRadius: 18,
                padding: '8px 13px',
              }}
            >
              <Search size={13} color={A.DIM} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('yourCourses.searchPlaceholder')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontFamily: SANS,
                  color: A.INK,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Scrollable region - flex:1 + minHeight:0 lets it shrink so
            overflowY actually engages. overscrollBehavior: contain stops
            scroll chaining into the profile sheet behind. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: '0 0 8px',
          }}
        >
          {/* Building state */}
          {showBuildingState && (
            <div style={{ padding: '4px 20px 20px' }}>
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${A.BORDER}`,
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: A.INK }}>
                  {t('yourCourses.buildingTitle')}
                </div>
                <div style={{ ...CAPTION, marginTop: 6 }}>{t('yourCourses.buildingBody')}</div>
              </div>
            </div>
          )}

          {/* Search results override list when active */}
          {searchActive ? (
            <div style={CARD_LIST}>
              {searching && searchResults.length === 0 ? (
                <div style={{ ...CARD(), padding: 16, ...CAPTION }}>
                  {t('yourCourses.searching')}
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ ...CARD(), padding: 16, ...CAPTION }}>
                  {t('yourCourses.noResults')}
                </div>
              ) : (
                searchResults.map((c) => (
                  <Row
                    key={c.id}
                    title={c.name}
                    subtitle={[c.region, c.country].filter(Boolean).join(` ${DOT} `) || undefined}
                    onClick={() => go(c.id, 'row')}
                  />
                ))
              )}
            </div>
          ) : showList ? (
            <>
              <div style={CARD_LIST}>
                {listItems.map((c) => (
                  <AnalyticsCourseRow
                    key={c.course_id}
                    course={c}
                    expanded={expandedIds.has(c.course_id)}
                    onToggle={() => toggle(c)}
                    onOpen={(from) => go(c.course_id, from)}
                  />
                ))}
              </div>


            </>
          ) : null}

          {/* Loading skeleton for first paint */}
          {isLoading && !showBuildingState && !showList && (
            <div style={CARD_LIST}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ ...CARD(), height: 52 }}>
                  <div
                    style={{
                      height: '100%',
                      background:
                        'linear-gradient(90deg, rgba(15,23,42,0.03), rgba(15,23,42,0.06), rgba(15,23,42,0.03))',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
