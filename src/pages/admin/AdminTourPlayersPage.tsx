import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Users, Link2, Link2Off, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Tour display config
const TOURS: Record<string, { label: string; color: string }> = {
  pga:  { label: 'PGA Tour',       color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  euro: { label: 'DP World Tour',  color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  lpga: { label: 'LPGA',           color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  pgad: { label: 'Korn Ferry',     color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  liv:  { label: 'LIV Golf',       color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  champ:{ label: 'Champions',      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

const ALL_TOUR_CODES = Object.keys(TOURS);
const PAGE_SIZE = 50;

// Types
interface PlayerRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  country_code: string | null;
  tour_codes: string[] | null;
  college: string | null;
  birth_date: string | null;
  turned_pro: number | null;
  handedness: string | null;
  height: string | null;
  weight: string | null;
  residence: string | null;
  is_amateur: boolean | null;
  pga_tour_id: string | null;
  photo_asset_id: string | null;
  updated_at: string | null;
  created_at: string | null;
}

// Fetch all players using batched pagination
async function fetchAllPlayers(): Promise<PlayerRow[]> {
  const batchSize = 1000;
  let offset = 0;
  let allRows: PlayerRow[] = [];
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('sr_players')
      .select('id, full_name, first_name, last_name, country, country_code, tour_codes, college, birth_date, turned_pro, handedness, height, weight, residence, is_amateur, pga_tour_id, photo_asset_id, updated_at, created_at')
      .order('full_name', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    allRows = allRows.concat(data ?? []);
    hasMore = (data?.length ?? 0) === batchSize;
    offset += batchSize;
  }

  return allRows;
}

function PlayerDetailDialog({ player, open, onClose }: { player: PlayerRow | null; open: boolean; onClose: () => void }) {
  if (!player) return null;

  const primaryTour = player.tour_codes?.[0] || 'pga';
  const headshotUrl = player.full_name ? getPlayerHeadshotUrl(player.full_name, primaryTour) : PLAYER_SILHOUETTE_URL;
  const hasHeadshot = !!player.photo_asset_id;

  const fields = [
    { label: 'Full Name', value: player.full_name },
    { label: 'Country', value: player.country },
    { label: 'Country Code', value: player.country_code },
    { label: 'Tour(s)', value: player.tour_codes?.join(', ') || 'None' },
    { label: 'College', value: player.college },
    { label: 'Birth Date', value: player.birth_date },
    { label: 'Turned Pro', value: player.turned_pro?.toString() },
    { label: 'Handedness', value: player.handedness },
    { label: 'Height', value: player.height },
    { label: 'Weight', value: player.weight },
    { label: 'Residence', value: player.residence },
    { label: 'Amateur', value: player.is_amateur ? 'Yes' : 'No' },
    { label: 'PGA Tour ID', value: player.pga_tour_id },
    { label: 'Photo Asset', value: hasHeadshot ? 'Matched ✓' : 'No headshot' },
    { label: 'DB ID', value: player.id },
    { label: 'Created', value: player.created_at ? new Date(player.created_at).toLocaleDateString() : null },
    { label: 'Updated', value: player.updated_at ? formatDistanceToNow(new Date(player.updated_at), { addSuffix: true }) : null },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={headshotUrl}
              alt={player.full_name || ''}
              className="w-12 h-12 rounded-full object-cover bg-muted"
              onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
            <div>
              <div className="text-lg">{player.full_name || 'Unknown'}</div>
              <div className="text-sm font-normal text-muted-foreground">{player.country || 'Unknown country'}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {fields.map(f => (
            <div key={f.label}>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{f.label}</div>
              <div className="text-sm text-foreground mt-0.5">{f.value || '—'}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminTourPlayersPage() {
  const [search, setSearch] = useState('');
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['admin-tour-players-all'],
    queryFn: fetchAllPlayers,
    staleTime: 5 * 60 * 1000,
  });

  // Filtered list
  const filtered = useMemo(() => {
    let result = players;

    // Tour filter
    if (tourFilter !== 'all') {
      result = result.filter(p => p.tour_codes?.includes(tourFilter));
    }

    // Match filter (photo_asset_id presence)
    if (matchFilter === 'matched') {
      result = result.filter(p => !!p.photo_asset_id);
    } else if (matchFilter === 'unmatched') {
      result = result.filter(p => !p.photo_asset_id);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.country_code?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [players, tourFilter, matchFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); }, []);
  const handleTourFilter = useCallback((v: string) => { setTourFilter(v); setPage(0); }, []);
  const handleMatchFilter = useCallback((v: string) => { setMatchFilter(v); setPage(0); }, []);

  // Summary stats
  const stats = useMemo(() => {
    const total = players.length;
    const matched = players.filter(p => !!p.photo_asset_id).length;
    const byTour: Record<string, number> = {};
    for (const code of ALL_TOUR_CODES) {
      byTour[code] = players.filter(p => p.tour_codes?.includes(code)).length;
    }
    const noTour = players.filter(p => !p.tour_codes?.length).length;
    return { total, matched, unmatched: total - matched, byTour, noTour };
  }, [players]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tour Players</h1>
        <p className="text-sm text-muted-foreground mt-1">Master roster of all tour players across every tour</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Matched</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.matched.toLocaleString()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2Off className="w-4 h-4 text-red-500" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Unmatched</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stats.unmatched.toLocaleString()}</span>
          </CardContent>
        </Card>
        {ALL_TOUR_CODES.filter(c => stats.byTour[c] > 0).map(code => (
          <Card key={code}>
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{TOURS[code]?.label}</span>
              <div className="text-2xl font-bold text-foreground mt-1">{stats.byTour[code].toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or country…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tourFilter} onValueChange={handleTourFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Tours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            {ALL_TOUR_CODES.map(code => (
              <SelectItem key={code} value={code}>{TOURS[code].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={matchFilter} onValueChange={handleMatchFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length.toLocaleString()} player{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading players…</div>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Tour(s)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((player) => {
                  const primaryTour = player.tour_codes?.[0] || 'pga';
                  const headshotUrl = player.full_name
                    ? getPlayerHeadshotUrl(player.full_name, primaryTour)
                    : PLAYER_SILHOUETTE_URL;
                  const hasHeadshot = !!player.photo_asset_id;

                  return (
                    <TableRow
                      key={player.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <img
                            src={headshotUrl}
                            alt=""
                            className="w-8 h-8 shrink-0 rounded-full object-cover object-top bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                          />
                          <span className="font-medium text-foreground">
                            {player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {player.country_code || player.country || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {player.tour_codes?.length ? (
                            player.tour_codes.map(code => (
                              <Badge key={code} variant="secondary" className={`text-[10px] px-1.5 py-0 ${TOURS[code]?.color || ''}`}>
                                {TOURS[code]?.label || code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasHeadshot ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                            Matched
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                            Unmatched
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {player.updated_at
                          ? formatDistanceToNow(new Date(player.updated_at), { addSuffix: true })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No players found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Player detail dialog */}
      <PlayerDetailDialog
        player={selectedPlayer}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}

export default AdminTourPlayersPage;
