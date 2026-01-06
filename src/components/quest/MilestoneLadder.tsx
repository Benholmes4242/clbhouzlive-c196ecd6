/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * Phase 2: Extended with Top 100 List Completion achievements ("Mastery Track")
 * 
 * This is the "Journey Map" showing milestones AND regional list completions
 * Uses AchievementBadgeCard for consistent collector card design
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Lock, Trophy, Crown } from 'lucide-react';
import { MILESTONE_TIER_META, type AchievementMilestone } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { getRegionTheme, type Top100ListSlug } from '@/lib/regionTheme';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface MilestoneItem {
  id: string;
  threshold: number;
  name: string;
  tierName: string;
  type: 'milestone' | 'list_completion';
  isUnlocked: boolean;
  // For regional list completions
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
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean }) => void;
  /** Regional list completion data for the Mastery Track */
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
// REGION TIER MAPPING
// ═══════════════════════════════════════════════════════════════════════════════════════════

const REGION_TO_TIER: Record<Top100ListSlug, AchievementTier> = {
  'gb-i': 'GBI',
  'europe': 'EU',
  'usa': 'USA',
  'global': 'WORLD',
};

function getRegionAccentColor(slug: Top100ListSlug): string {
  const colors: Record<Top100ListSlug, string> = {
    'gb-i': '#4A7C59',
    'europe': '#5B7EC0',
    'usa': '#C75B5B',
    'global': '#7A8FC0',
  };
  return colors[slug];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  isCurrent,
  isLast,
  totalPlayed,
  index,
  onClick,
}) => {
  const isRegional = milestone.type === 'list_completion';
  const remaining = milestone.threshold - totalPlayed;
  
  // Get colors based on type
  const accentColor = isRegional && milestone.regionSlug
    ? getRegionAccentColor(milestone.regionSlug)
    : getRingColorForThreshold(milestone.threshold);

  return (
    <motion.div 
      className="relative flex items-start gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Connecting line */}
      {!isLast && (
        <div
          className="absolute left-5 top-12 w-0.5 h-[calc(100%-8px)]"
          style={{
            background: milestone.isUnlocked
              ? `linear-gradient(to bottom, ${accentColor}80, rgba(31, 36, 40, 0.12))`
              : 'rgba(31, 36, 40, 0.12)',
          }}
        />
      )}

      {/* Node indicator */}
      <motion.button
        onClick={onClick}
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
          milestone.isUnlocked && 'ring-2 ring-offset-2 ring-offset-[#F4F5F7]',
          isCurrent && !milestone.isUnlocked && 'ring-1 ring-offset-1 ring-offset-[#F4F5F7]',
        )}
        style={{
          background: milestone.isUnlocked
            ? accentColor
            : isCurrent
              ? 'var(--quest-accent-green)'
              : 'var(--quest-card)',
          border: `2px solid ${
            milestone.isUnlocked
              ? accentColor
              : isCurrent
                ? 'var(--quest-accent-green)'
                : 'var(--quest-stroke)'
          }`,
          boxShadow: milestone.isUnlocked
            ? `0 0 16px ${accentColor}30`
            : isCurrent
              ? '0 0 12px rgba(110, 146, 119, 0.2)'
              : 'var(--quest-shadow-sm)',
          // @ts-expect-error CSS custom property
          '--tw-ring-color': milestone.isUnlocked ? accentColor : isCurrent ? 'var(--quest-accent-green)' : undefined,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {milestone.isUnlocked ? (
          <Check className="w-5 h-5 text-white" />
        ) : isCurrent ? (
          <Trophy className="w-4 h-4 text-white" />
        ) : (
          <Lock className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)' }} />
        )}

        {/* Pulse for current */}
        {isCurrent && !milestone.isUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'var(--quest-accent-green)' }}
            animate={{ 
              opacity: [0.15, 0.3, 0.15],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.button>

      {/* Milestone card */}
      <div className="flex-1 mb-4" onClick={onClick}>
          <AchievementBadgeCard
            tier={isRegional && milestone.regionSlug 
              ? REGION_TO_TIER[milestone.regionSlug] 
              : String(milestone.threshold) as AchievementTier}
            title={milestone.name}
            subtitle={milestone.tierName}
            unlocked={milestone.isUnlocked}
            isGhost={!milestone.isUnlocked && !isCurrent}
            status={milestone.isUnlocked ? 'UNLOCKED' : isCurrent ? undefined : 'LOCKED'}
            remaining={!milestone.isUnlocked && !isRegional ? remaining : undefined}
            totalTop100Played={totalPlayed}
            isCurrentTarget={isCurrent}
            playedOnList={milestone.played}
            totalOnList={milestone.total}
            threshold={milestone.threshold}
          />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BUILD MILESTONES FROM SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════════════════════════════

function buildMilestoneItems(totalPlayed: number): MilestoneItem[] {
  return MILESTONE_TIER_META.map(meta => ({
    id: `milestone_${meta.threshold}`,
    threshold: meta.threshold,
    name: `${meta.threshold} Club`,
    tierName: meta.tierName,
    type: 'milestone' as const,
    isUnlocked: totalPlayed >= meta.threshold,
  }));
}

function buildRegionCompletionItems(regions: RegionCompletionData[]): MilestoneItem[] {
  // Order: GB&I, Europe, USA, Worldwide
  const orderedSlugs: Top100ListSlug[] = ['gb-i', 'europe', 'usa', 'global'];
  
  const items: MilestoneItem[] = [];
  
  for (const slug of orderedSlugs) {
    const region = regions.find(r => r.slug === slug);
    if (!region) continue;
    
    const theme = getRegionTheme(slug);
    const isComplete = region.played >= region.total && region.total > 0;
    
    items.push({
      id: `region_${slug}`,
      threshold: region.total,
      name: theme.completionTitle,
      tierName: theme.primaryLabel,
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
  // Build core milestones from single source of truth
  const coreMilestones = useMemo(() => buildMilestoneItems(totalPlayed), [totalPlayed]);
  
  // Build regional completion milestones (Mastery Track)
  const regionMilestones = useMemo(() => 
    buildRegionCompletionItems(regionCompletions), 
    [regionCompletions]
  );
  
  // Combine all milestones
  const allMilestones = useMemo(() => [
    ...coreMilestones,
    ...regionMilestones,
  ], [coreMilestones, regionMilestones]);

  // Find current milestone (first not unlocked)
  const currentMilestoneIndex = allMilestones.findIndex(m => !m.isUnlocked);
  
  // Check if all core milestones are complete (400 Club achieved)
  const coreComplete = coreMilestones.every(m => m.isUnlocked);

  return (
    <div className="relative">
      <div className="relative pl-2">
        {/* Background path line */}
        <div
          className="absolute left-7 top-0 bottom-0 w-0.5"
          style={{ background: 'rgba(31, 36, 40, 0.12)' }}
        />

        <div className="space-y-0">
          {coreMilestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.id}
              milestone={milestone}
              isCurrent={index === currentMilestoneIndex}
              isLast={index === coreMilestones.length - 1 && regionMilestones.length === 0}
              totalPlayed={totalPlayed}
              index={index}
              onClick={() => onMilestoneClick?.(milestone)}
            />
          ))}
        </div>

        {/* Mastery Track Section - Regional Completions */}
        {regionMilestones.length > 0 && (
          <>
            {/* Mastery Track divider - distinct visual identity */}
            <motion.div 
              className="flex items-center gap-3 my-8 px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(210, 180, 97, 0.15) 0%, rgba(210, 180, 97, 0.05) 100%)',
                  border: '1px solid rgba(210, 180, 97, 0.25)',
                }}
              >
                <Crown className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
                <span 
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--quest-accent-gold)' }}
                >
                  Mastery Track
                </span>
              </div>
              <div 
                className="flex-1 h-px" 
                style={{ background: 'linear-gradient(90deg, rgba(210, 180, 97, 0.3) 0%, transparent 100%)' }}
              />
            </motion.div>

            {/* Mastery Track subtitle */}
            <motion.p
              className="text-xs mb-4 px-1"
              style={{ color: 'var(--quest-text-tertiary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {coreComplete 
                ? 'Complete each regional Top 100 list' 
                : 'Complete the 400 Club to unlock regional mastery'}
            </motion.p>

            <div className="space-y-0">
              {regionMilestones.map((milestone, index) => (
                <MilestoneNode
                  key={milestone.id}
                  milestone={milestone}
                  isCurrent={coreMilestones.length + index === currentMilestoneIndex}
                  isLast={index === regionMilestones.length - 1}
                  totalPlayed={totalPlayed}
                  index={coreMilestones.length + index}
                  onClick={() => onMilestoneClick?.(milestone)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MilestoneLadder;
