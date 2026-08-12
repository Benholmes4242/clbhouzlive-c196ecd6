// Shared visual tokens for the "gaming, light mode" Discover rebuild.
// Dark scoreboard surfaces = verified numbers; light surfaces = editorial.

export const SCOREBOARD_BG = 'linear-gradient(155deg, #20262F 0%, #0E1218 100%)';
export const GOLD = '#FFCB45';
export const AMBER = '#F7931E';
export const DEEP_AMBER = '#c97a10';
export const LAUREL = '#34d399';       // regular/consistency crown (on dark)
export const LAUREL_INK = '#0e8a57';   // laurel on light surfaces
export const CARD_RADIUS = 16;
export const INNER_RADIUS = 11;
export const HAIRLINE_DARK = '1px solid rgba(255,255,255,0.12)';
export const CARD_BORDER = '1px solid rgba(15,23,42,0.07)';

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Value/label typography DNA (from FeatCard / CircleActivityStrip).
export const VALUE_TYPE: React.CSSProperties = {
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
};

export const LABEL_TYPE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};
