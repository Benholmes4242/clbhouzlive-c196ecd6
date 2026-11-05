import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { StandoutFeat } from './useStandoutFeats';
import { playDateAtLocalNoon } from '@/components/explore-tab-new/courseled/discoverWhen';

/** SAR1: one owner for scope ladder, interleaving and event-only copy/math.
 * Rounds keep standoutSentenceParts; RPC order remains untouched. */
export type StandoutScopeKey = 'county' | 'nation' | 'everyone';
export interface StandoutScopeData {
  key: StandoutScopeKey; label: string; rounds: StandoutRound[]; feats: StandoutFeat[];
}
export const scopeHasTiles = (scope: StandoutScopeData) => scope.rounds.length + scope.feats.length > 0;
export function selectStandoutScope(scopes: StandoutScopeData[], remembered: string | null) {
  return scopes.find(scope => scope.key === remembered && scopeHasTiles(scope))
    ?? scopes.find(scope => scope.rounds.length >= 4)
    ?? scopes.find(scope => scope.key === 'everyone');
}
export type StandoutTile = { kind: 'round'; row: StandoutRound } | { kind: 'feat'; row: StandoutFeat };
export function interleaveStandouts(rounds: StandoutRound[], feats: StandoutFeat[]): StandoutTile[] {
  const tiles: StandoutTile[] = [];
  for (let i = 0; i < Math.max(rounds.length, feats.length); i++) {
    const round = rounds[i]; const feat = feats[i];
    if (round) tiles.push({ kind: 'round', row: round });
    if (feat) tiles.push({ kind: 'feat', row: feat });
  }
  return tiles;
}
export function shortStandoutDate(iso: string | null, locale = 'en', now = new Date()) {
  const date = iso ? playDateAtLocalNoon(iso) : null;
  return date ? date.toLocaleDateString(locale, { month: 'short', day: 'numeric', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}) }) : '';
}
export function englishOrdinal(n: number) {
  const teen = n % 100;
  const suffix = teen >= 11 && teen <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}
export function featHeadlineParts(feat: StandoutFeat) {
  const course = feat.latest_course_name ?? '';
  const hole = feat.hole_no == null ? null : englishOrdinal(feat.hole_no);
  const defaults = {
    eagle: 'Eagle at {{course}}', albatross: 'Albatross at {{course}}',
    ace: 'Hole in one at {{course}}', clean_card: 'Not one bogey at {{course}}',
  };
  const withHole = hole && feat.feat_kind !== 'clean_card';
  const defaultValue = withHole ? feat.feat_kind === 'ace'
    ? 'Hole in one on the {{hole}} at {{course}}'
    : feat.hole_par != null && feat.hole_strokes != null ? '{{strokes}} on the par-{{par}} {{hole}} at {{course}}' : defaults[feat.feat_kind]
    : defaults[feat.feat_kind];
  return { key: `amateur.standoutShelf.feat.${feat.feat_kind}.${withHole ? 'hole' : 'course'}`, defaultValue, course, hole, strokes: feat.hole_strokes, par: feat.hole_par };
}
export function featRarity(feat: StandoutFeat): number | null {
  return feat.year_events != null && feat.year_events > 0 && feat.year_denominator != null
    ? Math.round(feat.year_denominator / feat.year_events) : null;
}