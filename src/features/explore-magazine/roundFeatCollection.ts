import type { StreamFacts } from './streamItem';

/** Explore's permanent round feats, in rarity order. */
export type ExploreRoundFeatKind = 'ace' | 'albatross' | 'eagle' | 'birdies' | 'clean';

export interface ExploreRoundFeat {
  kind: ExploreRoundFeatKind;
  count: number;
}

export type ExploreFeatTier = 'ink' | 'gold' | 'top';

const BIRDIE_HAUL = 5;

/** Collect every carried fact before applying the two-item prose/marker cap. */
export function collectRoundFeats(facts: StreamFacts): ExploreRoundFeat[] {
  const feats: ExploreRoundFeat[] = [];
  const aces = Math.max(0, Number(facts.holes_in_one ?? 0));
  const albatrosses = Math.max(0, Number(facts.albatrosses ?? 0));
  const eagles = Math.max(0, Number(facts.eagles ?? 0));
  const birdies = Math.max(0, Number(facts.birdies ?? 0));
  if (aces > 0) feats.push({ kind: 'ace', count: aces });
  if (albatrosses > 0) feats.push({ kind: 'albatross', count: albatrosses });
  if (eagles > 0) feats.push({ kind: 'eagle', count: eagles });
  if (birdies >= BIRDIE_HAUL) feats.push({ kind: 'birdies', count: birdies });
  if (facts.clean_card === true) feats.push({ kind: 'clean', count: 1 });
  return feats;
}

export function topRoundFeats(facts: StreamFacts): ExploreRoundFeat[] {
  return collectRoundFeats(facts).slice(0, 2);
}

/** Only the three named combinations may spend the top treatment. */
export function roundFeatTier(facts: StreamFacts): ExploreFeatTier {
  const aces = Math.max(0, Number(facts.holes_in_one ?? 0));
  const albatrosses = Math.max(0, Number(facts.albatrosses ?? 0));
  const eagles = Math.max(0, Number(facts.eagles ?? 0));
  if (aces >= 2 || albatrosses >= 2 || (aces >= 1 && albatrosses >= 1)) return 'top';
  if (aces === 1 || albatrosses === 1 || eagles >= 2) return 'gold';
  return 'ink';
}