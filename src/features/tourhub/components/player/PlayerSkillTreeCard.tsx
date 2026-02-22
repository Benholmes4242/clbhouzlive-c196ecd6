/**
 * PlayerSkillTreeCard - RPG-style skill visualization.
 * Editorial layout directly on page background.
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

const SKILL_ICON_BG: Record<SkillAttributeKey, { bg: string; text: string }> = {
  power: { bg: 'bg-red-100', text: 'text-red-500' },
  precision: { bg: 'bg-amber-100', text: 'text-amber-600' },
  scoring: { bg: 'bg-amber-100', text: 'text-amber-600' },
  recovery: { bg: 'bg-teal-100', text: 'text-teal-600' },
  consistency: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

const SKILL_NAME_COLORS: Record<SkillAttributeKey, string> = {
  power: 'text-red-500',
  precision: 'text-amber-600',
  scoring: 'text-amber-600',
  recovery: 'text-teal-600',
  consistency: 'text-purple-600',
};

const SKILL_DOT_COLORS: Record<SkillAttributeKey, string> = {
  power: '#EF4444',
  precision: '#D97706',
  scoring: '#D97706',
  recovery: '#0D9488',
  consistency: '#9333EA',
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

/** Animated Level Dots - 10 dots, 8×8px */
const LevelDots = memo(({ level, colorKey, isStrongest, delay = 0, animate = true }: { level: number; colorKey: SkillAttributeKey; isStrongest: boolean; delay?: number; animate?: boolean }) => {
  const dotColor = isStrongest ? '#f59e0b' : SKILL_DOT_COLORS[colorKey];
  return (
    <div className="flex flex-1" style={{ gap: '3px' }}>
      {Array.from({ length: 10 }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: index < level ? dotColor : '#CBD5E1',
          }}
          initial={animate ? { scale: 0 } : false}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ ...springSnappy, delay: delay + (index * 0.03) }}
        />
      ))}
    </div>
  );
});
LevelDots.displayName = 'LevelDots';

/** Single Attribute Row */
const AttributeRow = memo(({ attribute, isStrongest, delay = 0, animate = true }: { attribute: SkillAttribute; isStrongest: boolean; delay?: number; animate?: boolean }) => {
  const config = SKILL_ATTRIBUTES[attribute.key];
  const Icon = SKILL_ICONS[attribute.key];
  const iconBg = SKILL_ICON_BG[attribute.key];
  const nameColor = isStrongest ? 'text-[#f59e0b]' : SKILL_NAME_COLORS[attribute.key];
  const levelColor = isStrongest ? '#f59e0b' : SKILL_DOT_COLORS[attribute.key];

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 transition-colors",
        isStrongest && "rounded-xl"
      )}
      style={{
        padding: '12px',
        ...(isStrongest ? { backgroundColor: 'rgba(245,158,11,0.05)' } : {}),
      }}
      initial={animate ? { opacity: 0, x: -20 } : false}
      animate={animate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...springSnappy, delay }}
    >
      <div className="flex items-center gap-2 shrink-0" style={{ width: '112px' }}>
        <div className={cn("flex items-center justify-center rounded-lg", iconBg.bg, iconBg.text)} style={{ width: '28px', height: '28px' }}>
          <Icon style={{ width: '16px', height: '16px' }} />
        </div>
        <span className={cn(nameColor)} style={{ fontSize: '14px', fontWeight: 600 }}>
          {config.name}
        </span>
      </div>
      <LevelDots
        level={attribute.level}
        colorKey={attribute.key}
        isStrongest={isStrongest}
        delay={delay}
        animate={animate}
      />
      <div className="text-right" style={{ width: '48px' }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: levelColor,
        }}>
          Lv.{attribute.level}
        </span>
      </div>
      <div className="text-right shrink-0" style={{ width: '64px' }}>
        <span className="text-muted-foreground" style={{
          fontSize: '12px',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {attribute.rawValue?.toFixed(attribute.key === 'consistency' ? 2 : 1)} {config.unit}
        </span>
      </div>
    </motion.div>
  );
});
AttributeRow.displayName = 'AttributeRow';

