
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/superellipse.css'
import './styles/theme.css'
import { initializePerformanceMonitoring } from './utils/performanceInit'
import { initWebVitals, sendToAnalytics, initPerformanceObserver } from './analytics/webVitals'
import './utils/echoDocNavHeight'
import eruda from 'eruda'
// Chunk recovery moved to index.html for earlier error handling

// Initialize mobile console for debugging on physical devices
// Access via ?debug=true in URL or automatically in dev mode
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true' || import.meta.env.DEV) {
  eruda.init();
  console.log('📱 Mobile console enabled - tap the icon in bottom-right corner');
}

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
