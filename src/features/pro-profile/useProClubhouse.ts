/** Build 4 reads. Clubhouse is profile-keyed and anon-safe; reach is the
 * pro's own figures and only ever enabled for the owner. Both fail closed:
 * a bad payload or error suppresses the section instead of showing stale
 * numbers. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseProClubhouse, parseProReach } from './proClubhouseRules';

export function useProClubhouse(proId: string) {
  return useQuery({
    queryKey: ['pro-profile', 'clubhouse', proId],
    enabled: !!proId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pro_clubhouse', { p_pro_id: proId });
      if (error) throw error;
      return parseProClubhouse(data);
    },
  });
}

export function useProReach(enabled: boolean) {
  return useQuery({
    queryKey: ['pro-profile', 'reach'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pro_reach');
      if (error) throw error;
      const parsed = parseProReach(data);
      if (!parsed) throw new Error('Bad reach payload');
      return parsed;
    },
  });
}
