import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import {
  AdminPageHeader, AdminTable, AdminSearchBar, AdminFilterBar,
  AdminStatusPill, AdminButton,
} from '../components/ui';
import { AdminMiniCard } from '../components/shared/AdminMiniCard';

interface BusinessRow {
  id:         string;
  name:       string;
  category:   string | null;
  isVerified: boolean;
  createdAt:  string | null;
  city:       string | null;
  country:    string | null;
  logoUrl:    string | null;
  hasPendingVerification: boolean;
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
      const [bizRes, pendingRes] = await Promise.all([
        supabase
          .from('business_accounts')
          .select('id, name, category, is_verified, created_at, city, country, logo_url')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('business_verification_requests')
          .select('business_id')
          .eq('status', 'pending'),
      ]);
      if (bizRes.error) throw bizRes.error;
      const pendingSet = new Set((pendingRes.data ?? []).map(r => r.business_id));

      return (bizRes.data ?? []).map(b => ({
        id:         b.id,
        name:       b.name,
        category:   b.category,
        isVerified: b.is_verified ?? false,
        createdAt:  b.created_at,
        city:       b.city,
        country:    b.country,
        logoUrl:    b.logo_url,
        hasPendingVerification: pendingSet.has(b.id),
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
      (filter === 'unverified' && !b.isVerified) ||
      (filter === 'pending' && b.hasPendingVerification);
    return matchSearch && matchFilter;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    return {
      all:        data.length,
      verified:   data.filter(b => b.isVerified).length,
      pending:    data.filter(b => b.hasPendingVerification).length,
      unverified: data.filter(b => !b.isVerified).length,
      newMonth:   data.filter(b => b.createdAt && new Date(b.createdAt) >= startOfMonth).length,
    };
  }, [data]);

  const columns = React.useMemo(() => [
    col.display({
      id: 'icon',
      header: '',
      size: 48,
      cell: ({ row }) => {
        const b = row.original;
        if (b.logoUrl) {
          return (
            <img
              src={b.logoUrl}
              alt={b.name}
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
          );
        }
        const letter = (b.category ?? b.name)?.[0]?.toUpperCase() ?? 'B';
        return (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#64748B',
          }}>
            {letter}
          </div>
        );
      },
    }),
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
      header: 'Verification',
      enableSorting: true,
      cell: ({ row }) => {
        const b = row.original;
        if (b.isVerified) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          );
        }
        if (b.hasPendingVerification) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Clock className="h-3 w-3" /> Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#F1F5F9', color: '#94A3B8' }}>
            Unverified
          </span>
        );
      },
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

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Business Directory"
        description="All registered business accounts"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

      {/* KPI strip with mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminMiniCard label="Total Businesses" value={counts.all} borderColor="#F5A623" isLoading={isLoading} />
        <AdminMiniCard label="Verified" value={counts.verified} borderColor="#17C964" isLoading={isLoading} />
        <AdminMiniCard label="Pending Verification" value={counts.pending} borderColor="#D97706" isLoading={isLoading} />
        <AdminMiniCard label="New This Month" value={counts.newMonth} borderColor="#1D6FF5" isLoading={isLoading} />
      </div>

      <div className="space-y-3">
        <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or city…" resultCount={filtered.length} />
        <AdminFilterBar
          filters={[
            { id: 'all',        label: 'All',        count: counts.all },
            { id: 'verified',   label: 'Verified',   count: counts.verified,   variant: 'success' as const },
            { id: 'pending',    label: 'Pending',    count: counts.pending,    variant: 'warning' as const },
            { id: 'unverified', label: 'Unverified', count: counts.unverified },
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
