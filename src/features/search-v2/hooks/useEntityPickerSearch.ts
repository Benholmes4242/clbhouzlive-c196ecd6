import { useMemo } from 'react';
import { useGlobalSearchV2 } from './useGlobalSearchV2';

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
}

/**
 * Slim search hook for picker UIs (messaging new-conversation & member add).
 * Fires two parallel global_search_v2 calls (scopes 'people' + 'clubs') and
 * maps the RPC hits into the picker-compatible shapes.
 *
 * The caller is expected to pass a pre-debounced query.
 */
export function useEntityPickerSearch({ query, enabled = true, limit = 8 }: Options) {
  const active = enabled && query.trim().length > 0;

  const peopleQ = useGlobalSearchV2({
    query,
    scope: 'people',
    enabled: active,
    limit,
    debounceMs: 0,
  });

  const clubsQ = useGlobalSearchV2({
    query,
    scope: 'clubs',
    enabled: active,
    limit,
    debounceMs: 0,
  });

  const people: PersonResult[] = useMemo(
    () =>
      peopleQ.data.people.map((p) => ({
        id: p.id,
        display_name: p.display_name ?? p.username ?? '',
        avatar_url: p.profile_photo_url ?? null,
      })),
    [peopleQ.data.people],
  );

  const businesses: BusinessResult[] = useMemo(
    () =>
      clubsQ.data.clubs.map((c) => ({
        id: c.id,
        name: c.name,
        logo_url: c.logo_url ?? null,
      })),
    [clubsQ.data.clubs],
  );

  return {
    people,
    businesses,
    isLoading: peopleQ.isLoading || clubsQ.isLoading,
    error: peopleQ.error ?? clubsQ.error ?? null,
  };
}
