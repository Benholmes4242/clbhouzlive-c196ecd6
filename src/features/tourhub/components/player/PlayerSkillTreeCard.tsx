/**
 * PlayerSkillTreeCard - RPG-style skill visualization.
 * No card container — editorial layout directly on page background.
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Zap, Target, Flame, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  usePlayerSkillTree, 
  SKILL_ATTRIBUTES,
  type SkillAttributeKey,
  type SkillAttribute,
} from '../../hooks/usePlayerSkillTree';

const SKILL_ICONS: Record<SkillAttributeKey, React.ElementType> = {
  power: Zap,
  precision: Target,
  scoring: Flame,
  recovery: Shield,
  consistency: Activity,
};

const SKILL_ICON_BG: Record<SkillAttributeKey, string> = {
  power: 'bg-red-500/10 text-red-500',
  precision: 'bg-amber-500/10 text-amber-500',
  scoring: 'bg-emerald-500/10 text-emerald-500',
  recovery: 'bg-teal-500/10 text-teal-500',
  consistency: 'bg-purple-500/10 text-purple-500',
};

const SKILL_BAR_COLORS: Record<SkillAttributeKey, string> = {
  power: 'bg-red-500',
  precision: 'bg-amber-500',
  scoring: 'bg-emerald-500',
  recovery: 'bg-teal-500',
  consistency: 'bg-purple-500',
};

const SKILL_ACCENT_COLORS: Record<SkillAttributeKey, string> = {
  power: '#EF4444',
  precision: '#F59E0B',
  scoring: '#10B981',
  recovery: '#14B8A6',
  consistency: '#A855F7',
};

const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/** Animated Level Bar - 10 pill segments */
const LevelBar = memo(({ level, colorKey, isStrongest, delay = 0, animate = true }: { level: number; colorKey: SkillAttributeKey; isStrongest: boolean; delay?: number; animate?: boolean }) => (
  <div className="flex gap-1 flex-1">
    {Array.from({ length: 10 }).map((_, index) => (
      <motion.div
        key={index}
        className={cn(
          "flex-1 h-3 rounded-full",
          index < level
            ? isStrongest ? "bg-amber-500" : SKILL_BAR_COLORS[colorKey]
            : "bg-muted"
        )}
        initial={animate ? { scaleX: 0 } : false}
        animate={animate ? { scaleX: 1 } : undefined}
        transition={{ ...springSnappy, delay: delay + (index * 0.03) }}
        style={{ originX: 0 }}
      />
    ))}
  </div>
));
LevelBar.displayName = 'LevelBar';

/** Single Attribute Row */
const AttributeRow = memo(({ attribute, isStrongest, delay = 0, animate = true }: { attribute: SkillAttribute; isStrongest: boolean; delay?: number; animate?: boolean }) => {
  const config = SKILL_ATTRIBUTES[attribute.key];
  const Icon = SKILL_ICONS[attribute.key];

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-lg transition-colors",
        isStrongest && "bg-amber-50 dark:bg-amber-500/10 -mx-3"
      )}
      initial={animate ? { opacity: 0, x: -20 } : false}
      animate={animate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...springSnappy, delay }}
    >
      <div className="flex items-center gap-2 w-28 shrink-0">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", SKILL_ICON_BG[attribute.key])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className={cn("text-[13px] font-semibold", isStrongest ? "text-amber-600" : config.color)}>
          {config.name}
        </span>
      </div>
      <LevelBar
        level={attribute.level}
        colorKey={attribute.key}
        isStrongest={isStrongest}
        delay={delay}
        animate={animate}
      />
      <div className={cn("w-12 text-right", isStrongest ? "text-amber-600" : config.color)}>
        <span className="text-[13px] font-bold font-mono tabular-nums">Lv.{attribute.level}</span>
      </div>
      <div className="w-16 text-right shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          {attribute.rawValue?.toFixed(attribute.key === 'consistency' ? 2 : 1)} {config.unit}
        </span>
      </div>
    </motion.div>
  );
});
AttributeRow.displayName = 'AttributeRow';

/** Overall Level Badge — larger with glow */
const OverallLevelBadge = memo(({ level, animate = true }: { level: number; animate?: boolean }) => {
  const getTier = (lvl: number) => {
    if (lvl >= 9) return { name: 'Elite', color: 'text-amber-500', gradient: 'from-amber-500 to-yellow-400', glow: '0 0 24px rgba(245,158,11,0.35)' };
    if (lvl >= 7) return { name: 'Champion', color: 'text-purple-500', gradient: 'from-purple-500 to-violet-400', glow: '0 0 24px rgba(168,85,247,0.35)' };
    if (lvl >= 5) return { name: 'Contender', color: 'text-blue-500', gradient: 'from-blue-500 to-cyan-400', glow: '0 0 24px rgba(59,130,246,0.35)' };
    return { name: 'Rising', color: 'text-emerald-500', gradient: 'from-emerald-500 to-green-400', glow: '0 0 24px rgba(16,185,129,0.35)' };
  };
  const tier = getTier(level);

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={springSnappy}
    >
      <div
        className={cn("w-[68px] h-[68px] rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center", tier.gradient)}
        style={{ boxShadow: tier.glow }}
      >
        <span className="text-white/80 text-[10px] uppercase tracking-wide font-medium">Overall</span>
        <span className="text-white text-2xl font-bold font-mono">{level}</span>
      </div>
      <div>
        <span className={cn("text-[17px] font-bold", tier.color)}>{tier.name}</span>
        <p className="text-xs text-muted-foreground">Skill Tier</p>
      </div>
    </motion.div>
  );
});
OverallLevelBadge.displayName = 'OverallLevelBadge';

