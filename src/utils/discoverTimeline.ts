/**
 * Discover Page Video Startup Timeline
 * Tracks timing from navigation → first video playing
 * 
 * Enable: localStorage.setItem('DEBUG_DISCOVER_TIMING', 'true')
 * View: window.__discoverTiming.printSummary()
 */

const DEBUG_ENABLED = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('DEBUG_DISCOVER_TIMING') === 'true';
};

interface TimingEvent {
  event: string;
  timestamp: number;      // ms since session start
  absoluteTime: number;   // Date.now()
  target?: string;        // 'hero' | 'grid' | 'shorts' | 'page'
  mediaId?: string;
  metadata?: Record<string, any>;
}

let sessionStart = performance.now();
const events: TimingEvent[] = [];

// Reset session start when navigating to Discover
export function resetSessionStart() {
  sessionStart = performance.now();
  events.length = 0;
}

// ============ Core Logger ============

function logEvent(
  event: string,
  target?: string,
  mediaId?: string,
  metadata?: Record<string, any>
) {
  if (!DEBUG_ENABLED()) return;
  
  const now = performance.now();
  const elapsed = now - sessionStart;
  
  const entry: TimingEvent = {
    event,
    timestamp: elapsed,
    absoluteTime: Date.now(),
    target,
    mediaId: mediaId?.slice(0, 8),
    metadata,
  };
  
  events.push(entry);
  
  // Console output with color coding
  const targetStr = target ? `[${target.toUpperCase()}]` : '';
  const idStr = mediaId ? `{${mediaId.slice(0, 8)}}` : '';
  const metaStr = metadata ? JSON.stringify(metadata) : '';
  
  console.log(
    `%c[DiscoverTiming] %c+${elapsed.toFixed(1)}ms %c${targetStr} %c${event} ${idStr}`,
    'color: #9333ea; font-weight: bold',
    'color: #666',
    'color: #3b82f6',
    'color: #fff',
    metaStr
  );
}

// ============ Page Navigation Events ============

export function logDiscoverPageMount() {
  resetSessionStart();
  logEvent('DISCOVER_PAGE_MOUNT', 'page');
}

export function logDiscoverPageUnmount() {
  logEvent('DISCOVER_PAGE_UNMOUNT', 'page');
}

export function logWatchTabActive(tab: string) {
  logEvent('WATCH_TAB_ACTIVE', 'page', undefined, { tab });
}

export function logDiscoverContentMount(itemCount: number) {
  logEvent('DISCOVER_CONTENT_MOUNT', 'page', undefined, { itemCount });
}

// ============ Hero Video Events ============

export function logHeroComponentMount(mediaId: string, hasAutoplay: boolean) {
  logEvent('HERO_COMPONENT_MOUNT', 'hero', mediaId, { hasAutoplay });
}

export function logHeroPlayerMount(mediaId: string) {
  logEvent('HERO_PLAYER_MOUNT', 'hero', mediaId);
}

export function logHeroMediaRuntimeRegister(mediaId: string, sortIndex: number) {
  logEvent('HERO_MEDIARUNTIME_REGISTER', 'hero', mediaId, { sortIndex });
}

export function logHeroIntersectionDetected(mediaId: string, ratio: number) {
  logEvent('HERO_INTERSECTION_DETECTED', 'hero', mediaId, { ratio: ratio.toFixed(2) });
}

export function logHeroHlsLibraryLoaded(mediaId: string) {
  logEvent('HERO_HLS_LIBRARY_LOADED', 'hero', mediaId);
}

export function logHeroManifestFetchStart(mediaId: string, url: string) {
  logEvent('HERO_MANIFEST_FETCH_START', 'hero', mediaId, { url: url.slice(0, 60) });
}

export function logHeroManifestFetchComplete(mediaId: string, durationMs: number) {
  logEvent('HERO_MANIFEST_FETCH_COMPLETE', 'hero', mediaId, { durationMs: durationMs.toFixed(0) });
}

export function logHeroFirstSegmentFetchStart(mediaId: string) {
  logEvent('HERO_FIRST_SEGMENT_FETCH_START', 'hero', mediaId);
}

export function logHeroFirstSegmentFetchComplete(mediaId: string, durationMs: number) {
  logEvent('HERO_FIRST_SEGMENT_FETCH_COMPLETE', 'hero', mediaId, { durationMs: durationMs.toFixed(0) });
}

