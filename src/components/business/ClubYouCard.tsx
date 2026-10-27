/**
 * CB104: per-course collector children reuse the existing stats and circle
 * hooks, including their query keys/caches. No alternate reads or recounting
 * of WHS rows. Keyed by viewer + course set to prevent stale personal results.
 * Failures are empty; render only after every initial read has settled.
 * RPC personal-round definitions are not present locally: never infer them
 * from a different RPC, or claim an 18-hole/adjusted-gross restriction here.
 */
import { useCallback, useEffect, useState } from 'react';
import { useCourseStatsDetail, type CourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useBoardCoursePlayers, type BoardCoursePlayer } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { CIRCLE_PLAYERS_LIMIT } from '@/components/courses/course-detail/you/circleNamesLine';
import { courseActivityClubName, courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import { formatNumber } from '@/i18n/format';
import { getInitialsFromName } from '@/lib/avatarFallback';
import type { BusinessClubCourse } from './ClubHowItPlays';

export type ClubCourseResult = {
  course: BusinessClubCourse;
  stats?: Pick<CourseStatsDetail, 'your_rounds' | 'your_best'> | null;
  players?: BoardCoursePlayer[];
};

export function clubYouFacts(results: ClubCourseResult[], viewerId: string) {
  const rounds = results.reduce((sum, r) => sum + (r.stats?.your_rounds ?? 0), 0);
  const best = results.filter(r => r.stats?.your_best != null).sort((a, b) =>
    (a.stats?.your_best ?? Infinity) - (b.stats?.your_best ?? Infinity)
    || (b.stats?.your_rounds ?? 0) - (a.stats?.your_rounds ?? 0))[0];
  const merged = new Map<string, BoardCoursePlayer>();
  for (const r of results) for (const player of r.players ?? []) {
    if (player.user_id === viewerId || !player.display_name?.trim()) continue;
    const previous = merged.get(player.user_id);
    merged.set(player.user_id, { ...player, display_name: previous?.display_name ?? player.display_name.trim(), rounds: (previous?.rounds ?? 0) + player.rounds });
  }
  const players = [...merged.values()].sort((a, b) => b.rounds - a.rounds || (a.display_name ?? '').localeCompare(b.display_name ?? ''));
  return { rounds, best: best?.stats?.your_best ?? null, bestCourse: best?.course ?? null, players, capped: results.some(r => (r.players?.length ?? 0) >= CIRCLE_PLAYERS_LIMIT) };
}

export function clubYouTitle(rounds: number, best: number | null, course: BusinessClubCourse | null, courseCount: number) {
  const first = rounds === 0 ? "You haven't played a round here yet." : rounds === 1 ? "You've played one round here." : `You've played ${formatNumber(rounds)} rounds here.`;
  const second = rounds === 0 || best == null ? '' : rounds === 1 ? `You went round in ${formatNumber(best)}.` : `Your best is ${formatNumber(best)}${courseCount > 1 && course ? `, on the ${courseNameWithinClub(course.name)}` : ''}.`;
  return { first, second };
}

export function clubYouFaces(players: BoardCoursePlayer[], capped: boolean) {
  if (capped) return { names: '', rest: `${formatNumber(players.length)}+ golfers you follow have played here.` };
  const a = players[0]?.display_name ?? '';
  const b = players[1]?.display_name ?? '';
  if (players.length === 1) return { names: a, rest: ', who you follow, has played here.' };
  if (players.length === 2) return { names: `${a} and ${b}`, rest: ', who you follow, have played here.' };
  const others = players.length - 2;
  return { names: `${a}, ${b}`, rest: ` and ${formatNumber(others)} ${others === 1 ? 'other' : 'others'} you follow have played here.` };
}

type ReadResult = ClubCourseResult & { loading: boolean };
function CourseRead({ course, viewerId, report }: { course: BusinessClubCourse; viewerId: string; report: (id: string, result: ReadResult) => void }) {
  const stats = useCourseStatsDetail(course.id, true);
  const circle = useBoardCoursePlayers(viewerId, course.id, { ...DEFAULT_FILTERS, scope: 'circle', window: 'all' }, { limit: CIRCLE_PLAYERS_LIMIT });
  useEffect(() => {
    report(course.id, { course, stats: stats.isError ? null : stats.data, players: circle.isError ? [] : circle.data, loading: stats.isLoading || circle.isLoading });
  }, [course, stats.data, stats.isError, stats.isLoading, circle.data, circle.isError, circle.isLoading, report]);
  return null;
}

function Face({ player }: { player: BoardCoursePlayer }) {
  const [failed, setFailed] = useState(false);
  return <span className="club-you-avatar" data-face={player.user_id}>
    {player.profile_photo_url && !failed ? <img src={player.profile_photo_url} alt="" onError={() => setFailed(true)} /> : getInitialsFromName(player.display_name ?? '')}
  </span>;
}

function ClubYouReadCard({ courses, viewerId, businessName }: { courses: BusinessClubCourse[]; viewerId: string; businessName: string }) {
  const [reads, setReads] = useState<Record<string, ReadResult>>({});
  const report = useCallback((id: string, result: ReadResult) => setReads(previous => ({ ...previous, [id]: result })), []);
  const settled = courses.every(c => reads[c.id] && !reads[c.id].loading);
  const facts = clubYouFacts(courses.flatMap(c => reads[c.id] ? [reads[c.id]] : []), viewerId);
  const title = clubYouTitle(facts.rounds, facts.best, facts.bestCourse, courses.length);
  const faces = clubYouFaces(facts.players, facts.capped);
  const visible = settled && (facts.rounds > 0 || facts.players.length > 0);
  return <>
    {courses.map(course => <CourseRead key={course.id} course={course} viewerId={viewerId} report={report} />)}
    {visible && <section className="club-you-card" data-club-you="">
      <p className="club-you-kicker">You and {courseActivityClubName(businessName)}</p>
      <h2 className="club-you-title">{title.first}{title.second && <> <span>{title.second}</span></>}</h2>
      {facts.players.length > 0 && <div className="club-you-faces" data-club-you-faces="">
        <div className="club-you-stack" aria-hidden="true">{facts.players.slice(0, 4).map(player => <Face key={player.user_id} player={player} />)}</div>
        <p>{faces.names && <b>{faces.names}</b>}{faces.rest}</p>
      </div>}
    </section>}
  </>;
}

export function ClubYouCard({ isClub, viewerId, courses, businessName }: { isClub: boolean; viewerId?: string; courses: BusinessClubCourse[]; businessName: string }) {
  if (!isClub || !viewerId || courses.length === 0) return null;
  return <ClubYouReadCard key={`${viewerId}:${courses.map(c => c.id).join(',')}`} courses={courses} viewerId={viewerId} businessName={businessName} />;
}