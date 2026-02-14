/**
 * ScheduleMonthHeader - Section header matching Overview's display-sm token
 * 
 * Design: 22px/700 bold heading with event count badge
 * Matches Overview section headers (What's Coming, World Rankings, etc.)
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  tourBreakdown?: Record<string, number>;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  tourBreakdown,
  className 
}: ScheduleMonthHeaderProps) {
  const breakdownParts = tourBreakdown
    ? Object.entries(tourBreakdown)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => `${count} ${TOUR_LABELS[code] || code}`)
    : [];

  // Format month label: "FEBRUARY 2026" → "February 2026"
  const formattedMonth = monthLabel.charAt(0) + monthLabel.slice(1).toLowerCase();

  return (
    <motion.div 
      className={cn("pt-2 pb-3 px-4", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header row — matching Overview section headers */}
      <div className="flex items-center justify-between">
        <h3 
          style={{ 
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#1C1917',
          }}
        >
          {formattedMonth}
        </h3>
        
        <span 
          className="text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tour breakdown line */}
      {breakdownParts.length > 1 && (
        <p className="mt-1" style={{ fontSize: '11px', fontWeight: 500, color: '#A8A29E' }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </motion.div>
  );
}
