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
 * Seeded 7 Sep 2026 from the first full triage of the 37 events flagged stopped
 * over the 30-day window. Verified by grepping each name across src/.
 */
export const RETIRED_EVENTS: Record<string, string> = {
  // Feed: the Clubhouse feed no longer has switchable tabs — activeTab is the
  // constant FEED_TAB, so the emitting effect can never fire again.
  feed_tab_switch: 'Clubhouse feed tabs removed; activeTab is a constant (Sep 2026)',
  feed_tab_changed: 'Superseded by feed_tab_switch, then removed with the tabs (Sep 2026)',
  feed_course_line_shown: 'Feed course line removed in the course-led rebuild (Aug 2026)',

  // Amateur/Discover cinematic hero: AmateurCircuitHero is left in the tree
  // unreferenced — ExplorePage starts at the first rail.
  hero_chips_shown: 'AmateurCircuitHero unmounted from ExplorePage (Aug 2026)',
  hero_story_shown: 'AmateurCircuitHero unmounted from ExplorePage (Aug 2026)',
  hero_context_shown: 'AmateurCircuitHero unmounted from ExplorePage (Aug 2026)',

  // Discover rebuild: wire ticker, feats tab, scope switcher and month/rarest
  // affordances were all replaced by the board rails.
  discover_feats_tab: 'Discover feats tab replaced by board rails (Aug 2026)',
  discover_scope_changed: 'Discover scope switcher replaced by board chips (Aug 2026)',
  discover_wire_row_tapped: 'Discover wire ticker retired (Aug 2026)',
  discover_wire_scroll_depth: 'Discover wire ticker retired (Aug 2026)',
  discover_month_expanded: 'Discover month accordion removed in the rebuild (Aug 2026)',
  discover_rarest_tapped: 'Discover rarest tile removed in the rebuild (Aug 2026)',

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

  // Misc call sites deleted with their surfaces.
  header_handicap_chip_tapped: 'Handicap chip removed from the profile header (Jul 2026)',
  course_holes_expanded: 'Hole accordion replaced by the analytical hole rows (Aug 2026)',
  comment_submitted: 'Superseded by the comments_v2 instrumentation (Jul 2026)',
  admin_username_changed: 'Admin username editor moved to admin-v2 audit log (Jul 2026)',

  // NOT retired-by-choice, retired-by-accident, and kept here deliberately so
  // it is not re-alarmed every period while the decision is open:
  // the sheet still exists as ProfileSheetV2, but the v2 rewrite did not carry
  // the open event across. Re-instrument the v2 sheet and delete this line.
  profile_hub_sheet_opened: 'Instrumentation lost in the ProfileSheetV2 rewrite — re-add and delete this line (Jul 2026)',
};

export function retiredReason(name: string): string | null {
  return RETIRED_EVENTS[name] ?? null;
}
