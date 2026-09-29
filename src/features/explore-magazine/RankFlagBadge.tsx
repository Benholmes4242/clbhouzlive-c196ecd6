/**
 * THE ONE RANK BADGE (BRIEF_COURSE_TILES_BADGE_AND_SCROLL §2).
 *
 * Identical to the course detail hero's badge (CourseRankBadges) — the same
 * `glass-badge-tight` substrate, the same flag sizes, the same bare number with
 * no hash — so a course wears the same mark wherever it appears.
 *
 * THE FLAG COMES FROM THE LIST, NEVER FROM THE COURSE. The hero derives it by
 * branching on which list the rank came from, and so does this. A course whose
 * country is 'Britain & Ireland' can hold a GLOBAL rank, and flagging that one
 * GB would misstate which board the number is from. An unresolved scope shows
 * the number with NO icon — honest, and the rule CourseShelf already followed.
 */
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { RankListSlug } from './useTop100RankIndex';

/** The exact literals countryFlags.ts keys on. Do not "tidy" these. */
const FLAG_FOR: Record<Exclude<RankListSlug, 'global'>, string> = {
  'gb-i': 'Britain & Ireland',
  usa: 'USA',
  europe: 'Continental Europe',
};

export function RankFlagBadge({ rank, scope }: { rank: number; scope: RankListSlug | null }) {
  return (
    <span
      className="glass-badge-tight shadow-lg"
      /* The hero sets --badge-w on a wrapper; this sets it on itself so no
         call site has to know the class needs it. */
      style={{ ['--badge-w' as string]: '52px' }}
    >
      {scope == null ? null : scope === 'global' ? (
        <Earth className="h-5 w-5 text-white" />
      ) : (
        <CountryFlag country={FLAG_FOR[scope]} size="md" />
      )}
      <span className="text-white">{rank}</span>
    </span>
  );
}
