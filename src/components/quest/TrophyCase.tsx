/**
 * TrophyCase - Grid display for earned milestones/regions/streaks/special achievements
 * Hub-style toggle bar with compact achievement cards
 * 
 * Phase 4: Added Streaks and Special tabs for new achievement types
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { QuestEmptyState } from '@/components/quest/QuestEmptyState';
import { useStreakAchievements } from '@/hooks/useStreakAchievements';
import { useCombinationAchievements } from '@/hooks/useCombinationAchievements';
import { STREAK_BADGE_IMAGES, COMBINATION_BADGE_IMAGES } from '@/lib/phase4BadgeAssets';

type FilterMode = 'milestones' | 'regions' | 'streaks' | 'special';

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
  onBadgeClick?: (badge: { type: 'milestone' | 'region' | 'streak' | 'combination'; id: string; threshold?: number }) => void;
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
  
  // Phase 4 hooks
  const { achievements: streakAchievements, currentStreak, isLoading: streaksLoading } = useStreakAchievements();
  const { achievements: combinationAchievements, isLoading: combinationsLoading } = useCombinationAchievements();

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
  const showRegions = filter === 'regions';
  const showStreaks = filter === 'streaks';
  const showSpecial = filter === 'special';
  
  const hasUnlockedMilestones = unlockedMilestones.length > 0;

  // Filter tabs
  const filterTabs: { id: FilterMode; label: string }[] = [
    { id: 'milestones', label: 'Milestones' },
    { id: 'regions', label: 'Regions' },
    { id: 'streaks', label: 'Streaks' },
    { id: 'special', label: 'Special' },
  ];

  return (
    <section>
      {/* Section header with Hub-style toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748b]">
          Trophy Case
        </h2>
        
        {/* Hub-style toggle bar - scrollable on mobile */}
        <div className="inline-flex items-center gap-0.5 p-1 bg-[#e2e8f0] rounded-full overflow-x-auto max-w-[240px]">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-2.5 py-1.5 text-[11px] font-medium rounded-full transition-all duration-150 whitespace-nowrap",
                filter === tab.id
                  ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
                  : "text-[#64748b] hover:text-[#1e293b]"
              )}
            >
              {tab.label}
            </button>
          ))}
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
          ) : showRegions ? (
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
          ) : showStreaks ? (
            // Streaks view (Phase 4)
            streaksLoading ? (
              <motion.div
                key="streaks-loading"
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                ))}
              </motion.div>
            ) : streakAchievements.length === 0 ? (
              <QuestEmptyState
                key="streaks-empty"
                icon={<Flame className="w-7 h-7 text-orange-500" />}
                title="Build Your Streak"
                description="Log courses in consecutive months to earn streak badges"
                action={{
                  label: "Rate a Course",
                  onClick: () => navigate('/top100'),
                }}
              />
            ) : (
              <motion.div
                key="streaks"
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {streakAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.achievement_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'streak', id: achievement.achievement_id, threshold: achievement.threshold_months })}
                  >
                    <StreakAchievementCard
                      achievement={achievement}
                      currentStreak={currentStreak}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )
          ) : showSpecial ? (
            // Special/Combination view (Phase 4)
            combinationsLoading ? (
              <motion.div
                key="special-loading"
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[16/9] rounded-lg bg-muted animate-pulse" />
                ))}
              </motion.div>
            ) : combinationAchievements.length === 0 ? (
              <QuestEmptyState
                key="special-empty"
                icon={<Globe className="w-7 h-7 text-blue-500" />}
                title="Unlock Special Achievements"
                description="Complete themed collections to earn special badges"
                action={{
                  label: "Explore Courses",
                  onClick: () => navigate('/top100'),
                }}
              />
            ) : (
              <motion.div
                key="special"
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {combinationAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.achievement_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'combination', id: achievement.achievement_id })}
                  >
                    <CombinationAchievementCard achievement={achievement} />
                  </motion.div>
                ))}
              </motion.div>
            )
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// STREAK ACHIEVEMENT CARD
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface StreakAchievementCardProps {
  achievement: {
    achievement_id: string;
    achievement_name: string;
    tier_name: string;
    threshold_months: number;
    is_earned: boolean;
    current_progress: number;
  };
  currentStreak: number;
}

const StreakAchievementCard: React.FC<StreakAchievementCardProps> = ({ achievement, currentStreak }) => {
  const badgeImage = STREAK_BADGE_IMAGES[achievement.threshold_months];
  const progressPercent = Math.min((currentStreak / achievement.threshold_months) * 100, 100);
  
  return (
    <div
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer",
        achievement.is_earned
          ? "bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-400/50 shadow-lg shadow-orange-500/10"
          : "bg-card/60 border-border/50 opacity-70"
      )}
    >
      {/* Badge image */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        {badgeImage ? (
          <img
            src={badgeImage}
            alt={achievement.tier_name}
            className={cn(
              "w-14 h-14 object-contain transition-all",
              !achievement.is_earned && "grayscale opacity-50"
            )}
          />
        ) : (
          <Flame className={cn(
            "w-10 h-10",
            achievement.is_earned ? "text-orange-500" : "text-muted-foreground"
          )} />
        )}
      </div>
      
      {/* Progress bar (when not earned) */}
      {!achievement.is_earned && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      
      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[10px] font-medium text-foreground/80">
          {achievement.tier_name}
        </span>
      </div>
      
      {/* Earned checkmark */}
      {achievement.is_earned && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COMBINATION ACHIEVEMENT CARD
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface CombinationAchievementCardProps {
  achievement: {
    achievement_id: string;
    achievement_name: string;
    tier_name: string;
    description: string;
    target_value: number;
    current_progress: number;
    is_earned: boolean;
  };
}

const CombinationAchievementCard: React.FC<CombinationAchievementCardProps> = ({ achievement }) => {
  const badgeImage = COMBINATION_BADGE_IMAGES[achievement.achievement_id];
  const progressPercent = Math.min((achievement.current_progress / achievement.target_value) * 100, 100);
  
  return (
    <div
      className={cn(
        "relative aspect-[4/3] rounded-xl overflow-hidden border transition-all cursor-pointer",
        achievement.is_earned
          ? "bg-gradient-to-br from-blue-500/20 to-emerald-600/10 border-blue-400/50 shadow-lg shadow-blue-500/10"
          : "bg-card/60 border-border/50"
      )}
    >
      {/* Badge image */}
      <div className="absolute top-2 left-2">
        {badgeImage ? (
          <img
            src={badgeImage}
            alt={achievement.tier_name}
            className={cn(
              "w-12 h-12 object-contain transition-all",
              !achievement.is_earned && "grayscale opacity-50"
            )}
          />
        ) : (
          <Globe className={cn(
            "w-8 h-8",
            achievement.is_earned ? "text-blue-500" : "text-muted-foreground"
          )} />
        )}
      </div>
      
      {/* Content */}
      <div className="absolute bottom-2 left-2 right-2">
        <h3 className="text-[11px] font-semibold text-foreground truncate">
          {achievement.achievement_name}
        </h3>
        <p className="text-[10px] text-muted-foreground truncate">
          {achievement.current_progress}/{achievement.target_value} • {achievement.tier_name}
        </p>
        
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all rounded-full",
              achievement.is_earned ? "bg-emerald-500" : "bg-blue-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* Earned checkmark */}
      {achievement.is_earned && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default TrophyCase;
