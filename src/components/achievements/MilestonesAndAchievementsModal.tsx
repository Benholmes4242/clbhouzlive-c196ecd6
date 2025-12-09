import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MilestonesAndAchievementsContent } from './MilestonesAndAchievementsContent';

interface MilestonesAndAchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Top 100 Milestones Modal
 * Premium Apple-level layout with hero progress card and unified badge grid
 * Accessed via "View all" from the Profile Achievements rail
 * 
 * This modal wraps the shared MilestonesAndAchievementsContent component.
 * For standalone page access, see AchievementsPage.tsx
 */
const MilestonesAndAchievementsModal: React.FC<MilestonesAndAchievementsModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-full p-0 overflow-hidden"
        hideCloseButton
      >
        <MilestonesAndAchievementsContent 
          onBack={() => onOpenChange(false)}
          backLabel="Back to profile"
        />
      </SheetContent>
    </Sheet>
  );
};

export default MilestonesAndAchievementsModal;
