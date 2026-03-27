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

import { initializePerformanceMonitoring } from './utils/performanceInit'
import { initWebVitals, sendToAnalytics, initPerformanceObserver } from './analytics/webVitals'
import './utils/echoDocNavHeight'
// Capacitor plugin verification removed - using Median.co bridge instead
// Chunk recovery moved to index.html for earlier error handling

// Deploy cache-buster: detect new builds and force fresh assets
declare const __BUILD_TIMESTAMP__: string;
const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '0';

try {
  const prevVersion = localStorage.getItem('clbhouz_build_version');
  if (prevVersion && prevVersion !== BUILD_VERSION) {
    console.log('[CacheBust] New build detected, clearing caches...');
    localStorage.setItem('clbhouz_build_version', BUILD_VERSION);
    // Clear all caches and force reload
    (async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload();
    })();
  } else {
    localStorage.setItem('clbhouz_build_version', BUILD_VERSION);
  }
} catch {}

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
