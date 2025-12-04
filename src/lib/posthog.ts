import posthog from 'posthog-js';

// Disable PostHog entirely for now to reduce console noise
const POSTHOG_ENABLED = false;

// Initialize PostHog only if enabled
if (typeof window !== 'undefined' && POSTHOG_ENABLED) {
  posthog.init(
    import.meta.env.VITE_POSTHOG_KEY || 'phc_placeholder', 
    {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('[PostHog] Initialized');
        }
      },
    }
  );
}

// Export a guarded capture function
export const captureEvent = (event: string, props?: Record<string, unknown>) => {
  if (POSTHOG_ENABLED && typeof window !== 'undefined') {
    posthog.capture(event, props);
  }
};

export { posthog, POSTHOG_ENABLED };
