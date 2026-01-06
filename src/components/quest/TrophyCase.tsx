/**
 * TrophyCase - Premium cabinet-style display for earned milestones/regions
 * 2-row grid with Milestones/Regions toggle and showcase state
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLUB_STEPS } from '@/lib/top100Club';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';

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
const REGION_TIER_MAP: Record<string, AchievementTier> = {
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
  
  // Latest earned badge (for showcase - slightly larger)
  const latestMilestone = unlockedMilestones[unlockedMilestones.length - 1];
  const latestRegion = unlockedRegions[unlockedRegions.length - 1];

  // Determine what to show based on filter
  const showMilestones = filter === 'milestones';
  const displayItems = showMilestones ? unlockedMilestones : unlockedRegions;
  const hasItems = displayItems.length > 0;
  const emptyMessage = showMilestones 
    ? 'Play 5 Top 100 courses to earn your first milestone'
    : 'Complete a regional Top 100 list to unlock';

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="quest-section-title">Trophy Case</h2>
        
        {/* Filter toggle */}
        <div 
          className="flex rounded-full p-0.5"
          style={{ 
            background: 'var(--quest-chip-bg)',
            border: '1px solid var(--quest-stroke)',
          }}
        >
          <button
            onClick={() => setFilter('milestones')}
            className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
            style={{
              background: filter === 'milestones' ? 'var(--quest-text-primary)' : 'transparent',
              color: filter === 'milestones' ? '#FFFFFF' : 'var(--quest-text-secondary)',
            }}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilter('regions')}
            className="px-3 py-1 text-xs font-semibold rounded-full transition-all"
            style={{
              background: filter === 'regions' ? 'var(--quest-text-primary)' : 'transparent',
              color: filter === 'regions' ? '#FFFFFF' : 'var(--quest-text-secondary)',
            }}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Trophy cabinet container */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow-sm), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
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
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {showMilestones ? (
                <>
                  {/* Milestones grid */}
                  {unlockedMilestones.map((m, index) => {
                    const isLatest = m.threshold === latestMilestone?.threshold;
                    return (
                      <motion.div
                        key={m.threshold}
                        className={isLatest ? 'col-span-2' : ''}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                      >
                        <AchievementBadgeCard
                          tier={String(m.threshold) as AchievementTier}
                          title={m.name}
                          subtitle={m.tierName}
                          unlocked={true}
                          status="UNLOCKED"
                          totalTop100Played={totalPlayed}
                          threshold={m.threshold}
                        />
                      </motion.div>
                    );
                  })}
                  {/* Show next locked milestone as ghost */}
                  {nextMilestone && (
                    <div 
                      className="col-span-2"
                      onClick={() => onBadgeClick?.({ type: 'milestone', id: String(nextMilestone.threshold), threshold: nextMilestone.threshold })}
                    >
                      <AchievementBadgeCard
                        tier={String(nextMilestone.threshold) as AchievementTier}
                        title={nextMilestone.name}
                        subtitle={nextMilestone.tierName}
                        unlocked={false}
                        isGhost={true}
                        remaining={nextMilestone.threshold - totalPlayed}
                        totalTop100Played={totalPlayed}
                        threshold={nextMilestone.threshold}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Regions grid */}
                  {regions.map((r, index) => {
                    const isLatest = r.id === latestRegion?.id;
                    const tier = REGION_TIER_MAP[r.id] || 'GBI';
                    return (
                      <motion.div
                        key={r.id}
                        className={isLatest && r.isUnlocked ? 'col-span-2' : ''}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                      >
                        <AchievementBadgeCard
                          tier={tier}
                          title={`${r.name} Complete`}
                          subtitle={`${r.played}/${r.total} courses`}
                          unlocked={r.isUnlocked}
                          isGhost={!r.isUnlocked}
                          status={r.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                          playedOnList={r.played}
                          totalOnList={r.total}
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
