/**
 * PlanningSignals - Future-oriented, calm planning UI
 * Phase 5: Intention, not conversion
 */
import React from 'react';
import { Compass, MapPin, Bookmark, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { status, setWantToPlay, setNextUp, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) return null;

  // If already played, don't show planning signals
  if (status.status === 'played') return null;

  const isWantToPlay = status.status === 'want_to_play';
  const isNextUp = status.status === 'next_up';
  const hasIntent = isWantToPlay || isNextUp;

  return (
    <div className={cn("bg-slate-50 rounded-xl p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-medium text-slate-700">Planning</h4>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Add to wishlist */}
        <button
          onClick={() => setWantToPlay(!isWantToPlay && !isNextUp)}
          disabled={isUpdating}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all",
            hasIntent
              ? "bg-amber-50 border border-amber-200"
              : "bg-white border border-slate-200 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-3">
            <Bookmark 
              className={cn(
                "h-4 w-4",
                hasIntent ? "fill-amber-500 text-amber-500" : "text-slate-400"
              )} 
            />
            <span className={cn(
              "text-sm font-medium",
              hasIntent ? "text-amber-800" : "text-slate-700"
            )}>
              {hasIntent ? 'On your wishlist' : 'Add to wishlist'}
            </span>
          </div>
          {hasIntent && (
            <span className="text-xs text-amber-600">✓</span>
          )}
        </button>

        {/* Mark as Next Up (only if on wishlist) */}
        {hasIntent && (
          <button
            onClick={() => setNextUp(!isNextUp)}
            disabled={isUpdating}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all",
              isNextUp
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-white border border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <MapPin 
                className={cn(
                  "h-4 w-4",
                  isNextUp ? "fill-emerald-500 text-emerald-500" : "text-slate-400"
                )} 
              />
              <span className={cn(
                "text-sm font-medium",
                isNextUp ? "text-emerald-800" : "text-slate-700"
              )}>
                {isNextUp ? 'Next Up' : 'Mark as Next Up'}
              </span>
            </div>
            {isNextUp && (
              <span className="text-xs text-emerald-600">✓</span>
            )}
          </button>
        )}
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-slate-400 text-center">
        Your planning is private
      </p>
    </div>
  );
};

export default PlanningSignals;
