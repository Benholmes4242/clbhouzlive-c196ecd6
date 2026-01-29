/**
 * ScheduleMonthSection - Premium month header with event count
 */

import { cn } from '@/lib/utils';

interface ScheduleMonthSectionProps {
  monthLabel: string;
  eventCount: number;
}

export function ScheduleMonthSection({ monthLabel, eventCount }: ScheduleMonthSectionProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10">
      <h3 className="th-caption-2 text-white/60">
        {monthLabel}
      </h3>
      <span className="th-caption-1 text-white/40">
        {eventCount} {eventCount === 1 ? 'event' : 'events'}
      </span>
    </div>
  );
}
