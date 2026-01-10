/**
 * Shared Hub Sheet styling constants for Echo
 * Explicit light-glass surfaces to match other Hub sheets
 */

// Main sheet container (frosted light glass)
export const HUB_SHEET = 
  "bg-white/90 backdrop-blur-xl border border-black/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]";

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
