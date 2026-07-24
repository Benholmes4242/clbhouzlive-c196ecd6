/**
 * YourCourseAnalyticsSheet
 *
 * Phase B — Course analytics entry point sheet.
 * List of courses the user has imported rounds at (from gam_user_courses RPC),
 * most-rounds first. Tapping a row opens `/courses/:id?tab=holes`.
 * Search field above the list uses the shared useCourseSearch hook so users
 * can jump to a course they don't yet have rounds at.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK = '#0F172A';
const MUTED = '#94A3B8';
const SOFT = '#475569';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const OVER_RED = '#D2222D';
const UNDER_GREEN = '#059669';
const PILL_BG = 'rgba(15,23,42,0.04)';
const CHEVRON = '\u203A';
/** Toggle pill labels between long ("eagles+") and short ("EAG+") at this width. */
const NARROW_BREAKPOINT = 360;

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  /** True when we know user has a live WHS connection. */
  synced: boolean;
}

const DOT = '\u00B7';

/** Format a signed number to N decimal places: "+1.2", "-0.4", "0.0". */
function fmtSigned(n: number, digits: number): string {
  const rounded = Number(n.toFixed(digits));
  const abs = Math.abs(rounded).toFixed(digits);
  if (rounded > 0) return `+${abs}`;
  if (rounded < 0) return `-${abs}`;
  return abs; // exact zero: no sign
}

function Row({
  title,
  subtitle,
  onClick,
  isLast,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClick: () => void;
  isLast?: boolean;
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
        padding: '14px 16px',
        background: 'transparent',
        border: 0,
        borderBottom: isLast ? 0 : `0.5px solid ${HAIRLINE}`,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
      }}
    >
      <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontWeight: 500, fontSize: 11.5, color: MUTED, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      <span style={{ color: MUTED, fontSize: 16 }}>{CHEVRON}</span>
    </button>
  );
}

/** Compact pill for the scoring distribution: "{value}% {label}". */
function ScoringPill({ pct, label }: { pct: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 999,
        background: PILL_BG,
        fontSize: 11,
        lineHeight: 1.2,
        color: INK,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      <span style={{ fontWeight: 500, color: SOFT, textTransform: 'lowercase' }}>{label}</span>
    </span>
  );
}

/**
 * Row for the "my courses" list: chevron sits on the title line so the
 * data rows below can breathe. Line 1 uses a coloured triangle to signal
 * over-/under-par at a glance. Line 2 (top three courses only) shows the
 * user's personal scoring distribution as four pills.
 */