export function logHeroCanPlay(mediaId: string, readyState: number) {
  logEvent('HERO_CAN_PLAY', 'hero', mediaId, { readyState });
}

export function logHeroLoadedData(mediaId: string, currentTime: number) {
  logEvent('HERO_LOADED_DATA', 'hero', mediaId, { currentTime: currentTime.toFixed(2) });
}

export function logHeroPlaying(mediaId: string) {
  logEvent('HERO_PLAYING', 'hero', mediaId);
}

export function logHeroPosterHidden(mediaId: string) {
  logEvent('HERO_POSTER_HIDDEN', 'hero', mediaId);
}

export function logHeroError(mediaId: string, error: string) {
  logEvent('HERO_ERROR', 'hero', mediaId, { error });
}

export function logHeroPreloadManifest(mediaId: string) {
  logEvent('HERO_PRELOAD_MANIFEST', 'hero', mediaId);
}

// ============ Grid/Shorts Events ============

export function logGridMount(target: 'grid' | 'shorts', itemCount: number) {
  logEvent('GRID_MOUNT', target, undefined, { itemCount });
}

export function logGridFirstItemMount(target: 'grid' | 'shorts', mediaId: string, index: number) {
  logEvent('GRID_FIRST_ITEM_MOUNT', target, mediaId, { index });
}

export function logGridFirstItemRegister(target: 'grid' | 'shorts', mediaId: string) {
  logEvent('GRID_FIRST_ITEM_REGISTER', target, mediaId);
}

export function logGridFirstItemVisible(target: 'grid' | 'shorts', mediaId: string, ratio: number) {
  logEvent('GRID_FIRST_ITEM_VISIBLE', target, mediaId, { ratio: ratio.toFixed(2) });
}

export function logGridFirstItemPlaying(target: 'grid' | 'shorts', mediaId: string) {
  logEvent('GRID_FIRST_ITEM_PLAYING', target, mediaId);
}

// ============ HLSPlayer Events ============

export function logHlsPlayerMount(mediaId: string, surface: string) {
  logEvent('HLSPLAYER_MOUNT', surface, mediaId);
}

export function logHlsLibraryLoadStart(mediaId: string) {
  logEvent('HLS_LIBRARY_LOAD_START', 'hero', mediaId);
}

export function logHlsLibraryLoadComplete(mediaId: string, durationMs: number) {
  logEvent('HLS_LIBRARY_LOAD_COMPLETE', 'hero', mediaId, { durationMs: durationMs.toFixed(0) });
}

export function logHlsSourceLoadStart(mediaId: string, src: string) {
  logEvent('HLS_SOURCE_LOAD_START', 'hero', mediaId, { src: src.slice(0, 60) });
}

export function logHlsManifestParsed(mediaId: string, levels: number) {
  logEvent('HLS_MANIFEST_PARSED', 'hero', mediaId, { levels });
}

export function logHlsFirstFragLoading(mediaId: string) {
  logEvent('HLS_FIRST_FRAG_LOADING', 'hero', mediaId);
}

export function logHlsFirstFragLoaded(mediaId: string, durationMs: number) {
  logEvent('HLS_FIRST_FRAG_LOADED', 'hero', mediaId, { durationMs: durationMs.toFixed(0) });
}

// ============ MediaRuntime Events ============

export function logMediaRuntimeEvaluate(candidateCount: number, activeCount: number) {
  logEvent('MEDIARUNTIME_EVALUATE', undefined, undefined, { candidateCount, activeCount });
}

export function logMediaRuntimePlayRequest(mediaId: string, surface: string, reason: string) {
  logEvent('MEDIARUNTIME_PLAY_REQUEST', surface, mediaId, { reason });
}

export function logMediaRuntimePlayGranted(mediaId: string, timeTakenMs: number) {
  logEvent('MEDIARUNTIME_PLAY_GRANTED', undefined, mediaId, { timeTakenMs: timeTakenMs.toFixed(0) });
}

export function logMediaRuntimePlayBlocked(mediaId: string, reason: string) {
  logEvent('MEDIARUNTIME_PLAY_BLOCKED', undefined, mediaId, { reason });
}

// ============ Summary & Analysis ============

export function getEvents() {
  return [...events];
}

