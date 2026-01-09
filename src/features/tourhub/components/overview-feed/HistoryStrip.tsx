/**
 * HistoryStrip - Horizontal editorial cards for "This Week in Golf History"
 */

import { History } from 'lucide-react';
import type { HistoryMoment } from '../../hooks/useTourOverviewData';

interface HistoryStripProps {
  moments: HistoryMoment[];
}

const categoryColors: Record<string, string> = {
  major: 'bg-amber-500/20 text-amber-600',
  iconic: 'bg-purple-500/20 text-purple-600',
  records: 'bg-blue-500/20 text-blue-600',
};

const momentGradients = [
  'from-slate-800 via-slate-700 to-zinc-800',
  'from-emerald-800 via-teal-700 to-cyan-800',
  'from-amber-800 via-orange-700 to-red-800',
];

export function HistoryStrip({ moments }: HistoryStripProps) {
  if (!moments.length) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Golf History
        </h3>
      </div>
      
      {/* Horizontal scroll */}
      <div className="-mx-4 sm:-mx-6">
        <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-hide">
          {moments.map((moment, idx) => {
            const gradient = momentGradients[idx % momentGradients.length];
            const categoryClass = categoryColors[moment.category || 'iconic'];
            
            return (
              <div
                key={`${moment.year}-${moment.title}`}
                className="flex-shrink-0 w-[200px] rounded-xl overflow-hidden"
              >
                <div className={`relative h-[110px] bg-gradient-to-br ${gradient} p-3 flex flex-col`}>
                  {/* Year + category */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/90 text-2xl font-bold">
                      {moment.year}
                    </span>
                    {moment.category && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${categoryClass}`}>
                        {moment.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <p className="text-white font-semibold text-sm leading-tight line-clamp-1">
                    {moment.title}
                  </p>
                  
                  {/* Description */}
                  <p className="text-white/60 text-xs mt-1 line-clamp-2 flex-1">
                    {moment.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
