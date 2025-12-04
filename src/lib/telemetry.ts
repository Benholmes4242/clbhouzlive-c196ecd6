/**
 * Simple telemetry wrapper for PostHog
 * No-op if PostHog is not configured or disabled
 */
import { POSTHOG_ENABLED } from './posthog';

export function track(event: string, props: Record<string, any> = {}) {
  // No-op if PostHog not enabled
  if (!POSTHOG_ENABLED || !(window as any).posthog) return;
  
  try {
    (window as any).posthog.capture(event, props);
  } catch {
    // Silently fail - telemetry is non-critical
  }
}
