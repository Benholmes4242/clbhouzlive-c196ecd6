/**
 * syntheticCourseDNA.ts — Heuristic Course DNA profile generator.
 *
 * Used when no historical DNA is available for a venue. Classifies the course
 * by physical attributes (par, yardage, major status) and returns importance
 * weights that match a standard archetype. The downstream calculator turns
 * these weights + each player's percentile stats into real, varied per-player
 * fit scores.
 *
 * Real historical DNA always takes precedence — this is a fallback, not a
 * replacement. When real DNA becomes available for a venue, it overrides this
 * synthetic profile automatically on next prediction regeneration.
 */

import type { CourseDNAProfile } from './courseFitCalculator.ts';

export type CourseArchetype =
  | 'bombers_paradise'
  | 'precision_track'
  | 'major_setup'
  | 'pitchers_paradise'
  | 'balanced';

interface SyntheticInput {
  venueName: string;
  par: number | null;
  yardage: number | null;
  isMajor?: boolean;
}

export function classifyVenue(input: SyntheticInput): CourseArchetype {
  const { par, yardage, isMajor } = input;

  if (isMajor) return 'major_setup';
  if (yardage == null) return 'balanced';

  if (yardage >= 7500) return 'bombers_paradise';
  if (par === 71 && yardage >= 7400) return 'bombers_paradise';
  if (par === 70 && yardage <= 7300) return 'precision_track';
  if (par === 72 && yardage < 7200) return 'pitchers_paradise';

  return 'balanced';
}

const ARCHETYPE_WEIGHTS: Record<CourseArchetype, Omit<CourseDNAProfile, 'venueName' | 'avgWinningScore' | 'courseType'>> = {
  bombers_paradise: {
    drivingDistanceImportance: 25,
    drivingAccuracyImportance: 5,
    girImportance: 10,
    scramblingImportance: 5,
    puttingImportance: 10,
    sgOffTeeImportance: 20,
    sgApproachImportance: 10,
    sgAroundGreenImportance: 5,
    sgPuttingImportance: 10,
  },
  precision_track: {
    drivingDistanceImportance: 5,
    drivingAccuracyImportance: 20,
    girImportance: 15,
    scramblingImportance: 15,
    puttingImportance: 10,
    sgOffTeeImportance: 5,
    sgApproachImportance: 20,
    sgAroundGreenImportance: 5,
    sgPuttingImportance: 5,
  },
  major_setup: {
    drivingDistanceImportance: 10,
    drivingAccuracyImportance: 15,
    girImportance: 10,
    scramblingImportance: 15,
    puttingImportance: 15,
    sgOffTeeImportance: 5,
    sgApproachImportance: 15,
    sgAroundGreenImportance: 5,
    sgPuttingImportance: 10,
  },
  pitchers_paradise: {
    drivingDistanceImportance: 5,
    drivingAccuracyImportance: 10,
    girImportance: 15,
    scramblingImportance: 25,
    puttingImportance: 15,
    sgOffTeeImportance: 5,
    sgApproachImportance: 10,
    sgAroundGreenImportance: 10,
    sgPuttingImportance: 5,
  },
  balanced: {
    drivingDistanceImportance: 10,
    drivingAccuracyImportance: 10,
    girImportance: 12,
    scramblingImportance: 12,
    puttingImportance: 12,
    sgOffTeeImportance: 10,
    sgApproachImportance: 12,
    sgAroundGreenImportance: 10,
    sgPuttingImportance: 12,
  },
};

export function buildSyntheticCourseDNA(input: SyntheticInput): CourseDNAProfile {
  const archetype = classifyVenue(input);
  const weights = ARCHETYPE_WEIGHTS[archetype];

  return {
    venueName: input.venueName,
    courseType: archetype,
    avgWinningScore: null,
    ...weights,
  };
}

export function isMajorTournament(tournamentName: string): boolean {
  const name = (tournamentName || '').toLowerCase();
  return (
    name.includes('masters') ||
    name.includes('pga championship') ||
    name.includes('u.s. open') ||
    name.includes('us open') ||
    name.includes('open championship') ||
    name.includes('the open')
  );
}
