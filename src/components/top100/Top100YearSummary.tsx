import React from 'react';
import { Calendar, Globe2, PlusCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { YearSummary } from '@/lib/top100ProgressSelectors';

interface Top100YearSummaryProps {
  summary: YearSummary | null;
  regionsCount: number;
  // Optional delta values for micro-delta display
  yearDelta?: number;
  regionsDelta?: number;
  newCoursesDelta?: number;
  avgRatingDelta?: number;
}

// Stat item with icon and optional delta (A4)
function StatItem({ 
  icon: Icon, 
  value, 
  label, 
  delta 
}: { 
  icon: React.ElementType;
  value: string | number;
  label: string;
  delta?: number | null;
}) {
  const showDelta = delta !== undefined && delta !== null && delta !== 0;
  const deltaPrefix = delta && delta > 0 ? '+' : '';
  
  return (
    <div className="text-center flex flex-col items-center gap-1">
      {/* Slightly increased icon opacity (item 2) */}
      <Icon className="w-3.5 h-3.5 text-muted-foreground/70" />
      <p className="text-sm font-semibold leading-tight text-foreground">
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
      {/* Micro-delta line (A4) */}
      {showDelta && (
        <p className="text-[10px] font-medium text-emerald-500">
          {deltaPrefix}{delta} this year
        </p>
      )}
    </div>
  );
}

export function Top100YearSummary({ 
  summary, 
  regionsCount,
  yearDelta,
  regionsDelta,
  newCoursesDelta,
  avgRatingDelta,
}: Top100YearSummaryProps) {
  if (!summary) return null;

  return (
    <section className="px-2.5">
      {/* Supporting stats row - lighter visual weight, with icons (A4) */}
      <div className="bg-muted/40 border border-border/40 rounded-sq-md p-4 min-h-[72px]">
        <div className="grid grid-cols-4 gap-3">
          <StatItem 
            icon={Calendar}
            value={String(summary.year)}
            label="Year"
            delta={yearDelta}
          />
          <StatItem 
            icon={Globe2}
            value={regionsCount.toString()}
            label="Regions"
            delta={regionsDelta}
          />
          <StatItem 
            icon={PlusCircle}
            value={summary.newCourses.toString()}
            label="New"
            delta={newCoursesDelta}
          />
          <StatItem 
            icon={Star}
            value={summary.avgRating?.toFixed(1) ?? '—'}
            label="Avg rating"
            delta={avgRatingDelta}
          />
        </div>
      </div>
    </section>
  );
}