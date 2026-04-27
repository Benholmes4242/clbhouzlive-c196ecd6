/**
 * useLegacyAlumni — runtime source of truth for the College Franchise
 * "Legacy" tier (4-tier alumni model).
 *
 * Returns Map<player_id, context_label> from the public.legacy_alumni table.
 * Public-read RLS; safe to call without auth.
 *
 * Replaces the constants-file lookup (LEGACY_ALUMNI_IDS / LEGACY_ALUMNI_CONTEXT)
 * for runtime classification. The constants file is preserved as the
 * documented seed source — see src/features/tourhub/constants/legacyAlumni.ts.
 *
 * Caching: 1h staleTime. Editorial table; changes are infrequent and
 * coordinated through migrations.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const EMPTY_MAP: ReadonlyMap<string, string> = new Map();

export function useLegacyAlumni() {
  return useQuery({
    queryKey: ['legacy-alumni'],
    queryFn: async (): Promise<ReadonlyMap<string, string>> => {
      const { data, error } = await supabase
        .from('legacy_alumni')
        .select('player_id, context_label');

      if (error) {
        console.error('[useLegacyAlumni] Error:', error);
        throw error;
      }

      const map = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.player_id && row.context_label) {
          map.set(row.player_id, row.context_label);
        }
      }
      return map;
    },
    staleTime: 60 * 60 * 1000, // 1h
    placeholderData: EMPTY_MAP,
  });
}
