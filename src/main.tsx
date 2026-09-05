// On-screen log capture (on-device testing). Self-installs on import.
// No-op unless DEV || ?perf=1. MUST be first so it catches boot-time logs.
import './perf/consoleCapture';

// Perf-gated lane-churn harness: attaches only when DBG/perf is enabled.
import './video/devLaneChurn';

// Boot Timeline: Import for side effects (attaches to window)
import './utils/bootTimeline';
// Discover Timing: Import for side effects (attaches to window)
import './utils/discoverTimeline';
// Log app start immediately
import { logAppStart } from './utils/bootTimeline';
try { logAppStart(); } catch {}

// Layer B diagnostic: does this runtime expose a service worker at boot?
console.info('[boot] sw-available', 'serviceWorker' in navigator);

// Cold start manifest warming - prefetch first video manifest ASAP
import { ManifestWarmer } from './utils/video/ManifestWarmer';
try { ManifestWarmer.warmOnStartup(); } catch {}

// [VIDEO-TEARDOWN] hls.js boot warmer removed — engine severed.

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/theme.css'
import './styles/theme-tokens.css'
import 'flag-icons/css/flag-icons.min.css'

// i18n foundation (Wave 0) — must import before first React render so the
// i18next instance + language detection are live from the initial paint.
// No user-visible copy is keyed yet; this is machinery only.
import './i18n'

// ============================================================================
// PRE-REACT IMMERSIVE FLAGS
// Eliminates the white flash between native splash and Clubhouse skeleton on
// cold start. By setting these flags synchronously BEFORE React mounts, the
// CSS dark-shell rules apply from the very first paint instead of waiting for
// useLayoutEffect to fire after the first commit.
//
// The corresponding useLayoutEffect logic in App.tsx and ClubhouseWrapped.tsx
// continues to handle subsequent route changes — this block is idempotent
// with that logic.
// ============================================================================
import { isImmersiveRoute } from '@/components/header/globalHeaderRules';

const initialPath = window.location.pathname;
if (isImmersiveRoute(initialPath)) {
  document.documentElement.setAttribute('data-immersive-route', 'true');
}
if (initialPath === '/' || initialPath === '/clubhouse') {
  document.body.classList.add('route-clubhouse');
} else if (initialPath.startsWith('/auth')) {
  document.body.classList.add('route-auth');
}

import { initializePerformanceMonitoring } from './utils/performanceInit'
import { initWebVitals, sendToAnalytics, initPerformanceObserver } from './analytics/webVitals'
import './utils/echoDocNavHeight'
// Capacitor plugin verification removed - using Median.co bridge instead
// Chunk recovery moved to index.html for earlier error handling

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Mobile viewport height fix
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', setViewportHeight);
setViewportHeight();

// Initialize performance monitoring
initializePerformanceMonitoring();
initWebVitals(sendToAnalytics);
initPerformanceObserver();

// C5-1 — install app_error tracking (window handlers only; ErrorBoundary
// wires the React branch itself). Pure listener install — SR5.
import('@/lib/errorTracking').then(m => m.installErrorTracking()).catch(() => {});

// Silent video-perf telemetry (Phase 2). Sticky 10% sample per session.
// Non-enrolled sessions do zero work beyond a boot-time coin-flip.
import('@/perf/telemetry').then((m) => m.installVideoPerfTelemetry()).catch(() => {});


const root = createRoot(container);

// Render without StrictMode for better performance
root.render(<App />);

// Register media segment cache service worker (non-fatal if it fails)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/media-cache-sw.js').catch(() => {
      // Caching is an optimization; app works without it
    });
  });
}
