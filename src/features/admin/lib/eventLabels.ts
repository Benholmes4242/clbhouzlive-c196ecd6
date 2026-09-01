// Shared plain-English labels for raw analytics_events names.
// Sourced by grepping track('...') callsites across src/. Consumed by
// the Live stream (AnalyticsPage Live tab) and the Events explorer.
// Unmapped names fall through to `titleize(name)`.

export const EVENT_LABELS: Record<string, string> = {
  // ─── App lifecycle / navigation ───────────────────────────────
  session_start: 'Session started',
  page_view: 'Page viewed',
  onboarding_nudge_opened: 'Onboarding nudge opened',
  page_exit: 'Page exited',
  nav_tab_tap: 'Nav tab tapped',
  feed_tab_switch: 'Feed tab switched',
  nav_discover_opened: 'Discover opened from nav',
  discover_review_tile_tap: 'Discover review tile tapped',
  discover_reviews_sheet_open: 'Discover latest reviews sheet opened',
  watch_redirect_hit: 'Dormant Watch route redirected',

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
  course_tab_viewed: 'Course tab viewed',
  course_holes_expanded: 'Course hole table expanded',
  course_record_book_opened: 'Course record book opened',
  course_you_empty_shown: 'Course You tab empty state shown',
  course_connect_cta_tapped: 'Course connect handicap tapped',
  hole_photo_cta_shown: 'Hole photo prompt shown',
  hole_photo_submitted: 'Hole photo submitted',
  hole_photo_submit_failed: 'Hole photo submission failed',
  hole_photo_approved: 'Hole photo approved',
  hole_photo_rejected: 'Hole photo rejected',
  hole_photo_replaced: 'Hole photo replaced',
  feed_course_line_shown: 'Feed course line shown',
  feed_course_line_tapped: 'Feed course line tapped',
  course_band_tapped: 'Course band tapped',
  hero_blurb_shown: 'Courses hero blurb shown',
  hero_fact_shown: 'Courses hero course fact shown',
  hero_view_course: 'Courses hero view course',
  hero_story_shown: 'Discover hero story shown',
  hero_chips_shown: 'Discover hero chips shown',

  course_sheet_opened: 'Course stats sheet opened',
  course_sheet_view_course: 'Course stats sheet view course',
  course_hero_stats_shown: 'Course hero stat band shown',
  course_hero_stats_tapped: 'Course hero stat band tapped',
  post_round_attach_opened: 'Post round attach opened',
  post_round_attached: 'Post round attached',
  post_round_detached: 'Post round detached',

  // ─── Post composer funnel ─────────────────────────────────────
  post_composer_opened: 'Post composer opened',
  post_media_added: 'Post media added',
  post_caption_started: 'Post caption started',
  post_detail_opened: 'Post detail row opened',
  post_draft_saved: 'Post draft saved',
  post_composer_abandoned: 'Post composer abandoned',
  post_submitted: 'Post submitted',

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

  // Stat browse (courses explore tab)
  stat_browse_viewed: 'Stat browse viewed',
  stat_browse_lens_changed: 'Stat browse lens changed',
  stat_browse_country_changed: 'Stat browse country changed',
  stat_browse_region_changed: 'Stat browse region changed',
  stat_browse_course_opened: 'Stat browse course opened',
  stat_browse_empty_shown: 'Stat browse empty state shown',
  stat_browse_connect_tapped: 'Stat browse connect handicap tapped',
  stat_browse_directory_opened: 'Stat browse directory opened',
  stat_browse_scroll_depth: 'Stat browse scroll depth',
  course_directory_searched: 'Course directory searched',
  course_directory_result_tapped: 'Course directory result tapped',
  course_directory_request_opened: 'Course directory request opened',
  course_directory_recent_rated_tapped: 'Course directory recently-rated tapped',

  // Review tee context (Phase L6)
  review_tee_selected: 'Review tee selected',
  review_tee_filter_toggled: 'Review tee filter toggled',

  // Review wizard (three-step composer)
  review_wizard_opened: 'Review wizard opened',
  review_wizard_abandoned: 'Review wizard abandoned',
  review_step_viewed: 'Review step viewed',
  review_step_completed: 'Review step completed',
  review_submitted: 'Review submitted',
  review_removed: 'Review removed',

  review_receipt_viewed: 'Review receipt viewed',
  review_receipt_action: 'Review receipt action tapped',
  review_next_course_tapped: 'Review next course tapped',

  // Clubhouse feed tab toggle (pre-removal measurement)
  feed_tab_changed: 'Feed tab changed',
  feed_tab_viewed: 'Feed tab viewed',

  // Profile hero + Top 10 rail
  profile_hero_stat_tap: 'Profile hero stat tapped',
  profile_top10_card_tap: 'Profile Top 10 card tapped',

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
