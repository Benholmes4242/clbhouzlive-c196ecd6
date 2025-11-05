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
  
  // Modal & overlay layers (ordered by priority)
  hub: 11000,           // Hub modal shell
  echo: 11500,          // Echo floating orb + radial fan
  createGame: 11800,    // Create Game modal (above Hub)
  aiOverlay: 11100,     // AI Chat overlay (above Hub)
  
  // Utility classes for inline styles
  asStyle: {
    header: { zIndex: 1000 },
    nav: { zIndex: 999 },
    toast: { zIndex: 12000 },
    hub: { zIndex: 11000 },
    echo: { zIndex: 11500 },
    createGame: { zIndex: 11800 },
    aiOverlay: { zIndex: 11100 },
  }
} as const;

export type ZIndexLayer = keyof typeof Z;
