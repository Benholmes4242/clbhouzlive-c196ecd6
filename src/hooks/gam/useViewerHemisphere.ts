import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hemisphereFor, type Hemisphere } from '@/lib/gam/seasonClock';

/**
 * Viewer's hemisphere ('N' by default). Reads user_profiles.country
 * from the existing profile cache -- no extra fetch.
 */
export function useViewerHemisphere(): Hemisphere {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id ?? null);
  const country = (profile as { country?: string | null } | null | undefined)?.country ?? null;
  return hemisphereFor(country);
}
