/**
 * Shared Hub Sheet styling constants for Echo
 * Explicit light-glass surfaces to match other Hub sheets
 * 
 * Design system alignment:
 * - Uses HSL colors with transparency
 * - Consistent border radii
 * - Subtle shadows and glass effects
 */

// Echo brand color - amber/orange (matches Hub Echo tile)
export const ECHO_ORANGE = '#F59E0B';
export const ECHO_ORANGE_DARK = '#D97706';

// Sheet height - 80% of viewport as per design requirement
export const ECHO_SHEET_HEIGHT = '80svh';

// Main sheet container (frosted light glass)
export const HUB_SHEET = 
  "bg-white/92 backdrop-blur-xl border border-black/8 shadow-[0_-4px_30px_rgba(0,0,0,0.12)]";

// Inner cards (empty state, response cards, history items)
export const HUB_CARD = 
  "bg-white/75 backdrop-blur-md border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]";

// Inputs (search, composer)
export const HUB_INPUT = 
  "bg-white/85 border border-black/8 placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all";

// Tab rail container
export const HUB_TAB_RAIL = 
  "bg-black/[0.04] border border-black/[0.04]";

// Icon buttons (pin, trash, etc.) - 44x44 minimum touch target
export const HUB_ICON_BUTTON = 
  "min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-white/70 border border-black/8 hover:bg-white active:scale-95 transition-all duration-150";

// Section headers
export const HUB_SECTION_HEADER = 
  "text-slate-500 text-[11px] font-semibold uppercase tracking-wider";

// Prompt chips with better pressed states
export const HUB_CHIP = 
  "px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/80 border border-black/8 text-slate-700 transition-all duration-150 hover:bg-white hover:border-black/12 active:scale-[0.97] active:bg-slate-50";

// Gradient button style
export const ECHO_GRADIENT_BUTTON = 
  "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 active:scale-[0.98] transition-all duration-150";
