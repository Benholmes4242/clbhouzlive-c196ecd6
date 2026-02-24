/**
 * TOUR_COLORS - Central reference for all intentional accent colors
 * used across the Tours Overview page.
 * 
 * New code should import from here rather than hardcoding hex values.
 */

export const TOUR_COLORS = {
  // Intelligence / AI
  intelligenceGold: '#B8860B',
  intelligenceGoldLight: '#FFB800',
  intelligenceGoldDark: '#FF8C00',
  
  // Scores (PGA Tour convention)
  scoreUnderPar: 'rgba(245, 158, 11, 0.9)',
  scoreOverPar: '#111827',
  scoreEven: 'rgba(0,0,0,0.4)',
  
  // Live indicator
  liveAmber: '#f59e0b',
  liveGreen: '#22C55E',
  
  // Link/interactive
  linkBlue: '#3478F6',
  
  // Movement indicators
  movementUp: '#16A34A',
  movementDown: '#DC2626',
  
  // Stat category accents
  categories: {
    distance: { primary: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)' },
    accuracy: { primary: '#3478F6', bg: 'rgba(52,120,246,0.08)', border: 'rgba(52,120,246,0.2)' },
    scrambling: { primary: '#FF9500', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.2)' },
    putting: { primary: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
    overall: { primary: '#B8860B', bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.2)' },
  },
  
  // Rank badges
  rankGold: ['#FFB800', '#FF8C00'],
  rankSilver: ['#C0C0C0', '#9A9A9A'],
  rankBronze: ['#CD7F32', '#A0622E'],
  
  // Dark Horse predictions
  darkHorse: { primary: '#D97706', bg: '#FFFBEB', border: 'rgba(245,158,11,0.15)' },
  
  // Special rows
  worldNumberOne: '#FFFDF5',
} as const;
