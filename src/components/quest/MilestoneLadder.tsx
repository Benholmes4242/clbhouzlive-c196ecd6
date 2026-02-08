/**
 * MilestoneLadder - Apple-level polish vertical timeline
 * V5: Collapsible distant milestones, earned checkmarks, progress counts, regional chevrons
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Flag, Crown, Check, ChevronDown, ChevronRight } from 'lucide-react';
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

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONE NODE
// ═══════════════════════════════════════════════════════════════════════════════

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
      className="relative flex items-start gap-5 py-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Connecting line */}
      {!isLast && (
        <div
          className="absolute w-0.5 z-0 bg-border"
          style={{
            left: '44px',
            top: '126px',
            height: '16px',
          }}
        />
      )}

      {/* Badge image - left side */}
      <button
        onClick={onClick}
        className="relative z-10 flex-shrink-0 active:opacity-80"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <img
            src={badgeImage}
            alt={clubName}
            loading="lazy"
            decoding="async"
            className={cn(
              "w-[88px] h-[110px] object-contain",
              !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
            )}
          />
          {/* Earned checkmark overlay */}
          {milestone.isUnlocked && (
            <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </motion.div>
      </button>

      {/* Text content - right side */}
      <button
        className="flex-1 min-w-0 text-left pt-2 active:opacity-80"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Club name */}
            <h3 className={cn(
              "font-bold text-base",
              milestone.isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {clubName}
            </h3>
            
            {/* Achievement description */}
            <p className={cn(
              "text-sm mt-0.5",
              milestone.isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
            )}>
              {`${milestone.threshold} Top 100 courses played`}
            </p>
            
            {/* Progress bar for current target */}
            {isCurrent && !milestone.isUnlocked && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-[#E5D0A1]/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: tierColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalPlayed}/{milestone.threshold}
                </span>
              </div>
            )}

            {/* Progress count for non-current locked milestones */}
            {!milestone.isUnlocked && !isCurrent && (
              <p className="text-xs text-muted-foreground/60 tabular-nums mt-1">
                {totalPlayed} of {milestone.threshold} played
              </p>
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

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// REGIONAL NODE - with chevron affordance
// ═══════════════════════════════════════════════════════════════════════════════

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
      className={cn(
        "w-full flex items-center gap-5 py-4 min-h-[44px] text-left active:opacity-80",
        (milestone.played || 0) === 0 && "opacity-60"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      onClick={onClick}
    >
      {/* Region badge image */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative flex-shrink-0"
      >
        <img
          src={badgeImage}
          alt={milestone.name}
          loading="lazy"
          decoding="async"
          className={cn(
            "w-20 h-20 object-contain",
            !milestone.isUnlocked && "opacity-40 grayscale-[60%]"
          )}
        />
        {/* Earned checkmark */}
        {milestone.isUnlocked && (
          <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </motion.div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Region name */}
            <h4 className={cn(
              "font-bold text-base",
              milestone.isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}>
              {milestone.name}
            </h4>
            
            {/* Description */}
            <p className={cn(
              "text-sm mt-0.5",
              milestone.isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
            )}>
              {milestone.tierName}
            </p>
            
            {/* Progress bar */}
            {!milestone.isUnlocked && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-[#E5D0A1]/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-[#334E3D]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {milestone.played}/{milestone.total}
                </span>
              </div>
            )}
          </div>
          
          {/* Status + chevron */}
          <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
            {milestone.isUnlocked && (
              <span className="text-sm font-semibold text-[#334E3D]">
                Complete
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-0.5" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONE LADDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const MilestoneLadder: React.FC<MilestoneLadderProps> = ({
  totalPlayed,
  onMilestoneClick,
  regionCompletions = [],
}) => {
  const navigate = useNavigate();
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  
  const coreMilestones = useMemo(() => buildMilestoneItems(totalPlayed), [totalPlayed]);
  const regionMilestones = useMemo(() => 
    buildRegionCompletionItems(regionCompletions), 
    [regionCompletions]
  );

  const currentMilestoneIndex = coreMilestones.findIndex(m => !m.isUnlocked);
  const coreComplete = coreMilestones.every(m => m.isUnlocked);

  // Collapse: show earned + next 2 locked, then collapse the rest
  const { visibleMilestones, hiddenCount } = useMemo(() => {
    if (showAllMilestones || coreComplete) {
      return { visibleMilestones: coreMilestones, hiddenCount: 0 };
    }
    
    const maxVisible = currentMilestoneIndex >= 0 ? currentMilestoneIndex + 2 : coreMilestones.length;
    const visible = coreMilestones.slice(0, Math.min(maxVisible + 1, coreMilestones.length));
    const hidden = coreMilestones.length - visible.length;
    
    return { visibleMilestones: visible, hiddenCount: hidden };
  }, [coreMilestones, showAllMilestones, coreComplete, currentMilestoneIndex]);

  // Empty state
  if (totalPlayed === 0 && coreMilestones.length > 0) {
    return (
      <QuestEmptyState
        icon={<Flag className="w-8 h-8 text-muted-foreground" />}
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
        {visibleMilestones.map((milestone, index) => (
          <MilestoneNode
            key={milestone.id}
            milestone={milestone}
            isCurrent={index === currentMilestoneIndex}
            isLast={index === visibleMilestones.length - 1 && hiddenCount === 0}
            totalPlayed={totalPlayed}
            index={index}
            onClick={() => onMilestoneClick?.(milestone)}
          />
        ))}
      </div>

      {/* Show more button for collapsed milestones */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAllMilestones(true)}
          className="flex items-center gap-2 py-3 pl-[108px] text-sm font-medium text-muted-foreground hover:text-foreground min-h-[44px] active:scale-[0.98] transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          Show {hiddenCount} more milestone{hiddenCount > 1 ? 's' : ''}
        </button>
      )}

      {/* Mastery Track Section */}
      {regionMilestones.length > 0 && (
        <motion.div 
          className="relative mt-8 pt-6 border-t border-border/60"
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
              <span className="text-sm font-semibold text-foreground">
                Mastery Track
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
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
