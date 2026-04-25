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

export const COLLEGE_RIVALRY_FALLBACK = {
  eyebrow: "🥊 THIS WEEK'S RIVALRY",
  headlineLine1: 'Texas leads.',
  headlineLine2: 'Georgia is closing.',
  leftCollege: 'Texas',
  leftEarnings: '$13.2M',
  leftRecord: '1 WIN · 13 ON TOUR',
  leftCaptain: 'Scottie Scheffler',
  rightCollege: 'Georgia',
  rightEarnings: '$11.0M',
  rightRecord: '0 WINS · 17 ON TOUR',
  rightCaptain: 'Sepp Straka',
  marginLabel: '−$2.2M',
  standings: [
    { rank: 1, name: 'Texas', earnings: '$13.2M' },
    { rank: 2, name: 'Georgia', earnings: '$11.0M' },
    { rank: 3, name: 'Northwestern', earnings: '$9.8M' },
    { rank: 4, name: 'California', earnings: '$8.4M' },
    { rank: 5, name: 'Wake Forest', earnings: '$7.9M' },
  ],
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
