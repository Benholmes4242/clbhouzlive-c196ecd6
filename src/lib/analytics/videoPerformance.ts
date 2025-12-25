/**
 * Video Performance RUM (Real User Monitoring)
 * 
 * Tracks video performance metrics in production:
 * - TTFF (Time to First Frame) - Target <500ms
 * - Startup failures - Target <1%
 * - Rebuffering events - Target <0.5 per session
 * - Quality metrics - bitrate, resolution, switches
 */

import { track } from '@/lib/telemetry';

// ============ Types ============

interface VideoSession {
  id: string;
  surface: string;
  src: string;
  startTime: number;
  ttff: number | null;
  firstFrameTime: number | null;
  firstPlayTime: number | null;
  rebufferCount: number;
  rebufferDuration: number;
  qualitySwitches: number;
  initialBitrate: number | null;
  finalBitrate: number | null;
  error: string | null;
  deviceType: 'mobile' | 'desktop';
  connectionType: string;
  userAgent: string;
}

interface PerformanceMetrics {
  ttff: number[];
  failures: number;
  totalStarts: number;
  rebuffers: number;
  avgBitrate: number[];
}

// ============ State ============

const activeSessions = new Map<string, VideoSession>();
const sessionMetrics: PerformanceMetrics = {
  ttff: [],
  failures: 0,
  totalStarts: 0,
  rebuffers: 0,
  avgBitrate: [],
};

// ============ Helpers ============

const getDeviceType = (): 'mobile' | 'desktop' => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
};

const getConnectionType = (): string => {
  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';
  return connection.effectiveType || connection.type || 'unknown';
};

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

// ============ Public API ============

/**
 * Start tracking a video session
 * Call when video element mounts or starts loading
 */
export function startVideoSession(
  mediaId: string,
  surface: string,
  src: string
): string {
  const sessionId = generateSessionId();
  
  const session: VideoSession = {
    id: sessionId,
    surface,
    src: src.slice(-50), // Last 50 chars for privacy
    startTime: performance.now(),
    ttff: null,
    firstFrameTime: null,
    firstPlayTime: null,
    rebufferCount: 0,
    rebufferDuration: 0,
    qualitySwitches: 0,
    initialBitrate: null,
    finalBitrate: null,
    error: null,
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
    userAgent: navigator.userAgent.slice(0, 100),
  };
  
  activeSessions.set(mediaId, session);
  sessionMetrics.totalStarts++;
  
  return sessionId;
}

/**
 * Record time to first frame
 * Call when video fires 'playing' event for the first time
 */
export function recordTTFF(mediaId: string): number | null {
  const session = activeSessions.get(mediaId);
  if (!session || session.ttff !== null) return session?.ttff ?? null;
  
  const ttff = performance.now() - session.startTime;
  session.ttff = ttff;
  session.firstFrameTime = performance.now();
  sessionMetrics.ttff.push(ttff);
  
  // Send to analytics
  track('video_ttff', {
    mediaId,
    surface: session.surface,
    ttff_ms: Math.round(ttff),
    device: session.deviceType,
    connection: session.connectionType,
    is_slow: ttff > 1000,
    is_fast: ttff < 500,
  });
  
  // Log performance warning if slow
  if (ttff > 1000) {
    console.warn(`[VideoPerf] Slow TTFF: ${Math.round(ttff)}ms for ${mediaId} on ${session.surface}`);
  }
  
  return ttff;
}

/**
 * Record a rebuffer event (video stalled during playback)
 */
export function recordRebuffer(mediaId: string, duration: number): void {
  const session = activeSessions.get(mediaId);
  if (!session) return;
  
  session.rebufferCount++;
  session.rebufferDuration += duration;
  sessionMetrics.rebuffers++;
  
  track('video_rebuffer', {
    mediaId,
    surface: session.surface,
    rebuffer_count: session.rebufferCount,
    rebuffer_duration_ms: Math.round(duration),
    device: session.deviceType,
    connection: session.connectionType,
  });
}

/**
 * Record a quality level change
 */
export function recordQualityChange(
  mediaId: string, 
  bitrate: number, 
  resolution?: { width: number; height: number }
): void {
  const session = activeSessions.get(mediaId);
  if (!session) return;
  
  if (session.initialBitrate === null) {
    session.initialBitrate = bitrate;
  } else {
    session.qualitySwitches++;
  }
  
  session.finalBitrate = bitrate;
  sessionMetrics.avgBitrate.push(bitrate);
  
  track('video_quality_change', {
    mediaId,
    surface: session.surface,
    bitrate_kbps: Math.round(bitrate / 1000),
    resolution: resolution ? `${resolution.width}x${resolution.height}` : undefined,
    switch_count: session.qualitySwitches,
    device: session.deviceType,
  });
}

