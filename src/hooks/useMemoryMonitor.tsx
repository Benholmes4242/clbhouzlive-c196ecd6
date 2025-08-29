import { useEffect, useRef } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const useMemoryMonitor = (componentName: string, enabled: boolean = true) => {
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current += 1;
    
    // Check memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory as MemoryInfo;
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
        
        // Warn if memory usage is high (over 100MB)
        if (memoryUsageMB > 100) {
          console.warn(`🚨 ${componentName}: High memory usage ${memoryUsageMB.toFixed(2)}MB (renders: ${renderCount.current})`);
        }
        
        // Log memory info in development
        if (process.env.NODE_ENV === 'development' && renderCount.current % 10 === 0) {
          console.log(`📊 ${componentName}: ${memoryUsageMB.toFixed(2)}MB used, ${renderCount.current} renders`);
        }
      }
    };
    
    // Check memory after a short delay to allow for component to settle
    const timeoutId = setTimeout(checkMemory, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  });
  
  useEffect(() => {
    if (!enabled) return;
    
    // Component cleanup logging
    return () => {
      const lifespan = Date.now() - mountTime.current;
      console.log(`🧹 ${componentName} unmounted after ${lifespan}ms (${renderCount.current} renders)`);
    };
  }, [componentName, enabled]);
  
  return {
    renderCount: renderCount.current,
    getLifespan: () => Date.now() - mountTime.current
  };
};

// Global memory monitoring hook
export const useGlobalMemoryMonitor = (intervalMs: number = 30000) => {
  useEffect(() => {
    if (!('memory' in performance)) return;
    
    const checkGlobalMemory = () => {
      const memory = (performance as any).memory as MemoryInfo;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      
      if (usedMB > 150) {
        console.warn(`🚨 Global memory warning: ${usedMB.toFixed(2)}MB used of ${totalMB.toFixed(2)}MB total`);
      }
    };
    
    const interval = setInterval(checkGlobalMemory, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs]);
};