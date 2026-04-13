/**
 * PlayerSkillTreeCard - Dispatch-style flat performance breakdown rows.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Activity } from 'lucide-react';
import {
  usePlayerSkillTree,
  SKILL_ATTRIBUTES,
  type SkillAttributeKey,
  type SkillAttribute,
} from '../../hooks/usePlayerSkillTree';

/** Canonical row labels and units */
const ROW_CONFIG: Record<SkillAttributeKey, { label: string; unit: string }> = {
  power: { label: 'Driving Distance', unit: 'yds' },
  precision: { label: 'Driving Accuracy', unit: '%' },
  scoring: { label: 'Birdies per Round', unit: '' },
  recovery: { label: 'Scrambling', unit: '%' },
  consistency: { label: 'SG Total', unit: '' },
};

/** Single Attribute Row — flat dispatch style */
const AttributeRow = memo(({ attribute, delay = 0, animate = true }: { attribute: SkillAttribute; delay?: number; animate?: boolean }) => {
  const config = ROW_CONFIG[attribute.key];

  const formatValue = () => {
    if (attribute.rawValue == null) return '—';
    if (attribute.key === 'consistency') {
      const v = attribute.rawValue;
      return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    }
    return attribute.rawValue.toFixed(1);
  };

  const pct = attribute.percentile ?? 50;
  const isStrong = pct >= 70;

  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
      initial={animate ? { opacity: 0, x: -12 } : false}
      animate={animate ? { opacity: 1, x: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 35, delay }}
    >
      {/* Label */}
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', width: '130px', flexShrink: 0 }}>
        {config.label}
      </span>

      {/* Bar */}
      <div style={{ flex: 1, height: '4px', background: 'rgba(15,23,42,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: '2px', background: isStrong ? '#F7931E' : '#94A3B8' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, delay: delay + 0.1, ease: 'easeOut' }}
        />
      </div>

      {/* Value */}
      <div style={{ textAlign: 'right' as const, flexShrink: 0, minWidth: '52px' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: isStrong ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
          {formatValue()}
        </span>
        {config.unit && (
          <span style={{ fontSize: '9px', color: '#94A3B8', marginLeft: '2px' }}>{config.unit}</span>
        )}
      </div>
    </motion.div>
  );
});
AttributeRow.displayName = 'AttributeRow';

function SkillTreeSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
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
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
        Performance Breakdown
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '14px 16px' }}>
        <div style={{ marginBottom: '16px' }}>{headerContent}</div>
        <SkillTreeSkeleton />
      </div>
    );
  }

  if (error || !skillTree || skillTree.attributes.length === 0) {
    return (
      <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '14px 16px' }}>
        <div style={{ marginBottom: '16px' }}>{headerContent}</div>
        <SkillTreeEmpty />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px', padding: '14px 16px' }}>
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
    </div>
  );
}
