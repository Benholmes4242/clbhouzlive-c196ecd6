// Boot Timeline: Import for side effects (attaches to window)
import './utils/bootTimeline';
// Discover Timing: Import for side effects (attaches to window)
import './utils/discoverTimeline';
// Log app start immediately
import { logAppStart } from './utils/bootTimeline';
logAppStart();

// Cold start manifest warming - prefetch first video manifest ASAP
import { ManifestWarmer } from './utils/video/ManifestWarmer';
ManifestWarmer.warmOnStartup();

// Fix 4: Eagerly load HLS.js so it's ready when first video needs it
import('hls.js').catch(() => {});

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/superellipse.css'
import './styles/theme.css'
import './styles/theme-tokens.css'

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

const root = createRoot(container);

// Render without StrictMode for better performance
root.render(<App />);
