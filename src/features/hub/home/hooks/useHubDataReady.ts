/**
 * useHubDataReady - Hook to determine when Hub data is ready
 * Used to show skeleton vs real content
 */

import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useHubDataReady(): boolean {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { isLoading: profileLoading } = useUserProfile(user?.id);
  const { isLoading: gamesLoading } = useGamesQuery();
  
  // Ready when session + profile have loaded (games can load async)
  const isReady = !sessionLoading && !profileLoading;
  
  return isReady;
}
