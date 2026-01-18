/**
 * DataFutures - Locked data indicators
 * Shows upcoming features as data feeds come online
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Radio, Clock, BarChart2, Trophy, Zap } from 'lucide-react';
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
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900">Coming Soon</h2>
      </div>

      {/* Locked items grid */}
      <div className="grid grid-cols-2 gap-3">
        {lockedItems.map((item, index) => {
          const Icon = iconMap[item.key] || Lock;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-hidden"
            >
              {/* Lock overlay */}
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-600 text-sm">{item.label}</p>
                  <p className="text-xs text-slate-400">
                    {item.comingSoon ? 'Coming Soon' : 'Unlocking...'}
                  </p>
                </div>
              </div>

              {/* Progress bar (visual only) */}
              <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: item.comingSoon ? '20%' : '60%' }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center mt-4">
        Data integrations unlock automatically as feeds become available
      </p>
    </section>
  );
});
