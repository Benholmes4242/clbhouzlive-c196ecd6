/**
 * CourseDNACard - Chapter 2: What wins here
 * 2x2 compact grid layout
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, RefreshCw, Circle, Ruler, TrendingUp, Flag } from 'lucide-react';
import { TierChip } from './components/TierChip';
import { IntensityDots } from './components/IntensityDots';
import type { CourseDNAItem, ImportanceTier } from './types';

interface CourseDNACardProps {
  items: CourseDNAItem[];
  /** When true, renders content only without card wrapper */
  inline?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  accuracy: <Target className="w-4 h-4" />,
  target: <Target className="w-4 h-4" />,
  scrambling: <RefreshCw className="w-4 h-4" />,
  'refresh-cw': <RefreshCw className="w-4 h-4" />,
  putting: <Circle className="w-4 h-4" />,
  circle: <Circle className="w-4 h-4" />,
  distance: <Ruler className="w-4 h-4" />,
  ruler: <Ruler className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />,
  form: <TrendingUp className="w-4 h-4" />,
  flag: <Flag className="w-4 h-4" />,
  default: <Circle className="w-4 h-4" />,
};

const tierToDotsCount: Record<ImportanceTier, number> = {
  critical: 5,
  significant: 4,
  useful: 3,
};

const DNAContent = memo(function DNAContent({ items }: { items: CourseDNAItem[] }) {
  return (
    <>
      {/* Header - inline layout */}
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Course DNA</h3>
        <p className="text-sm text-slate-500">What wins here</p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {items.slice(0, 4).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="flex flex-col gap-1.5 p-2.5 bg-slate-50 rounded-xl"
          >
            {/* Row 1: Icon + Label */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">
                {iconMap[item.icon.toLowerCase()] || iconMap.default}
              </span>
              <span className="text-sm font-medium text-slate-900 truncate">
                {item.label}
              </span>
            </div>
            
            {/* Row 2: Dots + Tier Chip */}
            <div className="flex items-center justify-between">
              <IntensityDots 
                count={tierToDotsCount[item.tier]} 
                tier={item.tier}
                size="small"
              />
              <TierChip tier={item.tier} size="small" />
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
});

export const CourseDNACard = memo(function CourseDNACard({ items, inline = false }: CourseDNACardProps) {
  if (items.length === 0) return null;

  // Inline mode: content only, no card wrapper
  if (inline) {
    return <DNAContent items={items} />;
  }

  // Card mode: full card with wrapper
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4">
      <DNAContent items={items} />
    </div>
  );
});