/**
 * Record a video startup failure
 */
export function recordFailure(mediaId: string, error: string, fatal: boolean = false): void {
  const session = activeSessions.get(mediaId);
  if (!session) {
    // Create minimal session for tracking failure
    sessionMetrics.failures++;
    track('video_failure', {
      mediaId,
      error,
      fatal,
      device: getDeviceType(),
      connection: getConnectionType(),
    });
    return;
  }
  
  session.error = error;
  if (fatal) {
    sessionMetrics.failures++;
  }
  
  track('video_failure', {
    mediaId,
    surface: session.surface,
    error,
    fatal,
    ttff_ms: session.ttff ? Math.round(session.ttff) : null,
    device: session.deviceType,
    connection: session.connectionType,
  });
}

/**
 * End a video session
 * Call when video unmounts or playback ends
 */
export function endVideoSession(mediaId: string): VideoSession | null {
  const session = activeSessions.get(mediaId);
  if (!session) return null;
  
  const totalDuration = performance.now() - session.startTime;
  
  // Send session summary
  track('video_session_end', {
    mediaId,
    surface: session.surface,
    duration_ms: Math.round(totalDuration),
    ttff_ms: session.ttff ? Math.round(session.ttff) : null,
    rebuffer_count: session.rebufferCount,
    rebuffer_duration_ms: Math.round(session.rebufferDuration),
    quality_switches: session.qualitySwitches,
    initial_bitrate_kbps: session.initialBitrate ? Math.round(session.initialBitrate / 1000) : null,
    final_bitrate_kbps: session.finalBitrate ? Math.round(session.finalBitrate / 1000) : null,
    had_error: !!session.error,
    device: session.deviceType,
    connection: session.connectionType,
  });
  
  activeSessions.delete(mediaId);
  return session;
}

// ============ Aggregated Metrics ============

/**
 * Get current session performance summary
 */
export function getPerformanceSummary(): {
  avgTTFF: number;
  p95TTFF: number;
  failureRate: number;
  rebufferRate: number;
  avgBitrate: number;
  totalSessions: number;
} {
  const { ttff, failures, totalStarts, rebuffers, avgBitrate } = sessionMetrics;
  
  // Calculate P95 TTFF
  const sortedTTFF = [...ttff].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedTTFF.length * 0.95);
  const p95TTFF = sortedTTFF[p95Index] || 0;
  
  return {
    avgTTFF: ttff.length > 0 ? ttff.reduce((a, b) => a + b, 0) / ttff.length : 0,
    p95TTFF,
    failureRate: totalStarts > 0 ? failures / totalStarts : 0,
    rebufferRate: totalStarts > 0 ? rebuffers / totalStarts : 0,
    avgBitrate: avgBitrate.length > 0 ? avgBitrate.reduce((a, b) => a + b, 0) / avgBitrate.length : 0,
    totalSessions: totalStarts,
  };
}

/**
 * Reset metrics (for testing or new sessions)
 */
export function resetMetrics(): void {
  sessionMetrics.ttff = [];
  sessionMetrics.failures = 0;
  sessionMetrics.totalStarts = 0;
  sessionMetrics.rebuffers = 0;
  sessionMetrics.avgBitrate = [];
  activeSessions.clear();
}

// ============ Debug Tools ============

/**
 * Log current performance to console
 */
export function logPerformanceReport(): void {
  const summary = getPerformanceSummary();
  
  console.group('📊 Video Performance Report');
  console.log(`Total Sessions: ${summary.totalSessions}`);
  console.log(`Avg TTFF: ${Math.round(summary.avgTTFF)}ms (target: <500ms)`);
  console.log(`P95 TTFF: ${Math.round(summary.p95TTFF)}ms (alert: >1000ms)`);
  console.log(`Failure Rate: ${(summary.failureRate * 100).toFixed(1)}% (target: <1%)`);
  console.log(`Rebuffer Rate: ${(summary.rebufferRate * 100).toFixed(1)}% (target: <2%)`);
  console.log(`Avg Bitrate: ${Math.round(summary.avgBitrate / 1000)}kbps`);
  
  // Alerts
  if (summary.p95TTFF > 1000) {
    console.warn('⚠️ ALERT: P95 TTFF exceeds 1000ms threshold!');
  }
  if (summary.failureRate > 0.05) {
    console.warn('⚠️ ALERT: Failure rate exceeds 5% threshold!');
  }
  if (summary.rebufferRate > 0.02) {
    console.warn('⚠️ ALERT: Rebuffer rate exceeds 2% threshold!');
  }
  
  console.groupEnd();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__videoPerf = {
    getSummary: getPerformanceSummary,
    logReport: logPerformanceReport,
    reset: resetMetrics,
    getActiveSessions: () => Object.fromEntries(activeSessions),
  };
}
