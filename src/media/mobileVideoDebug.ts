/**
 * Mobile Video Playback Debug Module
 * 
 * Comprehensive logging to trace why videos play on desktop but freeze on mobile.
 * Enable by setting MOBILE_VIDEO_DEBUG = true
 * 
 * Logs are prefixed with [MobileVideoDebug] for easy filtering in console.
 */

// ENABLE THIS FOR DEBUGGING - set to false for production
export const MOBILE_VIDEO_DEBUG = true;

// ============ In-Memory Log Store for On-Screen Debug Panel ============

export type DebugLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface DebugLogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  level: DebugLogLevel;
  category: string;
  message: string;
  data?: any;
}

const MAX_LOG_ENTRIES = 100;
let logIdCounter = 0;
const logStore: DebugLogEntry[] = [];
const subscribers: Set<(logs: DebugLogEntry[]) => void> = new Set();

function generateLogId(): string {
  return `log_${Date.now()}_${logIdCounter++}`;
}

function formatTimestamp(ts: number): string {
  const date = new Date();
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

function addLogEntry(level: DebugLogLevel, category: string, message: string, data?: any): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const entry: DebugLogEntry = {
    id: generateLogId(),
    timestamp: performance.now(),
    formattedTime: formatTimestamp(Date.now()),
    level,
    category,
    message,
    data,
  };
  
  logStore.push(entry);
  
  // Trim to max entries
  while (logStore.length > MAX_LOG_ENTRIES) {
    logStore.shift();
  }
  
  // Notify subscribers
  subscribers.forEach(fn => fn([...logStore]));
}

export function subscribeToDebugLogs(callback: (logs: DebugLogEntry[]) => void): () => void {
  subscribers.add(callback);
  // Immediately send current logs
  callback([...logStore]);
  return () => subscribers.delete(callback);
}

export function getDebugLogs(): DebugLogEntry[] {
  return [...logStore];
}

export function clearDebugLogs(): void {
  logStore.length = 0;
  subscribers.forEach(fn => fn([]));
}

export function getEnvironmentSummary(): string {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isWebView = /wv|WebView/i.test(ua) || 
    (window as any).webkit?.messageHandlers !== undefined;
  
  const testVideo = document.createElement('video');
  const supportsHlsNatively = 
    testVideo.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    testVideo.canPlayType('application/vnd.apple.mpegURL') !== '';
  
  const hlsMode = supportsHlsNatively ? 'Native HLS' : 'HLS.js';
  const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop';
  const browser = isSafari ? 'Safari' : isWebView ? 'WebView' : 'Other';
  
  return `${platform} | ${browser} | ${hlsMode}${isWebView ? ' | WebView' : ''}`;
}

// ============ Environment Detection ============

interface EnvironmentInfo {
  userAgent: string;
  platform: string;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isWebView: boolean;
  supportsHlsNatively: boolean;
  hlsJsWillBeUsed: boolean;
  timestamp: string;
}

export function logEnvironmentInfo(): EnvironmentInfo {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isWebView = /wv|WebView/i.test(ua) || 
    (window as any).webkit?.messageHandlers !== undefined ||
    (window as any).ReactNativeWebView !== undefined;
  
  // Test HLS native support
  const testVideo = document.createElement('video');
  const supportsHlsNatively = 
    testVideo.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    testVideo.canPlayType('application/vnd.apple.mpegURL') !== '';
  
  // HLS.js will be used if native support is NOT available (and it's not iOS)
  const hlsJsWillBeUsed = !isIOS && !supportsHlsNatively;
  
  const info: EnvironmentInfo = {
    userAgent: ua,
    platform,
    isIOS,
    isAndroid,
    isSafari,
    isWebView,
    supportsHlsNatively,
    hlsJsWillBeUsed,
    timestamp: new Date().toISOString(),
  };
  
  if (MOBILE_VIDEO_DEBUG) {
    console.log('[MobileVideoDebug] 🌍 ENVIRONMENT:', info);
    addLogEntry('info', 'ENV', getEnvironmentSummary(), { 
      nativeHLS: supportsHlsNatively,
      webView: isWebView 
    });
  }
  
  return info;
}

// ============ Video Element Events ============

const VIDEO_EVENTS = [
  'loadstart',
  'loadedmetadata', 
  'loadeddata',
  'canplay',
  'canplaythrough',
  'play',
  'playing',
  'pause',
  'waiting',
  'stalled',
  'suspend',
  'error',
  'ended',
] as const;

type VideoEventName = typeof VIDEO_EVENTS[number];

