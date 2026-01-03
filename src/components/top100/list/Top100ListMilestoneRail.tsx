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
 * Frosted glass design with light/white tiles.
 * 
 * Visual states:
 * - NEXT UP: Frosted white + subtle brand halo + breathing glow
 * - UNLOCKED: Frosted white + glass check badge
 * - LOCKED: Frosted white, muted text, no heavy grey-out
 * - COMPLETED (100 tile only): Trophy with subtle gold accent
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

      {/* Horizontal scrolling rail with fade hint */}
      <div className="relative">
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
        
        {/* Right fade gradient to hint more content */}
        <div 
          className="absolute right-0 top-0 bottom-1 w-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(248,250,252,0.9))',
          }}
        />
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

  // Frosted glass base styles
  const baseGlassStyles: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  // State-specific border and shadow
  const getBorderAndShadow = (): React.CSSProperties => {
    if (showCompletionHero) {
      return {
        border: '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: '0 0 16px 2px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(0,0,0,0.06)',
      };
    }
    if (isNextUp) {
      return {
        border: '1px solid rgba(15, 23, 42, 0.14)',
        boxShadow: '0 0 12px 2px hsl(var(--primary) / 0.12), 0 2px 8px rgba(0,0,0,0.06)',
      };
    }
    if (isUnlocked) {
      return {
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      };
    }
    // Locked - slightly muted but not dead
    return {
      border: '1px solid rgba(15, 23, 42, 0.06)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    };
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-[88px] h-[80px] rounded-2xl p-2.5 
        flex flex-col items-center justify-center gap-1
        transition-all duration-200 cursor-pointer
        ${isFirst ? 'ml-0' : ''} ${isLast ? 'mr-0' : ''}
        ${isLocked ? 'opacity-70' : ''}
      `}
      style={{ 
        scrollSnapAlign: 'start',
        ...baseGlassStyles,
        ...getBorderAndShadow(),
      }}
      aria-label={`Milestone ${threshold}: ${isUnlocked ? 'Complete' : isNextUp ? `${toGo} to go` : 'Locked'}`}
    >
      {/* Breathing glow for next up - respects reduced motion */}
      {isNextUp && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* NEXT UP pill label */}
      {isNextUp && (
        <span 
          className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{
            background: 'hsl(var(--primary) / 0.12)',
            color: 'hsl(var(--primary))',
          }}
        >
          Next Up
        </span>
      )}
      
      {/* Completed hero label */}
      {showCompletionHero && (
        <span 
          className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'rgb(180, 120, 20)',
          }}
        >
          Complete
        </span>
      )}

      {/* Main number or trophy */}
      <div className="relative">
        {showCompletionHero ? (
          <Trophy className="w-6 h-6" style={{ color: 'rgb(180, 120, 20)' }} />
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
        
        {/* Glass check badge for unlocked (non-100) */}
        {isUnlocked && !showCompletionHero && (
          <div 
            className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Check className="w-2.5 h-2.5 text-slate-500" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Subtext */}
      <span className={`text-[10px] font-medium ${
        showCompletionHero
          ? 'text-amber-700/80'
          : isNextUp 
            ? 'text-slate-500' 
            : isUnlocked 
              ? 'text-slate-400' 
              : 'text-slate-300'
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