/** SVG Radar / Spider Chart — PD-05: supports activeSkill highlighting */
function SkillRadarChart({ attributes, animate = true, activeSkill = null }: { attributes: SkillAttribute[]; animate?: boolean; activeSkill?: SkillAttributeKey | null }) {
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const RADIUS = 100;
  const LABEL_RADIUS = RADIUS + 24;
  const LEVELS = 10;

  const orderedKeys: SkillAttributeKey[] = ['power', 'precision', 'scoring', 'recovery', 'consistency'];
  const ordered = orderedKeys.map(key => attributes.find(a => a.key === key) || { key, level: 0 } as SkillAttribute);
  const count = ordered.length;

  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, level: number) => {
    const angle = startAngle + index * angleStep;
    const r = (level / LEVELS) * RADIUS;
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
  };

  const gridRings = [2, 4, 6, 8, 10].map(level => {
    const points = Array.from({ length: count }).map((_, i) => {
      const p = getPoint(i, level);
      return `${p.x},${p.y}`;
    }).join(' ');
    return <polygon key={level} points={points} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />;
  });

  const axisLines = Array.from({ length: count }).map((_, i) => {
    const p = getPoint(i, LEVELS);
    const isActive = activeSkill === orderedKeys[i];
    return (
      <line
        key={i}
        x1={CENTER}
        y1={CENTER}
        x2={p.x}
        y2={p.y}
        stroke={isActive ? SKILL_ACCENT_COLORS[orderedKeys[i]] : "hsl(var(--border))"}
        strokeWidth={isActive ? "2" : "0.5"}
        opacity={isActive ? 1 : 0.3}
      />
    );
  });

  const dataPoints = ordered.map((attr, i) => {
    const p = getPoint(i, attr.level);
    return `${p.x},${p.y}`;
  }).join(' ');

  const labels = ordered.map((attr, i) => {
    const angle = startAngle + i * angleStep;
    const x = CENTER + LABEL_RADIUS * Math.cos(angle);
    const y = CENTER + LABEL_RADIUS * Math.sin(angle);
    const config = SKILL_ATTRIBUTES[attr.key];
    const isActive = activeSkill === attr.key;
    return (
      <text
        key={attr.key}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={cn(
          "text-[10px] font-medium",
          isActive ? "fill-foreground font-bold" : "fill-muted-foreground"
        )}
      >
        {config.name}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[280px] mx-auto">
      <defs>
        <linearGradient id="skill-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(245,158,11,0.25)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.05)" />
        </linearGradient>
      </defs>
      {gridRings}
      {axisLines}
      <motion.polygon
        points={dataPoints}
        fill="url(#skill-fill)"
        stroke="#F59E0B"
        strokeWidth="1.5"
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />
      {ordered.map((attr, i) => {
        const p = getPoint(i, attr.level);
        const isActive = activeSkill === attr.key;
        return (
          <motion.circle
            key={attr.key}
            cx={p.x}
            cy={p.y}
            r={isActive ? 6 : 4}
            fill={isActive ? SKILL_ACCENT_COLORS[attr.key] : "#F59E0B"}
            stroke="white"
            strokeWidth="1.5"
            initial={animate ? { scale: 0 } : false}
            animate={animate ? { scale: isActive ? 1.3 : 1 } : undefined}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        );
      })}
      {labels}
    </svg>
  );
}

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

function SkillTreeEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
        <Activity className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">Skill Tree Unavailable</p>
      <p className="text-sm text-muted-foreground mt-1">
        Statistics for this player are not available yet
      </p>
    </div>
  );
}

export function PlayerSkillTreeCard({ playerId }: { playerId: string }) {
  const { data: skillTree, isLoading, error } = usePlayerSkillTree(playerId);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [activeSkill, setActiveSkill] = useState<SkillAttributeKey | null>(null);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Skill Build
        </h2>
        <SkillTreeSkeleton />
      </div>
    );
  }

  if (error || !skillTree || skillTree.attributes.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Skill Build
        </h2>
        <SkillTreeEmpty />
      </div>
    );
  }

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Skill Build
        </h2>
        <OverallLevelBadge level={skillTree.overallLevel} animate={inView} />
      </div>

      {/* Strongest Attribute Callout — full width strip */}
      {inView && skillTree.strongestAttribute && (
        <motion.div
          className="mb-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-[13px] font-semibold">Dominant Skill:</span>
            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", SKILL_ICON_BG[skillTree.strongestAttribute])}>
              {(() => { const Ic = SKILL_ICONS[skillTree.strongestAttribute]; return <Ic className="w-3.5 h-3.5" />; })()}
            </div>
            <span className={cn("font-bold text-[13px]", SKILL_ATTRIBUTES[skillTree.strongestAttribute].color)}>
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
            delay={inView ? 0.1 + index * 0.05 : 0}
            animate={inView}
          />
        ))}
      </div>

      {/* Radar Chart */}
      <div className="mt-6 pt-4 border-t border-border">
        <SkillRadarChart attributes={skillTree.attributes} animate={inView} activeSkill={activeSkill} />
      </div>

      {/* Interactive Legend — PD-05 */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {(['power', 'precision', 'scoring', 'recovery', 'consistency'] as SkillAttributeKey[]).map(key => {
          const Ic = SKILL_ICONS[key];
          const isActive = activeSkill === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSkill(key === activeSkill ? null : key)}
              className={cn(
                'flex items-center gap-1 p-1.5 rounded-full transition-all',
                isActive
                  ? 'bg-primary/10 scale-110 ring-2 ring-primary/30 text-foreground font-semibold'
                  : 'hover:bg-muted/50'
              )}
              aria-label={`Highlight ${SKILL_ATTRIBUTES[key].name} on radar chart`}
            >
              <Ic className="w-3 h-3" />
              {SKILL_ATTRIBUTES[key].name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
