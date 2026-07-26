// Shared plain-English labels for raw analytics_events names.
// Sourced by grepping track('...') callsites across src/. Consumed by
// the Live stream (AnalyticsPage Live tab) and the Events explorer.
// Unmapped names fall through to `titleize(name)`.

export const EVENT_LABELS: Record<string, string> = {
  // ─── App lifecycle / navigation ───────────────────────────────
  session_start: 'Session started',
  page_view: 'Page viewed',
  page_exit: 'Page exited',
  nav_tab_tap: 'Nav tab tapped',
  feed_tab_switch: 'Feed tab switched',

  // ─── Auth ─────────────────────────────────────────────────────
  auth_method_selected: 'Auth method selected',
  auth_initiated: 'Auth started',
  auth_failed: 'Auth failed',
  auth_exception: 'Auth exception',
  auth_callback_started: 'Auth callback started',
  auth_redirect: 'Auth redirect',
  auth_complete: 'Auth complete',
  signup_initiated: 'Signup started',
  signup_success: 'Signup completed',
  signup_failed: 'Signup failed',
  login_success: 'Login completed',
  login_failed: 'Login failed',
  profile_fallback_created: 'Profile fallback created',

  // ─── Feed / posts / video ─────────────────────────────────────
  feed_follow: 'Follow from feed',
  post_like: 'Post liked',
  post_share: 'Post shared',
  post_comment_open: 'Post comments opened',
  video_like: 'Video liked',
  video_share: 'Video shared',

  // ─── Courses / ratings ────────────────────────────────────────
  course_view: 'Course viewed',
  rating_modal_opened: 'Rating opened',
  rating_slider_changed: 'Rating slider changed',
  rating_submitted: 'Rating submitted',
  rating_submission_failed: 'Rating failed',
  rating_confirmation_viewed: 'Rating confirmation viewed',
  rating_flow_completed: 'Rating flow completed',

  // ─── Morning moment / handicap ────────────────────────────────
  morning_moment_viewed: 'Morning moment viewed',
  morning_moment_friends_tapped: 'Morning moment friends tapped',
  where_you_stand_viewed: 'Where you stand viewed',
  gender_prompt_shown: 'Gender prompt shown',
  gender_prompt_answered: 'Gender prompt answered',
  gender_prompt_skipped: 'Gender prompt skipped',
  tour_follow_prompt_shown: 'Tour follow prompt shown',
  tour_follow_prompt_answered: 'Tour follow prompt answered',
  tour_follow_prompt_skipped: 'Tour follow prompt skipped',

  streaks_section_viewed: 'Streaks section viewed',
  all_streaks_open: 'All streaks opened',
  header_handicap_chip_tapped: 'Handicap chip tapped',
  handicap_page_viewed: 'Handicap page viewed',
  friend_handicap_page_viewed: 'Friend handicap viewed',

  // ─── Echo ─────────────────────────────────────────────────────
  echo_query: 'Echo query',
  echo_message_sent: 'Echo message sent',
  echo_history_opened: 'Echo history opened',
  echo_new_conversation: 'Echo new conversation',
  echo_conversation_opened: 'Echo conversation opened',
  echo_conversation_renamed: 'Echo conversation renamed',
  echo_conversation_deleted: 'Echo conversation deleted',
  echo_stream_started: 'Echo stream started',
  echo_stream_completed: 'Echo stream completed',
  echo_stream_aborted: 'Echo stream aborted',
  echo_contextual_tap: 'Echo contextual tap',
  hub_echo_open: 'Echo hub opened',
  hub_echo_tab: 'Echo hub tab switched',
  hub_echo_history_open: 'Echo hub history opened',
  hub_echo_chat_send: 'Echo hub chat sent',

  // ─── Shorts squircle strip ────────────────────────────────────
  shorts_squircle_avatar_click: 'Shorts avatar clicked',
  shorts_squircle_name_click: 'Shorts name clicked',
  shorts_squircle_follow_toggle: 'Shorts follow toggled',
  shorts_squircle_plus_click: 'Shorts plus clicked',
  shorts_squircle_empty: 'Shorts strip empty',

  // ─── Videos tab ───────────────────────────────────────────────
  videos_tab_view: 'Videos tab viewed',
  videos_filter_change: 'Videos filter changed',

  // ─── Live Clubhouse strip ─────────────────────────────────────
  lc_strip_impression: 'Live strip impression',
  lc_strip_avatar_click: 'Live strip avatar clicked',
  lc_strip_peek_open: 'Live strip peek opened',
  lc_strip_peek_ms: 'Live strip peek dwell',
  lc_strip_nearby_open: 'Live strip nearby opened',
  lc_strip_follow_from_strip: 'Follow from live strip',

  // ─── Notifications ────────────────────────────────────────────
  notifications_opened: 'Notifications opened',
  notification_clicked: 'Notification clicked',

  // ─── Social ───────────────────────────────────────────────────
  social_follow_toggled: 'Follow toggled',
  social_friend_request_sent: 'Friend request sent',
  social_friend_request_responded: 'Friend request responded',
  social_block_changed: 'Block changed',
  social_list_viewed: 'Social list viewed',

  // ─── Messaging ────────────────────────────────────────────────
  message_sent: 'Message sent',

  // ─── Stability ────────────────────────────────────────────────
  // ─── Stability ────────────────────────────────────────────────
  app_error: 'App error',

  // ─── Admin operations ─────────────────────────────────────────
  admin_username_changed: 'Username changed by admin',
  admin_screens_viewed: 'Admin screens tab viewed',
  admin_screen_detail_opened: 'Admin screen detail opened',

  // Course card (course Holes tab, Phase L3)
  tee_card_viewed: 'Course card viewed',
  tee_card_tee_changed: 'Course card tee changed',

  // Review tee context (Phase L6)
  review_tee_selected: 'Review tee selected',
  review_tee_filter_toggled: 'Review tee filter toggled',
};

export function titleize(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

export function labelForEvent(name: string): string {
  return EVENT_LABELS[name] ?? titleize(name);
}
