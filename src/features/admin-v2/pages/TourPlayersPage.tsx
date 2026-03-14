import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import {
  AdminPageHeader, AdminTable, AdminSearchBar,
  AdminButton, AdminKpiCard,
} from '../components/ui';

interface PlayerRow {
  id:          string;
  srId:        string;
  fullName:    string | null;
  country:     string | null;
  photoUrl:    string | null;
  pgaTourId:   string | null;
}

const col = createColumnHelper<PlayerRow>();

export default function TourPlayersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'tour', 'players'],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, sr_id, full_name, country, photo_url, pga_tour_id')
        .order('full_name', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(p => ({
        id:        p.id,
        srId:      p.sr_id,
        fullName:  p.full_name,
        country:   p.country,
        photoUrl:  p.photo_url,
        pgaTourId: p.pga_tour_id,
      }));
    },
    staleTime: 10 * 60_000,
  });

  const filtered = data.filter(p =>
    !search.trim() ||
    (p.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.country ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = React.useMemo(() => [
    col.display({
      id: 'avatar',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {row.original.photoUrl
            ? <img src={row.original.photoUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                {row.original.fullName?.[0] ?? '?'}
              </div>
          }
        </div>
      ),
    }),
    col.accessor('fullName', {
      header: 'Name',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[13px] font-medium text-foreground">{getValue() ?? '—'}</span>
      ),
    }),
    col.accessor('country', {
      header: 'Country',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground">{getValue() ?? '—'}</span>
      ),
    }),
    col.accessor('pgaTourId', {
      header: 'PGA Tour ID',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-muted-foreground font-mono">{getValue() ?? '—'}</span>
      ),
    }),
    col.accessor('srId', {
      header: 'Sportradar ID',
      cell: ({ getValue }) => (
        <span className="text-[11px] text-muted-foreground font-mono">{getValue()}</span>
      ),
    }),
  ], []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Tour Players"
        description="Sportradar player database"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="Total Players" value={data.length} icon={Users} isLoading={isLoading} />
        <AdminKpiCard title="With PGA ID" value={data.filter(p => p.pgaTourId).length} icon={Users} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Countries" value={new Set(data.map(p => p.country).filter(Boolean)).size} icon={Users} iconColor="#3b82f6" isLoading={isLoading} />
      </div>
      <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or country…" resultCount={filtered.length} />
      <AdminTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        getRowId={r => r.id}
        emptyTitle="No players found"
        emptyIcon={Users}
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />
    </div>
  );
}
