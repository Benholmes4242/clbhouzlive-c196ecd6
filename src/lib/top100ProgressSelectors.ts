// src/lib/top100ProgressSelectors.ts
// Utility functions for deriving insights from Top 100 progress data

import type { Top100RecentRound, Top100ListProgress } from '@/hooks/useTop100ProgressForUser';

// B1: Year Summary
export type YearSummary = {
  year: number;
  rounds: number;
  newCourses: number;
  avgRating: number | null;
};

export function buildYearSummary(rounds: Top100RecentRound[]): YearSummary | null {
  if (!rounds.length) return null;

  const currentYear = new Date().getFullYear();

  const yearRounds = rounds.filter(r => {
    const d = new Date(r.played_at);
    return d.getFullYear() === currentYear;
  });

  if (!yearRounds.length) return null;

  const uniqueCourses = new Set(yearRounds.map(r => r.course_id));
  const ratedRounds = yearRounds.filter(r => r.rating != null);
  const avgRating = ratedRounds.length > 0
    ? ratedRounds.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedRounds.length
    : null;

  return {
    year: currentYear,
    rounds: yearRounds.length,
    newCourses: uniqueCourses.size,
    avgRating: avgRating !== null ? Number(avgRating.toFixed(1)) : null,
  };
}

// B2: Region Insight
export type RegionProgress = {
  slug: string;
  label: string;
  played: number;
  total: number;
};

export type RegionInsight = {
  type: 'coverage';
  region: RegionProgress;
  pct: number;
};

const REGION_LABELS: Record<string, string> = {
  'global': 'Global',
  'gb-i': 'GB & Ireland',
  'usa': 'USA',
  'europe': 'Europe',
};

export function buildStrongRegionInsight(
  lists: Top100ListProgress[]
): RegionInsight | null {
  if (!lists.length) return null;

  // Convert to RegionProgress with percentage
  const regions = lists
    .filter(l => l.total > 0 && l.played >= 3)
    .map(l => ({
      slug: l.listSlug,
      label: REGION_LABELS[l.listSlug] || l.listName,
      played: l.played,
      total: l.total,
      pct: l.played / l.total,
    }));

  if (!regions.length) return null;

  const bestCoverage = regions.reduce((a, b) => (b.pct > a.pct ? b : a));
  
  return {
    type: 'coverage',
    region: bestCoverage,
    pct: bestCoverage.pct,
  };
}

// B3: Share Moment
export type ShareMoment = {
  courseId: string;
  courseName: string;
  country: string | null;
  playedAt: string;
  rating: number | null;
  listSlugs: string[];
};

export function pickShareMoment(rounds: Top100RecentRound[]): ShareMoment | null {
  if (!rounds.length) return null;

  // Pick the most recent round
  const latest = [...rounds].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  )[0];

  return {
    courseId: latest.course_id,
    courseName: latest.course_name,
    country: latest.country,
    playedAt: new Date(latest.played_at).toLocaleDateString(),
    rating: latest.rating,
    listSlugs: latest.list_slugs,
  };
}
