import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';
import { cn } from '@/lib/utils';

interface Top100RegionProgressGridProps {
  lists: Top100ListProgress[];
  onListClick: (slug: string) => void;
}

export function Top100RegionProgressGrid({
  lists,
  onListClick,
}: Top100RegionProgressGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Your Journey by Region</h3>
      <div className="grid gap-3">
        {lists.map((list) => {
          const progressPercent = list.total > 0 ? (list.played / list.total) * 100 : 0;
          const hasStarted = list.played > 0;

          return (
            <button
              key={list.listSlug}
              onClick={() => onListClick(list.listSlug)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all hover:border-primary-accent/40',
                hasStarted
                  ? 'bg-card border-border/60 hover:shadow-md'
                  : 'bg-surface-alt border-border/40'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{list.listName}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {list.played} / {list.total} courses played
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
                <Progress value={progressPercent} className="h-1.5" />
                {list.played > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {progressPercent >= 100
                      ? '🎉 List completed!'
                      : `${(100 - progressPercent).toFixed(0)}% remaining to complete this list`}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