interface VideoEventLog {
  event: VideoEventName;
  timestamp: number;
  videoId: string;
  readyState: number;
  readyStateName: string;
  paused: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
  networkState: number;
  hasAutoplay: boolean;
  hasPlaysinline: boolean;
  src: string;
  error?: string;
}

const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
const networkStateNames = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];

export function attachVideoEventLoggers(video: HTMLVideoElement, videoId: string): () => void {
  if (!MOBILE_VIDEO_DEBUG) return () => {};
  
  const handlers: { event: VideoEventName; handler: () => void }[] = [];
  
  VIDEO_EVENTS.forEach(eventName => {
    const handler = () => {
      const log: VideoEventLog = {
        event: eventName,
        timestamp: performance.now(),
        videoId: videoId.slice(0, 8),
        readyState: video.readyState,
        readyStateName: readyStateNames[video.readyState] || 'UNKNOWN',
        paused: video.paused,
        muted: video.muted,
        currentTime: video.currentTime,
        duration: video.duration || 0,
        networkState: video.networkState,
        hasAutoplay: video.autoplay,
        hasPlaysinline: video.playsInline,
        src: video.src?.slice(-50) || 'none',
      };
      
      if (eventName === 'error' && video.error) {
        log.error = `${video.error.code}: ${video.error.message}`;
      }
      
      const emoji = getEventEmoji(eventName);
      console.log(`[MobileVideoDebug] ${emoji} VIDEO_EVENT: ${eventName}`, log);
      
      // Push to in-memory store
      const level: DebugLogLevel = eventName === 'error' ? 'error' 
        : (eventName === 'playing' || eventName === 'canplaythrough') ? 'success'
        : (eventName === 'stalled' || eventName === 'waiting') ? 'warning' 
        : 'info';
      addLogEntry(level, 'VIDEO', `${emoji} ${eventName} [${videoId.slice(0, 6)}]`, {
        ready: log.readyStateName,
        paused: log.paused,
        muted: log.muted,
      });
    };
    
    video.addEventListener(eventName, handler);
    handlers.push({ event: eventName, handler });
  });
  
  // Return cleanup function
  return () => {
    handlers.forEach(({ event, handler }) => {
      video.removeEventListener(event, handler);
    });
  };
}

function getEventEmoji(event: VideoEventName): string {
  switch (event) {
    case 'loadstart': return '🔄';
    case 'loadedmetadata': return '📋';
    case 'loadeddata': return '📦';
    case 'canplay': return '✅';
    case 'canplaythrough': return '✅✅';
    case 'play': return '▶️';
    case 'playing': return '🎬';
    case 'pause': return '⏸️';
    case 'waiting': return '⏳';
    case 'stalled': return '🚫';
    case 'suspend': return '💤';
    case 'error': return '❌';
    case 'ended': return '🏁';
    default: return '📌';
  }
}

// ============ safePlay Logging ============

interface SafePlayLog {
  phase: 'start' | 'muted_fallback' | 'success' | 'failure' | 'retry';
  timestamp: number;
  videoId: string;
  readyState: number;
  readyStateName: string;
  paused: boolean;
  muted: boolean;
  isConnected: boolean;
  hasSrc: boolean;
  errorName?: string;
  errorMessage?: string;
  mutedFallbackTriggered?: boolean;
  mutedFallbackSucceeded?: boolean;
  attempt?: number;
  maxRetries?: number;
}

export function logSafePlayStart(video: HTMLVideoElement, videoId: string): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: SafePlayLog = {
    phase: 'start',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    readyState: video.readyState,
    readyStateName: readyStateNames[video.readyState] || 'UNKNOWN',
    paused: video.paused,
    muted: video.muted,
    isConnected: video.isConnected,
    hasSrc: !!(video.src || video.currentSrc),
  };
  
  console.log('[MobileVideoDebug] 🎯 SAFE_PLAY_START:', log);
  addLogEntry('info', 'PLAY', `🎯 safePlay START [${videoId.slice(0, 6)}]`, { 
    ready: log.readyStateName, 
    muted: log.muted 
  });
}

export function logSafePlayMutedFallback(video: HTMLVideoElement, videoId: string, succeeded: boolean): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: SafePlayLog = {
    phase: 'muted_fallback',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    readyState: video.readyState,
    readyStateName: readyStateNames[video.readyState] || 'UNKNOWN',
    paused: video.paused,
    muted: video.muted,
    isConnected: video.isConnected,
    hasSrc: !!(video.src || video.currentSrc),
    mutedFallbackTriggered: true,
    mutedFallbackSucceeded: succeeded,
  };
  
  console.log('[MobileVideoDebug] 🔇 SAFE_PLAY_MUTED_FALLBACK:', log);
  addLogEntry(succeeded ? 'warning' : 'error', 'PLAY', 
    `🔇 Muted fallback ${succeeded ? 'SUCCESS' : 'FAILED'} [${videoId.slice(0, 6)}]`
  );
}

