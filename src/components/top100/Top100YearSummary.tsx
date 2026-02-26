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
    <div className="text-center flex flex-col items-center gap-1 group cursor-default transition-colors hover:bg-muted/30 rounded-lg py-1 -my-1">
      {/* Icon - consistent muted color with hover state */}
      <Icon className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
      <p className="text-xl font-bold leading-tight text-foreground tabular-nums">
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
    <section>
      {/* Stats Row - card with subtle dividers between columns */}
      <div className="bg-card border border-border/60 rounded-2xl p-5 min-h-[72px]">
        <div className="grid grid-cols-4 gap-0">
          {/* Year */}
          <div className="relative">
            <StatItem 
              icon={Calendar}
              value={String(summary.year)}
              label="Year"
              delta={yearDelta}
            />
            {/* Subtle divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />
          </div>
          
          {/* Regions */}
          <div className="relative">
            <StatItem 
              icon={Globe2}
              value={regionsCount.toString()}
              label="Regions"
              delta={regionsDelta}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />
          </div>
          
          {/* New */}
          <div className="relative">
            <StatItem 
              icon={PlusCircle}
              value={summary.newCourses.toString()}
              label="New"
              delta={newCoursesDelta}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />
          </div>
          
          {/* Avg rating - no divider after last */}
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