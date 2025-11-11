import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSummary, getTimeseries, getTopTags } from '../api/analytics';

export function AdminAnalyticsPage() {
  const [days, setDays] = React.useState<7 | 30 | 90>(7);

  const { data: summary } = useQuery({
    queryKey: ['admin.analytics.summary', days],
    queryFn: () => getSummary(days),
    staleTime: 60_000,
  });

  const { data: series } = useQuery({
    queryKey: ['admin.analytics.series', days],
    queryFn: () => getTimeseries(['echo_history_open_inline','echo_history_open_full','echo_history_export_started','echo_share_created'], days),
    staleTime: 60_000,
  });

  const { data: topTags } = useQuery({
    queryKey: ['admin.analytics.topTags', days],
    queryFn: () => getTopTags(days, 12),
    staleTime: 60_000,
  });

  return (
    <div className="p-6 space-y-16">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex gap-2">
          {[7,30,90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as 7|30|90)}
              className={`px-3 py-1.5 rounded ${days===d?'bg-white/15':'bg-white/8'} border border-white/10`}
              aria-pressed={days===d}
            >
              {d}d
            </button>
          ))}
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Opens (Inline)" value={(summary as any)?.opens_inline ?? 0} />
        <Kpi label="Opens (Full)" value={(summary as any)?.opens_full ?? 0} />
        <Kpi label="Stars Toggled" value={(summary as any)?.stars ?? 0} />
        <Kpi label="Exports" value={(summary as any)?.exports ?? 0} />
      </section>

      {/* Timeseries */}
      <section className="space-y-6">
        <h2 className="text-base font-medium opacity-80">Last {days} days</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Sparkline title="Opens (Inline)" points={series?.inline ?? []} />
          <Sparkline title="Opens (Full)" points={series?.full ?? []} />
          <Sparkline title="Exports" points={series?.exports ?? []} />
          <Sparkline title="Shares Created" points={series?.shares ?? []} />
        </div>
      </section>

      {/* Top tags */}
      <section className="space-y-3">
        <h2 className="text-base font-medium opacity-80">Top Tags</h2>
        <div className="flex flex-wrap gap-8">
          {(topTags ?? []).map((t: any) => (
            <div key={t.name} className="min-w-[160px]">
              <div className="text-sm opacity-75">#{t.name}</div>
              <div className="text-lg font-semibold">{t.threads_count}</div>
              <div className="text-xs opacity-60">{t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : '—'}</div>
            </div>
          ))}
          {(topTags?.length ?? 0) === 0 && <div className="opacity-60 text-sm">No tags in this period.</div>}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Sparkline({ title, points }: { title: string; points: { x: string; y: number }[] }) {
  // Render with your existing lightweight chart; placeholder for now
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm opacity-80 mb-2">{title}</div>
      <div className="h-28 flex items-center justify-center opacity-60 text-xs">
        {points?.length ? 'Chart renders here' : 'No data'}
      </div>
    </div>
  );
}
