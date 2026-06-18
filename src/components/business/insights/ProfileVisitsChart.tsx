import { memo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BIZ } from '@/components/business/businessTokens';
import type { DailyAnalytics } from '@/hooks/useBusinessAnalytics';

interface ProfileVisitsChartProps {
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

function ProfileVisitsChartInner({ daily }: ProfileVisitsChartProps) {
  const hasData = daily.length > 0 && daily.some((d) => (d.profile_views ?? 0) > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 200, color: BIZ.inkMute, fontSize: '0.85rem' }}
      >
        No visits yet in this period
      </div>
    );
  }

  const data = daily.map((d) => ({
    day: formatDay(d.day),
    visits: d.profile_views ?? 0,
  }));

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BIZ.amber} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BIZ.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="visits"
            stroke={BIZ.amber}
            strokeWidth={2}
            fill="url(#amberFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(ProfileVisitsChartInner);
