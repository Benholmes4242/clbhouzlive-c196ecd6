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
      >
        <div className="h-full flex flex-col bg-background">
          {/* Page header */}
          <header className="flex-shrink-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 flex items-center justify-between border-b border-border/40">
            <button 
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-col items-center">
              <h1 className="text-base md:text-lg font-semibold tracking-tight">
                Top 100 map
              </h1>
              <p className="text-[11px] md:text-xs text-muted-foreground">
                See where you've played – and where's left to play
              </p>
            </div>

            <div className="w-12" /> {/* spacer to balance back button */}
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
