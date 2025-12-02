// src/lib/top100Club.ts
// New unified Top 100 club tier system based on total_top100_rated

export type Top100TierId =
  | 'none'
  | 'rookie'
  | 'fairway'
  | 'founders'
  | 'heritage'
  | 'century'
  | 'elite'
  | 'legendary'
  | 'grandslam';

export type Top100ClubMeta = {
  threshold: number;
  shortLabel: string;   // numeric label e.g. "50 Club"
  tierName: string;     // user-facing name e.g. "Trailmaster"
  tierId: Top100TierId;
};

// Ordered lowest → highest
export const CLUB_STEPS: Top100ClubMeta[] = [
  { threshold: 5,   shortLabel: 'Rookie',     tierName: 'Rookie Club',     tierId: 'rookie'    },
  { threshold: 10,  shortLabel: 'Fairway',    tierName: 'Fairway Club',    tierId: 'fairway'   },
  { threshold: 20,  shortLabel: 'Founders',   tierName: 'Founders Club',   tierId: 'founders'  },
  { threshold: 50,  shortLabel: 'Heritage',   tierName: 'Heritage Club',   tierId: 'heritage'  },
  { threshold: 100, shortLabel: 'Century',    tierName: 'Century Club',    tierId: 'century'   },
  { threshold: 200, shortLabel: 'Elite',      tierName: 'Elite Club',      tierId: 'elite'     },
  { threshold: 300, shortLabel: 'Legendary',  tierName: 'Legendary Club',  tierId: 'legendary' },
  { threshold: 400, shortLabel: 'Grand Slam', tierName: 'Grand Slam Club', tierId: 'grandslam' },
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
