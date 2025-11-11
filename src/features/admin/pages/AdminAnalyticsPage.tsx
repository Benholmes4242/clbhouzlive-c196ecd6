import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { getSummary, getTimeseries, getTopTags } from '../api/analytics';
import type { TimeseriesPoint } from '../api/analytics';

export default function AdminAnalyticsPage() {
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin.summary', windowDays],
    queryFn: () => getSummary(windowDays),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: tsViews } = useQuery({
    queryKey: ['admin.ts.views', windowDays],
    queryFn: () => getTimeseries(['echo_history_open_full', 'echo_history_open_inline'], windowDays),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: tsShares } = useQuery({
    queryKey: ['admin.ts.shares', windowDays],
    queryFn: () => getTimeseries(['echo_share_created'], windowDays),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: tsExports } = useQuery({
    queryKey: ['admin.ts.exports', windowDays],
    queryFn: () => getTimeseries(['echo_history_export_started', 'echo_history_export_bulk_started'], windowDays),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: topTags, isLoading: tagsLoading } = useQuery({
    queryKey: ['admin.top.tags', windowDays],
    queryFn: () => getTopTags(windowDays, 10),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen p-6 space-y-16" style={{ background: 'var(--hub-backdrop)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white/95">Echo Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setWindowDays(d as 7 | 30 | 90)}
              className={`px-3 py-1.5 rounded-full text-[13px] border border-white/10 transition-colors ${
                windowDays === d ? 'bg-white/12 text-white' : 'hover:bg-white/8 text-white/70'
              }`}
              aria-pressed={windowDays === d}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-[18px] border h-24 animate-pulse"
              style={{
                background: 'var(--hub-glass-bg)',
                borderColor: 'var(--hub-stroke)',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Convo Opens" value={summary?.conversations_created ?? 0} series={tsViews} />
          <KpiCard title="Stars" value={summary?.starred_toggles ?? 0} />
          <KpiCard title="Shares" value={summary?.shares_created ?? 0} series={tsShares} />
          <KpiCard
            title="Exports"
            value={(summary?.exports_started ?? 0) + (summary?.bulk_exports ?? 0)}
            series={tsExports}
          />
        </div>
      )}

      {/* Top Tags */}
      <div>
        <h2 className="text-[17px] font-semibold text-white/95 mb-3">Top Tags</h2>
        <div
          className="rounded-[18px] border p-6"
          style={{
            background: 'var(--hub-glass-bg)',
            borderColor: 'var(--hub-stroke)',
          }}
        >
          {tagsLoading ? (
            <div className="text-center py-12 text-white/50">Loading tags...</div>
          ) : !topTags || topTags.length === 0 ? (
            <div className="text-center py-12 text-white/50">No tag activity in this period.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topTags.map((t) => (
                <li
                  key={t.name}
                  className="flex items-center justify-between border border-white/10 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="font-medium text-white/90">#{t.name}</div>
                  <div className="text-sm text-white/70">{t.threads} threads</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Minimal sparkline card */
function KpiCard({
  title,
  value,
  series,
}: {
  title: string;
  value: number | string;
  series?: TimeseriesPoint[];
}) {
  const points = useMemo(() => {
    if (!series || series.length === 0) return '';
    const w = 120,
      h = 36;
    const max = Math.max(...series.map((s) => s.n), 1);
    return series
      .map((s, i) => {
        const x = (i / (series.length - 1)) * w;
        const y = h - (s.n / max) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }, [series]);

  return (
    <div
      className="rounded-[18px] border p-4 flex items-center justify-between gap-4"
      style={{
        background: 'var(--hub-glass-bg)',
        borderColor: 'var(--hub-stroke)',
      }}
    >
      <div>
        <div className="text-white/70 text-sm mb-1">{title}</div>
        <div className="text-2xl font-semibold text-white/95">{value}</div>
      </div>
      <div aria-hidden className="opacity-80">
        {series && series.length > 1 ? (
          <svg width="120" height="36">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={points}
              style={{ color: 'var(--hub-accent, #6e9277)' }}
            />
          </svg>
        ) : (
          <div className="text-sm text-white/40">—</div>
        )}
      </div>
    </div>
  );
}
