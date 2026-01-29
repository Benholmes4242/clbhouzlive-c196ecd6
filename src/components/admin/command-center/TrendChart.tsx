import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrendChartProps {
  /** Chart data points */
  data: TrendDataPoint[];
  /** Chart title */
  title: string;
  /** Chart type */
  type?: 'bar' | 'line' | 'area';
  /** Chart color */
  color?: 'primary' | 'emerald' | 'amber' | 'blue';
  /** Show value labels on hover */
  showLabels?: boolean;
  /** Height of the chart area */
  height?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TrendChart({
  data,
  title,
  type = 'bar',
  color = 'primary',
  showLabels = true,
  height = 60,
  isLoading = false,
  className
}: TrendChartProps) {
  const colorStyles = {
    primary: {
      bar: 'bg-primary/70 hover:bg-primary',
      line: 'stroke-primary',
      area: 'fill-primary/20 stroke-primary',
      text: 'text-primary',
      textBold: 'text-primary font-bold'
    },
    emerald: {
      bar: 'bg-emerald-500/70 hover:bg-emerald-500',
      line: 'stroke-emerald-500',
      area: 'fill-emerald-500/20 stroke-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      textBold: 'text-emerald-600 dark:text-emerald-400 font-bold'
    },
    amber: {
      bar: 'bg-amber-500/70 hover:bg-amber-500',
      line: 'stroke-amber-500',
      area: 'fill-amber-500/20 stroke-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      textBold: 'text-amber-600 dark:text-amber-400 font-bold'
    },
    blue: {
      bar: 'bg-blue-500/70 hover:bg-blue-500',
      line: 'stroke-blue-500',
      area: 'fill-blue-500/20 stroke-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      textBold: 'text-blue-600 dark:text-blue-400 font-bold'
    }
  };

  const { maxValue, total, average } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxValue: 0, total: 0, average: 0 };
    }
    const values = data.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      maxValue: Math.max(...values, 1), // Prevent division by zero
      total: sum,
      average: Math.round(sum / values.length * 10) / 10
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-4', className)}>
        <div className="flex items-center justify-center" style={{ height }}>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const styles = colorStyles[color];

  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      {/* Header - improved typography */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Total:</span>
          <span className={styles.textBold}>{total}</span>
          <span className="mx-1.5 text-border">|</span>
          <span>Avg:</span>
          <span className="font-bold text-foreground">{average}/day</span>
        </div>
      </div>

      {/* Chart area */}
      {type === 'bar' && (
        <div 
          className="flex items-end gap-1" 
          style={{ height }}
        >
          {data.map((point, i) => {
            const heightPercent = (point.value / maxValue) * 100;
            return (
              <div
                key={point.date}
                className="group relative flex-1 flex flex-col justify-end"
                style={{ height: '100%' }}
              >
                {/* Tooltip */}
                {showLabels && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-popover border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow-md">
                      <div className="font-medium">{point.value}</div>
                      <div className="text-muted-foreground">{formatDate(point.date)}</div>
                    </div>
                  </div>
                )}
                
                {/* Bar */}
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-150',
                    styles.bar,
                    point.value === 0 && 'bg-muted/50'
                  )}
                  style={{ 
                    height: point.value === 0 ? '2px' : `${Math.max(heightPercent, 5)}%`,
                    minHeight: '2px'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {type === 'line' && (
        <svg 
          viewBox={`0 0 ${data.length * 10} ${height}`} 
          className="w-full overflow-visible"
          style={{ height }}
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.line}
            points={data.map((point, i) => {
              const x = (i / (data.length - 1)) * (data.length * 10);
              const y = height - (point.value / maxValue) * (height - 4);
              return `${x},${y}`;
            }).join(' ')}
          />
          {/* Dots */}
          {data.map((point, i) => {
            const x = (i / (data.length - 1)) * (data.length * 10);
            const y = height - (point.value / maxValue) * (height - 4);
            return (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                r="3"
                className={cn('fill-background', styles.line)}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      )}

      {type === 'area' && (
        <svg 
          viewBox={`0 0 ${data.length * 10} ${height}`} 
          className="w-full overflow-visible"
          style={{ height }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className={styles.area} stopOpacity="0.4" />
              <stop offset="100%" className={styles.area} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            fill={`url(#gradient-${color})`}
            d={`
              M 0,${height}
              ${data.map((point, i) => {
                const x = (i / (data.length - 1)) * (data.length * 10);
                const y = height - (point.value / maxValue) * (height - 4);
                return `L ${x},${y}`;
              }).join(' ')}
              L ${data.length * 10},${height}
              Z
            `}
          />
          
          {/* Line */}
          <polyline
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.line}
            points={data.map((point, i) => {
              const x = (i / (data.length - 1)) * (data.length * 10);
              const y = height - (point.value / maxValue) * (height - 4);
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
      )}

      {/* Date labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{data.length > 0 ? formatDate(data[0].date) : ''}</span>
        <span>{data.length > 0 ? formatDate(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
