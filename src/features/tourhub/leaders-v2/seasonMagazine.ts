import type { LeaderCategoryDef, LeaderRow } from './data/useLeaderCategories';

export const SEASON_SUBJECT_THRESHOLD = 0.25;

export type SeasonSubject =
  | { kind: 'player'; player: LeaderRow; marginRatio: number }
  | { kind: 'race'; player: null; marginRatio: number };

export interface SeasonMagazineSelection {
  subject: SeasonSubject;
  race: LeaderCategoryDef;
  oneNumber: LeaderCategoryDef | null;
  duel: LeaderCategoryDef | null;
  tiedList: LeaderCategoryDef | null;
  reduced: boolean;
}

function normalizedGap(category: LeaderCategoryDef): number {
  const [first, second] = category.rows;
  if (!first || !second) return Number.POSITIVE_INFINITY;
  const scale = Math.max(Math.abs(first.value), Math.abs(second.value), 0.0001);
  return Math.abs(first.value - second.value) / scale;
}

export function resolveSeasonSubject(points: LeaderCategoryDef): SeasonSubject {
  const [first, second] = points.rows;
  const marginRatio = first && second && first.value > 0
    ? (first.value - second.value) / first.value
    : 0;
  return marginRatio > SEASON_SUBJECT_THRESHOLD && first
    ? { kind: 'player', player: first, marginRatio }
    : { kind: 'race', player: null, marginRatio };
}

/**
 * Selects the evidence modules from measured categories only. Player appearances
 * are reserved in page order, so no player can be named in more than two modules.
 */
export function selectSeasonMagazine(categories: LeaderCategoryDef[]): SeasonMagazineSelection | null {
  const race = categories.find((category) => category.key === 'points');
  if (!race || race.rows.length < 2) return null;

  const subject = resolveSeasonSubject(race);
  const appearances = new Map<string, number>();
  const reserve = (rows: LeaderRow[]): boolean => {
    const ids = [...new Set(rows.map((row) => row.playerId).filter(Boolean))];
    if (ids.some((id) => (appearances.get(id) ?? 0) >= 2)) return false;
    ids.forEach((id) => appearances.set(id, (appearances.get(id) ?? 0) + 1));
    return true;
  };

  if (subject.kind === 'player') reserve([subject.player]);
  reserve(race.rows.slice(0, 4));

  const oneNumberCandidates = categories
    .filter((category) => !['points', 'earnings', 'wins', 'world_rank'].includes(category.key))
    .filter((category) => category.rows.length >= 2)
    .sort((a, b) => {
      const aCount = appearances.get(a.rows[0]?.playerId ?? '') ?? 0;
      const bCount = appearances.get(b.rows[0]?.playerId ?? '') ?? 0;
      return aCount - bCount || normalizedGap(b) - normalizedGap(a);
    });
  const oneNumber = oneNumberCandidates.find((category) => reserve(category.rows.slice(0, 1))) ?? null;

  const duelCandidates = categories
    .filter((category) => category.picturableGap && !['points', 'earnings'].includes(category.key))
    .filter((category) => category.rows.length >= 2 && normalizedGap(category) <= category.duelGapLimit)
    .sort((a, b) => normalizedGap(a) - normalizedGap(b));
  const duel = duelCandidates.find((category) => reserve(category.rows.slice(0, 2))) ?? null;

  const tiedCandidates = categories
    .filter((category) => category.rows.filter((row) => row.rank === 1).length >= 2)
    .filter((category) => category.key !== 'earnings');
  const tiedList = tiedCandidates.find((category) => reserve(category.rows.slice(0, 3))) ?? null;

  const moduleCount = 2 + Number(Boolean(oneNumber)) + Number(Boolean(duel)) + Number(Boolean(tiedList));
  return { subject, race, oneNumber, duel, tiedList, reduced: moduleCount < 3 };
}

export function playerAppearanceCounts(selection: SeasonMagazineSelection): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (rows: LeaderRow[]) => rows.forEach((row) => {
    if (row.playerId) counts.set(row.playerId, (counts.get(row.playerId) ?? 0) + 1);
  });
  if (selection.subject.kind === 'player') add([selection.subject.player]);
  add(selection.race.rows.slice(0, 4));
  if (selection.oneNumber) add(selection.oneNumber.rows.slice(0, 1));
  if (selection.duel) add(selection.duel.rows.slice(0, 2));
  if (selection.tiedList) add(selection.tiedList.rows.slice(0, 3));
  return counts;
}