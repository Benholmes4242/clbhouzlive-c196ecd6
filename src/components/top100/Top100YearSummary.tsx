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
      {/* Icon - slightly reduced opacity */}
      <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
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
    <section>
      {/* Stats Row - KEEP as card, p-5 internal padding, gap-6 between columns */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 min-h-[72px]">
        <div className="grid grid-cols-4 gap-6">
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