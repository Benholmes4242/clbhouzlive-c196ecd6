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

// Token dimensions - SDS global squircle shape (matches SquircleAvatar)
const TOKEN_SIZE = 78; // width
const TOKEN_HEIGHT = TOKEN_SIZE * 1.05; // SquircleAvatar uses aspectRatio: 1 / 1.05 (allows sub-pixel height)
const TOKEN_LABEL_HEIGHT = 22;
const SQUIRCLE_RADIUS = '34%'; // SDS squircle border-radius
const SQUIRCLE_RADIUS_PERCENT = 0.34; // Numeric version for SVG calculations
const RING_TRACK_COLOR = 'rgba(15,23,42,0.12)';

/**
 * Calculate the perimeter of a rounded rectangle (squircle with border-radius)
 * This matches CSS border-radius: 34% exactly
 */
function calculateRoundedRectPerimeter(w: number, h: number, rx: number, ry: number): number {
  // Perimeter = 2 * (straight edges) + elliptical corners
  const straightWidth = w - 2 * rx;
  const straightHeight = h - 2 * ry;
  // Approximate ellipse quarter arc: π/2 * sqrt((rx² + ry²) / 2) per corner
  const cornerArc = (Math.PI / 2) * Math.sqrt((rx * rx + ry * ry) / 2);
  return 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
}

/**
 * Horizontal swipeable milestone rail with collectible token design.
 * Regional color theming - each list has its own accent color.
 * 
 * Visual states:
 * - UNLOCKED: Solid regional accent ring
 * - NEXT UP: SVG progress arc (track + arc on same path)
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
    <section>
      {/* Header - Spacing: Header → token rail = 12px (S) */}
      <div className="px-4 flex items-center justify-between mb-3">
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

  // Calculate progress for next up (0..1)
  const getProgress = (): number => {
    if (!isNextUp) return isUnlocked || showCompletionHero ? 1 : 0;
    return Math.min(1, Math.max(0, playedCount / threshold));
  };

  const progress = getProgress();
  const ringThickness = showCompletionHero ? 4 : isNextUp ? 4 : isUnlocked ? 3 : 2;
  const ringBorderColor = (isUnlocked || showCompletionHero) ? theme.ringColor : RING_TRACK_COLOR;

  // For non-NEXT UP states, use CSS border ring
  const ringContainerStyle: React.CSSProperties = isNextUp ? {
    width: TOKEN_SIZE,
    height: TOKEN_HEIGHT,
    borderRadius: SQUIRCLE_RADIUS,
    border: 'none', // No CSS border for NEXT UP - SVG handles it
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: 'transparent',
  } : {
    width: TOKEN_SIZE,
    height: TOKEN_HEIGHT,
    borderRadius: SQUIRCLE_RADIUS,
    border: `${ringThickness}px solid ${ringBorderColor}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: 'transparent',
  };

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

  // SVG dimensions for NEXT UP ring - uses rect with rx/ry to match CSS border-radius: 34%
  const strokeWidth = 4;
  const inset = strokeWidth / 2;
  const rectWidth = TOKEN_SIZE - strokeWidth;
  const rectHeight = TOKEN_HEIGHT - strokeWidth;
  const rx = rectWidth * SQUIRCLE_RADIUS_PERCENT;
  const ry = rectHeight * SQUIRCLE_RADIUS_PERCENT;
  const perimeter = calculateRoundedRectPerimeter(rectWidth, rectHeight, rx, ry);

  const tokenButton = (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative flex-shrink-0 flex flex-col items-center justify-center cursor-pointer"
      style={{ 
        width: TOKEN_SIZE,
        height: TOKEN_HEIGHT + TOKEN_LABEL_HEIGHT,
      }}
      aria-label={`Milestone ${threshold}: ${isUnlocked ? 'Complete' : isNextUp ? aspirationalCopy : 'Locked'}`}
    >
      {/* Token container */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: TOKEN_SIZE, height: TOKEN_HEIGHT }}
      >
        {/* Subtle halo for next up only - uses regional color */}
        {isNextUp && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: theme.haloGradient, borderRadius: SQUIRCLE_RADIUS }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Ring container */}
        <div className="relative z-10" style={ringContainerStyle}>
          {/* NEXT UP: SVG squircle ring with track + progress arc using rect rx/ry to match SDS */}
          {isNextUp && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${TOKEN_SIZE} ${TOKEN_HEIGHT}`}
              fill="none"
            >
              {/* Track rect (grey, full squircle) */}
              <rect
                x={inset}
                y={inset}
                width={rectWidth}
                height={rectHeight}
                rx={rx}
                ry={ry}
                stroke={RING_TRACK_COLOR}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress arc (same geometry, overlays track) */}
              {prefersReducedMotion ? (
                <rect
                  x={inset}
                  y={inset}
                  width={rectWidth}
                  height={rectHeight}
                  rx={rx}
                  ry={ry}
                  stroke={theme.ringColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${progress * perimeter} ${perimeter}`}
                  strokeDashoffset={perimeter * 0.25}
                />
              ) : (
                <motion.rect
                  x={inset}
                  y={inset}
                  width={rectWidth}
                  height={rectHeight}
                  rx={rx}
                  ry={ry}
                  stroke={theme.ringColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDashoffset={perimeter * 0.25}
                  initial={{ strokeDasharray: `0 ${perimeter}` }}
                  animate={{ strokeDasharray: `${progress * perimeter} ${perimeter}` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              )}
            </svg>
          )}

          {/* Center content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {showCompletionHero ? (
              <Trophy className="w-6 h-6" style={{ color: theme.ringColor }} />
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
