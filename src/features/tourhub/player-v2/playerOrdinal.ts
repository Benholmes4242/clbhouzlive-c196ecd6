import type { TFunction } from 'i18next';

export interface PlayerRankRef {
  rank: number;
  tied: boolean;
}

/** One locale-aware ordinal implementation for every player-v2 rank. */
export function playerOrdinal(t: TFunction, ref: PlayerRankRef): string {
  const n = ref.rank;
  const mod100 = n % 100;
  const suffixKey =
    mod100 >= 11 && mod100 <= 13
      ? 'th'
      : n % 10 === 1
        ? 'st'
        : n % 10 === 2
          ? 'nd'
          : n % 10 === 3
            ? 'rd'
            : 'th';
  const ordinal = t(`player.stats.ordinal.${suffixKey}`, { n });
  return ref.tied ? t('player.stats.ordinalTied', { ordinal }) : ordinal;
}