import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, MapPin, Crown } from 'lucide-react';
import { useUserPlayedCourses, type PlayedCourseRow } from '@/hooks/gam/useUserPlayedCourses';
import { useUserHomeClubCourses } from '@/hooks/gam/useUserHomeClubCourses';
import { useDiscoverCoursesThisWeek, type DiscoverCourseRow } from '@/hooks/gam/useDiscoverCoursesThisWeek';
import { useCourseSearch, type CourseSearchResult } from '@/hooks/gam/useCourseSearch';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import { GamCard, Skeleton, EmptyStub, RetryStub } from '../../gam/_shared/GamAtoms';
import {
  legendCategoryLabel,
  legendCategoryEmoji,
  formatLegendValue,
  rankEmoji,
} from '@/lib/gam/visuals';
import type { LegendCategory } from '@/lib/gam/types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const AMBER = '#F7931E';

interface Props {
  userId: string;
  readOnly?: boolean;
}

type ViewMode =
  | { mode: 'list' }
  | {
      mode: 'drilldown';
      courseId: string;
      courseName: string;
      courseRegion?: string | null;
      courseCountry?: string | null;
      courseType?: string | null;
    };

// ─── Shared atoms ──────────────────────────────────────────────────────

const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginTop: 24,
      marginBottom: 10,
    }}
  >
    <span style={{ color: AMBER, marginRight: 6 }}>•</span>
    {label}
  </div>
);

function buildEyebrow(
  type?: string | null,
  region?: string | null,
  country?: string | null,
): string {
  const t = (type ?? '').trim();
  const r = (region ?? '').trim();
  const c = (country ?? '').trim();
  if (t && c) return `${t.toUpperCase()} · ${c.toUpperCase()}`;
  if (r && c) return `${r.toUpperCase()} · ${c.toUpperCase()}`;
  if (c) return c.toUpperCase();
  return '';
}

const CourseEyebrow: React.FC<{
  type?: string | null;
  region?: string | null;
  country?: string | null;
}> = ({ type, region, country }) => {
  const label = buildEyebrow(type, region, country);
  if (!label) return null;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: AMBER,
        textTransform: 'uppercase',
        lineHeight: 1.2,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
  );
};

interface CourseRowProps {
  name: string;
  type?: string | null;
  region?: string | null;
  country?: string | null;
  onTap: () => void;
}

const CourseRow: React.FC<CourseRowProps> = ({ name, type, region, country, onTap }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 120ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '34%',
          background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--hcp-t-60)',
        }}
      >
        <MapPin size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CourseEyebrow type={type} region={region} country={country} />
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
      </div>
      <ChevronRight size={18} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
    </div>
  );
};

// ─── List view ─────────────────────────────────────────────────────────

