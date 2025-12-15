import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightStatCardProps {
  label: string;
  value: number;
  previousValue?: number;
  icon?: React.ElementType;
  subtitle?: string;
  className?: string;
}

export function InsightStatCard({ 
  label, 
  value, 
  previousValue,
  icon: Icon,
  subtitle,
  className,
}: InsightStatCardProps) {
  // Calculate trend
  const hasTrend = previousValue !== undefined && previousValue > 0;
  const percentChange = hasTrend 
    ? Math.round(((value - previousValue) / previousValue) * 100) 
    : 0;
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;
  const isNeutral = percentChange === 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-sq-md border border-border bg-card p-4",
      "transition-all duration-200 hover:border-border/80 hover:shadow-sm",
      className
    )}>
      {/* Icon badge - top right */}
      {Icon && (
        <div className="absolute top-3 right-3 h-9 w-9 rounded-sq-sm bg-muted/60 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
      )}

      {/* Label */}
      <p className="text-sm font-medium text-muted-foreground pr-10">{label}</p>

      {/* Value */}
      <p className="text-3xl font-semibold tracking-tight mt-2 text-foreground">
        {value.toLocaleString()}
      </p>

      {/* Trend indicator or subtitle */}
      <div className="mt-2 flex items-center gap-2">
        {hasTrend && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5",
            isPositive && "text-emerald-600 bg-emerald-500/10",
            isNegative && "text-red-500 bg-red-500/10",
            isNeutral && "text-muted-foreground bg-muted"
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {isPositive && '+'}{percentChange}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
