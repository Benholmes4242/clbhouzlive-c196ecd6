import React from 'react';
import { useUserXPOverview } from '@/hooks/useUserXPOverview';

interface GolfJourneyXPChipProps {
  userId: string;
}

export const GolfJourneyXPChip: React.FC<GolfJourneyXPChipProps> = ({ userId }) => {
  const xpOverview = useUserXPOverview(userId);

  if (!xpOverview) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/50 text-sm">
      <span className="font-medium">XP: {xpOverview.totalXP.toLocaleString()}</span>
      <span className="text-muted-foreground">—</span>
      <span style={{ color: xpOverview.currentLevelColor }} className="font-semibold">
        {xpOverview.currentLevel} Ring
      </span>
      {xpOverview.nextLevel && (
        <>
          <span className="text-muted-foreground">
            ({xpOverview.nextLevel.name} at {xpOverview.nextLevel.requiredXP.toLocaleString()})
          </span>
        </>
      )}
    </div>
  );
};
