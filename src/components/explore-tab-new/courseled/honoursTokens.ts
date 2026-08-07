import type React from 'react';

/**
 * Gold tokens for THE HONOURS BOARD, held in their own leaf module so the
 * skeleton shells and the live section can BOTH read them without the two
 * files importing each other (BRIEF_DISCOVER_LOADING_STATES, layer 3 — the
 * section owns its shell, so the section imports the shell file).
 */

export const GOLD_INK = '#A87718';
export const GOLD_HAIR = 'rgba(216,169,60,0.22)';
export const GOLD_BORDER = 'rgba(216,169,60,0.35)';
export const HONOURS_WASH = '#FDFBF5';

export const HONOURS_SHELL: React.CSSProperties = {
  background: HONOURS_WASH,
  border: `1px solid ${GOLD_BORDER}`,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};
