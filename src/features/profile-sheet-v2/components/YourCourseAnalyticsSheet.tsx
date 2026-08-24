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
import { useMyRoundsByCourse, type CourseRoundPoint } from '@/hooks/gam/useMyRoundsByCourse';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT } from '@/features/tourhub/_shared/tokens';
import monotonePath from '@/lib/charts/monotonePath';

/** Canonical metrics from the shared module; this sheet keeps its palette. */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };
const KICKER: React.CSSProperties = { ...KICKER_METRICS, color: A.INK };
const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };

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
const DIST = {
  eagles: SC_FILL_GOLD,
  birdies: TOPAR_UNDER_LIGHT,
  pars: A.DIM,
  bogeys: TOPAR_OVER_LIGHT,
} as const;

/**
 * The index card's zone tones. Borrowed, not owned.
 *
 * ZONE, NOT SCORE. These describe a round's position within THIS member's own
 * range at THIS course, so they keep the improvement convention (green good,
 * red bad). The figures beside them keep the to-par convention. Do not unify
 * the two — that is the getScoreColor mistake.
 */
const ZONE_BEST = A.GREEN;
const ZONE_MID = A.AMBER;
const ZONE_OFF = A.RED;


/** Zone of one round between the member's worst (0) and best (1) at a course. */
function zoneColor(v: number, best: number, worst: number): string {
  const span = worst - best;
  const p = span <= 0 ? 1 : (worst - v) / span;
  if (p >= 0.66) return ZONE_BEST;
  if (p >= 0.33) return ZONE_MID;
  return ZONE_OFF;
}



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
  background: A.PANEL,
  border: `1px solid ${open ? A.INK : A.BORDER}`,
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

interface Seg {
  key: 'eagles' | 'birdies' | 'pars' | 'bogeys';
  bg: string;
  label: string;
  pct: number;
  pctExact: number;
  count: number;
}

/**
 * THE DISTRIBUTION BAR. Four segments flexed by their percentages.
 *
 * A bucket with a non-zero count NEVER flexes to nothing — that would undo
 * fmtBucketPct's rule that one eagle in 1,800 holes reads "0.1%". It keeps a
 * 3px floor. A genuinely EMPTY bucket renders a hairline at 0.18 opacity so
 * the bar always reads as four segments rather than three.
 */
const DistributionBar: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const total = segs.reduce((s, x) => s + (x.pctExact ?? x.pct ?? 0), 0) || 1;
  return (
    <span
      style={{
        display: 'flex',
        height: 9,
        borderRadius: 3,
        overflow: 'hidden',
        background: A.TRACK,
      }}
    >
      {segs.map((s) => {
        const empty = (s.count ?? 0) === 0;
        const share = ((s.pctExact ?? s.pct ?? 0) / total) * 100;
        return (
          <i
            key={s.key}
            style={{
              width: empty ? 2 : `${share}%`,
              minWidth: empty ? 2 : 3,
              flexShrink: 0,
              background: s.bg,
              opacity: empty ? 0.18 : 1,
            }}
          />
        );
      })}
    </span>
  );
};

const TREND_H = 74;
const TREND_PAD_X = 2;
const TREND_PAD_Y = 8;

/**
 * "YOUR ROUNDS HERE" — the index card's exact treatment, graded against the
 * member's OWN range at this course: their worst round renders red, their best
 * green.
 *
 * THE AXIS: WORSE IS HIGHER. SVG y grows downward, so the mapping SUBTRACTS.
 * Getting that backwards pins the plot into a sliver at the top and the stroke
 * clips out of existence.
 */
