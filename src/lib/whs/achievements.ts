import type {
  WhsScoreWithIndex,
  HandicapPoint,
  Achievement,
  AchievementType,
} from './types';
import type { TrophyAggregates } from './api';

interface AchievementContext {
  scores: WhsScoreWithIndex[];
  history: HandicapPoint[];
  connectionCreatedAt: string | null;
  /** Unused but kept for back-compat with TrophiesSheetMount call signature. */
  primaryClubId: string | null;
  /** Unused but kept for back-compat. */
  primaryClubName: string | null;
  aggregates?: TrophyAggregates | null;
}

/** Earliest handicap snapshot strictly below threshold. */
function findFirstCrossDown(history: HandicapPoint[], threshold: number): string | null {
  if (history.length === 0) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );
  const found = sorted.find((p) => p.handicap_index < threshold);
  return found?.observed_at ?? null;
}

/** Earliest handicap snapshot at or below threshold. */
function findFirstCrossDownOrEqual(history: HandicapPoint[], threshold: number): string | null {
  if (history.length === 0) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );
  const found = sorted.find((p) => p.handicap_index <= threshold);
  return found?.observed_at ?? null;
}

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const out: Achievement[] = [];
  const agg = ctx.aggregates;

  // ── HANDICAP (5 binary, hardest-first) ─────────────────────────────
  {
    const earnedAt = findFirstCrossDown(ctx.history, 0);
    out.push({
      id: 'plus_player', type: 'plus_player',
      title: 'Plus player',
      description: 'Reach a handicap index below zero.',
      icon_name: 'Trophy', category: 'handicap', kind: 'binary',
      earned: earnedAt !== null, achieved_at: earnedAt,
    });
  }
  {
    const earnedAt = findFirstCrossDownOrEqual(ctx.history, 0);
    out.push({
      id: 'scratch', type: 'scratch',
      title: 'Scratch',
      description: 'Reach a handicap index of zero or below.',
      icon_name: 'Trophy', category: 'handicap', kind: 'binary',
      earned: earnedAt !== null, achieved_at: earnedAt,
    });
  }
  {
    const earnedAt = findFirstCrossDown(ctx.history, 10);
    out.push({
      id: 'single_figures', type: 'single_figures',
      title: 'Single figures',
      description: 'Reach a handicap index below 10.',
      icon_name: 'Trophy', category: 'handicap', kind: 'binary',
      earned: earnedAt !== null, achieved_at: earnedAt,
    });
  }
  {
    const earnedAt = findFirstCrossDown(ctx.history, 20);
    out.push({
      id: 'under_20', type: 'under_20',
      title: 'Under 20',
      description: 'Reach a handicap index below 20.',
      icon_name: 'Trophy', category: 'handicap', kind: 'binary',
      earned: earnedAt !== null, achieved_at: earnedAt,
    });
  }
  out.push({
    id: 'connected', type: 'connected',
    title: 'Connected',
    description: 'Link your England Golf account to Clbhouz.',
    icon_name: 'Link2', category: 'handicap', kind: 'binary',
    earned: ctx.connectionCreatedAt != null,
    achieved_at: ctx.connectionCreatedAt,
  });

  // ── SCORING & SHOTS (8, hardest-first) ─────────────────────────────
  out.push({
    id: 'hole_in_one', type: 'hole_in_one',
    title: 'Hole-in-one',
    description: 'Sink it in one shot.',
    icon_name: 'Crown', category: 'scoring', kind: 'counter',
    count: agg?.hole_stats?.aces_count ?? 0, count_label: 'total',
  });
  out.push({
    id: 'albatross', type: 'albatross',
    title: 'Albatross',
    description: 'Score three under par on a single hole.',
    icon_name: 'Flag', category: 'scoring', kind: 'counter',
    count: agg?.hole_stats?.albatross_count ?? 0, count_label: 'total',
  });
  out.push({
    id: 'eagles', type: 'eagles',
    title: 'Eagles',
    description: 'Score two under par on a single hole.',
    icon_name: 'Flag', category: 'scoring', kind: 'counter',
    count: agg?.hole_stats?.eagles_count ?? 0, count_label: 'total',
  });
  {
    const at = agg?.hole_stats?.first_sub_par_at ?? null;
    out.push({
      id: 'beat_par', type: 'beat_par',
      title: 'Beat par',
      description: 'Shoot a round under your course par.',
      icon_name: 'Target', category: 'scoring', kind: 'binary',
      earned: at !== null, achieved_at: at,
    });
  }
  {
    const at = agg?.hole_stats?.first_sub_80_at ?? null;
    out.push({
      id: 'beat_80', type: 'beat_80',
      title: 'Beat 80',
      description: 'Shoot a round under 80 strokes.',
      icon_name: 'Target', category: 'scoring', kind: 'binary',
      earned: at !== null, achieved_at: at,
    });
  }
  {
    const at = agg?.hole_stats?.first_sub_90_at ?? null;
    out.push({
      id: 'beat_90', type: 'beat_90',
      title: 'Beat 90',
      description: 'Shoot a round under 90 strokes.',
      icon_name: 'Target', category: 'scoring', kind: 'binary',
      earned: at !== null, achieved_at: at,
    });
  }
  {
    const at = agg?.hole_stats?.first_sub_100_at ?? null;
    out.push({
      id: 'beat_100', type: 'beat_100',
      title: 'Beat 100',
      description: 'Shoot a round under 100 strokes.',
      icon_name: 'Target', category: 'scoring', kind: 'binary',
      earned: at !== null, achieved_at: at,
    });
  }
  out.push({
    id: 'birdies', type: 'birdies',
    title: 'Birdies',
    description: 'Score one under par on any hole.',
    icon_name: 'Flag', category: 'scoring', kind: 'counter',
    count: agg?.hole_stats?.birdies_count ?? 0, count_label: 'total',
  });

  // ── COURSES & TRAVEL (6, hardest-first) ────────────────────────────
  const listCards: Array<{
    slug: 'global' | 'usa' | 'europe' | 'gb-i';
    title: string;
    type: AchievementType;
  }> = [
    { slug: 'global', title: 'Global Top 100', type: 'top100_global' },
    { slug: 'usa', title: 'USA Top 100', type: 'top100_usa' },
    { slug: 'europe', title: 'Continental Europe Top 100', type: 'top100_europe' },
    { slug: 'gb-i', title: 'GB&I Top 100', type: 'top100_gb_i' },
  ];
  for (const lc of listCards) {
    const played = agg?.course_stats?.top100_lists?.[lc.slug] ?? 0;
    const total = agg?.course_stats?.top100_list_sizes?.[lc.slug] ?? 100;
    out.push({
      id: lc.type, type: lc.type,
      title: lc.title,
      description: `Play every course on the ${lc.title}.`,
      icon_name: 'Globe', category: 'courses', kind: 'list',
      earned: played >= total, achieved_at: null,
      list_played: played, list_total: total,
    });
  }
  out.push({
    id: 'travel_golfer', type: 'travel_golfer',
    title: 'Travel golfer',
    description: 'Play courses across multiple countries.',
    icon_name: 'Plane', category: 'courses', kind: 'counter',
    count: agg?.course_stats?.countries_played?.length ?? 0,
    count_label: 'countries',
  });
  out.push({
    id: 'courses_conquered', type: 'courses_conquered',
    title: 'Courses conquered',
    description: 'Play different courses across your career.',
    icon_name: 'MapPin', category: 'courses', kind: 'counter',
    count: agg?.course_stats?.unique_courses_count ?? 0,
    count_label: 'courses',
  });

  // ── COMMUNITY (3, hardest-first) ───────────────────────────────────
  {
    const at = agg?.social_stats?.out_played_friend_first_at ?? null;
    out.push({
      id: 'beat_a_friend', type: 'beat_a_friend',
      title: 'Beat a friend',
      description: 'Win a head-to-head round against a friend.',
      icon_name: 'Users', category: 'community', kind: 'binary',
      earned: at !== null, achieved_at: at,
    });
  }
  out.push({
    id: 'rounds_played', type: 'rounds_played',
    title: 'Rounds played',
    description: 'Log rounds on Clbhouz.',
    icon_name: 'Hash', category: 'community', kind: 'counter',
    count: ctx.scores.length, count_label: 'rounds',
  });
  {
    const sortedScores = [...ctx.scores].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime()
    );
    const firstDate = sortedScores[0]?.play_date ?? null;
    out.push({
      id: 'first_round', type: 'first_round',
      title: 'First round',
      description: 'Log your first round on Clbhouz.',
      icon_name: 'CheckCircle2', category: 'community', kind: 'binary',
      earned: firstDate !== null, achieved_at: firstDate,
    });
  }

  return out;
}

/**
 * Pick top N "next-up" trophies for the AchievementsStrip preview.
 * Locked binary trophies first, then list cards with most progress.
 */
export function pickNextUpTrophies(
  achievements: Achievement[],
  limit: number = 2,
): Achievement[] {
  const lockedBinary = achievements.filter(
    (a) => a.kind === 'binary' && a.earned === false
  );
  const inProgressLists = achievements
    .filter((a) => a.kind === 'list' && a.earned === false)
    .sort((a, b) => (b.list_played ?? 0) - (a.list_played ?? 0));

  return [...lockedBinary, ...inProgressLists].slice(0, limit);
}
