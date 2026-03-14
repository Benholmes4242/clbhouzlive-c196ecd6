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
 * Plus/Scratch = amber, Single Figure = amber (slightly softer), Mid/High = muted.
 */
export function getHandicapStatusColor(handicap: number, _seasonColor?: string): string {
  if (handicap < -0.4) return 'hsl(var(--accent-amber))';
  if (handicap >= -0.4 && handicap <= 0.4) return 'hsl(var(--accent-amber))';
  if (handicap >= 0.5 && handicap <= 9.9) return 'hsl(var(--accent-amber) / 0.8)';
  return 'hsl(var(--muted-foreground))';
}

/**
 * Get handicap category badge styling.
 * All tiers use amber-based or muted tokens — no season color dependency.
 */
export function getHandicapBadgeStyle(handicap: number, _seasonColor?: string): {
  bg: string;
  text: string;
  border: string;
} {
  if (handicap < -0.4) return {
    bg: 'hsl(var(--accent-amber) / 0.12)',
    text: 'hsl(var(--accent-amber))',
    border: 'hsl(var(--accent-amber) / 0.25)',
  };
  if (handicap >= -0.4 && handicap <= 0.4) return {
    bg: 'hsl(var(--accent-amber) / 0.12)',
    text: 'hsl(var(--accent-amber))',
    border: 'hsl(var(--accent-amber) / 0.25)',
  };
  if (handicap >= 0.5 && handicap <= 9.9) return {
    bg: 'hsl(var(--accent-amber) / 0.1)',
    text: 'hsl(var(--accent-amber))',
    border: 'hsl(var(--accent-amber) / 0.2)',
  };
  if (handicap >= 10.0 && handicap <= 19.9) return {
    bg: 'hsl(var(--muted) / 0.5)',
    text: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border) / 0.3)',
  };
  return {
    bg: 'hsl(var(--muted) / 0.3)',
    text: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border) / 0.2)',
  };
}
