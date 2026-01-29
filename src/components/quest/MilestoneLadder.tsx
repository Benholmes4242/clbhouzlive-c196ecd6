/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * V2: No card containers - content floats directly on page background
 * 
 * Uses PremiumCheckmark for earned badges
 * Solid connector lines (no gradient/fade)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, Lock, Flag, Crown } from 'lucide-react';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { MILESTONE_TAGLINES, REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';
import { QuestEmptyState } from './QuestEmptyState';
import { PremiumCheckmark } from './PremiumCheckmark';
import { type Top100ListSlug } from '@/lib/regionTheme';

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

// Region accent colors - Golf palette
const REGION_ACCENT_COLORS: Record<Top100ListSlug, string> = {
  'gb-i': '#334E3D',     // Emerald
  'europe': '#64748B',   // Slate (sophisticated)
  'usa': '#C1A84C',      // Chartreus gold
  'global': '#334E3D',   // Emerald
};

// Region badge images
const REGION_BADGE_IMAGES: Record<Top100ListSlug, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

export interface MilestoneItem {
  id: string;
  threshold: number;
  name: string;
  tierName: string;
  type: 'milestone' | 'list_completion';
  isUnlocked: boolean;
  regionSlug?: Top100ListSlug;
  played?: number;
  total?: number;
}

interface RegionCompletionData {
  slug: Top100ListSlug;
  name: string;
  played: number;
  total: number;
}

interface MilestoneLadderProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean; type?: string; regionSlug?: string; played?: number; total?: number }) => void;
  regionCompletions?: RegionCompletionData[];
}

