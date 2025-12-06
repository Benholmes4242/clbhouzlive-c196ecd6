import React from 'react';
import { AchievementBadgeCard } from './AchievementBadgeCard';

// Future-proofed skill achievements - currently empty
// Will be populated with handicap, PB rounds, hole-in-one, longest drive, etc.
interface SkillAchievement {
  id: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
  accentColor: string;
}

interface SkillAchievementsSectionProps {
  skillAchievements?: SkillAchievement[];
}

export const SkillAchievementsSection: React.FC<SkillAchievementsSectionProps> = ({
  skillAchievements = [],
}) => {
  // Hide section if no skill achievements
  if (skillAchievements.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold">Skill Achievements</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -ml-4 pl-4 md:ml-0 md:pl-0">
        {skillAchievements.map((achievement) => (
          <div className="min-w-[140px] max-w-[160px] flex-shrink-0" key={achievement.id}>
            <AchievementBadgeCard
              title={achievement.title}
              subtitle={achievement.subtitle}
              status={achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}
              type="SKILL"
              accentColor={achievement.accentColor}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkillAchievementsSection;
