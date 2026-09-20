import type { TFunction } from 'i18next';

import { roundFeatTier, type ExploreFeatTier } from './roundFeatCollection';
import { standingOrdinal } from './ordinal';

/**
 * FEAT RARITY LINES — ONE MODULE, EVERY SURFACE.
 *
 * The frozen figures come from public.gam_round_feat_rarity, written ONLY by
 * gam-evaluator under the service role. The three member_* figures come from
 * get_round_feat_lines, which NULLs them for anyone who is not the round's owner
 * in SQL; the frozen figures on that same function are ungated, because the
 * viewer line is public. Nothing here recomputes either set, and nothing here invents a
 * count so that a line renders in development: no data, no line.
 *
 * ONLY GOLD AND TOP FEATS GET LINES. The tier comes from roundFeatTier, the
 * function E2 already settled; this module introduces no second threshold.
 */

export type RarityFeatKind = 'ace' | 'albatross' | 'eagle_brace';

export const RARITY_FEAT_KINDS: RarityFeatKind[] = ['ace', 'albatross', 'eagle_brace'];

export function isRarityFeatKind(kind: string | null | undefined): kind is RarityFeatKind {
  return kind === 'ace' || kind === 'albatross' || kind === 'eagle_brace';
}

/** A row of gam_round_feat_rarity, exactly as selected. */
export interface FeatRarityRow {
  feat_kind: string;
  global_ordinal: number | null;
  total_rounds_at_detection: number | null;
  distinct_members_at_detection: number | null;
}

/** The member half of get_round_feat_lines. NULL for non-owners. */
export interface FeatOwnerRow {
  whs_score_id?: string;
  feat_kind: string;
  is_owner: boolean | null;
  member_ordinal: number | null;
  member_rounds: number | null;
  member_prev_at: string | null;
}

/** The counts the round itself carries, used only to read the E2 tier. */
export interface RarityFeatCounts {
  aces?: number | null;
  albatrosses?: number | null;
  eagles?: number | null;
}

export function rarityFeatTier(kind: RarityFeatKind, counts?: RarityFeatCounts): ExploreFeatTier {
  const aces = Math.max(1, Number(counts?.aces ?? 1));
  const albatrosses = Math.max(1, Number(counts?.albatrosses ?? 1));
  const eagles = Math.max(2, Number(counts?.eagles ?? 2));
  if (kind === 'ace') return roundFeatTier({ holes_in_one: aces });
  if (kind === 'albatross') return roundFeatTier({ albatrosses });
  return roundFeatTier({ eagles });
}

const TIER_RANK: Record<ExploreFeatTier, number> = { ink: 0, gold: 1, top: 2 };

/**
 * ONE LINE PER ROUND, NEVER TWO. A hole in one on a par 4 is both an ace and an
 * albatross and both rows are stored; the display layer picks the higher E2 tier
 * and, at equal tier, the LOWER global ordinal, because fewer of that feat have
 * ever happened and it is therefore the rarer claim.
 */
export function chooseRarityFeat(
  rows: FeatRarityRow[] | null | undefined,
  counts?: RarityFeatCounts,
): FeatRarityRow | null {
  const usable = (rows ?? []).filter((row) => isRarityFeatKind(row.feat_kind));
  if (usable.length === 0) return null;
  return usable.reduce((best, row) => {
    const bestTier = TIER_RANK[rarityFeatTier(best.feat_kind as RarityFeatKind, counts)];
    const rowTier = TIER_RANK[rarityFeatTier(row.feat_kind as RarityFeatKind, counts)];
    if (rowTier !== bestTier) return rowTier > bestTier ? row : best;
    const bestOrd = best.global_ordinal ?? Number.MAX_SAFE_INTEGER;
    const rowOrd = row.global_ordinal ?? Number.MAX_SAFE_INTEGER;
    return rowOrd < bestOrd ? row : best;
  });
}

/** Ordinal WORDS to tenth, numerals from 11th. */
export function rarityOrdinal(value: number, locale: string, t: TFunction<'courses'>): string {
  if (value >= 1 && value <= 10) {
    const fallbacks = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    return t(`featRarity.ord.${value}` as never, fallbacks[value - 1]) as string;
  }
  return standingOrdinal(value, locale);
}

function nameOf(kind: RarityFeatKind, t: TFunction<'courses'>): string {
  switch (kind) {
    case 'ace':
      return t('featRarity.name.ace', 'ace');
    case 'albatross':
      return t('featRarity.name.albatross', 'albatross');
    case 'eagle_brace':
      return t('featRarity.name.eagleBrace', 'eagle brace');
  }
}

