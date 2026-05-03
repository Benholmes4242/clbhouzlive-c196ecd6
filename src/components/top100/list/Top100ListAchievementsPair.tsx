import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';

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

// Milestone thresholds for Top 100 lists - standardized across all lists
const MILESTONE_THRESHOLDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Helper to get current and next milestones from played count
 */
function getMilestoneState(playedCount: number) {
  // Find highest unlocked milestone
  let currentMilestone = 0;
  let nextMilestone: number | null = null;
  
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (playedCount >= threshold) {
      currentMilestone = threshold;
    } else if (nextMilestone === null) {
      nextMilestone = threshold;
    }
  }
  
  // If user has exceeded all milestones
  const isMaxLevel = playedCount >= MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1];
  
  return {
    currentMilestone,
    nextMilestone: isMaxLevel ? null : nextMilestone,
    remaining: nextMilestone ? nextMilestone - playedCount : 0,
    isMaxLevel,
  };
}

/**
 * Two-tile milestone display: Unlocked (left) + Next Up (right)
 * Follows the detailed spec for layout, spacing, and visual states.
 */
export const Top100ListAchievementsPair: React.FC<Top100ListAchievementsPairProps> = ({
  primary,
  upcoming,
  onViewAll,
}) => {
  const navigate = useNavigate();

  // Calculate milestone state from the data we have
  const playedCount = primary?.current || upcoming?.current || 0;
  const { currentMilestone, nextMilestone, remaining, isMaxLevel } = getMilestoneState(playedCount);

  const handleTileClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/profile');
    }
  };

  return (
    <section className="mt-4">
      {/* Header: YOUR MILESTONES + See all → */}
      <div className="px-4 flex items-center justify-between mb-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Your Milestones
        </h2>
        <button
          onClick={handleTileClick}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          See all →
        </button>
      </div>

      {/* Two-tile row with 12px gap */}
      <div className="px-4 flex gap-3">
        {/* Tile A: Unlocked (or Progress if 0) */}
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTileClick}
          className="flex-1 h-[72px] rounded-2xl bg-white border border-slate-200/80 p-3 flex items-center gap-2.5 transition-all hover:border-slate-300 hover:shadow-sm"
          aria-label={currentMilestone > 0 ? `Unlocked milestone: ${currentMilestone} complete` : `Progress: ${playedCount} played`}
        >
          {/* Badge */}
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-emerald-700">
              {currentMilestone > 0 ? currentMilestone : playedCount}
            </span>
          </div>
          
          {/* Text */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[11px] font-medium text-emerald-600/80 uppercase tracking-wide">
              {currentMilestone > 0 ? 'Unlocked' : 'Progress'}
            </span>
            <span className="text-[13px] font-semibold text-slate-800 truncate">
              {currentMilestone > 0 ? `${currentMilestone} Complete` : `${playedCount} Played`}
            </span>
          </div>
        </motion.button>

        {/* Small connector chevron */}
        <div className="flex items-center -mx-1">
          <div className="w-3 h-0.5 bg-slate-200 rounded-full" />
        </div>

        {/* Tile B: Next Up (or Max Level if complete) */}
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTileClick}
          className={`flex-1 h-[72px] rounded-2xl p-3 flex items-center gap-2.5 transition-all ${
            isMaxLevel 
              ? 'bg-amber-50 border border-amber-200/60 hover:border-amber-300' 
              : 'bg-slate-50 border border-slate-200/60 opacity-80 hover:opacity-100 hover:border-slate-300'
          }`}
          aria-label={isMaxLevel ? 'Max level: All milestones unlocked' : `Next milestone: ${nextMilestone}, ${remaining} to go`}
        >
          {/* Badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
            isMaxLevel 
              ? 'bg-amber-100 border border-amber-300/60' 
              : 'bg-slate-100 border border-slate-200/60'
          }`}>
            {isMaxLevel ? (
              <Trophy className="w-5 h-5 text-amber-600" />
            ) : (
              <>
                <span className="text-base font-semibold text-slate-500">
                  {nextMilestone}
                </span>
                <Lock className="absolute -top-1 -right-1 w-3 h-3 text-slate-400 bg-white rounded-full p-0.5" />
              </>
            )}
          </div>
          
          {/* Text */}
          <div className="flex flex-col items-start min-w-0">
            <span className={`text-[11px] font-medium uppercase tracking-wide ${
              isMaxLevel ? 'text-amber-600/80' : 'text-slate-500/80'
            }`}>
              {isMaxLevel ? 'Complete' : 'Next Up'}
            </span>
            <span className={`text-[13px] font-semibold truncate ${
              isMaxLevel ? 'text-amber-800' : 'text-slate-600'
            }`}>
              {isMaxLevel ? 'All Milestones' : `${remaining} to go`}
            </span>
          </div>
        </motion.button>
      </div>
    </section>
  );
};