export function logSafePlayResult(
  video: HTMLVideoElement, 
  videoId: string, 
  success: boolean, 
  errorName?: string, 
  errorMessage?: string,
  attempt?: number,
  maxRetries?: number
): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: SafePlayLog = {
    phase: success ? 'success' : 'failure',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    readyState: video.readyState,
    readyStateName: readyStateNames[video.readyState] || 'UNKNOWN',
    paused: video.paused,
    muted: video.muted,
    isConnected: video.isConnected,
    hasSrc: !!(video.src || video.currentSrc),
    errorName,
    errorMessage,
    attempt,
    maxRetries,
  };
  
  if (success) {
    console.log('[MobileVideoDebug] ✅ SAFE_PLAY_SUCCESS:', log);
    addLogEntry('success', 'PLAY', `✅ safePlay SUCCESS [${videoId.slice(0, 6)}]`);
  } else {
    console.log('[MobileVideoDebug] ❌ SAFE_PLAY_FAILURE:', log);
    addLogEntry('error', 'PLAY', `❌ safePlay FAILED [${videoId.slice(0, 6)}]`, { 
      error: errorName, 
      msg: errorMessage?.slice(0, 50) 
    });
  }
}

// ============ Autoplay Flow Logging ============

interface AutoplayFlowLog {
  phase: 'autoplay_map_change' | 'autoplay_effect_fire' | 'ready_state_check' | 'visibility_change';
  timestamp: number;
  videoId: string;
  autoplayValue: boolean;
  readyState?: number;
  readyStatePassed?: boolean;
  isVisible?: boolean;
  visibilityRatio?: number;
}

export function logAutoplayMapChange(videoId: string, autoplayValue: boolean): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: AutoplayFlowLog = {
    phase: 'autoplay_map_change',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    autoplayValue,
  };
  
  console.log('[MobileVideoDebug] 🗺️ AUTOPLAY_MAP_CHANGE:', log);
  addLogEntry('info', 'AUTO', `🗺️ autoplay=${autoplayValue} [${videoId.slice(0, 6)}]`);
}

export function logAutoplayEffectFire(video: HTMLVideoElement, videoId: string, autoplayValue: boolean): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: AutoplayFlowLog = {
    phase: 'autoplay_effect_fire',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    autoplayValue,
    readyState: video.readyState,
    readyStatePassed: video.readyState >= 1,
  };
  
  console.log('[MobileVideoDebug] ⚡ AUTOPLAY_EFFECT_FIRE:', log);
  addLogEntry('info', 'AUTO', `⚡ effect fire [${videoId.slice(0, 6)}]`, {
    ready: readyStateNames[video.readyState],
    pass: video.readyState >= 1
  });
}

export function logReadyStateCheck(video: HTMLVideoElement, videoId: string, passed: boolean): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: AutoplayFlowLog = {
    phase: 'ready_state_check',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    autoplayValue: true,
    readyState: video.readyState,
    readyStatePassed: passed,
  };
  
  console.log(`[MobileVideoDebug] ${passed ? '✅' : '❌'} READY_STATE_CHECK:`, log);
}

// ============ IntersectionObserver Logging ============

interface IntersectionLog {
  videoId: string;
  timestamp: number;
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: { top: number; height: number };
  rootBounds: { top: number; height: number } | null;
  thresholdMet: boolean;
  action: 'entering' | 'exiting' | 'visible' | 'hidden';
}

export function logIntersectionChange(
  videoId: string,
  entry: IntersectionObserverEntry,
  startThreshold: number,
  stopThreshold: number
): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const ratio = entry.intersectionRatio;
  const wasVisible = ratio >= startThreshold;
  const willBeHidden = ratio <= stopThreshold;
  
  let action: IntersectionLog['action'];
  if (entry.isIntersecting && ratio >= startThreshold) {
    action = 'entering';
  } else if (!entry.isIntersecting || ratio <= stopThreshold) {
    action = 'exiting';
  } else if (ratio >= startThreshold) {
    action = 'visible';
  } else {
    action = 'hidden';
  }
  
  const log: IntersectionLog = {
    videoId: videoId.slice(0, 8),
    timestamp: performance.now(),
    isIntersecting: entry.isIntersecting,
    intersectionRatio: Math.round(ratio * 100) / 100,
    boundingClientRect: {
      top: Math.round(entry.boundingClientRect.top),
      height: Math.round(entry.boundingClientRect.height),
    },
    rootBounds: entry.rootBounds ? {
      top: Math.round(entry.rootBounds.top),
      height: Math.round(entry.rootBounds.height),
    } : null,
    thresholdMet: ratio >= startThreshold,
    action,
  };
  
  const emoji = action === 'entering' || action === 'visible' ? '👁️' : '🙈';
  console.log(`[MobileVideoDebug] ${emoji} INTERSECTION:`, log);
  
  // Only log entering/exiting to reduce noise
  if (action === 'entering' || action === 'exiting') {
    addLogEntry(action === 'entering' ? 'info' : 'warning', 'IO', 
      `${emoji} ${action} [${videoId.slice(0, 6)}] ratio=${log.intersectionRatio}`
    );
  }
}

