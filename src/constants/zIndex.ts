/**
 * Z-index hierarchy for Clubhouse and global layers
 * 
 * Clubhouse stacking order (lowest to highest):
 * - Video content: 10
 * - Footer/bottom nav: 30
 * - HUD (glass card + action rail): 40
 * - Sheets (mini profile, comments): 60
 * - Full-screen modals (Create Moment): 70
 */
export const Z_INDEX = {
  // Clubhouse layers
  clubhouseVideo: 10,
  clubhouseFooter: 30,
  clubhouseHud: 40,
  clubhouseSheet: 60,
  
  // Global layers
  globalModal: 70,
  globalToast: 80,
} as const;

// Tailwind class helpers
export const Z_CLASSES = {
  clubhouseVideo: 'z-[10]',
  clubhouseFooter: 'z-[30]',
  clubhouseHud: 'z-[40]',
  clubhouseSheet: 'z-[60]',
  globalModal: 'z-[70]',
  globalToast: 'z-[80]',
} as const;
