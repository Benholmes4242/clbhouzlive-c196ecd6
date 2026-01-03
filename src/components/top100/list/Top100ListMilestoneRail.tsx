import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { 
  getAllMilestonesWithState, 
  getListMilestoneState,
  type ListMilestoneInfo,
} from '@/lib/listMilestoneSystem';
import { getRegionTheme, getAspirationalCopy, getMilestoneTooltip } from '@/lib/regionTheme';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Top100ListMilestoneRailProps {
  playedCount: number;
  listSlug?: string;
  onViewAll?: () => void;
}

// Token dimensions - squircle shape
const TOKEN_SIZE = 78;
const SQUIRCLE_INSET = 8;
const SQUIRCLE_SIZE = TOKEN_SIZE - (SQUIRCLE_INSET * 2);
const SQUIRCLE_RADIUS = 16; // Corner radius for squircle
// Perimeter approximation for rounded rect (for stroke dash)
const SQUIRCLE_PERIMETER = (SQUIRCLE_SIZE * 2 + SQUIRCLE_SIZE * 2) - (8 * SQUIRCLE_RADIUS) + (2 * Math.PI * SQUIRCLE_RADIUS);

/**
 * Horizontal swipeable milestone rail with collectible token design.
 * Regional color theming - each list has its own accent color.
 * 
 * Visual states:
 * - UNLOCKED: Solid regional accent ring
 * - NEXT UP: Animated progress arc in regional color + aspirational copy
 * - LOCKED: Thin neutral grey ring
 * - COMPLETED (100 tile only): Trophy with gold accent
 */
export const Top100ListMilestoneRail: React.FC<Top100ListMilestoneRailProps> = ({
  playedCount,
  listSlug = 'global',
  onViewAll,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextUpRef = useRef<HTMLButtonElement>(null);
  const [milestones, setMilestones] = useState<ListMilestoneInfo[]>([]);

  // Get regional theme
  const theme = getRegionTheme(listSlug);

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
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <TooltipProvider delayDuration={200}>
            {milestones.map((milestone) => (
              <MilestoneToken
                key={milestone.threshold}
                ref={milestone.state === 'next_up' ? nextUpRef : undefined}
                milestone={milestone}
                playedCount={playedCount}
                isListComplete={isComplete}
                theme={theme}
                onClick={handleTileClick}
              />
            ))}
          </TooltipProvider>
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
  theme: ReturnType<typeof getRegionTheme>;
  onClick: () => void;
}

const MilestoneToken = React.forwardRef<HTMLButtonElement, MilestoneTokenProps>(({
  milestone,
  playedCount,
  isListComplete,
  theme,
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
  const strokeDashoffset = SQUIRCLE_PERIMETER * (1 - progress);

  // Ring styling per state - using regional color for unlocked/next up
  const getRingConfig = () => {
    if (showCompletionHero) {
      return { stroke: 'rgb(180, 130, 50)', strokeWidth: 3.5, opacity: 1 };
    }
    if (isUnlocked) {
      return { stroke: theme.ringColor, strokeWidth: 3, opacity: 1 };
    }
    if (isNextUp) {
      return { stroke: theme.ringColor, strokeWidth: 4, opacity: 1 };
    }
    // Locked - neutral grey, thin
    return { stroke: 'rgb(203, 213, 225)', strokeWidth: 2, opacity: 0.6 };
  };

  const ringConfig = getRingConfig();

  // Aspirational copy for next up
  const aspirationalCopy = isNextUp && toGo !== undefined 
    ? getAspirationalCopy(toGo, threshold) 
    : null;

  // Tooltip for detailed progress
  const tooltipText = isNextUp && toGo !== undefined
    ? getMilestoneTooltip(playedCount, toGo, threshold)
    : isUnlocked
      ? `Milestone achieved — ${threshold} courses played.`
      : `Unlocks at ${threshold} courses played.`;

  const tokenButton = (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative flex-shrink-0 flex flex-col items-center justify-center cursor-pointer"
      style={{ 
        width: TOKEN_SIZE,
        height: TOKEN_SIZE + 22,
      }}
      aria-label={`Milestone ${threshold}: ${isUnlocked ? 'Complete' : isNextUp ? aspirationalCopy : 'Locked'}`}
    >
      {/* Token container with SVG ring */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: TOKEN_SIZE, height: TOKEN_SIZE }}
      >
        {/* Subtle halo for next up only - uses regional color */}

        {isNextUp && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-[18px] pointer-events-none"
            style={{ background: theme.haloGradient }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* SVG Squircle Ring */}
        <svg 
          width={TOKEN_SIZE} 
          height={TOKEN_SIZE} 
          className="absolute inset-0"
        >
          {/* Base squircle ring (structure) */}
          <rect
            x={SQUIRCLE_INSET}
            y={SQUIRCLE_INSET}
            width={SQUIRCLE_SIZE}
            height={SQUIRCLE_SIZE}
            rx={SQUIRCLE_RADIUS}
            ry={SQUIRCLE_RADIUS}
            fill="none"
            stroke={isLocked ? 'rgb(226, 232, 240)' : 'rgba(15, 23, 42, 0.05)'}
            strokeWidth={isLocked ? 2 : 1}
          />
          
          {/* Progress/solid squircle ring - uses regional color */}
          {(isUnlocked || isNextUp || showCompletionHero) && (
            <motion.rect
              x={SQUIRCLE_INSET}
              y={SQUIRCLE_INSET}
              width={SQUIRCLE_SIZE}
              height={SQUIRCLE_SIZE}
              rx={SQUIRCLE_RADIUS}
              ry={SQUIRCLE_RADIUS}
              fill="none"
              stroke={ringConfig.stroke}
              strokeWidth={ringConfig.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={SQUIRCLE_PERIMETER}
              initial={isNextUp && !prefersReducedMotion ? { strokeDashoffset: SQUIRCLE_PERIMETER } : { strokeDashoffset }}
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

      {/* Subtext below token - aspirational copy for next up */}
      <span className={`text-[10px] font-medium mt-1 ${
        showCompletionHero
          ? 'text-amber-700/80'
          : isNextUp 
            ? 'text-slate-600' 
            : isUnlocked 
              ? 'text-slate-500' 
              : 'text-slate-400'
      }`}>
        {isNextUp && aspirationalCopy
          ? aspirationalCopy
          : isUnlocked || showCompletionHero
            ? 'Complete'
            : ''
        }
      </span>

      {/* NEXT UP label pill - uses regional text color */}
      {isNextUp && (
        <span 
          className="absolute -top-0.5 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.ringColor}`,
            color: theme.ringColor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Next Up
        </span>
      )}
    </motion.button>
  );

  // Wrap with tooltip for detailed progress info
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {tokenButton}
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        className="max-w-[200px] text-center text-xs"
        sideOffset={4}
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
});

MilestoneToken.displayName = 'MilestoneToken';
