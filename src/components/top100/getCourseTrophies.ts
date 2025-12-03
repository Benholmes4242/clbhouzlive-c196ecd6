import type { CourseLeaderboardEntry } from '@/hooks/useTop100CourseLeaderboard';

export type CourseTrophy =
  | { id: 'global_top10'; label: string }
  | { id: 'region_top10'; label: string }
  | { id: 'usa_top10'; label: string }
  | { id: 'most_played_regional'; label: string };

export function getCourseTrophies(
  course: CourseLeaderboardEntry,
  indexWithinPage: number
): CourseTrophy[] {
  const trophies: CourseTrophy[] = [];

  if (course.global_rank && course.global_rank <= 10) {
    trophies.push({ id: 'global_top10', label: 'Top 10 Global' });
  }

  if (course.regional_rank && course.regional_rank <= 10) {
    trophies.push({ id: 'region_top10', label: 'Top 10 GB&I/Europe' });
  }

  if (course.usa_rank && course.usa_rank <= 10) {
    trophies.push({ id: 'usa_top10', label: 'Top 10 USA' });
  }

  // Very simple "most played" heuristic: first card on this page with high play count
  if (indexWithinPage === 0 && course.times_played >= 50) {
    trophies.push({ id: 'most_played_regional', label: 'Most played in this list' });
  }

  return trophies.slice(0, 1); // max one badge to keep it clean
}
