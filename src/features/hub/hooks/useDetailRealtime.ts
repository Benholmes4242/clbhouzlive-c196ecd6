/**
 * useDetailRealtime - Real-time updates for game/trip details
 * Listens to participant changes and refreshes data
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to real-time updates for a game's details
 */
export function useGameDetailRealtime(gameId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game-detail-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        // Invalidate game-related queries
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
        queryClient.invalidateQueries({ queryKey: ['game-rsvp', gameId] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, queryClient]);
}

/**
 * Subscribe to real-time updates for a trip's details
 */
export function useTripDetailRealtime(tripId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-detail-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_participants',
        filter: `trip_id=eq.${tripId}`,
      }, () => {
        // Invalidate trip-related queries
        queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);
}
