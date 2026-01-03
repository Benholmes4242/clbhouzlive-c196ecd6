import React, { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Round {
  course_id: string;
  course_name: string;
  played_at: string;
  [key: string]: any;
}

interface Top100ProgressTimelineProps {
  rounds: Round[];
  onViewAll?: () => void;
}

interface MonthData {
  date: Date;
  label: string;
  shortLabel: string;
  count: number;
  courses: { name: string; playedAt: string }[];
}

export const Top100ProgressTimeline: React.FC<Top100ProgressTimelineProps> = ({
  rounds,
  onViewAll,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);

  // Build last 12 months data
  const monthsData = useMemo(() => {
    const now = new Date();
    const months: MonthData[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const coursesThisMonth = rounds
        .filter((r) => {
          const playedDate = new Date(r.played_at);
          return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
        })
        .map((r) => ({
          name: r.course_name,
          playedAt: r.played_at,
        }));

      months.push({
        date: monthDate,
        label: format(monthDate, 'MMMM yyyy'),
        shortLabel: format(monthDate, 'MMM'),
        count: coursesThisMonth.length,
        courses: coursesThisMonth,
      });
    }

    return months;
  }, [rounds]);

  const maxCount = Math.max(...monthsData.map((m) => m.count), 1);
  const totalThisYear = monthsData.reduce((sum, m) => sum + m.count, 0);

  return (
    <>
      <div className="bg-card border border-border/60 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">2026 Progress</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalThisYear} course{totalThisYear !== 1 ? 's' : ''} logged
          </span>
        </div>

        {/* Timeline bars */}
        <div className="flex items-end gap-1 h-16">
          {monthsData.map((month, idx) => {
            const heightPercent = month.count > 0 ? Math.max(20, (month.count / maxCount) * 100) : 8;
            const isActive = month.count > 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedMonth(month)}
                className={cn(
                  'flex-1 rounded-t transition-all hover:opacity-80',
                  isActive
                    ? 'bg-primary/80 hover:bg-primary'
                    : 'bg-muted/40 hover:bg-muted/60'
                )}
                style={{ height: `${heightPercent}%` }}
                aria-label={`${month.label}: ${month.count} courses`}
              />
            );
          })}
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-1.5">
          {monthsData.map((month, idx) => (
            <span
              key={idx}
              className="flex-1 text-[9px] text-muted-foreground text-center truncate"
            >
              {month.shortLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Month detail sheet */}
      <Sheet open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">
              {selectedMonth?.label}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 overflow-y-auto max-h-[40vh]">
            {selectedMonth?.count === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No Top 100 courses logged this month.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {selectedMonth?.count} course{selectedMonth?.count !== 1 ? 's' : ''} logged
                </p>
                <div className="space-y-2">
                  {selectedMonth?.courses.slice(0, 5).map((course, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                    >
                      <span className="text-sm font-medium text-foreground truncate pr-2">
                        {course.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(course.playedAt), 'd MMM')}
                      </span>
                    </div>
                  ))}
                  {(selectedMonth?.courses.length ?? 0) > 5 && (
                    <button
                      type="button"
                      onClick={onViewAll}
                      className="w-full text-center text-sm text-primary font-medium py-2"
                    >
                      View all {selectedMonth?.courses.length} courses
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
