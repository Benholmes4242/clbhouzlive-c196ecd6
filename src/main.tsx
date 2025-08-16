
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/superellipse.css'
import { initializePerformanceMonitoring } from './utils/performanceInit'

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Initialize performance monitoring
initializePerformanceMonitoring();

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
