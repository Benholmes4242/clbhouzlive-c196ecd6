import React from 'react';
import { getProgressInsight } from '@/lib/utils/progressInsightCopy';

interface Top100ListProgressCardProps {
  playedCount: number;
  totalCount: number;
  listSlug: string;
  listDisplayName: string;
  userId?: string;
}

/**
 * Progress card shown below hero with next milestone info and motivational copy.
 * Displays: "Next milestone: 25" + "X courses to go" + rotating insight phrase
 */
export const Top100ListProgressCard: React.FC<Top100ListProgressCardProps> = ({
  playedCount,
  totalCount,
  listSlug,
  listDisplayName,
  userId,
}) => {
  // Calculate milestone info
  const milestoneThresholds = [25, 50, 75, 100];
  const nextMilestone = milestoneThresholds.find(t => t > playedCount) || 100;
  const coursesToGo = nextMilestone - playedCount;
  const isComplete = playedCount >= 100;
  
  // Get region prefix for milestone naming
  const getRegionPrefix = () => {
    switch (listSlug) {
      case 'global': return 'Global';
      case 'gb-i': return 'GB&I';
      case 'usa': return 'USA';
      case 'europe': return 'Europe';
      default: return listDisplayName;
    }
  };
  
  // Get progress insight phrase
  const percent = totalCount > 0 ? (playedCount / totalCount) * 100 : 0;
  const insightPhrase = getProgressInsight(percent, listSlug, userId);

  if (isComplete) {
    return (
      <div className="mx-4 mt-3 px-3.5 py-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {getRegionPrefix()} – 100 Complete ✓
            </p>
          </div>
          <p className="text-xs font-medium text-amber-700 italic whitespace-nowrap">
            {insightPhrase}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Next milestone: {nextMilestone}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {coursesToGo} course{coursesToGo !== 1 ? 's' : ''} to go
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 italic whitespace-nowrap">
          {insightPhrase}
        </p>
      </div>
    </div>
  );
};
