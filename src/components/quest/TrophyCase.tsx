/**
 * TrophyCase - Grid display for earned milestones/regions
 * V2: No card borders - badges float directly on background with premium checkmarks
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { PremiumCheckmark } from '@/components/quest/PremiumCheckmark';
import { QuestEmptyState } from '@/components/quest/QuestEmptyState';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';

// Import region badge images
import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

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

// Badge image mapping
const BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

// Region badge images and metadata
const REGION_BADGE_IMAGES: Record<string, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

const REGION_NAMES: Record<string, string> = {
  'gb-i': 'GB&I Top 100',
  'europe': 'Europe Top 100',
  'usa': 'USA Top 100',
  'global': 'Global Top 100',
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
  
  const showMilestones = filter === 'milestones';
  const hasUnlockedMilestones = unlockedMilestones.length > 0;

  return (
    <section>
      {/* Section header with toggle */}
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

      {/* Badge grid - V2: No card wrappers, badges float on background */}
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
                className="grid grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Unlocked milestones - badge only with premium checkmark */}
                {unlockedMilestones.map((m, index) => (
                  <motion.button
                    key={m.threshold}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                    className="relative flex flex-col items-center"
                  >
                    {/* Badge image - no card wrapper */}
                    <div className="relative">
                      <img
                        src={BADGE_IMAGES[m.threshold]}
                        alt={m.name}
                        className="w-16 h-20 object-contain"
                      />
                      {/* Premium gold checkmark */}
                      <PremiumCheckmark 
                        size="sm" 
                        className="absolute -bottom-1 -right-1"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#64748b] mt-1">
                      {m.threshold}
                    </span>
                  </motion.button>
                ))}
                
                {/* Next locked milestone - muted with lock */}
                {nextMilestone && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: unlockedMilestones.length * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(nextMilestone.threshold), threshold: nextMilestone.threshold })}
                    className="relative flex flex-col items-center opacity-40"
                  >
                    <div className="relative">
                      <img
                        src={BADGE_IMAGES[nextMilestone.threshold]}
                        alt={nextMilestone.name}
                        className="w-16 h-20 object-contain grayscale"
                      />
                      {/* Lock indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#94a3b8] mt-1">
                      {nextMilestone.threshold}
                    </span>
                  </motion.button>
                )}
              </motion.div>
            )
          ) : (
            // Regions view - V2: Badge-style cards without heavy borders
            <motion.div
              key="regions"
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {regions.map((r, index) => {
                const badgeImage = REGION_BADGE_IMAGES[r.id];
                const regionName = REGION_NAMES[r.id] || r.name;
                const progressPercent = r.total > 0 ? (r.played / r.total) * 100 : 0;
                
                return (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                    className={cn(
                      "relative flex flex-col items-center p-3 rounded-xl transition-all",
                      r.isUnlocked 
                        ? "bg-white/80 shadow-sm" 
                        : "bg-transparent"
                    )}
                  >
                    {/* Region badge image */}
                    <div className="relative mb-2">
                      <img
                        src={badgeImage}
                        alt={regionName}
                        className={cn(
                          "w-12 h-12 object-contain",
                          !r.isUnlocked && "opacity-40 grayscale-[60%]"
                        )}
                      />
                      
                      {/* Premium checkmark for completed */}
                      {r.isUnlocked && (
                        <PremiumCheckmark 
                          size="sm" 
                          className="absolute -bottom-1 -right-1"
                        />
                      )}
                    </div>
                    
                    {/* Region name */}
                    <span className={cn(
                      "text-xs font-semibold text-center",
                      r.isUnlocked ? "text-[#1e293b]" : "text-[#64748b]"
                    )}>
                      {regionName}
                    </span>
                    
                    {/* Progress indicator */}
                    <div className="w-full mt-2">
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${progressPercent}%`,
                            backgroundColor: r.isUnlocked ? '#D4AF37' : '#94a3b8'
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#64748b] mt-1">
                        {r.played}/{r.total}
                      </span>
                    </div>
                  </motion.button>
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
