import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BIZ } from '@/components/business/businessTokens';
import type { DailyAnalytics } from '@/hooks/useBusinessAnalytics';

interface ContentPerformanceChartProps {
  daily: DailyAnalytics[];
}

const formatDay = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

function ContentPerformanceChartInner({ daily }: ContentPerformanceChartProps) {
  const hasData =
    daily.length > 0 &&
    daily.some((d) => (d.post_views ?? 0) > 0 || (d.post_engagements ?? 0) > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 200, color: BIZ.inkMute, fontSize: '0.85rem' }}
      >
        No post activity yet in this period
      </div>
    );
  }

  const data = daily.map((d) => ({
    day: formatDay(d.day),
    Views: d.post_views ?? 0,
    Engagements: d.post_engagements ?? 0,
  }));

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={BIZ.hairSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: BIZ.inkMute, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: BIZ.inkMute, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: BIZ.card,
              border: `1px solid ${BIZ.hair}`,
              borderRadius: 8,
              fontSize: 12,
              color: BIZ.ink,
            }}
            labelStyle={{ color: BIZ.inkMute }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: BIZ.inkMute }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="Views"
            stroke={BIZ.amber}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Engagements"
            stroke={BIZ.ink}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(ContentPerformanceChartInner);
