/**
 * Format handicap value for display.
 * Plus handicaps (stored as negative) display with + prefix.
 * Scratch (0) displays as "0.0".
 * Standard handicaps display without sign.
 * 
 * @example
 * formatHcp(-2.3) // "+2.3" (plus handicap)
 * formatHcp(0)    // "0.0" (scratch)
 * formatHcp(5.4)  // "5.4" (standard)
 */
export function formatHcp(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  
  if (n < 0) {
    // Plus handicap (stored as negative)
    return `+${Math.abs(n).toFixed(1)}`;
  } else if (n === 0) {
    // Scratch
    return '0.0';
  } else {
    // Standard handicap
    return n.toFixed(1);
  }
}

/**
 * Handicap tier definitions matching the design system.
 * Plus Figure: < 0 (stored negative)
 * Scratch: 0.0 – 0.9
 * Single Figure: 1.0 – 9.9
 * Low Cap: 10.0 – 17.9
 * Mid Figure: 18.0 – 27.9
 * High Figure: 28.0+
 */
export type HandicapTier = 'elite' | 'scratch' | 'player' | 'single' | 'midfielder' | 'weekend' | 'hacker';

/**
 * Three-letter abbreviation per tier, used in compact tier ladders.
 * Hacker rolls up into Weekend (WKD) for display per the Handicap front-page brief.
 */
export function getTierAbbr(id: HandicapTier): string {
  switch (id) {
    case 'elite': return 'ELT';
    case 'scratch': return 'SCR';
    case 'player': return 'PLR';
    case 'single': return 'SF';
    case 'midfielder': return 'MID';
    case 'weekend': return 'WKD';
    case 'hacker': return 'WKD';
  }
}

/**
 * Short, capitalised tier name. Hacker rolls into Weekend.
 */
export function getTierShortName(id: HandicapTier): string {
  switch (id) {
    case 'elite': return 'Elite';
    case 'scratch': return 'Scratch';
    case 'player': return 'Player';
    case 'single': return 'Single';
    case 'midfielder': return 'Mid';
    case 'weekend': return 'Weekend';
    case 'hacker': return 'Weekend';
  }
}

/**
 * Returns true if `tierA` is a sharper (lower handicap) tier than `tierB`.
 * Order: elite < scratch < player < single < midfielder < weekend < hacker.
 */
export function isTierSharper(tierA: HandicapTier, tierB: HandicapTier): boolean {
  const order: HandicapTier[] = ['elite', 'scratch', 'player', 'single', 'midfielder', 'weekend', 'hacker'];
  return order.indexOf(tierA) < order.indexOf(tierB);
}

export function getHandicapTier(handicap: number): HandicapTier {
  if (handicap <= -0.6) return 'elite';
  if (handicap <= 0.5) return 'scratch';
  if (handicap <= 5) return 'player';
  if (handicap <= 10) return 'single';
  if (handicap <= 20) return 'midfielder';
  if (handicap <= 30) return 'weekend';
  return 'hacker';
}

/**
 * Get a status label based on handicap value.
 */
export function getHandicapStatusLabel(handicap: number): string | null {
  const tier = getHandicapTier(handicap);
  switch (tier) {
    case 'elite': return 'Elite';
    case 'scratch': return 'Scratch';
    case 'player': return 'Player';
    case 'single': return 'Single Figure';
    case 'midfielder': return 'Midfielder';
    case 'weekend': return 'Weekend Warrior';
    case 'hacker': return 'Happy Hacker';
  }
}

/**
 * Get status color based on handicap tier.
 * Uses the brief's exact tier colour system.
 */
export function getHandicapStatusColor(handicap: number, _seasonColor?: string): string {
  const tier = getHandicapTier(handicap);
  switch (tier) {
    case 'elite': return '#C1A84C';
    case 'scratch': return '#2D6A4F';
    case 'player': return '#F5A623';
    case 'single': return '#3B82F6';
    case 'midfielder': return '#5B7FA6';
    case 'weekend': return '#8896A8';
    case 'hacker': return '#B0BAC7';
  }
}

/**
 * Get handicap category badge styling per tier.
 */
export function getHandicapBadgeStyle(handicap: number, _seasonColor?: string): {
  bg: string;
  text: string;
  border: string;
} {
  const tier = getHandicapTier(handicap);
  switch (tier) {
    case 'elite':
      return { bg: '#FBF5E6', text: '#C1A84C', border: 'transparent' };
    case 'scratch':
      return { bg: '#EBF5EF', text: '#2D6A4F', border: 'transparent' };
    case 'player':
      return { bg: '#FFF7E6', text: '#F5A623', border: 'transparent' };
    case 'single':
      return { bg: '#EFF6FF', text: '#3B82F6', border: 'transparent' };
    case 'midfielder':
      return { bg: '#EEF3FA', text: '#5B7FA6', border: 'transparent' };
    case 'weekend':
      return { bg: '#F1F5F9', text: '#8896A8', border: 'transparent' };
    case 'hacker':
      return { bg: '#F8FAFC', text: '#B0BAC7', border: 'transparent' };
  }
}
