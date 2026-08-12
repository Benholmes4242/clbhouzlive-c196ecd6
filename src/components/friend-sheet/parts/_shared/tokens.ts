import type React from 'react';

// Dark handicap tokens for the unified friend sheet.
//
// IMPORTANT: BottomSheet / vaul Drawer portals to document.body, which lives
// OUTSIDE the `.hcp-dark` CSS scope. `var(--hcp-*)` tokens therefore resolve
// to nothing inside the sheet and render invisible / light. These constants
// are HARDCODED hexes so every sheet renders correctly regardless of portal
// scope. See BRIEF: DARK MODE FOR HANDICAP-AREA BOTTOM SHEETS.
export const BG_0 = '#15171F';                       // sheet surface
export const BG_1 = '#1B1E27';                       // raised card
export const BG_2 = '#20242E';                       // cell / chip
export const T100 = '#F2F4F7';                       // ink
export const T80 = 'rgba(242,244,247,0.72)';         // ink (soft)
export const T60 = 'rgba(242,244,247,0.55)';         // dim
export const T40 = 'rgba(242,244,247,0.38)';         // faint
export const LINE = 'rgba(255,255,255,0.08)';        // hairline
export const LINE_2 = 'rgba(255,255,255,0.08)';      // hairline (same)
export const AMBER = '#F7931E';
export const AMBER_TINT = 'rgba(247,147,30,0.10)';
export const GOLD = '#F7931E';                       // legacy alias — now amber
export const GREEN = '#34D399';
export const RED = '#EF4444';

export const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const TAB: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
};
