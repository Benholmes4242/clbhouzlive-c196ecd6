import React from 'react';
import { getListMilestoneState } from '@/lib/listMilestoneSystem';
import { getRegionTheme } from '@/lib/regionTheme';

interface Top100ListProgressCardProps {
  playedCount: number;
  totalCount: number;
  listSlug: string;
  listDisplayName: string;
  userId?: string;
}

/**
 * Progress card shown below hero with next milestone info and motivational copy.
 * Uses regional color theming for accent elements.
 */
export const Top100ListProgressCard: React.FC<Top100ListProgressCardProps> = ({
  playedCount,
  listSlug,
  listDisplayName,
}) => {
  // Use unified milestone system
  const { nextMilestone, toGo, isComplete, statusCopy } = getListMilestoneState(playedCount);
  
  // Get regional theme for accent color
  const theme = getRegionTheme(listSlug);

  if (isComplete) {
    return (
      <div 
        className="mx-4 mt-3 px-3.5 py-3 rounded-xl border"
        style={{
          background: `linear-gradient(135deg, ${theme.bgClass.replace('bg-', '').replace('/10', '')} 0%, transparent 100%)`,
          borderColor: theme.ringColor,
          borderWidth: '1px',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Completed
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.ringColor }}>
              100 of 100 played
            </p>
          </div>
          <p className="text-xs font-medium italic whitespace-nowrap" style={{ color: theme.ringColor }}>
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
