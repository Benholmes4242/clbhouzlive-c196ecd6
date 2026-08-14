/**
 * Auth-specific analytics tracking
 *
 * Persists events to `analytics_events` so the admin Auth analytics view has
 * real data. Same shape as `src/utils/analyticsEvents.ts`. Never throws —
 * tracking must never block the auth UI.
 */
import { supabase } from '@/integrations/supabase/client';
import { getSessionId, getUserAgent } from '@/utils/analyticsSession';

export type AuthMethod = 'apple' | 'google' | 'email';

/**
 * EVERY row must carry a `ua`. The server-side bot filters read
 * `ua ILIKE '%headless%' OR ...`; with a NULL ua that predicate is NULL,
 * `NOT NULL` is NULL, and the row is SILENTLY DROPPED from WAU, MAU, the
 * retention cohorts and the funnel — which is why auth events were invisible.
 * `ua` and `session_id` come from the shared accessors in
 * utils/analyticsSession and are never re-derived here.
 */
async function track(name: string, props: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      name,
      user_id: user?.id ?? null,
      props: {
        ...props,
        session_id: getSessionId(),
        ua: getUserAgent(),
        page: typeof window !== 'undefined' ? window.location.pathname : null,
      },
    });
  } catch {
    // never block auth UI
  }
}


export function trackAuthMethodSelected(method: AuthMethod) {
  track('auth_method_selected', { method });
}

export function trackAuthInitiated(method: AuthMethod, durationMs?: number) {
  track('auth_initiated', { method, duration_ms: durationMs });
}

export function trackAuthFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('auth_failed', { method, error, duration_ms: durationMs });
}

export function trackAuthException(method: AuthMethod, error: string) {
  track('auth_exception', { method, error });
}

export function trackSignupInitiated(method: AuthMethod) {
  track('signup_initiated', { method });
}

export function trackSignupSuccess(method: AuthMethod, durationMs?: number) {
  track('signup_success', { method, duration_ms: durationMs });
}

export function trackSignupFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('signup_failed', { method, error, duration_ms: durationMs });
}

export function trackLoginSuccess(method: AuthMethod, durationMs?: number) {
  track('login_success', { method, duration_ms: durationMs });
}

export function trackLoginFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('login_failed', { method, error, duration_ms: durationMs });
}

export function trackAuthCallbackStarted() {
  track('auth_callback_started');
}

export function trackAuthRedirect(destination: 'onboarding' | 'home' | 'verified' | 'auth' | 'reset-password') {
  track('auth_redirect', { destination });
}

export function trackAuthComplete(method: AuthMethod) {
  track('auth_complete', { method });
}

export function trackProfileFallbackCreated(success: boolean, error?: string) {
  track('profile_fallback_created', { success, error });
}
