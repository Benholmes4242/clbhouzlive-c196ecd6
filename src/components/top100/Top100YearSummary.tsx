import React from 'react';
import type { YearSummary } from '@/lib/top100ProgressSelectors';

interface Top100YearSummaryProps {
  summary: YearSummary | null;
}

export function Top100YearSummary({ summary }: Top100YearSummaryProps) {
  if (!summary) return null;

  return (
    <section className="mt-3">
      <div className="rounded-2xl bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {summary.year} so far
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground">
          <div>
            <span className="font-semibold">{summary.rounds}</span> rounds
          </div>
          <div className="h-3 w-px bg-border" />
          <div>
            <span className="font-semibold">{summary.newCourses}</span> new courses
          </div>
          {summary.avgRating != null && (
            <>
              <div className="h-3 w-px bg-border" />
              <div>
                Avg rating <span className="font-semibold">{summary.avgRating}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
