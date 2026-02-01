/**
 * PlayerSkillTreeCard - RPG-style skill visualization for player profiles
 * 
 * Displays a player's 5-attribute skill build in a radar-like visualization
 * with animated level bars and attribute breakdown.
 * 
 * Part of Pro Dashboard V1 - Gamified Tour Hub
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  usePlayerSkillTree, 
  SKILL_ATTRIBUTES,
  type SkillAttributeKey,
  type SkillAttribute,
} from '../../hooks/usePlayerSkillTree';

// Spring physics for smooth animations
const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/**
 * Animated Level Bar - 10 blocks with stagger
 */
const LevelBar = memo(({ 
  level, 
  gradient,
  delay = 0,
}: { 
  level: number; 
  gradient: string;
  delay?: number;
}) => {
  return (
    <div className="flex gap-0.5 flex-1">
      {Array.from({ length: 10 }).map((_, index) => {
        const isFilled = index < level;
        return (
          <motion.div
            key={index}
            className={cn(
              "flex-1 h-3 rounded-sm",
              isFilled 
                ? `bg-gradient-to-r ${gradient}` 
                : "bg-muted/30"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...springSnappy, delay: delay + (index * 0.03) }}
            style={{ originX: 0 }}
          />
        );
      })}
    </div>
  );
});

LevelBar.displayName = 'LevelBar';

/**
 * Single Attribute Row
 */
const AttributeRow = memo(({ 
  attribute, 
  isStrongest,
  delay = 0,
}: { 
  attribute: SkillAttribute; 
  isStrongest: boolean;
  delay?: number;
}) => {
  const config = SKILL_ATTRIBUTES[attribute.key];
  
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-colors",
        isStrongest && "bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springSnappy, delay }}
    >
      {/* Attribute Icon & Name */}
      <div className="flex items-center gap-2 w-28 shrink-0">
        <span className="text-lg">{config.icon}</span>
        <span className={cn(
          "text-sm font-semibold",
          isStrongest ? "text-amber-600" : config.color
        )}>
          {config.name}
        </span>
      </div>

      {/* Level Bar */}
      <LevelBar 
        level={attribute.level} 
        gradient={isStrongest ? "from-amber-500 to-amber-400" : config.gradient}
        delay={delay}
      />

      {/* Level Badge */}
      <div className={cn(
        "w-12 text-right",
        isStrongest ? "text-amber-600" : config.color
      )}>
        <span className="text-sm font-bold">Lv.{attribute.level}</span>
      </div>

      {/* Raw Value */}
      <div className="w-16 text-right shrink-0">
        <span className="text-xs text-muted-foreground">
          {attribute.rawValue?.toFixed(attribute.key === 'consistency' ? 2 : 1)} {config.unit}
        </span>
      </div>
    </motion.div>
  );
});

AttributeRow.displayName = 'AttributeRow';

/**
 * Overall Level Badge
 */
const OverallLevelBadge = memo(({ level }: { level: number }) => {
  // Determine tier based on overall level
  const getTier = (lvl: number): { name: string; color: string; gradient: string } => {
    if (lvl >= 9) return { name: 'Elite', color: 'text-amber-500', gradient: 'from-amber-500 to-yellow-400' };
    if (lvl >= 7) return { name: 'Champion', color: 'text-purple-500', gradient: 'from-purple-500 to-violet-400' };
    if (lvl >= 5) return { name: 'Contender', color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-400' };
    return { name: 'Rising', color: 'text-emerald-500', gradient: 'from-emerald-500 to-green-400' };
  };

  const tier = getTier(level);

  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springSnappy}
    >
      {/* Level Circle */}
      <div className={cn(
        "w-16 h-16 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center",
        tier.gradient
      )}>
        <span className="text-white/80 text-[10px] uppercase tracking-wide font-medium">Overall</span>
        <span className="text-white text-2xl font-bold">{level}</span>
      </div>
      
      {/* Tier Label */}
      <div>
        <span className={cn("text-lg font-bold", tier.color)}>{tier.name}</span>
        <p className="text-xs text-muted-foreground">Skill Tier</p>
      </div>
    </motion.div>
  );
});

OverallLevelBadge.displayName = 'OverallLevelBadge';

/**
 * Loading Skeleton
 */
function SkillTreeSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="w-28 h-5 bg-muted rounded animate-pulse" />
          <div className="flex-1 h-3 bg-muted rounded animate-pulse" />
          <div className="w-12 h-5 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State
 */
function SkillTreeEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">🌳</span>
      <p className="text-base font-semibold text-foreground">Skill Tree Unavailable</p>
      <p className="text-sm text-muted-foreground mt-1">
        Statistics for this player are not available yet
      </p>
    </div>
  );
}

/**
 * Main PlayerSkillTreeCard Component
 */
export function PlayerSkillTreeCard({ playerId }: { playerId: string }) {
  const { data: skillTree, isLoading, error } = usePlayerSkillTree(playerId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">🌳</span>
          Skill Build
        </h2>
        <SkillTreeSkeleton />
      </div>
    );
  }

  if (error || !skillTree || skillTree.attributes.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">🌳</span>
          Skill Build
        </h2>
        <SkillTreeEmpty />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">🌳</span>
          Skill Build
        </h2>
        
        {/* Overall Level Badge */}
        <OverallLevelBadge level={skillTree.overallLevel} />
      </div>

      {/* Strongest Attribute Callout */}
      {skillTree.strongestAttribute && (
        <motion.div 
          className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm font-semibold">🏆 Dominant Skill:</span>
            <span className="text-lg">{SKILL_ATTRIBUTES[skillTree.strongestAttribute].icon}</span>
            <span className={cn(
              "font-bold text-sm",
              SKILL_ATTRIBUTES[skillTree.strongestAttribute].color
            )}>
              {SKILL_ATTRIBUTES[skillTree.strongestAttribute].name}
            </span>
          </div>
        </motion.div>
      )}

      {/* Attribute Rows */}
      <div className="space-y-1">
        {skillTree.attributes.map((attr, index) => (
          <AttributeRow
            key={attr.key}
            attribute={attr}
            isStrongest={attr.key === skillTree.strongestAttribute}
            delay={0.1 + index * 0.05}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/30">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-red-500 to-orange-500" />
            Power
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-indigo-500" />
            Precision
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-500" />
            Scoring
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-green-500 to-emerald-500" />
            Recovery
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-purple-500 to-violet-500" />
            Consistency
          </span>
        </div>
      </div>
    </div>
  );
}
