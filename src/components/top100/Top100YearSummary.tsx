import React from 'react';
import type { YearSummary } from '@/lib/top100ProgressSelectors';

interface Top100YearSummaryProps {
  summary: YearSummary | null;
  regionsCount: number;
}

export function Top100YearSummary({ summary, regionsCount }: Top100YearSummaryProps) {
  if (!summary) return null;

  const stats = [
    { label: String(summary.year), value: 'Year' },
    { label: regionsCount.toString(), value: 'Regions' },
    { label: summary.newCourses.toString(), value: 'New courses' },
    { label: summary.avgRating?.toFixed(1) ?? '—', value: 'Avg rating' },
  ];

  return (
    <section className="px-2.5">
      {/* Supporting stats row - lighter visual weight, standardised label font, locked height */}
      <div className="bg-muted/40 border border-border/40 rounded-sq-md p-4 min-h-[72px]">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {stat.label}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
