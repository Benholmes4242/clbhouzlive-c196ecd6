/**
 * PlanningSignals - Future-oriented, calm planning UI
 * Simplified: Only Want to Play (Wishlist removed)
 * Shows only when course is NOT played
 */
import React from 'react';
import { Compass, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface PlanningSignalsProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const PlanningSignals: React.FC<PlanningSignalsProps> = ({
  courseId,
  courseName,
  className,
}) => {
  const { user } = useSupabaseSession();
  const { status, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) return null;

  // If already played, don't show planning signals
  if (status.status === 'played') return null;

  const isWantToPlay = status.status === 'want_to_play';

  return (
    <div className={cn("bg-slate-50 rounded-xl p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-medium text-slate-700">Planning</h4>
      </div>

      {/* Action button - Want to Play only */}
      <div className="space-y-2">
        <button
          onClick={() => setWantToPlay(!isWantToPlay)}
          disabled={isUpdating}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all",
            isWantToPlay
              ? "bg-amber-50 border border-amber-200"
              : "bg-white border border-slate-200 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-3">
            <Bookmark 
              className={cn(
                "h-4 w-4",
                isWantToPlay ? "fill-amber-500 text-amber-500" : "text-slate-400"
              )} 
            />
            <span className={cn(
              "text-sm font-medium",
              isWantToPlay ? "text-amber-800" : "text-slate-700"
            )}>
              {isWantToPlay ? 'Want to Play' : 'Add to Want to Play'}
            </span>
          </div>
          {isWantToPlay && (
            <span className="text-xs text-amber-600">✓</span>
          )}
        </button>
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-slate-400 text-center">
        Only you can see your Want to Play list.
      </p>
    </div>
  );
};

export default PlanningSignals;
