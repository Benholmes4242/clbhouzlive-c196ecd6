/**
 * MilestonesEarnedRow - Horizontal row showing unlocked milestone clubs
 * Light theme version - now uses AchievementBadgeCard for consistent design
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

  // Hide if no milestones unlocked
  if (unlockedMilestones.length === 0) return null;

  return (
    <section className="overflow-x-auto -mx-4 px-4">
      <div className="flex items-center gap-3 pb-2">
        {unlockedMilestones.map(m => (
          <AchievementBadgeCard
            key={m.threshold}
            tier={String(m.threshold) as AchievementTier}
            title={m.name}
            subtitle={m.tierName}
            unlocked={true}
            status="UNLOCKED"
            totalTop100Played={totalPlayed}
          />
        ))}
        
        {/* Show next locked milestone as ghost */}
        {nextMilestone && (
          <AchievementBadgeCard
            tier={String(nextMilestone.threshold) as AchievementTier}
            title={nextMilestone.name}
            subtitle={nextMilestone.tierName}
            unlocked={false}
            isGhost={true}
            remaining={nextMilestone.threshold - totalPlayed}
            totalTop100Played={totalPlayed}
          />
        )}
      </div>
    </section>
  );
};

export default MilestonesEarnedRow;