function AnalyticsCourseRow({
  course,
  isLast,
  showScoringPills,
  narrow,
  onClick,
}: {
  course: UserAnalyticsCourse;
  isLast: boolean;
  showScoringPills: boolean;
  narrow: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation('courses');
  const roundsLabel = t('yourCourses.roundsCount', { count: course.rounds_count });
  const hasAvg = course.avg_to_par !== null && course.avg_to_par !== undefined;
  const avgVal = hasAvg ? (course.avg_to_par as number) : 0;
  // Positive avg_to_par = plays over par (worse) → red up triangle.
  // Negative = plays under par (better) → green down triangle.
  const overPar = avgVal > 0;
  const underPar = avgVal < 0;
  const triangleColor = overPar ? OVER_RED : underPar ? UNDER_GREEN : MUTED;
  const triangleGlyph = overPar ? '\u25B2' : underPar ? '\u25BC' : '\u25CF';

  const hasScoring =
    course.eagles_plus_pct !== null &&
    course.birdies_pct !== null &&
    course.pars_pct !== null &&
    course.bogeys_plus_pct !== null;

  const pillKey = (kind: 'Eagles' | 'Birdies' | 'Pars' | 'Bogeys') =>
    `yourCourses.pill${kind}${narrow ? 'Short' : 'Long'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="active:scale-[0.99]"
      style={{
        display: 'block',
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        border: 0,
        borderBottom: isLast ? 0 : `0.5px solid ${HAIRLINE}`,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
      }}
    >
      {/* Title line — chevron on the right, on the SAME line as course name. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            fontSize: 14,
            color: INK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course.course_name}
        </div>
        <span style={{ color: MUTED, fontSize: 16, flexShrink: 0 }}>{CHEVRON}</span>
      </div>

      {/* Line 1 — rounds · [▲/▼] avg here on average */}
      <div style={{ marginTop: 3, fontSize: 12, color: SOFT }}>
        <span>{roundsLabel}</span>
        {hasAvg && (
          <>
            <span style={{ color: MUTED, margin: '0 6px' }}>{DOT}</span>
            <span
              aria-hidden
              style={{
                color: triangleColor,
                fontSize: 9,
                marginRight: 4,
                position: 'relative',
                top: -1,
              }}
            >
              {triangleGlyph}
            </span>
            <span
              style={{
                color: INK,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t('yourCourses.avgHereOnAverage', { avg: fmtSigned(avgVal, 1) })}
            </span>
          </>
        )}
      </div>

      {/* Line 2 — scoring pills (top three only, when data exists) */}
      {showScoringPills && hasScoring && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 8,
          }}
        >
          <ScoringPill pct={course.eagles_plus_pct as number} label={t(pillKey('Eagles'))} />
          <ScoringPill pct={course.birdies_pct as number} label={t(pillKey('Birdies'))} />
          <ScoringPill pct={course.pars_pct as number} label={t(pillKey('Pars'))} />
          <ScoringPill pct={course.bogeys_plus_pct as number} label={t(pillKey('Bogeys'))} />
        </div>
      )}
    </button>
  );
}

export default function YourCourseAnalyticsSheet({ open, onClose, onNavigate, synced }: Props) {
  const [q, setQ] = useState('');
  const { t } = useTranslation('courses');


  const { data: myCourses = [], isLoading } = useUserAnalyticsCourses({ enabled: open });
  const { data: searchResults = [], isFetching: searching } = useCourseSearch(q);

  const showBuildingState = synced && !isLoading && myCourses.length === 0;
  const showList = myCourses.length > 0;
  const showSearchField = showList; // per brief: search only when list non-empty
  const searchActive = q.trim().length >= 2;

  const go = (courseId: string) => {
    onClose();
    // Small delay so sheet close doesn't jank the route transition.
    setTimeout(() => onNavigate(`/courses/${courseId}?tab=holes`), 40);
  };

  const listItems = useMemo<UserAnalyticsCourse[]>(() => myCourses, [myCourses]);

  // Watch the list container width so the scoring pills can switch to short
  // labels ("EAG+") when the sheet is narrower than 360px. Keeps the four
  // pills on a single row on the top three cards.
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (!open) return;
    const el = listContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setNarrow(entry.contentRect.width < NARROW_BREAKPOINT);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, showList]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="your-course-analytics-title"
      zIndexBase={10000}
      maxHeight="75dvh"
      // Make the sheet panel a flex column so we can pin the header and
      // scroll only the list. `overflow: hidden` keeps the rounded top
      // corners clipping the scroll region. Scoped to this sheet only —
      // merged via BottomSheet's existing `...style` spread (BottomSheet.tsx:134).
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        style={{
          fontFamily: FONT,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Fixed header (does NOT scroll) */}
        <div style={{ padding: '8px 20px 12px', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            Course by course
          </div>
          <h2
            id="your-course-analytics-title"
            style={{
              margin: '4px 0 0',
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
            }}
          >
            Your course analytics
          </h2>
        </div>

        {/* Fixed search field (only when we already have a list) */}
        {showSearchField && (
          <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find another course"
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: 14,
                fontFamily: FONT,
                color: INK,
                background: '#fff',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 12,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Scrollable region — flex:1 + minHeight:0 lets it shrink so
            overflowY actually engages. overscrollBehavior: contain stops
            scroll chaining into the profile sheet behind. Panel already
            applies safe-area padding-bottom (BottomSheet.tsx:132) so we
            do NOT re-add it here. */}
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
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                  Your analytics build as your rounds sync
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: SOFT, lineHeight: 1.4 }}>
                  Play a counting round and this fills up.
                </div>
              </div>
            </div>
          )}

          {/* Search results override list when active */}
          {searchActive ? (
            <div
              style={{
                margin: '0 20px',
                background: '#fff',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {searching && searchResults.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: MUTED }}>Searching…</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: MUTED }}>No courses found.</div>
              ) : (
                searchResults.map((c, i) => (
                  <Row
                    key={c.id}
                    title={c.name}
                    subtitle={[c.region, c.country].filter(Boolean).join(' · ') || undefined}
                    onClick={() => go(c.id)}
                    isLast={i === searchResults.length - 1}
                  />
                ))
              )}
            </div>
          ) : showList ? (
            <div
              style={{
                margin: '0 20px',
                background: '#fff',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {listItems.map((c, i) => {
                const roundsLabel = t('yourCourses.roundsCount', { count: c.rounds_count });
                const hasAvg = c.avg_to_par !== null && c.avg_to_par !== undefined;
                const showToughest =
                  i < 3 &&
                  c.hardest_hole_no !== null &&
                  c.hardest_hole_no !== undefined &&
                  c.hardest_hole_avg !== null &&
                  c.hardest_hole_avg !== undefined;

                const subtitle = (
                  <>
                    <div>
                      <span style={{ color: SOFT }}>{roundsLabel}</span>
                      {hasAvg && (
                        <>
                          <span style={{ color: MUTED, margin: '0 6px' }}>{'\u00B7'}</span>
                          <span
                            style={{
                              color: AMBER,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {t('yourCourses.avgHere', {
                              avg: fmtSigned(c.avg_to_par as number, 1),
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {showToughest && (
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                        {t('yourCourses.toughestHole', { hole: c.hardest_hole_no })}
                        <span style={{ margin: '0 6px' }}>{'\u00B7'}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {t('yourCourses.perRound', {
                            avg: fmtSigned(c.hardest_hole_avg as number, 2),
                          })}
                        </span>
                      </div>
                    )}
                  </>
                );

                return (
                  <Row
                    key={c.course_id}
                    title={c.course_name}
                    subtitle={subtitle}
                    onClick={() => go(c.course_id)}
                    isLast={i === listItems.length - 1}
                  />
                );
              })}
            </div>
          ) : null}

          {/* Loading skeleton for first paint */}
          {isLoading && !showBuildingState && !showList && (
            <div style={{ padding: '0 20px' }}>
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderBottom: i < 2 ? `0.5px solid ${HAIRLINE}` : 0,
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
