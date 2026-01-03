import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AchievementBadgeSquircle, type SquircleTier } from '@/components/achievements/AchievementBadgeSquircle';

interface AchievementData {
  id: string;
  title: string;
  current: number;
  target: number;
  isComplete: boolean;
  percentOfPlayers?: number;
}

interface Top100ListAchievementsPairProps {
  primary: AchievementData | null;
  upcoming: AchievementData | null;
  onViewAll?: () => void;
  onShareAchievement?: (id: string) => void;
}

/**
 * Maps list milestone targets to global milestone tiers for consistent styling.
 * List milestones: 25, 50, 75, 100 → maps to closest global tier visuals
 */
function getSquircleTier(target: number): SquircleTier {
  if (target <= 25) return '20';
  if (target <= 50) return '50';
  if (target <= 75) return '100';
  return '100';
}

/**
 * Shows exactly 2 achievement cards: 1 Primary (unlocked) + 1 Upcoming (locked).
 * Uses unified AchievementBadgeSquircle for consistent design with My Progress page.
 */
export const Top100ListAchievementsPair: React.FC<Top100ListAchievementsPairProps> = ({
  primary,
  upcoming,
  onViewAll,
  onShareAchievement,
}) => {
  const navigate = useNavigate();

  if (!primary && !upcoming) return null;

  return (
    <section className="mt-4">
      <div className="px-4 flex items-center justify-between mb-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Your Milestones
        </h2>
        <button
          onClick={onViewAll || (() => navigate('/achievements'))}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          See all →
        </button>
      </div>

      {/* Horizontal achievement strip - using squircle badges like My Progress */}
      <div className="px-4 flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {/* Next milestone (primary focus) */}
        {upcoming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center min-w-[90px] gap-1"
          >
            <AchievementBadgeSquircle
              tier={getSquircleTier(upcoming.target)}
              unlocked={false}
              isCurrentTarget={true}
            />
            <div className="mt-2 text-center">
              <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Next</p>
              <p className="text-[11px] font-medium text-foreground whitespace-nowrap max-w-[88px] truncate">
                {upcoming.title.split('–')[1]?.trim() || upcoming.title}
              </p>
              <p className="text-[10px] leading-[1.2] text-muted-foreground py-0.5">
                {upcoming.target - upcoming.current} to go
              </p>
            </div>
          </motion.div>
        )}

        {/* Primary Achievement (Unlocked) */}
        {primary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col items-center min-w-[90px] gap-1"
          >
            <AchievementBadgeSquircle
              tier={getSquircleTier(primary.target)}
              unlocked={true}
              isCurrentTarget={false}
            />
            <div className="mt-2 text-center">
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">Unlocked</p>
              <p className="text-[11px] font-medium text-foreground whitespace-nowrap max-w-[88px] truncate">
                {primary.title.split('–')[1]?.trim() || primary.title}
              </p>
              {primary.percentOfPlayers && (
                <p className="text-[10px] leading-[1.2] text-muted-foreground py-0.5">
                  Top {primary.percentOfPlayers}%
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
