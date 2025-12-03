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

// Glass intensity presets for badge styling
export const glassIntensity = {
  subtle: 0.16,   // very light, almost clear
  standard: 0.22, // recommended default
  vivid: 0.32,    // stronger colour
};

export type Top100ClubMeta = {
  threshold: number;
  shortLabel: string;   // numeric label e.g. "50 Club"
  tierName: string;     // user-facing name e.g. "Trailmaster"
  tierId: Top100TierId;
  ringColor: string;    // hex colour for ring and badge
  glassIntensity: number; // opacity for glass badge effect
};

// Ordered lowest → highest
export const CLUB_STEPS: Top100ClubMeta[] = [
  { threshold: 5,   shortLabel: 'Rookie',     tierName: 'Rookie Club',     tierId: 'rookie',    ringColor: '#C9B27A', glassIntensity: glassIntensity.subtle },
  { threshold: 10,  shortLabel: 'Fairway',    tierName: 'Fairway Club',    tierId: 'fairway',   ringColor: '#7CC66B', glassIntensity: glassIntensity.standard },
  { threshold: 20,  shortLabel: 'Founders',   tierName: 'Founders Club',   tierId: 'founders',  ringColor: '#2F7D32', glassIntensity: glassIntensity.standard },
  { threshold: 50,  shortLabel: 'Heritage',   tierName: 'Heritage Club',   tierId: 'heritage',  ringColor: '#D8A546', glassIntensity: glassIntensity.vivid },
  { threshold: 100, shortLabel: 'Century',    tierName: 'Century Club',    tierId: 'century',   ringColor: '#4A4A4A', glassIntensity: glassIntensity.standard },
  { threshold: 200, shortLabel: 'Elite',      tierName: 'Elite Club',      tierId: 'elite',     ringColor: '#6F5BD5', glassIntensity: glassIntensity.vivid },
  { threshold: 300, shortLabel: 'Legendary',  tierName: 'Legendary Club',  tierId: 'legendary', ringColor: '#B153CE', glassIntensity: glassIntensity.vivid },
  { threshold: 400, shortLabel: 'Grand Slam', tierName: 'Grand Slam Club', tierId: 'grandslam', ringColor: '#111111', glassIntensity: glassIntensity.standard },
];

// Lookup map for quick access by tierId
export const TIER_BY_ID: Record<Top100TierId, Top100ClubMeta | null> = {
  none: null,
  rookie: CLUB_STEPS[0],
  fairway: CLUB_STEPS[1],
  founders: CLUB_STEPS[2],
  heritage: CLUB_STEPS[3],
  century: CLUB_STEPS[4],
  elite: CLUB_STEPS[5],
  legendary: CLUB_STEPS[6],
  grandslam: CLUB_STEPS[7],
};

export type Top100ClubResult = {
  meta: Top100ClubMeta | null;
  tierId: Top100TierId;
  tierName: string | null;
  shortLabel: string | null;
  threshold: number | null;
  ringColor: string;
  glassIntensity: number;
};

// Default fallback colour for 'none' tier
const DEFAULT_RING_COLOR = '#94a3b8';
const DEFAULT_GLASS_INTENSITY = glassIntensity.subtle;

export function getTop100Club(totalPlayed: number): Top100ClubResult {
  if (totalPlayed < 5) {
    return {
      meta: null,
      tierId: 'none',
      tierName: null,
      shortLabel: null,
      threshold: null,
      ringColor: DEFAULT_RING_COLOR,
      glassIntensity: DEFAULT_GLASS_INTENSITY,
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
      ringColor: DEFAULT_RING_COLOR,
      glassIntensity: DEFAULT_GLASS_INTENSITY,
    };
  }

  return {
    meta: current,
    tierId: current.tierId,
    tierName: current.tierName,
    shortLabel: current.shortLabel,
    threshold: current.threshold,
    ringColor: current.ringColor,
    glassIntensity: current.glassIntensity,
  };
}

export function getNextTop100Club(totalPlayed: number): Top100ClubMeta | null {
  for (const step of CLUB_STEPS) {
    if (totalPlayed < step.threshold) return step;
  }
  return null;
}

// Convert hex to translucent rgba for glass effect
export function glassTint(hex: string, opacity = glassIntensity.standard): string {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Get ring color for a tier ID (useful when you only have the ID)
export function getRingColorForTier(tierId: Top100TierId): string {
  const tier = TIER_BY_ID[tierId];
  return tier?.ringColor ?? DEFAULT_RING_COLOR;
}

// Backwards compatibility export (deprecated)
export type Top100Ring = Top100TierId;
