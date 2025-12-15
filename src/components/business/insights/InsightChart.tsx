import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyAnalytics } from '@/hooks/useBusinessAnalytics';

interface ChartLine {
  key: string;
  label: string;
  color?: string;
}

interface InsightChartProps {
  title: string;
  subtitle?: string;
  data: DailyAnalytics[];
  lines: ChartLine[];
  variant?: 'line' | 'area';
  className?: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 71% 45%)', // emerald
  'hsl(38 92% 50%)',  // amber
  'hsl(262 83% 58%)', // violet
];

export function InsightChart({ 
  title, 
  subtitle, 
  data, 
  lines, 
  variant = 'area',
  className 
}: InsightChartProps) {
  const formattedData = data.map((item: DailyAnalytics) => ({
    ...item,
    dayFormatted: format(parseISO(item.day), 'MMM d'),
    dayShort: format(parseISO(item.day), 'd'),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-popover border border-border rounded-sq-sm p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const hasData = formattedData.length > 0;

  return (
    <div className={cn(
      "rounded-sq-md border border-border bg-card p-5",
      className
    )}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      
      <div className="h-[220px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {variant === 'area' ? (
              <AreaChart data={formattedData}>
                <defs>
                  {lines.map((line, index) => (
                    <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="0%" 
                        stopColor={line.color ?? CHART_COLORS[index % CHART_COLORS.length]} 
                        stopOpacity={0.3} 
                      />
                      <stop 
                        offset="100%" 
                        stopColor={line.color ?? CHART_COLORS[index % CHART_COLORS.length]} 
                        stopOpacity={0} 
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="dayFormatted" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                {lines.map((line, index) => (
                  <Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                    fill={`url(#gradient-${line.key})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={formattedData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="dayFormatted" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                {lines.map((line, index) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available for this period</p>
          </div>
        )}
      </div>
    </div>
  );
}
