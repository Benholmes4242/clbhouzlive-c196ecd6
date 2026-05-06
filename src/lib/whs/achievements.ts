import type {
  WhsScoreWithIndex,
  HandicapPoint,
  Achievement,
} from './types';

interface AchievementContext {
  scores: WhsScoreWithIndex[];
  history: HandicapPoint[];
  connectionCreatedAt: string | null;
  primaryClubId: string | null;
  primaryClubName: string | null;
}

interface TierDef {
  threshold: number;
  label: string;
}

// ── Tier definitions ──────────────────────────────────────────────────────

const ROUND_MILESTONE_TIERS: TierDef[] = [
  { threshold: 10, label: '10 rounds' },
  { threshold: 25, label: '25 rounds' },
  { threshold: 50, label: '50 rounds' },
  { threshold: 100, label: '100 rounds' },
  { threshold: 250, label: '250 rounds' },
  { threshold: 500, label: '500 rounds' },
];

const COUNTER_MILESTONE_TIERS: TierDef[] = [
  { threshold: 10, label: '10 counters' },
  { threshold: 25, label: '25 counters' },
  { threshold: 50, label: '50 counters' },
  { threshold: 100, label: '100 counters' },
];

const YEARS_ACTIVE_TIERS: TierDef[] = [
  { threshold: 1, label: '1 year' },
  { threshold: 2, label: '2 years' },
  { threshold: 5, label: '5 years' },
  { threshold: 10, label: '10 years' },
];

const BIG_DROP_TIERS: TierDef[] = [
  { threshold: 0.5, label: '0.5 strokes' },
  { threshold: 1.0, label: '1.0 strokes' },
  { threshold: 2.0, label: '2.0 strokes' },
];

const COURSE_TIERS: TierDef[] = [
  { threshold: 5, label: '5 courses' },
  { threshold: 10, label: '10 courses' },
  { threshold: 25, label: '25 courses' },
  { threshold: 50, label: '50 courses' },
  { threshold: 100, label: '100 courses' },
];

const HANDICAP_MILESTONE_TIERS: TierDef[] = [
  { threshold: 10, label: 'Cracked 10' },
  { threshold: 5, label: 'Single digits' },
  { threshold: 0, label: 'Scratch golfer' },
  { threshold: -2, label: 'Plus 2' },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function tierProgress(
  current: number,
  tiers: TierDef[],
): { tier: number; totalTiers: number; progress: number; nextLabel: string | null; currentLabel: string } {
  let earnedTier = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (current >= tiers[i].threshold) earnedTier = i + 1;
    else break;
  }

  const nextTierIdx = earnedTier;
  if (nextTierIdx >= tiers.length) {
    return {
      tier: earnedTier,
      totalTiers: tiers.length,
      progress: 1,
      nextLabel: null,
      currentLabel: tiers[earnedTier - 1].label,
    };
  }

  const prevThreshold = earnedTier > 0 ? tiers[earnedTier - 1].threshold : 0;
  const nextThreshold = tiers[nextTierIdx].threshold;
  const span = nextThreshold - prevThreshold;
  const progressInSpan = current - prevThreshold;
  const progress = span > 0 ? Math.max(0, Math.min(1, progressInSpan / span)) : 0;

  return {
    tier: earnedTier,
    totalTiers: tiers.length,
    progress,
    nextLabel: tiers[nextTierIdx].label,
    currentLabel: earnedTier > 0 ? tiers[earnedTier - 1].label : '',
  };
}

