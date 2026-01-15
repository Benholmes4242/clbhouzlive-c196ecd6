/**
 * TrophyCase - Grid display for earned milestones/regions
 * Hub-style toggle bar with compact achievement cards
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { QuestEmptyState } from '@/components/quest/QuestEmptyState';

type FilterMode = 'milestones' | 'regions';

interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface TrophyCaseProps {
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

export const TrophyCase: React.FC<TrophyCaseProps> = ({
  totalPlayed,
  regionProgress,
  onBadgeClick,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>('milestones');

  // Get milestone data
  const milestones = useMemo(() => {
    return CLUB_STEPS.map(step => ({
      threshold: step.threshold,
      name: `${step.threshold} Club`,
      tierName: step.tierName,
      isUnlocked: totalPlayed >= step.threshold,
    }));
  }, [totalPlayed]);

  const unlockedMilestones = milestones.filter(m => m.isUnlocked);
  const nextMilestone = milestones.find(m => !m.isUnlocked);
  
  // Get region data with unlock status
  const regions = useMemo(() => {
    return regionProgress.map(r => ({
      ...r,
      isUnlocked: r.played >= r.total && r.total > 0,
    }));
  }, [regionProgress]);
  
  // Determine what to show based on filter
  const showMilestones = filter === 'milestones';
  const hasUnlockedMilestones = unlockedMilestones.length > 0;
  const hasUnlockedRegions = regions.some(r => r.isUnlocked);

  return (
    <section>
      {/* Section header with Hub-style toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
          Trophy Case
        </h2>
        
        {/* Hub-style toggle bar */}
        <div className="inline-flex items-center gap-1 p-1 bg-[#e2e8f0] rounded-full">
          <button
            onClick={() => setFilter('milestones')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150",
              filter === 'milestones'
                ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
                : "text-[#64748b] hover:text-[#1e293b]"
            )}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilter('regions')}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150",
              filter === 'regions'
                ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
                : "text-[#64748b] hover:text-[#1e293b]"
            )}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Badge grid */}
      <div>
        <AnimatePresence mode="wait">
          {showMilestones ? (
            !hasUnlockedMilestones && !nextMilestone ? (
              <QuestEmptyState
                key="milestones-empty"
                icon={<Trophy className="w-7 h-7 text-[#64748b]" />}
                title="Start Your Collection"
                description="Play Top 100 courses to unlock achievement badges"
                action={{
                  label: "Explore Courses",
                  onClick: () => navigate('/top100'),
                }}
              />
            ) : (
              <motion.div
                key="milestones"
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Unlocked milestones */}
                {unlockedMilestones.map((m, index) => (
                  <motion.div
                    key={m.threshold}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                  >
                    <EliteGameCard
                      tier={String(m.threshold) as EliteCardTier}
                      earned={true}
                      currentProgress={totalPlayed}
                      targetProgress={m.threshold}
                      variant="compact"
                      enableAnimations={true}
                    />
                  </motion.div>
                ))}
                
                {/* Next locked milestone as ghost */}
                {nextMilestone && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: unlockedMilestones.length * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(nextMilestone.threshold), threshold: nextMilestone.threshold })}
                  >
                    <EliteGameCard
                      tier={String(nextMilestone.threshold) as EliteCardTier}
                      earned={false}
                      isGhost={false}
                      currentProgress={totalPlayed}
                      targetProgress={nextMilestone.threshold}
                      variant="compact"
                      enableAnimations={true}
                    />
                  </motion.div>
                )}
              </motion.div>
            )
          ) : (
            // Regions view
            <motion.div
              key="regions"
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {regions.map((r, index) => {
                const tier = REGION_TIER_MAP[r.id] || 'GBI';
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                  >
                    <EliteGameCard
                      tier={tier}
                      earned={r.isUnlocked}
                      isGhost={false}
                      currentProgress={r.played}
                      targetProgress={r.total}
                      variant="compact"
                      enableAnimations={true}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TrophyCase;
