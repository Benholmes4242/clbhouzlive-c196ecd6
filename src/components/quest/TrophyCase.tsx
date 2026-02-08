/**
 * TrophyCase - Apple-level polish for earned milestones/regions
 * V4: Shows all milestones with progress, visual differentiation for earned/next/locked
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { QuestEmptyState } from '@/components/quest/QuestEmptyState';
import { Trophy } from 'lucide-react';

// Import badge images
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

// Import region badge images
import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';

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

// Club names for each threshold
const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

// Region badge images
const REGION_BADGE_IMAGES: Record<string, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

// Region display names
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
      name: CLUB_NAMES[step.threshold] || `${step.threshold} Club`,
      tierName: step.tierName,
      isUnlocked: totalPlayed >= step.threshold,
    }));
  }, [totalPlayed]);

  // Find last earned index (compatible without ES2023)
  let lastEarnedIndex = -1;
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (milestones[i].isUnlocked) { lastEarnedIndex = i; break; }
  }
  const nextMilestoneIndex = milestones.findIndex(m => !m.isUnlocked);
  
  // Show earned + next 3 locked milestones (or all if few remain)
  const visibleMilestones = useMemo(() => {
    return milestones.filter((m, i) => {
      if (m.isUnlocked) return true;
      // Show next 3 locked milestones after the last earned
      return i <= lastEarnedIndex + 3;
    });
  }, [milestones, lastEarnedIndex]);
  
  // Get region data with unlock status
  const regions = useMemo(() => {
    return regionProgress.map(r => ({
      ...r,
      isUnlocked: r.played >= r.total && r.total > 0,
    }));
  }, [regionProgress]);
  
  const showMilestones = filter === 'milestones';
  const hasAnyMilestones = visibleMilestones.length > 0;

  return (
    <section>
      {/* Section header with toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Trophy Case
        </h2>
        
        {/* Hub-style toggle bar */}
        <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-full border border-border/50">
          <button
            onClick={() => setFilter('milestones')}
            className={cn(
              "px-3 min-h-[44px] text-xs font-medium rounded-full transition-all duration-200 active:scale-[0.98]",
              filter === 'milestones'
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilter('regions')}
            className={cn(
              "px-3 min-h-[44px] text-xs font-medium rounded-full transition-all duration-200 active:scale-[0.98]",
              filter === 'regions'
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Regions
          </button>
        </div>
      </div>

      {/* Badge grid */}
      <AnimatePresence mode="wait">
        {showMilestones ? (
          !hasAnyMilestones ? (
            <QuestEmptyState
              key="milestones-empty"
              icon={<Trophy className="w-7 h-7 text-muted-foreground" />}
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
              className="flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {visibleMilestones.map((m, index) => {
                const isNext = index === nextMilestoneIndex;
                const remaining = m.threshold - totalPlayed;

                return (
                  <motion.button
                    key={m.threshold}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                    className="flex flex-col items-center group active:scale-[0.97]"
                  >
                    {/* Badge with visual state differentiation */}
                    <div className="relative mb-2">
                      {/* Earned: subtle glow */}
                      {m.isUnlocked && (
                        <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-md scale-110" />
                      )}
                      {/* Next up: pulsing amber ring */}
                      {isNext && !m.isUnlocked && (
                        <div className="absolute inset-[-4px] rounded-full border-2 border-amber-400/60 animate-pulse" />
                      )}
                      <img
                        src={BADGE_IMAGES[m.threshold]}
                        alt={m.name}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "object-contain transition-transform duration-200 group-hover:scale-105",
                          m.isUnlocked 
                            ? "w-[88px] h-[110px] drop-shadow-md" 
                            : isNext 
                              ? "w-[88px] h-[110px] opacity-75 grayscale-[30%]"
                              : "w-[72px] h-[90px] opacity-40 grayscale-[60%]"
                        )}
                      />
                    </div>
                    {/* Club name */}
                    <span className={cn(
                      "text-xs font-semibold text-center transition-colors",
                      m.isUnlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {m.name}
                    </span>
                    {/* Progress text under locked badges */}
                    {!m.isUnlocked && isNext && (
                      <span className="text-xs text-amber-600 font-semibold tabular-nums mt-0.5">
                        {remaining} away!
                      </span>
                    )}
                    {!m.isUnlocked && !isNext && (
                      <span className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {totalPlayed}/{m.threshold} played
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )
        ) : (
          // Regions view
          <motion.div
            key="regions"
            className="flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {regions.map((r, index) => {
              const badgeImage = REGION_BADGE_IMAGES[r.id];
              const regionName = REGION_NAMES[r.id] || r.name;
              
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                  className="flex flex-col items-center group active:scale-[0.97]"
                >
                  {/* Region badge */}
                  <div className="relative mb-2">
                    {r.isUnlocked && (
                      <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-md scale-110" />
                    )}
                    <img
                      src={badgeImage}
                      alt={regionName}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-[88px] h-[88px] object-contain transition-transform duration-200 group-hover:scale-105",
                        !r.isUnlocked && "opacity-40 grayscale-[60%]"
                      )}
                    />
                  </div>
                  
                  {/* Region name */}
                  <span className={cn(
                    "text-xs font-semibold text-center transition-colors max-w-[100px]",
                    r.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {regionName}
                  </span>
                  {/* Progress count */}
                  {!r.isUnlocked && (
                    <span className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {r.played}/{r.total} played
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TrophyCase;
