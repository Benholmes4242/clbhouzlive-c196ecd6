import React from 'react';
import { getListMilestoneState } from '@/lib/listMilestoneSystem';

interface Top100ListProgressCardProps {
  playedCount: number;
  totalCount: number;
  listSlug: string;
  listDisplayName: string;
  userId?: string;
}

/**
 * Progress card shown below hero with next milestone info and motivational copy.
 * Uses unified milestone system: [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
 * 
 * Displays:
 * - Next milestone: {nextMilestone}
 * - {toGo} courses to go
 * - Status copy (right side)
 */
export const Top100ListProgressCard: React.FC<Top100ListProgressCardProps> = ({
  playedCount,
  listSlug,
  listDisplayName,
}) => {
  // Use unified milestone system
  const { nextMilestone, toGo, isComplete, statusCopy } = getListMilestoneState(playedCount);

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

  if (isComplete) {
    return (
      <div className="mx-4 mt-3 px-3.5 py-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Completed
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              100 of 100 played
            </p>
          </div>
          <p className="text-xs font-medium text-amber-700 italic whitespace-nowrap">
            {statusCopy}
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
            {toGo} course{toGo !== 1 ? 's' : ''} to go
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 italic whitespace-nowrap">
          {statusCopy}
        </p>
      </div>
    </div>
  );
};
