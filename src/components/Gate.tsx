import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Read and validate access from localStorage (domain-agnostic for native builds)
 */
function readAccess(): boolean {
  try {
    const raw = localStorage.getItem('siteAccess');
    if (!raw) return false;
    const a = JSON.parse(raw);
    const notExpired = a?.granted && (!a.expiresAt || new Date(a.expiresAt) > new Date());
    return !!notExpired;
  } catch {
    localStorage.removeItem('siteAccess');
    return false;
  }
}

/**
 * Check if user has a profile
 */
async function checkProfileExists(userId: string): Promise<boolean> {
  const { data } = await supabase.from('user_profiles').select('id').eq('id', userId).maybeSingle();
  return !!data;
}

/**
 * Centralized Gate component - handles ALL routing decisions
 * Prevents redirect loops in native WebView environments by:
 * 1. Waiting for session resolution before any redirects
 * 2. Making access checks domain-agnostic (works on capacitor://localhost)
 * 3. Consolidating all routing logic in one place
 */
export default function Gate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const [accessReady, setAccessReady] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const redirected = useRef(false);

  // A) Resolve session once and listen for changes
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s);
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // B) Check if user has profile when session exists
  useEffect(() => {
    if (!session) {
      setProfileChecked(true);
      setHasProfile(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const exists = await checkProfileExists(session.user.id);
        if (!mounted) return;
        setHasProfile(exists);
        setProfileChecked(true);
      } catch (error) {
        console.error('Error checking profile:', error);
        if (!mounted) return;
        setProfileChecked(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  // C) Resolve access once (domain-agnostic)
  useEffect(() => {
    setHasAccess(readAccess());
    setAccessReady(true);
  }, []);

  // D) Single redirect decision after all checks are ready
  useEffect(() => {
    if (!authReady || !accessReady || !profileChecked || redirected.current) return;

    // Public routes that don't need access or auth
    const publicRoutes = ['/echo/share'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    if (isPublicRoute) {
      return; // Allow public routes without any checks
    }

    // Priority 1: Access gate
    if (!hasAccess && pathname !== '/access') {
      redirected.current = true;
      navigate('/access', { replace: true });
      return;
    }
    
    // Priority 2: Authentication
    if (hasAccess && !session && pathname !== '/auth') {
      redirected.current = true;
      navigate('/auth', { replace: true });
      return;
    }
    
    // Priority 3: Profile creation
    if (hasAccess && session && !hasProfile && pathname !== '/create-profile') {
      redirected.current = true;
      navigate('/create-profile', { replace: true });
      return;
    }
    
    // Priority 4: Redirect authenticated users away from auth/access pages
    if (hasAccess && session && hasProfile && (pathname === '/auth' || pathname === '/access' || pathname === '/create-profile')) {
      redirected.current = true;
      navigate('/', { replace: true });
    }
  }, [authReady, accessReady, profileChecked, hasAccess, session, hasProfile, pathname, navigate]);

  // Block UI until decisions are possible → prevents iOS flicker
  if (!authReady || !accessReady || !profileChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