// ── Main compute ──────────────────────────────────────────────────────────

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const out: Achievement[] = [];
  const now = Date.now();

  const sortedScores = [...ctx.scores].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const oldestRoundDate = sortedScores[sortedScores.length - 1]?.play_date ?? null;
  const currentHandicap = ctx.history[ctx.history.length - 1]?.handicap_index ?? null;

  // 1. Career low
  if (ctx.history.length > 0) {
    const lowestPoint = ctx.history.reduce(
      (min, p) => (p.handicap_index < min.handicap_index ? p : min),
      ctx.history[0],
    );
    const isRecent = now - new Date(lowestPoint.observed_at).getTime() < 30 * 86400_000;
    out.push({
      id: `career_low_${lowestPoint.handicap_index}_${lowestPoint.observed_at}`,
      type: 'career_low',
      title: 'Career low',
      subtitle: `${lowestPoint.handicap_index.toFixed(1)} index`,
      achieved_at: lowestPoint.observed_at,
      icon_name: 'Trophy',
      highlight: isRecent,
      earned: true,
      category: 'milestone',
    });
  }

  // 2. First counted round
  if (oldestRoundDate) {
    out.push({
      id: 'first_counted_round',
      type: 'first_counted_round',
      title: 'First round',
      subtitle: 'Welcome to Clbhouz',
      achieved_at: oldestRoundDate,
      icon_name: 'Flag',
      highlight: false,
      earned: true,
      category: 'milestone',
    });
  }

  // 3. First counter
  const oldestCounter = [...sortedScores].reverse().find((s) => s.is_counter);
  if (oldestCounter) {
    out.push({
      id: 'first_counter',
      type: 'first_counter',
      title: 'First counter',
      subtitle: 'Entered your top 8',
      achieved_at: oldestCounter.play_date,
      icon_name: 'Award',
      highlight: false,
      earned: true,
      category: 'milestone',
    });
  } else {
    out.push({
      id: 'first_counter',
      type: 'first_counter',
      title: 'First counter',
      subtitle: 'Locked',
      achieved_at: null,
      icon_name: 'Award',
      highlight: false,
      earned: false,
      progress: 0,
      progressLabel: 'Play a counter round',
      category: 'milestone',
    });
  }

  // 4. Connected EG
  if (ctx.connectionCreatedAt) {
    out.push({
      id: 'connected_eg',
      type: 'connected_eg',
      title: 'Connected',
      subtitle: 'England Golf linked',
      achieved_at: ctx.connectionCreatedAt,
      icon_name: 'Link2',
      highlight: false,
      earned: true,
      category: 'milestone',
    });
  }

  // 5. Personal best round
  const validScoresWithDiff = ctx.scores.filter((s) => s.handicap_differential != null);
  if (validScoresWithDiff.length > 0) {
    const bestRound = validScoresWithDiff.reduce(
      (min, s) => (s.handicap_differential! < min.handicap_differential! ? s : min),
      validScoresWithDiff[0],
    );
    out.push({
      id: 'personal_best_round',
      type: 'personal_best_round',
      title: 'Personal best',
      subtitle: `${bestRound.handicap_differential! >= 0 ? '+' : ''}${bestRound.handicap_differential!.toFixed(1)} diff`,
      achieved_at: bestRound.play_date,
      icon_name: 'Star',
      highlight: false,
      earned: true,
      category: 'round_quality',
    });
  }

  // 6. Played to handicap
  const firstPlayingRound = [...sortedScores]
    .reverse()
    .find((s) => s.stableford_points != null && s.stableford_points >= 36);
  if (firstPlayingRound) {
    out.push({
      id: 'played_to_handicap',
      type: 'played_to_handicap',
      title: 'Played to handicap',
      subtitle: `${firstPlayingRound.stableford_points} stableford`,
      achieved_at: firstPlayingRound.play_date,
      icon_name: 'Target',
      highlight: false,
      earned: true,
      category: 'round_quality',
    });
  } else if (sortedScores.length > 0) {
    const bestStableford = Math.max(
      ...sortedScores.map((s) => s.stableford_points ?? 0),
    );
    out.push({
      id: 'played_to_handicap',
      type: 'played_to_handicap',
      title: 'Played to handicap',
      subtitle: 'Locked',
      achieved_at: null,
      icon_name: 'Target',
      highlight: false,
      earned: false,
      progress: Math.min(1, bestStableford / 36),
      progressLabel: `Best ${bestStableford} stableford · need 36+`,
      category: 'round_quality',
    });
  }

  // 7. Course beater
  const beatRoundsExist = validScoresWithDiff.filter((s) => s.handicap_differential! < 0);
  if (beatRoundsExist.length > 0) {
    const bestBeat = beatRoundsExist.reduce(
      (min, s) => (s.handicap_differential! < min.handicap_differential! ? s : min),
      beatRoundsExist[0],
    );
    out.push({
      id: 'course_beater',
      type: 'course_beater',
      title: 'Course beater',
      subtitle: `${bestBeat.handicap_differential!.toFixed(1)} best`,
      achieved_at: bestBeat.play_date,
      icon_name: 'TrendingDown',
      highlight: false,
      earned: true,
      category: 'round_quality',
    });
  } else if (validScoresWithDiff.length > 0) {
    const bestDiff = Math.min(...validScoresWithDiff.map((s) => s.handicap_differential!));
    out.push({
      id: 'course_beater',
      type: 'course_beater',
      title: 'Course beater',
      subtitle: 'Locked',
      achieved_at: null,
      icon_name: 'TrendingDown',
      highlight: false,
      earned: false,
      progress: bestDiff < 5 ? Math.max(0, 1 - bestDiff / 5) : 0,
      progressLabel: `Best ${bestDiff >= 0 ? '+' : ''}${bestDiff.toFixed(1)} · need under 0`,
      category: 'round_quality',
    });
  }

  // 8. Home club master
  if (ctx.primaryClubId && ctx.primaryClubName) {
    const firstWord = ctx.primaryClubName.toLowerCase().split(' ')[0];
    const homeRounds = validScoresWithDiff.filter(
      (s) =>
        s.course?.name &&
        s.course.name.toLowerCase().includes(firstWord),
    );
    if (homeRounds.length > 0) {
      const bestHome = homeRounds.reduce(
        (min, s) => (s.handicap_differential! < min.handicap_differential! ? s : min),
        homeRounds[0],
      );
      out.push({
        id: 'home_club_master',
        type: 'home_club_master',
        title: 'Home club master',
        subtitle: `${bestHome.handicap_differential! >= 0 ? '+' : ''}${bestHome.handicap_differential!.toFixed(1)} at home`,
        achieved_at: bestHome.play_date,
        icon_name: 'MapPin',
        highlight: false,
        earned: true,
        category: 'course',
      });
    }
  }

  // 9. Sub-handicap streak
  if (currentHandicap != null) {
    let subStreak = 0;
    for (const s of sortedScores) {
      if (s.handicap_differential != null && s.handicap_differential < currentHandicap) {
        subStreak++;
      } else break;
    }
    if (subStreak >= 2 && sortedScores[0]) {
      out.push({
        id: `sub_streak_${subStreak}`,
        type: 'sub_handicap_streak',
        title: `${subStreak}-round streak`,
        subtitle: 'Beating your handicap',
        achieved_at: sortedScores[0].play_date,
        icon_name: 'Flame',
        highlight: subStreak >= 3,
        earned: true,
        category: 'round_quality',
      });
    }
  }

  // 10. Counter streak
  let counterStreak = 0;
  for (const s of sortedScores) {
    if (s.is_counter) counterStreak++;
    else break;
  }
  if (counterStreak >= 2 && sortedScores[0]) {
    out.push({
      id: `counter_streak_${counterStreak}`,
      type: 'counter_streak',
      title: `${counterStreak} counters`,
      subtitle: 'In a row',
      achieved_at: sortedScores[0].play_date,
      icon_name: 'TrendingDown',
      highlight: true,
      earned: true,
      category: 'round_quality',
    });
  }

  // 11. TIERED — round_milestones
  {
    const total = ctx.scores.length;
    const t = tierProgress(total, ROUND_MILESTONE_TIERS);
    const earned = t.tier > 0;
    out.push({
      id: 'round_milestones',
      type: 'round_milestones',
      title: 'Round milestones',
      subtitle: earned ? t.currentLabel : 'Locked',
      achieved_at: earned && sortedScores[0] ? sortedScores[0].play_date : null,
      icon_name: 'BarChart3',
      highlight: false,
      earned,
      tier: t.tier,
      totalTiers: t.totalTiers,
      progress: t.progress,
      progressLabel: t.nextLabel
        ? `${total} / ${ROUND_MILESTONE_TIERS[t.tier]?.threshold ?? '?'} rounds`
        : `${total} rounds — max tier`,
      category: 'volume',
    });
  }

  // 12. TIERED — counter_milestones
  {
    const total = ctx.scores.filter((s) => s.is_counter).length;
    const t = tierProgress(total, COUNTER_MILESTONE_TIERS);
    const earned = t.tier > 0;
    const firstCounter = sortedScores.find((s) => s.is_counter);
    out.push({
      id: 'counter_milestones',
      type: 'counter_milestones',
      title: 'Counter milestones',
      subtitle: earned ? t.currentLabel : 'Locked',
      achieved_at: earned && firstCounter ? firstCounter.play_date : null,
      icon_name: 'CheckCircle2',
      highlight: false,
      earned,
      tier: t.tier,
      totalTiers: t.totalTiers,
      progress: t.progress,
      progressLabel: t.nextLabel
        ? `${total} / ${COUNTER_MILESTONE_TIERS[t.tier]?.threshold ?? '?'} counters`
        : `${total} counters — max tier`,
      category: 'volume',
    });
  }

  // 13. TIERED — years_active
  if (ctx.connectionCreatedAt) {
    const created = new Date(ctx.connectionCreatedAt);
    const years = (now - created.getTime()) / (365.25 * 86400_000);
    const t = tierProgress(years, YEARS_ACTIVE_TIERS);
    const earned = t.tier > 0;
    out.push({
      id: 'years_active',
      type: 'years_active',
      title: 'On Clbhouz',
      subtitle: earned ? t.currentLabel : 'Locked',
      achieved_at: earned
        ? new Date(
            created.getTime() + YEARS_ACTIVE_TIERS[t.tier - 1].threshold * 365.25 * 86400_000,
          ).toISOString()
        : null,
      icon_name: 'Calendar',
      highlight: false,
      earned,
      tier: t.tier,
      totalTiers: t.totalTiers,
      progress: t.progress,
      progressLabel: t.nextLabel
        ? `${years.toFixed(1)} / ${YEARS_ACTIVE_TIERS[t.tier]?.threshold ?? '?'} years`
        : `${years.toFixed(1)} years — max tier`,
      category: 'milestone',
    });
  }

  // 14. TIERED — big_drop
  if (ctx.history.length >= 2) {
    const thirtyDaysAgo = now - 30 * 86400_000;
    const recentSnap = ctx.history[ctx.history.length - 1];
    const oldSnap = [...ctx.history]
      .reverse()
      .find((p) => new Date(p.observed_at).getTime() <= thirtyDaysAgo);

    if (oldSnap && recentSnap) {
      const drop = oldSnap.handicap_index - recentSnap.handicap_index;
      const t = tierProgress(drop, BIG_DROP_TIERS);
      const earned = t.tier > 0;
      out.push({
        id: 'big_drop',
        type: 'big_drop',
        title: 'Big drop',
        subtitle: earned ? `${BIG_DROP_TIERS[t.tier - 1].label} cut` : 'Locked',
        achieved_at: earned ? recentSnap.observed_at : null,
        icon_name: 'TrendingDown',
        highlight: t.tier >= 2,
        earned,
        tier: t.tier,
        totalTiers: t.totalTiers,
        progress: Math.max(0, t.progress),
        progressLabel: t.nextLabel
          ? `${drop > 0 ? drop.toFixed(1) : '0.0'} / ${BIG_DROP_TIERS[t.tier]?.threshold ?? '?'} cut in 30d`
          : `${drop.toFixed(1)} cut — max tier`,
        category: 'improvement',
      });
    }
  }

  // 15. TIERED — course_conquered
  {
    const uniqueCourses = new Set(
      ctx.scores.map((s) => s.course?.name).filter((n): n is string => !!n),
    );
    const total = uniqueCourses.size;
    const t = tierProgress(total, COURSE_TIERS);
    const earned = t.tier > 0;
    out.push({
      id: 'course_conquered',
      type: 'course_conquered',
      title: 'Courses played',
      subtitle: earned ? t.currentLabel : 'Locked',
      achieved_at: earned && sortedScores[0] ? sortedScores[0].play_date : null,
      icon_name: 'Map',
      highlight: false,
      earned,
      tier: t.tier,
      totalTiers: t.totalTiers,
      progress: t.progress,
      progressLabel: t.nextLabel
        ? `${total} / ${COURSE_TIERS[t.tier]?.threshold ?? '?'} courses`
        : `${total} courses — max tier`,
      category: 'course',
    });
  }

  // 16. Handicap milestones (10 / 5 / 0 / -2)
  if (currentHandicap != null && ctx.history.length >= 2) {
    for (const m of HANDICAP_MILESTONE_TIERS) {
      const everCrossed = ctx.history.some((p) => p.handicap_index <= m.threshold);
      if (everCrossed) {
        const firstCross = ctx.history.find((p) => p.handicap_index <= m.threshold);
        out.push({
          id: `milestone_${m.threshold}`,
          type: 'milestone',
          title: m.label,
          subtitle: `Handicap reached ${m.threshold}`,
          achieved_at: firstCross?.observed_at ?? null,
          icon_name: 'Award',
          highlight: m.threshold <= 0,
          earned: true,
          category: 'milestone',
        });
      }
    }
  }

  // 17. Steady performer
  if (ctx.history.length >= 4) {
    const sortedHist = [...ctx.history].sort(
      (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime(),
    );

    const monthEndMap = new Map<string, number>();
    for (const p of sortedHist) {
      const d = new Date(p.observed_at);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthEndMap.set(ym, p.handicap_index);
    }

    const months = [...monthEndMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let steadyMonths = 0;
    for (let i = months.length - 1; i > 0; i--) {
      if (months[i][1] <= months[i - 1][1] + 0.05) {
        steadyMonths++;
      } else break;
    }

    const STEADY_TARGET = 4;
    if (steadyMonths >= STEADY_TARGET) {
      out.push({
        id: 'steady_performer',
        type: 'steady_performer',
        title: 'Steady performer',
        subtitle: `${steadyMonths} months steady`,
        achieved_at: new Date().toISOString(),
        icon_name: 'Activity',
        highlight: false,
        earned: true,
        category: 'improvement',
      });
    } else if (steadyMonths > 0) {
      out.push({
        id: 'steady_performer',
        type: 'steady_performer',
        title: 'Steady performer',
        subtitle: 'Locked',
        achieved_at: null,
        icon_name: 'Activity',
        highlight: false,
        earned: false,
        progress: steadyMonths / STEADY_TARGET,
        progressLabel: `${steadyMonths} / ${STEADY_TARGET} months steady`,
        category: 'improvement',
      });
    }
  }

  return sortAchievements(out);
}

function sortAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) {
      if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
      const aDate = a.achieved_at ? new Date(a.achieved_at).getTime() : 0;
      const bDate = b.achieved_at ? new Date(b.achieved_at).getTime() : 0;
      return bDate - aDate;
    }
    return (b.progress ?? 0) - (a.progress ?? 0);
  });
}

/**
 * Pick 1-2 locked trophies for the strip's "next up" tiles.
 * Strategy: 1 closest by progress, 1 random other category for variety.
 */
export function pickNextUpTrophies(
  achievements: Achievement[],
  count: number = 2,
): Achievement[] {
  const locked = achievements.filter((a) => !a.earned && (a.progress ?? 0) > 0);
  if (locked.length === 0) return [];

  const byProgress = [...locked].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
  const closest = byProgress[0];

  if (count <= 1 || byProgress.length === 1) return [closest];

  const otherCategories = byProgress.filter((a) => a.category !== closest.category);
  if (otherCategories.length === 0) {
    return [closest, byProgress[1]];
  }
  const variety = otherCategories[Math.floor(Math.random() * otherCategories.length)];
  return [closest, variety];
}
