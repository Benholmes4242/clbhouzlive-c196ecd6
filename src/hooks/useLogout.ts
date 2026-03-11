import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useLogout() {
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  }, []);

  return { logout };
}
