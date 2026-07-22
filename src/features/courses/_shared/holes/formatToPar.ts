/**
 * Canonical signed to-par formatter.
 *
 *   > 0        → "+X.XX"   e.g. "+0.59"
 *   < 0        → "−X.XX"   (proper minus sign, not hyphen)
 *   |v| < eps  → "E"       (even par — golf convention)
 *
 * Use for any avg_to_par / to-par delta displayed to the user.
 * Never render `+${v}` or `+${Math.max(0, v)}` inline — always route
 * signed to-par values through this helper.
 */
export function fmtToPar(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return 'E';
  const rounded = Number(v.toFixed(digits));
  if (Math.abs(rounded) < Math.pow(10, -digits) / 2) return 'E';
  if (rounded > 0) return `+${rounded.toFixed(digits)}`;
  return `\u2212${Math.abs(rounded).toFixed(digits)}`;
}
