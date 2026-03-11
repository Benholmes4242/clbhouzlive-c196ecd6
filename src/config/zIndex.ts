/**
 * Z-Index Layer Tokens
 * 
 * Centralized z-index management to prevent layering conflicts.
 * Use these tokens instead of inline z-index values.
 * 
 * @see Phase 1 Audit Report - Section 9: Z-Index Hierarchy
 */

export const Z = {
  // Base UI layers
  header: 1000,
  nav: 999,
  
  // Toast notifications (highest priority)
  toast: 12000,
  
  // Search overlay
  searchOverlay: 1100,  // Above header/nav, below modals
  
  // Modal & overlay layers (ordered by priority)
  hub: 12000,           // Hub modal shell
  sheetBackdrop: 12002, // Bottom sheet backdrop
  sheet: 12003,         // Bottom sheet surface
  echo: 11500,          // Echo floating orb + radial fan
  createGame: 11800,    // Create Game modal (above Hub)
  aiOverlay: 11100,     // AI Chat overlay (above Hub)
  
  // Echo page layers
  page: 9999,           // Echo page glass background
  pageHeader: 10000,    // Echo page header
  composer: 2,          // Composer footer
  
  // Dropdown layers
  dropdownScrim: 50,
  dropdownMenu: 60,
  
  // Utility classes for inline styles
  asStyle: {
    header: { zIndex: 1000 },
    searchOverlay: { zIndex: 1100 },
    nav: { zIndex: 999 },
    toast: { zIndex: 12000 },
    hub: { zIndex: 12000 },
    sheetBackdrop: { zIndex: 12002 },
    sheet: { zIndex: 12003 },
    echo: { zIndex: 11500 },
    createGame: { zIndex: 11800 },
    aiOverlay: { zIndex: 11100 },
    page: { zIndex: 9999 },
    pageHeader: { zIndex: 10000 },
    composer: { zIndex: 2 },
    dropdownScrim: { zIndex: 50 },
    dropdownMenu: { zIndex: 60 },
  }
} as const;

export type ZIndexLayer = keyof typeof Z;
