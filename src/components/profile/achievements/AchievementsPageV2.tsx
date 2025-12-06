import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import AchievementsGridV2 from './AchievementsGridV2';
import type { AchievementV2 } from './AchievementBadgeV2';

interface AchievementsPageV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: AchievementV2[];
  displayName?: string;
}

/**
 * AchievementsPageV2 - Profile 2.0 Full Screen Achievements Modal
 * Shows all achievements in a grid layout with skill/exploration sections
 */
const AchievementsPageV2: React.FC<AchievementsPageV2Props> = ({
  open,
  onOpenChange,
  achievements,
  displayName
}) => {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full h-[90vh] max-h-[90vh] p-0 rounded-sq-lg overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="text-sm text-muted-foreground">
              {displayName ? `${displayName}'s achievements` : 'Your achievements'} · {unlockedCount} unlocked
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          <AchievementsGridV2 achievements={achievements} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsPageV2;
