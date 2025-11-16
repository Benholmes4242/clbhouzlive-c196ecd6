import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useUserXPOverview } from '@/hooks/useUserXPOverview';

interface XPRingPopoverProps {
  userId: string;
  children: React.ReactNode;
}

export const XPRingPopover: React.FC<XPRingPopoverProps> = ({ userId, children }) => {
  const xpOverview = useUserXPOverview(userId);

  if (!xpOverview) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl"
        side="bottom"
        align="center"
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Level</div>
            <div className="text-lg font-semibold" style={{ color: xpOverview.currentLevelColor }}>
              {xpOverview.currentLevel} Ring
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Total XP</div>
            <div className="text-lg font-semibold">{xpOverview.totalXP.toLocaleString()}</div>
          </div>

          {xpOverview.nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To {xpOverview.nextLevel.name}</span>
                <span className="font-medium">{xpOverview.nextLevel.remainingXP.toLocaleString()} XP</span>
              </div>
              <Progress value={xpOverview.nextLevel.progressPercent} className="h-2" />
            </div>
          )}

          {!xpOverview.nextLevel && (
            <div className="text-sm text-muted-foreground">
              🏆 Max level reached!
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
