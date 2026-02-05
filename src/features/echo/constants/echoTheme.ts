 /**
  * Echo Theme Constants
  * Centralized color definitions for the Echo AI experience
  * Makes future dark mode support easier
  */
 
 export const ECHO_COLORS = {
   // Brand
   brandPrimary: '#FFBF66',      // Orange orb, send button
   brandBackground: '#FFF4E6',    // User bubble, card bg, chip bg
   brandText: '#B45309',          // Chip text, interactive text
   
   // Surfaces
   pageBg: '#F8FAFC',
   bubbleAi: '#FFFFFF',
   bubbleUser: '#FFF4E6',
   cardBg: '#FFFFFF',
   
   // Text
   textPrimary: '#1D1D1F',
   textSecondary: '#8E8E93',
   textMeta: '#6B7280',
   
   // Borders
   borderLight: '#F0F0F5',
   borderMedium: '#E5E5EA',
   divider: '#C7C7CC',
   
   // States
   activePress: '#F5F5F5',
   hoverBg: '#FFECDA',
   
   // Semantic
   error: '#FF3B30',
   success: '#34C759',
 } as const;
 
 // Animation durations for reduced motion support
 export const ECHO_ANIMATIONS = {
   fast: 0.15,
   normal: 0.25,
   slow: 0.4,
 } as const;
 
 // Input constraints
 export const ECHO_LIMITS = {
   maxInputLength: 2000,
   warningThreshold: 200, // Show counter when this many chars remain
 } as const;