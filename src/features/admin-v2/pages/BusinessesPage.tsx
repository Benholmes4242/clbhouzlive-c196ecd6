import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import {
  AdminPageHeader, AdminTable, AdminSearchBar, AdminFilterBar,
  AdminStatusPill, AdminButton, AdminKpiCard,
} from '../components/ui';

interface BusinessRow {
  id:         string;
  name:       string;
  category:   string | null;
  isVerified: boolean;
  createdAt:  string | null;
  city:       string | null;
  country:    string | null;
}

const col = createColumnHelper<BusinessRow>();

export default function BusinessesPage() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 25;

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'businesses'],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, category, is_verified, created_at, city, country')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(b => ({
        id:         b.id,
        name:       b.name,
        category:   b.category,
        isVerified: b.is_verified ?? false,
        createdAt:  b.created_at,
        city:       b.city,
        country:    b.country,
      }));
    },
    staleTime: 5 * 60_000,
  });

  const filtered = data.filter(b => {
    const matchSearch = !search.trim() ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.city ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'verified' && b.isVerified) ||
      (filter === 'unverified' && !b.isVerified);
    return matchSearch && matchFilter;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = React.useMemo(() => [
    col.accessor('name', {
      header: 'Business',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] font-medium text-foreground">{row.original.name}</p>
          {row.original.category && (
            <p className="text-[11px] text-muted-foreground">{row.original.category}</p>
          )}
        </div>
      ),
    }),
    col.display({
      id: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {[row.original.city, row.original.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    }),
    col.accessor('isVerified', {
      header: 'Status',
      enableSorting: true,
      cell: ({ getValue }) => (
        <AdminStatusPill status={getValue() ? 'active' : 'pending'} label={getValue() ? 'Verified' : 'Unverified'} />
      ),
    }),
    col.accessor('createdAt', {
      header: 'Created',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[12px] text-muted-foreground">
          {getValue() ? format(new Date(getValue()!), 'd MMM yyyy') : '—'}
        </span>
      ),
    }),
  ], []);

  const counts: Record<string, number> = {
    all:        data.length,
    verified:   data.filter(b => b.isVerified).length,
    unverified: data.filter(b => !b.isVerified).length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Business Directory"
        description="All registered business accounts"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="Total" value={counts.all} icon={Building2} isLoading={isLoading} />
        <AdminKpiCard title="Verified" value={counts.verified} icon={Building2} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Unverified" value={counts.unverified} icon={Building2} iconColor="#f59e0b" isLoading={isLoading} />
      </div>
      <div className="space-y-3">
        <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or city…" resultCount={filtered.length} />
        <AdminFilterBar
          filters={[
            { id: 'all',        label: 'All',        count: counts.all },
            { id: 'verified',   label: 'Verified',   count: counts.verified,   variant: 'success' as const },
            { id: 'unverified', label: 'Unverified', count: counts.unverified, variant: 'warning' as const },
          ]}
          active={filter}
          onChange={v => { setFilter(v); setPage(1); }}
        />
      </div>
      <AdminTable
        columns={columns}
        data={paginated}
        isLoading={isLoading}
        getRowId={b => b.id}
        emptyTitle="No businesses found"
        emptyIcon={Building2}
        pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }}
      />
    </div>
  );
}
