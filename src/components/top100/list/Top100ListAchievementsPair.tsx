import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, Share2 } from 'lucide-react';
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
    <section className="mt-6">
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Milestones
        </h2>
        <button
          onClick={onViewAll || (() => navigate('/achievements'))}
          className="text-[12px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          See all →
        </button>
      </div>

      <div className="px-4 flex gap-3">
        {/* Primary Achievement (Unlocked) - reduced saturation */}
        {primary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 relative overflow-hidden rounded-sq-md bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200/50 p-4"
          >
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                  <Trophy className="w-4 h-4 text-white drop-shadow-sm" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{primary.title}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Unlocked</div>
                </div>
              </div>

              {primary.percentOfPlayers && (
                <div className="text-xs text-slate-600 mb-3">
                  Top {primary.percentOfPlayers}% of players
                </div>
              )}

              {/* Share button */}
              {onShareAchievement && (
                <button
                  onClick={() => onShareAchievement(primary.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Upcoming Achievement (Locked) */}
        {upcoming && (
          <div className="flex-1 rounded-sq-md bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">{upcoming.title}</div>
                <div className="text-[10px] text-slate-400 font-medium">Locked</div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              {upcoming.target - upcoming.current} courses to go
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-400 transition-all duration-300"
                style={{ width: `${(upcoming.current / upcoming.target) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
