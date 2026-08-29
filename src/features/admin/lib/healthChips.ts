import { useMemo } from 'react';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
import { useErrorCount24h } from '../hooks/useStability';
import { adminTheme as t } from '../theme';

export type ChipTone = 'ok' | 'warn' | 'danger' | 'idle';
export interface ChipState { tone: ChipTone; label: string; detail: string }

export function toneColor(tone: ChipTone): string {
  if (tone === 'ok') return t.ok;
  if (tone === 'warn') return t.warn;
  if (tone === 'danger') return t.danger;
  return t.inkFaint;
}

export function computeEchoChip(echo: ReturnType<typeof useEchoEngineHealth>): ChipState {
  if (echo.isLoading) return { tone: 'idle', label: 'Echo engines', detail: 'Loading' };
  if (echo.isError) return { tone: 'warn', label: 'Echo engines', detail: 'Unavailable' };
  const latest = echo.data?.latest ?? [];
  if (!latest.length) return { tone: 'idle', label: 'Echo engines', detail: 'No checks' };
  const failing = latest.filter(r => !r.ok).length;
  if (failing > 0) return { tone: 'danger', label: 'Echo engines', detail: `${failing} of ${latest.length} failing` };
  return { tone: 'ok', label: 'Echo engines', detail: `${latest.length} engines ok` };
}

export function computePushChip(push: ReturnType<typeof usePushHealth>): ChipState {
  if (push.isLoading) return { tone: 'idle', label: 'Push', detail: 'Loading' };
  if (push.isError || !push.data) return { tone: 'warn', label: 'Push', detail: 'Unavailable' };
  const wd = push.data.watchdog;
  const missing = wd?.missing_60m ?? 0;
  if (push.data.status === 'red') {
    if (wd && wd.enqueue_ok === false) {
      return { tone: 'danger', label: 'Push', detail: 'Not queueing' };
    }
    return { tone: 'danger', label: 'Push', detail: 'Failing' };
  }
  if (push.data.status === 'amber') {
    if (missing > 0) {
      return { tone: 'warn', label: 'Push', detail: `${missing} not queued` };
    }
    return { tone: 'warn', label: 'Push', detail: 'Degraded' };
  }
  return { tone: 'ok', label: 'Push', detail: 'Healthy' };
}

export function computeEgChip(eg: ReturnType<typeof useDashboard>['egSyncHealth']): ChipState {
  if (eg.isLoading) return { tone: 'idle', label: 'EG sync', detail: 'Loading' };
  if (eg.isError || !eg.data) return { tone: 'warn', label: 'EG sync', detail: 'Unavailable' };
  const d = eg.data as any;
  // Freshness first. The 18-20 Aug 2026 outage was invisible for two days
  // because every frozen row still read last_sync_status = 'ok'; only the age
  // of the newest sync in the estate tells the truth.
  const fresh = d.freshest_hours_ago as number | null | undefined;
  if (fresh == null) return { tone: 'danger', label: 'EG sync', detail: 'never synced' };
  if (fresh > 12) return { tone: 'danger', label: 'EG sync', detail: `${Math.round(fresh)}h stale` };
  if (d.status === 'red') return { tone: 'danger', label: 'EG sync', detail: `${d.auth_failed} re-auth` };
  if ((d.stale_12h_count ?? 0) > 0) return { tone: 'warn', label: 'EG sync', detail: `${d.stale_12h_count} stale` };
  if (d.auth_failed > 0) return { tone: 'warn', label: 'EG sync', detail: `${d.auth_failed} re-auth` };
  if (d.eg_unavailable > 0) return { tone: 'warn', label: 'EG sync', detail: `${d.eg_unavailable} unavailable` };
  return { tone: 'ok', label: 'EG sync', detail: `${d.status_ok_count}/${d.total_connected} ok` };

}

export function computeCronChip(eg: ReturnType<typeof useDashboard>['egSyncHealth']): ChipState {
  if (eg.isLoading) return { tone: 'idle', label: 'Cron', detail: 'Loading' };
  if (eg.isError || !eg.data) return { tone: 'warn', label: 'Cron', detail: 'Unavailable' };
  const h = eg.data.cron_hours_ago;
  if (h === null || h === undefined) return { tone: 'danger', label: 'Cron', detail: 'stale' };
  if (h > 48) return { tone: 'danger', label: 'Cron', detail: `${Math.round(h)}h ago` };
  if (h > 26) return { tone: 'warn', label: 'Cron', detail: `${Math.round(h)}h ago` };
  return { tone: 'ok', label: 'Cron', detail: `${Math.round(h)}h ago` };
}

export function computeErrorsChip(
  count24h: number | null | undefined,
  isLoading: boolean,
  isError: boolean,
): ChipState {
  if (isLoading) return { tone: 'idle', label: 'Errors', detail: 'Loading' };
  if (isError || count24h == null) return { tone: 'warn', label: 'Errors', detail: 'Unavailable' };
  if (count24h === 0) return { tone: 'ok', label: 'Errors', detail: '0 in 24h' };
  if (count24h < 10) return { tone: 'warn', label: 'Errors', detail: `${count24h} in 24h` };
  return { tone: 'danger', label: 'Errors', detail: `${count24h} in 24h` };
}

/**
 * BRIEF_HEALTH_DELETION_INTEGRITY. Thresholds are not negotiable:
 * live_sessions > 0 is RED (a deleted account can currently write to the
 * app) and OUTRANKS amber; unbanned > 0 alone is AMBER (contained but not
 * erased). Both zero is OK. Loading or an errored/unavailable RPC (a
 * non-admin, per the brief) is idle - never an error on the board.
 */
export function computeDeletionChip(
  data: { live_sessions: number; unbanned: number } | null | undefined,
  isLoading: boolean,
): ChipState {
  if (isLoading) return { tone: 'idle', label: 'Deletions', detail: 'Loading' };
  if (!data) return { tone: 'idle', label: 'Deletions', detail: 'Unavailable' };
  if (data.live_sessions > 0) {
    return { tone: 'danger', label: 'Deletions', detail: `${data.live_sessions} with live access` };
  }
  if (data.unbanned > 0) {
    return { tone: 'warn', label: 'Deletions', detail: `${data.unbanned} not erased` };
  }
  return { tone: 'ok', label: 'Deletions', detail: 'clean' };
}

export function useHealthChips() {
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const dashboard = useDashboard();
  const eg = dashboard.egSyncHealth;
  const errors = useErrorCount24h();

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip = useMemo(() => computeEgChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const errorsChip = useMemo(
    () => computeErrorsChip(errors.data ?? null, errors.isLoading, errors.isError),
    [errors.data, errors.isLoading, errors.isError],
  );

  const chips = { echo: echoChip, push: pushChip, eg: egChip, cron: cronChip, errors: errorsChip };
  const anyLoading = echo.isLoading || push.isLoading || eg.isLoading || errors.isLoading;
  const nonOk = [echoChip, pushChip, egChip, cronChip, errorsChip].filter(
    c => c.tone !== 'ok' && c.tone !== 'idle',
  ).length;

  return { chips, nonOk, isLoading: anyLoading, echo, push, errors };
}
