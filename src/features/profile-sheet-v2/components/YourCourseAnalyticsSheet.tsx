/**
 * YourCourseAnalyticsSheet
 *
 * Phase B — Course analytics entry point sheet.
 * List of courses the user has imported rounds at (from gam_user_courses RPC),
 * most-rounds first. Tapping a row opens `/courses/:id?tab=holes`.
 * Search field above the list uses the shared useCourseSearch hook so users
 * can jump to a course they don't yet have rounds at.
 */

import React, { useMemo, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useUserAnalyticsCourses, type UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { useCourseSearch } from '@/hooks/gam/useCourseSearch';

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK = '#0F172A';
const MUTED = '#94A3B8';
const SOFT = '#475569';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const CHEVRON = '\u203A';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  /** True when we know user has a live WHS connection. */
  synced: boolean;
}

function Row({
  title,
  subtitle,
  onClick,
  isLast,
}: {
  title: string;
  subtitle?: string;
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

export default function YourCourseAnalyticsSheet({ open, onClose, onNavigate, synced }: Props) {
  const [q, setQ] = useState('');

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

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="your-course-analytics-title">
      <div style={{ fontFamily: FONT, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ padding: '8px 20px 12px' }}>
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

        {/* Search field (only when we already have a list) */}
        {showSearchField && (
          <div style={{ padding: '0 20px 12px' }}>
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
            {listItems.map((c, i) => (
              <Row
                key={c.course_id}
                title={c.course_name}
                subtitle={`${c.rounds_count} ${c.rounds_count === 1 ? 'round' : 'rounds'}`}
                onClick={() => go(c.course_id)}
                isLast={i === listItems.length - 1}
              />
            ))}
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
    </BottomSheet>
  );
}
