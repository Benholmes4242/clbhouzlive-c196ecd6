/**
 * Analytics tracking for Echo History interactions
 */

import { track } from '@/lib/telemetry';
import { EchoHistorySearchFilters } from '../hooks/useEchoHistorySearch';

interface BaseEventProps {
  thread_id: string;
  list_filters?: Partial<EchoHistorySearchFilters>;
  rank_index?: number;
}

export const echoHistoryAnalytics = {
  starToggled(props: {
    thread_id: string;
    prev_starred: boolean;
    next_starred: boolean;
    source: 'row-hover' | 'swipe' | 'keyboard';
    list_filters?: Partial<EchoHistorySearchFilters>;
    rank_index?: number;
  }) {
    track('echo_history_star_toggled', props);
  },

  deleteSoft(props: {
    thread_id: string;
    source: 'swipe' | 'row-hover' | 'keyboard';
    list_filters?: Partial<EchoHistorySearchFilters>;
  }) {
    track('echo_history_delete_soft', props);
  },

  deleteUndo(props: {
    thread_id: string;
    seconds_elapsed: number;
  }) {
    track('echo_history_delete_undo', props);
  },

  deleteHard(props: {
    thread_id: string;
    latency_ms: number;
  }) {
    track('echo_history_delete_hard', props);
  },

  openInline(props: BaseEventProps) {
    track('echo_history_open_inline', props);
  },

  openFull(props: {
    thread_id: string;
    from_inline: boolean;
  }) {
    track('echo_history_open_full', props);
  },

  search(props: {
    query: string;
    results_count: number;
  }) {
    track('echo_history_search', props);
  },

  filterApplied(filters: {
    has_response?: boolean;
    date_from?: string;
    mode?: 'live' | 'static';
    starred?: boolean;
  }) {
    track('echo_history_filter_applied', filters);
  },

  swipeAction(props: {
    thread_id: string;
    direction: 'left' | 'right';
    distance_px: number;
    velocity_px_s: number;
  }) {
    track('echo_history_swipe_action', props);
  },

  // Bulk actions
  bulkStar(props: {
    count: number;
    starred: boolean;
  }) {
    track('echo_history_bulk_star', props);
  },

  bulkDeleteSoft(props: {
    count: number;
  }) {
    track('echo_history_bulk_delete_soft', props);
  },

  bulkDeleteUndo(props: {
    count: number;
    seconds_elapsed: number;
  }) {
    track('echo_history_bulk_delete_undo', props);
  },

  bulkDeleteHard(props: {
    count: number;
    latency_ms: number;
  }) {
    track('echo_history_bulk_delete_hard', props);
  },

  // Sort
  sortChanged(props: {
    sort_mode: 'default' | 'starred' | 'relevance';
  }) {
    track('echo_history_sort_changed', props);
  },

  // Export
  exportStarted(props: {
    thread_id: string;
    format: 'json' | 'md';
  }) {
    track('echo_history_export_started', props);
  },

  exportBulkStarted(props: {
    count: number;
    format: 'json' | 'md';
  }) {
    track('echo_history_export_bulk_started', props);
  },

  exportProgress(props: {
    current: number;
    total: number;
    bytes: number;
  }) {
    track('echo_history_export_progress', props);
  },

  exportCanceled(props: {
    current: number;
    total: number;
  }) {
    track('echo_history_export_canceled', props);
  },

  exportCompleted(props: {
    count: number;
    bytes: number;
    duration_ms: number;
  }) {
    track('echo_history_export_completed', props);
  },

  // Share
  shareCreated(props: {
    thread_id: string;
    ttl_seconds?: number;
  }) {
    track('echo_share_created', props);
  },

  shareRevoked(props: {
    thread_id: string;
  }) {
    track('echo_share_revoked', props);
  },

  shareOpenedPublic(props: {
    thread_id: string;
  }) {
    track('echo_share_opened_public', props);
  },

  // Keyboard shortcuts
  shortcutsOpened() {
    track('echo_history_shortcuts_opened', {});
  },

  // Tags
  tagAdded(props: {
    tag: string;
    thread_id: string;
  }) {
    track('echo_history_tag_added', props);
  },

  tagRemoved(props: {
    tag: string;
    thread_id: string;
  }) {
    track('echo_history_tag_removed', props);
  },
  
  tagFilterApplied(props: {
    tag: string;
  }) {
    track('echo_history_tag_filter_applied', props);
  },
};
