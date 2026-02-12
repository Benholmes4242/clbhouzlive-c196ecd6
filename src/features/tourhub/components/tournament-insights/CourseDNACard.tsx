/**
 * CourseDNACard - What wins here with light theme treatment
 * White card with subtle shadow, continuous progress bars with glow
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

// Tier → fill percentage for continuous bar
const tierToFill: Record<ImportanceTier, number> = {
  critical: 100,
  significant: 80,
  useful: 50,
};

// Tier → hex color
const tierToHexColor: Record<ImportanceTier, string> = {
  critical: '#FF3B30',
  significant: '#FF9500',
  useful: '#3478F6',
};

// Tier → display label
const tierToLabel: Record<ImportanceTier, string> = {
  critical: 'CRITICAL',
  significant: 'SIGNIFICANT',
  useful: 'USEFUL',
};

// Map: database icon name string → lucide-react component
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

// Fallback: resolve from label text when icon name is missing or unrecognized
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

// Try icon name first, then label, then default
const resolveIcon = (iconName?: string, label?: string): LucideIcon => {
  if (iconName && iconNameMap[iconName.toLowerCase()]) {
    return iconNameMap[iconName.toLowerCase()];
  }
  return label ? getIconFromLabel(label) : Flag;
};

// Icon container background based on tier (light mode)
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
    <div 
      className={inline ? "p-5" : "rounded-2xl p-5 bg-card border border-border"}
      style={inline ? undefined : { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      <h3 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917' }}>
        What Matters{courseName ? ` at ${courseName}` : ''}
      </h3>

      <div className="flex flex-col gap-2.5">
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
              className="flex items-center gap-3 p-3.5 px-4 rounded-xl"
              style={{ background: '#F8F9FA' }}
            >
              {/* Skill icon */}
              <div 
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: getIconBg(item.tier) }}
              >
                <IconComponent 
                  className="w-[18px] h-[18px]" 
                  style={{ color: hexColor }}
                  strokeWidth={2} 
                />
              </div>

              {/* Name, tag, and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1C1917' }}>
                    {item.label}
                  </span>
                  <span 
                    className="uppercase"
                    style={{ fontSize: '9px', fontWeight: 500, color: hexColor, letterSpacing: '0.05em' }}
                  >
                    {tierToLabel[item.tier]}
                  </span>
                </div>
                
                {/* Continuous progress bar with glow */}
                <div 
                  className="h-1 w-full rounded-sm"
                  style={{ background: 'rgba(0, 0, 0, 0.06)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    transition={{ 
                      delay: 0.3 + i * 0.1, 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    viewport={{ once: true }}
                    className="h-full rounded-sm"
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
