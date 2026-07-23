import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PushStatus = 'green' | 'amber' | 'red';

export interface PushHealthQueue {
  sent_24h: number;
  errored_24h: number;
  pending_now: number;
  oldest_pending_minutes: number | null;
  latency_p50_ms: number | null;
  latency_max_ms: number | null;
  error_breakdown_24h: Array<{ error: string; count: number }>;
}

export interface PushHealthWatchdog {
  notifications_24h_push_eligible: number;
  queue_rows_24h: number;
  notifications_60m_push_eligible: number;
  queue_rows_60m: number;
  missing_60m: number;
  enqueue_ok: boolean;
  latest_error: string | null;
  latest_error_at: string | null;
}

export interface PushHealthDevices {
  total: number;
  enabled: number;
  ios: number;
  android: number;
}

export interface PushHealthCron {
  status: 'succeeded' | 'failed' | 'unknown' | string;
  minutes_ago: number | null;
}

export interface PushHealthVolumeRow {
  type: string;
  count: number;
}

export interface PushHealthSummary {
  status: PushStatus;
  reasons: string[];
  checked_at: string;
  queue: PushHealthQueue;
  watchdog: PushHealthWatchdog;
  devices: PushHealthDevices;
  cron: PushHealthCron;
  volume_7d_by_type: PushHealthVolumeRow[];
}

async function fetchPushHealth(): Promise<PushHealthSummary> {
  const { data, error } = await supabase.rpc('get_push_health_summary' as any);
  if (error) throw error;
  const d = (data ?? {}) as any;
  return {
    status: (d.status ?? 'green') as PushStatus,
    reasons: Array.isArray(d.reasons) ? d.reasons : [],
    checked_at: d.checked_at ?? new Date().toISOString(),
    queue: {
      sent_24h: d?.queue?.sent_24h ?? 0,
      errored_24h: d?.queue?.errored_24h ?? 0,
      pending_now: d?.queue?.pending_now ?? 0,
      oldest_pending_minutes: d?.queue?.oldest_pending_minutes ?? null,
      latency_p50_ms: d?.queue?.latency_p50_ms ?? null,
      latency_max_ms: d?.queue?.latency_max_ms ?? null,
      error_breakdown_24h: Array.isArray(d?.queue?.error_breakdown_24h) ? d.queue.error_breakdown_24h : [],
    },
    watchdog: {
      notifications_24h_push_eligible: d?.watchdog?.notifications_24h_push_eligible ?? 0,
      queue_rows_24h: d?.watchdog?.queue_rows_24h ?? 0,
      notifications_60m_push_eligible: d?.watchdog?.notifications_60m_push_eligible ?? 0,
      queue_rows_60m: d?.watchdog?.queue_rows_60m ?? 0,
      missing_60m: d?.watchdog?.missing_60m ?? 0,
      enqueue_ok: d?.watchdog?.enqueue_ok !== false,
      latest_error: d?.watchdog?.latest_error ?? null,
      latest_error_at: d?.watchdog?.latest_error_at ?? null,
    },
    devices: {
      total: d?.devices?.total ?? 0,
      enabled: d?.devices?.enabled ?? 0,
      ios: d?.devices?.ios ?? 0,
      android: d?.devices?.android ?? 0,
    },
    cron: {
      status: d?.cron?.status ?? 'unknown',
      minutes_ago: d?.cron?.minutes_ago ?? null,
    },
    volume_7d_by_type: Array.isArray(d?.volume_7d_by_type) ? d.volume_7d_by_type : [],
  };
}

export function usePushHealth() {
  return useQuery({
    queryKey: ['admin-push-health'],
    queryFn: fetchPushHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
