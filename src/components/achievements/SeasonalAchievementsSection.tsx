import React from 'react';
import { EliteGameCard, EliteCardTier } from './EliteGameCard';

// Future-proofed seasonal/limited achievements
interface SeasonalAchievement {
  id: string;
  title: string;
  seasonLabel: string;
  unlocked: boolean;
  tier: EliteCardTier;
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {seasonalAchievements.map((achievement) => (
          <EliteGameCard
            key={achievement.id}
            tier={achievement.tier}
            earned={achievement.unlocked}
            title={achievement.title}
            subtitle={achievement.seasonLabel}
            compact
          />
        ))}
      </div>
    </section>
  );
};

export default SeasonalAchievementsSection;
