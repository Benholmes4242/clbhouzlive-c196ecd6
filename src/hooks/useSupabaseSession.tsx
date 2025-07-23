
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
    console.log('🔒 useSupabaseSession: initializing');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔒 Auth state change:', event, session?.user?.id ? 'user exists' : 'no user');
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('🔒 Updated state - loading:', false, 'user:', session?.user?.id || 'none');
      }
    });

    // Fetch session on mount
    console.log('🔒 Fetching initial session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔒 Initial session fetch result:', session?.user?.id ? 'user exists' : 'no user', error ? 'ERROR: ' + error.message : 'no error');
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('🔒 Set initial state - loading:', false, 'user:', session?.user?.id || 'none');
      }
    }).catch((error) => {
      console.error('🔒 Session fetch failed:', error);
      if (mounted) {
        setLoading(false);
        console.log('🔒 Set loading false due to error');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}
