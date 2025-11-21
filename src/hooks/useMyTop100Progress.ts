import { useSupabaseSession } from './useSupabaseSession';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';

/**
 * Convenience wrapper for getting the current user's Top 100 progress
 */
export function useMyTop100Progress() {
  const { session } = useSupabaseSession();
  return useTop100ProgressForUser(session?.user?.id ?? null);
}
