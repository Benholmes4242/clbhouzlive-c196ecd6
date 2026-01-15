/**
 * Phase 4 Perf: Performance Dashboard Component
 * Displays real-time performance metrics for development/debugging
 * 
 * Enable with: <PerformanceDashboard enabled={true} />
 */

import React, { useEffect, useState, useCallback, memo } from 'react';

interface PerformanceMetrics {
  // Memory
  jsHeapSize: number | null;
  jsHeapLimit: number | null;
  
  // Core Web Vitals
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  
  // Custom metrics
  domNodes: number;
  fps: number;
}

interface PerformanceDashboardProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({ 
  enabled = false,
  position = 'bottom-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    jsHeapSize: null,
    jsHeapLimit: null,
    lcp: null,
    inp: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domNodes: 0,
    fps: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Collect metrics
  const collectMetrics = useCallback(() => {
    const newMetrics: Partial<PerformanceMetrics> = {};

    // Memory (Chrome only)
    const memory = (performance as any).memory;
    if (memory) {
      newMetrics.jsHeapSize = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      newMetrics.jsHeapLimit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    }

    // DOM node count
    newMetrics.domNodes = document.querySelectorAll('*').length;

    setMetrics(prev => ({ ...prev, ...newMetrics }));
  }, []);

  // FPS counter
  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const countFrame = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(countFrame);
    };

    animationId = requestAnimationFrame(countFrame);
    
    return () => cancelAnimationFrame(animationId);
  }, [enabled]);

  // Collect Web Vitals
  useEffect(() => {
    if (!enabled) return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
      onLCP(({ value }) => setMetrics(prev => ({ ...prev, lcp: Math.round(value) })));
      onINP(({ value }) => setMetrics(prev => ({ ...prev, inp: Math.round(value) })));
      onCLS(({ value }) => setMetrics(prev => ({ ...prev, cls: Math.round(value * 1000) / 1000 })));
      onFCP(({ value }) => setMetrics(prev => ({ ...prev, fcp: Math.round(value) })));
      onTTFB(({ value }) => setMetrics(prev => ({ ...prev, ttfb: Math.round(value) })));
    }).catch(() => {
      // Web vitals not available
    });
  }, [enabled]);

  // Periodic metrics collection
  useEffect(() => {
    if (!enabled) return;
    
    collectMetrics();
    const interval = setInterval(collectMetrics, 2000);
    
    return () => clearInterval(interval);
  }, [enabled, collectMetrics]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getRating = (metric: string, value: number | null): 'good' | 'needs-improvement' | 'poor' => {
    if (value === null) return 'good';
    
    const thresholds: Record<string, [number, number]> = {
      lcp: [2500, 4000],
      inp: [200, 500],
      cls: [0.1, 0.25],
      fcp: [1800, 3000],
      ttfb: [800, 1800],
      fps: [55, 30], // Reversed: higher is better
      jsHeapSize: [100, 150],
      domNodes: [1500, 3000],
    };

    const [good, poor] = thresholds[metric] || [0, 0];
    
    if (metric === 'fps') {
      if (value >= good) return 'good';
      if (value >= poor) return 'needs-improvement';
      return 'poor';
    }
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  };

  const ratingColors = {
    good: 'text-green-400',
    'needs-improvement': 'text-yellow-400',
    poor: 'text-red-400',
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-[9999] font-mono text-xs`}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="bg-black/90 text-white rounded-lg shadow-lg overflow-hidden"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <span className="font-semibold">⚡ Perf</span>
          <div className="flex items-center gap-2">
            <span className={ratingColors[getRating('fps', metrics.fps)]}>
              {metrics.fps} fps
            </span>
            <span className={ratingColors[getRating('jsHeapSize', metrics.jsHeapSize)]}>
              {metrics.jsHeapSize ?? '?'}MB
            </span>
          </div>
        </button>

        {/* Expanded metrics */}
        {isExpanded && (
          <div className="px-3 py-2 border-t border-white/10 space-y-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {/* Core Web Vitals */}
              <div className="text-white/60">LCP:</div>
              <div className={ratingColors[getRating('lcp', metrics.lcp)]}>
                {metrics.lcp ?? '...'}ms
              </div>
              
              <div className="text-white/60">INP:</div>
              <div className={ratingColors[getRating('inp', metrics.inp)]}>
                {metrics.inp ?? '...'}ms
              </div>
              
              <div className="text-white/60">CLS:</div>
              <div className={ratingColors[getRating('cls', metrics.cls)]}>
                {metrics.cls ?? '...'}
              </div>
              
              <div className="text-white/60">FCP:</div>
              <div className={ratingColors[getRating('fcp', metrics.fcp)]}>
                {metrics.fcp ?? '...'}ms
              </div>
              
              <div className="text-white/60">TTFB:</div>
              <div className={ratingColors[getRating('ttfb', metrics.ttfb)]}>
                {metrics.ttfb ?? '...'}ms
              </div>

              {/* Additional metrics */}
              <div className="text-white/60">DOM Nodes:</div>
              <div className={ratingColors[getRating('domNodes', metrics.domNodes)]}>
                {metrics.domNodes}
              </div>
              
              <div className="text-white/60">Heap:</div>
              <div className={ratingColors[getRating('jsHeapSize', metrics.jsHeapSize)]}>
                {metrics.jsHeapSize ?? '?'}/{metrics.jsHeapLimit ?? '?'}MB
              </div>
            </div>
            
            {/* Thresholds guide */}
            <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40">
              <div>Good: LCP&lt;2.5s INP&lt;200ms CLS&lt;0.1</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;
