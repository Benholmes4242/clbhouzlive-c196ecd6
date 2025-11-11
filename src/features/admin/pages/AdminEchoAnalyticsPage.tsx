import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Kpi } from '../components/Kpi';
import { ChartCard } from '../components/ChartCard';
import {
  useAdminEchoKPIs,
  useAdminEchoTimeseries,
  useAdminEchoTopTags,
  useAdminEchoRates,
} from '../hooks/useAdminEchoAnalytics';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminEchoAnalyticsPage() {
  const { data: kpis, isLoading: kpisLoading } = useAdminEchoKPIs();
  const { data: timeseries, isLoading: timeseriesLoading } = useAdminEchoTimeseries();
  const { data: topTags, isLoading: tagsLoading } = useAdminEchoTopTags();
  const { data: rates, isLoading: ratesLoading } = useAdminEchoRates();

  if (kpisLoading || timeseriesLoading || tagsLoading || ratesLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Echo Analytics</h1>
        <div className="text-muted-foreground">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Echo Analytics</h1>
        <p className="text-muted-foreground">Real-time metrics for Echo usage</p>
      </header>

      {/* KPI Tiles */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" role="region" aria-label="Key Performance Indicators">
        <Kpi label="Active Users (7d)" value={kpis?.users_active_7d || 0} />
        <Kpi label="Total Threads" value={kpis?.threads_total || 0} />
        <Kpi label="Total Messages" value={kpis?.msgs_total || 0} />
        <Kpi label="Exports (7d)" value={kpis?.exports_7d || 0} />
        <Kpi label="Active Shares" value={kpis?.shares_active || 0} />
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threads Timeseries */}
        <ChartCard title="New Threads (60d)" data={timeseries} fileName="echo_threads_timeseries">
          {timeseries && timeseries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeseries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="ts" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="threads" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No thread data available
            </div>
          )}
        </ChartCard>

        {/* Top Tags */}
        <ChartCard title="Top Tags (30d)" data={topTags} fileName="echo_top_tags">
          {topTags && topTags.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTags} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="tag" type="category" width={100} className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="uses" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No tag data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Engagement Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Rates (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          {rates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Star Rate</div>
                <div className="text-3xl font-bold">{rates.pct_starred?.toFixed(1)}%</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${rates.pct_starred}%` }}
                    role="progressbar"
                    aria-valuenow={rates.pct_starred}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Response Rate</div>
                <div className="text-3xl font-bold">{rates.pct_with_response?.toFixed(1)}%</div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${rates.pct_with_response}%` }}
                    role="progressbar"
                    aria-valuenow={rates.pct_with_response}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No engagement data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
