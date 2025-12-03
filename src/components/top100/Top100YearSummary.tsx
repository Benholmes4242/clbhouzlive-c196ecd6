import React from 'react';
import type { YearSummary } from '@/lib/top100ProgressSelectors';

interface Top100YearSummaryProps {
  summary: YearSummary | null;
}

export function Top100YearSummary({ summary }: Top100YearSummaryProps) {
  if (!summary) return null;

  return (
    <section className="mt-3">
      <div className="rounded-2xl bg-muted/50 border border-border/60 px-5 py-3 flex items-center gap-4 whitespace-nowrap overflow-x-auto">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {summary.year}
        </span>
        <span className="text-sm text-foreground">
          <span className="font-semibold">{summary.rounds}</span> rounds
        </span>
        <span className="text-sm text-foreground">
          <span className="font-semibold">{summary.newCourses}</span> new courses
        </span>
        {summary.avgRating != null && (
          <span className="text-sm text-foreground">
            Avg rating <span className="font-semibold">{summary.avgRating}</span>
          </span>
        )}
      </div>
    </section>
  );
}
