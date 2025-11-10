import { track } from '@/lib/telemetry';

export interface TagAddedPayload {
  thread_id: string;
  tag: string;
  source: 'inline' | 'modal';
}

export interface TagRemovedPayload {
  thread_id: string;
  tag: string;
  source: 'inline' | 'modal';
}

export interface TagsSetPayload {
  thread_id: string;
  count: number;
  source: 'inline' | 'modal';
}

export interface TagSuggestShownPayload {
  prefix: string;
  count: number;
}

export function trackTagAdded(payload: TagAddedPayload) {
  track('echo_history_tag_added', payload);
}

export function trackTagRemoved(payload: TagRemovedPayload) {
  track('echo_history_tag_removed', payload);
}

export function trackTagsSet(payload: TagsSetPayload) {
  track('echo_history_tags_set', payload);
}

export function trackTagSuggestShown(payload: TagSuggestShownPayload) {
  track('echo_history_tag_suggest_shown', payload);
}
