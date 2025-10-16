import { useEffect, useRef } from 'react';

/**
 * Performance monitoring hook for component lifecycle tracking
 * 
 * Logs:
 * - Component mount time
 * - Time to first RAF (paint)
 * - Optional custom markers
 */
export function usePerfMonitor(componentName: string, metadata?: Record<string, any>) {
  const mountTimeRef = useRef<number>(0);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    const mountMark = `${componentName}:mount`;
    const rafMark = `${componentName}:raf`;
    const measureName = `${componentName}:mount→raf`;
    
    mountTimeRef.current = performance.now();
    performance.mark(mountMark);

    // Schedule RAF to measure time to first paint
    requestAnimationFrame(() => {
      const rafTime = performance.now();
      performance.mark(rafMark);
      
      try {
        performance.measure(measureName, mountMark, rafMark);
        const measure = performance.getEntriesByName(measureName)[0];
        
        // eslint-disable-next-line no-console
        console.debug('[perf]', {
          component: componentName,
          'mount→raf': `${measure.duration.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          ...metadata
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[perf] measure failed:', componentName, e);
      }
    });

    return () => {
      // Cleanup marks
      try {
        performance.clearMarks(mountMark);
        performance.clearMarks(rafMark);
        performance.clearMeasures(measureName);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [componentName]);
}

/**
 * Image/thumbnail load tracking
 */
export function trackImageLoad(src: string, context: string) {
  const t0 = performance.now();
  
  return {
    onLoad: () => {
      const duration = performance.now() - t0;
      // eslint-disable-next-line no-console
      console.debug('[perf] image loaded', {
        context,
        src: src.substring(0, 80),
        duration: `${duration.toFixed(2)}ms`
      });
    },
    onError: () => {
      // eslint-disable-next-line no-console
      console.warn('[perf] image failed', {
        context,
        src: src.substring(0, 80)
      });
    }
  };
}

/**
 * Video readiness tracking
 */
export function trackVideoReadiness(videoElement: HTMLVideoElement, id: string) {
  const handlers = {
    loadstart: () => console.debug('[perf] video:loadstart', id),
    loadedmetadata: () => console.debug('[perf] video:loadedmetadata', id),
    loadeddata: () => console.debug('[perf] video:loadeddata', id),
    canplay: () => console.debug('[perf] video:canplay', id),
    canplaythrough: () => console.debug('[perf] video:canplaythrough', id),
  };

  Object.entries(handlers).forEach(([event, handler]) => {
    videoElement.addEventListener(event, handler, { once: true });
  });

  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      videoElement.removeEventListener(event, handler);
    });
  };
}

/**
 * Network request timing tracker
 */
export function logNetworkTiming(url: string, context: string) {
  try {
    // Wait a bit for the resource to be recorded
    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const entry = resources.find(r => r.name.includes(url.substring(0, 50)));
      
      if (entry) {
        // eslint-disable-next-line no-console
        console.debug('[perf] network', {
          context,
          url: url.substring(0, 80),
          dns: `${entry.domainLookupEnd - entry.domainLookupStart}ms`,
          tcp: `${entry.connectEnd - entry.connectStart}ms`,
          ttfb: `${entry.responseStart - entry.requestStart}ms`,
          download: `${entry.responseEnd - entry.responseStart}ms`,
          total: `${entry.responseEnd - entry.startTime}ms`,
          size: entry.transferSize,
          cached: entry.transferSize === 0
        });
      }
    }, 100);
  } catch (e) {
    // Ignore timing API errors
  }
}
