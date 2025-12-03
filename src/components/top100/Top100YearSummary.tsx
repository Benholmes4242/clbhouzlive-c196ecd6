import React from 'react';
import type { YearSummary } from '@/lib/top100ProgressSelectors';

interface Top100YearSummaryProps {
  summary: YearSummary | null;
  regionsCount: number;
}

export function Top100YearSummary({ summary, regionsCount }: Top100YearSummaryProps) {
  if (!summary) return null;

  return (
    <section className="mt-3">
      <div className="rounded-2xl bg-muted/50 border border-border/60 px-4 py-3 flex items-center justify-between whitespace-nowrap overflow-x-auto">
        {/* Year - left aligned */}
        <span className="text-xs font-semibold text-foreground">
          {summary.year}
        </span>

        {/* Regions */}
        <div className="flex flex-col items-center text-xs">
          <span className="font-semibold text-foreground">{regionsCount}</span>
          <span className="text-[11px] text-muted-foreground">
            {regionsCount === 1 ? 'region' : 'regions'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* New courses - middle */}
        <div className="flex flex-col items-center text-xs">
          <span className="font-semibold text-foreground">{summary.newCourses}</span>
          <span className="text-[11px] text-muted-foreground">new courses</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Avg rating */}
        <div className="flex flex-col items-center text-xs">
          <span className="font-semibold text-foreground">
            {summary.avgRating?.toFixed(1) ?? '—'}
          </span>
          <span className="text-[11px] text-muted-foreground">Avg rating</span>
        </div>
      </div>
    </section>
  );
}
