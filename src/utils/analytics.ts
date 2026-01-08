/**
 * Lightweight analytics wrapper
 * Non-blocking, console-logs in dev, future-ready for Supabase/PostHog
 */

type EventType = 
  | 'game_view'
  | 'game_join_request'
  | 'gameshub_open'
  | 'gameshub_tab_change'
  | 'join_requests_open'
  | 'game_create'
  | 'course_create_game_click';

interface EventPayload {
  game_id?: string;
  course_id?: string;
  tab?: string;
  source?: string;
  [key: string]: unknown;
}

export function track(eventType: EventType, payload?: EventPayload): void {
  try {
    // Dev logging
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventType}`, payload);
    }
    
    // Future: POST to Supabase or external analytics
    // supabase.from('analytics_events').insert({ name: eventType, props: payload });
  } catch {
    // Never block UI
  }
}
