import React from 'react';
import { useAnalyticsOverview, useAnalyticsTimeseries, useAnalyticsTopTags, useAnalyticsExportFormats, useAnalyticsTopThreads } from '../hooks/useAnalytics';
import { AnalyticsFilters, calcRangeISO, Filters } from '../components/AnalyticsFilters';
import { ChartCard } from '../components/ChartCard';
import { Kpi } from '../components/Kpi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { AdminInsightsCard } from '../components/AdminInsightsCard';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--chart-1))'];

export function AdminAnalyticsPage() {
  const [filters, setFilters] = React.useState<Filters>({ range: '30d' });
  const range = React.useMemo(() => calcRangeISO(filters), [filters]);

  const { data: overview } = useAnalyticsOverview(range, { event: filters.event, userId: filters.userId, tag: filters.tag });
  const { data: ts } = useAnalyticsTimeseries(range, { event: filters.event, userId: filters.userId, tag: filters.tag });
  const { data: topTags } = useAnalyticsTopTags(range, filters.userId);
  const { data: exportFormats } = useAnalyticsExportFormats(range);
  const { data: topThreads } = useAnalyticsTopThreads(range);

  // Recharts expects category series; group by day with total count (all events or filtered event)
  const tsDaily = React.useMemo(() => {
    const byDay: Record<string, number> = {};
    ts?.forEach((r: any) => {
      byDay[r.day] = (byDay[r.day] || 0) + Number(r.count);
    });
    return Object.entries(byDay).map(([day, count]) => ({ day, count }));
  }, [ts]);

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Admin Insights Card at the top */}
      <AdminInsightsCard days={30} />

      <h2 className="text-xl font-semibold mt-8">Detailed Analytics</h2>

      <AnalyticsFilters value={filters} onChange={setFilters} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Conversations" value={overview?.total_threads ?? 0} />
        <Kpi label="Exports" value={overview?.total_exports ?? 0} />
        <Kpi label="Shares" value={overview?.total_shares ?? 0} />
        <Kpi label="Avg. Latency (ms)" value={Math.round(overview?.avg_latency_ms ?? 0)} />
        <Kpi label="Active Users" value={overview?.active_users ?? 0} />
      </div>

      {/* Timeseries */}
      <ChartCard title="Activity over time">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={tsDaily}>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Tags */}
        <ChartCard title="Top Tags">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topTags || []}>
                <XAxis dataKey="tag" hide />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="uses">
                  {(topTags || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {topTags?.slice(0, 10).map((t: any) => (
              <span key={t.tag} className="mr-3">
                #{t.tag} <span className="text-muted-foreground/70">({t.uses})</span>
              </span>
            ))}
          </div>
        </ChartCard>

        {/* Export Formats */}
        <ChartCard title="Export Formats">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={exportFormats || []} dataKey="count" nameKey="format" outerRadius={100} label>
                  {(exportFormats || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Top Threads */}
      <ChartCard title="Most Opened Conversations">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={(topThreads || []).map((t: any) => ({
                ...t,
                thread: t.thread_id?.slice(0, 8) + '…',
              }))}
            >
              <XAxis dataKey="thread" stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="opens">
                {(topThreads || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
