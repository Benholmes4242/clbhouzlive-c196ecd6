/**
 * MilestonesEarnedRow - Horizontal row showing unlocked milestone clubs
 * Premium collector card display with smooth scroll
 */

import React from 'react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface MilestonesEarnedRowProps {
  totalPlayed: number;
}

export const MilestonesEarnedRow: React.FC<MilestonesEarnedRowProps> = ({ totalPlayed }) => {
  // Get all milestones up to 400
  const milestones = CLUB_STEPS.map(step => ({
    threshold: step.threshold,
    name: `${step.threshold} Club`,
    tierName: step.tierName,
    isUnlocked: totalPlayed >= step.threshold,
  }));

  const unlockedMilestones = milestones.filter(m => m.isUnlocked);
  const nextMilestone = milestones.find(m => !m.isUnlocked);

  // Show empty state if no milestones
  if (unlockedMilestones.length === 0 && !nextMilestone) return null;

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-thin">
      <div className="flex items-stretch gap-4 pb-3">
        {/* Unlocked milestones */}
        {unlockedMilestones.map((m, index) => (
          <div 
            key={m.threshold}
            className="flex-shrink-0"
            style={{ 
              animationDelay: `${index * 50}ms`,
            }}
          >
            <AchievementBadgeCard
              tier={String(m.threshold) as AchievementTier}
              title={m.name}
              subtitle={m.tierName}
              unlocked={true}
              status="UNLOCKED"
              totalTop100Played={totalPlayed}
            />
          </div>
        ))}
        
        {/* Show next locked milestone as ghost */}
        {nextMilestone && (
          <div className="flex-shrink-0">
            <AchievementBadgeCard
              tier={String(nextMilestone.threshold) as AchievementTier}
              title={nextMilestone.name}
              subtitle={nextMilestone.tierName}
              unlocked={false}
              isGhost={true}
              remaining={nextMilestone.threshold - totalPlayed}
              totalTop100Played={totalPlayed}
            />
          </div>
        )}
        
        {/* Spacer for scroll padding */}
        <div className="w-4 flex-shrink-0" />
      </div>
    </div>
  );
};

export default MilestonesEarnedRow;
