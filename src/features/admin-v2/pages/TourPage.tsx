import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, RefreshCw, ExternalLink, Play, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import {
  AdminPageHeader, AdminTable, AdminSearchBar,
  AdminButton, AdminKpiCard, AdminStatusPill,
} from '../components/ui';

interface TourRankingRow {
  id:          string;
  playerId:    string | null;
  playerName:  string;
  position:    number;
  points:      number | null;
  tourCode:    string;
  seasonYear:  number;
  updatedAt:   string | null;
}

const col = createColumnHelper<TourRankingRow>();

const SCRAPER_TOURS = [
  {
    code: 'euro',
    label: 'DP World Tour',
    source: 'Edge Function',
    canRun: true,
  },
  {
    code: 'LPGA',
    label: 'LPGA Tour',
    source: 'GitHub Actions',
    canRun: false,
    actionsUrl: 'https://github.com/Benholmes4242/clbhouzlive/actions/workflows/scrape-r2d-rankings.yml',
  },
  {
    code: 'LIV',
    label: 'LIV Golf',
    source: 'GitHub Actions',
    canRun: false,
    actionsUrl: 'https://github.com/Benholmes4242/clbhouzlive/actions/workflows/scrape-r2d-rankings.yml',
  },
  {
    code: 'pgad',
    label: 'Korn Ferry',
    source: 'GitHub Actions',
    canRun: false,
    actionsUrl: 'https://github.com/Benholmes4242/clbhouzlive/actions/workflows/scrape-r2d-rankings.yml',
  },
] as const;

