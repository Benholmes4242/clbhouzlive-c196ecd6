import React, { useMemo, useState } from 'react';
import { useEchoOverview, useEchoTimeseries, useEchoTopTags, useEchoTopUsers, useEchoExports } from '../hooks/useEchoAnalytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const COLORS = ['#6e9277', '#8aa491', '#b1c1b7', '#e0eee5', '#3b3b3b'];

export default function EchoAnalyticsPage() {
  // default last 30 days
  const [from, setFrom] = useState(() => new Date(Date.now() - 29*24*3600*1000));
  const [to, setTo] = useState(() => new Date());

  const p_from = useMemo(() => from.toISOString(), [from]);
  const p_to   = useMemo(() => new Date(to.getTime() + 24*3600*1000).toISOString(), [to]); // inclusive

  const { data: overview } = useEchoOverview(p_from, p_to);
  const { data: series }   = useEchoTimeseries(p_from, p_to);
  const { data: topTags }  = useEchoTopTags(p_from, p_to, 10);
  const { data: topUsers } = useEchoTopUsers(p_from, p_to, 10);
  const { data: exports }  = useEchoExports(p_from, p_to);

  // Quick date range buttons
  const setLast7Days = () => {
    setFrom(new Date(Date.now() - 6*24*3600*1000));
    setTo(new Date());
  };
  const setLast30Days = () => {
    setFrom(new Date(Date.now() - 29*24*3600*1000));
    setTo(new Date());
  };
  const setLast90Days = () => {
    setFrom(new Date(Date.now() - 89*24*3600*1000));
    setTo(new Date());
  };

  return (
    <div className="p-6 space-y-16">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Echo Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={setLast7Days}>7d</Button>
          <Button variant="outline" size="sm" onClick={setLast30Days}>30d</Button>
          <Button variant="outline" size="sm" onClick={setLast90Days}>90d</Button>
        </div>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total Events</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.events_count ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Unique Users</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.unique_users ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Shares Created</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.shares_created ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Exports</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.exports ?? 0}</CardContent></Card>
      </section>

      {/* Timeseries */}
      <Card>
        <CardHeader><CardTitle>Usage Over Time</CardTitle></CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#6e9277" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Tags + Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Top Tags</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topTags}>
                <XAxis dataKey="tag" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="uses" fill="#6e9277" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Exports Breakdown</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={exports} dataKey="total" nameKey="kind" outerRadius={100} label>
                  {(exports || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader><CardTitle>Top Active Users</CardTitle></CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={topUsers}>
              <XAxis dataKey="user_id" tick={false} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="events" fill="#8aa491" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 text-sm text-muted-foreground">User IDs hidden on axis—hover bars to see details.</div>
        </CardContent>
      </Card>
    </div>
  );
}
