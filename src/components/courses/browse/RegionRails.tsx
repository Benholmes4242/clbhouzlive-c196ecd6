/**
 * Region rails under the tile (BRIEF_WHATS_BEEN_PLAYED §4, signed-off
 * region-rails mock, revised by BRIEF_WHATS_BEEN_PLAYED_V3: home nation, one
 * rest-of-grouping rail, Abroad; no top-ups). Rail plans come from playedRings.buildRails. Since BRIEF_WHATS_BEEN_PLAYED_V2 rails hold every active
 * course outside the first tab, so a course may sit in a tab and a rail. Every card opens the
 * course page; "See all ›" opens section 08 on the Played board scoped to the
 * nation, the way ByRegionSection's tiles write the country param.
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import type React from 'react';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useCourseMediaCounts } from '@/hooks/useCourseMediaCounts';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ALL_COURSES_ANCHOR } from './ByRegionSection';
import { fmtCount } from './format';
import { bestLately, railShowsSeeAll, type RailPlan } from './playedRings';
import type { PlayedCourse } from './usePlayedRounds';
import { GLASS, MemberFace, PLAYED_SCRIM, PlayedHead } from './playedParts';
import type { CourseGroup } from './WhoPlayingSection';

export const RAIL_CARD_W = 156;
export const RAIL_CARD_H = 216;
export const RAILS_TOP = 30;
export const RAIL_GAP_Y = 30;

const glassTop: React.CSSProperties = { ...GLASS, position: 'absolute', top: 8, right: 8, padding: '3px 7px', borderRadius: 7, lineHeight: '12px' };
const cardStyle: React.CSSProperties = { flex: 'none', width: RAIL_CARD_W, height: RAIL_CARD_H, borderRadius: 16, overflow: 'hidden', position: 'relative', padding: 0, border: 0, cursor: 'pointer', textAlign: 'left', color: '#FFFFFF', background: 'none' };
const bottom: React.CSSProperties = { position: 'absolute', left: 10, right: 10, bottom: 10 };
const nameStyle: React.CSSProperties = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', fontSize: 14, fontWeight: 800, lineHeight: 1.15 };
const countyStyle: React.CSSProperties = { display: 'block', marginTop: 2, fontSize: 10.5, color: 'rgba(255,255,255,.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

function PlayedCard({ group, course, onOpen }: { group: CourseGroup; course: PlayedCourse; onOpen: () => void }) {
  const best = bestLately(group.rows, 1)[0] ?? null;
  return (
    <button type="button" data-rail-card="played" onClick={onOpen} style={cardStyle}>
      <CourseImageFallback courseId={course.id} courseName={course.name} imageUrl={course.imageUrl} style={{ position: 'absolute', inset: 0 }}>
        <span style={{ position: 'absolute', inset: 0, background: PLAYED_SCRIM }} />
        <span data-rail-count="" style={{ ...glassTop, fontSize: 10, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' }}>{fmtCount(group.activity)}</span>
        <span style={bottom}>
          <b style={nameStyle}>{shortCoursePart(course.name)}</b>
          {course.region ? <span style={countyStyle}>{course.region}</span> : null}
          {best ? (
            <>
              <span data-best-golfer="" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: 11, fontWeight: 600, lineHeight: '16px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <MemberFace face={{ userId: best.user_id, photo: best.profile_photo_url, name: best.display_name }} size={16} />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{best.display_name ?? ''}</span>
              </span>
              <span data-played-stat="" style={{ display: 'block', marginTop: 3, fontSize: 10.5, color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap' }}>
                Best round <b data-best-gross="" style={{ color: '#FFFFFF', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{best.gross_score}</b>
              </span>
            </>
          ) : group.rows.length === 0 ? <ActivityStat courseId={course.id} /> : null}
        </span>
      </CourseImageFallback>
    </button>
  );
}

/** §3 "{v} video(s) & {p} photo(s)"; either part drops at 0, both 0 → nothing. */
export function mediaLine(videos: number, photos: number): string | null {
  const v = videos > 0 ? `${fmtCount(videos)} ${videos === 1 ? 'video' : 'videos'}` : null;
  const p = photos > 0 ? `${fmtCount(photos)} ${photos === 1 ? 'photo' : 'photos'}` : null;
  return v && p ? `${v} & ${p}` : v ?? p;
}

/** Posts or reviews, no round: the course's media counts (get_course_media_counts). */
function ActivityStat({ courseId }: { courseId: string }) {
  const counts = useCourseMediaCounts(courseId);
  const text = mediaLine(counts.data?.videos ?? 0, counts.data?.photos ?? 0);
  return text ? <span data-activity-stat="" style={{ display: 'block', marginTop: 7, fontSize: 10.5, color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span> : null;
}

export function RegionRails({ rails, groups, courseMap }: {
  rails: RailPlan[]; groups: CourseGroup[]; courseMap: Map<string, PlayedCourse> | undefined;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  if (!rails.length || !courseMap) return null;
  const byGroup = new Map(groups.map((g) => [g.courseId, g]));
  const open = (id: string) => navigate(`/courses/${id}`);
  const seeAll = (nation: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('country', nation);
    params.delete('region');
    params.set('lens', 'played');
    setSearchParams(params, { replace: true });
    requestAnimationFrame(() => document.getElementById(ALL_COURSES_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <div data-region-rails="" style={{ marginTop: RAILS_TOP, display: 'flex', flexDirection: 'column', gap: RAIL_GAP_Y }}>
      {rails.map((rail) => (
        <div key={rail.key} data-region-rail={rail.kind}>
          <PlayedHead kicker={rail.kicker} title={rail.title} right={railShowsSeeAll(rail) ? (
            <button type="button" data-rail-see-all="" onClick={() => seeAll(rail.nations[0])}
              style={{ flex: 'none', background: 'none', border: 0, padding: 0, fontSize: 12, fontWeight: 600, lineHeight: '25px', color: A.MUTE, cursor: 'pointer' }}>See all {'\u203A'}</button>
          ) : null} />
          <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginTop: 12, padding: '0 16px' }}>
            {rail.courseIds.map((id) => {
              const g = byGroup.get(id); const c = courseMap.get(id);
              return g && c ? <PlayedCard key={id} group={g} course={c} onOpen={() => open(id)} /> : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
