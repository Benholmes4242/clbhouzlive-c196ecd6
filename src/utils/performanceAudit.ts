/**
 * Performance Audit Utilities
 * Tools for measuring and monitoring media system performance
 * 
 * USAGE:
 * - Call startAudit() from browser console to begin monitoring
 * - Call endAudit() to get comprehensive results
 * - Use DevHud component for real-time monitoring
 */

import { MediaRuntime } from '@/media/runtime/MediaRuntime';

// ============ Types ============

interface VideoMetrics {
  id: string;
  ttff: number | null;
  isPlaying: boolean;
  isVisible: boolean;
  visibilityRatio: number;
  surface: string;
  hasError: boolean;
}

interface MemoryMetrics {
  videoElements: number;
  hlsInstances: number;
  registrySize: number;
  warmPoolSize: number;
  estimatedMemoryMB: number;
}

interface PerformanceMetrics {
  scrollFps: number;
  intersectionCallbackDuration: number[];
  evaluateCandidateDuration: number[];
  networkRequests: number;
  manifestLoads: number;
  segmentLoads: number;
}

interface AuditResults {
  timestamp: string;
  memory: MemoryMetrics;
  performance: PerformanceMetrics;
  videos: VideoMetrics[];
  ttffStats: {
    p50: number;
    p95: number;
    max: number;
    count: number;
  };
  recommendations: string[];
}

// ============ Memory Audit ============

export function measureMemory(): MemoryMetrics {
  const videoElements = document.querySelectorAll('video').length;
  
  // Count HLS.js instances by checking for __hlsPlayerRef
  let hlsInstances = 0;
  document.querySelectorAll('video').forEach((video) => {
    if ((video as any).__hlsPlayerRef?.isAttached?.()) {
      hlsInstances++;
    }
  });
  
  const runtimeDebug = MediaRuntime.getDebugInfo();
  
  // Estimate memory:
  // - Video element (idle): ~1-2MB
  // - Video element (playing with HLS): ~5-15MB
  // - HLS.js instance: ~2-5MB (includes buffers)
  const estimatedMemoryMB = 
    videoElements * 1.5 + // Base video elements
    hlsInstances * 5 + // HLS.js instances with buffers
    runtimeDebug.warmPoolSize * 3; // Warm pool videos
  
  return {
    videoElements,
    hlsInstances,
    registrySize: runtimeDebug.registrySize,
    warmPoolSize: runtimeDebug.warmPoolSize,
    estimatedMemoryMB: Math.round(estimatedMemoryMB),
  };
}

// ============ Performance Monitoring ============

let performanceData = {
  scrollFps: [] as number[],
  intersectionCallbacks: [] as number[],
  evaluateCandidates: [] as number[],
  networkRequests: 0,
  manifestLoads: 0,
  segmentLoads: 0,
};

let isMonitoring = false;
let lastFrameTime = 0;
let fpsInterval: number | null = null;
let scrollHandler: ((e: Event) => void) | null = null;

export function startPerformanceMonitoring(): void {
  if (isMonitoring) return;
  isMonitoring = true;
  
  // Reset data
  performanceData = {
    scrollFps: [],
    intersectionCallbacks: [],
    evaluateCandidates: [],
    networkRequests: 0,
    manifestLoads: 0,
    segmentLoads: 0,
  };
  
  // FPS monitoring during scroll
  const measureFps = (timestamp: number) => {
    if (!isMonitoring) return;
    
    if (lastFrameTime > 0) {
      const delta = timestamp - lastFrameTime;
      const fps = Math.round(1000 / delta);
      performanceData.scrollFps.push(fps);
    }
    lastFrameTime = timestamp;
    
    requestAnimationFrame(measureFps);
  };
  
  // Only measure during scroll
  let isScrolling = false;
  scrollHandler = () => {
    if (!isScrolling) {
      isScrolling = true;
      lastFrameTime = 0;
      requestAnimationFrame(measureFps);
    }
    
    clearTimeout(fpsInterval as number);
    fpsInterval = window.setTimeout(() => {
      isScrolling = false;
    }, 200);
  };
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  
  // Network monitoring
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;
        performanceData.networkRequests++;
        
        if (resourceEntry.name.includes('.m3u8')) {
          performanceData.manifestLoads++;
        } else if (resourceEntry.name.includes('.ts') || resourceEntry.name.includes('.m4s')) {
          performanceData.segmentLoads++;
        }
      }
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
}

export function stopPerformanceMonitoring(): PerformanceMetrics {
  isMonitoring = false;
  
  // Clean up scroll listener to prevent memory leak
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  
  // Calculate average FPS
  const avgFps = performanceData.scrollFps.length > 0
    ? Math.round(performanceData.scrollFps.reduce((a, b) => a + b, 0) / performanceData.scrollFps.length)
    : 60;
  
  return {
    scrollFps: avgFps,
    intersectionCallbackDuration: performanceData.intersectionCallbacks,
    evaluateCandidateDuration: performanceData.evaluateCandidates,
    networkRequests: performanceData.networkRequests,
    manifestLoads: performanceData.manifestLoads,
    segmentLoads: performanceData.segmentLoads,
  };
}

