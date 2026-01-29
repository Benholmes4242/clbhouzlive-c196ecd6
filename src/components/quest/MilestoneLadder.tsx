/**
 * MilestoneLadder - Apple-level polish vertical timeline
 * V3: Badge chips on left (60-70px), connecting line, text on right
 * Clean design without checkmark overlays
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Flag, Crown } from 'lucide-react';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { MILESTONE_TAGLINES, REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';
import { QuestEmptyState } from './QuestEmptyState';
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
// MILESTONE NODE - V3: Badge on left, line connector, text on right
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
  const clubName = CLUB_NAMES[milestone.threshold] || `${milestone.threshold} Club`;
  const remaining = milestone.threshold - totalPlayed;
  const progressPercent = totalPlayed >= milestone.threshold 
    ? 100 
    : (totalPlayed / milestone.threshold) * 100;

  return (
    <motion.div 
      className="relative flex items-start gap-4 py-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Connecting line - solid, positioned to connect badge centers */}
      {!isLast && (
        <div
          className="absolute left-[30px] w-0.5 z-0"
          style={{
            top: '72px',
            height: 'calc(100% - 24px)',
            backgroundColor: milestone.isUnlocked ? '#334E3D' : '#E2E8F0',
          }}
        />
      )}

      {/* Badge image (60px) - left side */}
      <button
        onClick={onClick}
        className="relative z-10 flex-shrink-0"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <img
            src={badgeImage}
            alt={clubName}
            className={cn(
              "w-[60px] h-[75px] object-contain",
              !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
            )}
          />
          
          {/* Pulse ring for current target */}
          {isCurrent && !milestone.isUnlocked && (
            <motion.div
              className="absolute -inset-1 rounded-xl"
              style={{ border: `2px solid ${tierColor}` }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </button>

      {/* Text content - right side */}
      <button
        className="flex-1 min-w-0 text-left pt-1"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Club name - primary title */}
            <h3 className={cn(
              "font-bold text-base",
              milestone.isUnlocked ? "text-[#1e293b]" : "text-[#94a3b8]"
            )}>
              {clubName}
            </h3>
            
            {/* Achievement description */}
            <p className={cn(
              "text-sm mt-0.5",
              milestone.isUnlocked ? "text-[#64748b]" : "text-[#cbd5e1]"
            )}>
              {`${milestone.threshold} Top 100 courses played`}
            </p>
            
            {/* Progress bar for current target */}
            {isCurrent && !milestone.isUnlocked && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-[#E5D0A1]/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: tierColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-[#64748b] tabular-nums">
                  {totalPlayed}/{milestone.threshold}
                </span>
              </div>
            )}
          </div>
          
          {/* Status badge */}
          <div className="flex-shrink-0 pt-0.5">
            {milestone.isUnlocked ? (
              <span 
                className="text-sm font-semibold"
                style={{ color: tierColor }}
              >
                Earned
              </span>
            ) : isCurrent ? (
              <span 
                className="text-sm font-semibold"
                style={{ color: tierColor }}
              >
                {remaining} to go
              </span>
            ) : null}
          </div>
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
    name: CLUB_NAMES[meta.threshold] || `${meta.threshold} Club`,
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
// REGIONAL NODE - V3: Badge on left, text on right
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface RegionalNodeProps {
  milestone: MilestoneItem;
  index: number;
  onClick?: () => void;
}

const RegionalNode: React.FC<RegionalNodeProps> = ({ milestone, index, onClick }) => {
  const regionSlug = milestone.regionSlug as Top100ListSlug;
  const badgeImage = REGION_BADGE_IMAGES[regionSlug];
  const progressPercent = milestone.total && milestone.total > 0
    ? ((milestone.played || 0) / milestone.total) * 100
    : 0;

  return (
    <motion.button
      className="w-full flex items-center gap-4 py-3 text-left"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      onClick={onClick}
    >
      {/* Region badge image (56px) */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative flex-shrink-0"
      >
        <img
          src={badgeImage}
          alt={milestone.name}
          className={cn(
            "w-14 h-14 object-contain",
            !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
          )}
        />
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Region name */}
            <h4 className={cn(
              "font-bold text-sm",
              milestone.isUnlocked ? "text-[#1e293b]" : "text-[#94a3b8]"
            )}>
              {milestone.name}
            </h4>
            
            {/* Description */}
            <p className={cn(
              "text-xs mt-0.5",
              milestone.isUnlocked ? "text-[#64748b]" : "text-[#cbd5e1]"
            )}>
              {milestone.tierName}
            </p>
            
            {/* Progress bar */}
            {!milestone.isUnlocked && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-[#E5D0A1]/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-[#334E3D]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
                <span className="text-[10px] text-[#64748b] tabular-nums">
                  {milestone.played}/{milestone.total}
                </span>
              </div>
            )}
          </div>
          
          {/* Status */}
          {milestone.isUnlocked && (
            <span className="text-xs font-semibold text-[#334E3D] flex-shrink-0">
              Complete
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

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

  const currentMilestoneIndex = coreMilestones.findIndex(m => !m.isUnlocked);
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
          className="relative mt-8 pt-6 border-t border-slate-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Chapter header */}
          <div 
            className="rounded-xl p-4 mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(193, 168, 76, 0.06) 0%, rgba(255,255,255,0.98) 100%)',
              border: '1px solid rgba(193, 168, 76, 0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-[#C1A84C]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B7635]">
                Mastery Track
              </span>
            </div>
            <p className="text-sm text-[#64748b]">
              {coreComplete 
                ? 'Complete each regional Top 100 list to achieve mastery' 
                : 'Complete the Grand Slam Club to unlock regional mastery challenges'}
            </p>
          </div>

          {/* Regional items */}
          <div className="space-y-1">
            {regionMilestones.map((milestone, index) => (
              <RegionalNode
                key={milestone.id}
                milestone={milestone}
                index={index}
                onClick={() => onMilestoneClick?.(milestone)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MilestoneLadder;
