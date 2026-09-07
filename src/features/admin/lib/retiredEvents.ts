/**
 * RETIRED ANALYTICS EVENTS — a recorded decision, not a filter.
 *
 * An event listed here is permanently suppressed from the "stopped firing"
 * alarm on Admin > Analytics > Events. It still appears in the table, and its
 * figures are still real; it simply never raises an alarm again, because its
 * emitting code no longer exists or can no longer be reached.
 *
 * This is a LIST, in the codebase, with a reason per line, so that suppression
 * is auditable. Anyone who later wonders "why is this event silent and not
 * flagged?" gets the answer here rather than mistaking the filter for a bug.
 *
 * RULES
 *  - Add an event ONLY after confirming the emitting call site is gone or
 *    unreachable (deleted component, flag flipped, route retired).
 *  - One line, one reason, dated.
 *  - If the feature comes back, DELETE the line. Do not comment it out.
 *
 * A live surface whose emit was lost in a rewrite is NOT retired — it belongs
 * in instrumentationGaps.ts, which renders its own badge. Silenced and
 * forgotten are different states and this file must only hold the first.
 *
 * Seeded 7 Sep 2026 from the first full triage of the 37 events flagged stopped
 * over the 30-day window. Verified by grepping each name across src/.
 */
export const RETIRED_EVENTS: Record<string, string> = {
  // Feed: the Clubhouse feed no longer has switchable tabs — activeTab is the
  // constant FEED_TAB, so the emitting effect can never fire again.
  feed_tab_switch: 'Clubhouse feed tabs removed; activeTab is a constant (Sep 2026)',
  feed_tab_changed: 'Superseded by feed_tab_switch, then removed with the tabs (Sep 2026)',
  feed_course_line_shown: 'Feed course line removed in the course-led rebuild (Aug 2026)',

  // Amateur/Discover cinematic hero: AmateurCircuitHero.tsx was DELETED
  // (Sep 2026, Ben's verdict). Discover opens on its first rail by design and
  // a rotating story hero is not returning in that form.
  hero_chips_shown: 'AmateurCircuitHero deleted from the codebase (Sep 2026)',
  hero_story_shown: 'AmateurCircuitHero deleted from the codebase (Sep 2026)',
  hero_context_shown: 'AmateurCircuitHero deleted from the codebase (Sep 2026)',

  // Community page: /community was deleted and App.tsx redirects it to
  // /explore. Only community_media_filter_selected survives, because those
  // media tiles moved onto Discover.
  community_page_open: '/community deleted; route redirects to /explore (Aug 2026)',
  community_moment_tapped: '/community deleted; moments now live on Watch (Aug 2026)',


  // Discover rebuild: wire ticker, feats tab, scope switcher and month/rarest
  // affordances were all replaced by the board rails.
  discover_feats_tab: 'Discover feats tab replaced by board rails (Aug 2026)',
  discover_scope_changed: 'Discover scope switcher replaced by board chips (Aug 2026)',
  discover_wire_row_tapped: 'Discover wire ticker retired (Aug 2026)',
  discover_wire_scroll_depth: 'Discover wire ticker retired (Aug 2026)',
  discover_month_expanded: 'Discover month accordion removed in the rebuild (Aug 2026)',
  discover_rarest_tapped: 'Discover rarest tile removed in the rebuild (Aug 2026)',

  // Discover rails rebuilt: neither name has an emitter anywhere in src/ any
  // more (grepped 7 Sep 2026). Ben's verdict: rails rebuilt, retire both.
  discover_creator_card_tapped: 'Discover rails rebuilt; no emitter remains in src/ (Sep 2026)',
  discover_most_played_row_tapped: 'Discover rails rebuilt; no emitter remains in src/ (Sep 2026)',

  // Morning moment: replaced by the community moments surface.
  morning_moment_viewed: 'Morning moment card retired; community moments took over (Aug 2026)',
  morning_moment_friends_tapped: 'Morning moment card retired (Aug 2026)',

  // Watch: WATCH_SURFACE flipped false -> true, so the redirect stub no longer
  // runs. This one stopping is the flag working exactly as designed.
  watch_redirect_hit: 'WATCH_SURFACE enabled; redirect stub no longer reached (Aug 2026)',

  // Top 100 progress: Top100ProgressPanel and Top100ListProgressSheet have no
  // remaining consumer anywhere in src/.
  top100_progress_opened: 'Top100ListProgressSheet has no consumer (Aug 2026)',
  top100_progress_segment: 'Top100ListProgressSheet has no consumer (Aug 2026)',
  t100_progress_empty_shown: 'Top100ProgressPanel has no consumer (Aug 2026)',

  // Tour follow prompt: the prompt was removed from the Tour hub rebuild.
  tour_follow_prompt_shown: 'Tour follow prompt removed in the Tour hub rebuild (Aug 2026)',
  tour_follow_prompt_answered: 'Tour follow prompt removed (Aug 2026)',
  tour_follow_prompt_skipped: 'Tour follow prompt removed (Aug 2026)',
  tour_players_this_week_shown: 'Players-this-week strip replaced by Live Right Now (Aug 2026)',

  // Course tee card: CourseTeeCard.tsx was DELIBERATELY replaced by the
  // analytical Course card (CourseCardPanel) on 6 Aug 2026 and DELETED in Sep
  // 2026. Tee selection is alive there; the pick is now course_card_tee_changed.
  tee_card_viewed: 'CourseTeeCard replaced by CourseCardPanel (6 Aug 2026), file deleted (Sep 2026)',
  tee_card_expanded: 'CourseTeeCard replaced by CourseCardPanel; the new card has no collapse (Aug 2026)',
  tee_card_tee_changed: 'Re-instrumented as course_card_tee_changed on CourseCardPanel (Sep 2026)',

  // Misc call sites deleted with their surfaces.
  header_handicap_chip_tapped: 'Handicap chip removed from the profile header (Jul 2026)',
  course_holes_expanded: 'Hole accordion replaced by the analytical hole rows (Aug 2026)',
  comment_submitted: 'Superseded by the comments_v2 instrumentation (Jul 2026)',
  admin_username_changed: 'Admin username editor moved to admin-v2 audit log (Jul 2026)',

};

export function retiredReason(name: string): string | null {
  return RETIRED_EVENTS[name] ?? null;
}
