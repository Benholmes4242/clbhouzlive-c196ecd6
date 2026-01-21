/**
 * Watch Tab Debug System
 * 
 * Comprehensive logging for Watch/Shorts tab performance analysis:
 * - Component lifecycle (mount/unmount timing)
 * - Data fetching (queries, cache hits, load times)
 * - Video loading states (hero & grid)
 * - Autoplay & MediaRuntime coordination
 * - Scroll & visibility tracking
 * 
 * MIRRORS: Profile page debug system for consistent comparison
 * TOGGLE: Set DEBUG_WATCH to true/false to enable/disable
 */

// ============ MASTER SWITCH ============
export const DEBUG_WATCH = false; // Disable for production

// Color-coded log categories (same as profile debug)
const LOG_COLORS = {
  lifecycle: '#60a5fa',    // Blue - mount/unmount
  data: '#34d399',         // Green - queries/fetching
  navigation: '#f472b6',   // Pink - tab/route changes
  media: '#fbbf24',        // Yellow - video/image loading
  interaction: '#a78bfa',  // Purple - user actions
  performance: '#fb7185',  // Red - timing/metrics
  error: '#ef4444',        // Red - errors
  autoplay: '#22d3ee',     // Cyan - MediaRuntime/autoplay
  scroll: '#f97316',       // Orange - scroll/visibility
} as const;

type LogCategory = keyof typeof LOG_COLORS;

const startTime = performance.now();

/**
 * Centralized Watch tab debug logger
 */
export const logWatch = (
  category: LogCategory,
  component: string,
  event: string,
  data?: Record<string, unknown>
) => {
  if (!DEBUG_WATCH) return;
  
  const elapsed = (performance.now() - startTime).toFixed(2);
  const color = LOG_COLORS[category];
  
  const prefix = `%c[${elapsed}ms]%c [${component}]%c`;
  const styles = [
    `color: ${color}; font-weight: bold;`,
    'color: #94a3b8; font-weight: bold;',
    'color: inherit;',
  ];
  
  if (data) {
    console.log(`${prefix} ${event}`, ...styles, data);
  } else {
    console.log(`${prefix} ${event}`, ...styles);
  }
};

/**
 * Performance timing helper
 */
export const watchTiming = {
  marks: new Map<string, number>(),
  
  start(label: string) {
    if (!DEBUG_WATCH) return;
    this.marks.set(label, performance.now());
    logWatch('performance', 'Timing', `⏱️ START: ${label}`);
  },
  
  end(label: string) {
    if (!DEBUG_WATCH) return;
    const start = this.marks.get(label);
    if (start) {
      const duration = (performance.now() - start).toFixed(2);
      this.marks.delete(label);
      logWatch('performance', 'Timing', `⏱️ END: ${label} (${duration}ms)`);
      return parseFloat(duration);
    }
    return null;
  },
};

/**
 * Query state logger for React Query
 */
export const logWatchQueryState = (
  queryName: string,
  state: {
    isLoading?: boolean;
    isFetching?: boolean;
    isStale?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
    dataUpdatedAt?: number;
    errorUpdatedAt?: number;
    fetchStatus?: string;
  }
) => {
  if (!DEBUG_WATCH) return;
  
  const statusEmoji = state.isLoading 
    ? '⏳' 
    : state.isFetching 
      ? '🔄' 
      : state.isError 
        ? '❌' 
        : state.isSuccess 
          ? '✅' 
          : '❓';
  
  logWatch('data', 'Query', `${statusEmoji} ${queryName}`, {
    loading: state.isLoading,
    fetching: state.isFetching,
    stale: state.isStale,
    fetchStatus: state.fetchStatus,
    dataAge: state.dataUpdatedAt 
      ? `${((Date.now() - state.dataUpdatedAt) / 1000).toFixed(1)}s ago` 
      : 'N/A',
  });
};

/**
 * Component mount/unmount tracker
 */
export const createWatchLifecycleLogger = (componentName: string) => {
  if (!DEBUG_WATCH) {
    return {
      onMount: () => {},
      onUnmount: () => {},
      onUpdate: (_props: Record<string, unknown>) => {},
    };
  }
  
  const mountTime = performance.now();
  
  return {
    onMount: (props?: Record<string, unknown>) => {
      logWatch('lifecycle', componentName, '🟢 MOUNTED', props);
    },
    onUnmount: () => {
      const lifetime = (performance.now() - mountTime).toFixed(2);
      logWatch('lifecycle', componentName, `🔴 UNMOUNTED (lived ${lifetime}ms)`);
    },
    onUpdate: (changedProps: Record<string, unknown>) => {
      logWatch('lifecycle', componentName, '🔄 UPDATED', changedProps);
    },
  };
};

/**
 * Media loading state logger
 */
export const logWatchMediaState = (
  mediaId: string,
  event: 'load_start' | 'metadata' | 'ready' | 'playing' | 'error' | 'stalled' | 'canplay' | 'first_frame',
  details?: Record<string, unknown>
) => {
  if (!DEBUG_WATCH) return;
  
  const emoji = {
    load_start: '📥',
    metadata: '📋',
    ready: '✅',
    canplay: '🎯',
    first_frame: '🖼️',
    playing: '▶️',
    error: '❌',
    stalled: '⏸️',
  }[event];
  
  const shortId = mediaId.length > 8 ? `${mediaId.slice(0, 8)}...` : mediaId;
  
  logWatch('media', 'Media', `${emoji} ${event.toUpperCase()}: ${shortId}`, details);
};

/**
 * Autoplay/MediaRuntime logger
 */
export const logWatchAutoplay = (
  event: 'register' | 'unregister' | 'candidate' | 'play_request' | 'play_success' | 'play_blocked' | 'pause',
  mediaId: string,
  details?: Record<string, unknown>
) => {
  if (!DEBUG_WATCH) return;
  
  const emoji = {
    register: '📝',
    unregister: '🗑️',
    candidate: '🎯',
    play_request: '▶️',
    play_success: '✅',
    play_blocked: '🚫',
    pause: '⏸️',
  }[event];
  
  const shortId = mediaId.length > 8 ? `${mediaId.slice(0, 8)}...` : mediaId;
  
  logWatch('autoplay', 'MediaRuntime', `${emoji} ${event.toUpperCase()}: ${shortId}`, details);
};

/**
 * Scroll/visibility logger
 */
export const logWatchVisibility = (
  component: string,
  event: string,
  details?: Record<string, unknown>
) => {
  if (!DEBUG_WATCH) return;
  logWatch('scroll', component, `👁️ ${event}`, details);
};

/**
 * User interaction logger
 */
export const logWatchInteraction = (
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
) => {
  if (!DEBUG_WATCH) return;
  logWatch('interaction', 'User', `👆 ${action}${target ? `: ${target}` : ''}`, metadata);
};
