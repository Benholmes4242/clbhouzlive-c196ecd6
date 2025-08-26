// Minimal performance monitoring for ultra-fast performance
import { cleanupPerformanceOverhead } from './ultraPerformance';

let performanceCleanupInterval: number;

// Ultra-minimal performance initialization
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Only essential monitoring
  setTimeout(() => {
    if (window.performance?.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation?.loadEventEnd > 3000) {
        console.warn(`⚠️ Page load time: ${navigation.loadEventEnd}ms`);
      }
    }
  }, 1000);

  // Minimal memory monitoring
  performanceCleanupInterval = window.setInterval(() => {
    cleanupPerformanceOverhead();
    
    // Check memory only if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > 150 * 1024 * 1024) { // 150MB threshold
        console.warn(`⚠️ High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }, 120000); // Every 2 minutes
};

// Cleanup function
export const cleanupPerformanceMonitoring = () => {
  if (performanceCleanupInterval) {
    clearInterval(performanceCleanupInterval);
  }
  console.log('🧹 Performance monitoring cleanup');
};