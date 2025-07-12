import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  isSlowConnection: boolean;
  saveData: boolean;
  deviceMemory: number;
  effectiveType: string;
}

/**
 * Hook for detecting performance constraints and optimizing accordingly
 */
export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isSlowConnection: false,
    saveData: false,
    deviceMemory: 4, // Default assumption
    effectiveType: '4g',
  });

  useEffect(() => {
    // Check for network information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateMetrics = () => {
        setMetrics({
          isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
          saveData: connection.saveData || false,
          deviceMemory: (navigator as any).deviceMemory || 4,
          effectiveType: connection.effectiveType || '4g',
        });
      };

      updateMetrics();
      connection.addEventListener('change', updateMetrics);

      return () => {
        connection.removeEventListener('change', updateMetrics);
      };
    }
  }, []);

  // Get optimal image quality based on connection and device
  const getOptimalImageQuality = useCallback(() => {
    if (metrics.saveData || metrics.isSlowConnection) return 60;
    if (metrics.deviceMemory < 2) return 70;
    if (metrics.effectiveType === '3g') return 75;
    return 85;
  }, [metrics]);

  // Get optimal video settings
  const getOptimalVideoSettings = useCallback(() => {
    return {
      preload: metrics.isSlowConnection || metrics.saveData ? 'none' : 'metadata',
      quality: metrics.isSlowConnection ? 'low' : metrics.effectiveType === '3g' ? 'medium' : 'high',
      autoPlay: !metrics.isSlowConnection && !metrics.saveData,
    };
  }, [metrics]);

  // Should reduce animations
  const shouldReduceAnimations = useCallback(() => {
    return metrics.isSlowConnection || metrics.deviceMemory < 2;
  }, [metrics]);

  // Should use aggressive lazy loading
  const shouldUseAggressiveLazyLoading = useCallback(() => {
    return metrics.isSlowConnection || metrics.saveData || metrics.deviceMemory < 4;
  }, [metrics]);

  return {
    metrics,
    getOptimalImageQuality,
    getOptimalVideoSettings,
    shouldReduceAnimations,
    shouldUseAggressiveLazyLoading,
  };
};

/**
 * Hook for measuring and reporting Core Web Vitals
 */
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }>({});

  useEffect(() => {
    // Report Web Vitals using the web-vitals library approach
    const reportVital = (name: string, value: number) => {
      setVitals(prev => ({ ...prev, [name]: value }));
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vital] ${name}: ${value}`);
      }
    };

    // Largest Contentful Paint
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        reportVital('lcp', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    };

    // First Contentful Paint
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          reportVital('fcp', fcpEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    };

    // Cumulative Layout Shift
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            reportVital('cls', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    };

    // Time to First Byte
    const measureTTFB = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        reportVital('ttfb', ttfb);
      }
    };

  // First Input Delay
  const observeFID = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0] as PerformanceEventTiming;
      if (firstInput && firstInput.processingStart) {
        const fid = firstInput.processingStart - firstInput.startTime;
        reportVital('fid', fid);
      }
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      // Fallback for browsers that don't support first-input
      console.warn('First Input Delay measurement not supported');
    }
  };

    try {
      observeLCP();
      observeFCP();
      observeCLS();
      measureTTFB();
      observeFID();
    } catch (error) {
      console.warn('Web Vitals measurement failed:', error);
    }
  }, []);

  return vitals;
};

/**
 * Hook for implementing progressive image loading
 */
export const useProgressiveImage = (src: string, placeholder?: string) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    
    img.src = src;
  }, [src]);

  return { src: currentSrc, loading, error };
};