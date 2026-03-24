/**
 * Season Status Panel - Configuration
 * Defines all seasons, their color tokens, icons, and metadata.
 */
import { Dumbbell, Trophy, Sun, Moon, LockKeyhole, Check, type LucideIcon } from 'lucide-react';

export type SeasonId = 'preseason' | 'major' | 'summer' | 'offseason';

export interface SeasonConfig {
  id: SeasonId;
  label: string;        // Short name: "Pre-Season"
  title: string;        // Full title: "Pre-Season Training"
  subtitle: string;     // Tagline: "Get match ready"
  themeColor: string;   // Hex colour token
  Icon: LucideIcon;
  // Populated at runtime from DB, not hardcoded
  sponsorName?: string | null;
  prizeDescription?: string | null;
}

export type SeasonChipStatus = 'locked' | 'upcoming' | 'completed' | 'active';

/**
 * Season Configuration Data
 * Maps season IDs to their display properties and theme colors.
 */
export const SEASON_CONFIG: Record<SeasonId, SeasonConfig> = {
  preseason: {
    id: 'preseason',
    label: 'Pre-Season',
    title: 'Pre-Season Training',
    subtitle: 'Get match ready',
    themeColor: '#3EBD93', // Fresh emerald - energy, anticipation
    Icon: Dumbbell,
  },
  major: {
    id: 'major',
    label: 'Major',
    title: 'Major Season',
    subtitle: 'Championship time',
    themeColor: '#006747', // Augusta National green - prestige
    Icon: Trophy,
  },
  summer: {
    id: 'summer',
    label: 'Summer',
    title: 'Summer Season',
    subtitle: 'Keep the momentum',
    themeColor: '#F59E0B', // Warm amber - sun-drenched rounds
    Icon: Sun,
  },
  offseason: {
    id: 'offseason',
    label: 'Off-Season',
    title: 'Off-Season Rest',
    subtitle: 'Rest and reflect',
    themeColor: '#475569', // Slate - reflective, cool
    Icon: Moon,
  },
};

/**
 * Season order for linear progression
 */
export const SEASON_ORDER: SeasonId[] = ['preseason', 'major', 'summer', 'offseason'];

/**
 * Get season config by ID, with fallback
 */
export function getSeasonConfig(id: string): SeasonConfig {
  const normalized = id.toLowerCase().replace(/[-_\s]/g, '') as SeasonId;
  
  // Try direct match
  if (SEASON_CONFIG[normalized]) {
    return SEASON_CONFIG[normalized];
  }
  
  // Try partial match
  for (const [key, config] of Object.entries(SEASON_CONFIG)) {
    if (id.toLowerCase().includes(key) || key.includes(id.toLowerCase())) {
      return config;
    }
  }
  
  // Default fallback
  return SEASON_CONFIG.preseason;
}

/**
 * Derive chip status based on season position relative to current
 */
export function getChipStatus(
  seasonId: SeasonId,
  currentSeasonId: SeasonId
): SeasonChipStatus {
  const currentIndex = SEASON_ORDER.indexOf(currentSeasonId);
  const seasonIndex = SEASON_ORDER.indexOf(seasonId);
  
  if (seasonIndex < currentIndex) return 'completed';
  if (seasonIndex === currentIndex) return 'active';
  if (seasonIndex === currentIndex + 1) return 'upcoming';
  return 'locked';
}

/**
 * Get chip icon based on status
 */
export function getChipIcon(status: SeasonChipStatus): LucideIcon | null {
  switch (status) {
    case 'locked':
      return LockKeyhole;
    case 'completed':
      return Check;
    default:
      return null;
  }
}
