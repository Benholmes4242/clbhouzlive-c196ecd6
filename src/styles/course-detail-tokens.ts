/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 */

export const courseDetailTokens = {
  // Rating tier colors - AMBER RESERVED FOR OUTSTANDING (9+) ONLY
  // All other tiers use grey for a clean, prestigious feel
  tiers: {
    outstanding: {
      bg: 'bg-[#FFF4E5]',
      border: 'border-[#FFD699]',
      text: 'text-[#C67800]',
      fill: 'bg-gradient-to-r from-[#FFAF30] to-[#F79E1B]',
      badge: 'bg-gradient-to-r from-[#FFAF30] to-[#F79E1B] text-white',
      activeBg: 'bg-[#F79E1B]',
      activeText: 'text-white',
      chipBg: 'bg-[#FFF4E5]',
      chipText: 'text-[#C67800]',
    },
    excellent: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      fill: 'bg-gray-300',
      badge: 'bg-gray-300 text-gray-700',
      activeBg: 'bg-gray-500',
      activeText: 'text-white',
      chipBg: 'bg-gray-100',
      chipText: 'text-gray-700',
    },
    veryGood: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      fill: 'bg-gray-300',
      badge: 'bg-gray-300 text-gray-700',
      activeBg: 'bg-gray-500',
      activeText: 'text-white',
      chipBg: 'bg-gray-100',
      chipText: 'text-gray-700',
    },
    good: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      fill: 'bg-gray-300',
      badge: 'bg-gray-300 text-gray-700',
      activeBg: 'bg-gray-500',
      activeText: 'text-white',
      chipBg: 'bg-gray-100',
      chipText: 'text-gray-700',
    },
    fair: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      fill: 'bg-gray-300',
      badge: 'bg-gray-300 text-gray-600',
      activeBg: 'bg-gray-400',
      activeText: 'text-white',
      chipBg: 'bg-gray-100',
      chipText: 'text-gray-600',
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

  // Score ring gradient colors - BRAND COLOR FOR OUTSTANDING ONLY, darker grey gradient for rest
  scoreRing: {
    outstanding: { from: '#FFAF30', to: '#F79E1B' }, // Brand orange
    excellent: { from: '#c4c8ce', to: '#9ca3af' },   // Darker grey gradient
    veryGood: { from: '#c4c8ce', to: '#9ca3af' },    // Darker grey gradient
    good: { from: '#c4c8ce', to: '#9ca3af' },        // Darker grey gradient
    fair: { from: '#c4c8ce', to: '#9ca3af' },        // Darker grey gradient
  },
} as const;

// Tier gradient mapping for distribution bars - BRAND COLOR FOR OUTSTANDING ONLY, darker grey gradient for rest
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-gradient-to-r from-[#FFAF30] to-[#F79E1B]',
  Excellent: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]',
  'Very Good': 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]',
  Good: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]',
  Fair: 'bg-gradient-to-r from-[#c4c8ce] to-[#9ca3af]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
