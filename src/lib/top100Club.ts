// src/lib/top100Club.ts
// New unified Top 100 club tier system based on total_top100_rated

export type Top100TierId =
  | 'none'
  | 'bronze'
  | 'blue'
  | 'green'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'obsidian';

export type Top100ClubMeta = {
  threshold: number;
  shortLabel: string;   // numeric label e.g. "50 Club"
  tierName: string;     // user-facing name e.g. "Trailmaster"
  tierId: Top100TierId;
};

// Ordered lowest → highest
export const CLUB_STEPS: Top100ClubMeta[] = [
  { threshold: 5,   shortLabel: '5 Club',   tierName: 'New Member',      tierId: 'bronze'   },
  { threshold: 10,  shortLabel: '10 Club',  tierName: 'Explorer',        tierId: 'bronze'   },
  { threshold: 20,  shortLabel: '20 Club',  tierName: 'Voyager',         tierId: 'blue'     },
  { threshold: 50,  shortLabel: '50 Club',  tierName: 'Trailmaster',     tierId: 'green'    },
  { threshold: 100, shortLabel: '100 Club', tierName: 'Century Club',    tierId: 'silver'   },
  { threshold: 200, shortLabel: '200 Club', tierName: 'Clubhouse Elite', tierId: 'gold'     },
  { threshold: 300, shortLabel: '300 Club', tierName: 'Global Master',   tierId: 'platinum' },
  { threshold: 400, shortLabel: '400 Club', tierName: 'Clbhouz Legend',  tierId: 'obsidian' },
];

export type Top100ClubResult = {
  meta: Top100ClubMeta | null;
  tierId: Top100TierId;
  tierName: string | null;
  shortLabel: string | null;
  threshold: number | null;
};

export function getTop100Club(totalPlayed: number): Top100ClubResult {
  if (totalPlayed < 5) {
    return {
      meta: null,
      tierId: 'none',
      tierName: null,
      shortLabel: null,
      threshold: null,
    };
  }

  let current: Top100ClubMeta | null = null;

  for (const step of CLUB_STEPS) {
    if (totalPlayed >= step.threshold) {
      current = step;
    } else {
      break;
    }
  }

  if (!current) {
    return {
      meta: null,
      tierId: 'none',
      tierName: null,
      shortLabel: null,
      threshold: null,
    };
  }

  return {
    meta: current,
    tierId: current.tierId,
    tierName: current.tierName,
    shortLabel: current.shortLabel,
    threshold: current.threshold,
  };
}

export function getNextTop100Club(totalPlayed: number): Top100ClubMeta | null {
  for (const step of CLUB_STEPS) {
    if (totalPlayed < step.threshold) return step;
  }
  return null;
}

// Backwards compatibility export (deprecated)
export type Top100Ring = Top100TierId;
