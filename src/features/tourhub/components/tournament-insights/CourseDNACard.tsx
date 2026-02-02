/**
 * CourseDNACard - Chapter 2: What wins here
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, RefreshCw, Circle, Ruler } from 'lucide-react';
import { TierChip } from './components/TierChip';
import { IntensityDots } from './components/IntensityDots';
import type { CourseDNAItem, ImportanceTier } from './types';

interface CourseDNACardProps {
  items: CourseDNAItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  accuracy: <Target className="w-4 h-4" />,
  scrambling: <RefreshCw className="w-4 h-4" />,
  putting: <Circle className="w-4 h-4" />,
  distance: <Ruler className="w-4 h-4" />,
  default: <Circle className="w-4 h-4" />,
};

const tierToDotsCount: Record<ImportanceTier, number> = {
  critical: 5,
  significant: 4,
  useful: 3,
  situational: 2,
};

export const CourseDNACard = memo(function CourseDNACard({ items }: CourseDNACardProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Course DNA</h3>
        <p className="text-sm text-slate-500">What wins here</p>
      </div>

      {/* DNA Rows */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.07, duration: 0.3 }}
            className="flex items-center justify-between"
          >
            {/* Left: Icon + Label + Dots */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                {iconMap[item.icon.toLowerCase()] || iconMap.default}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <IntensityDots count={tierToDotsCount[item.tier]} tier={item.tier} />
              </div>
            </div>

            {/* Right: Tier Chip */}
            <TierChip tier={item.tier} />
          </motion.div>
        ))}
      </div>
    </div>
  );
});
