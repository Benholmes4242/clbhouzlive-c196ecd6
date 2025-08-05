import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// Simple global state to prevent multiple auth listeners
let globalAuthListener: any = null;
let globalSessionPromise: Promise<any> | null = null;

// Unified hook to get current user and session
export function useSupabaseSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('🔒 useSupabaseSession: initializing');

    // Only create one global auth listener
    if (!globalAuthListener) {
      globalAuthListener = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔒 Auth state change:', event, session?.user?.id ? 'user exists' : 'no user');
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log('🔒 Updated state - loading:', false, 'user:', session?.user?.id || 'none');
        }
      });
    }

    // Only fetch session once globally  
    if (!globalSessionPromise) {
      console.log('🔒 Fetching initial session...');
      globalSessionPromise = supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('🔒 Initial session fetch result:', session?.user?.id ? 'user exists' : 'no user', error ? 'ERROR: ' + error.message : 'no error');
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log('🔒 Set initial state - loading:', false, 'user:', session?.user?.id || 'none');
        }
        return { session, error };
      }).catch((error) => {
        console.error('🔒 Session fetch failed:', error);
        if (mounted) {
          setLoading(false);
          console.log('🔒 Set loading false due to error');
        }
        throw error;
      });
    } else {
      // If session was already fetched, use the cached result
      globalSessionPromise.then(({ session }) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { user, session, loading };
}