import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
  rounds: Round[];           // Year-scoped rounds (already filtered to the selected year)
  year?: number;             // The year being displayed (defaults to current year)
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
  year,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);

  const displayYear = year ?? new Date().getFullYear();

  // Build all 12 months for the selected year
  const monthsData = useMemo(() => {
    const months: MonthData[] = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = new Date(displayYear, monthIndex, 1);
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
  }, [rounds, displayYear]);

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
      {/* Section rendered directly - no card wrapper */}
      <section>
        {/* Header - dynamic year label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{displayYear} Progress</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalThisYear} course{totalThisYear !== 1 ? 's' : ''} logged
          </span>
        </div>

        {/* Timeline bars - animated on first render */}
        <div className="flex items-end gap-1 h-16">
          {monthsData.map((month, idx) => {
            const heightPercent = month.count > 0 ? Math.max(20, (month.count / maxCount) * 100) : 6;
            const isActive = month.count > 0;
            const isCurrent = idx === new Date().getMonth();

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedMonth(month)}
                className={cn(
                  'flex-1 rounded-t cursor-pointer relative overflow-hidden',
                  'active:scale-[0.97] active:opacity-80 transition-all duration-200',
                  isActive
                    ? 'shadow-sm'
                    : ''
                )}
                style={{ 
                  height: `${heightPercent}%`,
                  background: isActive 
                    ? 'linear-gradient(to top, #F7931E, rgba(247,147,30,0.70))'
                    : 'rgba(15,23,42,0.08)',
                  // Animate grow from bottom
                  animation: `bar-grow 0.5s ease-out ${idx * 0.03}s both`,
                }}
                aria-label={`${month.label}: ${month.count} courses`}
              >
                {/* Current month indicator ring */}
                {isCurrent && !isActive && (
                  <div className="absolute inset-0 border-2 border-dashed rounded-t" style={{ borderColor: 'rgba(247,147,30,0.30)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-1.5">
          {monthsData.map((month, idx) => {
            const isCurrent = idx === new Date().getMonth();
            return (
              <span
                key={idx}
                className={cn(
                  "flex-1 text-[9px] text-center truncate transition-colors",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {month.shortLabel}
              </span>
            );
          })}
        </div>
        
        {/* CSS animation for bar growth */}
        <style>{`
          @keyframes bar-grow {
            from { transform: scaleY(0); transform-origin: bottom; }
            to { transform: scaleY(1); transform-origin: bottom; }
          }
        `}</style>
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
                      'active:bg-muted/50 active:scale-[0.995]'
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