const RoundsTrend: React.FC<{ points: CourseRoundPoint[]; gradientId: string }> = ({
  points,
  gradientId,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const lo = Math.min(...points.map((p) => p.toPar));
  const hi = Math.max(...points.map((p) => p.toPar));

  let body: React.ReactNode = null;
  if (w > 0 && n >= 2) {
    const ht = TREND_H - TREND_PAD_Y * 2;
    const span = hi - lo || 1;
    const xy = points.map((p, i) => ({
      x: TREND_PAD_X + (i / (n - 1)) * (w - TREND_PAD_X * 2),
      // WORSE (higher toPar) sits HIGHER on the chart.
      y: TREND_PAD_Y + (ht - ((p.toPar - lo) / span) * ht),
    }));
    const line = monotonePath(xy);
    const area = `${line} L${xy[n - 1].x.toFixed(2)},${TREND_H} L${xy[0].x.toFixed(2)},${TREND_H} Z`;
    body = (
      <svg width={w} height={TREND_H} style={{ display: 'block' }}>
        <defs>
          {/* THE COLOUR LIVES IN THE LINE. The fill is one amber wash. */}
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ZONE_MID} stopOpacity={0.3} />
            <stop offset="100%" stopColor={ZONE_MID} stopOpacity={0.02} />
          </linearGradient>
          {/* One stop per round, so the stroke changes zone along its length. */}
          <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
            {points.map((p, i) => (
              <stop
                key={i}
                offset={`${(i / (n - 1)) * 100}%`}
                stopColor={zoneColor(p.toPar, lo, hi)}
              />
            ))}
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.9}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={line}
          fill="none"
          stroke={`url(#${gradientId}-stroke)`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div ref={ref} style={{ height: TREND_H, position: 'relative' }}>
      {body}
    </div>
  );
};

const TrendLegendSwatch: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 9, height: 9, borderRadius: 2.5, background: color }} />
    <span style={{ ...LABEL, fontSize: 8, letterSpacing: '0.1em' }}>{label}</span>
  </span>
);


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
    course.last_played
      ? t('yourCourses.lastPlayedMeta', { date: formatDayMonthYearShortGB(course.last_played) })
      : null,
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

      {/*
        COLLAPSED: the bar sits under the header — it is the only thing making
        a 33-course list scannable.
        EXPANDED: the trend takes this slot and the bar moves down to sit
        directly above the percentages it describes.
      */}
      {hasScoring && !expanded && (
        <span style={{ gridColumn: '1 / -1', marginTop: 9 }}>
          <DistributionBar segs={segs} />
        </span>
      )}

      {hasScoring && expanded && (
        <span style={{ gridColumn: '1 / -1', marginTop: 10, display: 'block' }}>
          <div style={{ ...LABEL, marginBottom: 2 }}>{t('yourCourses.trendLabel')}</div>
          {trendPoints.length >= 2 ? (
            <RoundsTrend points={trendPoints} gradientId={`ycat-${course.course_id}`} />
          ) : (
            <div style={{ ...CAPTION, paddingTop: 6 }}>{t('yourCourses.trendNone')}</div>
          )}
          {trendPoints.length >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <TrendLegendSwatch color={ZONE_OFF} label={t('yourCourses.trendOffBest')} />
              <TrendLegendSwatch color={ZONE_MID} label={t('yourCourses.trendMid')} />
              <TrendLegendSwatch color={ZONE_BEST} label={t('yourCourses.trendNearBest')} />
            </div>
          )}
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
          {/* The bar and its percentages belong together. */}
          <div style={{ marginBottom: 8 }}>
            <DistributionBar segs={segs} />
          </div>
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
                {/* Each bucket now owns a hue on the bar, so each label owns
                    the matching swatch — eagles included. */}
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: s.bg,
                    opacity: (s.count ?? 0) === 0 ? 0.18 : 1,
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
      maxHeight="85dvh"
      variant="dark"
      surfaceColor={A.CANVAS}
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
                background: A.TRACK,
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
              <div style={CARD_LIST}>
                {listItems.map((c) => (
                  <AnalyticsCourseRow
                    key={c.course_id}
                    course={c}
                    expanded={expandedIds.has(c.course_id)}
                    onToggle={() => toggle(c)}
                    onOpen={(from) => go(c.course_id, from)}
                    trend={roundsByCourse?.get(c.course_id)}
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
