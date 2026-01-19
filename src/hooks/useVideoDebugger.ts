/**
 * Video Debug Instrumentation
 * 
 * Tracks the full lifecycle of video loading from query to render.
 * Enable via console: enableVideoDebug()
 */

// ============ Types ============

interface VideoDebugEntry {
  videoId: string;
  postId?: string;
  startTime: number;
  stages: Array<{
    stage: string;
    timestamp: number;
    elapsed: number;
    data?: any;
  }>;
}

type DebugCategory = 'FETCH' | 'PREFETCH' | 'RENDER' | 'HLS' | 'PLAYBACK' | 'ERROR' | 'CACHE';

// ============ State ============

let debugEnabled = typeof window !== 'undefined' 
  ? localStorage.getItem('videoDebugEnabled') === 'true' 
  : false;

const entries = new Map<string, VideoDebugEntry>();
const logs: Array<{ category: DebugCategory; message: string; data?: any; timestamp: number }> = [];

// ============ Core Functions ============

export function debugLog(category: DebugCategory, message: string, data?: any) {
  if (!debugEnabled) return;
  
  const timestamp = performance.now();
  const logEntry = { category, message, data, timestamp };
  logs.push(logEntry);
  
  // Keep only last 500 logs
  if (logs.length > 500) logs.shift();
  
  const prefix = `[VideoDebug:${category}]`;
  const timeStr = `+${timestamp.toFixed(0)}ms`;
  
  if (data !== undefined) {
    console.log(`${prefix} ${timeStr} ${message}`, data);
  } else {
    console.log(`${prefix} ${timeStr} ${message}`);
  }
}

export const videoDebugger = {
  startTracking(videoId: string, postId?: string) {
    if (!debugEnabled) return;
    
    const shortId = videoId.slice(0, 12);
    if (entries.has(shortId)) return;
    
    entries.set(shortId, {
      videoId: shortId,
      postId,
      startTime: performance.now(),
      stages: [],
    });
    
    debugLog('PREFETCH', `Started tracking video ${shortId}`, { postId });
  },
  
  logStage(videoId: string, stage: string, data?: any) {
    if (!debugEnabled) return;
    
    const shortId = videoId.slice(0, 12);
    const entry = entries.get(shortId);
    if (!entry) {
      // Auto-start tracking if not exists
      this.startTracking(videoId);
      return this.logStage(videoId, stage, data);
    }
    
    const now = performance.now();
    entry.stages.push({
      stage,
      timestamp: now,
      elapsed: now - entry.startTime,
      data,
    });
    
    debugLog('HLS', `[${shortId}] ${stage}`, {
      elapsed: `${(now - entry.startTime).toFixed(0)}ms`,
      ...data,
    });
  },
  
  getEntry(videoId: string): VideoDebugEntry | undefined {
    return entries.get(videoId.slice(0, 12));
  },
  
  getEntries(): Map<string, VideoDebugEntry> {
    return entries;
  },
  
  clear() {
    entries.clear();
    logs.length = 0;
    console.log('[VideoDebug] Cleared all entries and logs');
  },
  
  getReport() {
    const report: any = {
      enabled: debugEnabled,
      trackedVideos: entries.size,
      logCount: logs.length,
      videos: {},
      recentLogs: logs.slice(-50),
    };
    
    entries.forEach((entry, id) => {
      const lastStage = entry.stages[entry.stages.length - 1];
      report.videos[id] = {
        postId: entry.postId,
        stageCount: entry.stages.length,
        totalTime: lastStage ? `${lastStage.elapsed.toFixed(0)}ms` : 'in progress',
        stages: entry.stages.map(s => `${s.stage} (+${s.elapsed.toFixed(0)}ms)`),
      };
    });
    
    return report;
  },
};

// ============ HLS URL Cache Stats ============

export function getHlsUrlCacheStats() {
  // This will be populated by useHlsUrlCache
  return (window as any).__hlsUrlCacheStats?.() ?? { message: 'Cache stats not available' };
}

// ============ Global Console Commands ============

if (typeof window !== 'undefined') {
  (window as any).enableVideoDebug = () => {
    debugEnabled = true;
    localStorage.setItem('videoDebugEnabled', 'true');
    console.log('[VideoDebug] ✅ Debugging enabled. Refresh to start fresh tracking.');
    return 'Video debugging enabled';
  };
  
  (window as any).disableVideoDebug = () => {
    debugEnabled = false;
    localStorage.removeItem('videoDebugEnabled');
    console.log('[VideoDebug] ❌ Debugging disabled');
    return 'Video debugging disabled';
  };
  
  (window as any).videoDebugReport = () => {
    const report = videoDebugger.getReport();
    console.log('[VideoDebug] Full Report:', report);
    console.table(Object.entries(report.videos).map(([id, data]: [string, any]) => ({
      videoId: id,
      ...data,
      stages: data.stages.join(' → '),
    })));
    return report;
  };
  
  (window as any).getHlsUrlCacheStats = getHlsUrlCacheStats;
  
  (window as any).videoDebugger = videoDebugger;
}

export function isVideoDebugEnabled() {
  return debugEnabled;
}
