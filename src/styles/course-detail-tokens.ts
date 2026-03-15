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
      bg: 'bg-[#1e293b]/10',
      border: 'border-[#1e293b]/20',
      text: 'text-[#1e293b]',
      fill: 'bg-[#1e293b]',
      badge: 'bg-[#1e293b] text-white',
      activeBg: 'bg-[#1e293b]',
      activeText: 'text-white',
      chipBg: 'bg-[#1e293b]/10',
      chipText: 'text-[#1e293b]',
    },
    veryGood: {
      bg: 'bg-[#475569]/10',
      border: 'border-[#475569]/20',
      text: 'text-[#475569]',
      fill: 'bg-[#475569]',
      badge: 'bg-[#475569] text-white',
      activeBg: 'bg-[#475569]',
      activeText: 'text-white',
      chipBg: 'bg-[#475569]/10',
      chipText: 'text-[#475569]',
    },
    good: {
      bg: 'bg-[#64748b]/10',
      border: 'border-[#64748b]/20',
      text: 'text-[#64748b]',
      fill: 'bg-[#64748b]',
      badge: 'bg-[#64748b] text-white',
      activeBg: 'bg-[#64748b]',
      activeText: 'text-white',
      chipBg: 'bg-[#64748b]/10',
      chipText: 'text-[#64748b]',
    },
    fair: {
      bg: 'bg-[#94a3b8]/10',
      border: 'border-[#94a3b8]/20',
      text: 'text-[#94a3b8]',
      fill: 'bg-[#94a3b8]',
      badge: 'bg-[#94a3b8] text-white',
      activeBg: 'bg-[#94a3b8]',
      activeText: 'text-white',
      chipBg: 'bg-[#94a3b8]/10',
      chipText: 'text-[#94a3b8]',
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
    excellent: { from: '#f59e0b', to: '#fbbf24' },
    veryGood: { from: '#f59e0b', to: '#fbbf24' },
    good: { from: '#f59e0b', to: '#fbbf24' },
    fair: { from: '#f59e0b', to: '#fbbf24' },
  },
} as const;

// Tier gradient mapping for distribution bars - AMBER FOR OUTSTANDING ONLY, Gray for rest
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  Excellent: 'bg-[#1e293b]',
  'Very Good': 'bg-[#475569]',
  Good: 'bg-[#64748b]',
  Fair: 'bg-[#94a3b8]',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
