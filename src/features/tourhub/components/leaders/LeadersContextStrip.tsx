/**
 * LeadersContextStrip - Glass pill showing data source and update frequency
 * Users should never wonder "what am I looking at?"
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Globe, Clock } from 'lucide-react';

interface LeadersContextStripProps {
  source: string;
  updateFrequency?: string;
  isLive?: boolean;
  className?: string;
}

export const LeadersContextStrip: React.FC<LeadersContextStripProps> = ({
  source,
  updateFrequency = 'Updated weekly',
  isLive = false,
  className,
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between",
      "rounded-sq-pill px-3 py-1.5",
      "bg-slate-100/70 dark:bg-white/5",
      className
    )}>
      {/* Source */}
      <div className="flex items-center gap-1.5">
        <Globe className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{source}</span>
      </div>

      {/* Update status */}
      <div className="flex items-center gap-1.5">
        {isLive ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Live
            </span>
          </>
        ) : (
          <>
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{updateFrequency}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadersContextStrip;
