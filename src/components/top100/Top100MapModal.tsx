import React from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
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
        <div className="h-full flex flex-col bg-[var(--bg-page)]">
          {/* Page header */}
          <header className="flex-shrink-0 px-5 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40">
            {/* Back link - matches Top100BackButton styling */}
            <button 
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to courses
            </button>

            {/* Title / subtitle block - centered */}
            <div className="text-center mt-2">
              <h1 className="text-xl font-semibold text-foreground">
                Your Top 100 Journey
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore your journey through the Top 100
              </p>
            </div>
          </header>

          {/* Map content - fills remaining space */}
          <div className="flex-1 min-h-0">
            <Top100MapView 
              scope={scope}
              onScopeChange={onScopeChange}
              fullHeight
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Top100MapModal;
