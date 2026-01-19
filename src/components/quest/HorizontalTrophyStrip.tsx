/**
 * HorizontalTrophyStrip - Horizontal swipe rail for trophy case
 * Snap-scroll, shows 4-5 badges partially to hint scrollability
 * Replaces stacked trophy tiles with dense horizontal strip
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

type FilterMode = 'milestones' | 'regions';

interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface HorizontalTrophyStripProps {
  totalPlayed: number;
  regionProgress: RegionProgress[];
  onBadgeClick?: (badge: { type: 'milestone' | 'region'; id: string; threshold?: number }) => void;
}

// Map region id to tier
const REGION_TIER_MAP: Record<string, EliteCardTier> = {
  'gb-i': 'GBI',
  'europe': 'EU',
  'usa': 'USA',
  'global': 'WORLD',
};

export const HorizontalTrophyStrip: React.FC<HorizontalTrophyStripProps> = ({
  totalPlayed,
  regionProgress,
  onBadgeClick,
}) => {
  const [filter, setFilter] = useState<FilterMode>('milestones');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track if we can scroll for fade indicators
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Get milestone data
  const milestones = useMemo(() => {
    return CLUB_STEPS.map(step => ({
      threshold: step.threshold,
      name: `${step.threshold} Club`,
      tierName: step.tierName,
      isUnlocked: totalPlayed >= step.threshold,
    }));
  }, [totalPlayed]);

  // Get region data
  const regions = useMemo(() => {
    return regionProgress.map(r => ({
      ...r,
      isUnlocked: r.played >= r.total && r.total > 0,
    }));
  }, [regionProgress]);

  // Check scroll position for fade indicators
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState);
      return () => el.removeEventListener('scroll', updateScrollState);
    }
  }, [filter]);

  const showMilestones = filter === 'milestones';

  return (
    <section>
      {/* Header with toggle - tighter spacing */}
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">
          Trophy Case
        </h2>
        
        {/* Compact toggle */}
        <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-200/80 rounded-full">
          <button
            onClick={() => setFilter('milestones')}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all duration-150",
              filter === 'milestones'
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilter('regions')}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all duration-150",
              filter === 'regions'
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Horizontal scroll strip with fade indicators */}
      <div className="relative">
        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth' }}
        >
          <AnimatePresence mode="wait">
            {showMilestones ? (
              milestones.map((m, index) => (
                <motion.div
                  key={m.threshold}
                  className="flex-shrink-0 snap-start"
                  style={{ width: '88px' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                >
                  <EliteGameCard
                    tier={String(m.threshold) as EliteCardTier}
                    earned={m.isUnlocked}
                    isGhost={!m.isUnlocked && milestones.findIndex(x => !x.isUnlocked) !== index}
                    currentProgress={totalPlayed}
                    targetProgress={m.threshold}
                    variant="compact"
                    enableAnimations={false}
                  />
                </motion.div>
              ))
            ) : (
              regions.map((r, index) => {
                const tier = REGION_TIER_MAP[r.id] || 'GBI';
                return (
                  <motion.div
                    key={r.id}
                    className="flex-shrink-0 snap-start"
                    style={{ width: '100px' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                  >
                    <EliteGameCard
                      tier={tier}
                      earned={r.isUnlocked}
                      isGhost={false}
                      currentProgress={r.played}
                      targetProgress={r.total}
                      variant="compact"
                      enableAnimations={false}
                    />
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HorizontalTrophyStrip;
