/**
 * PlayerSkillTreeCard - Performance Breakdown visualization.
 * Clean stat rows + radar chart. Editorial layout directly on page background.
 */

import { memo } from 'react';
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

const SKILL_ACCENT_COLORS: Record<SkillAttributeKey, string> = {
  power: '#EF4444',
  precision: '#F59E0B',
  scoring: '#10B981',
  recovery: '#14B8A6',
  consistency: '#A855F7',
};

/** Canonical row labels and units */
const ROW_CONFIG: Record<SkillAttributeKey, { label: string; unit: string }> = {
  power: { label: 'Driving Distance', unit: 'yds' },
  precision: { label: 'Driving Accuracy', unit: '%' },
  scoring: { label: 'Birdies per Round', unit: '' },
  recovery: { label: 'Scrambling', unit: '%' },
  consistency: { label: 'SG Total', unit: '' },
};

/** Radar chart short labels */
const RADAR_LABELS: Record<SkillAttributeKey, string> = {
  power: 'Distance',
  precision: 'Accuracy',
  scoring: 'Scoring',
  recovery: 'Scrambling',
  consistency: 'SG Total',
};

const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

/** Single Attribute Row — clean stat row */
const AttributeRow = memo(({ attribute, delay = 0, animate = true }: { attribute: SkillAttribute; delay?: number; animate?: boolean }) => {
  const Icon = SKILL_ICONS[attribute.key];
  const iconBg = SKILL_ICON_BG[attribute.key];
  const config = ROW_CONFIG[attribute.key];

  const formatValue = () => {
    if (attribute.rawValue == null) return '—';
    if (attribute.key === 'consistency') {
      const v = attribute.rawValue;
      return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    }
    return attribute.rawValue.toFixed(attribute.key === 'scoring' ? 1 : 1);
  };

  return (
    <motion.div
      className="flex items-center py-3"
      style={{ borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
      initial={animate ? { opacity: 0, x: -20 } : false}
      animate={animate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...springSnappy, delay }}
    >
      <div className={cn("flex items-center justify-center rounded-lg shrink-0", iconBg.bg, iconBg.text)} style={{ width: '28px', height: '28px' }}>
        <Icon style={{ width: '16px', height: '16px' }} />
      </div>
      <span className="flex-1 text-foreground" style={{ fontSize: 14, fontWeight: 500, marginLeft: 10 }}>
        {config.label}
      </span>
      <span className="text-foreground" style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {formatValue()}
      </span>
      {config.unit && (
        <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, minWidth: 24 }}>
          {config.unit}
        </span>
      )}
    </motion.div>
  );
});
AttributeRow.displayName = 'AttributeRow';

/** SVG Radar / Spider Chart */
function SkillRadarChart({ attributes, animate = true }: { attributes: SkillAttribute[]; animate?: boolean }) {
  const SIZE = 320;
  const CENTER = 160;
  const RADIUS = 100;
  const LABEL_RADIUS = 135;
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
    return (
      <line
        key={i}
        x1={CENTER}
        y1={CENTER}
        x2={p.x}
        y2={p.y}
        stroke="hsl(var(--border))"
        strokeWidth="1"
        opacity={0.1}
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
    return (
      <text
        key={attr.key}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-muted-foreground"
        style={{ fontSize: '10px', fontWeight: 600 }}
      >
        {RADAR_LABELS[attr.key as SkillAttributeKey]}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto" style={{ width: '240px', height: '240px', marginTop: '20px' }}>
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
        return (
          <motion.circle
            key={attr.key}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#F59E0B"
            stroke="white"
            strokeWidth="1.5"
            initial={animate ? { scale: 0 } : false}
            animate={animate ? { scale: 1 } : undefined}
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
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="w-7 h-7 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
          <div className="w-12 h-4 bg-muted rounded animate-pulse" />
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
      <p className="text-base font-semibold text-foreground">Performance Data Unavailable</p>
      <p className="text-sm text-muted-foreground mt-1">
        Statistics for this player are not available yet
      </p>
    </div>
  );
}

export function PlayerSkillTreeCard({ playerId }: { playerId: string }) {
  const { data: skillTree, isLoading, error } = usePlayerSkillTree(playerId);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  const headerContent = (
    <div className="flex items-center gap-2">
      <Activity className="w-4 h-4 text-muted-foreground" />
      <h2 className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
        Performance Breakdown
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
      <div style={{ marginBottom: '16px' }}>{headerContent}</div>

      {/* Attribute Rows */}
      <div>
        {skillTree.attributes.map((attr, index) => (
          <AttributeRow
            key={attr.key}
            attribute={attr}
            delay={inView ? 0.1 + index * 0.05 : 0}
            animate={inView}
          />
        ))}
      </div>

      {/* Radar Chart */}
      <SkillRadarChart attributes={skillTree.attributes} animate={inView} />
    </div>
  );
}
