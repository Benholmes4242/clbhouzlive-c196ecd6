import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Users, ChevronLeft, ChevronRight, Upload, Trash2, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  headshot_override: string | null;
  updated_at: string | null;
  created_at: string | null;
}

async function fetchAllPlayers(): Promise<PlayerRow[]> {
  const batchSize = 1000;
  let offset = 0;
  let allRows: PlayerRow[] = [];
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('sr_players')
      .select('id, full_name, first_name, last_name, country, country_code, tour_codes, college, birth_date, turned_pro, handedness, height, weight, residence, is_amateur, pga_tour_id, photo_asset_id, headshot_override, updated_at, created_at')
      .order('full_name', { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    allRows = allRows.concat(data ?? []);
    hasMore = (data?.length ?? 0) === batchSize;
    offset += batchSize;
  }
  return allRows;
}

/* ───────── Photo Management Sheet ───────── */
function PhotoManagementSheet({
  player,
  open,
  onClose,
}: {
  player: PlayerRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const [overrideValue, setOverrideValue] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideInitialized, setOverrideInitialized] = useState(false);

  // Sync override field when player changes
  if (player && !overrideInitialized) {
    setOverrideValue(player.headshot_override || '');
    setOverrideInitialized(true);
  }

  if (!player) return null;

  const primaryTour = player.tour_codes?.[0] || '';
  const playerName = player.full_name || '';
  const lookupName = overrideValue.trim() || playerName;
  const headshotUrl = lookupName
    ? getPlayerHeadshotUrl(lookupName, primaryTour || 'pga')
    : PLAYER_SILHOUETTE_URL;

  const handleSaveOverride = async () => {
    setSavingOverride(true);
    try {
      const val = overrideValue.trim() || null;
      const { error } = await supabase
        .from('sr_players')
        .update({ headshot_override: val } as any)
        .eq('id', player.id);
      if (error) throw error;
      toast.success(val ? `Override set to "${val}"` : 'Override cleared');
      queryClient.invalidateQueries({ queryKey: ['admin-tour-players-all'] });
      setImgKey(k => k + 1);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!playerName) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerName', playerName);
      formData.append('tourCode', primaryTour || 'misc');
      // Always try to delete old photo in the same tour folder
      formData.append('oldTourCode', primaryTour || 'misc');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-player-headshot`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      toast.success('Headshot uploaded successfully');
      setImgKey(k => k + 1);
      queryClient.invalidateQueries({ queryKey: ['admin-tour-players-all'] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!playerName) return;
    setRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-player-headshot`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName,
            tourCode: primaryTour || 'misc',
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');

      toast.success('Headshot removed');
      setImgKey(k => k + 1);
      queryClient.invalidateQueries({ queryKey: ['admin-tour-players-all'] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRemoving(false);
    }
  };

  const handleClose = () => {
    setOverrideInitialized(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-bold">Manage Photo</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5">
          {/* Current headshot preview */}
          <img
            key={imgKey}
            src={headshotUrl + `?v=${imgKey}`}
            alt={playerName}
            className="w-28 h-28 rounded-2xl object-cover object-top bg-muted border border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
          />
          <div className="text-center">
            <div className="font-semibold text-foreground">{playerName}</div>
            <div className="text-sm text-muted-foreground">
              {player.tour_codes?.length
                ? player.tour_codes.map(c => TOURS[c.toLowerCase()]?.label || c).join(', ')
                : 'No tour'}
            </div>
          </div>

          {/* Headshot Override */}
          <div className="w-full max-w-xs space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Headshot Override
            </label>
            <p className="text-[11px] text-muted-foreground">
              If the R2 filename doesn't match the player's full name, enter the correct filename here (without .webp).
            </p>
            <div className="flex gap-2">
              <Input
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                placeholder={playerName || 'e.g. A Lim Kim'}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="shrink-0"
              >
                {savingOverride ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </Button>
            </div>
            {player.headshot_override && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Currently overriding to: "{player.headshot_override}"
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload New Photo'}
            </Button>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleRemove}
              disabled={uploading || removing}
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {removing ? 'Removing…' : 'Remove Photo'}
            </Button>
          </div>
        </div>

        {/* Safe area spacer */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </SheetContent>
    </Sheet>
  );
}

/* ───────── Player Detail Dialog ───────── */
function PlayerDetailDialog({ player, open, onClose }: { player: PlayerRow | null; open: boolean; onClose: () => void }) {
  if (!player) return null;
  const primaryTour = player.tour_codes?.[0] || 'pga';
  const headshotUrl = player.full_name ? getPlayerHeadshotUrl(player.full_name, primaryTour, player.headshot_override) : PLAYER_SILHOUETTE_URL;
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

/* ───────── Main Page ───────── */
export function AdminTourPlayersPage() {
  const [search, setSearch] = useState('');
  const [tourFilter, setTourFilter] = useState<string>('all');
  
  const [page, setPage] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [photoPlayer, setPhotoPlayer] = useState<PlayerRow | null>(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['admin-tour-players-all'],
    queryFn: fetchAllPlayers,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let result = players;
    if (tourFilter !== 'all') result = result.filter(p => p.tour_codes?.some(c => c.toLowerCase() === tourFilter.toLowerCase()));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.country_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [players, tourFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(0); }, []);
  const handleTourFilter = useCallback((v: string) => { setTourFilter(v); setPage(0); }, []);
  

  const stats = useMemo(() => {
    const total = players.length;
    const byTour: Record<string, number> = {};
    for (const code of ALL_TOUR_CODES) byTour[code] = players.filter(p => p.tour_codes?.some(c => c.toLowerCase() === code)).length;
    return { total, byTour };
  }, [players]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tour Players</h1>
        <p className="text-sm text-muted-foreground mt-1">Master roster of all tour players across every tour</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total</span></div>
          <span className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</span>
        </CardContent></Card>
        {ALL_TOUR_CODES.filter(c => stats.byTour[c] > 0).map(code => (
          <Card key={code}><CardContent className="pt-4 pb-3 px-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{TOURS[code]?.label}</span>
            <div className="text-2xl font-bold text-foreground mt-1">{stats.byTour[code].toLocaleString()}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or country…" value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tourFilter} onValueChange={handleTourFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Tours" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            {ALL_TOUR_CODES.map(code => <SelectItem key={code} value={code}>{TOURS[code].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length.toLocaleString()} player{filtered.length !== 1 ? 's' : ''}</span>
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
                  
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((player) => {
                  const primaryTour = player.tour_codes?.[0] || 'pga';
                  const headshotUrl = player.full_name
                    ? getPlayerHeadshotUrl(player.full_name, primaryTour, player.headshot_override)
                    : PLAYER_SILHOUETTE_URL;

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
                            className="w-8 h-8 shrink-0 rounded-full object-cover object-top bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoPlayer(player);
                            }}
                          />
                          <span className="font-medium text-foreground">
                            {player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{player.country_code || player.country || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {player.tour_codes?.length ? player.tour_codes.map(code => (
                            <Badge key={code} variant="secondary" className={`text-[10px] px-1.5 py-0 ${TOURS[code.toLowerCase()]?.color || ''}`}>
                              {TOURS[code.toLowerCase()]?.label || code}
                            </Badge>
                          )) : <span className="text-xs text-muted-foreground">None</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {player.updated_at ? formatDistanceToNow(new Date(player.updated_at), { addSuffix: true }) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No players found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Player detail dialog */}
      <PlayerDetailDialog player={selectedPlayer} open={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} />

      {/* Photo management sheet */}
      <PhotoManagementSheet player={photoPlayer} open={!!photoPlayer} onClose={() => setPhotoPlayer(null)} />
    </div>
  );
}

export default AdminTourPlayersPage;
