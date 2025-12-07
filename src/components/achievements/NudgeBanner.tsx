import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import { cn } from '@/lib/utils';

interface NudgeBannerProps {
  nudge: BadgeNudge;
  variant?: 'hero' | 'compact';
  className?: string;
}

/**
 * NudgeBanner - "Close to Next Badge" display component
 * 
 * Displays a contextual nudge showing the user is close to unlocking
 * their next achievement badge. Two variants:
 * - hero: Large card for Top 100 Progress hero section
 * - compact: Slim banner for modals/achievement pages
 * 
 * All colors sourced from nudge.palette (global system)
 */
export const NudgeBanner: React.FC<NudgeBannerProps> = ({
  nudge,
  variant = 'compact',
  className,
}) => {
  const navigate = useNavigate();

  const handleNudgeClick = () => {
    if (nudge.type === 'regional') {
      // Navigate to the specific regional list
      const regionSlugMap: Record<string, string> = {
        GBI: 'gb-i',
        USA: 'usa',
        EU: 'europe',
        WORLD: 'global',
      };
      const slug = regionSlugMap[nudge.regionId];
      navigate(`/top100/${slug}?filter=not-played`);
    } else {
      // Navigate to Top 100 courses explore
      navigate('/courses?tab=top100');
    }
  };

  // Calculate progress percentage
  const progressPercent = nudge.type === 'global'
    ? nudge.currentThreshold !== null
      ? Math.min(100, ((nudge.totalPlayed - nudge.currentThreshold) / (nudge.nextThreshold - nudge.currentThreshold)) * 100)
      : Math.min(100, (nudge.totalPlayed / nudge.nextThreshold) * 100)
    : nudge.currentThreshold !== null
      ? Math.min(100, ((nudge.playedOnList - nudge.currentThreshold) / (nudge.nextThreshold - nudge.currentThreshold)) * 100)
      : Math.min(100, (nudge.playedOnList / nudge.nextThreshold) * 100);

  if (variant === 'hero') {
    return (
      <div 
        className={cn(
          "mt-3 p-3 rounded-2xl shadow-sm",
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${nudge.palette.bgLight}, ${nudge.palette.bgDark})`,
        }}
      >
        <div className="text-xs font-semibold text-slate-900/80 mb-1">
          {nudge.type === 'global'
            ? 'Next global milestone'
            : 'Next regional milestone'}
        </div>

        <div className="text-sm font-semibold mb-1 text-slate-900">
          {nudge.type === 'global'
            ? `${nudge.nextThreshold} Club (${nudge.tierName})`
            : `${nudge.regionLabel} – ${nudge.nextThreshold} Club`}
        </div>

        <div className="text-xs text-slate-900/75 mb-2">
          {nudge.remaining === 1
            ? 'Only 1 more Top 100 course to unlock this badge.'
            : `Only ${nudge.remaining} more Top 100 courses to unlock this badge.`}
        </div>

        {/* Progress bar */}
        <div className="h-[3px] rounded-full overflow-hidden bg-white/40 mb-2">
          <div 
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${nudge.palette.bgLight}, ${nudge.palette.bgDark})`,
            }} 
          />
        </div>

        <button
          type="button"
          className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 text-white hover:bg-slate-900 transition-colors"
          onClick={handleNudgeClick}
        >
          {nudge.type === 'regional'
            ? "See courses you haven't played"
            : 'Explore Top 100 courses'}
        </button>
      </div>
    );
  }

  // Compact variant
  return (
    <div 
      className={cn(
        "mb-3 p-2.5 rounded-xl bg-slate-900/4 flex items-center justify-between",
        className
      )}
    >
      <div>
        <div className="text-xs font-semibold text-slate-900/80">
          You're close to your next badge
        </div>
        <div className="text-[11px] text-slate-900/70">
          {nudge.type === 'global'
            ? `${nudge.remaining} more Top 100 courses to reach the ${nudge.nextThreshold} Club (${nudge.tierName}).`
            : `${nudge.remaining} more courses on the ${nudge.regionLabel} list to reach the ${nudge.nextThreshold} Club.`}
        </div>
      </div>
      <button
        type="button"
        className="ml-3 px-2.5 py-1 rounded-full text-[11px] font-medium text-white shrink-0"
        style={{
          background: `linear-gradient(135deg, ${nudge.palette.bgLight}, ${nudge.palette.bgDark})`,
        }}
        onClick={handleNudgeClick}
      >
        View journey
      </button>
    </div>
  );
};

export default NudgeBanner;
