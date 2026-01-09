/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * Phase 2: Extended with Top 100 List Completion achievements ("Mastery Track")
 * 
 * This is the "Journey Map" showing milestones AND regional list completions
 * Uses EliteGameCard for consistent collector card design
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Lock, Trophy, Crown } from 'lucide-react';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { type Top100ListSlug } from '@/lib/regionTheme';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';
import { MILESTONE_TAGLINES, REGION_TAGLINES, REGION_FULL_NAMES } from '@/config/achievementTaglines';

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
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean; type?: string; regionSlug?: string; played?: number; total?: number }) => void;
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

const REGION_TO_TIER: Record<Top100ListSlug, EliteCardTier> = {
  'gb-i': 'GBI',
  'europe': 'EU',
  'usa': 'USA',
  'global': 'WORLD',
};

// Region accent colors - used for unlocked mastery cards
const REGION_ACCENT_COLORS: Record<Top100ListSlug, string> = {
  'gb-i': '#4A7C59',   // Green
  'europe': '#5B7EC0', // Blue
  'usa': '#C75B5B',    // Red
  'global': '#D4AF37', // Gold
};

function getRegionAccentColor(slug: Top100ListSlug): string {
  return REGION_ACCENT_COLORS[slug];
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
      {/* Connecting line - starts from center of node circle and ends at center of next node */}
      {/* Don't render line for the last core milestone - it should end there */}
      {!isLast && milestone.type === 'milestone' && (
        <div
          className="absolute left-5 w-0.5 z-0"
          style={{
            top: '20px',
            height: 'calc(100% + 16px)',
            background: milestone.isUnlocked
              ? `linear-gradient(to bottom, ${accentColor}80, rgb(226 232 240 / 0.6))`
              : 'rgb(226 232 240 / 0.6)',
          }}
        />
      )}

      {/* Node indicator */}
      <motion.button
        onClick={onClick}
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
          milestone.isUnlocked && 'ring-2 ring-offset-2 ring-offset-slate-50',
          isCurrent && !milestone.isUnlocked && 'ring-1 ring-offset-1 ring-offset-slate-50',
        )}
        style={{
          background: milestone.isUnlocked
            ? accentColor
            : isCurrent
              ? 'var(--quest-accent-green)'
              : 'white',
          border: `2px solid ${
            milestone.isUnlocked
              ? accentColor
              : isCurrent
                ? 'var(--quest-accent-green)'
                : 'rgb(226 232 240 / 0.6)'
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

      {/* Milestone card - z-10 ensures it covers the connector line */}
      <div className="flex-1 mb-4 relative z-10" onClick={onClick}>
        <EliteGameCard
          tier={isRegional && milestone.regionSlug 
            ? REGION_TO_TIER[milestone.regionSlug] 
            : String(milestone.threshold) as EliteCardTier}
          earned={milestone.isUnlocked}
          isGhost={!milestone.isUnlocked && !isCurrent}
          currentProgress={isRegional ? milestone.played : totalPlayed}
          targetProgress={isRegional ? milestone.total : milestone.threshold}
          title={milestone.name}
          subtitle={milestone.tierName}
          enableAnimations={false}
          quality="medium"
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
    name: meta.tierName,
    tierName: MILESTONE_TAGLINES[meta.threshold] || '',
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

        {/* Mastery Track Section - Separate chapter, NO vertical connector line */}
        {regionMilestones.length > 0 && (
          <motion.div 
            className="relative mt-8 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Chapter break card */}
            <div 
              className="rounded-2xl p-4 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(210, 180, 97, 0.08) 0%, rgba(255,255,255,0.95) 100%)',
                border: '1px solid rgba(210, 180, 97, 0.2)',
                boxShadow: '0 4px 16px rgba(210, 180, 97, 0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" style={{ color: 'var(--quest-accent-gold)' }} />
                <span 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--quest-accent-gold)' }}
                >
                  Mastery Track
                </span>
              </div>
              <p
                className="text-xs"
                style={{ color: 'var(--quest-text-secondary)' }}
              >
                {coreComplete 
                  ? 'Complete each regional Top 100 list to achieve mastery' 
                  : 'Complete the 400 Club to unlock regional mastery challenges'}
              </p>
            </div>

            {/* Regional items as stacked cards - no connecting line, regional color accents */}
            <div className="space-y-3">
              {regionMilestones.map((milestone, index) => {
                const regionSlug = milestone.regionSlug as Top100ListSlug;
                const accentColor = getRegionAccentColor(regionSlug);
                
                return (
                  <motion.div
                    key={milestone.id}
                    className="relative rounded-2xl overflow-hidden"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onClick={() => onMilestoneClick?.(milestone)}
                    style={{
                      background: milestone.isUnlocked 
                        ? `linear-gradient(135deg, ${accentColor}08 0%, transparent 100%)`
                        : undefined,
                      borderTop: milestone.isUnlocked ? `2px solid ${accentColor}50` : undefined,
                    }}
                  >
                    <EliteGameCard
                      tier={REGION_TO_TIER[regionSlug]}
                      earned={milestone.isUnlocked}
                      isGhost={!milestone.isUnlocked && !coreComplete}
                      currentProgress={milestone.played}
                      targetProgress={milestone.total}
                      title={milestone.name}
                      subtitle={milestone.tierName}
                      enableAnimations={false}
                      quality="medium"
                    />
                  </motion.div>
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
