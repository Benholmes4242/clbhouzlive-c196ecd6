import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const SESSION_START_KEY = 'session_start_time';

/**
 * Hook to enforce 30-day rolling session timeout
 * Signs out users whose sessions are older than 30 days
 */
export function useSessionTimeout() {
  const navigate = useNavigate();

  const checkSessionAge = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      localStorage.removeItem(SESSION_START_KEY);
      return;
    }

    // Get or set session start time
    let sessionStartTime = localStorage.getItem(SESSION_START_KEY);
    
    if (!sessionStartTime) {
      // First time seeing this session - record start time
      sessionStartTime = Date.now().toString();
      localStorage.setItem(SESSION_START_KEY, sessionStartTime);
    }

    const sessionAge = Date.now() - parseInt(sessionStartTime, 10);

    // If session is older than 30 days, force re-authentication
    if (sessionAge > MAX_SESSION_AGE_MS) {
      console.log('[Auth] Session expired after 30 days, signing out');
      localStorage.removeItem(SESSION_START_KEY);
      
      // Store reason for logout
      localStorage.setItem('logout_reason', 'session_expired');
      
      await supabase.auth.signOut();
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    // Check immediately
    checkSessionAge();

    // Then check every hour
    const interval = setInterval(checkSessionAge, SESSION_CHECK_INTERVAL);

    // Listen for sign out to clean up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_START_KEY);
      } else if (event === 'SIGNED_IN') {
        // New sign in - reset session start time
        localStorage.setItem(SESSION_START_KEY, Date.now().toString());
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSessionAge]);
}
