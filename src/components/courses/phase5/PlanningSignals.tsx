/**
 * PlanningSignals - Future-oriented, calm planning UI
 * Simplified: Only Want to Play (Wishlist removed)
 * Shows only when course is NOT played
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('courses');
  const { status, isLoading: statusLoading, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);

  if (!user) return null;

  // Nothing renders from status until the query has settled.
  if (statusLoading || !status) return null;

  // If already played, don't show planning signals
  if (status.status === 'played') return null;

  const isWantToPlay = status.status === 'want_to_play';

  return (
    <div className={cn("bg-amber-50/50 rounded-2xl border border-amber-100 p-5", className)}>
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Compass className="h-4 w-4 text-amber-600" />
        </div>
        <h4 className="font-semibold text-foreground">{t('phase5.planning.title')}</h4>
      </div>

      {/* Action button - Want to Play */}
      <button
        onClick={() => setWantToPlay(!isWantToPlay)}
        disabled={isUpdating}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98]",
          isWantToPlay
            ? "bg-white/[0.06] border-2 border-amber-300/60 shadow-sm"
            : "bg-white/[0.04] border border-amber-200/30 hover:border-amber-300/50"
        )}
      >
        <div className="flex items-center gap-3">
          <Bookmark 
            className={cn(
              "h-5 w-5",
              isWantToPlay ? "fill-amber-500 text-amber-500" : "text-gray-400"
            )} 
          />
          <span className={cn(
            "font-medium",
            isWantToPlay ? "text-amber-700" : "text-gray-700"
          )}>
            {t('phase5.planning.addBucketList')}
          </span>
        </div>
        {isWantToPlay && (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Subtle helper text */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        {t('phase5.planning.privateNote')}
      </p>
    </div>
  );
};

export default PlanningSignals;
