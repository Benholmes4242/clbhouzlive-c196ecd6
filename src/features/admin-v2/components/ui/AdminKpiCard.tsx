import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface TrendPoint { date: string; value: number; }

export interface AdminKpiCardProps {
  title: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ElementType;
  iconColor?: string;
  trend?: TrendPoint[];
  format?: 'number' | 'percent' | 'currency';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

function formatValue(value: number | string, format?: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'percent':  return `${value.toLocaleString()}%`;
    case 'currency': return `£${value.toLocaleString()}`;
    default:         return value.toLocaleString();
  }
}

function DeltaPill({ delta, label }: { delta: number; label?: string }) {
  const isUp      = delta > 0;
  const isDown    = delta < 0;

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold',
        isUp && 'text-green-600 dark:text-green-400',
        isDown && 'text-red-600 dark:text-red-400',
        !isUp && !isDown && 'text-muted-foreground',
      )}
    >
      <Icon className="w-3 h-3" />
      {isUp ? '+' : ''}{delta.toFixed(1)}%
      {label && <span className="text-muted-foreground font-normal ml-0.5">{label}</span>}
    </span>
  );
}

const MiniSparkline = ({ data, color }: { data: TrendPoint[]; color: string }) => (
  <ResponsiveContainer width="100%" height={40}>
    <LineChart data={data}>
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      <Tooltip
        contentStyle={{ display: 'none' }}
        formatter={(v: number) => [v.toLocaleString(), '']}
      />
    </LineChart>
  </ResponsiveContainer>
);

const LoadingSkeleton = () => (
  <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded bg-muted" />
      <div className="h-8 w-8 rounded-lg bg-muted" />
    </div>
    <div className="h-7 w-24 rounded bg-muted" />
    <div className="h-3 w-16 rounded bg-muted" />
  </div>
);

export function AdminKpiCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor = 'hsl(var(--accent-amber))',
  trend,
  format,
  isLoading,
  onClick,
  className,
}: AdminKpiCardProps) {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-3',
        onClick && 'cursor-pointer hover:border-border hover:shadow-md transition-all duration-150 active:scale-[0.99]',
        className,
      )}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      {/* Value */}
      <span className="text-[28px] font-bold tracking-tight text-foreground leading-none">
        {formatValue(value, format)}
      </span>

      {/* Delta */}
      {delta !== undefined && (
        <DeltaPill delta={delta} label={deltaLabel} />
      )}

      {/* Sparkline */}
      {trend && trend.length > 1 && (
        <div className="mt-1">
          <MiniSparkline data={trend} color={iconColor} />
        </div>
      )}
    </div>
  );
}
