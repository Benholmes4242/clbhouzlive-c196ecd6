/**
 * THE HONOURS TREATMENT (BRIEF_DISCOVER_FILTER_LED_BOARD S5.6, S8.3).
 *
 * THE HONOURS BOARD RAIL AND ITS SHEET ARE DELETED. Feats are now a FILTER AXIS
 * on the Discover board, so a section whose whole job was "here are the rare
 * ones" is answered by a filter instead. What was WORTH KEEPING is the
 * TREATMENT — the champagne/bone metal ground and the gold ink — and it now
 * lives on the ONE surface that shows a single feat round: the scorecard sheet.
 *
 * These values are lifted VERBATIM out of the retired HonoursBoard so the metal
 * a member saw on the rail is the metal they now see on the card.
 *
 * TWO SURFACES, TWO JOBS (recorded on the retired component and still true): a
 * scorecard IDENTIFIES a score, so the ace and the albatross share its red disc
 * with a gold ring. The rarity SEPARATION — champagne for the roughly 500x rarer
 * albatross, bone for the ace — is what this band carries. Do not make one
 * surface match the other.
 *
 * THEY SEPARATE BY SATURATION, NOT VALUE. Champagne is the richer ground, not a
 * lighter or darker one. Never introduce a value difference to make the
 * hierarchy louder.
 */

export type HonoursFeat = 'ace' | 'albatross';

/** Flat ivory, top to bottom — never a gradient that darkens at the foot. */
export const ALBATROSS_GROUND = 'linear-gradient(150deg, #FDFBF5 0%, #FDFBF5 100%)';
export const ACE_GROUND = 'linear-gradient(150deg, #FDFBF5 0%, #FDFBF5 100%)';

export const METAL_INK = '#0F1216';
/** The gold ink of the mock: feat label, year and the hole-and-par line. */
export const METAL_GOLD = '#A47821';
export const METAL_COURSE = '#3B424C';
export const METAL_TOP_EDGE = '#EFDEB7';
export const METAL_HAIRLINE = '#F3E9CE';

export function honoursGround(feat: HonoursFeat): string {
  return feat === 'ace' ? ACE_GROUND : ALBATROSS_GROUND;
}
