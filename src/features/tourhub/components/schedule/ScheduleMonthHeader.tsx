/**
 * ScheduleMonthHeader - Premium month section header
 * 
 * Features:
 * - Bold uppercase typography with proper letter-spacing
 * - Event count in badge style
 * - Subtle divider with gradient fade
 * - Increased top spacing (20px)
 */

import { cn } from '@/lib/utils';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  className 
}: ScheduleMonthHeaderProps) {
  return (
    <div className={cn("pt-5 pb-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        {/* Month label - Bold uppercase with letter-spacing */}
        <h3 
          className="font-extrabold text-slate-800 uppercase"
          style={{ 
            fontSize: '13px',
            letterSpacing: '0.08em',
          }}
        >
          {monthLabel}
        </h3>
        
        {/* Event count - badge style */}
        <span 
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ 
            background: 'rgba(30, 41, 59, 0.08)',
            color: '#64748b',
          }}
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Subtle divider with gradient fade */}
      <div 
        className="h-px"
        style={{
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.15) 0%, rgba(30, 41, 59, 0.05) 100%)',
        }}
      />
    </div>
  );
}
