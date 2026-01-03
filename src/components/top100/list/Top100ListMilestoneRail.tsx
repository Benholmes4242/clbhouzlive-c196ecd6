import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import { 
  getAllMilestonesWithState, 
  getListMilestoneState,
  type ListMilestoneInfo,
  LIST_MILESTONE_THRESHOLDS,
} from '@/lib/listMilestoneSystem';

interface Top100ListMilestoneRailProps {
  playedCount: number;
  onViewAll?: () => void;
}

/**
 * Horizontal swipeable milestone rail for Top 100 list pages.
 * Shows all milestones with NEXT UP, UNLOCKED, and LOCKED states.
 * 
 * Visual states:
 * - NEXT UP: Strongest glow + subtle pulse animation
 * - UNLOCKED: Moderate glow, static, check icon
 * - LOCKED: No glow, reduced opacity
 */
export const Top100ListMilestoneRail: React.FC<Top100ListMilestoneRailProps> = ({
  playedCount,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [milestones, setMilestones] = useState<ListMilestoneInfo[]>([]);

  // Get milestone states
  useEffect(() => {
    setMilestones(getAllMilestonesWithState(playedCount));
  }, [playedCount]);

  // Auto-scroll to next up milestone on mount
  useEffect(() => {
    if (!scrollRef.current || milestones.length === 0) return;
    
    const nextUpIndex = milestones.findIndex((m) => m.state === 'next_up');
    if (nextUpIndex > 0) {
      const tileWidth = 100; // Approximate tile width + gap
      const scrollPosition = Math.max(0, (nextUpIndex - 0.5) * tileWidth);
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [milestones]);

  const handleTileClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/achievements');
    }
  };

  const { isComplete } = getListMilestoneState(playedCount);

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

      {/* Horizontal scrolling rail */}
      <div 
        ref={scrollRef}
        className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-1"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {milestones.map((milestone, index) => (
          <MilestoneTile
            key={milestone.threshold}
            milestone={milestone}
            isFirst={index === 0}
            isLast={index === milestones.length - 1}
            isCompleteList={isComplete && milestone.threshold === 100}
            onClick={handleTileClick}
          />
        ))}
      </div>
    </section>
  );
};

interface MilestoneTileProps {
  milestone: ListMilestoneInfo;
  isFirst: boolean;
  isLast: boolean;
  isCompleteList: boolean;
  onClick: () => void;
}

const MilestoneTile: React.FC<MilestoneTileProps> = ({
  milestone,
  isFirst,
  isLast,
  isCompleteList,
  onClick,
}) => {
  const { threshold, state, label, toGo } = milestone;

  // State-based styling
  const isNextUp = state === 'next_up';
  const isUnlocked = state === 'unlocked';
  const isLocked = state === 'locked';

  // Build container classes
  const containerClasses = `
    relative flex-shrink-0 w-[88px] h-[80px] rounded-2xl p-2.5 
    flex flex-col items-center justify-center gap-1
    transition-all duration-200 cursor-pointer
    ${isFirst ? 'ml-0' : ''} ${isLast ? 'mr-0' : ''}
    ${isNextUp 
      ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg' 
      : isUnlocked 
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200/60' 
        : isCompleteList 
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60'
          : 'bg-slate-100/80 border border-slate-200/40 opacity-60'
    }
  `;

  // Glow effect for next up
  const glowStyles = isNextUp ? {
    boxShadow: '0 0 20px 2px rgba(71, 85, 105, 0.35), 0 4px 12px rgba(0, 0, 0, 0.15)',
  } : isUnlocked ? {
    boxShadow: '0 0 10px 1px rgba(16, 185, 129, 0.15)',
  } : isCompleteList ? {
    boxShadow: '0 0 15px 2px rgba(245, 158, 11, 0.25)',
  } : {};

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={containerClasses}
      style={{ 
        scrollSnapAlign: 'start',
        ...glowStyles,
      }}
      aria-label={`Milestone ${threshold}: ${label}`}
    >
      {/* Pulse animation for next up */}
      {isNextUp && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-white/5"
          animate={{
            opacity: [0, 0.15, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* State label */}
      <span className={`text-[9px] font-semibold uppercase tracking-wider ${
        isNextUp 
          ? 'text-white/80' 
          : isUnlocked 
            ? 'text-emerald-600/80' 
            : isCompleteList 
              ? 'text-amber-600/80'
              : 'text-slate-400'
      }`}>
        {isNextUp ? 'Next Up' : isUnlocked ? 'Unlocked' : isCompleteList ? 'Complete' : ''}
      </span>

      {/* Main number or trophy */}
      <div className="relative">
        {isCompleteList ? (
          <Trophy className={`w-6 h-6 ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`} />
        ) : (
          <span className={`text-xl font-bold ${
            isNextUp 
              ? 'text-white' 
              : isUnlocked 
                ? 'text-emerald-700' 
                : 'text-slate-400'
          }`}>
            {threshold}
          </span>
        )}
        
        {/* Check icon for unlocked (non-100) */}
        {isUnlocked && !isCompleteList && (
          <div className="absolute -top-0.5 -right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Subtext */}
      <span className={`text-[10px] font-medium ${
        isNextUp 
          ? 'text-white/70' 
          : isUnlocked 
            ? 'text-emerald-600/80' 
            : isCompleteList 
              ? 'text-amber-600/80'
              : 'text-slate-400'
      }`}>
        {isNextUp && toGo !== undefined 
          ? `${toGo} to go` 
          : isUnlocked || isCompleteList
            ? `${threshold} Complete`
            : ''
        }
      </span>
    </motion.button>
  );
};
