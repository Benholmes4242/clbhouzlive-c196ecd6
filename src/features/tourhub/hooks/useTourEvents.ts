import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TourKey } from '../components/TourSwitcherPills';

export interface TourEvent {
  id: string;
  name: string;
  tour: string;
  status: 'live' | 'upcoming' | 'complete';
  start_date: string;
  end_date: string;
  course_name: string | null;
  location: string | null;
  logo_url: string | null;
  espn_event_id: string;
  event_url: string | null;
  last_fetched_at: string | null;
}

export function useTourEvents(tour: TourKey) {
  return useQuery({
    queryKey: ['tourhub-events', tour],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tourhub_events')
        .select('*')
        .eq('tour', tour)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as TourEvent[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useLiveEvents() {
  return useQuery({
    queryKey: ['tourhub-events-live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tourhub_events')
        .select('*')
        .eq('status', 'live')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as TourEvent[];
    },
    staleTime: 30 * 1000, // 30 seconds for live data
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ['tourhub-events-upcoming', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tourhub_events')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as TourEvent[];
    },
    staleTime: 60 * 1000,
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ['tourhub-events-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tourhub_events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return (data || []) as TourEvent[];
    },
    staleTime: 60 * 1000,
  });
}
