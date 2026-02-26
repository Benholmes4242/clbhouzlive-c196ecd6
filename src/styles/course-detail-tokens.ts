/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 * 
 * NEW COLOR SYSTEM (Jan 2026): Gray for Fair→Excellent, Amber/Orange gradient for Outstanding
 */

export const courseDetailTokens = {
  // Rating tier colors - AMBER/ORANGE RESERVED FOR OUTSTANDING (9+) ONLY
  // All other tiers use GRAY for a clean, neutral feel
  tiers: {
    outstanding: {
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
      bg: 'bg-[#A8A29E]/5',
      border: 'border-[#A8A29E]/20',
      text: 'text-[#78716C]',
      fill: 'bg-[#A8A29E]',
      badge: 'bg-[#A8A29E] text-white',
      activeBg: 'bg-[#A8A29E]',
      activeText: 'text-white',
      chipBg: 'bg-[#A8A29E]/5',
      chipText: 'text-[#78716C]',
    },
    veryGood: {
      bg: 'bg-[#A8A29E]/5',
      border: 'border-[#A8A29E]/20',
      text: 'text-[#78716C]',
      fill: 'bg-[#A8A29E]',
      badge: 'bg-[#A8A29E] text-white',
      activeBg: 'bg-[#A8A29E]',
      activeText: 'text-white',
      chipBg: 'bg-[#A8A29E]/5',
      chipText: 'text-[#78716C]',
    },
    good: {
      bg: 'bg-[#A8A29E]/5',
      border: 'border-[#A8A29E]/20',
      text: 'text-[#78716C]',
      fill: 'bg-[#A8A29E]',
      badge: 'bg-[#A8A29E] text-white',
      activeBg: 'bg-[#A8A29E]',
      activeText: 'text-white',
      chipBg: 'bg-[#A8A29E]/5',
      chipText: 'text-[#78716C]',
    },
    fair: {
      bg: 'bg-[#A8A29E]/5',
      border: 'border-[#A8A29E]/20',
      text: 'text-[#78716C]',
      fill: 'bg-[#A8A29E]',
      badge: 'bg-[#A8A29E] text-white',
      activeBg: 'bg-[#A8A29E]',
      activeText: 'text-white',
      chipBg: 'bg-[#A8A29E]/5',
      chipText: 'text-[#78716C]',
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

  // Score ring gradient colors - AMBER FOR OUTSTANDING ONLY, Gray for rest
  scoreRing: {
    outstanding: { from: '#f59e0b', to: '#fbbf24' }, // Amber gradient
    excellent: { from: '#A8A29E', to: '#A8A29E' },   // Warm stone
    veryGood: { from: '#A8A29E', to: '#A8A29E' },    // Warm stone
    good: { from: '#A8A29E', to: '#A8A29E' },        // Warm stone
    fair: { from: '#A8A29E', to: '#A8A29E' },        // Warm stone
  },
} as const;

// Tier gradient mapping for distribution bars - AMBER FOR OUTSTANDING ONLY, Gray for rest
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Excellent: 'bg-[#A8A29E]',
  'Very Good': 'bg-[#A8A29E]',
  Good: 'bg-[#A8A29E]',
  Fair: 'bg-[#A8A29E]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
