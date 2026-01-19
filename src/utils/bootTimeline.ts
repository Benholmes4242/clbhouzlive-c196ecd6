/**
 * Boot Timeline Logger
 * 
 * Temporary instrumentation to audit app startup and Clubhouse loading flow.
 * Enable via: localStorage.setItem('BOOT_TIMELINE', 'true')
 * 
 * Events tracked:
 * - APP_START: First JS execution / root mount
 * - SESSION_START: Auth session check begins
 * - SESSION_READY / SESSION_NONE: Auth resolved
 * - ROUTE_CLUBHOUSE: Clubhouse route entered
 * - ORANGE_LOADER_SHOW / HIDE: AuthWrapper spinner
 * - LOADING_POSTS_SHOW / HIDE: "Loading posts..." text
 * - FEED_FETCH_START / SUCCESS: Data fetch lifecycle
 * - FIRST_CARD_RENDER: First post card mounted
 * - FIRST_MEDIA_POSTER_LOADED: Video poster image loaded
 * - FIRST_VIDEO_MOUNTED: HLSPlayer component mounted
 * - FIRST_VIDEO_CANPLAY: Video ready to play
 * - FIRST_VIDEO_PLAYING: First frame visible / playback started
 */

// ============ Time Source ============
const CLOCK_NOW = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

// Store the app start time immediately (same clock as events)
const APP_START_TIME = CLOCK_NOW();

// ============ Configuration ============

const BOOT_TIMELINE_ENABLED = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('BOOT_TIMELINE') === 'true';
};

// ============ Types ============

interface BootEvent {
  event: string;
  timestamp: number; // ms since page load (same clock as APP_START_TIME)
  absoluteTime: number; // Date.now()
  metadata?: Record<string, any>;
}

interface BootTimelineState {
  events: BootEvent[];
  startTime: number;
}

// ============ Public API (attach early) ============

export const bootTimeline = {
  enable: enableBootTimeline,
  disable: disableBootTimeline,
  getTimeline: getBootTimeline,
  printSummary: printBootSummary,
  isEnabled: BOOT_TIMELINE_ENABLED,
  log: logBootEvent,
};

const BOOT_TIMELINE_TARGET: any =
  typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
      ? globalThis
      : undefined;

if (BOOT_TIMELINE_TARGET) {
  BOOT_TIMELINE_TARGET.bootTimeline = bootTimeline;
}

// Message bridge for Lovable editor console (cross-origin iframe)
// Allows enabling/printing even when you can't access window.bootTimeline directly.
if (typeof window !== 'undefined' && !(window as any).__bootTimelineBridgeInstalled) {
  (window as any).__bootTimelineBridgeInstalled = true;

  const isAllowedOrigin = (origin: string) =>
    /^https:\/\/(.*\.)?(lovable\.dev|lovable\.app|lovableproject\.com)$/.test(origin);

  window.addEventListener('message', (event) => {
    if (!event?.data) return;
    if (event.origin && !isAllowedOrigin(event.origin)) return;

    const data = event.data as any;
    const type = typeof data === 'string' ? data : data.type;

    switch (type) {
      case 'BOOT_TIMELINE_ENABLE':
        enableBootTimeline();
        break;
      case 'BOOT_TIMELINE_DISABLE':
        disableBootTimeline();
        break;
      case 'BOOT_TIMELINE_PRINT_SUMMARY':
        printBootSummary();
        break;
      default:
        break;
    }
  });
}

// ============ State ============

const timeline: BootTimelineState = {
  events: [],
  startTime: APP_START_TIME,
};

// Track one-time events
const firedOnce = new Set<string>();

// ============ Core Logger ============

