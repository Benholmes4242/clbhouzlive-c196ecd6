import { CHARCOAL } from './tokens';

// Canonical charcoal channels, parsed from the CHARCOAL token (#15171F).
const C_R = 0x15, C_G = 0x17, C_B = 0x1f;

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return [r, g, b];
}

/** Blend a brand hex `amount` of the way toward canonical charcoal. */
export function darkenTowardCharcoal(hex: string, amount = 0.3): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(parsed[0] * (1 - t) + C_R * t);
  const g = Math.round(parsed[1] * (1 - t) + C_G * t);
  const b = Math.round(parsed[2] * (1 - t) + C_B * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Vertical hero gradient tinted from a brand colour (or flat fallback). */
export function heroTintGradient(brandHex: string | null, amount = 0.3): string {
  const top = brandHex ? darkenTowardCharcoal(brandHex, amount) : '#262B33';
  return `linear-gradient(180deg, ${top} 0%, ${CHARCOAL} 100%)`;
}
