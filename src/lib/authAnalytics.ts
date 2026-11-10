/**
 * Auth-specific analytics tracking
 *
 * Persists events to `analytics_events` so the admin Auth analytics view has
 * real data. Same shape as `src/utils/analyticsEvents.ts`. Never throws —
 * tracking must never block the auth UI.
 */
import { supabase } from '@/integrations/supabase/client';
import { getSessionId, getUserAgent, isAnalyticsExcludedHost } from '@/utils/analyticsSession';

export type AuthMethod = 'apple' | 'google' | 'email';

/**
 * FUNNEL_TRACKING_1: the real error alongside the coarse category.
 * error_code / error_status come from the Supabase AuthError when present;
 * error_detail is the raw message with emails redacted to '[email]' and any
 * run of 4+ digits to '[n]', truncated to 120 characters.
 */
export function buildAuthErrorExtras(err: unknown): Record<string, unknown> {
  const e = err as { code?: unknown; status?: unknown; message?: unknown } | null;
  const detail = String(e?.message ?? '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
    .replace(/\d{4,}/g, '[n]')
    .slice(0, 120);
  return {
    ...(typeof e?.code === 'string' && e.code ? { error_code: e.code } : {}),
    ...(typeof e?.status === 'number' ? { error_status: e.status } : {}),
    error_detail: detail,
  };
}

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
    if (isAnalyticsExcludedHost()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      name,
      user_id: user?.id ?? null,
      props: {
        ...props,
        session_id: getSessionId(),
        ua: getUserAgent(),
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        host: typeof window !== 'undefined' ? window.location.hostname : null,
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

export function trackAuthFailed(method: AuthMethod, error: string, durationMs?: number, extra?: Record<string, unknown>) {
  track('auth_failed', { method, error, duration_ms: durationMs, ...extra });
}

export function trackAuthException(method: AuthMethod, error: string, extra?: Record<string, unknown>) {
  track('auth_exception', { method, error, ...extra });
}

export function trackSignupInitiated(method: AuthMethod) {
  track('signup_initiated', { method });
}

export function trackSignupSuccess(method: AuthMethod, durationMs?: number) {
  track('signup_success', { method, duration_ms: durationMs });
}

export function trackSignupFailed(method: AuthMethod, error: string, durationMs?: number, extra?: Record<string, unknown>) {
  track('signup_failed', { method, error, duration_ms: durationMs, ...extra });
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