export function logBootEvent(
  event: string,
  metadata?: Record<string, any>,
  options: { once?: boolean } = {}
) {
  if (!BOOT_TIMELINE_ENABLED()) return;

  // Skip if "once" event already fired
  if (options.once && firedOnce.has(event)) return;
  if (options.once) firedOnce.add(event);

  const now = CLOCK_NOW();
  const elapsed = now - APP_START_TIME;

  const entry: BootEvent = {
    event,
    timestamp: elapsed,
    absoluteTime: Date.now(),
    metadata,
  };

  timeline.events.push(entry);

  // Console output with distinctive styling
  const style = getEventStyle(event);
  console.log(
    `%c[BOOT] %c${formatTime(elapsed)} %c${event}`,
    'color: #f7931e; font-weight: bold',
    'color: #888',
    style,
    metadata ? metadata : ''
  );
}

// ============ Convenience Functions ============

export function logAppStart() {
  logBootEvent(
    'APP_START',
    {
      userAgent: navigator.userAgent.substring(0, 100),
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    },
    { once: true }
  );
}

export function logSessionStart() {
  logBootEvent('SESSION_START', undefined, { once: true });
}

export function logSessionReady(userId?: string) {
  logBootEvent(
    'SESSION_READY',
    {
      userId: userId?.substring(0, 8),
      hasUser: !!userId,
    },
    { once: true }
  );
}

export function logSessionNone() {
  logBootEvent('SESSION_NONE', undefined, { once: true });
}

export function logRouteClubhouse() {
  logBootEvent(
    'ROUTE_CLUBHOUSE',
    {
      path: window.location.pathname,
    },
    { once: true }
  );
}

export function logOrangeLoaderShow() {
  logBootEvent('ORANGE_LOADER_SHOW');
}

export function logOrangeLoaderHide() {
  logBootEvent('ORANGE_LOADER_HIDE');
}

export function logLoadingPostsShow() {
  logBootEvent('LOADING_POSTS_SHOW');
}

export function logLoadingPostsHide() {
  logBootEvent('LOADING_POSTS_HIDE');
}

export function logFeedFetchStart() {
  logBootEvent('FEED_FETCH_START', undefined, { once: true });
}

export function logFeedFetchSuccess(postCount: number) {
  logBootEvent(
    'FEED_FETCH_SUCCESS',
    {
      postCount,
      timestamp: CLOCK_NOW(),
    },
    { once: true }
  );
}

export function logFirstCardRender(postId: string) {
  logBootEvent(
    'FIRST_CARD_RENDER',
    {
      postId: postId.substring(0, 8),
    },
    { once: true }
  );
}

export function logFirstMediaPosterLoaded(postId: string) {
  logBootEvent(
    'FIRST_MEDIA_POSTER_LOADED',
    {
      postId: postId.substring(0, 8),
    },
    { once: true }
  );
}

export function logFirstVideoMounted(postId: string, src?: string) {
  logBootEvent(
    'FIRST_VIDEO_MOUNTED',
    {
      postId: postId.substring(0, 8),
      hasSrc: !!src,
    },
    { once: true }
  );
}

export function logFirstVideoCanplay(postId: string) {
  logBootEvent(
    'FIRST_VIDEO_CANPLAY',
    {
      postId: postId.substring(0, 8),
    },
    { once: true }
  );
}

export function logFirstVideoPlaying(postId: string) {
  logBootEvent(
    'FIRST_VIDEO_PLAYING',
    {
      postId: postId.substring(0, 8),
    },
    { once: true }
  );
}

export function logFirstVideoLoadedData(postId: string) {
  logBootEvent(
    'FIRST_VIDEO_LOADEDDATA',
    {
      postId: postId.substring(0, 8),
    },
    { once: true }
  );
}

// ============ Summary & Analysis ============

export function getBootTimeline(): BootTimelineState {
  return { ...timeline };
}

