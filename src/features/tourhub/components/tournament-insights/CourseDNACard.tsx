/**
 * CourseDNACard - Chapter 2: What wins here
 * 2x2 compact grid layout with premium polish
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, RefreshCw, Circle, Ruler, Flag } from 'lucide-react';
import { TierChip } from './components/TierChip';
import { IntensityDots } from './components/IntensityDots';
import type { CourseDNAItem, ImportanceTier } from './types';

interface CourseDNACardProps {
  items: CourseDNAItem[];
  /** When true, renders content only without card wrapper */
  inline?: boolean;
  /** Course name for the header (e.g., "TPC Scottsdale") */
  courseName?: string;
}

// Icon helper - smaller icons for the circle container
function getIconForStat(iconName: string) {
  const iconClass = "w-3.5 h-3.5";
  
  switch (iconName.toLowerCase()) {
    case 'target':
    case 'accuracy':
      return <Target className={iconClass} />;
    case 'flag':
      return <Flag className={iconClass} />;
    case 'circle':
    case 'putting':
      return <Circle className={iconClass} />;
    case 'ruler':
    case 'distance':
      return <Ruler className={iconClass} />;
    case 'refresh-cw':
    case 'scrambling':
      return <RefreshCw className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

const tierToDotsCount: Record<ImportanceTier, number> = {
  critical: 5,
  significant: 4,
  useful: 3,
};

const DNAContent = memo(function DNAContent({ items, courseName }: { items: CourseDNAItem[]; courseName?: string }) {
  return (
    <>
      {/* Header - single line with course name */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">
          What Matters at {courseName || 'This Venue'}
        </h3>
      </div>

      {/* 2x2 Grid with refined gap */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.slice(0, 4).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="flex flex-col gap-2 p-3 bg-white border border-slate-100/80 rounded-xl shadow-sm"
          >
            {/* Row 1: Icon + Label - centered as a group */}
            <div className="flex items-center justify-center gap-2">
              {/* Icon in circular background */}
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-500">
                  {getIconForStat(item.icon)}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-800 truncate">
                {item.label}
              </span>
            </div>
            
            {/* Row 2: Dots + Tier Chip - centered as a group */}
            <div className="flex items-center justify-center gap-3">
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

export const CourseDNACard = memo(function CourseDNACard({ items, inline = false, courseName }: CourseDNACardProps) {
  if (items.length === 0) return null;

  // Inline mode: content only, no card wrapper
  if (inline) {
    return <DNAContent items={items} courseName={courseName} />;
  }

  // Card mode: full card with wrapper
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4">
      <DNAContent items={items} courseName={courseName} />
    </div>
  );
});
