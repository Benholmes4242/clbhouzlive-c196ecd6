import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useSafeQueryClient } from '@/lib/useSafeQueryClient';
import { cleanupOnLogout } from '@/utils/reactQueryCleanup';

export function useSupabaseSession() {
  const { queryClient, hasQueryClient } = useSafeQueryClient({
    hookName: 'useSupabaseSession',
  });

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // If somehow used outside provider, fail gracefully
  if (!hasQueryClient) {
    return {
      user: null,
      session: null,
      loading: false,
    };
  }

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        // Phase 3: Clean up on sign out
        if (event === 'SIGNED_OUT' && queryClient) {
          cleanupOnLogout(queryClient);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return { user, session, loading };
}