// ============ Video Metrics Collection ============

export function collectVideoMetrics(): VideoMetrics[] {
  const metrics: VideoMetrics[] = [];
  
  document.querySelectorAll('video').forEach((video) => {
    const mediaId = video.dataset.runtimeMediaId || video.dataset.mediaAutoplayId;
    if (!mediaId) return;
    
    const node = MediaRuntime.getNode(mediaId);
    
    metrics.push({
      id: mediaId.slice(0, 8),
      ttff: null, // Would need telemetry integration
      isPlaying: !video.paused,
      isVisible: node?.isVisible ?? false,
      visibilityRatio: node?.visibilityRatio ?? 0,
      surface: node?.surface ?? 'unknown',
      hasError: node?.errorState !== null,
    });
  });
  
  return metrics;
}

// ============ TTFF Statistics ============

const ttffMeasurements: number[] = [];

export function recordTTFF(ms: number): void {
  ttffMeasurements.push(ms);
}

export function getTTFFStats(): { p50: number; p95: number; max: number; count: number } {
  if (ttffMeasurements.length === 0) {
    return { p50: 0, p95: 0, max: 0, count: 0 };
  }
  
  const sorted = [...ttffMeasurements].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  
  return {
    p50: sorted[p50Index] ?? 0,
    p95: sorted[p95Index] ?? sorted[sorted.length - 1] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    count: sorted.length,
  };
}

// ============ Full Audit ============

export function runAudit(): AuditResults {
  const memory = measureMemory();
  const performance = stopPerformanceMonitoring();
  const videos = collectVideoMetrics();
  const ttffStats = getTTFFStats();
  
  // Generate recommendations based on findings
  const recommendations: string[] = [];
  
  // Memory recommendations
  if (memory.videoElements > 50) {
    recommendations.push(
      `HIGH: ${memory.videoElements} video elements in DOM. Consider implementing virtualization (react-window/react-virtuoso) to reduce memory footprint.`
    );
  }
  
  if (memory.hlsInstances > 10) {
    recommendations.push(
      `MEDIUM: ${memory.hlsInstances} active HLS instances. Consider reducing warm pool size or being more aggressive with detach.`
    );
  }
  
  if (memory.estimatedMemoryMB > 300) {
    recommendations.push(
      `HIGH: Estimated memory usage ${memory.estimatedMemoryMB}MB. Investigate memory leaks with Chrome DevTools heap snapshots.`
    );
  }
  
  // Performance recommendations
  if (performance.scrollFps < 55) {
    recommendations.push(
      `HIGH: Scroll FPS at ${performance.scrollFps}. Profile intersection observer callbacks and React re-renders.`
    );
  }
  
  if (performance.manifestLoads > videos.length * 2) {
    recommendations.push(
      `MEDIUM: ${performance.manifestLoads} manifest loads for ${videos.length} videos. Check for duplicate loads or excessive preloading.`
    );
  }
  
  // TTFF recommendations
  if (ttffStats.p95 > 2000) {
    recommendations.push(
      `HIGH: TTFF P95 at ${ttffStats.p95}ms (target: <1500ms). Consider reducing preload margin or optimizing HLS config.`
    );
  }
  
  // Video state recommendations
  const playingCount = videos.filter(v => v.isPlaying).length;
  if (playingCount > 3) {
    recommendations.push(
      `WARNING: ${playingCount} videos playing concurrently. MAX_CONCURRENT_GRID_VIDEOS (3) may not be enforced.`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ No major performance issues detected.');
  }
  
  return {
    timestamp: new Date().toISOString(),
    memory,
    performance,
    videos,
    ttffStats,
    recommendations,
  };
}

// ============ Console API ============

// Make available in browser console
if (typeof window !== 'undefined') {
  (window as any).mediaAudit = {
    start: startPerformanceMonitoring,
    stop: runAudit,
    memory: measureMemory,
    videos: collectVideoMetrics,
    ttff: getTTFFStats,
    runtime: () => MediaRuntime.getDebugInfo(),
    
    // Quick diagnostic
    diagnose: () => {
      const memory = measureMemory();
      const videos = collectVideoMetrics();
      const playing = videos.filter(v => v.isPlaying);
      
      console.log('=== Media System Diagnostic ===');
      console.log(`Video elements: ${memory.videoElements}`);
      console.log(`HLS instances: ${memory.hlsInstances}`);
      console.log(`Registry size: ${memory.registrySize}`);
      console.log(`Warm pool: ${memory.warmPoolSize}`);
      console.log(`Est. memory: ${memory.estimatedMemoryMB}MB`);
      console.log(`Playing: ${playing.length}/${videos.length}`);
      console.log('Playing IDs:', playing.map(v => v.id).join(', '));
      
      return { memory, videos, playing: playing.length };
    },
  };
}
