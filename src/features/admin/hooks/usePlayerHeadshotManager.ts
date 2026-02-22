import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

export interface PlayerEntry {
  id: string;
  full_name: string;
  tour_codes: string[];
  country_code: string | null;
  primaryTourCode: string;
  headshotUrl: string;
  hasPhoto: boolean | null; // null = pending
}

const TOUR_OPTIONS = [
  { value: 'all', label: 'All Tours' },
  { value: 'pga', label: 'PGA Tour' },
  { value: 'euro', label: 'DP World Tour' },
  { value: 'lpga', label: 'LPGA' },
  { value: 'pgad', label: 'Korn Ferry' },
  { value: 'liv', label: 'LIV Golf' },
] as const;

export { TOUR_OPTIONS };

export type PhotoFilter = 'all' | 'with_photo' | 'missing';

export function usePlayerHeadshotManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByTour, setFilterByTour] = useState('all');
  const [filterByStatus, setFilterByStatus] = useState<PhotoFilter>('all');
  const [photoStatuses, setPhotoStatuses] = useState<Record<string, boolean>>({});
  const [checkingPhotos, setCheckingPhotos] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch all players
  const { data: rawPlayers, isLoading } = useQuery({
    queryKey: ['admin', 'player-headshot-manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_players')
        .select('id, full_name, tour_codes, country_code')
        .not('full_name', 'is', null)
        .not('tour_codes', 'is', null)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build player entries with headshot URLs
  const players: PlayerEntry[] = useMemo(() => {
    if (!rawPlayers) return [];
    return rawPlayers.map(p => {
      const primaryTourCode = p.tour_codes?.[0] ?? 'pga';
      const headshotUrl = getPlayerHeadshotUrl(p.full_name!, primaryTourCode);
      return {
        id: p.id,
        full_name: p.full_name!,
        tour_codes: p.tour_codes!,
        country_code: p.country_code,
        primaryTourCode,
        headshotUrl,
        hasPhoto: photoStatuses[p.id] ?? null,
      };
    });
  }, [rawPlayers, photoStatuses]);

  // Check photo statuses in batches
  const checkPhotoStatuses = useCallback(async (playerList?: PlayerEntry[]) => {
    const list = playerList ?? players;
    if (list.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setCheckingPhotos(true);

    const BATCH_SIZE = 20;
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      if (controller.signal.aborted) break;
      const batch = list.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async p => {
          try {
            const res = await fetch(p.headshotUrl, { method: 'HEAD', signal: controller.signal });
            return { id: p.id, hasPhoto: res.ok };
          } catch {
            return { id: p.id, hasPhoto: false };
          }
        })
      );
      if (controller.signal.aborted) break;
      setPhotoStatuses(prev => {
        const next = { ...prev };
        for (const r of results) {
          if (r.status === 'fulfilled') next[r.value.id] = r.value.hasPhoto;
        }
        return next;
      });
    }
    setCheckingPhotos(false);
  }, [players]);

  // Auto-check on first load
  useEffect(() => {
    if (players.length > 0 && Object.keys(photoStatuses).length === 0) {
      checkPhotoStatuses(players);
    }
  }, [players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter players
  const filteredPlayers = useMemo(() => {
    let result = players;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.full_name.toLowerCase().includes(q));
    }
    if (filterByTour !== 'all') {
      result = result.filter(p => p.tour_codes.includes(filterByTour));
    }
    if (filterByStatus === 'with_photo') {
      result = result.filter(p => p.hasPhoto === true);
    } else if (filterByStatus === 'missing') {
      result = result.filter(p => p.hasPhoto === false);
    }
    return result;
  }, [players, searchQuery, filterByTour, filterByStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = players.length;
    const withPhoto = players.filter(p => p.hasPhoto === true).length;
    const missing = players.filter(p => p.hasPhoto === false).length;
    const pending = players.filter(p => p.hasPhoto === null).length;
    return { total, withPhoto, missing, pending };
  }, [players]);

  // Upload headshot
  const uploadHeadshot = useCallback(async (file: File, player: PlayerEntry) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('playerName', player.full_name);
    formData.append('tourCode', player.primaryTourCode);
    formData.append('action', 'upload');

    const response = await fetch(
      `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/upload-player-headshot`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      }
    );
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Upload failed');

    // Update local status
    setPhotoStatuses(prev => ({ ...prev, [player.id]: true }));
    return result;
  }, []);

  // Delete headshot
  const deleteHeadshot = useCallback(async (player: PlayerEntry) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('playerName', player.full_name);
    formData.append('tourCode', player.primaryTourCode);
    formData.append('action', 'delete');

    const response = await fetch(
      `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/upload-player-headshot`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      }
    );
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Delete failed');

    setPhotoStatuses(prev => ({ ...prev, [player.id]: false }));
    return result;
  }, []);

  const refreshStatuses = useCallback(() => {
    setPhotoStatuses({});
    // Will trigger re-check via useEffect
    queryClient.invalidateQueries({ queryKey: ['admin', 'player-headshot-manager'] });
  }, [queryClient]);

  return {
    players: filteredPlayers,
    allPlayers: players,
    isLoading,
    checkingPhotos,
    stats,
    searchQuery, setSearchQuery,
    filterByTour, setFilterByTour,
    filterByStatus, setFilterByStatus,
    uploadHeadshot,
    deleteHeadshot,
    refreshStatuses,
  };
}
