/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 *
 * 5-TIER COLOR SYSTEM (Apr 2026): Gray for Excellent→Poor, Amber/Orange gradient for Exceptional (≥9.0)
 */

export const courseDetailTokens = {
  // Rating tier colors — graduated grey → amber → gold ramp
  tiers: {
    exceptional: {
      bg: 'bg-[#FFC23D]/10',
      border: 'border-[#FFC23D]/30',
      text: 'text-[#F7931E]',
      fill: 'bg-gradient-to-r from-[#FFC23D] to-[#FFE08A]',
      badge: 'bg-[#F7931E] text-white',
      activeBg: 'bg-[#F7931E]',
      activeText: 'text-white',
      chipBg: 'bg-[#F7931E]/10',
      chipText: 'text-[#F7931E]',
    },
    excellent: {
      bg: 'bg-[#F7931E]/10',
      border: 'border-[#F7931E]/30',
      text: 'text-[#D97706]',
      fill: 'bg-gradient-to-r from-[#F7931E] to-[#FAC775]',
      badge: 'bg-[#F7931E] text-white',
      activeBg: 'bg-[#F7931E]',
      activeText: 'text-white',
      chipBg: 'bg-[#F7931E]/10',
      chipText: 'text-[#D97706]',
    },
    good: {
      bg: 'bg-[#F7931E]/10',
      border: 'border-[#F7931E]/30',
      text: 'text-[#D97706]',
      fill: 'bg-gradient-to-r from-[#F7931E] to-[#FAC775]',
      badge: 'bg-[#F7931E] text-white',
      activeBg: 'bg-[#F7931E]',
      activeText: 'text-white',
      chipBg: 'bg-[#F7931E]/10',
      chipText: 'text-[#D97706]',
    },
    fair: {
      bg: 'bg-[#A85110]/10',
      border: 'border-[#A85110]/30',
      text: 'text-[#9A4A0E]',
      fill: 'bg-gradient-to-r from-[#A85110] to-[#C9670F]',
      badge: 'bg-[#A85110] text-white',
      activeBg: 'bg-[#A85110]',
      activeText: 'text-white',
      chipBg: 'bg-[#A85110]/10',
      chipText: 'text-[#9A4A0E]',
    },
    poor: {
      bg: 'bg-[#A85110]/10',
      border: 'border-[#A85110]/30',
      text: 'text-[#9A4A0E]',
      fill: 'bg-gradient-to-r from-[#A85110] to-[#C9670F]',
      badge: 'bg-[#A85110] text-white',
      activeBg: 'bg-[#A85110]',
      activeText: 'text-white',
      chipBg: 'bg-[#A85110]/10',
      chipText: 'text-[#9A4A0E]',
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

  // Score ring gradient colors — graduated grey → amber → gold ramp
  // DEPRECATED — rings now derive from RATING_RAMPS via getScoreRingColors.
  scoreRing: {
    exceptional: { from: '#FFC23D', to: '#FFE08A' },
    excellent: { from: '#F7931E', to: '#FAC775' },
    good: { from: '#F7931E', to: '#FAC775' },
    fair: { from: '#A85110', to: '#C9670F' },
    poor: { from: '#A85110', to: '#C9670F' },
  },
} as const;

// Tier gradient mapping for distribution bars — graduated grey → amber → gold ramp
// DEPRECATED — distribution bars now derive from RATING_RAMPS via rampForRating.
export const tierGradients: Record<string, string> = {
  Exceptional: 'bg-gradient-to-r from-[#FFC23D] to-[#FFE08A]',
  Excellent: 'bg-gradient-to-r from-[#F7931E] to-[#FAC775]',
  Good: 'bg-gradient-to-r from-[#F7931E] to-[#FAC775]',
  Fair: 'bg-gradient-to-r from-[#A85110] to-[#C9670F]',
  Poor: 'bg-gradient-to-r from-[#A85110] to-[#C9670F]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
