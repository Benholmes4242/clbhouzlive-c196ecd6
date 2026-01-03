import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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
  courses: { id: string; name: string; playedAt: string }[];
}

export const Top100ProgressTimeline: React.FC<Top100ProgressTimelineProps> = ({
  rounds,
  onViewAll,
}) => {
  const navigate = useNavigate();
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
          id: r.course_id,
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

  const handleCourseClick = (courseId: string) => {
    setSelectedMonth(null);
    navigate(`/courses/${courseId}`);
  };

  const handleLogRound = () => {
    setSelectedMonth(null);
    navigate('/courses?action=log');
  };

  return (
    <>
      {/* Section rendered directly on page background - no card */}
      <section className="px-2.5">
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
                  'flex-1 rounded-t transition-all cursor-pointer',
                  'hover:opacity-80 active:scale-95',
                  isActive
                    ? 'bg-primary/80 hover:bg-primary'
                    : 'bg-muted/60 hover:bg-muted/80'
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
      </section>

      {/* Month detail sheet */}
      <Sheet open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">
              {selectedMonth?.label}
            </SheetTitle>
          </SheetHeader>

          {selectedMonth?.count === 0 ? (
            /* Empty state - nudged upward for better balance, calm CTA */
            <div className="flex flex-col items-center justify-center py-6 pb-10 px-4 text-center min-h-[180px] -mt-4">
              <p className="text-sm text-muted-foreground mb-1">
                No Top 100 courses logged this month.
              </p>
              <p className="text-xs text-muted-foreground/70 mb-6">
                Log a round to keep the momentum going.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogRound}
                className="text-sm border-border/80 rounded-lg"
              >
                Log a Top 100 round
              </Button>
            </div>
          ) : (
            /* Courses list - each row tappable with clear feedback */
            <div className="overflow-y-auto max-h-[40vh]">
              <p className="text-xs text-muted-foreground mb-3">
                {selectedMonth?.count} Top 100 round{selectedMonth?.count !== 1 ? 's' : ''} logged
              </p>
              <div className="divide-y divide-border/30">
                {selectedMonth?.courses.map((course, idx) => (
                  <button
                    key={`${course.id}-${idx}`}
                    type="button"
                    onClick={() => handleCourseClick(course.id)}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-2 -mx-2 rounded-lg',
                      'text-left transition-all duration-100 cursor-pointer',
                      'hover:bg-muted/50 active:bg-muted/80 active:scale-[0.995]'
                    )}
                  >
                    <span className="text-sm font-medium text-foreground truncate pr-3 flex-1">
                      {course.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 mr-0.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(course.playedAt), 'd MMM')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
