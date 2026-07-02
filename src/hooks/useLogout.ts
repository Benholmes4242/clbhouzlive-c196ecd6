import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { removePersistedQueryCache } from '@/lib/queryPersister';

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      await removePersistedQueryCache();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      try {
        queryClient.clear();
        await removePersistedQueryCache();
      } catch { /* noop */ }
      window.location.href = '/';
    }
  }, [queryClient]);

  return { logout };
}