export function printBootSummary() {
  if (!BOOT_TIMELINE_ENABLED()) return;

  const events = timeline.events;
  if (events.length === 0) {
    console.log('%c[BOOT] No events recorded', 'color: #888');
    return;
  }

  console.log('%c\n═══════════════════════════════════════════════════════════', 'color: #f7931e');
  console.log(
    '%c                    BOOT TIMELINE SUMMARY                    ',
    'color: #f7931e; font-weight: bold'
  );
  console.log('%c═══════════════════════════════════════════════════════════\n', 'color: #f7931e');

  // Key milestones
  const milestones = [
    { from: 'APP_START', to: 'SESSION_READY', label: 'Session Resolution' },
    { from: 'APP_START', to: 'ROUTE_CLUBHOUSE', label: 'App → Clubhouse Route' },
    { from: 'ROUTE_CLUBHOUSE', to: 'FEED_FETCH_START', label: 'Route → Fetch Start' },
    { from: 'FEED_FETCH_START', to: 'FEED_FETCH_SUCCESS', label: 'Feed Fetch Duration' },
    { from: 'FEED_FETCH_SUCCESS', to: 'FIRST_CARD_RENDER', label: 'Data → First Card' },
    { from: 'FIRST_CARD_RENDER', to: 'FIRST_VIDEO_MOUNTED', label: 'Card → Video Mount' },
    { from: 'FIRST_VIDEO_MOUNTED', to: 'FIRST_VIDEO_CANPLAY', label: 'Mount → Can Play' },
    { from: 'FIRST_VIDEO_MOUNTED', to: 'FIRST_VIDEO_PLAYING', label: 'Mount → Playing' },
    { from: 'APP_START', to: 'FIRST_VIDEO_PLAYING', label: '🎯 TOTAL: Start → First Frame' },
  ];

  const getEvent = (name: string) => events.find((e) => e.event === name);

  console.log('%cKey Timing Breakdowns:', 'color: #fff; font-weight: bold');
  console.log('');

  milestones.forEach((m) => {
    const fromEvent = getEvent(m.from);
    const toEvent = getEvent(m.to);

    if (fromEvent && toEvent) {
      const duration = toEvent.timestamp - fromEvent.timestamp;
      const style =
        duration > 1000
          ? 'color: #ff6b6b'
          : duration > 500
            ? 'color: #ffa726'
            : 'color: #66bb6a';
      console.log(
        `  %c${m.label.padEnd(30)} %c${duration.toFixed(0)}ms`,
        'color: #aaa',
        style
      );
    } else {
      console.log(`  %c${m.label.padEnd(30)} %c--`, 'color: #aaa', 'color: #666');
    }
  });

  console.log('');
  console.log('%cFull Event Timeline:', 'color: #fff; font-weight: bold');
  console.log('');

  events.forEach((e) => {
    console.log(`  %c${formatTime(e.timestamp)} %c${e.event}`, 'color: #888', 'color: #fff');
  });

  console.log('%c\n═══════════════════════════════════════════════════════════\n', 'color: #f7931e');
}

// ============ Helpers ============

function formatTime(ms: number): string {
  return `+${ms.toFixed(0).padStart(5, ' ')}ms`;
}

function getEventStyle(event: string): string {
  if (event.includes('SUCCESS') || event.includes('READY') || event.includes('PLAYING')) {
    return 'color: #66bb6a; font-weight: bold';
  }
  if (event.includes('ERROR') || event.includes('FAIL')) {
    return 'color: #ff6b6b; font-weight: bold';
  }
  if (event.includes('START') || event.includes('SHOW')) {
    return 'color: #42a5f5';
  }
  if (event.includes('HIDE') || event.includes('END')) {
    return 'color: #9e9e9e';
  }
  return 'color: #fff';
}

// ============ Console Helpers ============

export function enableBootTimeline() {
  localStorage.setItem('BOOT_TIMELINE', 'true');
  console.log(
    '%c[BOOT] Boot timeline enabled. Reload page to capture events.',
    'color: #66bb6a; font-weight: bold'
  );
}

export function disableBootTimeline() {
  localStorage.removeItem('BOOT_TIMELINE');
  console.log('%c[BOOT] Boot timeline disabled.', 'color: #888');
}
