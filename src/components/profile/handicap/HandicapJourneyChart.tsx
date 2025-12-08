import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  ReferenceLine 
} from 'recharts';
import { Pill } from '@/components/ui/pill';
import type { HandicapTimelinePoint } from '@/lib/mockHandicapData';

interface HandicapJourneyChartProps {
  timeline: HandicapTimelinePoint[];
}

type TimeRange = '3m' | '6m' | '12m' | 'all';

const HandicapJourneyChart: React.FC<HandicapJourneyChartProps> = ({ timeline }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('12m');

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '3m':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case '12m':
        cutoff.setMonth(now.getMonth() - 12);
        break;
      case 'all':
      default:
        cutoff.setFullYear(2000);
        break;
    }

    return timeline
      .filter(p => new Date(p.date) >= cutoff)
      .map(p => ({
        ...p,
        dateLabel: new Date(p.date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }),
      }));
  }, [timeline, timeRange]);

  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 10];
    const indices = filteredData.map(d => d.index);
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    const padding = (max - min) * 0.2 || 1;
    return [Math.max(0, min - padding), max + padding];
  }, [filteredData]);

  const avgIndex = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((sum, d) => sum + d.index, 0) / filteredData.length;
  }, [filteredData]);

  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '3m', label: '3 months' },
    { key: '6m', label: '6 months' },
    { key: '12m', label: '12 months' },
    { key: 'all', label: 'All' },
  ];

  return (
    <section className="bg-muted border border-border rounded-sq-md p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Handicap Journey</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          See how your index has moved over time
        </p>
      </div>

      {/* Time range pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {timeRanges.map(({ key, label }) => (
          <Pill
            key={key}
            size="sm"
            active={timeRange === key}
            onClick={() => setTimeRange(key)}
          >
            {label}
          </Pill>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="dateLabel" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <ReferenceLine 
              y={avgIndex} 
              stroke="hsl(var(--border))" 
              strokeDasharray="4 4" 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload as HandicapTimelinePoint & { dateLabel: string };
                return (
                  <div className="bg-background border border-border rounded-sq-sm px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{data.dateLabel}</p>
                    <p className="text-sm font-semibold text-foreground">{data.courseName}</p>
                    <p className="text-sm font-bold text-primary-accent">
                      Index: {data.index.toFixed(1)}
                    </p>
                  </div>
                );
              }}
            />
            <Line 
              type="monotone" 
              dataKey="index" 
              stroke="hsl(var(--primary-accent))" 
              strokeWidth={2.5}
              dot={{ fill: 'hsl(var(--primary-accent))', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary-accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary-accent rounded-full" />
          <span>Handicap Index</span>
        </div>
        <span>Last {filteredData.length} qualifying rounds</span>
      </div>
    </section>
  );
};

export default HandicapJourneyChart;
