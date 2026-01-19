// Minimal performance monitoring for ultra-fast performance

let performanceCleanupInterval: number;

// Ultra-minimal performance initialization
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Minimal memory monitoring
  performanceCleanupInterval = window.setInterval(() => {
    // Basic cleanup
    if (window.gc) {
      window.gc();
    }
  }, 120000); // Every 2 minutes
};

// Cleanup function
export const cleanupPerformanceMonitoring = () => {
  if (performanceCleanupInterval) {
    clearInterval(performanceCleanupInterval);
  }
};
