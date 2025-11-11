import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSummary, getTimeseries, getTopTags } from '../api/analytics';
import { listViews, saveView, deleteView, getView, DashboardView } from '../api/views';
import { SavedViewsMenu } from '../components/SavedViewsMenu';
import { buildHistoryUrl } from '../utils/historyLinks';
import { toCSV, downloadCSV } from '../utils/csv';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function AdminAnalyticsPage() {
  const loc = useLocation();
  const nav = useNavigate();
  
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [views, setViews] = useState<DashboardView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // Date range calculation
  const toISO = new Date().toISOString().slice(0, 10);
  const fromISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Previous period for comparison
  function prevPeriod(fromISO: string, toISO: string) {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    const daysSpan = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    const prevTo = new Date(from.getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - (daysSpan - 1) * 86400000);
    return {
      fromISO: prevFrom.toISOString().slice(0, 10),
      toISO: prevTo.toISOString().slice(0, 10),
    };
  }

  const prev = prevPeriod(fromISO, toISO);

  // Main period queries
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

  // Comparison period queries (only when compare is enabled)
  const { data: summaryPrev } = useQuery({
    queryKey: ['admin.analytics.summary.prev', prev.fromISO, prev.toISO],
    queryFn: () => getSummary(Math.round((new Date(prev.toISO).getTime() - new Date(prev.fromISO).getTime()) / 86400000) + 1),
    staleTime: 60_000,
    enabled: compareEnabled,
  });

  const { data: seriesPrev } = useQuery({
    queryKey: ['admin.analytics.series.prev', prev.fromISO, prev.toISO],
    queryFn: () => getTimeseries(['echo_history_open_inline','echo_history_open_full','echo_history_export_started','echo_share_created'], Math.round((new Date(prev.toISO).getTime() - new Date(prev.fromISO).getTime()) / 86400000) + 1),
    staleTime: 60_000,
    enabled: compareEnabled,
  });

  // Load views on mount
  useEffect(() => {
    listViews().then(setViews).catch(console.error);
  }, []);

  // Load view from URL
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const viewId = params.get('v');
    const compareParam = params.get('compare');
    
    if (compareParam === '1') {
      setCompareEnabled(true);
    }
    
    if (viewId) {
      setActiveViewId(viewId);
      getView(viewId)
        .then((params) => {
          if (params.fromISO && params.toISO) {
            const from = new Date(params.fromISO);
            const to = new Date(params.toISO);
            const calculatedDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
            if ([7, 30, 90].includes(calculatedDays)) {
              setDays(calculatedDays as 7 | 30 | 90);
            }
          }
          if (params.compare !== undefined) {
            setCompareEnabled(!!params.compare);
          }
        })
        .catch(console.error);
    }
  }, [loc.search]);

  // Percentage delta helper
  function pctDelta(curr: number, prev: number): number | null {
    if (!isFinite(prev) || prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // Navigation helper for drill-downs
  const goHistory = (url: string) => {
    nav(url);
  };

  // View management handlers
  const handleSaveView = async (name: string, setDefault?: boolean) => {
    const id = await saveView({
      name,
      setDefault,
      params: { fromISO, toISO, compare: compareEnabled },
    });
    setActiveViewId(id);
    setViews(await listViews());
    const params = new URLSearchParams();
    params.set('v', id);
    if (compareEnabled) params.set('compare', '1');
    nav(`/admin/analytics?${params.toString()}`, { replace: true });
  };

  const handleOverwriteView = async () => {
    if (!activeViewId) return;
    const view = views.find((v) => v.id === activeViewId);
    if (!view) return;
    await saveView({
      viewId: activeViewId,
      name: view.name,
      params: { fromISO, toISO, compare: compareEnabled },
    });
    setViews(await listViews());
  };

  const handleSetDefaultView = async () => {
    if (!activeViewId) return;
    const view = views.find((v) => v.id === activeViewId);
    if (!view) return;
    await saveView({
      viewId: activeViewId,
      name: view.name,
      params: { fromISO, toISO, compare: compareEnabled },
      setDefault: true,
    });
    setViews(await listViews());
  };

  const handleDeleteView = async () => {
    if (!activeViewId) return;
    await deleteView(activeViewId);
    setViews(await listViews());
    setActiveViewId(null);
    nav('/admin/analytics', { replace: true });
  };

  const handleCopyLink = () => {
    if (!activeViewId) return;
    const params = new URLSearchParams();
    params.set('v', activeViewId);
    if (compareEnabled) params.set('compare', '1');
    navigator.clipboard.writeText(window.location.origin + `/admin/analytics?${params.toString()}`);
  };

  // CSV exports
  const exportTimeseries = () => {
    const cols = [{ key: 'day', header: 'Day' }, { key: 'events', header: 'Events' }];
    const rows = (series?.inline || []).map((p: any) => ({ day: p.x, events: p.y }));
    downloadCSV('echo-timeseries.csv', toCSV(rows, cols));
  };

  const exportTopTags = () => {
    const cols = [{ key: 'tag', header: 'Tag' }, { key: 'uses', header: 'Uses' }];
    const rows = (topTags || []).map((t: any) => ({ tag: t.name, uses: t.threads_count }));
    downloadCSV('echo-top-tags.csv', toCSV(rows, cols));
  };

  const exportOverview = () => {
    const rows = [{
      from: fromISO,
      to: toISO,
      opens_inline: (summary as any)?.opens_inline ?? 0,
      opens_full: (summary as any)?.opens_full ?? 0,
      stars: (summary as any)?.stars ?? 0,
      exports: (summary as any)?.exports ?? 0,
    }];
    const cols = [
      { key: 'from', header: 'From' },
      { key: 'to', header: 'To' },
      { key: 'opens_inline', header: 'Opens (Inline)' },
      { key: 'opens_full', header: 'Opens (Full)' },
      { key: 'stars', header: 'Stars Toggled' },
      { key: 'exports', header: 'Exports' },
    ];
    downloadCSV('echo-overview.csv', toCSV(rows, cols));
  };

  return (
    <div className="p-6 space-y-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          {activeViewId && (
            <p className="text-sm opacity-60 mt-1">
              Loaded from: {views.find((v) => v.id === activeViewId)?.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="compare-mode"
              checked={compareEnabled}
              onCheckedChange={setCompareEnabled}
            />
            <Label htmlFor="compare-mode" className="text-sm">
              Compare
            </Label>
          </div>
          <SavedViewsMenu
            views={views}
            activeViewId={activeViewId}
            onSelect={(id) => {
              const params = new URLSearchParams();
              params.set('v', id);
              if (compareEnabled) params.set('compare', '1');
              nav(`/admin/analytics?${params.toString()}`);
            }}
            onSave={handleSaveView}
            onOverwrite={handleOverwriteView}
            onSetDefault={handleSetDefaultView}
            onDelete={handleDeleteView}
            onCopyLink={handleCopyLink}
          />
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d as 7 | 30 | 90)}
                className={`px-3 py-1.5 rounded ${
                  days === d ? 'bg-white/15' : 'bg-white/8'
                } border border-white/10`}
                aria-pressed={days === d}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium opacity-80">Overview</h2>
          <button
            onClick={exportOverview}
            className="text-sm px-2 py-1 rounded border border-white/10 hover:bg-white/10"
          >
            Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            label="Opens (Inline)"
            value={(summary as any)?.opens_inline ?? 0}
            delta={
              compareEnabled && summaryPrev
                ? pctDelta((summary as any)?.opens_inline ?? 0, (summaryPrev as any)?.opens_inline ?? 0)
                : null
            }
          />
          <Kpi
            label="Opens (Full)"
            value={(summary as any)?.opens_full ?? 0}
            delta={
              compareEnabled && summaryPrev
                ? pctDelta((summary as any)?.opens_full ?? 0, (summaryPrev as any)?.opens_full ?? 0)
                : null
            }
          />
          <Kpi
            label="Stars Toggled"
            value={(summary as any)?.stars ?? 0}
            delta={
              compareEnabled && summaryPrev
                ? pctDelta((summary as any)?.stars ?? 0, (summaryPrev as any)?.stars ?? 0)
                : null
            }
          />
          <Kpi
            label="Exports"
            value={(summary as any)?.exports ?? 0}
            delta={
              compareEnabled && summaryPrev
                ? pctDelta((summary as any)?.exports ?? 0, (summaryPrev as any)?.exports ?? 0)
                : null
            }
          />
        </div>
      </section>

      {/* Timeseries */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium opacity-80">Last {days} days</h2>
          <div className="flex gap-2">
            <button
              onClick={() => goHistory(buildHistoryUrl({ fromISO, toISO }))}
              className="text-sm px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              View in History
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.origin + buildHistoryUrl({ fromISO, toISO })
                );
              }}
              className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              Copy Link
            </button>
            <button
              onClick={exportTimeseries}
              className="text-sm px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Sparkline
            title="Opens (Inline)"
            points={series?.inline ?? []}
            comparePoints={compareEnabled ? seriesPrev?.inline ?? [] : undefined}
            onPointClick={(day) => goHistory(buildHistoryUrl({ dayISO: day }))}
          />
          <Sparkline
            title="Opens (Full)"
            points={series?.full ?? []}
            comparePoints={compareEnabled ? seriesPrev?.full ?? [] : undefined}
            onPointClick={(day) => goHistory(buildHistoryUrl({ dayISO: day }))}
          />
          <Sparkline
            title="Exports"
            points={series?.exports ?? []}
            comparePoints={compareEnabled ? seriesPrev?.exports ?? [] : undefined}
            onPointClick={(day) => goHistory(buildHistoryUrl({ dayISO: day }))}
          />
          <Sparkline
            title="Shares Created"
            points={series?.shares ?? []}
            comparePoints={compareEnabled ? seriesPrev?.shares ?? [] : undefined}
            onPointClick={(day) => goHistory(buildHistoryUrl({ dayISO: day }))}
          />
        </div>
      </section>

      {/* Top tags */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium opacity-80">Top Tags</h2>
          <button
            onClick={exportTopTags}
            className="text-sm px-2 py-1 rounded border border-white/10 hover:bg-white/10"
          >
            Export CSV
          </button>
        </div>
        <div className="flex flex-wrap gap-8">
          {(topTags ?? []).map((t: any) => (
            <div
              key={t.name}
              className="min-w-[160px] cursor-pointer hover:opacity-80"
              onClick={() => goHistory(buildHistoryUrl({ tag: t.name, fromISO, toISO }))}
            >
              <div className="text-sm opacity-75">#{t.name}</div>
              <div className="text-lg font-semibold">{t.threads_count}</div>
              <div className="text-xs opacity-60">
                {t.last_used_at ? new Date(t.last_used_at).toLocaleDateString() : '—'}
              </div>
            </div>
          ))}
          {(topTags?.length ?? 0) === 0 && <div className="opacity-60 text-sm">No tags in this period.</div>}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: number; delta?: number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-2xl font-semibold">{value}</div>
        {delta !== null && delta !== undefined && (
          <div
            className={`text-sm font-medium ${
              delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'opacity-60'
            }`}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '●'} {Math.abs(delta)}%
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkline({
  title,
  points,
  comparePoints,
  onPointClick,
}: {
  title: string;
  points: { x: string; y: number }[];
  comparePoints?: { x: string; y: number }[];
  onPointClick?: (day: string) => void;
}) {
  const hasData = points?.length > 0;
  const hasCompareData = comparePoints && comparePoints.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm opacity-80 mb-2">{title}</div>
      <div
        className="h-28 flex items-center justify-center opacity-60 text-xs cursor-pointer hover:opacity-80"
        onClick={() => hasData && onPointClick?.(points[0].x)}
      >
        {hasData ? (
          <div className="space-y-1">
            <div>Current: {points.reduce((sum, p) => sum + p.y, 0)} events</div>
            {hasCompareData && (
              <div className="opacity-75">
                Previous: {comparePoints.reduce((sum, p) => sum + p.y, 0)} events
              </div>
            )}
          </div>
        ) : (
          'No data'
        )}
      </div>
    </div>
  );
}
