import type React from 'react';

/**
 * Gold tokens for THE HONOURS BOARD, held in their own leaf module so the
 * skeleton shells and the live section can BOTH read them without the two
 * files importing each other (BRIEF_DISCOVER_LOADING_STATES, layer 3 — the
 * section owns its shell, so the section imports the shell file).
 *
 * BRIEF_HONOURS_BOARD_PLAYER_LED §0.2 — GOLD_HAIR and GOLD_BORDER were rgba
 * tints of #D8A93C (0.22 / 0.35). Under the no-faded-colour rule no element
 * takes its colour by reducing another's opacity, so both are FLATTENED to the
 * solid hex they already rendered as over HONOURS_WASH #FDFBF5:
 *   rgba(216,169,60,0.22) over #FDFBF5 -> #F5E9CC
 *   rgba(216,169,60,0.35) over #FDFBF5 -> #F0DEB4
 * Nothing moves visually; nothing is derived by opacity.
 *
 * GOLD_INK #A87718 is UNCHANGED in this brief (§0.1 — reported, not migrated).
 */

export const GOLD_INK = '#A87718';

/**
 * BRIEF_HONOURS_BOARD_PLAQUE_RAIL §6.1 — TWO GOLDS, TWO JOBS.
 * The RING takes the achievement-ring gold the avatar rule already uses
 * (tokens.GOLD #D8A93C). The CHROME — eyebrow, feat wording, the toggle's
 * active fill, year headings in the sheet — takes ACHIEVEMENT GOLD, whose deep
 * end carries type and whose light end is only ever a solid marker.
 * SC_FILL_GOLD (scorecard broadcast gold) does not appear on this surface.
 */
export const ACH_GOLD_INK = '#B36B00';
export const ACH_GOLD = '#F5D061';
export const GOLD_HAIR = '#F5E9CC';
export const GOLD_BORDER = '#F0DEB4';
export const HONOURS_WASH = '#FDFBF5';

/**
 * THE VIEWING MEMBER'S GROUP (§6) — a SOLID wash and a SOLID 3px leading rule.
 * The wash must separate from HONOURS_WASH, which is already warm, so the rule
 * carries the weight and the fill only supports it.
 */
export const HONOURS_OWN_WASH = '#FBF1DA';
export const HONOURS_OWN_RULE = '#C2620A';

/** Badge fills — SOLID, rarest darkest. Albatross is rarer than an ace. */
export const BADGE_ALBATROSS_BG = '#7A5312';
export const BADGE_ACE_BG = '#A87718';
export const BADGE_INK = HONOURS_WASH;

export const HONOURS_SHELL: React.CSSProperties = {
  background: HONOURS_WASH,
  border: `1px solid ${GOLD_BORDER}`,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};
