// Initialize performance monitoring and optimizations for the entire app
import { initPerformanceObserver, analyzeBundleSize, monitorMemoryUsage } from './performanceEnhancements';

// Performance initialization function to be called on app startup
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Start performance observers
  initPerformanceObserver();

  // Log initial bundle analysis after a short delay
  setTimeout(() => {
    analyzeBundleSize();
    monitorMemoryUsage();
  }, 2000);

  // Monitor memory usage periodically
  setInterval(() => {
    monitorMemoryUsage();
  }, 60000); // Every minute

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

  // Check budget on page load and periodically
  window.addEventListener('load', checkPerformanceBudget);
  setInterval(checkPerformanceBudget, 5 * 60 * 1000); // Every 5 minutes
};

// Cleanup function for when app unmounts
export const cleanupPerformanceMonitoring = () => {
  // Clean up any performance observers or intervals if needed
  console.log('🧹 Performance monitoring cleanup');
};