/**
 * Shared Hub Sheet styling constants for Echo
 * Warm, inviting aesthetic matching the new Hub design
 */

// Echo brand color - warm orange for the orb
export const ECHO_ORANGE = '#FFBF66';
export const ECHO_ORANGE_DARK = '#FF9500';

// Warm background colors
export const ECHO_BG_WARM = '#FFFAF5';
export const ECHO_BG_CARD = '#FFFFFF';
export const ECHO_BG_TAB = '#F5EDE5';
export const ECHO_BG_MUTED = '#FFFAF5';
export const ECHO_BG_MUTED_HOVER = '#FFF5EC';

// Warm border colors
export const ECHO_BORDER_WARM = '#F0E6DC';
export const ECHO_BORDER_LIGHT = '#E8E0D8';

// Text colors
export const ECHO_TEXT_PRIMARY = '#1D1D1F';
export const ECHO_TEXT_SECONDARY = '#86868B';
export const ECHO_TEXT_MUTED = '#AEAEB2';

// Empty state muted orb colors
export const ECHO_MUTED_ORB_BG = '#F5EDE5';
export const ECHO_MUTED_ORB_BARS = '#D4C4B0';

// Main sheet container - warm off-white background
export const HUB_SHEET = 
  "bg-[#FFFAF5] border border-black/10 shadow-[0_16px_60px_rgba(0,0,0,0.18)]";

// Inner cards (empty state, response cards, history items)
export const HUB_CARD = 
  "bg-white border border-[#F0E6DC] shadow-sm";

// Inputs (search, composer)
export const HUB_INPUT = 
  "bg-white border border-[#E8E0D8] placeholder:text-[#AEAEB2] text-[#1D1D1F] focus:outline-none focus:border-[#FFBF66] transition-colors duration-200";

// Tab rail container
export const HUB_TAB_RAIL = 
  "bg-[#F5EDE5]";

// Icon buttons (pin, trash, etc.)
export const HUB_ICON_BUTTON = 
  "p-2 rounded-full bg-white border border-[#E8E0D8] hover:bg-[#FFFAF5] active:scale-95 transition-all";

// Section headers
export const HUB_SECTION_HEADER = 
  "text-[#86868B] text-[11px] font-semibold uppercase tracking-wide";

// Light chip/button style
export const HUB_CHIP = 
  "px-3 py-1.5 rounded-full text-[12px] font-medium bg-white border border-[#F0E6DC] text-[#1D1D1F] active:scale-95 transition-all hover:bg-[#FFFAF5]";

// Legacy exports for compatibility
export const ECHO_GRADIENT = 'linear-gradient(135deg, rgba(251, 191, 36, 0.65) 0%, rgba(245, 158, 11, 0.7) 50%, rgba(249, 115, 22, 0.65) 100%)';
export const ECHO_GRADIENT_SOLID = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f97316 100%)';
export const ECHO_BORDER = 'rgba(251, 191, 36, 0.7)';
export const ECHO_GLOW = '0 4px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0, 0, 0, 0.06)';
