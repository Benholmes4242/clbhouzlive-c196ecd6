/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 * 
 * COLOR SYSTEM (Feb 2026): Warm color progression from cool gray to full amber
 * Fair → Good → Very Good → Excellent → Outstanding
 */

export const courseDetailTokens = {
  // Rating tier colors - warm progression from gray to amber
  tiers: {
    outstanding: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#d97706]',
      fill: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
      badge: 'bg-[#d97706] text-white',
      activeBg: 'bg-[#d97706]',
      activeText: 'text-white',
      chipBg: 'bg-[#f59e0b]/10',
      chipText: 'text-[#d97706]',
      numberColor: '#D97706',
      labelColor: '#D97706',
      sliderFrom: '#F59E0B',
      sliderTo: '#D97706',
      barFrom: '#F59E0B',
      barTo: '#FBBF24',
      circleFill: '#D97706',
    },
    excellent: {
      bg: 'bg-[#B45309]/10',
      border: 'border-[#B45309]/30',
      text: 'text-[#B45309]',
      fill: 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]',
      badge: 'bg-[#B45309] text-white',
      activeBg: 'bg-[#B45309]',
      activeText: 'text-white',
      chipBg: 'bg-[#B45309]/10',
      chipText: 'text-[#B45309]',
      numberColor: '#B45309',
      labelColor: '#B45309',
      sliderFrom: '#FBBF24',
      sliderTo: '#F59E0B',
      barFrom: '#D97706',
      barTo: '#F59E0B',
      circleFill: '#B45309',
    },
    veryGood: {
      bg: 'bg-[#92400E]/10',
      border: 'border-[#92400E]/30',
      text: 'text-[#92400E]',
      fill: 'bg-gradient-to-r from-[#FBBF24] to-[#D97706]',
      badge: 'bg-[#92400E] text-white',
      activeBg: 'bg-[#92400E]',
      activeText: 'text-white',
      chipBg: 'bg-[#92400E]/10',
      chipText: 'text-[#92400E]',
      numberColor: '#92400E',
      labelColor: '#92400E',
      sliderFrom: '#FCD34D',
      sliderTo: '#FBBF24',
      barFrom: '#B45309',
      barTo: '#D97706',
      circleFill: '#92400E',
    },
    good: {
      bg: 'bg-[#78716C]/10',
      border: 'border-[#78716C]/20',
      text: 'text-[#78716C]',
      fill: 'bg-gradient-to-r from-[#78716C] to-[#A8A29E]',
      badge: 'bg-[#78716C] text-white',
      activeBg: 'bg-[#78716C]',
      activeText: 'text-white',
      chipBg: 'bg-[#78716C]/10',
      chipText: 'text-[#78716C]',
      numberColor: '#78716C',
      labelColor: '#78716C',
      sliderFrom: '#D6D3D1',
      sliderTo: '#A8A29E',
      barFrom: '#78716C',
      barTo: '#A8A29E',
      circleFill: '#78716C',
    },
    fair: {
      bg: 'bg-[#9CA3AF]/5',
      border: 'border-[#9CA3AF]/20',
      text: 'text-[#9CA3AF]',
      fill: 'bg-gradient-to-r from-[#9CA3AF] to-[#D1D5DB]',
      badge: 'bg-[#9CA3AF] text-white',
      activeBg: 'bg-[#9CA3AF]',
      activeText: 'text-white',
      chipBg: 'bg-[#9CA3AF]/5',
      chipText: 'text-[#9CA3AF]',
      numberColor: '#9CA3AF',
      labelColor: '#9CA3AF',
      sliderFrom: '#E5E7EB',
      sliderTo: '#D1D5DB',
      barFrom: '#9CA3AF',
      barTo: '#D1D5DB',
      circleFill: '#9CA3AF',
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

  // Score ring gradient colors - per tier
  scoreRing: {
    outstanding: { from: '#F59E0B', to: '#FBBF24' },
    excellent: { from: '#D97706', to: '#F59E0B' },
    veryGood: { from: '#B45309', to: '#D97706' },
    good: { from: '#78716C', to: '#A8A29E' },
    fair: { from: '#9CA3AF', to: '#D1D5DB' },
  },
} as const;

// Tier gradient mapping for distribution bars - warm progression
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
  Excellent: 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]',
  'Very Good': 'bg-gradient-to-r from-[#B45309] to-[#D97706]',
  Good: 'bg-gradient-to-r from-[#78716C] to-[#A8A29E]',
  Fair: 'bg-gradient-to-r from-[#9CA3AF] to-[#D1D5DB]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
