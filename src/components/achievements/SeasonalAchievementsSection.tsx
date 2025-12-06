import React from 'react';
import { AchievementBadgeCard } from './AchievementBadgeCard';

// Future-proofed seasonal/limited achievements
interface SeasonalAchievement {
  id: string;
  title: string;
  seasonLabel: string;
  unlocked: boolean;
  accentColor: string;
}

interface SeasonalAchievementsSectionProps {
  seasonalAchievements?: SeasonalAchievement[];
}

export const SeasonalAchievementsSection: React.FC<SeasonalAchievementsSectionProps> = ({
  seasonalAchievements = [],
}) => {
  // Hide section if no seasonal achievements
  if (seasonalAchievements.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold">Seasonal & Limited Events</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {seasonalAchievements.map((achievement) => (
          <AchievementBadgeCard
            key={achievement.id}
            title={achievement.title}
            subtitle={achievement.seasonLabel}
            status={achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}
            type="SEASONAL"
            accentColor={achievement.accentColor}
          />
        ))}
      </div>
    </section>
  );
};

export default SeasonalAchievementsSection;
