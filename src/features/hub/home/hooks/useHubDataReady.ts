/**
 * useHubDataReady - Hook to determine when Hub data is ready
 * Used to show skeleton vs real content
 */

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useHubHeroData } from './useHubHeroData';

export function useHubDataReady(): boolean {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { isLoading: profileLoading } = useUserProfile(user?.id);
  const { isLoading: heroLoading } = useHubHeroData();
  
  // Ready when session + profile + hero data have loaded
  const isReady = !sessionLoading && !profileLoading && !heroLoading;
  
  return isReady;
}
