/**
 * Auth-specific analytics tracking
 * Tracks authentication events for monitoring and debugging
 */
import { track } from './telemetry';

export type AuthMethod = 'apple' | 'google' | 'email';

export function trackAuthMethodSelected(method: AuthMethod) {
  track('auth_method_selected', { method });
}

export function trackAuthInitiated(method: AuthMethod, durationMs?: number) {
  track('auth_initiated', { 
    method, 
    duration_ms: durationMs 
  });
}

export function trackAuthFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('auth_failed', { 
    method, 
    error,
    duration_ms: durationMs 
  });
}

export function trackAuthException(method: AuthMethod, error: string) {
  track('auth_exception', { 
    method, 
    error 
  });
}

export function trackSignupInitiated(method: AuthMethod) {
  track('signup_initiated', { method });
}

export function trackSignupSuccess(method: AuthMethod, durationMs?: number) {
  track('signup_success', { 
    method,
    duration_ms: durationMs 
  });
}

export function trackSignupFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('signup_failed', { 
    method,
    error,
    duration_ms: durationMs 
  });
}

export function trackLoginSuccess(method: AuthMethod, durationMs?: number) {
  track('login_success', { 
    method,
    duration_ms: durationMs 
  });
}

export function trackLoginFailed(method: AuthMethod, error: string, durationMs?: number) {
  track('login_failed', { 
    method,
    error,
    duration_ms: durationMs 
  });
}

export function trackAuthCallbackStarted() {
  track('auth_callback_started');
}

export function trackAuthRedirect(destination: 'onboarding' | 'home' | 'verified' | 'auth') {
  track('auth_redirect', { destination });
}

export function trackAuthComplete(method: AuthMethod) {
  track('auth_complete', { method });
}

export function trackProfileFallbackCreated(success: boolean, error?: string) {
  track('profile_fallback_created', { 
    success,
    error 
  });
}
