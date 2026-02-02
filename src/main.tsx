// Boot Timeline: Import for side effects (attaches to window)
import './utils/bootTimeline';
// Discover Timing: Import for side effects (attaches to window)
import './utils/discoverTimeline';
// Log app start immediately
import { logAppStart } from './utils/bootTimeline';
logAppStart();

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/superellipse.css'
import './styles/theme.css'
import './styles/theme-tokens.css'
import '@/features/hub/home/hubTheme.css'
import { initializePerformanceMonitoring } from './utils/performanceInit'
import { initWebVitals, sendToAnalytics, initPerformanceObserver } from './analytics/webVitals'
import './utils/echoDocNavHeight'
// Capacitor plugin verification (dev only)
import './utils/capacitor/verifyCapacitorPlugins'
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
