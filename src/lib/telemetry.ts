/**
 * Simple telemetry wrapper for PostHog
 * No-op if PostHog is not configured
 */
export function track(event: string, props: Record<string, any> = {}) {
  // No-op if PostHog not configured
  if (!(window as any).posthog) return;
  
  try {
    (window as any).posthog.capture(event, props);
  } catch (e) {
    console.warn("[telemetry] Failed to track event:", event, e);
  }
}