/** Bare month inside the current calendar year, month and year before that. */
export function rarityWhen(iso: string, locale: string, now: Date = new Date()): string | null {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  const sameYear = when.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(when);
}

export interface FeatRarityLines {
  /** Everyone sees this. Null when either frozen figure is missing. */
  viewerLine: string | null;
  /** The round's owner only. Null when nothing resolves. */
  ownerLine: string | null;
  /** The chosen feat, for the tag rename and instrumentation. */
  kind: RarityFeatKind | null;
}

export const NO_FEAT_RARITY_LINES: FeatRarityLines = { viewerLine: null, ownerLine: null, kind: null };

/** A congratulations name must read as a human first name, never a handle. */
export function congratulationName(displayName: string | null | undefined): string | null {
  const first = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  if (first.length <= 1 || /[\d._@]/.test(first)) return null;
  return first;
}

export function featRarityLines({
  rows,
  owner,
  counts,
  t,
  locale,
  ownerDisplayName,
  now,
}: {
  rows: FeatRarityRow[] | null | undefined;
  owner: FeatOwnerRow[] | null | undefined;
  counts?: RarityFeatCounts;
  t: TFunction<'courses'>;
  locale: string;
  ownerDisplayName?: string | null;
  now?: Date;
}): FeatRarityLines {
  const row = chooseRarityFeat(rows, counts);
  if (!row) return NO_FEAT_RARITY_LINES;
  const kind = row.feat_kind as RarityFeatKind;
  const feat = nameOf(kind, t);
  const num = (n: number) => n.toLocaleString(locale);

  /* THE VIEWER LINE. Both figures or nothing — never a partial sentence. */
  const ordinal = row.global_ordinal;
  const rounds = row.total_rounds_at_detection;
  const viewerLine = ordinal != null && ordinal > 0 && rounds != null && rounds > 0
    ? t('featRarity.viewer', 'The {{ord}} {{feat}} in {{rounds}} rounds.', {
        ord: rarityOrdinal(ordinal, locale, t),
        feat,
        rounds: num(rounds),
      })
    : null;

  /* THE OWNER STRIP. FIRST MATCH WINS, and REPEAT outranks everything: a member
     who has done it twice is never told again that they were the first. */
  const mine = (owner ?? []).find((o) => o.feat_kind === row.feat_kind && o.is_owner === true) ?? null;
  const members = row.distinct_members_at_detection;
  let ownerLine: string | null = null;
  let ownerBranch: 'Repeat' | 'RareTwo' | 'RareThree' | 'Sole' | 'First' | null = null;
  if (mine) {
    const repeat = mine.member_ordinal != null && mine.member_ordinal > 1;
    const when = repeat && mine.member_prev_at ? rarityWhen(mine.member_prev_at, locale, now) : null;
    if (repeat && when) {
      ownerBranch = 'Repeat';
      ownerLine = t('featRarity.ownerRepeat', 'Your {{ord}} {{feat}}. First since {{when}}.', {
        ord: rarityOrdinal(mine.member_ordinal as number, locale, t),
        feat,
        when,
      });
    } else if (!repeat && members === 2) {
      ownerBranch = 'RareTwo';
      ownerLine = t('featRarity.ownerRareTwo', 'One of the first two members to do this.');
    } else if (!repeat && members === 3) {
      ownerBranch = 'RareThree';
      ownerLine = t('featRarity.ownerRareThree', 'One of the first three members to do this.');
    } else if (!repeat && members === 1) {
      ownerBranch = 'Sole';
      ownerLine = t('featRarity.ownerSole', 'The first member ever to do this.');
    } else if (!repeat && members != null && members >= 4 && mine.member_rounds != null && mine.member_rounds > 0) {
      ownerBranch = 'First';
      ownerLine = t('featRarity.ownerFirst', 'Your first {{feat}}. {{rounds}} rounds in.', {
        feat,
        rounds: num(mine.member_rounds),
      });
    }
  }

  const firstName = congratulationName(ownerDisplayName);
  if (ownerLine && ownerBranch && firstName) {
    ownerLine = t(`featRarity.owner${ownerBranch}Congrats` as never, '{{line}} — congrats, {{name}}', {
      line: ownerLine,
      name: firstName,
    });
  }

  return { viewerLine, ownerLine, kind };
}
