import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import type { ClubCourseAnalytics } from './types';

/** CB95: the lead and tee-sheet card share Monday-first ties and the same
 * adjacent quiet-day rule, so their selected-payload conclusions cannot drift.
 */
export function weekRoom(weekdays: ClubCourseAnalytics['weekdays']) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const week = days.map((name, i) => ({ name, dow: i + 1, rounds: weekdays.find(day => day.dow === i + 1)?.rounds ?? 0 }));
  const total = week.reduce((sum, day) => sum + day.rounds, 0);
  if (total === 0) return null;
  const busiest = [...week].sort((a, b) => b.rounds - a.rounds || a.dow - b.dow)[0];
  const quietest = [...week].sort((a, b) => a.rounds - b.rounds || a.dow - b.dow);
  const [first, second] = quietest;
  if (!busiest || !first || !second) return null;
  const pair = Math.abs(first.dow - second.dow) === 1 && (first.rounds + second.rounds) * 10 < total;
  const quiet = (pair ? [first, second] : [first]).sort((a, b) => a.dow - b.dow);
  return { total, busiest, quiet, quietRounds: quiet.reduce((sum, day) => sum + day.rounds, 0) };
}

/** CB91: selected payload only; weekdays are ISO Monday-first, never local dates.
 * Complete-round eligibility belongs to the server; the client only reads rank one.
 */
export function courseLead(data: ClubCourseAnalytics, { courseCount, businessName }: { courseCount: number; businessName: string }) {
  const early = data.rounds < 50;
  const within = courseNameWithinClub(data.course_name);
  const label = courseCount > 1
    ? (/^the\s/i.test(within) ? within : `the ${within}`)
    : businessName.trim().replace(/\s+(?:Golf Club|Golf Course|GC)$/i, '').trim();
  const headline = data.avg_gross == null ? '' : `Golfers on clbhouz go round ${label} in ${data.avg_gross.toFixed(1)}.`;
  const hardest = data.complete_rounds > 0 ? data.holes.find(hole => hole.measured_rank === 1) : undefined;
  const emphasis = hardest ? `Hole ${hardest.hole_no} plays hardest.` : '';
  const first = data.first_round ? new Date(data.first_round) : null;
  const since = first && Number.isFinite(first.getTime()) ? ` since ${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}` : '';
  let line = `From ${data.rounds.toLocaleString('en-GB')} ${data.rounds === 1 ? 'round' : 'rounds'} by ${data.members.toLocaleString('en-GB')} ${data.members === 1 ? 'golfer' : 'golfers'}${since}`;
  line += !hardest && data.rounds > 0 ? ', too few full rounds yet to say which hole plays hardest.' : '.';
  const week = weekRoom(data.weekdays);
  if (week) {
    const room = week.quiet.map(day => day.name).join(' and ');
    line += ` ${week.busiest.name} is your busiest day; ${room} ${week.quiet.length === 2 ? 'have' : 'has'} the most room.`;
  }
  if (early) line += ' Every figure firms up as more of your members connect.';
  return { early, headline, emphasis, line };
}