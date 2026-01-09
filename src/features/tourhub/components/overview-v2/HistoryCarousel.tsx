/**
 * HistoryCarousel - "This Week in Golf History" editorial carousel
 */

import { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Trophy, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoryMoment } from '../../hooks/useTourOverviewData';

interface HistoryCarouselProps {
  moments: HistoryMoment[];
}

const categoryConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  major: { 
    icon: <Trophy className="w-3 h-3" />, 
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' 
  },
  iconic: { 
    icon: <Star className="w-3 h-3" />, 
    className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' 
  },
  records: { 
    icon: <Zap className="w-3 h-3" />, 
    className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' 
  },
};

export function HistoryCarousel({ moments }: HistoryCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  if (!moments.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-lg">This Week in Golf History</h3>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {moments.map((moment, idx) => {
            const category = moment.category ? categoryConfig[moment.category] : null;
            
            return (
              <div
                key={idx}
                className="flex-shrink-0 w-64 snap-start rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                {/* Year badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-foreground">{moment.year}</span>
                  {category && (
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      category.className
                    )}>
                      {category.icon}
                      {moment.category?.charAt(0).toUpperCase() + moment.category?.slice(1)}
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                  {moment.title}
                </h4>
                
                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {moment.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
