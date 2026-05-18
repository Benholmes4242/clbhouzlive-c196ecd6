import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Call a Supabase RPC with react-query. Returns typed data or throws on error.
 */
export function useGamRpc<TResult, TArgs extends Record<string, unknown> = Record<string, never>>(
  rpcName: string,
  args: TArgs,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  },
) {
  return useQuery<TResult>({
    queryKey: ['gam_rpc', rpcName, args],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(rpcName, args);
      if (error) throw error;
      return data as TResult;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}
