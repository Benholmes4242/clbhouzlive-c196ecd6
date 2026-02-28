import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEchoOverview, useEchoTimeseries, useEchoTopTags, useEchoTopUsers, useEchoExports } from '../hooks/useEchoAnalytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toCSV, downloadCSV } from '../utils/csv';
import { buildHistoryUrl } from '../utils/historyLinks';
import { toast } from 'sonner';

const COLORS = ['#6e9277', '#8aa491', '#b1c1b7', '#e0eee5', '#3b3b3b'];

function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + url);
    toast.success('Copied to clipboard', { duration: 2000 });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleCopy}
      title="Copy shareable link"
    >
      Copy Link
    </Button>
  );
}

export default function EchoAnalyticsPage() {
  const nav = useNavigate();
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

  // URL builders for shareable links
  const tagUrl = (tag: string) => buildHistoryUrl({ tag, fromISO: p_from, toISO: p_to });
  const userUrl = (uid: string) => buildHistoryUrl({ q: `user:${uid}`, fromISO: p_from, toISO: p_to });
  const rangeUrl = buildHistoryUrl({ fromISO: p_from, toISO: p_to });

  // Navigation helper for drill-downs (now uses URL navigation)
  const goHistory = (url: string) => nav(url);

  // CSV export handlers
  const exportTimeseries = () => {
    const cols = [{key:'day',header:'Day'},{key:'events',header:'Events'}];
    downloadCSV('echo-timeseries.csv', toCSV(series || [], cols));
  };

  const exportTopTags = () => {
    const cols = [{key:'tag',header:'Tag'},{key:'uses',header:'Uses'}];
    downloadCSV('echo-top-tags.csv', toCSV(topTags || [], cols));
  };

  const exportTopUsers = () => {
    const cols = [{key:'user_id',header:'User ID'},{key:'events',header:'Events'}];
    downloadCSV('echo-top-users.csv', toCSV(topUsers || [], cols));
  };

  const exportExports = () => {
    const cols = [{key:'kind',header:'Type'},{key:'total',header:'Count'}];
    downloadCSV('echo-exports.csv', toCSV(exports || [], cols));
  };

  const exportOverview = () => {
    const rows = [{
      from: p_from, to: p_to,
      events_count: (overview as any)?.events_count,
      unique_users: (overview as any)?.unique_users,
      shares_created: (overview as any)?.shares_created,
      exports: (overview as any)?.exports
    }];
    const cols = [
      {key:'from',header:'From'},
      {key:'to',header:'To'},
      {key:'events_count',header:'Events'},
      {key:'unique_users',header:'Unique Users'},
      {key:'shares_created',header:'Shares Created'},
      {key:'exports',header:'Exports'}
    ];
    downloadCSV('echo-overview.csv', toCSV(rows, cols));
  };

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Total Events</CardTitle>
            <Button variant="ghost" size="sm" onClick={exportOverview}>CSV</Button>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{(overview as any)?.events_count ?? 0}</CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Unique Users</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.unique_users ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Shares Created</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.shares_created ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Exports</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{(overview as any)?.exports ?? 0}</CardContent></Card>
      </section>

      {/* Timeseries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usage Over Time</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => goHistory(rangeUrl)}>
              View in History
            </Button>
            <CopyLinkButton url={rangeUrl} />
            <Button variant="ghost" size="sm" onClick={exportTimeseries}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart 
              data={series}
              onClick={(e: any) => {
                const day = e?.activeLabel;
                if (day) goHistory(buildHistoryUrl({ dayISO: day }));
              }}
            >
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Tags</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={exportTopTags}>Export CSV</Button>
            </div>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart 
                data={topTags}
                onClick={(e: any) => {
                  const tag = e?.activeLabel || e?.activePayload?.[0]?.payload?.tag;
                  if (tag) goHistory(tagUrl(tag));
                }}
              >
                <XAxis dataKey="tag" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="uses" fill="#6e9277" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exports Breakdown</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={exportExports}>Export CSV</Button>
            </div>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart
                onClick={(e: any) => {
                  const kind = e?.activePayload?.[0]?.payload?.kind;
                  if (kind) goHistory(buildHistoryUrl({ q: `export:${kind}`, fromISO: p_from, toISO: p_to }));
                }}
              >
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Active Users</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={exportTopUsers}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart 
              data={topUsers}
              onClick={(e: any) => {
                const uid = e?.activePayload?.[0]?.payload?.user_id;
                if (uid) goHistory(userUrl(uid));
              }}
            >
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