export default function TourPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [activeTour, setActiveTour] = useState<string>('all');
  const [runningTour, setRunningTour] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, { ok: boolean; message: string; ts: string }>>({});
  const PAGE_SIZE = 25;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'tour', 'rankings'],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('tour_season_rankings')
        .select('id, player_id, player_name, position, points, tour_code, season_year, updated_at')
        .order('position', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id:         r.id,
        playerId:   r.player_id,
        playerName: r.player_name,
        position:   r.position,
        points:     r.points,
        tourCode:   r.tour_code,
        seasonYear: r.season_year,
        updatedAt:  r.updated_at,
      }));
    },
    staleTime: 5 * 60_000,
  });

  const tours = React.useMemo(() => {
    const codes = [...new Set(data.map(r => r.tourCode))].sort();
    return ['all', ...codes];
  }, [data]);

  const filtered = data.filter(r => {
    const matchesTour = activeTour === 'all' || r.tourCode === activeTour;
    const matchesSearch = !search.trim() || (r.playerName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesTour && matchesSearch;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRunScraper = async (tourCode: string) => {
    if (runningTour) return;
    setRunningTour(tourCode);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-tour-rankings', {
        body: { tour: tourCode, year: new Date().getFullYear() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setRunResults(prev => ({
        ...prev,
        [tourCode]: {
          ok: true,
          message: `${data?.upserted ?? '?'} players upserted`,
          ts: new Date().toISOString(),
        },
      }));
      refetch();
    } catch (e: any) {
      setRunResults(prev => ({
        ...prev,
        [tourCode]: { ok: false, message: e.message, ts: new Date().toISOString() },
      }));
    } finally {
      setRunningTour(null);
    }
  };

  const scraperHealth = React.useMemo(() => {
    return SCRAPER_TOURS.map(tour => {
      const rows = data.filter(r => r.tourCode === tour.code);
      const latestUpdate = rows.length > 0
        ? rows.reduce((latest, r) => {
            if (!r.updatedAt) return latest;
            return !latest || r.updatedAt > latest ? r.updatedAt : latest;
          }, null as string | null)
        : null;

      const daysSince = latestUpdate
        ? Math.floor((Date.now() - new Date(latestUpdate).getTime()) / 86400000)
        : null;

      const isStale = daysSince === null || daysSince > 10;
      const isWarning = daysSince !== null && daysSince > 7 && daysSince <= 10;

      return {
        ...tour,
        playerCount: rows.length,
        latestUpdate,
        daysSince,
        isStale,
        isWarning,
      };
    });
  }, [data]);

  const columns = React.useMemo(() => [
    col.accessor('position', {
      header: 'Rank',
      enableSorting: true,
      size: 72,
      cell: ({ getValue }) => (
        <span className="text-[13px] font-bold text-foreground tabular-nums">#{getValue()}</span>
      ),
    }),
    col.accessor('playerName', {
      header: 'Player',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[13px] font-medium text-foreground">{getValue()}</span>
      ),
    }),
    col.accessor('points', {
      header: 'Points',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground tabular-nums">{getValue()?.toLocaleString() ?? '—'}</span>
      ),
    }),
    col.accessor('tourCode', {
      header: 'Tour',
      cell: ({ getValue }) => (
        <span className="text-[11px] text-muted-foreground uppercase font-semibold">{getValue()}</span>
      ),
    }),
    col.accessor('seasonYear', {
      header: 'Season',
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground">{getValue()}</span>
      ),
    }),
    col.accessor('updatedAt', {
      header: 'Updated',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-muted-foreground">
          {getValue() ? format(new Date(getValue()!), 'd MMM yyyy') : '—'}
        </span>
      ),
    }),
  ], []);

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Tour Rankings"
        description="Season rankings across all tours"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title={activeTour === 'all' ? 'Total Rankings' : `${activeTour} Rankings`} value={activeTour === 'all' ? data.length : data.filter(r => r.tourCode === activeTour).length} icon={Trophy} isLoading={isLoading} />
        <AdminKpiCard title="Tours" value={new Set(data.map(r => r.tourCode)).size} icon={Trophy} iconColor="#3b82f6" isLoading={isLoading} />
        <AdminKpiCard title="Seasons" value={new Set(data.map(r => r.seasonYear)).size} icon={Trophy} iconColor="#22c55e" isLoading={isLoading} />
      </div>

      {/* ── Scraper Health Panel ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-[#0F172A]">Scraper Status</h3>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Weekly run: Monday 6AM UTC · Last known update per tour
            </p>
          </div>
          <a
            href="https://github.com/Benholmes4242/clbhouzlive/actions/workflows/scrape-r2d-rankings.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium text-[#1D6FF5] hover:underline flex items-center gap-1"
          >
            View Actions
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {scraperHealth.map(tour => {
            const result = runResults[tour.code];
            const isRunning = runningTour === tour.code;

            const pillVariant = result
              ? (result.ok ? 'active' as const : 'error' as const)
              : tour.isStale ? 'error' as const
              : tour.isWarning ? 'pending' as const
              : 'active' as const;

            const pillLabel = result
              ? (result.ok ? 'OK' : 'Failed')
              : tour.isStale ? 'Stale'
              : tour.isWarning ? 'Due Soon'
              : 'OK';

            return (
              <div key={tour.code} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-36 flex-shrink-0">
                  <p className="text-[13px] font-semibold text-[#0F172A]">{tour.label}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{tour.source}</p>
                </div>

                <AdminStatusPill status={pillVariant} label={pillLabel} showDot />

                <div className="flex-1 min-w-0">
                  {result ? (
                    <p className={`text-[12px] ${result.ok ? 'text-[#17C964]' : 'text-[#F31260]'}`}>
                      {result.message}
                    </p>
                  ) : tour.latestUpdate ? (
                    <p className="text-[12px] text-[#64748B]">
                      Last updated {tour.daysSince === 0 ? 'today'
                        : tour.daysSince === 1 ? 'yesterday'
                        : `${tour.daysSince} days ago`}
                      <span className="text-[#CBD5E1] mx-1.5">·</span>
                      {tour.playerCount} players
                    </p>
                  ) : (
                    <p className="text-[12px] text-[#94A3B8]">No data yet</p>
                  )}
                </div>

                {tour.canRun ? (
                  <AdminButton
                    variant="outline"
                    size="sm"
                    icon={isRunning ? Loader2 : Play}
                    loading={isRunning}
                    disabled={!!runningTour}
                    onClick={() => handleRunScraper(tour.code)}
                  >
                    {isRunning ? 'Running…' : 'Run Now'}
                  </AdminButton>
                ) : (
                  <a
                    href={(tour as any).actionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AdminButton variant="outline" size="sm" icon={ExternalLink}>
                      Trigger
                    </AdminButton>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tour filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tours.map(tour => (
          <button
            key={tour}
            onClick={() => { setActiveTour(tour); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold uppercase tracking-wide transition-all"
            style={{
              background: activeTour === tour ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
              color: activeTour === tour ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border) / 0.5)',
            }}
          >
            {tour === 'all' ? `All Tours (${data.length})` : `${tour} (${data.filter(r => r.tourCode === tour).length})`}
          </button>
        ))}
      </div>
      <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search player name…" resultCount={filtered.length} />
      <AdminTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        getRowId={r => r.id}
        emptyTitle="No rankings found"
        emptyIcon={Trophy}
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />
    </div>
  );
}