export function printSummary() {
  if (!DEBUG_ENABLED()) {
    console.log('%c[DiscoverTiming] Not enabled. Run: localStorage.setItem("DEBUG_DISCOVER_TIMING", "true"); then reload', 'color: #666');
    return;
  }
  
  if (events.length === 0) {
    console.log('%c[DiscoverTiming] No events captured yet', 'color: #666');
    return;
  }
  
  console.log('%c\n═══════════════════════════════════════════════════════════', 'color: #9333ea');
  console.log('%c              DISCOVER PAGE TIMING SUMMARY                  ', 'color: #9333ea; font-weight: bold');
  console.log('%c═══════════════════════════════════════════════════════════\n', 'color: #9333ea');
  
  // Key milestones for hero video
  const pageMount = events.find(e => e.event === 'DISCOVER_PAGE_MOUNT');
  const contentMount = events.find(e => e.event === 'DISCOVER_CONTENT_MOUNT');
  const heroMount = events.find(e => e.event === 'HERO_COMPONENT_MOUNT');
  const heroRegister = events.find(e => e.event === 'HERO_MEDIARUNTIME_REGISTER');
  const hlsLibStart = events.find(e => e.event === 'HLS_LIBRARY_LOAD_START');
  const hlsLibComplete = events.find(e => e.event === 'HLS_LIBRARY_LOAD_COMPLETE');
  const hlsSourceStart = events.find(e => e.event === 'HLS_SOURCE_LOAD_START');
  const heroManifestComplete = events.find(e => e.event === 'HERO_MANIFEST_FETCH_COMPLETE') || events.find(e => e.event === 'HLS_MANIFEST_PARSED');
  const heroSegmentStart = events.find(e => e.event === 'HERO_FIRST_SEGMENT_FETCH_START') || events.find(e => e.event === 'HLS_FIRST_FRAG_LOADING');
  const heroSegmentComplete = events.find(e => e.event === 'HERO_FIRST_SEGMENT_FETCH_COMPLETE') || events.find(e => e.event === 'HLS_FIRST_FRAG_LOADED');
  const heroLoadedData = events.find(e => e.event === 'HERO_LOADED_DATA');
  const heroCanPlay = events.find(e => e.event === 'HERO_CAN_PLAY');
  const heroPlaying = events.find(e => e.event === 'HERO_PLAYING');
  const heroPosterHidden = events.find(e => e.event === 'HERO_POSTER_HIDDEN');
  const playRequest = events.find(e => e.event === 'MEDIARUNTIME_PLAY_REQUEST');
  const playGranted = events.find(e => e.event === 'MEDIARUNTIME_PLAY_GRANTED');
  
  console.log('%cHERO VIDEO TIMING BREAKDOWN:', 'color: #3b82f6; font-weight: bold');
  console.log('');
  
  const milestones = [
    { from: pageMount, to: contentMount, label: 'Page Mount → Content Mount' },
    { from: contentMount, to: heroMount, label: 'Content Mount → Hero Mount' },
    { from: heroMount, to: heroRegister, label: 'Hero Mount → MediaRuntime Register' },
    { from: heroRegister, to: hlsLibStart, label: 'Register → HLS Library Start' },
    { from: hlsLibStart, to: hlsLibComplete, label: 'HLS Library Load Duration' },
    { from: hlsLibComplete, to: hlsSourceStart, label: 'HLS Ready → Source Load Start' },
    { from: hlsSourceStart, to: heroManifestComplete, label: 'Manifest Fetch Duration' },
    { from: heroManifestComplete, to: heroSegmentStart, label: 'Manifest → First Segment Fetch' },
    { from: heroSegmentStart, to: heroSegmentComplete, label: 'First Segment Fetch Duration' },
    { from: heroSegmentComplete, to: heroLoadedData, label: 'Segment → Loaded Data' },
    { from: heroLoadedData, to: heroCanPlay, label: 'Loaded Data → Can Play' },
    { from: playRequest, to: playGranted, label: 'Play Request → Play Granted' },
    { from: heroCanPlay, to: heroPlaying, label: 'Can Play → Playing' },
    { from: heroPlaying, to: heroPosterHidden, label: 'Playing → Poster Hidden' },
    { from: pageMount, to: heroPlaying, label: '🎯 TOTAL: Page Mount → Video Playing' },
    { from: pageMount, to: heroPosterHidden, label: '🎯 TOTAL: Page Mount → Poster Hidden' },
  ];
  
  milestones.forEach(m => {
    if (m.from && m.to) {
      const duration = m.to.timestamp - m.from.timestamp;
      const style = duration > 1000 ? 'color: #ef4444; font-weight: bold' : 
                    duration > 500 ? 'color: #f59e0b' : 
                    duration > 200 ? 'color: #eab308' : 'color: #22c55e';
      console.log(`  %c${m.label.padEnd(45)} %c${duration.toFixed(0)}ms`, 'color: #aaa', style);
    } else if (m.from || m.to) {
      console.log(`  %c${m.label.padEnd(45)} %c-- (missing event)`, 'color: #aaa', 'color: #666');
    }
  });
  
  // Find bottlenecks
  console.log('');
  console.log('%cBOTTLENECKS (>500ms):', 'color: #ef4444; font-weight: bold');
  console.log('');
  
  const bottlenecks = milestones
    .filter(m => m.from && m.to && (m.to.timestamp - m.from.timestamp) > 500)
    .sort((a, b) => {
      const durationA = a.to!.timestamp - a.from!.timestamp;
      const durationB = b.to!.timestamp - b.from!.timestamp;
      return durationB - durationA;
    });
  
  if (bottlenecks.length === 0) {
    console.log('  %cNo major bottlenecks found! 🎉', 'color: #22c55e');
  } else {
    bottlenecks.forEach(b => {
      const duration = b.to!.timestamp - b.from!.timestamp;
      console.log(`  %c⚠️  ${b.label}: ${duration.toFixed(0)}ms`, 'color: #ef4444; font-weight: bold');
    });
  }
  
  // Full timeline
  console.log('');
  console.log('%cFULL EVENT TIMELINE:', 'color: #fff; font-weight: bold');
  console.log('');
  
  events.forEach(e => {
    const targetStr = e.target ? `[${e.target.toUpperCase()}]`.padEnd(10) : ''.padEnd(10);
    const idStr = e.mediaId ? `{${e.mediaId}}` : '';
    const metaStr = e.metadata ? ` ${JSON.stringify(e.metadata)}` : '';
    console.log(`  %c+${e.timestamp.toFixed(1).padStart(8)}ms %c${targetStr} %c${e.event} ${idStr}%c${metaStr}`, 
      'color: #666', 
      'color: #3b82f6', 
      'color: #fff',
      'color: #888'
    );
  });
  
  console.log('%c\n═══════════════════════════════════════════════════════════\n', 'color: #9333ea');
}