/** Overall Level Badge — 56×56px, rounded-2xl */
const OverallLevelBadge = memo(({ level, animate = true }: { level: number; animate?: boolean }) => {
  const getTier = (lvl: number) => {
    if (lvl >= 9) return { name: 'Elite', color: '#f59e0b', bg: '#f59e0b' };
    if (lvl >= 7) return { name: 'Champion', color: '#A855F7', bg: '#A855F7' };
    if (lvl >= 5) return { name: 'Contender', color: '#3B82F6', bg: '#3B82F6' };
    return { name: 'Rising', color: '#22C55E', bg: '#22C55E' };
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
        className="flex flex-col items-center justify-center rounded-2xl"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: tier.bg,
        }}
      >
        <span className="text-white/70" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall</span>
        <span className="text-white" style={{ fontSize: '24px', fontWeight: 800 }}>{level}</span>
      </div>
      <div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: tier.color }}>{tier.name}</span>
        <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 400 }}>Skill Tier</p>
      </div>
    </motion.div>
  );
});
OverallLevelBadge.displayName = 'OverallLevelBadge';

/** SVG Radar / Spider Chart */
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
    return <polygon key={level} points={points} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.1" />;
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
        strokeWidth={isActive ? "2" : "1"}
        opacity={isActive ? 1 : 0.1}
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
        className="fill-muted-foreground"
        style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}
      >
        {config.name}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto" style={{ width: '200px', height: '200px', marginTop: '20px' }}>
      <defs>
        <linearGradient id="skill-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(245,158,11,0.15)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.05)" />
        </linearGradient>
      </defs>
      {gridRings}
      {axisLines}
      <motion.polygon
        points={dataPoints}
        fill="url(#skill-fill)"
        stroke="#F59E0B"
        strokeWidth="2"
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
            r={isActive ? 5 : 3}
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
        <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
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

  const headerContent = (
    <div className="flex items-center gap-2">
      <Activity className="w-4 h-4 text-muted-foreground" />
      <h2 className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
        Skill Build
      </h2>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>{headerContent}</div>
        <SkillTreeSkeleton />
      </div>
    );
  }

  if (error || !skillTree || skillTree.attributes.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>{headerContent}</div>
        <SkillTreeEmpty />
      </div>
    );
  }

  return (
    <div ref={ref}>
      {/* Header row with Overall badge right-aligned */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        {headerContent}
        <OverallLevelBadge level={skillTree.overallLevel} animate={inView} />
      </div>

      {/* Dominant Skill pill */}
      {inView && skillTree.strongestAttribute && (
        <motion.div
          className="w-full rounded-xl"
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            marginBottom: '16px',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSnappy}
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>Dominant Skill:</span>
            <div className={cn("rounded-md flex items-center justify-center", SKILL_ICON_BG[skillTree.strongestAttribute].bg, SKILL_ICON_BG[skillTree.strongestAttribute].text)} style={{ width: '20px', height: '20px' }}>
              {(() => { const Ic = SKILL_ICONS[skillTree.strongestAttribute]; return <Ic style={{ width: '14px', height: '14px' }} />; })()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>
              {SKILL_ATTRIBUTES[skillTree.strongestAttribute].name}
            </span>
          </div>
        </motion.div>
      )}

      {/* Attribute Rows */}
      <div>
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
      <SkillRadarChart attributes={skillTree.attributes} animate={inView} activeSkill={activeSkill} />

      {/* Interactive Legend */}
      <div className="flex flex-wrap justify-center" style={{ gap: '8px', marginTop: '16px' }}>
        {(['power', 'precision', 'scoring', 'recovery', 'consistency'] as SkillAttributeKey[]).map(key => {
          const Ic = SKILL_ICONS[key];
          const isActive = activeSkill === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSkill(key === activeSkill ? null : key)}
              className={cn(
                'flex items-center rounded-full transition-all text-muted-foreground',
                isActive && 'bg-primary/10 scale-110 ring-2 ring-primary/30 text-foreground font-semibold'
              )}
              style={{ gap: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: isActive ? 600 : 500 }}
              aria-label={`Highlight ${SKILL_ATTRIBUTES[key].name} on radar chart`}
            >
              <Ic style={{ width: '14px', height: '14px' }} />
              {SKILL_ATTRIBUTES[key].name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
