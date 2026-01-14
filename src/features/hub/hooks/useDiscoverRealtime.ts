/**
 * useDiscoverRealtime - Real-time updates for discover games & trips
 * 
 * Subscribes to changes in:
 * - games table (status changes)
 * - game_participants (spots filling, request status)
 * - trips table (changes)
 * - trip_participants (spots filling, request status)
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDiscoverRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('discover-realtime')
      // Games changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
      }, () => {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === 'discover-games' || key === 'discover-games-v2';
          }
        });
      })
      // Game participants changes (affects slots)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_participants',
      }, () => {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === 'discover-games' || key === 'discover-games-v2';
          }
        });
      })
      // Trips changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
      }, () => {
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'discover-trips'
        });
      })
      // Trip participants changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_participants',
      }, () => {
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === 'discover-trips'
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
