/**
 * CourseDNACard - What wins here
 * Theme-aware, premium skill importance bars
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
    <div className="px-4 py-5">
      <h3 className="mb-4 text-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>
        What Matters{courseName ? ` at ${courseName}` : ''}
      </h3>

      <div className="flex flex-col gap-3">
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
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50"
            >
              {/* Skill icon — 32x32 */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: getIconBg(item.tier) }}
              >
                <IconComponent 
                  className="w-4 h-4" 
                  style={{ color: hexColor }}
                  strokeWidth={2} 
                />
              </div>

              {/* Name, tag, and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {item.label}
                  </span>
                   <span 
                    className="uppercase"
                    style={{ fontSize: '10px', fontWeight: 700, color: hexColor, letterSpacing: '0.08em' }}
                  >
                    {tierToLabel[item.tier]}
                  </span>
                </div>
                
                {/* Progress bar — 6px height, rounded-full */}
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    transition={{ 
                      delay: 0.3 + i * 0.1, 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ 
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
