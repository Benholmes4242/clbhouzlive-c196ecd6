// Web Vitals collection for performance monitoring
import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals';

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

export const initWebVitals = (sendMetric: (name: string, value: number, metric: WebVitalsMetric) => void) => {
  onCLS((metric) => {
    sendMetric('CLS', metric.value, metric);
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
};

// Basic analytics sender (can be enhanced with your analytics provider)
export const sendToAnalytics = (name: string, value: number, metric: WebVitalsMetric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      value: Math.round(value),
      rating: getRating(name, value),
      ...metric,
    });
  }
  
  // Send to your analytics service here
  // Example: analytics.track('web_vital', { name, value, ...metric });
};

// Get performance rating based on web vitals thresholds
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    CLS: [0.1, 0.25],
    LCP: [2500, 4000],
    INP: [200, 500],
    TTFB: [800, 1800],
  };
  
  const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, 0];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

// Performance observer for additional metrics
export const initPerformanceObserver = () => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }
  
  try {
    // Observe navigation timing
    const navObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('[Performance] Navigation timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            totalPageLoad: navEntry.loadEventEnd - navEntry.fetchStart,
          });
        }
      });
    });
    
    navObserver.observe({ entryTypes: ['navigation'] });
    
    // Observe resource timing for large resources
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        // Log slow resources (>1s load time)
        if (resource.duration > 1000) {
          console.warn('[Performance] Slow resource:', {
            name: resource.name,
            duration: Math.round(resource.duration),
            size: resource.transferSize,
          });
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    
  } catch (error) {
    console.warn('Performance Observer not supported:', error);
  }
};