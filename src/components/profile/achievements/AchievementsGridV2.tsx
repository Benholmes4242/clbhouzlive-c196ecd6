import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import AchievementBadgeV2, { type AchievementV2 } from './AchievementBadgeV2';
import AchievementDetailModal from './AchievementDetailModal';

interface AchievementsGridV2Props {
  achievements: AchievementV2[];
  className?: string;
}

/**
 * AchievementsGridV2 - Profile 2.0 Achievements Grid
 * Two sections: Skill-Based and Exploration-Based
 * 3-column grid, Apple Fitness-style flat design
 */
const AchievementsGridV2: React.FC<AchievementsGridV2Props> = ({
  achievements,
  className
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementV2 | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const skillAchievements = achievements.filter(a => a.category === 'skill');
  const explorationAchievements = achievements.filter(a => a.category === 'exploration');

  const handleBadgeClick = (achievement: AchievementV2) => {
    setSelectedAchievement(achievement);
    setModalOpen(true);
  };

  const renderSection = (title: string, items: AchievementV2[]) => {
    if (items.length === 0) return null;
    
    // Sort: unlocked first, then by name
    const sorted = [...items].sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 px-1">{title}</h3>
        <div className="grid grid-cols-3 gap-3">
          {sorted.map(achievement => (
            <AchievementBadgeV2
              key={achievement.id}
              achievement={achievement}
              onClick={() => handleBadgeClick(achievement)}
              size="md"
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("pb-24", className)}>
      {renderSection('Skill-Based', skillAchievements)}
      {renderSection('Exploration-Based', explorationAchievements)}
      
      {achievements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No achievements yet</h3>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            Play courses and improve your game to unlock achievements
          </p>
        </div>
      )}

      <AchievementDetailModal
        achievement={selectedAchievement}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default AchievementsGridV2;
