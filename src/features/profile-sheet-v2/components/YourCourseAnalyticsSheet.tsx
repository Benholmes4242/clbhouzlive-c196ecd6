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
  KICKER,
  LABEL,
  NUM,
  SANS,
  StatRow,
  Action,
} from '@/features/courses/components/holes/analytical/tokens';
import { DIST_SEG_COLORS } from '@/features/courses/components/holes/HoleDataSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatMonthYearShortGB } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';

const CHEVRON = '\u203A';
const DOT = '\u00B7';

/** Course-difficulty tones: harder for you reads red, easier reads green. */
const HARDER = '#C8372B';
const EASIER = '#0F8F4A';

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
            fontWeight: 800,
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
  delta,
  expanded,
  onToggle,
  onOpen,
}: {
  course: UserAnalyticsCourse;
  /** Null when there is no baseline, or a single-course list. */
  delta: number | null;
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
    avgVal != null ? t('yourCourses.avgLabel', { avg: fmtSigned(avgVal, 1) }) : null,
  ]
    .filter(Boolean)
    .join(` ${DOT} `);

  // Round FIRST, then branch on the rounded value: a delta of -0.04 renders
  // "0.0", never "-0.0".
  const deltaRounded = delta == null ? null : Number(delta.toFixed(1));
  // COURSE-DIFFICULTY convention, NOT the player-score one used on every
  // leaderboard in the app. The statement is about the course: positive means
  // "this one plays harder for you than your own baseline", so positive is RED.
  // Do not "correct" this to the leaderboard colouring.
  const deltaTone =
    deltaRounded == null || deltaRounded === 0 ? A.INK : deltaRounded > 0 ? HARDER : EASIER;

  const segs = hasScoring
    ? [
        {
          key: 'eagles',
          bg: DIST_SEG_COLORS.eaglePlus,
          label: t('yourCourses.pillEaglesLong'),
          pct: course.eagles_plus_pct as number,
          pctExact: course.eagles_plus_pct_exact as number,
          count: course.eagles_plus_count as number,
        },
        {
          key: 'birdies',
          bg: DIST_SEG_COLORS.birdie,
          label: t('yourCourses.pillBirdiesLong'),
          pct: course.birdies_pct as number,
          pctExact: course.birdies_pct_exact as number,
          count: course.birdies_count as number,
        },
        {
          key: 'pars',
          bg: DIST_SEG_COLORS.par,
          label: t('yourCourses.pillParsLong'),
          pct: course.pars_pct as number,
          pctExact: course.pars_pct_exact as number,
          count: course.pars_count as number,
        },
        {
          key: 'bogeys',
          bg: DIST_SEG_COLORS.bogey,
          label: t('yourCourses.pillBogeysLong'),
          pct: course.bogeys_plus_pct as number,
          pctExact: course.bogeys_plus_pct_exact as number,
          count: course.bogeys_plus_count as number,
        },
      ]
    : [];
  const segTotal = segs.reduce((s, x) => s + (x.pct ?? 0), 0) || 1;

  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
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
              color: A.MUTE,
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </div>
          {hasScoring && (
            <span
              style={{
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

        {deltaRounded != null && (
          <div style={{ width: 62, flex: '0 0 62px', textAlign: 'right' }}>
            <div style={{ ...NUM, fontSize: 17, color: deltaTone }}>{fmtSigned(deltaRounded, 1)}</div>
            <div style={{ ...LABEL, marginTop: 3 }}>{t('yourCourses.vsYou')}</div>
          </div>
        )}

        {!hasScoring && (
          <span style={{ color: A.DIM, fontSize: 16, flexShrink: 0, lineHeight: 1.2 }}>{CHEVRON}</span>
        )}
      </div>
    </>
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

  // No distribution: keep the original tap-to-navigate row.
  if (!hasScoring) {
    return (
      <button
        type="button"
        onClick={() => onOpen('row')}
        className="active:scale-[0.99]"
        style={{ ...shell, cursor: 'pointer' }}
      >
        {body}
      </button>
    );
  }

  return (
    <div>
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
                <div style={{ height: 3, borderRadius: 2, background: s.bg, marginBottom: 6 }} />
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
                ? // YOUR AVG carries no colour: it is the member's own score and
                  // the comparison lives in the delta column.
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

  const listItems = useMemo<UserAnalyticsCourse[]>(() => myCourses, [myCourses]);

  /**
   * The member's own baseline: shots over par per round, WEIGHTED by rounds.
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
    (course: UserAnalyticsCourse, delta: number | null) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(course.course_id)) {
          next.delete(course.course_id);
        } else {
          next.add(course.course_id);
          analyticsEvents.track('course_analytics_row_expanded', {
            course_id: course.course_id,
            rounds: course.rounds_count,
            delta_vs_baseline: delta == null ? 0 : Number(delta.toFixed(1)),
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
      maxHeight="75dvh"
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
        }}
      >
        {/* Fixed header (does NOT scroll) */}
        <div style={{ padding: '8px 20px 12px', flexShrink: 0 }}>
          <div style={KICKER}>{t('yourCourses.sheetEyebrow')}</div>
          <h2
            id="your-course-analytics-title"
            style={{
              margin: '4px 0 0',
              fontSize: 17,
              fontWeight: 800,
              color: A.INK,
              letterSpacing: '-0.01em',
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
                <div style={{ fontSize: 15, fontWeight: 800, color: A.INK }}>
                  {t('yourCourses.buildingTitle')}
                </div>
                <div style={{ ...CAPTION, marginTop: 6 }}>{t('yourCourses.buildingBody')}</div>
              </div>
            </div>
          )}

          {/* Search results override list when active */}
          {searchActive ? (
            <div
              style={{
                margin: '0 20px',
                background: '#fff',
                border: `1px solid ${A.BORDER}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {searching && searchResults.length === 0 ? (
                <div style={{ padding: 16, ...CAPTION }}>{t('yourCourses.searching')}</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: 16, ...CAPTION }}>{t('yourCourses.noResults')}</div>
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
              <div
                style={{
                  margin: '0 20px',
                  background: '#fff',
                  border: `1px solid ${A.BORDER}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {listItems.map((c) => {
                  const delta =
                    baseline != null && c.avg_to_par !== null && c.avg_to_par !== undefined
                      ? (c.avg_to_par as number) - baseline
                      : null;
                  return (
                    <AnalyticsCourseRow
                      key={c.course_id}
                      course={c}
                      delta={delta}
                      expanded={expandedIds.has(c.course_id)}
                      onToggle={() => toggle(c, delta)}
                      onOpen={(from) => go(c.course_id, from)}
                    />
                  );
                })}
              </div>
              {signedBaseline != null && (
                <div style={{ ...CAPTION, padding: '14px 24px 4px', textAlign: 'center' }}>
                  {t('yourCourses.footnote', { avg: signedBaseline, rounds: totalRounds })}
                </div>
              )}
            </>
          ) : null}

          {/* Loading skeleton for first paint */}
          {isLoading && !showBuildingState && !showList && (
            <div style={{ padding: '0 20px' }}>
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${A.BORDER}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      background:
                        'linear-gradient(90deg, rgba(15,23,42,0.03), rgba(15,23,42,0.06), rgba(15,23,42,0.03))',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
