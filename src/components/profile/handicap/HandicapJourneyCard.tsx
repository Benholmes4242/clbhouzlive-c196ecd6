import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { HandicapTimelinePoint } from '@/lib/mockHandicapData';

type RangeKey = '3M' | '6M' | '12M' | 'ALL';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '3M', label: '3 months' },
  { key: '6M', label: '6 months' },
  { key: '12M', label: '12 months' },
  { key: 'ALL', label: 'All time' },
];

// Custom tooltip
type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: { index: number; courseName: string } }>;
  label?: string;
};

const HandicapTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;

  return (
    <div className="rounded-sq-md bg-background px-3 py-2 shadow-md ring-1 ring-border">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground mb-0.5">
        Index {point.index.toFixed(1)}
      </p>
      <p className="text-xs text-muted-foreground">
        {point.courseName}
      </p>
    </div>
  );
};

// Range toggle chips - matching Top 100 filter chips
type RangeToggleProps = {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
};

const HandicapRangeToggle: React.FC<RangeToggleProps> = ({ value, onChange }) => {
  return (
    <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/60 p-1">
      {RANGE_OPTIONS.map((option) => {
        const isActive = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={[
              'px-3 py-1.5 text-xs font-medium rounded-sq-pill transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

// Main card component
type Props = {
  timeline: HandicapTimelinePoint[];
};

export const HandicapJourneyCard: React.FC<Props> = ({ timeline }) => {
  const [range, setRange] = useState<RangeKey>('12M');

  const filteredData = useMemo(() => {
    if (range === 'ALL') return timeline;

    const monthsBack = range === '3M' ? 3 : range === '6M' ? 6 : 12;

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);

    return timeline.filter((point) => {
      const d = new Date(point.date);
      return d >= cutoff;
    });
  }, [timeline, range]);

  const chartData = filteredData.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    }),
    index: p.index,
    courseName: p.courseName,
  }));

  return (
    <section className="rounded-sq-lg bg-background border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Handicap Journey
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track how your index has moved over time
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Data source
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              England Golf
            </p>
          </div>
        </div>

        {/* Range toggle */}
        <HandicapRangeToggle value={range} onChange={setRange} />
      </div>

      {/* Chart with horizontal padding */}
      <div className="px-4 pb-4">
        <div className="h-[200px] w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                width={32}
                domain={['dataMin - 0.3', 'dataMax + 0.3']}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                content={<HandicapTooltip />}
              />
              <Area
                type="monotone"
                dataKey="index"
                stroke="hsl(var(--primary-accent))"
                strokeWidth={2}
                fill="hsl(var(--primary-accent))"
                fillOpacity={0.12}
                dot={{ r: 3, strokeWidth: 1, stroke: 'hsl(var(--primary-accent))', fill: 'hsl(var(--background))' }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary-accent))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-[5px] w-4 rounded-sq-pill bg-primary-accent" />
              Handicap Index
            </span>
            <span className="hidden sm:inline text-muted-foreground/70">
              Tap points for details
            </span>
          </div>
          <span className="text-[11px]">
            Last {chartData.length} qualifying rounds
          </span>
        </div>
      </div>
    </section>
  );
};

export default HandicapJourneyCard;
