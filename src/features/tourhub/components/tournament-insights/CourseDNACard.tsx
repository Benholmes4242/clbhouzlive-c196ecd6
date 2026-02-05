/**
 * CourseDNACard - What wins here with vertical list layout
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, Circle, Flag, Ruler, Wind, Crosshair, Zap, RotateCcw, type LucideIcon } from 'lucide-react';
import type { CourseDNAItem, ImportanceTier } from './types';
import SegmentedBar from './components/SegmentedBar';

interface CourseDNACardProps {
  items: CourseDNAItem[];
  inline?: boolean;
  courseName?: string;
}

// Tier → number of filled segments
const tierToLevel: Record<ImportanceTier, number> = {
  critical: 5,
  significant: 4,
  useful: 3,
};

// Tier → Tailwind color class for filled segments
const tierToColor: Record<ImportanceTier, string> = {
  critical: 'bg-red-500',
  significant: 'bg-orange-500',
  useful: 'bg-blue-500',
};

// Tier → text/bg color classes for the tag badge
const tierToTagStyles: Record<ImportanceTier, string> = {
  critical: 'text-red-500 bg-red-50',
  significant: 'text-orange-500 bg-orange-50',
  useful: 'text-blue-500 bg-blue-50',
};

// Tier → display label
const tierToLabel: Record<ImportanceTier, string> = {
  critical: 'Critical',
  significant: 'Significant',
  useful: 'Useful',
};

// Tier → icon color class
const tierToIconColor: Record<ImportanceTier, string> = {
  critical: 'text-red-500',
  significant: 'text-orange-500',
  useful: 'text-blue-500',
};

// Icon container background tint
const tierToIconBg: Record<ImportanceTier, string> = {
  critical: 'bg-red-50',
  significant: 'bg-orange-50',
  useful: 'bg-blue-50',
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

export const CourseDNACard = memo(function CourseDNACard({ items, courseName }: CourseDNACardProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3.5">
        What Matters{courseName ? ` at ${courseName}` : ''}
      </h3>

      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const IconComponent = resolveIcon(item.icon, item.label);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 p-2.5 px-3 bg-slate-50 rounded-[10px] border border-slate-100"
            >
              {/* Skill icon */}
              <div className={`w-9 h-9 rounded-[10px] ${tierToIconBg[item.tier]} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`w-[18px] h-[18px] ${tierToIconColor[item.tier]}`} strokeWidth={2} />
              </div>

              {/* Name, tag, and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold text-slate-900">{item.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${tierToTagStyles[item.tier]}`}>
                    {tierToLabel[item.tier]}
                  </span>
                </div>
                <SegmentedBar
                  level={tierToLevel[item.tier]}
                  max={5}
                  color={tierToColor[item.tier]}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
