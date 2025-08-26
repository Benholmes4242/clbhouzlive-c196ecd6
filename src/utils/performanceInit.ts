// Initialize performance monitoring and optimizations for the entire app
import { initPerformanceObserver, analyzeBundleSize, monitorMemoryUsage } from './performanceEnhancements';

// Performance initialization function to be called on app startup
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Start performance observers with reduced frequency
  initPerformanceObserver();

  // Log initial bundle analysis after app loads
  setTimeout(() => {
    analyzeBundleSize();
    monitorMemoryUsage();
  }, 1000);

  // Monitor memory usage less frequently to reduce overhead
  setInterval(() => {
    monitorMemoryUsage();
  }, 300000); // Every 5 minutes instead of 1 minute

  // Set up performance budget warnings
  const performanceBudget = {
    maxJSSize: 2 * 1024 * 1024, // 2MB
    maxLoadTime: 3000, // 3 seconds
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  };

  // Check performance budget
  const checkPerformanceBudget = () => {
    const analysis = analyzeBundleSize();
    const memory = monitorMemoryUsage();

    if (analysis) {
      if (analysis.totalJSSize > performanceBudget.maxJSSize) {
        console.warn(`⚠️ JS Bundle exceeds budget: ${(analysis.totalJSSize / 1024 / 1024).toFixed(2)}MB`);
      }
      if (analysis.loadTime > performanceBudget.maxLoadTime) {
        console.warn(`⚠️ Load time exceeds budget: ${analysis.loadTime}ms`);
      }
    }

    if (memory && memory.used > performanceBudget.maxMemoryUsage) {
      console.warn(`⚠️ Memory usage exceeds budget: ${(memory.used / 1024 / 1024).toFixed(2)}MB`);
    }
  };

  // Check budget on page load only to reduce overhead
  window.addEventListener('load', checkPerformanceBudget);
};

// Cleanup function for when app unmounts
export const cleanupPerformanceMonitoring = () => {
  // Clean up any performance observers or intervals if needed
  console.log('🧹 Performance monitoring cleanup');
};