/**
 * Region rails under the tile (BRIEF_WHATS_BEEN_PLAYED §4, signed-off
 * region-rails mock). Rail plans come from playedRings.buildRails; top-ups from
 * useRailTopUps. A course appears once on the page. Every card opens the
 * course page; "See all ›" opens section 08 on the Played board scoped to the
 * nation, the way ByRegionSection's tiles write the country param.
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import type React from 'react';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useCourseMediaCounts } from '@/hooks/useCourseMediaCounts';
import { formatFrostRating } from '@/lib/frostPanel';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ALL_COURSES_ANCHOR } from './ByRegionSection';
import { fmtCount } from './format';
import { railShowsSeeAll, topUpRail, type RailPlan } from './playedRings';
import type { PlayedCourse } from './usePlayedRounds';
import type { RatedCourse } from './useRailTopUps';
import { FaceStack, GLASS, GOLD, PLAYED_SCRIM, PlayedHead } from './playedParts';
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
const statStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: 10.5, color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap', overflow: 'hidden' };

function PlayedCard({ group, course, onOpen }: { group: CourseGroup; course: PlayedCourse; onOpen: () => void }) {
  return (
    <button type="button" data-rail-card="played" onClick={onOpen} style={cardStyle}>
      <CourseImageFallback courseId={course.id} courseName={course.name} imageUrl={course.imageUrl} style={{ position: 'absolute', inset: 0 }}>
        <span style={{ position: 'absolute', inset: 0, background: PLAYED_SCRIM }} />
        <span style={{ ...glassTop, fontSize: 10, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: A.AMBER }}>{fmtCount(group.rounds)}</span>
        <span style={bottom}>
          <b style={nameStyle}>{shortCoursePart(course.name)}</b>
          {course.region ? <span style={countyStyle}>{course.region}</span> : null}
          <span style={statStyle}>
            <FaceStack faces={group.faces.slice(0, 2)} size={16} overlap={6} />
            {group.best != null ? <span>best <span style={{ color: GOLD, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{group.best}</span></span> : null}
          </span>
        </span>
      </CourseImageFallback>
    </button>
  );
}

function NotPlayedCard({ course, onOpen }: { course: RatedCourse; onOpen: () => void }) {
  const counts = useCourseMediaCounts(course.courseId);
  const photos = counts.data?.photos ?? 0;
  return (
    <button type="button" data-rail-card="not-played" onClick={onOpen} style={cardStyle}>
      <CourseImageFallback courseId={course.courseId} courseName={course.name} imageUrl={course.imageUrl} style={{ position: 'absolute', inset: 0 }}>
        <span style={{ position: 'absolute', inset: 0, background: PLAYED_SCRIM }} />
        <span style={{ ...glassTop, fontSize: 9, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(255,255,255,.7)' }}>NOT PLAYED LATELY</span>
        <span style={bottom}>
          <b style={nameStyle}>{shortCoursePart(course.name)}</b>
          {course.region ? <span style={countyStyle}>{course.region}</span> : null}
          <span style={statStyle} data-not-played-stat="">
            <span>{'\u2605 '}<b style={{ fontVariantNumeric: 'tabular-nums' }}>{course.rating != null ? formatFrostRating(course.rating) : ''}</b>{photos > 0 ? ` \u00B7 ${fmtCount(photos)} ${photos === 1 ? 'photo' : 'photos'}` : ''}</span>
          </span>
        </span>
      </CourseImageFallback>
    </button>
  );
}

export function RegionRails({ rails, groups, courseMap, topUps, tabIds }: {
  rails: RailPlan[]; groups: CourseGroup[]; courseMap: Map<string, PlayedCourse> | undefined;
  topUps: Map<string, RatedCourse[]>; tabIds: ReadonlySet<string>;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  if (!rails.length || !courseMap) return null;
  const byGroup = new Map(groups.map((g) => [g.courseId, g]));
  // Everything played is on the page already (tabs or a rail); top-ups skip it and each other.
  const onPage = new Set<string>([...tabIds, ...groups.map((g) => g.courseId)]);
  const resolved = rails.map((rail) => {
    const cands = topUps.get(rail.key) ?? [];
    const extra = topUpRail(rail.courseIds, cands, onPage);
    extra.forEach((id) => onPage.add(id));
    return { rail, extra: extra.map((id) => cands.find((c) => c.courseId === id)).filter((c): c is RatedCourse => !!c) };
  });
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
      {resolved.map(({ rail, extra }) => (
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
            {extra.map((c) => <NotPlayedCard key={c.courseId} course={c} onOpen={() => open(c.courseId)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
