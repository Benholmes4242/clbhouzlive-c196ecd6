import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import {
  AdminPageHeader, AdminTable, AdminSearchBar,
  AdminButton, AdminKpiCard,
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

export default function TourPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [activeTour, setActiveTour] = useState<string>('all');
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
