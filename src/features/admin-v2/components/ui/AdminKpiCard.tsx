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
      className="inline-flex items-center gap-1 font-semibold"
      style={{
        fontSize: 11,
        color: isUp ? '#17C964' : isDown ? '#F31260' : '#94A3B8',
      }}
    >
      <Icon className="w-3 h-3" />
      {isUp ? '+' : ''}{delta.toFixed(1)}%
      {label && <span className="font-normal ml-0.5" style={{ color: '#94A3B8' }}>{label}</span>}
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
  <div
    className="p-5 flex flex-col gap-3 animate-pulse"
    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}
  >
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded" style={{ background: '#F1F5F9' }} />
      <div className="h-8 w-8 rounded-[10px]" style={{ background: '#F1F5F9' }} />
    </div>
    <div className="h-7 w-24 rounded" style={{ background: '#F1F5F9' }} />
    <div className="h-3 w-16 rounded" style={{ background: '#F1F5F9' }} />
  </div>
);

export function AdminKpiCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor = '#F5A623',
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
        'p-5 flex flex-col gap-3 transition-all duration-150',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className,
      )}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
      }}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.borderColor = '#CBD5E1';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderTop = '2px solid #F5A623';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.borderColor = '#E2E8F0';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderTop = '1px solid #E2E8F0';
      } : undefined}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {title}
        </span>
        {Icon && (
          <div
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      {/* Value */}
      <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: '#0F172A' }}>
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
