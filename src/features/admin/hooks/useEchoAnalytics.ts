import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEchoOverview(from: string, to: string) {
  return useQuery({
    queryKey: ['echo.overview', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_stats_overview' as any, { p_from: from, p_to: to });
      if (error) throw error;
      return data?.[0] ?? { events_count: 0, unique_users: 0, shares_created: 0, exports: 0 };
    },
    staleTime: 30_000,
  });
}

export function useEchoTimeseries(from: string, to: string) {
  return useQuery({
    queryKey: ['echo.timeseries', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_stats_timeseries' as any, { p_from: from, p_to: to });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useEchoTopTags(from: string, to: string, limit = 10) {
  return useQuery({
    queryKey: ['echo.topTags', from, to, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_stats_top_tags' as any, { p_from: from, p_to: to, p_limit: limit });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useEchoTopUsers(from: string, to: string, limit = 10) {
  return useQuery({
    queryKey: ['echo.topUsers', from, to, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_stats_top_users' as any, { p_from: from, p_to: to, p_limit: limit });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useEchoExports(from: string, to: string) {
  return useQuery({
    queryKey: ['echo.exports', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('echo_stats_exports' as any, { p_from: from, p_to: to });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
