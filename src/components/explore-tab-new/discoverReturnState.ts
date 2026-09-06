import type { DiscoverTab } from './DiscoverHeader';

export interface DiscoverReturnSnapshot {
  tab: DiscoverTab;
  scrollY: number;
}

interface DiscoverHistoryState {
  discoverReturn?: DiscoverReturnSnapshot;
  [key: string]: unknown;
}

export function readDiscoverReturn(state: unknown): DiscoverReturnSnapshot | null {
  if (!state || typeof state !== 'object') return null;
  const candidate = (state as DiscoverHistoryState).discoverReturn;
  if (!candidate) return null;
  if (!['scores', 'news', 'gallery'].includes(candidate.tab)) return null;
  if (!Number.isFinite(candidate.scrollY) || candidate.scrollY < 0) return null;
  return candidate;
}

export function withDiscoverReturn(
  state: unknown,
  snapshot: DiscoverReturnSnapshot,
): DiscoverHistoryState {
  const existing = state && typeof state === 'object' ? state : {};
  return { ...existing, discoverReturn: snapshot };
}

export function withoutDiscoverReturn(state: unknown): Record<string, unknown> | null {
  if (!state || typeof state !== 'object') return null;
  const { discoverReturn: _discarded, ...rest } = state as DiscoverHistoryState;
  return Object.keys(rest).length > 0 ? rest : null;
}

export const DISCOVER_NEWS_FALLBACK_STATE = withDiscoverReturn(null, {
  tab: 'news',
  scrollY: 0,
});