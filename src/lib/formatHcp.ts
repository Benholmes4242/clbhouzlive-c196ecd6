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
 */
export function getHandicapStatusLabel(handicap: number): string | null {
  if (handicap < 0) return '+ Handicap';
  if (handicap >= 0 && handicap < 1) return 'Scratch';
  if (handicap >= 1 && handicap < 10) return 'Single Figure';
  if (handicap >= 10 && handicap < 18) return 'Low Cap';
  return null;
}

/**
 * Get status color based on handicap value.
 */
export function getHandicapStatusColor(handicap: number): string {
  if (handicap < 0) return '#C1A84C'; // Chartreus gold - plus handicap
  if (handicap >= 0 && handicap < 1) return '#C1A84C'; // Chartreus gold - scratch
  if (handicap >= 1 && handicap < 10) return '#334E3D'; // Emerald - single figure
  if (handicap >= 10 && handicap < 18) return '#B8C6C9'; // Sky blue - low cap
  return '#64748b'; // Default muted
}
