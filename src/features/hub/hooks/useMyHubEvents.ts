/**
 * useMyHubEvents - Unified hook for fetching user's games and trips as events
 * Uses the hub_events view to present a unified interface
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isFuture, isPast, isToday } from 'date-fns';

export interface HubEvent {
  id: string;
  legacy_game_id: string | null;
  legacy_trip_id: string | null;
  event_type: 'single_round' | 'multi_day';
  name: string;
  description: string | null;
  creator_id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  course_id: string | null;
  visibility: string;
  status: string;
  lat: number | null;
  lng: number | null;
  // Participant counts
  goingCount?: number;
  isHost?: boolean;
}

export function useMyHubEvents() {
  return useQuery<HubEvent[]>({
    queryKey: ['my-hub-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all events where user is creator
      const { data: createdEvents, error: createdError } = await supabase
        .from('hub_events')
        .select('*')
        .eq('creator_id', user.id)
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true });

      if (createdError) {
        console.error('[useMyHubEvents] Error fetching created events:', createdError);
        throw createdError;
      }

      // Get all events where user is a participant
      const { data: participantData, error: partError } = await supabase
        .from('hub_participants')
        .select('event_id, source_type')
        .eq('user_id', user.id);

      if (partError) {
        console.error('[useMyHubEvents] Error fetching participant data:', partError);
        throw partError;
      }

      const participantEventIds = participantData?.map(p => p.event_id) || [];

      let participantEvents: any[] = [];
      if (participantEventIds.length > 0) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('hub_events')
          .select('*')
          .in('id', participantEventIds)
          .neq('status', 'cancelled');

        if (eventsError) {
          console.error('[useMyHubEvents] Error fetching participant events:', eventsError);
        } else {
          participantEvents = eventsData || [];
        }
      }

      // Merge and dedupe
      const eventMap = new Map<string, any>();
      (createdEvents || []).forEach(e => eventMap.set(e.id, { ...e, isHost: true }));
      participantEvents.forEach(e => {
        if (!eventMap.has(e.id)) {
          eventMap.set(e.id, { ...e, isHost: false });
        }
      });

      // Filter to upcoming and today only, sort by date
      const now = new Date();
      const allEvents = Array.from(eventMap.values())
        .filter(e => {
          const eventDate = new Date(e.start_date);
          return isFuture(eventDate) || isToday(eventDate) || 
            (e.end_date && new Date(e.end_date) >= now);
        })
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      return allEvents as HubEvent[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useMyPastHubEvents() {
  return useQuery<HubEvent[]>({
    queryKey: ['my-hub-events-past'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date().toISOString().split('T')[0];

      // Get past events where user is creator
      const { data: createdEvents, error: createdError } = await supabase
        .from('hub_events')
        .select('*')
        .eq('creator_id', user.id)
        .lt('end_date', now)
        .order('start_date', { ascending: false })
        .limit(30);

      if (createdError) {
        console.error('[useMyPastHubEvents] Error:', createdError);
        throw createdError;
      }

      return (createdEvents || []) as HubEvent[];
    },
    staleTime: 60000,
  });
}
