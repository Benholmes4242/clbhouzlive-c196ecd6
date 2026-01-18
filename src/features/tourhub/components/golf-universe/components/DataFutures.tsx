/**
 * DataFutures - Compact locked data indicators
 * Shows upcoming features as data feeds come online
 * 
 * Refinements:
 * - Compact single-row tiles
 * - No large empty cards
 * - "Unlocking the world" feel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Radio, Clock, BarChart2, Trophy } from 'lucide-react';
import type { DataUnlock } from '../types';

interface DataFuturesProps {
  items: DataUnlock[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  leaderboards: Radio,
  'tee-times': Clock,
  'hole-stats': BarChart2,
  fedex: Trophy,
};

export const DataFutures = memo(function DataFutures({ items }: DataFuturesProps) {
  const lockedItems = items.filter(item => item.locked);
  
  if (lockedItems.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Section Header - minimal */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5 text-amber-600" />
        </div>
        <span className="text-sm font-medium text-slate-600">Unlocking Soon</span>
      </div>

      {/* Compact horizontal list */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {lockedItems.map((item, index) => {
          const Icon = iconMap[item.key] || Lock;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-full"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200/70 flex items-center justify-center">
                <Icon className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {item.label}
              </span>
              <Lock className="w-2.5 h-2.5 text-slate-300" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});
