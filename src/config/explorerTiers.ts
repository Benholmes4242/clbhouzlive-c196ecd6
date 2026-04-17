export interface ExplorerTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  minCountries: number;
  minContinents: number;
  description: string;
}

export const EXPLORER_TIERS: ExplorerTier[] = [
  { id: 'local', name: 'Local Explorer', icon: '🌱', color: '#3EBD93',
    minCountries: 1, minContinents: 1,
    description: 'Played in at least 1 country' },
  { id: 'rover', name: 'Regional Rover', icon: '🗺️', color: '#0EA5E9',
    minCountries: 3, minContinents: 1,
    description: '3+ countries explored' },
  { id: 'continental', name: 'Continental', icon: '✈️', color: '#6366F1',
    minCountries: 5, minContinents: 2,
    description: '5+ countries, 2 continents' },
  { id: 'globetrotter', name: 'Globe Trotter', icon: '🌍', color: '#F59E0B',
    minCountries: 10, minContinents: 3,
    description: '10+ countries, 3 continents' },
  { id: 'worldgolfer', name: 'World Golfer', icon: '👑', color: '#EF4444',
    minCountries: 20, minContinents: 5,
    description: 'The ultimate golf explorer' },
];

/** Get the highest tier the user has unlocked */
export function getUserTier(
  countries: number, continents: number
): ExplorerTier {
  const unlocked = EXPLORER_TIERS.filter(
    t => countries >= t.minCountries && continents >= t.minContinents
  );
  return unlocked[unlocked.length - 1] ?? EXPLORER_TIERS[0];
}

/** Get the next tier above the user's current tier, or null if max */
export function getNextTier(
  currentTierId: string
): ExplorerTier | null {
  const idx = EXPLORER_TIERS.findIndex(t => t.id === currentTierId);
  return EXPLORER_TIERS[idx + 1] ?? null;
}

/** Three-letter tier abbreviation used on the Global tier ladder strip. */
export function getTierAbbr(id: string): string {
  switch (id) {
    case 'local': return 'LOC';
    case 'rover': return 'REG';
    case 'continental': return 'CON';
    case 'globetrotter': return 'GLO';
    case 'worldgolfer': return 'WLD';
    default: return id.slice(0, 3).toUpperCase();
  }
}

/** Short tier name used on the Global tier ladder strip. */
export function getTierShortName(id: string): string {
  switch (id) {
    case 'local': return 'Local';
    case 'rover': return 'Regional';
    case 'continental': return 'Continental';
    case 'globetrotter': return 'Globe';
    case 'worldgolfer': return 'World';
    default: return id;
  }
}