// ============ MediaRuntime Logging ============

interface RuntimeLog {
  action: 'request_play' | 'request_pause' | 'evaluate_candidates' | 'candidate_state_change';
  timestamp: number;
  videoId?: string;
  surface?: string;
  reason?: string;
  activeCount?: number;
  visibleCandidates?: number;
  result?: boolean;
}

export function logRuntimeRequestPlay(
  videoId: string,
  surface: string,
  reason: string,
  activeCount: number
): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  const log: RuntimeLog = {
    action: 'request_play',
    timestamp: performance.now(),
    videoId: videoId.slice(0, 8),
    surface,
    reason,
    activeCount,
  };
  
  console.log('[MobileVideoDebug] 🎮 RUNTIME_REQUEST_PLAY:', log);
  addLogEntry('info', 'RUNTIME', `🎮 requestPlay [${videoId.slice(0, 6)}]`, { surface, reason });
}

export function logRuntimePlayResult(videoId: string, success: boolean): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  console.log(`[MobileVideoDebug] ${success ? '✅' : '❌'} RUNTIME_PLAY_RESULT:`, {
    videoId: videoId.slice(0, 8),
    success,
    timestamp: performance.now(),
  });
  addLogEntry(success ? 'success' : 'error', 'RUNTIME', 
    `${success ? '✅' : '❌'} runtime play ${success ? 'OK' : 'FAIL'} [${videoId.slice(0, 6)}]`
  );
}

export function logRuntimeCandidateEvaluation(
  visibleCandidates: number,
  bestCandidateId: string | null,
  reason: string
): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  console.log('[MobileVideoDebug] 🔍 RUNTIME_EVALUATE_CANDIDATES:', {
    timestamp: performance.now(),
    visibleCandidates,
    bestCandidateId: bestCandidateId?.slice(0, 8) || 'none',
    reason,
  });
}

// ============ HLS.js Logging ============

export function logHlsEvent(event: string, videoId: string, details?: any): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  console.log(`[MobileVideoDebug] 📺 HLS_EVENT: ${event}`, {
    videoId: videoId.slice(0, 8),
    timestamp: performance.now(),
    details,
  });
  addLogEntry('info', 'HLS', `📺 ${event} [${videoId.slice(0, 6)}]`, details);
}

export function logHlsError(videoId: string, fatal: boolean, type: string, details: string): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  console.log(`[MobileVideoDebug] ${fatal ? '💀' : '⚠️'} HLS_ERROR:`, {
    videoId: videoId.slice(0, 8),
    timestamp: performance.now(),
    fatal,
    type,
    details,
  });
  addLogEntry(fatal ? 'error' : 'warning', 'HLS', 
    `${fatal ? '💀 FATAL' : '⚠️'} ${type}: ${details} [${videoId.slice(0, 6)}]`
  );
}

// ============ Startup Log ============

export function initMobileVideoDebug(): void {
  if (!MOBILE_VIDEO_DEBUG) return;
  
  console.log('[MobileVideoDebug] ========================================');
  console.log('[MobileVideoDebug] 🚀 MOBILE VIDEO DEBUG ENABLED');
  console.log('[MobileVideoDebug] ========================================');
  
  addLogEntry('success', 'INIT', '🚀 Mobile Video Debug ENABLED');
  
  logEnvironmentInfo();
  
  // Log playsinline support
  const testVideo = document.createElement('video');
  const playsInlineSupported = 'playsInline' in testVideo;
  console.log('[MobileVideoDebug] 📱 PLAYSINLINE SUPPORT:', {
    playsInlineSupported,
    webkitPlaysInlineSupported: 'webkitPlaysInline' in testVideo,
  });
  addLogEntry('info', 'INIT', `📱 playsInline: ${playsInlineSupported ? 'YES' : 'NO'}`);
}
