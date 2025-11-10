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
};
