/**
 * V1 hardcoded editorial copy fallbacks for Tour Hub sections.
 *
 * These are consumed when championship_editorial_daily has no row for
 * the given surface. V2 (Claude-generated) will populate the table on
 * a daily cron and this module becomes the always-on fallback.
 *
 * V1 means: ship UI immediately. V2 brief follows separately.
 *
 * NOTE: The current `championship_editorial_daily.surface` CHECK constraint
 * limits values to ('top100','global','courses','handicap'). Adding
 * 'intelligence_quote' / 'stat_of_week' / 'college_rivalry' requires a
 * migration scoped to the V2 brief. For V1, components consume these
 * constants directly without attempting a DB read.
 */

export const STAT_OF_WEEK_FALLBACK = {
  category: 'DRIVING DISTANCE',
  categoryIcon: '💪',
  bigNumber: '325',
  decimal: '.2',
  unit: 'yds',
  headlineLead: 'Aldrich Potgieter',
  headlineBody: 'is bombing it further than anyone has all season.',
  subhead:
    'The 21-year-old South African leads the field by 1.7 yards — the largest margin in any 2026 statistical category.',
  playerName: 'Aldrich Potgieter',
  playerCountry: 'South Africa',
  playerCountryCode: 'za',
  playerMeta: '21 yrs · Pro since 2023 · 1 PGA win',
  badge: 'SEASON HIGH',
  chasers: [
    { rank: 2, name: 'Rory McIlroy', value: '323.5' },
    { rank: 3, name: 'Cameron Young', value: '321.8' },
    { rank: 4, name: 'Gary Woodland', value: '320.4' },
  ],
  categories: ['Earnings', 'SG Total', 'Scoring', 'Putting', 'GIR', 'Sand'],
};

/**
 * SAFETY-ONLY fallback. Live data drives the entire rivalry section in production.
 * These generic placeholders only render if useCollegeSeasonStats returns empty/error
 * — they are intentionally obvious as placeholders, not fictional content.
 */
export const COLLEGE_RIVALRY_FALLBACK = {
  eyebrow: "🥊 THIS WEEK'S RIVALRY",
  headlineLine1: 'Loading rivalry…',
  headlineLine2: null as string | null,
  leftCollege: '—',
  leftEarnings: '$0',
  leftRecord: '— ON TOUR',
  leftCaptain: '—',
  rightCollege: '—',
  rightEarnings: '$0',
  rightRecord: '— ON TOUR',
  rightCaptain: '—',
  marginLabel: '—',
  standings: [] as Array<{ rank: number; name: string; earnings: string }>,
};

export const INTELLIGENCE_QUOTE_FALLBACK = {
  // Legacy fields (kept for back-compat with any leftover consumers)
  eventName: 'RBC Heritage',
  eventDate: 'Apr 19',
  pickName: 'Matt Fitzpatrick',
  pickResult: 'Won by 2 strokes · 21 birdies',
  pullQuote:
    '21-birdie week at −18 was a masterclass in attacking golf — and Intelligence had him as Top Pick before round one.',
  finalScore: '−18',
  seasonRecord: { wins: 4, top5: 8, accuracyPct: 67 },
  thisWeekTournament: 'Zurich Classic',
  thisWeekPicks: [
    { rank: 1, name: 'Scottie Scheffler', tier: 'Top Pick', position: '−5', positionLabel: 'T1 LIVE' },
    { rank: 2, name: 'Rory McIlroy', tier: 'Strong Contender', position: '−3', positionLabel: 'T6' },
    { rank: 3, name: 'Tommy Fleetwood', tier: 'In Contention', position: '−2', positionLabel: 'T11' },
  ],

  // ── V1 redesign — idle state ───────────────────────────────────────────────
  /**
   * "We Called It" recap reasoning. Used when no archived pre-round-one
   * reasoning exists (V1 — Flag 1 fallback path). Substitutes {winnerName}
   * if available; falls back to "the eventual winner" when name is unknown.
   *
   * NOTE: When this fallback is active, the consumer MUST NOT render the
   * "POSTED PRE-ROUND ONE" eyebrow — it would lie about provenance.
   */
  calledItReasoning:
    'Our model identified {winnerName} as Top Pick based on course fit, recent form, and historical performance at this venue.',

  /**
   * Honesty layer text — generic, never defensive. Per brief editorial voice
   * rules. Renders only when last completed result was a miss (not a win).
   */
  missNote:
    'The most recent Top Pick missed the projection — every cycle teaches us something about course conditions, model calibration, and player form.',

  /**
   * Course fit chips for the upcoming tournament's venue card. V1 fallback
   * is intentionally generic. V1.2 wires from championship_editorial_daily
   * snapshot_data.course_fit_chips.
   */
  upcomingCourseFitChips: ['Editorial pending', 'Tour course', 'Stroke play'],

  // ── V1 redesign — active state (Phase C will use these) ────────────────────
  /**
   * Inline editorial line beneath the Live Performance Band.
   */
  livePerformanceNote:
    'Tracking how our picks are performing live.',

  /**
   * "What Intelligence is watching" behind-the-scenes editorial note.
   */
  watchingNote:
    'Monitoring the field for shifts in form and course conditions.',

  /**
   * Tournament-specific headline templates. {topPick} / {position} / {contender} / {gap}
   * substitute from live leaderboard data (Phase C).
   */
  activeHeadlineTemplate: '{topPick} sits {position}.',
  activeHeadlineSubTemplate: '{contender} {gap} back.',

  /**
   * Course fit chips for the active tournament. Same V1.2 path as
   * upcomingCourseFitChips.
   */
  activeCourseFitChips: ['Editorial pending', 'Tour course', 'Stroke play'],
};

/**
 * Substitute the {winnerName} placeholder in the calledItReasoning fallback.
 * Returns the generic phrasing when name is missing.
 */
export function formatCalledItReasoningFallback(winnerName?: string | null): string {
  const phrase = INTELLIGENCE_QUOTE_FALLBACK.calledItReasoning;
  if (winnerName && winnerName.trim().length > 0) {
    return phrase.replace('{winnerName}', winnerName.trim());
  }
  return phrase.replace('{winnerName}', 'the eventual winner');
}
