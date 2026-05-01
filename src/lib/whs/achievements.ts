import type { WhsScore, HandicapPoint, Achievement } from './types';

interface AchievementContext {
  scores: WhsScore[];
  history: HandicapPoint[];
  connectionCreatedAt: string | null;
}

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  const out: Achievement[] = [];
  const now = Date.now();

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
    });
  }

  const sortedScores = [...ctx.scores].sort(
    (a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
  );
  const currentHandicap = ctx.history[ctx.history.length - 1]?.handicap_index ?? 0;

  let subStreak = 0;
  for (const s of sortedScores) {
    if (s.handicap_differential != null && s.handicap_differential < currentHandicap) {
      subStreak++;
    } else {
      break;
    }
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
    });
  }

  let counterStreak = 0;
  for (const s of sortedScores) {
    if (s.is_counter) counterStreak++;
    else break;
  }
  if (counterStreak >= 2 && sortedScores[0]) {
    out.push({
      id: `counter_streak_${counterStreak}`,
      type: 'counter_streak',
      title: `${counterStreak} counters in a row`,
      subtitle: 'Driving your handicap down',
      achieved_at: sortedScores[0].play_date,
      icon_name: 'TrendingDown',
      highlight: true,
    });
  }

  if (currentHandicap !== null && ctx.history.length >= 2) {
    const prev = ctx.history[ctx.history.length - 2].handicap_index;
    const milestones: Array<{ threshold: number; title: string; subtitle: string }> = [
      { threshold: 10, title: 'Cracked 10', subtitle: 'Handicap dropped below 10' },
      { threshold: 5, title: 'Single digits', subtitle: 'Handicap dropped below 5' },
      { threshold: 0, title: 'Scratch golfer', subtitle: 'Handicap reached 0' },
      { threshold: -2, title: 'Plus 2', subtitle: 'Better than scratch' },
    ];
    for (const m of milestones) {
      if (prev > m.threshold && currentHandicap <= m.threshold) {
        out.push({
          id: `milestone_${m.threshold}_${ctx.history[ctx.history.length - 1].observed_at}`,
          type: 'milestone',
          title: m.title,
          subtitle: m.subtitle,
          achieved_at: ctx.history[ctx.history.length - 1].observed_at,
          icon_name: 'Award',
          highlight: true,
        });
      }
    }
  }

  const uniqueCourses = new Set(
    ctx.scores.map((s) => s.course?.name).filter((n): n is string => !!n),
  );
  if (uniqueCourses.size >= 5) {
    out.push({
      id: `courses_${uniqueCourses.size}`,
      type: 'course_conquered',
      title: `${uniqueCourses.size} courses played`,
      subtitle: 'Different courses in your history',
      achieved_at: sortedScores[0]?.play_date ?? new Date().toISOString(),
      icon_name: 'Map',
      highlight: false,
    });
  }

  if (ctx.connectionCreatedAt) {
    const created = new Date(ctx.connectionCreatedAt);
    const yearsActive = Math.floor((now - created.getTime()) / (365 * 86400_000));
    if (yearsActive >= 1) {
      out.push({
        id: `anniversary_${yearsActive}`,
        type: 'anniversary',
        title: `${yearsActive} year${yearsActive > 1 ? 's' : ''} on Clbhouz`,
        subtitle: 'Tracking your handicap',
        achieved_at: new Date(created.getTime() + yearsActive * 365 * 86400_000).toISOString(),
        icon_name: 'Calendar',
        highlight: false,
      });
    }
  }

  return out.sort((a, b) => {
    if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
    return new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime();
  });
}
