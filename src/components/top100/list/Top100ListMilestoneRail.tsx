import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { 
  getAllMilestonesWithState, 
  getListMilestoneState,
  type ListMilestoneInfo,
} from '@/lib/listMilestoneSystem';

interface Top100ListMilestoneRailProps {
  playedCount: number;
  onViewAll?: () => void;
}

// SVG ring dimensions
const TOKEN_SIZE = 76;
const RING_RADIUS = 32;
const RING_CENTER = TOKEN_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Horizontal swipeable milestone rail with collectible token design.
 * SVG progress rings with frosted glass backgrounds.
 * 
 * Visual states:
 * - UNLOCKED: Solid brand accent ring + frosted glass
 * - NEXT UP: Animated progress arc showing playedCount/nextMilestone
 * - LOCKED: Thin neutral grey ring + muted text
 * - COMPLETED (100 tile only): Trophy with subtle gold ring
 */
export const Top100ListMilestoneRail: React.FC<Top100ListMilestoneRailProps> = ({
  playedCount,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextUpRef = useRef<HTMLButtonElement>(null);
  const [milestones, setMilestones] = useState<ListMilestoneInfo[]>([]);

  useEffect(() => {
    setMilestones(getAllMilestonesWithState(playedCount));
  }, [playedCount]);

  // Auto-scroll to next up milestone on mount
  useEffect(() => {
    if (!nextUpRef.current) return;
    
    const timer = setTimeout(() => {
      nextUpRef.current?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }, 100);
    
    return () => clearTimeout(timer);
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
      {/* Header */}
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
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {milestones.map((milestone, index) => (
            <MilestoneToken
              key={milestone.threshold}
              ref={milestone.state === 'next_up' ? nextUpRef : undefined}
              milestone={milestone}
              playedCount={playedCount}
              isListComplete={isComplete}
              onClick={handleTileClick}
            />
          ))}
        </div>
        
        {/* Right fade gradient */}
        <div 
          className="absolute right-0 top-0 bottom-2 w-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(248,250,252,0.95))',
          }}
        />
      </div>
    </section>
  );
};

interface MilestoneTokenProps {
  milestone: ListMilestoneInfo;
  playedCount: number;
  isListComplete: boolean;
  onClick: () => void;
}

const MilestoneToken = React.forwardRef<HTMLButtonElement, MilestoneTokenProps>(({
  milestone,
  playedCount,
  isListComplete,
  onClick,
}, ref) => {
  const { threshold, state, toGo } = milestone;

  const isNextUp = state === 'next_up';
  const isUnlocked = state === 'unlocked';
  const isLocked = state === 'locked';
  
  const isHundredTile = threshold === 100;
  const showCompletionHero = isListComplete && isHundredTile;

  // Reduced motion check
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Calculate progress for next up (arc percentage)
  const getProgress = (): number => {
    if (!isNextUp) return isUnlocked ? 1 : 0;
    return Math.min(1, Math.max(0, playedCount / threshold));
  };

  const progress = getProgress();
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Ring styling per state
  const getRingConfig = () => {
    if (showCompletionHero) {
      return { stroke: 'rgb(180, 130, 50)', strokeWidth: 3, opacity: 1 };
    }
    if (isUnlocked) {
      return { stroke: 'hsl(var(--primary))', strokeWidth: 3, opacity: 1 };
    }
    if (isNextUp) {
      return { stroke: 'hsl(var(--primary))', strokeWidth: 4, opacity: 1 };
    }
    // Locked
    return { stroke: 'rgb(203, 213, 225)', strokeWidth: 2, opacity: 0.7 };
  };

  const ringConfig = getRingConfig();

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative flex-shrink-0 flex flex-col items-center justify-center cursor-pointer"
      style={{ 
        width: TOKEN_SIZE,
        height: TOKEN_SIZE + 20,
        scrollSnapAlign: 'start',
      }}
      aria-label={`Milestone ${threshold}: ${isUnlocked ? 'Complete' : isNextUp ? `${toGo} to go` : 'Locked'}`}
    >
      {/* Token container with SVG ring */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: TOKEN_SIZE, height: TOKEN_SIZE }}
      >
        {/* Frosted glass background (squircle shape) */}
        <div 
          className="absolute inset-[6px] rounded-[18px]"
          style={{
            background: isLocked 
              ? 'rgba(255, 255, 255, 0.75)' 
              : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: isNextUp 
              ? '0 2px 12px rgba(0,0,0,0.06)' 
              : '0 1px 6px rgba(0,0,0,0.04)',
          }}
        />

        {/* Subtle halo for next up only */}
        {isNextUp && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 60%)',
            }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* SVG Ring */}
        <svg 
          width={TOKEN_SIZE} 
          height={TOKEN_SIZE} 
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Base ring (always visible for structure) */}
          <circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={isLocked ? 'rgb(226, 232, 240)' : 'rgba(15, 23, 42, 0.06)'}
            strokeWidth={isLocked ? 2 : 1}
          />
          
          {/* Progress/solid ring */}
          {(isUnlocked || isNextUp || showCompletionHero) && (
            <motion.circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke={ringConfig.stroke}
              strokeWidth={ringConfig.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={isNextUp && !prefersReducedMotion ? { strokeDashoffset: CIRCUMFERENCE } : { strokeDashoffset }}
              animate={{ strokeDashoffset }}
              transition={
                isNextUp && !prefersReducedMotion 
                  ? { duration: 0.8, ease: 'easeOut', delay: 0.2 }
                  : { duration: 0 }
              }
              style={{ opacity: ringConfig.opacity }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {showCompletionHero ? (
            <Trophy className="w-6 h-6" style={{ color: 'rgb(180, 130, 50)' }} />
          ) : (
            <span className={`text-xl font-bold ${
              isNextUp 
                ? 'text-slate-800' 
                : isUnlocked 
                  ? 'text-slate-700' 
                  : 'text-slate-400'
            }`}>
              {threshold}
            </span>
          )}
        </div>
      </div>

      {/* Subtext below token */}
      <span className={`text-[10px] font-medium mt-1 ${
        showCompletionHero
          ? 'text-amber-700/80'
          : isNextUp 
            ? 'text-slate-600' 
            : isUnlocked 
              ? 'text-slate-500' 
              : 'text-slate-400'
      }`}>
        {isNextUp && toGo !== undefined 
          ? `${toGo} to go`
          : isUnlocked || showCompletionHero
            ? 'Complete'
            : ''
        }
      </span>

      {/* NEXT UP label pill */}
      {isNextUp && (
        <span 
          className="absolute -top-0.5 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            color: 'hsl(var(--primary))',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Next Up
        </span>
      )}
    </motion.button>
  );
});

MilestoneToken.displayName = 'MilestoneToken';
