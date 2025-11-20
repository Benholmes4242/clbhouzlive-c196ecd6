import { Top100Membership } from '@/hooks/useFriendsCourses';

export interface RankingData {
  globalRank: number | null;
  regionalRank: number | null;
  usaRank: number | null;
  isTop100: boolean;
}

/**
 * Extracts global, regional, and USA ranks from Top 100 memberships
 * This is the single source of truth for rankings across the app
 */
export function extractRanksFromMemberships(
  memberships: Top100Membership[],
  country?: string | null
): RankingData {
  if (!memberships || memberships.length === 0) {
    return {
      globalRank: null,
      regionalRank: null,
      usaRank: null,
      isTop100: false,
    };
  }

  let globalRank: number | null = null;
  let regionalRank: number | null = null;
  let usaRank: number | null = null;

  for (const membership of memberships) {
    switch (membership.list_slug) {
      case 'global':
      case 'global-top-100':
        globalRank = membership.rank;
        break;
      case 'usa':
      case 'usa-top-100':
        usaRank = membership.rank;
        break;
      case 'gb-i':
      case 'gb-i-top-100':
      case 'europe':
      case 'europe-top-100':
        regionalRank = membership.rank;
        break;
    }
  }

  return {
    globalRank,
    regionalRank,
    usaRank,
    isTop100: globalRank !== null && globalRank <= 100,
  };
}
