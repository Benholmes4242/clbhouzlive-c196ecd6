import { courseNameWithinClub } from '@/features/courses/_shared/courseLabel';
import type { ClubCourseAnalytics } from './types';

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
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const week = days.map((name, i) => ({ name, dow: i + 1, rounds: data.weekdays.find(day => day.dow === i + 1)?.rounds ?? 0 }));
  const total = week.reduce((sum, day) => sum + day.rounds, 0);
  if (total > 0) {
    const busiest = [...week].sort((a, b) => b.rounds - a.rounds || a.dow - b.dow)[0];
    const quiet = [...week].sort((a, b) => a.rounds - b.rounds || a.dow - b.dow).slice(0, 2);
    const [firstQuiet, secondQuiet] = quiet;
    if (busiest && firstQuiet && secondQuiet) {
      const pair = Math.abs(firstQuiet.dow - secondQuiet.dow) === 1 && (firstQuiet.rounds + secondQuiet.rounds) * 10 < total;
      const room = pair ? quiet.sort((a, b) => a.dow - b.dow).map(day => day.name).join(' and ') : firstQuiet.name;
      line += ` ${busiest.name} is your busiest day; ${room} ${pair ? 'have' : 'has'} the most room.`;
    }
  }
  if (early) line += ' Every figure firms up as more of your members connect.';
  return { early, headline, emphasis, line };
}