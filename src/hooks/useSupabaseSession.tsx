
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// Global session state to prevent multiple initializations
let globalSession: Session | null = null;
let globalUser: User | null = null;
let isInitializing = false;
let isInitialized = false;
const subscribers = new Set<(user: User | null, session: Session | null, loading: boolean) => void>();

// Initialize session once globally
const initializeSession = () => {
  if (isInitializing || isInitialized) return;
  
  isInitializing = true;
  console.log('🔒 Global session: initializing');

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔒 Auth state change:', event, session?.user?.id ? 'user exists' : 'no user');
    globalSession = session;
    globalUser = session?.user ?? null;
    isInitialized = true;
    isInitializing = false;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalUser, globalSession, false));
  });

  // Fetch session on mount
  console.log('🔒 Fetching initial session...');
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('🔒 Initial session fetch result:', session?.user?.id ? 'user exists' : 'no user', error ? 'ERROR: ' + error.message : 'no error');
    globalSession = session;
    globalUser = session?.user ?? null;
    isInitialized = true;
    isInitializing = false;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalUser, globalSession, false));
  }).catch((error) => {
    console.error('🔒 Session fetch failed:', error);
    isInitialized = true;
    isInitializing = false;
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(null, null, false));
  });
};

// Unified hook to get current user and session
export function useSupabaseSession() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [session, setSession] = useState<Session | null>(globalSession);
  const [loading, setLoading] = useState(!isInitialized);

  useEffect(() => {
    console.log('🔒 useSupabaseSession: hook mounted');
    
    // Initialize global session if not already done
    initializeSession();
    
    // Subscribe to updates
    const updateCallback = (newUser: User | null, newSession: Session | null, newLoading: boolean) => {
      setUser(newUser);
      setSession(newSession);
      setLoading(newLoading);
    };
    
    subscribers.add(updateCallback);
    
    // If already initialized, set current state
    if (isInitialized) {
      setUser(globalUser);
      setSession(globalSession);
      setLoading(false);
    }

    return () => {
      subscribers.delete(updateCallback);
    };
  }, []);

  return { user, session, loading };
}
