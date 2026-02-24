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
 * Matches getHandicapStatusLabel thresholds.
 */
export function getHandicapStatusColor(handicap: number): string {
  if (handicap < -0.4) return '#D4A853'; // Gold - plus figure
  if (handicap >= -0.4 && handicap <= 0.4) return '#D4A853'; // Gold - scratch
  if (handicap >= 0.5 && handicap <= 9.9) return '#40916C'; // Green - single figure
  return 'hsl(var(--muted-foreground))'; // Muted for mid/high
}

/**
 * Get handicap category badge styling.
 */
export function getHandicapBadgeStyle(handicap: number): {
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
  if (handicap >= 0.5 && handicap <= 9.9) return {
    bg: 'rgba(82, 183, 136, 0.10)',
    text: '#40916C',
    border: 'rgba(82, 183, 136, 0.2)',
  };
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
