// Web Vitals collection for performance monitoring
import { AppLog } from '@/lib/logger';

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

// Disable web vitals logging entirely for cleaner console
const WEB_VITALS_ENABLED = false;

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

// Basic analytics sender (disabled for now)
export const sendToAnalytics = (name: string, value: number, metric: WebVitalsMetric) => {
  if (!WEB_VITALS_ENABLED) return;
  
  AppLog.debug('WebVitals', name, {
    value: Math.round(value),
    rating: getRating(name, value),
    ...metric,
  });
};

// Get performance rating based on web vitals thresholds
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    INP: [200, 500],
    TTFB: [800, 1800],
  };
  
  const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, 0];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

// Performance observer (disabled for cleaner console)
export const initPerformanceObserver = () => {
  // Disabled to reduce console noise
  return;
};
