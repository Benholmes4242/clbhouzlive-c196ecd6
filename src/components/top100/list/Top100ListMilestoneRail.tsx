import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import { 
  getAllMilestonesWithState, 
  getListMilestoneState,
  type ListMilestoneInfo,
} from '@/lib/listMilestoneSystem';

interface Top100ListMilestoneRailProps {
  playedCount: number;
  onViewAll?: () => void;
}

/**
 * Horizontal swipeable milestone rail for Top 100 list pages.
 * Shows all milestones with NEXT UP, UNLOCKED, and LOCKED states.
 * 
 * Visual states (dark-mode only):
 * - NEXT UP: Strongest glow + subtle pulse animation
 * - UNLOCKED: Moderate glow, static, check icon
 * - LOCKED: No glow, reduced opacity
 * - COMPLETED (100 tile only): Trophy with gold glow
 */
export const Top100ListMilestoneRail: React.FC<Top100ListMilestoneRailProps> = ({
  playedCount,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextUpRef = useRef<HTMLButtonElement>(null);
  const [milestones, setMilestones] = useState<ListMilestoneInfo[]>([]);

  // Get milestone states
  useEffect(() => {
    setMilestones(getAllMilestonesWithState(playedCount));
  }, [playedCount]);

  // Auto-scroll to next up milestone on mount using scrollIntoView
  useEffect(() => {
    if (!nextUpRef.current) return;
    
    // Small delay to ensure layout is complete
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
      {/* Header: YOUR MILESTONES + See all → */}
      <div className="px-4 flex items-center justify-between mb-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Your Milestones
        </h2>
        <button
          onClick={handleTileClick}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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
            ref={milestone.state === 'next_up' ? nextUpRef : undefined}
            milestone={milestone}
            isFirst={index === 0}
            isLast={index === milestones.length - 1}
            isListComplete={isComplete}
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
  isListComplete: boolean;
  onClick: () => void;
}

const MilestoneTile = React.forwardRef<HTMLButtonElement, MilestoneTileProps>(({
  milestone,
  isFirst,
  isLast,
  isListComplete,
  onClick,
}, ref) => {
  const { threshold, state, toGo } = milestone;

  // State-based styling
  const isNextUp = state === 'next_up';
  const isUnlocked = state === 'unlocked';
  const isLocked = state === 'locked';
  
  // Only the 100 tile gets hero completion styling
  const isHundredTile = threshold === 100;
  const showCompletionHero = isListComplete && isHundredTile;

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Dark-mode container classes
  const containerClasses = `
    relative flex-shrink-0 w-[88px] h-[80px] rounded-2xl p-2.5 
    flex flex-col items-center justify-center gap-1
    transition-all duration-200 cursor-pointer
    ${isFirst ? 'ml-0' : ''} ${isLast ? 'mr-0' : ''}
    ${showCompletionHero 
      ? 'bg-gradient-to-br from-amber-900/40 to-amber-950/60 border border-amber-500/30' 
      : isNextUp 
        ? 'bg-gradient-to-br from-slate-700/80 to-slate-800/90 border border-primary/40' 
        : isUnlocked 
          ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/60 border border-slate-600/40' 
          : 'bg-slate-800/40 border border-slate-700/30 opacity-50'
    }
  `;

  // Glow effect - dark mode friendly
  const glowStyles = showCompletionHero ? {
    boxShadow: '0 0 20px 3px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3)',
  } : isNextUp ? {
    boxShadow: '0 0 20px 4px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0, 0, 0, 0.25)',
  } : isUnlocked ? {
    boxShadow: '0 0 10px 2px rgba(148, 163, 184, 0.1)',
  } : {};

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={containerClasses}
      style={{ 
        scrollSnapAlign: 'start',
        ...glowStyles,
      }}
      aria-label={`Milestone ${threshold}: ${isUnlocked ? 'Complete' : isNextUp ? `${toGo} to go` : 'Locked'}`}
    >
      {/* Pulse animation for next up - respects reduced motion */}
      {isNextUp && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* State label - only show on next up tile */}
      {isNextUp && (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
          Next Up
        </span>
      )}
      
      {/* Show label for completed hero */}
      {showCompletionHero && (
        <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-400">
          Complete
        </span>
      )}

      {/* Main number or trophy */}
      <div className="relative">
        {showCompletionHero ? (
          <Trophy className="w-6 h-6 text-amber-400" />
        ) : (
          <span className={`text-xl font-bold ${
            isNextUp 
              ? 'text-foreground' 
              : isUnlocked 
                ? 'text-foreground/90' 
                : 'text-muted-foreground/60'
          }`}>
            {threshold}
          </span>
        )}
        
        {/* Check icon for unlocked (non-100) */}
        {isUnlocked && !showCompletionHero && (
          <div className="absolute -top-0.5 -right-2 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Subtext - streamlined */}
      <span className={`text-[10px] font-medium ${
        showCompletionHero
          ? 'text-amber-400/80'
          : isNextUp 
            ? 'text-muted-foreground' 
            : isUnlocked 
              ? 'text-muted-foreground/80' 
              : 'text-muted-foreground/40'
      }`}>
        {isNextUp && toGo !== undefined 
          ? `${toGo} to go` 
          : isUnlocked || showCompletionHero
            ? `${threshold} Complete`
            : ''
        }
      </span>
    </motion.button>
  );
});

MilestoneTile.displayName = 'MilestoneTile';
