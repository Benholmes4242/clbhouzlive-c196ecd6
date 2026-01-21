/**
 * Profile Page Debug System
 * 
 * Comprehensive logging for profile page performance analysis:
 * - Component lifecycle (mount/unmount timing)
 * - Data fetching (queries, cache hits, load times)
 * - Tab navigation & transitions
 * - Media loading states
 * - User interactions
 * 
 * ENABLED: January 2026 debugging session
 */

import { DEBUG_PROFILE } from '@/media/debug';

// Color-coded log categories
const LOG_COLORS = {
  lifecycle: '#60a5fa',    // Blue - mount/unmount
  data: '#34d399',         // Green - queries/fetching
  navigation: '#f472b6',   // Pink - tab/route changes
  media: '#fbbf24',        // Yellow - video/image loading
  interaction: '#a78bfa',  // Purple - user actions
  performance: '#fb7185',  // Red - timing/metrics
  error: '#ef4444',        // Red - errors
} as const;

type LogCategory = keyof typeof LOG_COLORS;

const startTime = performance.now();

/**
 * Centralized profile debug logger
 */
export const logProfile = (
  category: LogCategory,
  component: string,
  event: string,
  data?: Record<string, unknown>
) => {
  if (!DEBUG_PROFILE) return;
  
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
export const profileTiming = {
  marks: new Map<string, number>(),
  
  start(label: string) {
    if (!DEBUG_PROFILE) return;
    this.marks.set(label, performance.now());
    logProfile('performance', 'Timing', `⏱️ START: ${label}`);
  },
  
  end(label: string) {
    if (!DEBUG_PROFILE) return;
    const start = this.marks.get(label);
    if (start) {
      const duration = (performance.now() - start).toFixed(2);
      this.marks.delete(label);
      logProfile('performance', 'Timing', `⏱️ END: ${label} (${duration}ms)`);
      return parseFloat(duration);
    }
    return null;
  },
};

/**
 * Query state logger for React Query
 */
export const logQueryState = (
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
  if (!DEBUG_PROFILE) return;
  
  const statusEmoji = state.isLoading 
    ? '⏳' 
    : state.isFetching 
      ? '🔄' 
      : state.isError 
        ? '❌' 
        : state.isSuccess 
          ? '✅' 
          : '❓';
  
  logProfile('data', 'Query', `${statusEmoji} ${queryName}`, {
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
export const createLifecycleLogger = (componentName: string) => {
  if (!DEBUG_PROFILE) {
    return {
      onMount: () => {},
      onUnmount: () => {},
      onUpdate: (_props: Record<string, unknown>) => {},
    };
  }
  
  const mountTime = performance.now();
  
  return {
    onMount: (props?: Record<string, unknown>) => {
      logProfile('lifecycle', componentName, '🟢 MOUNTED', props);
    },
    onUnmount: () => {
      const lifetime = (performance.now() - mountTime).toFixed(2);
      logProfile('lifecycle', componentName, `🔴 UNMOUNTED (lived ${lifetime}ms)`);
    },
    onUpdate: (changedProps: Record<string, unknown>) => {
      logProfile('lifecycle', componentName, '🔄 UPDATED', changedProps);
    },
  };
};

/**
 * Tab navigation logger
 */
export const logTabNavigation = (
  from: string,
  to: string,
  metadata?: Record<string, unknown>
) => {
  if (!DEBUG_PROFILE) return;
  logProfile('navigation', 'TabNav', `📑 ${from} → ${to}`, metadata);
};

/**
 * Media loading state logger
 */
export const logMediaState = (
  mediaId: string,
  event: 'load_start' | 'metadata' | 'ready' | 'playing' | 'error' | 'stalled',
  details?: Record<string, unknown>
) => {
  if (!DEBUG_PROFILE) return;
  
  const emoji = {
    load_start: '📥',
    metadata: '📋',
    ready: '✅',
    playing: '▶️',
    error: '❌',
    stalled: '⏸️',
  }[event];
  
  logProfile('media', 'Media', `${emoji} ${event.toUpperCase()}: ${mediaId.slice(0, 8)}...`, details);
};

/**
 * User interaction logger
 */
export const logInteraction = (
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
) => {
  if (!DEBUG_PROFILE) return;
  logProfile('interaction', 'User', `👆 ${action}${target ? `: ${target}` : ''}`, metadata);
};
