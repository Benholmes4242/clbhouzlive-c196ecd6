/**
 * ScheduleMonthHeader - Cinematic month divider (Apple-grade)
 * 
 * Features:
 * - Bold uppercase typography
 * - Elegant gradient divider line
 * - Dynamic filtered event count badge
 * - Optional tour breakdown line (e.g. "3 PGA · 2 DP World · 1 LPGA")
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA',
  EURO: 'DP World',
  LPGA: 'LPGA',
  CHAMP: 'Champions',
  PGAD: 'Korn Ferry',
  LIV: 'LIV',
};

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  /** Map of tour_code → count for this month's filtered tournaments */
  tourBreakdown?: Record<string, number>;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  tourBreakdown,
  className 
}: ScheduleMonthHeaderProps) {
  // Build tour breakdown string: "3 PGA · 2 DP World · 1 LPGA"
  const breakdownParts = tourBreakdown
    ? Object.entries(tourBreakdown)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => `${count} ${TOUR_LABELS[code] || code}`)
    : [];

  return (
    <motion.div 
      className={cn("pt-6 pb-3 px-4", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        {/* Month label with icon */}
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-foreground"
          >
            <Calendar className="w-3.5 h-3.5 text-background" />
          </div>
          <h3 
            className="font-extrabold text-foreground uppercase"
            style={{ 
              fontSize: '13px',
              letterSpacing: '0.1em',
            }}
          >
            {monthLabel}
          </h3>
        </div>
        
        {/* Event count badge */}
        <span 
          className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-muted text-muted-foreground"
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tour breakdown line */}
      {breakdownParts.length > 1 && (
        <p className="text-[11px] text-muted-foreground/70 font-medium pl-9 mb-2">
          {breakdownParts.join(' · ')}
        </p>
      )}
      
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-border to-transparent" />
    </motion.div>
  );
}
