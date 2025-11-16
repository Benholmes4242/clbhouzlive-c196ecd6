import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import { useUserCourseSummary } from './useUserCourseSummary';

export interface CourseAchievementPrompt {
  code: string;
  name: string;
  description: string;
  category: string;
  isUnlocked: boolean;
  progressLabel?: string;
  remainingLabel?: string;
}

export function useCourseAchievementPrompts(courseId: string | undefined, userId: string | undefined) {
  const { data: achievements = [] } = useUserAchievements(userId);
  const { totalCoursesPlayed, top100Progress } = useUserCourseSummary(userId);

  return useMemo(() => {
    if (!courseId || !userId) return [];

    const prompts: CourseAchievementPrompt[] = [];

    // Course milestone achievements
    const courseMilestones = [
      { code: 'played_10_courses', threshold: 10, name: '10 Courses Club', description: 'Play 10 different courses' },
      { code: 'played_25_courses', threshold: 25, name: '25 Courses Club', description: 'Play 25 different courses' },
      { code: 'played_50_courses', threshold: 50, name: '50 Courses Club', description: 'Play 50 different courses' },
    ];

    courseMilestones.forEach(milestone => {
      const achievement = achievements.find(a => a.code === milestone.code);
      const isUnlocked = achievement?.isUnlocked || false;
      const coursesPlayed = Number(totalCoursesPlayed) || 0;
      const remaining = Math.max(0, milestone.threshold - coursesPlayed);

      if (!isUnlocked || remaining <= 5) {
        prompts.push({
          code: milestone.code,
          name: milestone.name,
          description: milestone.description,
          category: 'exploration',
          isUnlocked,
          progressLabel: `${coursesPlayed} / ${milestone.threshold}`,
          remainingLabel: remaining > 0 ? `Play ${remaining} more course${remaining !== 1 ? 's' : ''}` : undefined,
        });
      }
    });

    // Top 100 achievements
    const totalTop100Played = top100Progress.reduce((sum, list) => sum + list.played, 0);
    const top100Milestones = [
      { code: 'top100_10_club', threshold: 10, name: '10 Club - Top 100', description: 'Play 10 Top 100 courses' },
      { code: 'top100_20_club', threshold: 20, name: '20 Club - Top 100', description: 'Play 20 Top 100 courses' },
      { code: 'top100_50_club', threshold: 50, name: '50 Club - Top 100', description: 'Play 50 Top 100 courses' },
    ];

    top100Milestones.forEach(milestone => {
      const achievement = achievements.find(a => a.code === milestone.code);
      const isUnlocked = achievement?.isUnlocked || false;
      const remaining = Math.max(0, milestone.threshold - totalTop100Played);

      if (!isUnlocked || remaining <= 5) {
        prompts.push({
          code: milestone.code,
          name: milestone.name,
          description: milestone.description,
          category: 'exploration',
          isUnlocked,
          progressLabel: `${totalTop100Played} / ${milestone.threshold}`,
          remainingLabel: remaining > 0 ? `Play ${remaining} more Top 100 course${remaining !== 1 ? 's' : ''}` : undefined,
        });
      }
    });

    // Return up to 3 prompts, prioritizing unlocked or close to completion
    return prompts
      .sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
        return 0;
      })
      .slice(0, 3);
  }, [courseId, userId, achievements, totalCoursesPlayed, top100Progress]);
}
