/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 */

export const courseDetailTokens = {
  // Rating tier colors - CHARTREUS RESERVED FOR OUTSTANDING (9+) ONLY
  // All other tiers use EMERALD for a clean, prestigious golf feel
  tiers: {
    outstanding: {
      bg: 'bg-[#C1A84C]/10',
      border: 'border-[#C1A84C]/30',
      text: 'text-[#8B7635]',
      fill: 'bg-[#C1A84C]',
      badge: 'bg-[#C1A84C] text-white',
      activeBg: 'bg-[#C1A84C]',
      activeText: 'text-white',
      chipBg: 'bg-[#C1A84C]/10',
      chipText: 'text-[#8B7635]',
    },
    excellent: {
      bg: 'bg-[#334E3D]/5',
      border: 'border-[#334E3D]/20',
      text: 'text-[#334E3D]',
      fill: 'bg-[#334E3D]',
      badge: 'bg-[#334E3D] text-white',
      activeBg: 'bg-[#334E3D]',
      activeText: 'text-white',
      chipBg: 'bg-[#334E3D]/5',
      chipText: 'text-[#334E3D]',
    },
    veryGood: {
      bg: 'bg-[#334E3D]/5',
      border: 'border-[#334E3D]/20',
      text: 'text-[#334E3D]',
      fill: 'bg-[#334E3D]',
      badge: 'bg-[#334E3D] text-white',
      activeBg: 'bg-[#334E3D]',
      activeText: 'text-white',
      chipBg: 'bg-[#334E3D]/5',
      chipText: 'text-[#334E3D]',
    },
    good: {
      bg: 'bg-[#334E3D]/5',
      border: 'border-[#334E3D]/20',
      text: 'text-[#334E3D]',
      fill: 'bg-[#334E3D]',
      badge: 'bg-[#334E3D] text-white',
      activeBg: 'bg-[#334E3D]',
      activeText: 'text-white',
      chipBg: 'bg-[#334E3D]/5',
      chipText: 'text-[#334E3D]',
    },
    fair: {
      bg: 'bg-[#334E3D]/5',
      border: 'border-[#334E3D]/20',
      text: 'text-[#334E3D]',
      fill: 'bg-[#334E3D]',
      badge: 'bg-[#334E3D] text-white',
      activeBg: 'bg-[#334E3D]',
      activeText: 'text-white',
      chipBg: 'bg-[#334E3D]/5',
      chipText: 'text-[#334E3D]',
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

  // Score ring gradient colors - CHARTREUS FOR OUTSTANDING ONLY, Emerald for rest
  scoreRing: {
    outstanding: { from: '#C1A84C', to: '#C1A84C' }, // Chartreus gold
    excellent: { from: '#334E3D', to: '#334E3D' },   // Emerald
    veryGood: { from: '#334E3D', to: '#334E3D' },    // Emerald
    good: { from: '#334E3D', to: '#334E3D' },        // Emerald
    fair: { from: '#334E3D', to: '#334E3D' },        // Emerald
  },
} as const;

// Tier gradient mapping for distribution bars - CHARTREUS FOR OUTSTANDING ONLY, Emerald for rest
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-[#C1A84C]',
  Excellent: 'bg-[#334E3D]',
  'Very Good': 'bg-[#334E3D]',
  Good: 'bg-[#334E3D]',
  Fair: 'bg-[#334E3D]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
