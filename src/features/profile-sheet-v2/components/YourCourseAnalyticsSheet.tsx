/**
 * YourCourseAnalyticsSheet
 *
 * Course analytics entry point sheet, opened from the profile sheet.
 * List of courses the member has imported rounds at (gam_user_courses RPC),
 * most-rounds first. THAT IS THE 35 (§D), not the 49 the profile's PLAYED figure
 * states: PLAYED counts `user_course_activity` — anything the member did at a
 * course, imported round or not. This list can only show a course a WHS round was
 * mapped to, so it is expected to be shorter, and the difference is not a gap. Search field above the list uses the shared
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
  SANS,
} from '@/features/courses/components/holes/analytical/tokens';
import { LABEL as LABEL_METRICS, FIGS } from '@/lib/tokens/type';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';
import { useMyRoundsByCourse, type CourseRoundPoint } from '@/hooks/gam/useMyRoundsByCourse';
import { RAMP_DIST } from '@/features/courses/components/holes/analytical/tokens';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import {
  figureLabel,
  fmtListDate,
  isEarlyData,
  pickTiles,
  sortCourses,
  type CourseSort,
} from '@/features/profile-sheet-v2/components/yourCoursesListRules';

import YourCourseOpenContent from './YourCourseOpenContent';
import { fmtSigned } from './yourCoursesOpenRules';

/** Canonical metrics from the shared module; this sheet keeps its palette. */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };

const CHEVRON = '\u203A';
const DOT = '\u00B7';

/**
 * THE DISTRIBUTION PALETTE. Four saturated tones, distinguished by HUE not by
 * opacity — a washed red next to the neutral grey reads as faded and was
 * rejected.
 *
 * EAGLES+ takes SC_FILL_GOLD (#FFD200), the scorecard's broadcast gold, NOT
 * the achievement gold and NOT an invented #D8A93C. See the report: the bucket
 * straddles the eagle/albatross line and gold is the rarity mark for the
 * bucket as a whole.
 */
/**
 * MICRO_BRIEF_TOPAR_LIGHT_ON_DARK_SURFACES — option C, the neutral ramp.
 *
 * The two _LIGHT values here were the light branch of a theme pair used
 * unconditionally on a #1B1E27 card: #0F172A (the former INK) was invisible.
 *
 * Bogeys+ does NOT take the over-par red, which is the obvious answer: two
 * reds side by side in one bar — one meaning under par, one over — is not
 * readable. On the round card position and the ring carry that distinction; in
 * a four-segment bar nothing does. So the tail runs as a neutral ramp: pars
 * 0.42, bogeys+ 0.66 — "further from par" left to right, with no fifth
 * meaning added to a palette where colour means under par, over par, or the
 * viewing member.
 */
const DIST = {
  eagles: RAMP_DIST.eagles,
  birdies: RAMP_DIST.birdie,
  pars: RAMP_DIST.par,
  /* BOGEYS+ IS BLUE, NOT A WHITE ALPHA (§5.3). The former neutral tail read as
     a faded par and made a four-segment bar a two-colour bar. The scorecard
     blue is a HUE, so it separates from par without adding a second red. */
  bogeys: RAMP_DIST.bogey,
} as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  /** True when we know user has a live WHS connection. */
  synced: boolean;
}

/**
 * These rows EXPAND, so each one owns a card rather than sharing one panel:
 * an open row's block has to visibly belong to it. Open state raises the
 * border to heavier ink - no colour, no shadow, no scale.
 *
 * The MECHANISM was right and stays: border weight only. The VALUE was not.
 * A.INK is #F8FAFC, so the open outline was brighter than the course name it
 * surrounded. 28% is the canonical focus/active border — the same step a
 * focused field takes two elements above this list. If it ever reads too weak,
 * the answer is lifting the CARD FILL a step, never brightening the ring.
 */
const CARD = (open = false): React.CSSProperties => ({
  background: A.PANEL,
  border: `1px solid ${open ? 'rgba(255,255,255,0.28)' : A.BORDER}`,

  borderRadius: 14,
  overflow: 'hidden',
});

/** Card list container: the 10px gap replaces per-card margin, so the last
 *  card carries no trailing space. */
const CARD_LIST: React.CSSProperties = {
  margin: '0 20px',
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 10,
};

/**
 * YC1 LIST CARD. The course rows own their shell: #17171B, the 8% hairline,
 * radius 18, and their own 10px top margin / 16px gutters (search result
 * rows keep the shared CARD above). Open state keeps the settled 28% ring.
 */
