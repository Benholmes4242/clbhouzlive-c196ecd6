import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Camera, Globe, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createColumnHelper } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import {
  AdminPageHeader, AdminTable, AdminSearchBar,
  AdminButton, AdminKpiCard,
} from '../components/ui';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

/* ── Tour config ─────────────────────────────────────────── */
const TOURS: Record<string, { label: string; color: string }> = {
  pga:   { label: 'PGA Tour',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  euro:  { label: 'DP World',       color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  lpga:  { label: 'LPGA',           color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  pgad:  { label: 'Korn Ferry',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  liv:   { label: 'LIV',            color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  champ: { label: 'Champions',      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

/** Normalize mixed-case tour codes to lowercase keys */
function normalizeTourCode(code: string): string {
  const c = code.toLowerCase();
  if (c === 'eur' || c === 'dp' || c === 'dpwt') return 'euro';
  if (c === 'korn-ferry') return 'pgad';
  if (c === 'champions-tour') return 'champ';
  return c;
}

/* ── Types ───────────────────────────────────────────────── */
interface PlayerRow {
  id:                string;
  srId:              string;
  fullName:          string | null;
  firstName:         string | null;
  lastName:          string | null;
  country:           string | null;
  countryCode:       string | null;
  tourCodes:         string[] | null;
  headshotOverride:  string | null;
  updatedAt:         string | null;
}

type SortKey = 'name_asc' | 'name_desc' | 'country_asc' | 'updated_desc' | 'updated_asc';

/* ── Headshot sub-component with multi-tour fallback ───── */
function PlayerAvatar({ player }: { player: PlayerRow }) {
  const tourCodes = player.tourCodes?.length
    ? player.tourCodes.map(normalizeTourCode)
    : ['pga'];
  const [urlIndex, setUrlIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const displayName = player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim();

  const src = useMemo(() => {
    if (exhausted || !displayName) return PLAYER_SILHOUETTE_URL;
    return getPlayerHeadshotUrl(displayName, tourCodes[urlIndex] || 'pga', player.headshotOverride);
  }, [displayName, tourCodes, urlIndex, exhausted, player.headshotOverride]);

  const handleError = useCallback(() => {
    if (urlIndex < tourCodes.length - 1) {
      setUrlIndex(i => i + 1);
    } else {
      setExhausted(true);
    }
  }, [urlIndex, tourCodes.length]);

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover object-top"
        onError={handleError}
      />
    </div>
  );
}

/* ── Column helper ───────────────────────────────────────── */
const col = createColumnHelper<PlayerRow>();

/* ── Main page component ─────────────────────────────────── */
export default function TourPlayersPage() {
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState<SortKey>('name_asc');
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [syncingAllTours, setSyncingAllTours] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const PAGE_SIZE = 25;
  const queryClient = useQueryClient();

  const ALL_TOUR_IDS = ['pga', 'eur', 'lpga', 'pgad', 'liv', 'champions-tour'] as const;
  const TOUR_SYNC_LABELS: Record<string, string> = {
    pga: 'PGA Tour', eur: 'DP World Tour', lpga: 'LPGA',
    pgad: 'Korn Ferry', liv: 'LIV Golf', 'champions-tour': 'Champions',
  };

  const handleSyncAllTours = async () => {
    if (syncingAllTours) return;
    setSyncingAllTours(true);
    let successCount = 0;

    for (const tourId of ALL_TOUR_IDS) {
      setSyncProgress(TOUR_SYNC_LABELS[tourId]);
      try {
        const { error } = await supabase.functions.invoke('sportradar-sync', {
          body: { action: 'players', tourId, year: 2026, seasonYear: 2026, roundType: 'stroke' },
        });
        if (!error) successCount++;
      } catch (e) {
        console.error(`[SyncAllTours] Failed for ${tourId}:`, e);
      }
    }

    setSyncingAllTours(false);
    setSyncProgress('');
    queryClient.invalidateQueries({ queryKey: ['admin-v2', 'tour', 'players'] });
    toast.success(`Player sync complete across ${successCount}/6 tours`);
  };

  /* ── Data fetch ──────────────────────────────────────── */
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-v2', 'tour', 'players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, sr_id, full_name, first_name, last_name, country, country_code, tour_codes, headshot_override, updated_at')
        .order('full_name', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(p => ({
        id:               p.id,
        srId:             p.sr_id,
        fullName:         p.full_name,
        firstName:        p.first_name,
        lastName:         p.last_name,
        country:          p.country,
        countryCode:      p.country_code,
        tourCodes:        p.tour_codes,
        headshotOverride: p.headshot_override,
        updatedAt:        p.updated_at,
      }));
    },
    staleTime: 10 * 60_000,
  });

  /* ── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => {
    const byTour: Record<string, number> = {};
    let withTourCodes = 0;
    for (const p of data) {
      if (p.tourCodes?.length) {
        withTourCodes++;
        for (const tc of p.tourCodes) {
          const key = normalizeTourCode(tc);
          byTour[key] = (byTour[key] || 0) + 1;
        }
      }
    }
    return {
      total: data.length,
      withTourCodes,
      countries: new Set(data.map(p => p.country || p.countryCode).filter(Boolean)).size,
      byTour,
    };
  }, [data]);

  /* ── Filter + sort pipeline ────────────────────────── */
  const filtered = useMemo(() => {
    let result = data;

    // Tour filter
    if (tourFilter !== 'all') {
      result = result.filter(p =>
        p.tourCodes?.some(tc => normalizeTourCode(tc) === tourFilter)
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.fullName ?? '').toLowerCase().includes(q) ||
        (p.country ?? '').toLowerCase().includes(q) ||
        (p.countryCode ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':     return (a.fullName || '').localeCompare(b.fullName || '');
        case 'name_desc':    return (b.fullName || '').localeCompare(a.fullName || '');
        case 'country_asc':  return (a.country || '').localeCompare(b.country || '');
        case 'updated_desc': return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case 'updated_asc':  return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        default:             return 0;
      }
    });

    return result;
  }, [data, tourFilter, search, sortBy]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Sort icon helper ──────────────────────────────── */
  const SortIcon = ({ field }: { field: string }) => {
    const isActive = sortBy.startsWith(field);
    if (!isActive) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortBy.endsWith('_desc')
      ? <ArrowDown className="w-3 h-3 ml-1 text-primary" />
      : <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
  };

  const toggleSort = (field: string) => {
    const ascKey = `${field}_asc` as SortKey;
    const descKey = `${field}_desc` as SortKey;
    setSortBy(prev => prev === ascKey ? descKey : ascKey);
    setPage(1);
  };

  /* ── Columns ───────────────────────────────────────── */
  const columns = useMemo(() => [
    col.display({
      id: 'avatar',
      header: '',
      size: 48,
      cell: ({ row }) => <PlayerAvatar player={row.original} />,
    }),
    col.accessor('fullName', {
      header: () => (
        <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
          Name <SortIcon field="name" />
        </button>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        const name = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
        return <span className="text-[13px] font-medium text-foreground">{name}</span>;
      },
    }),
    col.accessor('country', {
      header: () => (
        <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort('country')}>
          Country <SortIcon field="country" />
        </button>
      ),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground">{getValue() ?? '—'}</span>
      ),
    }),
    col.display({
      id: 'tours',
      header: 'Tours',
      cell: ({ row }) => {
        const codes = row.original.tourCodes;
        if (!codes?.length) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {codes.map(tc => {
              const key = normalizeTourCode(tc);
              const tour = TOURS[key];
              return (
                <Badge
                  key={tc}
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${tour?.color || 'bg-muted text-muted-foreground'}`}
                >
                  {tour?.label || tc}
                </Badge>
              );
            })}
          </div>
        );
      },
    }),
    col.accessor('updatedAt', {
      header: () => (
        <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort('updated')}>
          Updated <SortIcon field="updated" />
        </button>
      ),
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue();
        return (
          <span className="text-[12px] text-muted-foreground">
            {val ? formatDistanceToNow(new Date(val), { addSuffix: true }) : '—'}
          </span>
        );
      },
    }),
  ], [sortBy]);

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        title="Tour Players"
        description="Sportradar player database"
        action={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
              Refresh
            </AdminButton>
            <AdminButton variant="primary" icon={Zap} size="sm" disabled={syncingAllTours} onClick={handleSyncAllTours}>
              {syncingAllTours ? <><span className="animate-pulse">{syncProgress}…</span></> : 'Sync All Tours'}
            </AdminButton>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AdminKpiCard title="Total Players" value={stats.total} icon={Users} isLoading={isLoading} />
        <AdminKpiCard title="With Tour Data" value={stats.withTourCodes} icon={Camera} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Countries" value={stats.countries} icon={Globe} iconColor="#3b82f6" isLoading={isLoading} />
      </div>

      {/* Tour filter badges */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTourFilter('all'); setPage(1); }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border border-border ${
            tourFilter === 'all'
              ? 'bg-primary/15 text-primary ring-2 ring-offset-1 ring-primary/40'
              : 'text-muted-foreground opacity-70 hover:opacity-100'
          }`}
        >
          All · {stats.total}
        </button>
        {Object.entries(TOURS).map(([code, { label, color }]) => (
          <button
            key={code}
            onClick={() => { setTourFilter(tourFilter === code ? 'all' : code); setPage(1); }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${color} ${
              tourFilter === code ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {label} · {stats.byTour[code] ?? 0}
          </button>
        ))}
      </div>

      {/* Search + sort controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <AdminSearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or country…" resultCount={filtered.length} />
        </div>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortKey); setPage(1); }}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name A → Z</SelectItem>
            <SelectItem value="name_desc">Name Z → A</SelectItem>
            <SelectItem value="country_asc">Country A → Z</SelectItem>
            <SelectItem value="updated_desc">Recently updated</SelectItem>
            <SelectItem value="updated_asc">Oldest updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
