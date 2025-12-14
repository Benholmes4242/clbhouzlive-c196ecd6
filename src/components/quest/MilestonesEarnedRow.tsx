/**
 * MilestonesEarnedRow - Horizontal pill row showing unlocked milestone clubs
 */

import React from 'react';
import { Check } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';

interface MilestonesEarnedRowProps {
  totalPlayed: number;
}

export const MilestonesEarnedRow: React.FC<MilestonesEarnedRowProps> = ({ totalPlayed }) => {
  // Get all milestones up to 400
  const milestones = CLUB_STEPS.map(step => ({
    threshold: step.threshold,
    name: `${step.threshold} Club`,
    isUnlocked: totalPlayed >= step.threshold,
  }));

  const unlockedMilestones = milestones.filter(m => m.isUnlocked);
  const nextMilestone = milestones.find(m => !m.isUnlocked);

  // Hide if no milestones unlocked
  if (unlockedMilestones.length === 0) return null;

  return (
    <section className="overflow-x-auto -mx-4 px-4">
      <div className="flex items-center gap-2 pb-2">
        {unlockedMilestones.map(m => (
          <div
            key={m.threshold}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={{
              background: 'rgba(200, 176, 106, 0.2)',
              color: 'var(--dgp-accent-gold)',
              border: '1px solid rgba(200, 176, 106, 0.3)',
            }}
          >
            <Check className="w-3 h-3" />
            {m.name}
          </div>
        ))}
        
        {/* Show next locked milestone as muted */}
        {nextMilestone && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={{
              background: 'var(--dgp-glass-surface)',
              color: 'var(--dgp-text-muted)',
              border: '1px solid var(--dgp-glass-stroke)',
            }}
          >
            {nextMilestone.name}
          </div>
        )}
      </div>
    </section>
  );
};

export default MilestonesEarnedRow;
