import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MaintenanceState {
  on: boolean;
  message: string | null;
}

/**
 * Reads maintenance_mode + maintenance_message from public.app_config.
 * Polls every 60s so flipping the flag releases open sessions without a
 * deploy. FAILS OPEN: any error reports off — a network blip must never
 * wall the whole membership.
 *
 * The key 'app-config' is deliberately absent from the persister allowlist
 * (src/lib/queryPersister.ts): the flag is never cached to disk, so an 'on'
 * can never outlive the SQL update that turned it off.
 */
export function useMaintenanceMode(): MaintenanceState {
  const { data } = useQuery({
    queryKey: ['app-config', 'maintenance'],
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);
      if (error) throw error;
      const map = new Map((data ?? []).map((r) => [r.key, r.value]));
      return {
        on: map.get('maintenance_mode') === 'on',
        message: (map.get('maintenance_message') as string | null) ?? null,
      };
    },
  });

  // Structural fail-open: undefined data (loading OR error) reports off.
  return data ?? { on: false, message: null };
}

export default useMaintenanceMode;
