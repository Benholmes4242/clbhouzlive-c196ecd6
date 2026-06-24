import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useSafeQueryClient } from '@/lib/useSafeQueryClient';
import { cleanupOnLogout } from '@/utils/reactQueryCleanup';
import { logSessionStart, logSessionReady, logSessionNone } from '@/utils/bootTimeline';

export function useSupabaseSession() {
  const { queryClient, hasQueryClient } = useSafeQueryClient({
    hookName: 'useSupabaseSession',
  });

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionStartLogged = useRef(false);

  useEffect(() => {
    // If used outside provider, bail out of the effect but keep hook order stable.
    if (!hasQueryClient) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let resolved = false;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      resolved = true;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      // Log session resolution
      if (nextSession?.user) {
        logSessionReady(nextSession.user.id);
      } else {
        logSessionNone();
      }
    };

    // Log session start once
    if (!sessionStartLogged.current) {
      sessionStartLogged.current = true;
      logSessionStart();
      // eslint-disable-next-line no-console
      console.info('[BootAudit][Session] start', { t: Date.now() });
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // eslint-disable-next-line no-console
      console.info('[BootAudit][Session] onAuthStateChange', { t: Date.now(), event, hasSession: !!session });

      // Phase 3: Clean up on sign out
      if (event === 'SIGNED_OUT' && queryClient) {
        cleanupOnLogout(queryClient);
      }

      // Treat every event (including INITIAL_SESSION, even with null) as
      // authoritative. This guarantees the app never sits in a "resolving
      // session" state when Supabase has already told us there is no session.
      applySession(session);
    });

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        // eslint-disable-next-line no-console
        console.info('[BootAudit][Session] getSession resolved', { t: Date.now(), hasSession: !!session });
        applySession(session);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[BootAudit][Session] getSession rejected', { t: Date.now(), err: String(err) });
        applySession(null);
      });

    // Hard safety timeout: if Supabase never resolves (mobile webview /
    // VPN / blocked websocket / corrupted storage), treat as logged-out
    // after 8s so the app can render an auth screen or public surface
    // instead of hanging on a skeleton forever. (Apple 2.1 fix.)
    const SESSION_BOOT_TIMEOUT_MS = 8000;
    const timeoutId = window.setTimeout(() => {
      if (!mounted || resolved) return;
      console.warn(
        `[useSupabaseSession] session bootstrap timed out after ${SESSION_BOOT_TIMEOUT_MS}ms — proceeding as logged-out`,
      );
      // eslint-disable-next-line no-console
      console.info('[BootAudit][Session] timeout -> null', { t: Date.now() });
      applySession(null);
    }, SESSION_BOOT_TIMEOUT_MS);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [queryClient, hasQueryClient]);


  return { user, session, loading };
}
