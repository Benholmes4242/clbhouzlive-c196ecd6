import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EchoEngine = 'claude' | 'openai' | 'gemini' | 'perplexity';

export interface EchoEngineLatest {
  engine: EchoEngine;
  ok: boolean;
  ms: number | null;
  chars: number | null;
  model_id: string | null;
  error: string | null;
  checked_at: string;
}

export interface EchoEngineDay {
  engine: EchoEngine;
  day: string;         // yyyy-mm-dd
  ok: boolean;
  ms: number | null;
  checked_at: string;
}

export interface EchoEngineHealthSummary {
  latest: EchoEngineLatest[];
  days7:  EchoEngineDay[];
}

const ENGINES: EchoEngine[] = ['claude', 'openai', 'gemini', 'perplexity'];

async function fetchSummary(): Promise<EchoEngineHealthSummary> {
  const { data, error } = await supabase.rpc('get_echo_engine_health_summary' as any);
  if (error) throw error;
  const d = (data ?? {}) as any;
  return {
    latest: Array.isArray(d.latest) ? d.latest : [],
    days7:  Array.isArray(d.days7)  ? d.days7  : [],
  };
}

export function useEchoEngineHealth() {
  const q = useQuery({
    queryKey: ['admin-v2', 'dashboard', 'echo-engine-health'],
    queryFn: fetchSummary,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const runCheck = useCallback(async () => {
    const { error } = await supabase.functions.invoke('echo-engine-health', {
      body: {},
    });
    if (error) throw error;
    await q.refetch();
  }, [q]);

  return {
    data: q.data,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
    runCheck,
    engines: ENGINES,
  };
}
