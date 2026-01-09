/**
 * MilestonesEarnedRow - Horizontal row showing unlocked milestone clubs
 * Premium collector card display with smooth scroll
 */

import React from 'react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

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
        {/* Unlocked milestones with tier accent */}
        {unlockedMilestones.map((m, index) => (
          <div 
            key={m.threshold}
            className="flex-shrink-0"
            style={{ 
              animationDelay: `${index * 50}ms`,
            }}
          >
            <EliteGameCard
              tier={String(m.threshold) as EliteCardTier}
              earned={true}
              currentProgress={totalPlayed}
              targetProgress={m.threshold}
              title={m.name}
              subtitle={m.tierName}
              enableAnimations={false}
              quality="medium"
            />
          </div>
        ))}
        
        {/* Show next locked milestone as ghost */}
        {nextMilestone && (
          <div className="flex-shrink-0">
            <EliteGameCard
              tier={String(nextMilestone.threshold) as EliteCardTier}
              earned={false}
              isGhost={true}
              currentProgress={totalPlayed}
              targetProgress={nextMilestone.threshold}
              title={nextMilestone.name}
              subtitle={nextMilestone.tierName}
              enableAnimations={false}
              quality="medium"
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
