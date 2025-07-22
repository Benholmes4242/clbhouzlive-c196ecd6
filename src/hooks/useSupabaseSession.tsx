
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// Unified hook to get current user and session
export function useSupabaseSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('useSupabaseSession: Initializing...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('useSupabaseSession: Auth state changed', { event: _event, hasSession: !!session });
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Fetch session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useSupabaseSession: Initial session fetch', { hasSession: !!session, error });
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('useSupabaseSession: Error fetching session', error);
      if (mounted) {
        setLoading(false); // Set loading to false even on error
      }
    });

    // Add a fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('useSupabaseSession: Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}