export function clearEvents() {
  events.length = 0;
  sessionStart = performance.now();
}

export function enable() {
  localStorage.setItem('DEBUG_DISCOVER_TIMING', 'true');
  console.log('%c[DiscoverTiming] Enabled! Reload page to capture timing.', 'color: #22c55e; font-weight: bold');
}

export function disable() {
  localStorage.removeItem('DEBUG_DISCOVER_TIMING');
}

// Expose to window for console access immediately on module load
if (typeof window !== 'undefined') {
  const api = {
    enable,
    disable,
    printSummary,
    getEvents,
    clearEvents,
  };

  // Attach inside the app iframe
  (window as any).__discoverTiming = api;

  // Also try to attach to parent/top (may fail due to cross-origin in Lovable editor)
  try {
    if (window.parent && window.parent !== window) {
      (window.parent as any).__discoverTiming = api;
    }
  } catch {
    // ignore (cross-origin)
  }

  try {
    if (window.top && window.top !== window) {
      (window.top as any).__discoverTiming = api;
    }
  } catch {
    // ignore (cross-origin)
  }

  // Cross-origin safe bridge: allow the Lovable editor frame to control timing via postMessage
  const MSG_TYPE = '__DISCOVER_TIMING__';
  window.addEventListener('message', (event) => {
    const data = (event as MessageEvent).data as any;
    if (!data || data.type !== MSG_TYPE) return;

    switch (data.action) {
      case 'enable':
        enable();
        break;
      case 'disable':
        disable();
        break;
      case 'clear':
        clearEvents();
        break;
      case 'printSummary':
        printSummary();
        break;
      default:
        break;
    }
  });
}