const ListView: React.FC<{
  userId: string;
  onSelectCourse: (c: ViewMode & { mode: 'drilldown' }) => void;
}> = ({ userId, onSelectCourse }) => {
  const [query, setQuery] = useState('');
  const playedQuery = useUserPlayedCourses(userId);
  const discoverQuery = useDiscoverCoursesThisWeek();
  const searchQuery = useCourseSearch(query);

  const played = playedQuery.data ?? [];
  const discover = discoverQuery.data ?? [];
  const searchResults = searchQuery.data ?? [];
  const showSearchResults = query.trim().length >= 2;

  const handlePlayedTap = (c: PlayedCourseRow) =>
    onSelectCourse({
      mode: 'drilldown',
      courseId: c.course_id,
      courseName: c.course_name,
      courseRegion: c.course_region,
      courseCountry: c.course_country,
      courseType: c.course_type,
    });

  const handleDiscoverTap = (c: DiscoverCourseRow) =>
    onSelectCourse({
      mode: 'drilldown',
      courseId: c.course_id,
      courseName: c.course_name,
      courseRegion: c.course_region,
      courseCountry: c.course_country,
      courseType: c.course_type,
    });

  const handleSearchTap = (c: CourseSearchResult) =>
    onSelectCourse({
      mode: 'drilldown',
      courseId: c.id,
      courseName: c.name,
      courseRegion: c.region,
      courseCountry: c.country,
      courseType: c.course_type,
    });

  return (
    <div>
      {/* SEARCH — non-sticky, scrolls with content */}
      <div style={{ padding: '20px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <Search size={16} color="var(--hcp-t-60)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses by name"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: FONT,
              fontSize: 14,
              color: 'var(--hcp-t-100)',
            }}
          />
        </div>
      </div>

      {showSearchResults ? (
        <>
          <SectionEyebrow label="SEARCH RESULTS" />
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {searchQuery.isLoading && <Skeleton height={68} radius={12} />}
            {searchQuery.isError && (
              <RetryStub
                message="Couldn't search courses"
                onRetry={() => searchQuery.refetch()}
              />
            )}
            {!searchQuery.isLoading &&
              !searchQuery.isError &&
              searchResults.length === 0 && (
                <EmptyStub title="No matches" body={`Nothing found for "${query.trim()}".`} />
              )}
            {searchResults.map((c) => (
              <CourseRow
                key={c.id}
                name={c.name}
                type={c.course_type}
                region={c.region}
                country={c.country}
                onTap={() => handleSearchTap(c)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <HomeClubSection userId={userId} onSelectCourse={onSelectCourse} />
          <SectionEyebrow label="YOUR COURSES" />
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {playedQuery.isLoading && <Skeleton height={68} radius={12} />}
            {!playedQuery.isLoading && played.length === 0 && (
              <EmptyStub
                title="No courses yet"
                body="Courses you've played will show here once your round history is in."
              />
            )}
            {played.map((c) => (
              <CourseRow
                key={c.course_id}
                name={c.course_name}
                type={c.course_type}
                region={c.course_region}
                country={c.course_country}
                onTap={() => handlePlayedTap(c)}
              />
            ))}
          </div>

          <SectionEyebrow label="DISCOVER THIS WEEK" />
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {discoverQuery.isLoading && <Skeleton height={68} radius={12} />}
            {!discoverQuery.isLoading && discover.length === 0 && (
              <EmptyStub
                title="Nothing trending yet"
                body="Hot legend chases at courses across the network will surface here."
              />
            )}
            {discover.map((c) => (
              <CourseRow
                key={c.course_id}
                name={c.course_name}
                type={c.course_type}
                region={c.course_region}
                country={c.course_country}
                onTap={() => handleDiscoverTap(c)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Drilldown view ────────────────────────────────────────────────────

const CATEGORIES_ORDER: LegendCategory[] = [
  'best_score_diff',
  'lowest_gross',
  'most_birdies_90d',
  'best_stableford_90d',
  'most_rounds_90d',
];

const DrilldownView: React.FC<{
  state: ViewMode & { mode: 'drilldown' };
  onBack: () => void;
}> = ({ state, onBack }) => {
  const { data, isLoading, isError, refetch } = useCourseLegends(state.courseId);

  const grouped = useMemo(() => {
    const m = new Map<LegendCategory, typeof data>();
    (data ?? []).forEach((row) => {
      const list = m.get(row.category) ?? [];
      list.push(row);
      m.set(row.category, list as any);
    });
    return m;
  }, [data]);

  return (
    <div>
      {/* HEADER */}
      <div style={{ padding: '20px 16px 0' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--hcp-t-60)',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <ChevronLeft size={16} />
          All courses
        </button>
        <CourseEyebrow
          type={state.courseType}
          region={state.courseRegion}
          country={state.courseCountry}
        />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {state.courseName}
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={12} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{ padding: '20px 16px' }}>
          <RetryStub message="Couldn't load Course Legends" onRetry={() => refetch()} />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <div style={{ padding: '20px 16px' }}>
          <EmptyStub
            icon={<Crown size={48} color={AMBER} style={{ opacity: 0.5 }} />}
            title="No legends yet"
            body="Once anyone posts a round here, the leaderboards spin up."
          />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && (
        <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CATEGORIES_ORDER.map((cat) => {
            const rows = (grouped.get(cat) ?? []).slice(0, 5);
            if (rows.length === 0) return null;
            return (
              <GamCard key={cat}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{legendCategoryEmoji[cat]}</span>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--hcp-t-100)',
                    }}
                  >
                    {legendCategoryLabel[cat]}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map((r: any, i: number) => {
                    const displayName =
                      r.user_display_name ?? r.display_name ?? 'Player';
                    const subtitle = r.user_home_club ?? r.home_club ?? null;
                    const photo = r.user_photo_url ?? null;
                    return (
                      <div
                        key={`${cat}-${r.user_id}-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontFamily: FONT,
                          fontSize: 13,
                          color: 'var(--hcp-t-100)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            minWidth: 22,
                            fontWeight: 700,
                            color: 'var(--hcp-t-60)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {rankEmoji(r.rank)}
                        </span>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '34%',
                            overflow: 'hidden',
                            background:
                              'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--hcp-t-60)',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            (displayName?.[0] ?? '?').toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: r.is_self ? 700 : 600,
                              color: r.is_self ? AMBER : 'var(--hcp-t-100)',
                              lineHeight: 1.25,
                            }}
                          >
                            {displayName}
                            {r.is_self ? ' (you)' : ''}
                          </div>
                          {subtitle && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--hcp-t-60)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3,
                                marginTop: 1,
                              }}
                            >
                              {subtitle}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontVariantNumeric: 'tabular-nums',
                            color: 'var(--hcp-t-60)',
                            fontSize: 12,
                          }}
                        >
                          {formatLegendValue(cat, r.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GamCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Top-level view ────────────────────────────────────────────────────

export const LegendsView: React.FC<Props> = ({ userId }) => {
  const [view, setView] = useState<ViewMode>({ mode: 'list' });

  return (
    <div role="tabpanel" id="handicap-panel-legends" aria-labelledby="handicap-tab-legends">
      {view.mode === 'list' ? (
        <ListView userId={userId} onSelectCourse={(d) => setView(d)} />
      ) : (
        <DrilldownView state={view} onBack={() => setView({ mode: 'list' })} />
      )}
    </div>
  );
};

export default LegendsView;
