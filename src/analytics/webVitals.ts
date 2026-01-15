// Web Vitals collection for performance monitoring
import { AppLog } from '@/lib/logger';

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

// Enable Web Vitals collection for performance monitoring
const WEB_VITALS_ENABLED = true;

export const initWebVitals = (sendMetric: (name: string, value: number, metric: WebVitalsMetric) => void) => {
  if (!WEB_VITALS_ENABLED) return;
  
  // Lazy-load to avoid blank-screen on early failure
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onINP, onTTFB }) => {
    onCLS((metric) => {
      sendMetric('CLS', metric.value, metric);
    });
    
    onFCP((metric) => {
      sendMetric('FCP', metric.value, metric);
    });
    
    onLCP((metric) => {
      sendMetric('LCP', metric.value, metric);
    });
    
    onINP((metric) => {
      sendMetric('INP', metric.value, metric);
    });
    
    onTTFB((metric) => {
      sendMetric('TTFB', metric.value, metric);
    });
  }).catch(() => {
    // no-op: metrics collection is non-critical
  });
};

// Analytics sender - logs to console in dev, can be extended for production analytics
export const sendToAnalytics = (name: string, value: number, metric: WebVitalsMetric) => {
  if (!WEB_VITALS_ENABLED) return;
  
  const rating = getRating(name, value);
  
  // Log with structured data
  AppLog.debug('WebVitals', name, {
    value: Math.round(value),
    rating,
    id: metric.id,
    navigationType: metric.navigationType,
  });
  
  // Performance mark for User Timing API
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`webvital-${name}`, {
      detail: { value, rating },
    });
  }
  
  // TODO: Send to analytics backend in production
  // Example: sendToPostHog('web_vital', { metric: name, value, rating });
};

// Get performance rating based on web vitals thresholds
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    INP: [200, 500],
    TTFB: [800, 1800],
  };
  
  const [good, poor] = thresholds[name] || [0, 0];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

// Performance observer for custom metrics and milestones
export const initPerformanceObserver = () => {
  if (!WEB_VITALS_ENABLED) return;
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    // Observe long tasks (blocking main thread)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          AppLog.debug('LongTask', 'detected', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });
        }
      }
    });
    
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    
    // Observe resource loading performance
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        // Only log slow resources (>500ms)
        if (resourceEntry.duration > 500) {
          AppLog.debug('SlowResource', resourceEntry.name, {
            duration: Math.round(resourceEntry.duration),
            type: resourceEntry.initiatorType,
          });
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch {
    // PerformanceObserver not fully supported
  }
};

// Performance marks for custom milestones
export const markPerformance = (name: string, detail?: Record<string, unknown>) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`app-${name}`, { detail });
  }
};

// Measure between two marks
export const measurePerformance = (name: string, startMark: string, endMark?: string) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      const measure = performance.measure(
        `app-${name}`,
        `app-${startMark}`,
        endMark ? `app-${endMark}` : undefined
      );
      AppLog.debug('Measure', name, { duration: Math.round(measure.duration) });
      return measure.duration;
    } catch {
      return null;
    }
  }
  return null;
};
