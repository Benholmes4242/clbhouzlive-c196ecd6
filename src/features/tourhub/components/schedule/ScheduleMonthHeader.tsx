/**
 * ScheduleMonthHeader - Section header aligned with Tour Overview audit
 * 22px / 700 / tracking -0.3px section headers
 */

import { cn } from '@/lib/utils';

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

  return (
    <div className={cn("pt-6 pb-3 px-4", className)}>
      <div className="flex items-center justify-between">
        <h3 
          className="text-foreground"
          style={{ 
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}
        >
          {monthLabel}
        </h3>
        
        <span 
          className="text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>

      {breakdownParts.length > 0 && (
        <p className="mt-0.5 text-muted-foreground/70" style={{ fontSize: '12px', fontWeight: 400 }}>
          {breakdownParts.join(' · ')}
        </p>
      )}
    </div>
  );
}
