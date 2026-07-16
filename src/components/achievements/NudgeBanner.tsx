import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BadgeNudge } from '@/lib/achievements/nextBadgeNudge';
import { cn } from '@/lib/utils';

interface NudgeBannerProps {
  nudge: BadgeNudge;
  variant?: 'hero' | 'compact';
  className?: string;
}

/**
 * NudgeBanner - "Close to Next Badge" display component.
 * Two variants:
 * - hero: Large card for Top 100 Progress hero section
 * - compact: Slim banner for modals/achievement pages
 *
 * All colors sourced from nudge.palette (global system).
 */
export const NudgeBanner: React.FC<NudgeBannerProps> = ({
  nudge,
  variant = 'compact',
  className,
}) => {
  const { t } = useTranslation('achievements');
  const navigate = useNavigate();

  const handleNudgeClick = () => {
    if (nudge.type === 'regional') {
      const regionSlugMap: Record<string, string> = {
        GBI: 'gb-i',
        USA: 'usa',
        EU: 'europe',
        WORLD: 'global',
      };
      const slug = regionSlugMap[nudge.regionId];
      navigate(`/top100/${slug}?filter=not-played`);
    } else {
      navigate('/courses?tab=top100');
    }
  };

  const progressPercent = nudge.type === 'global'
    ? nudge.currentThreshold !== null
      ? Math.min(100, ((nudge.totalPlayed - nudge.currentThreshold) / (nudge.nextThreshold - nudge.currentThreshold)) * 100)
      : Math.min(100, (nudge.totalPlayed / nudge.nextThreshold) * 100)
    : nudge.currentThreshold !== null
      ? Math.min(100, ((nudge.playedOnList - nudge.currentThreshold) / (nudge.nextThreshold - nudge.currentThreshold)) * 100)
      : Math.min(100, (nudge.playedOnList / nudge.nextThreshold) * 100);

  if (variant === 'hero') {
    const heroTitleGlobal = `${nudge.type === 'global' ? nudge.nextThreshold : ''} Club (${nudge.type === 'global' ? nudge.tierName : ''})`;
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
          {nudge.type === 'global' ? t('nudge.nextGlobal') : t('nudge.nextRegional')}
        </div>

        <div className="text-sm font-semibold mb-1 text-slate-900">
          {nudge.type === 'global'
            ? heroTitleGlobal
            : `${nudge.regionLabel} – ${nudge.nextThreshold} Club`}
        </div>

        <div className="text-xs text-slate-900/75 mb-2">
          {t('nudge.unlockRemaining', { count: nudge.remaining })}
        </div>

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
          {nudge.type === 'regional' ? t('nudge.seeNotPlayed') : t('nudge.exploreTop100')}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-3 p-2.5 rounded-xl bg-slate-900/4 flex items-center justify-between",
        className
      )}
    >
      <div>
        <div className="text-xs font-semibold text-slate-900/80">
          {t('nudge.closeToBadge')}
        </div>
        <div className="text-[11px] text-slate-900/70">
          {nudge.type === 'global'
            ? t('nudge.compactGlobal', {
                count: nudge.remaining,
                club: nudge.nextThreshold,
                tier: nudge.tierName,
              })
            : t('nudge.compactRegional', {
                count: nudge.remaining,
                region: nudge.regionLabel,
                club: nudge.nextThreshold,
              })}
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
        {t('nudge.viewJourney')}
      </button>
    </div>
  );
};

export default NudgeBanner;
