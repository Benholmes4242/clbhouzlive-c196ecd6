import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
 * Shows exactly 2 achievement cards: 1 Primary (unlocked) + 1 Upcoming (locked).
 * Clean, focused design that makes achievements feel earned.
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

      {/* Horizontal achievement strip - compact, achievement-like */}
      <div className="px-4 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {/* Next milestone (primary focus) - stronger prominence */}
        {upcoming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 min-w-[180px] relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3 shadow-lg"
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md ring-2 ring-amber-400/30">
                  <Trophy className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-amber-400 font-semibold">Next</div>
                  <div className="text-xs font-semibold text-white leading-tight">{upcoming.title}</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 mb-1.5">
                {upcoming.target - upcoming.current} to go
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(upcoming.current / upcoming.target) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Primary Achievement (Unlocked) - secondary visual weight, slightly desaturated */}
        {primary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-shrink-0 min-w-[160px] relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50/60 to-amber-100/30 border border-amber-200/40 p-3"
          >
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                </div>
                <div>
                  <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">Unlocked</div>
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{primary.title}</div>
                </div>
              </div>

              {primary.percentOfPlayers && (
                <div className="text-[10px] text-slate-500">
                  Top {primary.percentOfPlayers}% of players
                </div>
              )}

              {/* Share button - less prominent */}
              {onShareAchievement && (
                <button
                  onClick={() => onShareAchievement(primary.id)}
                  className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Share2 className="w-2.5 h-2.5" />
                  Share
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
