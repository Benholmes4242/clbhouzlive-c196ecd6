/**
 * TrophyCase - Premium cabinet-style display for earned milestones/regions
 * 2-row grid with Milestones/Regions toggle and showcase state
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const unlockedRegions = regions.filter(r => r.isUnlocked);
  
  // Determine what to show based on filter
  const showMilestones = filter === 'milestones';
  const displayItems = showMilestones ? unlockedMilestones : unlockedRegions;
  const hasItems = displayItems.length > 0;
  const emptyMessage = showMilestones 
    ? 'Play 5 Top 100 courses to earn your first milestone'
    : 'Complete a regional Top 100 list to unlock';

  return (
    <section>
      {/* Section header with inline toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trophy Case</h2>
        
        {/* Filter toggle */}
        <div className="flex rounded-full p-0.5 bg-slate-100 border border-slate-200/60">
          <button
            onClick={() => setFilter('milestones')}
            className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
            style={{
              background: filter === 'milestones' ? 'var(--surface-slate)' : 'transparent',
              color: filter === 'milestones' ? '#FFFFFF' : 'var(--quest-text-secondary)',
            }}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilter('regions')}
            className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
            style={{
              background: filter === 'regions' ? 'var(--surface-slate)' : 'transparent',
              color: filter === 'regions' ? '#FFFFFF' : 'var(--quest-text-secondary)',
            }}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Badge grid */}
      <div>
        <AnimatePresence mode="wait">
          {!hasItems ? (
            <motion.div
              key="empty"
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p 
                className="text-sm"
                style={{ color: 'var(--quest-text-tertiary)' }}
              >
                {emptyMessage}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              className="grid grid-cols-3 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {showMilestones ? (
                <>
                  {/* Milestones mini-grid */}
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
                        title={m.name}
                        subtitle={m.tierName}
                        compact={true}
                        enableAnimations={false}
                        quality="low"
                      />
                    </motion.div>
                  ))}
                  {/* Show next locked milestone as ghost */}
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
                        isGhost={true}
                        currentProgress={totalPlayed}
                        targetProgress={nextMilestone.threshold}
                        title={nextMilestone.name}
                        subtitle={nextMilestone.tierName}
                        compact={true}
                        enableAnimations={false}
                        quality="low"
                      />
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  {/* Regions mini-grid */}
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
                          isGhost={!r.isUnlocked}
                          currentProgress={r.played}
                          targetProgress={r.total}
                          title={`${r.name} Complete`}
                          subtitle={`${r.played}/${r.total} courses`}
                          compact={true}
                          enableAnimations={false}
                          quality="low"
                        />
                      </motion.div>
                    );
                  })}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TrophyCase;
