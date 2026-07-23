/**
 * Tokens + approach-tracker stages for the WHS connect flow.
 * Presentation-only. Do not add business logic here.
 */

export const CANVAS = '#F8FAFC';
export const CARD = '#FFFFFF';
export const INK = '#0F172A';
export const DIM = '#64748B';
export const FAINT = '#94A3B8';
export const HAIR = 'rgba(15,23,42,0.08)';
export const GREEN = '#059669';
export const GREEN_BG = 'rgba(5,150,105,0.08)';
export const TURF = '#0C6B4F';
export const DANGER = '#EF4444';
export const PIN_RED = '#E11D48';
export const FONT =
  'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export type ApproachStage = 'intro' | 'comingSoon' | 'form' | 'sync' | 'done';

export interface ApproachStageDef {
  number: string;
  unit: string;
  pos: number;
  note: string;
}

// Rendered via {'\u00B7'} in JSX. Not a literal escape in text.
const DOT = '\u00B7';

export const APPROACH_STAGES: Record<ApproachStage, ApproachStageDef> = {
  intro:      { number: '320', unit: 'YDS OUT',       pos: 0.05, note: `Par 4 ${DOT} Let's play` },
  comingSoon: { number: '260', unit: 'YDS OUT',       pos: 0.22, note: 'Not in play here yet' },
  form:       { number: '140', unit: 'YDS OUT',       pos: 0.55, note: `Wedge in hand ${DOT} Your details` },
  sync:       { number: '15',  unit: 'FT TO THE PIN', pos: 0.88, note: `On the green ${DOT} Connecting` },
  done:       { number: 'IN',  unit: 'THE HOLE',      pos: 1,    note: 'Holed it' },
};