interface MilestoneNodeProps {
  milestone: MilestoneItem;
  isCurrent: boolean;
  isLast: boolean;
  totalPlayed: number;
  index: number;
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE NODE - V2: No card wrapper, content floats on background
// ═══════════════════════════════════════════════════════════════════════════════════════════

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  isCurrent,
  isLast,
  totalPlayed,
  index,
  onClick,
}) => {
  const tierColor = getRingColorForThreshold(milestone.threshold);
  const badgeImage = BADGE_IMAGES[milestone.threshold];
  const remaining = milestone.threshold - totalPlayed;
  const progressPercent = totalPlayed >= milestone.threshold 
    ? 100 
    : (totalPlayed / milestone.threshold) * 100;

  return (
    <motion.div 
      className="relative flex items-start gap-4 py-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* SOLID connecting line - Golf palette colors */}
      {!isLast && (
        <div
          className="absolute left-5 w-0.5 z-0"
          style={{
            top: '48px',
            height: 'calc(100% - 16px)',
            backgroundColor: milestone.isUnlocked ? '#334E3D' : '#B8C6C91A',
          }}
        />
      )}

      {/* Node indicator */}
      <motion.button
        onClick={onClick}
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
        )}
        style={{
          background: milestone.isUnlocked ? tierColor : 'white',
          border: milestone.isUnlocked ? `2px solid ${tierColor}` : '2px solid #e2e8f0',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {milestone.isUnlocked ? (
          <Check className="w-5 h-5 text-white" />
        ) : (
          <Lock className="w-5 h-5 text-[#94A3B8]" />
        )}

        {/* Pulse for current target - uses tier color */}
        {isCurrent && !milestone.isUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${tierColor}` }}
            animate={{ 
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>

      {/* V2: Content directly on background - NO card wrapper */}
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={onClick}
      >
        {/* Badge image */}
        <div className="relative flex-shrink-0">
          <img
            src={badgeImage}
            alt={milestone.name}
            className={cn(
              "w-14 h-16 object-contain",
              !milestone.isUnlocked && "opacity-40 grayscale"
            )}
          />
          {/* Premium checkmark for earned */}
          {milestone.isUnlocked && (
            <PremiumCheckmark 
              size="sm" 
              className="absolute -bottom-1 -right-1"
            />
          )}
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold",
            milestone.isUnlocked ? "text-[#1e293b]" : "text-[#94a3b8]"
          )}>
            {milestone.name}
          </h3>
          <p className={cn(
            "text-sm truncate",
            milestone.isUnlocked ? "text-[#64748b]" : "text-[#cbd5e1]"
          )}>
            {milestone.tierName}
          </p>
          
          {/* Progress bar for in-progress - uses tier color with Pale Lime track */}
          {isCurrent && !milestone.isUnlocked && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-[#E5D0A1]/30 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: tierColor,
                  }}
                />
              </div>
              <span className="text-xs text-[#64748b]">
                {totalPlayed}/{milestone.threshold}
              </span>
            </div>
          )}
        </div>
        
        {/* Status - uses tier color for earned */}
        <div className="flex-shrink-0">
          {milestone.isUnlocked && (
            <span 
              className="text-sm font-medium"
              style={{ color: tierColor }}
            >
              Earned
            </span>
          )}
          {isCurrent && !milestone.isUnlocked && (
            <span 
              className="text-sm font-medium"
              style={{ color: tierColor }}
            >
              {remaining} to go
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BUILD MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════════════════

function buildMilestoneItems(totalPlayed: number): MilestoneItem[] {
  return MILESTONE_TIER_META.map(meta => ({
    id: `milestone_${meta.threshold}`,
    threshold: meta.threshold,
    name: `${meta.threshold} Club`,
    tierName: MILESTONE_TAGLINES[meta.threshold] || meta.tierName,
    type: 'milestone' as const,
    isUnlocked: totalPlayed >= meta.threshold,
  }));
}

function buildRegionCompletionItems(regions: RegionCompletionData[]): MilestoneItem[] {
  const orderedSlugs: Top100ListSlug[] = ['gb-i', 'europe', 'usa', 'global'];
  
  const items: MilestoneItem[] = [];
  
  for (const slug of orderedSlugs) {
    const region = regions.find(r => r.slug === slug);
    if (!region) continue;
    
    const isComplete = region.played >= region.total && region.total > 0;
    
    items.push({
      id: `region_${slug}`,
      threshold: region.total,
      name: REGION_FULL_NAMES[slug] || region.name,
      tierName: REGION_TAGLINES[slug] || '',
      type: 'list_completion',
      isUnlocked: isComplete,
      regionSlug: slug,
      played: region.played,
      total: region.total,
    });
  }
  
  return items;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE LADDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const MilestoneLadder: React.FC<MilestoneLadderProps> = ({
  totalPlayed,
  onMilestoneClick,
  regionCompletions = [],
}) => {
  const navigate = useNavigate();
  
  const coreMilestones = useMemo(() => buildMilestoneItems(totalPlayed), [totalPlayed]);
  const regionMilestones = useMemo(() => 
    buildRegionCompletionItems(regionCompletions), 
    [regionCompletions]
  );
  
  const allMilestones = useMemo(() => [
    ...coreMilestones,
    ...regionMilestones,
  ], [coreMilestones, regionMilestones]);

  const currentMilestoneIndex = allMilestones.findIndex(m => !m.isUnlocked);
  const coreComplete = coreMilestones.every(m => m.isUnlocked);

  // Empty state
  if (totalPlayed === 0 && coreMilestones.length > 0) {
    return (
      <QuestEmptyState
        icon={<Flag className="w-8 h-8 text-[#64748b]" />}
        title="Begin Your Journey"
        description="Log your first Top 100 course to start climbing the milestone ladder"
        action={{
          label: "Explore Courses",
          onClick: () => navigate('/top100'),
        }}
      />
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="relative">
        {/* Core milestones */}
        <div className="space-y-0">
          {coreMilestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.id}
              milestone={milestone}
              isCurrent={index === currentMilestoneIndex}
              isLast={index === coreMilestones.length - 1}
              totalPlayed={totalPlayed}
              index={index}
              onClick={() => onMilestoneClick?.(milestone)}
            />
          ))}
        </div>

        {/* Mastery Track Section */}
        {regionMilestones.length > 0 && (
          <motion.div 
            className="relative mt-6 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Chapter header */}
            <div 
              className="rounded-xl p-3 mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(193, 168, 76, 0.08) 0%, rgba(255,255,255,0.95) 100%)',
                border: '1px solid rgba(193, 168, 76, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-[#C1A84C]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B7635]">
                  Mastery Track
                </span>
              </div>
              <p className="text-xs text-[#64748b]">
                {coreComplete 
                  ? 'Complete each regional Top 100 list to achieve mastery' 
                  : 'Complete the 400 Club to unlock regional mastery challenges'}
              </p>
            </div>

            {/* Regional items - V2: No card wrappers */}
            <div className="space-y-3">
              {regionMilestones.map((milestone, index) => {
                const regionSlug = milestone.regionSlug as Top100ListSlug;
                const accentColor = REGION_ACCENT_COLORS[regionSlug];
                const progressPercent = milestone.total && milestone.total > 0
                  ? ((milestone.played || 0) / milestone.total) * 100
                  : 0;
                
                return (
                  <motion.button
                    key={milestone.id}
                    className="w-full flex items-center gap-3 py-3 text-left"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    {/* Region badge image */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={REGION_BADGE_IMAGES[regionSlug]}
                        alt={milestone.name}
                        className={cn(
                          "w-12 h-12 object-contain",
                          !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
                        )}
                      />
                      
                      {milestone.isUnlocked && (
                        <PremiumCheckmark 
                          size="sm" 
                          className="absolute -bottom-1 -right-1"
                        />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        milestone.isUnlocked ? "text-[#1e293b]" : "text-[#94a3b8]"
                      )}>
                        {milestone.name}
                      </h4>
                      <p className={cn(
                        "text-xs truncate",
                        milestone.isUnlocked ? "text-[#64748b]" : "text-[#cbd5e1]"
                      )}>
                        {milestone.tierName}
                      </p>
                      
                      {/* Progress bar - uses Pale Lime track */}
                      {!milestone.isUnlocked && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-[#E5D0A1]/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${progressPercent}%`,
                                backgroundColor: accentColor
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#64748b]">
                            {milestone.played}/{milestone.total}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status */}
                    {milestone.isUnlocked && (
                      <span className="text-xs font-medium text-[#334E3D]">Complete</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MilestoneLadder;
