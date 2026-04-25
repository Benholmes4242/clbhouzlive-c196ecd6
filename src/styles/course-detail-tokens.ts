/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 * 
 * NEW COLOR SYSTEM (Jan 2026): Gray for Fair→Excellent, Amber/Orange gradient for Outstanding
 */

export const courseDetailTokens = {
  // Rating tier colors - AMBER/ORANGE RESERVED FOR EXCEPTIONAL (≥9.0) ONLY
  // All other tiers use GRAY for a clean, neutral feel
  tiers: {
    exceptional: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#f59e0b] text-white',
      activeBg: 'bg-[#f59e0b]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
    },
    excellent: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#f59e0b] text-white',
      activeBg: 'bg-[#f59e0b]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
    },
    good: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#f59e0b] text-white',
      activeBg: 'bg-[#f59e0b]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
    },
    fair: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#f59e0b] text-white',
      activeBg: 'bg-[#f59e0b]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
    },
    poor: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#f59e0b] text-white',
      activeBg: 'bg-[#f59e0b]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
    },
  },

  // Spacing scale for sections
  spacing: {
    sectionGap: 'space-y-8',
    cardPadding: 'p-5',
    contentGap: 'gap-4',
    sectionPadding: 'px-4 py-6',
  },

  // Card styles with consistent radii and shadows
  cards: {
    base: 'bg-white rounded-2xl shadow-sm border border-gray-100',
    elevated: 'bg-white rounded-2xl shadow-md border border-gray-100',
    premium: 'bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-100',
    interactive: 'bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all',
  },

  // Typography tokens
  typography: {
    sectionTitle: 'text-lg font-semibold text-gray-900 tracking-tight',
    sectionSubtitle: 'text-sm text-gray-500',
    bodyLarge: 'text-base text-gray-700 leading-relaxed',
    bodySmall: 'text-sm text-gray-600',
    caption: 'text-xs text-gray-500',
    label: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  },

  // Interactive states
  interactive: {
    buttonPress: 'active:scale-95 transition-transform',
    cardHover: 'hover:shadow-md hover:-translate-y-0.5 transition-all',
    chipActive: 'ring-2 ring-offset-2',
  },

  // Score ring gradient colors - all amber per unified rating system
  scoreRing: {
    exceptional: { from: '#f59e0b', to: '#fbbf24' },
    excellent: { from: '#f59e0b', to: '#fbbf24' },
    good: { from: '#f59e0b', to: '#fbbf24' },
    fair: { from: '#f59e0b', to: '#fbbf24' },
    poor: { from: '#f59e0b', to: '#fbbf24' },
  },
} as const;

// Tier gradient mapping for distribution bars - AMBER FOR EXCEPTIONAL ONLY (visual stays unified amber)
export const tierGradients: Record<string, string> = {
  Exceptional: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Excellent: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Good: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Fair: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Poor: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
