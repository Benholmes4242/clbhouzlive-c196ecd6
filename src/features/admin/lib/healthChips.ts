import { useMemo } from 'react';
import { useEchoEngineHealth } from '../hooks/useEchoEngineHealth';
import { usePushHealth } from '../hooks/usePushHealth';
import { useDashboard } from '../hooks/useDashboard';
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
  if (push.data.status === 'red') return { tone: 'danger', label: 'Push', detail: 'Failing' };
  if (push.data.status === 'amber') return { tone: 'warn', label: 'Push', detail: 'Degraded' };
  return { tone: 'ok', label: 'Push', detail: 'Healthy' };
}

export function computeEgChip(eg: ReturnType<typeof useDashboard>['egSyncHealth']): ChipState {
  if (eg.isLoading) return { tone: 'idle', label: 'EG sync', detail: 'Loading' };
  if (eg.isError || !eg.data) return { tone: 'warn', label: 'EG sync', detail: 'Unavailable' };
  const d = eg.data;
  if (d.status === 'red') return { tone: 'danger', label: 'EG sync', detail: `${d.auth_failed} re-auth` };
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

export function useHealthChips() {
  const echo = useEchoEngineHealth();
  const push = usePushHealth();
  const dashboard = useDashboard();
  const eg = dashboard.egSyncHealth;

  const echoChip = useMemo(() => computeEchoChip(echo), [echo.isLoading, echo.isError, echo.data]);
  const pushChip = useMemo(() => computePushChip(push), [push.isLoading, push.isError, push.data]);
  const egChip = useMemo(() => computeEgChip(eg), [eg.isLoading, eg.isError, eg.data]);
  const cronChip = useMemo(() => computeCronChip(eg), [eg.isLoading, eg.isError, eg.data]);

  const chips = { echo: echoChip, push: pushChip, eg: egChip, cron: cronChip };
  const anyLoading = echo.isLoading || push.isLoading || eg.isLoading;
  const nonOk = [echoChip, pushChip, egChip, cronChip].filter(
    c => c.tone !== 'ok' && c.tone !== 'idle',
  ).length;

  return { chips, nonOk, isLoading: anyLoading, echo, push };
}
