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
 * Get a status label based on handicap value.
 * 
 * Plus Figure: < -0.4 (plus handicap, e.g., +2.3 stored as -2.3)
 * Scratch: -0.4 to 0.4 (playing to par)
 * Single Figure: 0.5 to 9.9
 * 10.0+: No label (standard/high handicappers)
 */
export function getHandicapStatusLabel(handicap: number): string | null {
  if (handicap < -0.4) return 'Plus Figure';
  if (handicap >= -0.4 && handicap <= 0.4) return 'Scratch';
  if (handicap >= 0.5 && handicap <= 9.9) return 'Single Figure';
  if (handicap >= 10.0 && handicap <= 19.9) return 'Mid Figure';
  if (handicap >= 20.0) return 'High Figure';
  return null;
}

/**
 * Get status color based on handicap value.
 * Plus/Scratch = gold, Single Figure = seasonColor (defaults to green), Mid/High = muted.
 */
export function getHandicapStatusColor(handicap: number, seasonColor?: string): string {
  if (handicap < -0.4) return '#D4A853'; // Gold - plus figure
  if (handicap >= -0.4 && handicap <= 0.4) return '#D4A853'; // Gold - scratch
  if (handicap >= 0.5 && handicap <= 9.9) return seasonColor || '#40916C'; // Season color - single figure
  return 'hsl(var(--muted-foreground))'; // Muted for mid/high
}

/**
 * Get handicap category badge styling.
 * Single Figure tier accepts optional seasonColor for season-aware tinting.
 */
export function getHandicapBadgeStyle(handicap: number, seasonColor?: string): {
  bg: string;
  text: string;
  border: string;
} {
  if (handicap < -0.4) return {
    bg: 'rgba(212, 168, 83, 0.12)',
    text: '#C4963E',
    border: 'rgba(212, 168, 83, 0.25)',
  };
  if (handicap >= -0.4 && handicap <= 0.4) return {
    bg: 'rgba(212, 168, 83, 0.12)',
    text: '#C4963E',
    border: 'rgba(212, 168, 83, 0.25)',
  };
  if (handicap >= 0.5 && handicap <= 9.9) {
    const color = seasonColor || '#40916C';
    return {
      bg: `${color}1A`,      // ~10% opacity
      text: color,
      border: `${color}33`,  // ~20% opacity
    };
  }
  if (handicap >= 10.0 && handicap <= 19.9) return {
    bg: 'rgba(0, 0, 0, 0.04)',
    text: 'hsl(var(--muted-foreground))',
    border: 'rgba(0, 0, 0, 0.08)',
  };
  return {
    bg: 'rgba(0, 0, 0, 0.03)',
    text: 'hsl(var(--muted-foreground))',
    border: 'rgba(0, 0, 0, 0.06)',
  };
}
