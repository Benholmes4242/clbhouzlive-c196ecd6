/**
 * CourseDNACard - What wins here
 * Dispatch-style flat ruled rows
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, Circle, Flag, Ruler, Wind, Crosshair, Zap, RotateCcw, type LucideIcon } from 'lucide-react';
import type { CourseDNAItem, ImportanceTier } from './types';

interface CourseDNACardProps {
  items: CourseDNAItem[];
  inline?: boolean;
  courseName?: string;
}

const tierToFill: Record<ImportanceTier, number> = {
  critical: 100,
  significant: 80,
  useful: 50,
};

const tierToHexColor: Record<ImportanceTier, string> = {
  critical: '#FF3B30',
  significant: '#FF9500',
  useful: '#3478F6',
};

const tierToLabel: Record<ImportanceTier, string> = {
  critical: 'CRITICAL',
  significant: 'SIGNIFICANT',
  useful: 'USEFUL',
};

const iconNameMap: Record<string, LucideIcon> = {
  flag: Flag,
  circle: Circle,
  ruler: Ruler,
  target: Target,
  crosshair: Crosshair,
  wind: Wind,
  zap: Zap,
  'refresh-cw': RotateCcw,
  'rotate-ccw': RotateCcw,
};

const getIconFromLabel = (label: string): LucideIcon => {
  const lower = label.toLowerCase();
  if (lower.includes('approach')) return Target;
  if (lower.includes('putting') || lower.includes('putt')) return Circle;
  if (lower.includes('driving') && lower.includes('distance')) return Ruler;
  if (lower.includes('driving') && lower.includes('accuracy')) return Target;
  if (lower.includes('distance')) return Wind;
  if (lower.includes('iron')) return Crosshair;
  if (lower.includes('scrambl') || lower.includes('short game')) return RotateCcw;
  if (lower.includes('accuracy')) return Target;
  return Flag;
};

const resolveIcon = (iconName?: string, label?: string): LucideIcon => {
  if (iconName && iconNameMap[iconName.toLowerCase()]) {
    return iconNameMap[iconName.toLowerCase()];
  }
  return label ? getIconFromLabel(label) : Flag;
};

const getIconBg = (tier: ImportanceTier): string => {
  switch (tier) {
    case 'critical': return 'rgba(255, 59, 48, 0.08)';
    case 'significant': return 'rgba(255, 149, 0, 0.08)';
    case 'useful': return 'rgba(52, 120, 246, 0.08)';
  }
};

export const CourseDNACard = memo(function CourseDNACard({ items, inline, courseName }: CourseDNACardProps) {
  if (items.length === 0) return null;

  return (
    <div style={{ background: '#F8FAFC' }}>
      {/* Section rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px', borderBottom: '0.5px solid rgba(15,23,42,0.08)', marginBottom: 0 }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          What Matters{courseName ? ` at ${courseName}` : ''}
        </span>
      </div>

      <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => {
          const IconComponent = resolveIcon(item.icon, item.label);
          const hexColor = tierToHexColor[item.tier];
          const fillPercent = tierToFill[item.tier];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.1 + i * 0.1, 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              viewport={{ once: true }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < items.length - 1 ? '0.5px solid rgba(15,23,42,0.06)' : 'none',
              }}
            >
              {/* Skill icon — 32x32 */}
              <div 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: getIconBg(item.tier),
                }}
              >
                <IconComponent 
                  className="w-4 h-4" 
                  style={{ color: hexColor }}
                  strokeWidth={2} 
                />
              </div>

              {/* Name, tag, and bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                    {item.label}
                  </span>
                   <span 
                    style={{ fontSize: 10, fontWeight: 700, color: hexColor, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}
                  >
                    {tierToLabel[item.tier]}
                  </span>
                </div>
                
                {/* Progress bar — 6px height, rounded-full */}
                <div style={{ height: 6, width: '100%', borderRadius: 9999, background: 'rgba(15,23,42,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    transition={{ 
                      delay: 0.3 + i * 0.1, 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    viewport={{ once: true }}
                    style={{
                      height: '100%',
                      borderRadius: 9999,
                      background: hexColor,
                      boxShadow: `0 0 8px ${hexColor}33`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
