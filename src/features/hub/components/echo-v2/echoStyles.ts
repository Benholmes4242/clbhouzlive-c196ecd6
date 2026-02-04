/**
 * Shared Hub Sheet styling constants for Echo
 * Explicit light-glass surfaces to match other Hub sheets
 */

// Echo brand color - matches Hub Echo tile orange
export const ECHO_ORANGE = '#F59E0B';

// Echo glassy amber-to-orange gradient (used for accents/backgrounds)
export const ECHO_GRADIENT = 'linear-gradient(135deg, rgba(251, 191, 36, 0.65) 0%, rgba(245, 158, 11, 0.7) 50%, rgba(249, 115, 22, 0.65) 100%)';
export const ECHO_GRADIENT_SOLID = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)';
export const ECHO_BORDER = 'rgba(251, 191, 36, 0.7)';
export const ECHO_GLOW = '0 4px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0, 0, 0, 0.06)';

// Main sheet container - solid #F8FAFC background
export const HUB_SHEET = 
  "bg-[#F8FAFC] border border-black/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]";

// Inner cards (empty state, response cards, history items)
export const HUB_CARD = 
  "bg-white/70 backdrop-blur-md border border-black/[0.08] shadow-sm";

// Inputs (search, composer)
export const HUB_INPUT = 
  "bg-white/80 border border-black/10 placeholder:text-slate-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10";

// Tab rail container
export const HUB_TAB_RAIL = 
  "bg-black/[0.05] border border-black/[0.05]";

// Icon buttons (pin, trash, etc.)
export const HUB_ICON_BUTTON = 
  "p-2 rounded-full bg-white/70 border border-black/10 hover:bg-white active:scale-95 transition-all";

// Section headers
export const HUB_SECTION_HEADER = 
  "text-slate-500 text-[11px] font-semibold uppercase tracking-wide";

// Light chip/button style
export const HUB_CHIP = 
  "px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/70 border border-black/10 text-slate-700 active:scale-95 transition-all hover:bg-white/90";
