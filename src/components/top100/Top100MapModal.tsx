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
          <header className="flex-shrink-0 px-4 pt-4 pb-3 md:px-8 md:pt-6 md:pb-4 border-b border-border/40">
            {/* Back link */}
            <button 
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span>Back to courses</span>
            </button>

            {/* Title / subtitle block */}
            <div className="mt-3">
              <h1 className="text-lg font-semibold text-slate-900">
                See where you've played – and what's left to play
              </h1>
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
