import { useMemo } from 'react';
import { useGlobalSearchV2, type SearchBuckets } from './useGlobalSearchV2';

/**
 * Messaging-style picker shape. Kept minimal to match the fields the
 * messaging-v2 sheets consume (id, display name, avatar, verified?).
 */
export interface PersonResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  verified?: boolean;
}

export interface BusinessResult {
  id: string;
  name: string;
  logo_url: string | null;
  verified?: boolean;
}

interface Options {
  query: string;
  enabled?: boolean;
  limit?: number;
  /** Include verified pros and coaching businesses (default true). */
  includePros?: boolean;
}

/**
 * Slim search hook for picker UIs (messaging new-conversation, member add,
 * compare). Brief 26: one global_search_v2 'directory' call.
 *   people     = people, then pros of kind 'pro'
 *   businesses = clubs, then pros of kind 'business', then businesses
 * includePros: false drops both pro kinds (CompareSheet — no handicap).
 *
 * The caller is expected to pass a pre-debounced query.
 */
export function useEntityPickerSearch({ query, enabled = true, limit = 8, includePros = true }: Options) {
  const active = enabled && query.trim().length > 0;

  const q = useGlobalSearchV2({
    query,
    scope: 'directory',
    enabled: active,
    limit,
    debounceMs: 0,
  });

  const merged = useMemo(() => mergeDirectory(q.data, includePros), [q.data, includePros]);

  return {
    people: merged.people,
    businesses: merged.businesses,
    isLoading: q.isLoading,
    error: q.error ?? null,
  };
}

export function mergeDirectory(
  data: Partial<Pick<SearchBuckets, 'people' | 'pros' | 'clubs' | 'businesses'>>,
  includePros = true,
): { people: PersonResult[]; businesses: BusinessResult[] } {
  const a = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  const pros = includePros ? a(data.pros) : [];
  const people: PersonResult[] = [
    ...a(data.people).map((p) => ({
      id: p.id,
      display_name: p.display_name ?? p.username ?? '',
      avatar_url: p.profile_photo_url ?? null,
    })),
    ...pros.filter((p) => p.kind === 'pro').map((p) => ({
      id: p.id,
      display_name: p.name ?? p.handle ?? '',
      avatar_url: p.image_url ?? null,
    })),
  ];
  const businesses: BusinessResult[] = [
    ...a(data.clubs).map((c) => ({ id: c.id, name: c.name, logo_url: c.logo_url ?? null })),
    ...pros.filter((p) => p.kind === 'business').map((p) => ({ id: p.id, name: p.name ?? '', logo_url: p.image_url ?? null })),
    ...a(data.businesses).map((b) => ({ id: b.id, name: b.name, logo_url: b.logo_url ?? null })),
  ];
  return { people, businesses };
}
