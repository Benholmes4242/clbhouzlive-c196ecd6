import React from 'react';

// Advanced performance utilities for React applications

// Lazy component loading with error boundaries
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef((props, ref) => (
    React.createElement(React.Suspense, {
      fallback: fallback ? React.createElement(fallback) : React.createElement('div', {
        className: "flex items-center justify-center p-8"
      }, React.createElement('div', {
        className: "w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground/70 rounded-full animate-spin"
      }))
    }, React.createElement(LazyComponent, { ...props, ref }))
  ));
};

// Component preloading for route prefetching
export const preloadComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  const componentImport = importFn();
  componentImport.catch(() => {}); // Silently handle preload failures
  return componentImport;
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const totalJSSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    console.group('📦 Bundle Analysis');
    console.log(`📊 Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
    console.log(`⏱️ Load Time: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
    console.log(`🔗 Resources Loaded: ${resources.length}`);
    console.groupEnd();
    
    return {
      totalJSSize,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      resourceCount: resources.length,
    };
  }
  return null;
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && (performance as any).memory) {
    const memory = (performance as any).memory;
    
    console.group('🧠 Memory Usage');
    console.log(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    console.groupEnd();
    
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Performance observer for monitoring paint and layout
export const initPerformanceObserver = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Monitor paint events
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`⚠️ Long Task: ${entry.duration.toFixed(2)}ms`);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }
};

// React DevTools profiler helper
export const withProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => 
    React.createElement(React.Profiler, {
      id: componentName,
      onRender: (id: string, phase: string, actualDuration: number) => {
        if (actualDuration > 16) { // More than one frame
          console.warn(`🐌 ${id} (${phase}): ${actualDuration.toFixed(2)}ms`);
        }
      }
    }, React.createElement(Component, props as any))
  );
};

// Auto-cleanup for event listeners and subscriptions
export const createAutoCleanup = () => {
  const cleanupFunctions: (() => void)[] = [];
  
  const addCleanup = (fn: () => void) => {
    cleanupFunctions.push(fn);
  };
  
  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.length = 0;
  };
  
  return { addCleanup, cleanup };
};