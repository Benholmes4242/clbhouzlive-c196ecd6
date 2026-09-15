import type { StreamItem } from './streamItem';

export type ExploreCardTreatment = 'hero' | 'standard';

const HERO_CONSEQUENCES = new Set(['record_taken', 'record_lost', 'rank_up']);

/** A later card earns text-on-photo only for the explicitly ruled signals. */
export function earnsHeroTreatment(item: StreamItem): boolean {
  return (
    HERO_CONSEQUENCES.has(item.consequence?.kind ?? '') ||
    (item.facts.holes_in_one ?? 0) > 0 ||
    (item.facts.albatrosses ?? 0) > 0 ||
    (item.facts.to_par ?? 0) < 0
  );
}

/**
 * POSITIONAL HERO CAP, AFTER RANKING. The lead always wins. Later eligible
 * cards need three intervening standard cards, so every four-card window has at
 * most one hero. A blocked card is demoted in place: never deferred or dropped.
 */
export function cardTreatments(items: StreamItem[]): Map<string, ExploreCardTreatment> {
  const treatments = new Map<string, ExploreCardTreatment>();
  let sinceHero = Number.POSITIVE_INFINITY;

  items.forEach((item, index) => {
    const eligible = index === 0 || earnsHeroTreatment(item);
    const hero = eligible && sinceHero >= 3;
    treatments.set(item.id, hero ? 'hero' : 'standard');
    sinceHero = hero ? 0 : sinceHero + 1;
  });

  return treatments;
}
