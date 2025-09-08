// Minimal performance monitoring for ultra-fast performance

let performanceCleanupInterval: number;

// Ultra-minimal performance initialization
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Only essential monitoring with improved thresholds
  setTimeout(() => {
    if (window.performance?.getEntriesByType) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation?.loadEventEnd > 5000) { // Increased threshold to 5s
        console.warn(`⚠️ Page load time: ${navigation.loadEventEnd}ms`);
        
        // Log specific performance metrics for debugging
        console.log('Performance breakdown:', {
          domContentLoaded: navigation.domContentLoadedEventEnd,
          loadComplete: navigation.loadEventEnd,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 'N/A'
        });
      }
    }
  }, 2000); // Increased delay to 2s for more accurate measurement

  // Minimal memory monitoring
  performanceCleanupInterval = window.setInterval(() => {
    // Basic cleanup
    if (window.gc) {
      window.gc();
    }
    
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