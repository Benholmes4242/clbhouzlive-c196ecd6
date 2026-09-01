import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * BRIEF_CRON_FAILURE_WATCH — per-job cron state for the Health board.
 *
 * cron.job_run_details is not readable by application roles, so this goes
 * through get_cron_job_health(), a SECURITY DEFINER function with the admin
 * predicate inside its body: a non-admin gets zero rows, never the schedule of
 * every job on the platform.
 *
 * Unlike the other Health hooks this one does NOT swallow errors into null.
 * A card that reads "ALL RUNNING" because the query failed is the exact
 * failure this card exists to prevent, so the error surfaces and the card
 * renders an explicit unknown state.
 */
export interface CronJobHealthRow {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null;
  last_run_at: string | null;
  last_message: string | null;
  failed_24h: number;
  ok_24h: number;
  last_success_at: string | null;
}

export function useCronJobHealth() {
  return useQuery<CronJobHealthRow[]>({
    queryKey: ['admin-v2', 'cron-job-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_job_health' as any);
      if (error) throw error;
      return (data ?? []) as unknown as CronJobHealthRow[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}

/** A job that has never once worked is a louder state than one that broke today. */
export function isNeverSucceeded(row: CronJobHealthRow): boolean {
  return !row.last_success_at;
}

export function cronFaults(rows: CronJobHealthRow[]): CronJobHealthRow[] {
  return rows.filter(r => r.last_status === 'failed' || isNeverSucceeded(r));
}
