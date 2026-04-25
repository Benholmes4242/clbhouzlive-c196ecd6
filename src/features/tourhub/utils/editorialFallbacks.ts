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
};

/**
 * IntelligenceHero state-specific editorial templates.
 *
 * V1 fallbacks for the deep-purple Clbhouz Intelligence card. Used when no
 * championship_editorial_daily row exists for surface = 'intelligence_hero'.
 * V2 will move these to the daily Claude pipeline.
 *
 * Each block carries an `eyebrow`, a single `headline`, and a short
 * `standfirst` line. Course fit chips are short adjectival phrases (3–4 words)
 * shown only in the upcoming state.
 */
export const INTELLIGENCE_HERO_FALLBACK = {
  live: {
    eyebrow: 'LIVE INTELLIGENCE',
    headline: 'Our picks are on the board.',
    standfirst:
      'Tracking how the board is reacting to our pre-tournament reads in real time.',
  },
  results: {
    win: {
      eyebrow: 'WE CALLED IT',
      headline: 'Top Pick wins.',
      standfirst:
        'The pre-tournament read held up — our Top Pick took the trophy.',
    },
    standings: {
      eyebrow: 'FINAL STANDINGS',
      headline: 'How our picks closed out the week.',
      standfirst:
        'Trophy went elsewhere — here is where our pre-tournament reads finished.',
    },
  },
  upcoming: {
    eyebrow: 'NEXT UP',
    headline: 'Reading the next venue.',
    standfirst:
      'Three names we like before a single ball is struck — and what the course is asking for.',
    courseFitChips: [
      'Rewards driving distance',
      'Premium on approach',
      'Greens favour bombers',
    ] as string[],
  },
};
