import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';

interface Top100MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: Top100MapScope;
  onScopeChange: (scope: Top100MapScope) => void;
}

/**
 * Full-screen Top 100 Map Modal
 * Matches the MilestonesAndAchievementsModal pattern with slide-up animation
 */
const Top100MapModal: React.FC<Top100MapModalProps> = ({
  open,
  onOpenChange,
  scope,
  onScopeChange,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-full p-0 overflow-hidden"
        hideCloseButton
      >
        {/* Full-bleed map - no header, extends to top of screen */}
        <div className="h-full">
          <Top100MapView 
            scope={scope}
            onScopeChange={onScopeChange}
            fullHeight
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Top100MapModal;
