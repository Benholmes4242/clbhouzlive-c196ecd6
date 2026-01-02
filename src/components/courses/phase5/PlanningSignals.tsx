/**
 * PlanningSignals - Future-oriented, calm planning UI
 * Phase 5: Intention, not conversion
 * Shows only when course is NOT played
 */
import React from 'react';
import { Compass, Bookmark, Heart } from 'lucide-react';
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
  const { status, setWantToPlay, setWishlist, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) return null;

  // If already played, don't show planning signals
  if (status.status === 'played') return null;

  const isWantToPlay = status.status === 'want_to_play';
  const isWishlist = status.status === 'wishlist';
  const hasIntent = isWantToPlay || isWishlist;

  return (
    <div className={cn("bg-slate-50 rounded-xl p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-medium text-slate-700">Planning</h4>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Want to Play */}
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

        {/* Wishlist (private) */}
        <button
          onClick={() => setWishlist(!isWishlist)}
          disabled={isUpdating}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all",
            isWishlist
              ? "bg-rose-50 border border-rose-200"
              : "bg-white border border-slate-200 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-3">
            <Heart 
              className={cn(
                "h-4 w-4",
                isWishlist ? "fill-rose-500 text-rose-500" : "text-slate-400"
              )} 
            />
            <span className={cn(
              "text-sm font-medium",
              isWishlist ? "text-rose-800" : "text-slate-700"
            )}>
              {isWishlist ? 'On your Wishlist' : 'Add to Wishlist'}
            </span>
          </div>
          {isWishlist && (
            <span className="text-xs text-rose-600">✓</span>
          )}
        </button>
      </div>

      {/* Subtle helper text */}
      <p className="text-xs text-slate-400 text-center">
        {isWishlist 
          ? 'Saved for later — visible only to you' 
          : 'Your planning is private'}
      </p>
    </div>
  );
};

export default PlanningSignals;
