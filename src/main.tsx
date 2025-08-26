
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/superellipse.css'
import { initializePerformanceMonitoring } from './utils/performanceInit'
import './utils/globalPerformanceOptimizations'

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Initialize minimal performance monitoring
initializePerformanceMonitoring();

const root = createRoot(container);

// Ultra-fast rendering with minimal overhead
root.render(<App />);