const COURSE_CARD = (open = false): React.CSSProperties => ({
  background: '#17171B',
  border: `1px solid ${open ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 18,
  overflow: 'hidden',
  margin: '10px 16px 0',
});

/** The inline "Early data" tag: never full width, sits after the meta text. */
const EARLY_TAG: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: A.MUTE,
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 999,
  padding: '1px 7px',
  marginLeft: 6,
  verticalAlign: 1,
};

/**
 * THE COLLAPSED LIST BAR (YC1 §5). Height 6, radius 9, four segments with
 * 2px gaps, widths from the EXACT percentages in the RAMP_DIST colours.
 * Eagles hold a 0.6% floor when their count is above zero and are hidden at
 * zero — empty buckets leave no hairline here.
 */
const ListBar: React.FC<{ segs: Seg[] }> = ({ segs }) => (
  <span
    className="yc1-list-bar"
    style={{ display: 'flex', height: 6, borderRadius: 9, overflow: 'hidden', gap: 2 }}
  >
    {segs.map((s) => {
      if ((s.count ?? 0) === 0) return null;
      const pct = s.pctExact ?? s.pct ?? 0;
      const width = s.key === 'eagles' ? Math.max(pct, 0.6) : pct;
      return (
        <i
          key={s.key}
          style={{ display: 'block', height: 6, width: `${width}%`, background: s.bg }}
        />
      );
    })}
  </span>
);


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
            fontSize: 14,
            color: A.INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontWeight: 500, fontSize: 12, color: A.DIM, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      <span style={{ color: A.DIM, fontSize: 16 }}>{CHEVRON}</span>
    </button>
    </div>
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

interface Seg {
  key: 'eagles' | 'birdies' | 'pars' | 'bogeys';
  bg: string;
  label: string;
  pct: number;
  pctExact: number;
  count: number;
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
  trend,
}: {
  course: UserAnalyticsCourse;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (from: 'expanded' | 'row') => void;
  /** The member's own rounds at this course, oldest first. */
  trend?: CourseRoundPoint[];
}) {

  const { t } = useTranslation('courses');
  const hasAvg = course.avg_to_par !== null && course.avg_to_par !== undefined;
  const avgVal = hasAvg ? (course.avg_to_par as number) : null;
  const hasScoring = hasScoringData(course);
  const trendPoints = trend ?? [];



  const meta = [
    t('yourCourses.roundsCount', { count: course.rounds_count }),
    course.last_played ? fmtListDate(course.last_played) : null,
  ]
    .filter(Boolean)
    .join(` ${DOT} `);


  const segs: Seg[] = hasScoring
    ? [
        {
          key: 'eagles',
          bg: DIST.eagles,
          label: t('yourCourses.pillEaglesLong'),
          pct: course.eagles_plus_pct as number,
          pctExact: course.eagles_plus_pct_exact as number,
          count: course.eagles_plus_count as number,
        },
        {
          key: 'birdies',
          bg: DIST.birdies,
          label: t('yourCourses.pillBirdiesLong'),
          pct: course.birdies_pct as number,
          pctExact: course.birdies_pct_exact as number,
          count: course.birdies_count as number,
        },
        {
          key: 'pars',
          bg: DIST.pars,
          label: t('yourCourses.pillParsLong'),
          pct: course.pars_pct as number,
          pctExact: course.pars_pct_exact as number,
          count: course.pars_count as number,
        },
        {
          key: 'bogeys',
          bg: DIST.bogeys,
          label: t('yourCourses.pillBogeysLong'),
          pct: course.bogeys_plus_pct as number,
          pctExact: course.bogeys_plus_pct_exact as number,
          count: course.bogeys_plus_count as number,
        },
      ]
    : [];


  const early = isEarlyData(course);
  const rounds = course.rounds_count ?? 0;
  const figLabel = figureLabel(rounds);

  /**
   * YC1 COLLAPSED CARD. Name (shortened) left, figure right, meta under the
   * name, bar under both. The figure mutes under 10 rounds and the meta
   * carries the inline "Early data" tag. Courses with no hole data keep
   * their tap-to-navigate chevron; expanding cards carry NO chevron.
   */
  const body = (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: A.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shortCourseName(course.course_name)}
          </div>
          <div style={{ fontSize: 12.5, color: A.MUTE, marginTop: 3 }}>
            {meta}
            {early && <span style={EARLY_TAG}>{t('yourCourses.earlyData')}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: '-0.02em',
              color: early ? A.MUTE : A.INK,
            }}
          >
            {avgVal != null ? fmtSigned(avgVal, 1) : <span style={{ color: A.DIM }}>–</span>}
          </div>
          {avgVal != null && (
            <div style={{ fontSize: 11, color: A.DIM, marginTop: 1 }}>
              {figLabel === 'a-round'
                ? t('yourCourses.figARound')
                : figLabel === 'one-round'
                  ? t('yourCourses.figOneRound')
                  : t('yourCourses.figNRounds', { count: rounds })}
            </div>
          )}
        </div>

        {!hasScoring && (
          <span
            style={{
              color: A.DIM,
              fontSize: 16,
              lineHeight: 1.2,
              alignSelf: 'center',
              flex: 'none',
            }}
          >
            {CHEVRON}
          </span>
        )}
      </div>

      {/* YC1 header and collapsed bar remain visible when the card opens. */}
      {hasScoring && (
        <span style={{ display: 'block', marginTop: 12 }}>
          <ListBar segs={segs} />
        </span>
      )}
    </div>
  );

  const shell: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: 0,
    textAlign: 'left',
    fontFamily: SANS,
  };

  // No distribution: same card, right chevron, tap-to-navigate.
  if (!hasScoring) {
    return (
      <div style={COURSE_CARD()}>
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
    <div style={COURSE_CARD(expanded)}>

      <button type="button" onClick={onToggle} aria-expanded={expanded} style={{ ...shell, cursor: 'pointer' }}>
        {body}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 14px' }}>
          <YourCourseOpenContent course={course} points={trendPoints} onOpen={() => onOpen('expanded')} />
        </div>
      )}
    </div>
  );
}

export default function YourCourseAnalyticsSheet({ open, onClose, onNavigate, synced }: Props) {
  const { t } = useTranslation('courses');
  const [q, setQ] = useState('');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  /** YC1 sort: Recent is the order the list has always used. */
  const [sort, setSort] = useState<CourseSort>('recent');
  /** Card elements by course id, so a tile tap can scroll its card into view. */
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // SETTLED IS NOT "NOT LOADING": this query is disabled until the sheet opens.
  const { data: myCourses = [], isLoading: fetching, isFetched } = useUserAnalyticsCourses({ enabled: open });
  const isLoading = !isFetched || fetching;
  const { data: searchResults = [], isFetching: searching } = useCourseSearch(q);
  // ONE batched read for every course's trend — not one query per row.
  const { data: roundsByCourse } = useMyRoundsByCourse({ enabled: open });


  // eslint-disable-next-line settled/no-not-loading-empty-check -- isLoading is derived as !isFetched || fetching above.
  const showBuildingState = synced && !isLoading && myCourses.length === 0;
  const showList = myCourses.length > 0;
  const showSearchField = showList; // per brief: search only when list non-empty
  const searchActive = q.trim().length >= 2;

  // Sorted CLIENT-SIDE, not in the RPC: gam_user_courses is shared with the
  // Phase C rail and the Phase E chip provider, which want most-played first.
  // The three YC1 orders live in yourCoursesListRules; Recent is the order
  // this list has always used (last played first, nulls last, ties on rounds).
  const listItems = useMemo<UserAnalyticsCourse[]>(
    () => sortCourses(myCourses, sort),
    [myCourses, sort],
  );

  /** YC1 header tiles: best/worst scoring among 10+-round courses. */
  const tiles = useMemo(() => pickTiles(myCourses), [myCourses]);

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

  /** YC1 sort chips: track the choice, never re-track the current one. */
  const chooseSort = useCallback((next: CourseSort) => {
    setSort((prev) => {
      if (prev !== next) analyticsEvents.track('course_analytics_sort', { sort: next });
      return next;
    });
  }, []);

  /** YC1 tile tap: expand that course's card and scroll it into view. */
  const focusCourse = useCallback((course: UserAnalyticsCourse) => {
    setExpandedIds((prev) => {
      if (prev.has(course.course_id)) return prev;
      const next = new Set(prev);
      next.add(course.course_id);
      analyticsEvents.track('course_analytics_row_expanded', {
        course_id: course.course_id,
        rounds: course.rounds_count,
      });
      return next;
    });
    // After the expand paints, bring the card into view.
    setTimeout(() => {
      cardRefs.current
        .get(course.course_id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  }, []);

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
      maxHeight="85dvh"
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
        {/* Fixed header (does NOT scroll): title, line, search, tiles, sort,
            legend — YC1 §§1-4. The kicker and the old uppercase stats line are
            gone; the counts line is sentence case. */}
        <div style={{ padding: '0 16px', flexShrink: 0 }}>
          <h2
            id="your-course-analytics-title"
            style={{
              margin: '6px 0 0',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: A.INK,
            }}
          >
            {t('yourCourses.sheetTitle')}
          </h2>
          {showList && (
            <div style={{ fontSize: 14, color: A.MUTE, marginTop: 4 }}>{subLine}</div>
          )}

          {/* Search: existing behaviour, YC1 paint — 44 high, radius 14,
              #1E1E23 with the 8% hairline, 15px text, white caret. */}
          {showSearchField && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 44,
                  background: '#1E1E23',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '0 13px',
                }}
              >
                <Search size={13} color={q ? 'rgba(255,255,255,0.62)' : A.DIM} />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('yourCourses.searchPlaceholder')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 15,
                    fontFamily: SANS,
                    color: 'rgba(255,255,255,0.96)',
                    caretColor: '#FFFFFF',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                  }}
                  className="cas-search-input"
                />
                <style>{`.cas-search-input::placeholder{color:rgba(255,255,255,0.38);}`}</style>
              </div>
            </div>
          )}

          {/* Tiles: where you score best / where it bites (10+ rounds only). */}
          {showList && tiles && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                gap: 8,
                marginTop: 14,
              }}
            >
              {(
                [
                  { label: t('yourCourses.tileBest'), course: tiles.best },
                  { label: t('yourCourses.tileBites'), course: tiles.bites },
                ] as const
              ).map(({ label, course }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => focusCourse(course)}
                  style={{
                    background: '#1E1E23',
                    border: 0,
                    borderRadius: 14,
                    padding: '11px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: SANS,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: A.DIM,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 15,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: A.INK,
                      marginTop: 5,
                    }}
                  >
                    {shortCourseName(course.course_name)}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      color: A.MUTE,
                      marginTop: 2,
                    }}
                  >
                    {t('yourCourses.tileLine', {
                      avg: fmtSigned(course.avg_to_par as number, 1),
                      rounds: course.rounds_count,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Sort chips: chosen is ink on canvas, unchosen a 14% hairline. */}
          {showList && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {(
                [
                  { id: 'recent', label: t('yourCourses.sortRecent') },
                  { id: 'most-played', label: t('yourCourses.sortMostPlayed') },
                  { id: 'best-for-you', label: t('yourCourses.sortBestForYou') },
                ] as const
              ).map((s) => {
                const on = sort === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => chooseSort(s.id)}
                    style={{
                      height: 32,
                      padding: '0 13px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: SANS,
                      cursor: 'pointer',
                      border: `1px solid ${on ? A.INK : 'rgba(255,255,255,0.14)'}`,
                      background: on ? A.INK : 'transparent',
                      color: on ? '#0B0B0D' : A.MUTE,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend: one line, the four RAMP_DIST buckets. */}
          {showList && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                margin: '12px 2px 0',
                fontSize: 11.5,
                color: A.MUTE,
              }}
            >
              {(
                [
                  [RAMP_DIST.eagles, t('yourCourses.legendEagles')],
                  [RAMP_DIST.birdie, t('yourCourses.legendBirdie')],
                  [RAMP_DIST.par, t('yourCourses.legendPar')],
                  [RAMP_DIST.bogey, t('yourCourses.legendBogey')],
                ] as const
              ).map(([color, label]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: color,
                      display: 'inline-block',
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

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
                  background: A.PANEL,
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
              {/* Course cards carry their own 10px top margin and 16px
                  gutters (YC1); the wrapper only registers refs so a tile tap
                  can scroll its card into view. */}
              <div>
                {listItems.map((c) => (
                  <div
                    key={c.course_id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(c.course_id, el);
                      else cardRefs.current.delete(c.course_id);
                    }}
                  >
                    <AnalyticsCourseRow
                      course={c}
                      expanded={expandedIds.has(c.course_id)}
                      onToggle={() => toggle(c)}
                      onOpen={(from) => go(c.course_id, from)}
                      trend={roundsByCourse?.get(c.course_id)}
                    />
                  </div>
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
                      background: A.TRACK,
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
