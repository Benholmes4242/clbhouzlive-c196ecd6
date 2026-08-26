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

/**
 * BRIEF_HERO_GRADIENT_AND_HEIGHT_CANON — the ONE photo-hero scrim.
 *
 * One layer, ending on the canvas (#15171F === CHARCOAL === A.CANVAS: one
 * colour, three names). No top scrim, no radial ambient, no second bottom
 * scrim, no text shadow. Every photo-led hero (course detail, courses page,
 * tournament) uses this and nothing else.
 */
export function heroCanonScrimOn(endColour: string): string {
  return `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.20) 42%, rgba(0,0,0,0.62) 74%, ${endColour} 100%)`;
}

/**
 * The canon scrim ending on the canvas — the usual answer, and the default.
 * MICRO_BRIEF_TOUR_OVERVIEW_HERO_CANON_LAYERING: the rule is "no seam against
 * what sits beneath", so a hero sitting on a different surface passes that
 * surface to `heroCanonScrimOn` instead. The RAMP lives here, once.
 */
export const HERO_CANON_SCRIM = heroCanonScrimOn(CHARCOAL);

/** Canon hero background: the one scrim over an image, or over a fallback. */
export function heroCanonBackground(
  imageUrl: string | null | undefined,
  fallback: string = CHARCOAL,
  focal = 'center 40%',
): string {
  return imageUrl
    ? `${HERO_CANON_SCRIM}, url("${imageUrl}") ${focal} / cover no-repeat`
    : `${HERO_CANON_SCRIM}, ${fallback}`;
}

/**
 * MICRO_BRIEF_COLLEGE_FRANCHISE_REBUILD §4 — the lighten counterpart to
 * `darkenTowardCharcoal`, and the sibling this file was missing.
 *
 * Brand colours vary enormously in luminance. Northwestern (#4E2A84) is DARKER
 * than the panel it is drawn on, so a raw brand glow there is less visible than
 * no glow at all — a value correct against one ground, used against a darker
 * one. Every brand is therefore lifted toward a relative-luminance floor before
 * it is used as LIGHT (a glow, a halo, a tint) rather than as a GROUND.
 *
 * Relative luminance (0.2126R + 0.7152G + 0.0722B on the 0-1 channels), floor
 * 0.42; below it, mix toward white by (floor - l) / (1 - l). No per-school
 * override belongs here: if a school still reads badly, the floor is wrong.
 */
export const BRAND_LUMINANCE_FLOOR = 0.42;

export function liftBrandToLuminanceFloor(hex: string, floor = BRAND_LUMINANCE_FLOOR): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const [r, g, b] = parsed;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (l >= floor) return `rgb(${r}, ${g}, ${b})`;
  const t = (floor - l) / (1 - l);
  const mix = (c: number) => Math.round(c * (1 - t) + 255 * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** The lifted brand as an rgba() at `alpha` — what a glow actually wants. */
export function liftedBrandAlpha(hex: string, alpha: number, floor = BRAND_LUMINANCE_FLOOR): string {
  const lifted = liftBrandToLuminanceFloor(hex, floor);
  const m = lifted.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!m) return lifted;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}
