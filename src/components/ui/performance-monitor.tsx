import React, { useEffect, useState } from 'react';
import { useWebVitals } from '@/hooks/usePerformanceOptimization';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

/**
 * Development tool for monitoring Core Web Vitals and performance metrics
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showInProduction = false
}) => {
  const vitals = useWebVitals();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or when explicitly enabled in production
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    // Show monitor after a delay to avoid blocking initial render
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow || !isVisible) return null;

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };

  const getScoreColor = (metric: string, value: number | undefined) => {
    if (value === undefined) return 'text-gray-500';
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'text-green-500' : value <= 4000 ? 'text-yellow-500' : 'text-red-500';
      case 'fid':
        return value <= 100 ? 'text-green-500' : value <= 300 ? 'text-yellow-500' : 'text-red-500';
      case 'cls':
        return value <= 0.1 ? 'text-green-500' : value <= 0.25 ? 'text-yellow-500' : 'text-red-500';
      case 'fcp':
        return value <= 1800 ? 'text-green-500' : value <= 3000 ? 'text-yellow-500' : 'text-red-500';
      case 'ttfb':
        return value <= 800 ? 'text-green-500' : value <= 1800 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
      <div className="font-bold mb-2 text-center">Performance Monitor</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getScoreColor('lcp', vitals.lcp)}>
            {formatMetric(vitals.lcp)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={getScoreColor('fid', vitals.fid)}>
            {formatMetric(vitals.fid)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getScoreColor('cls', vitals.cls)}>
            {formatMetric(vitals.cls, '')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getScoreColor('fcp', vitals.fcp)}>
            {formatMetric(vitals.fcp)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getScoreColor('ttfb', vitals.ttfb)}>
            {formatMetric(vitals.ttfb)}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-600 text-center">
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          Hide
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;