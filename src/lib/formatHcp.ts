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
 * Low Cap: 10.0 to 17.9
 * 18.0+: No label
 */
export function getHandicapStatusLabel(handicap: number): string | null {
  if (handicap < -0.4) return 'Plus Figure';
  if (handicap >= -0.4 && handicap <= 0.4) return 'Scratch';
  if (handicap >= 0.5 && handicap <= 9.9) return 'Single Figure';
  if (handicap >= 10.0 && handicap <= 17.9) return 'Low Cap';
  return null;
}

/**
 * Get status color based on handicap value.
 * Matches getHandicapStatusLabel thresholds.
 */
export function getHandicapStatusColor(handicap: number): string {
  if (handicap < -0.4) return '#C1A84C'; // Chartreus gold - plus figure
  if (handicap >= -0.4 && handicap <= 0.4) return '#C1A84C'; // Chartreus gold - scratch
  if (handicap >= 0.5 && handicap <= 9.9) return '#334E3D'; // Emerald - single figure
  if (handicap >= 10.0 && handicap <= 17.9) return '#B8C6C9'; // Sky blue - low cap
  return '#64748b'; // Default muted (18.0+)
}
