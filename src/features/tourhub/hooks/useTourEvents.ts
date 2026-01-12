import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourKey } from '../components/TourSwitcherPills';

/**
 * TourEvent interface - now sourced from sr_tournaments (single source of truth)
 * Legacy tourhub_events table has been deprecated
 */
export interface TourEvent {
  id: string;
  name: string;
  tour: string; // Mapped from season's tour_name
  status: 'live' | 'upcoming' | 'complete' | 'scheduled' | 'inprogress' | 'closed';
  start_date: string;
  end_date: string;
  course_name: string | null; // venue_course_name
  location: string | null; // venue_city, venue_state, venue_country combined
  logo_url: string | null; // Not available in sr_tournaments
  espn_event_id: string; // sr_id
  event_url: string | null; // Not available in sr_tournaments
  last_fetched_at: string | null; // updated_at
  // Additional sr_tournaments fields
  purse: number | null;
  currency: string | null;
  venue_name: string | null;
  venue_par: number | null;
  venue_yardage: number | null;
  defending_champion: string | null;
}

// Map sr_tournaments status to TourEvent status
function mapTournamentStatus(status: string): TourEvent['status'] {
  const statusMap: Record<string, TourEvent['status']> = {
    'scheduled': 'upcoming',
    'inprogress': 'live',
    'closed': 'complete',
    'created': 'upcoming',
    'delayed': 'live',
    'cancelled': 'complete',
  };
  return statusMap[status?.toLowerCase()] || status as TourEvent['status'];
}

// Transform sr_tournaments row to TourEvent
function transformToTourEvent(row: any): TourEvent {
  const locationParts = [row.venue_city, row.venue_state, row.venue_country].filter(Boolean);
  
  return {
    id: row.id,
    name: row.name,
    tour: 'pga', // Default to PGA - sr_tournaments are primarily PGA Tour
    status: mapTournamentStatus(row.status),
    start_date: row.start_date,
    end_date: row.end_date,
    course_name: row.venue_course_name || row.venue_name,
    location: locationParts.length > 0 ? locationParts.join(', ') : null,
    logo_url: null, // Not available in sr_tournaments
    espn_event_id: row.sr_id,
    event_url: null, // Not available in sr_tournaments
    last_fetched_at: row.updated_at,
    purse: row.purse,
    currency: row.currency,
    venue_name: row.venue_name,
    venue_par: row.venue_par,
    venue_yardage: row.venue_yardage,
    defending_champion: row.defending_champion,
  };
}

export function useTourEvents(tour: TourKey) {
  return useQuery({
    queryKey: ['tourhub-events', tour],
    queryFn: async () => {
      // sr_tournaments currently only has PGA Tour data
      // Filter by tour when we have multi-tour data in sr_tournaments
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(transformToTourEvent);
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useLiveEvents() {
  return useQuery({
    queryKey: ['tourhub-events-live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .in('status', ['inprogress', 'delayed'])
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(transformToTourEvent);
    },
    staleTime: 30 * 1000, // 30 seconds for live data
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ['tourhub-events-upcoming', limit],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .in('status', ['scheduled', 'created'])
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return (data || []).map(transformToTourEvent);
    },
    staleTime: 60 * 1000,
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ['tourhub-events-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(transformToTourEvent);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Get a single tournament by ID
 */
export function useTourEvent(eventId: string) {
  return useQuery({
    queryKey: ['tourhub-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return transformToTourEvent(data);
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
  });
}
