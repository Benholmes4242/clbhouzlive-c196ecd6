/**
 * Course Detail Page Design Tokens
 * Premium, world-class golf course profile styling
 */

export const courseDetailTokens = {
  // Rating tier colors with semantic naming
  tiers: {
    outstanding: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      fill: 'from-amber-400 to-amber-500',
      badge: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white',
      activeBg: 'bg-amber-500',
      activeText: 'text-white',
      chipBg: 'bg-amber-100',
      chipText: 'text-amber-700',
    },
    excellent: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      fill: 'from-emerald-400 to-emerald-500',
      badge: 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white',
      activeBg: 'bg-emerald-500',
      activeText: 'text-white',
      chipBg: 'bg-emerald-100',
      chipText: 'text-emerald-700',
    },
    veryGood: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      fill: 'from-blue-400 to-blue-500',
      badge: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
      activeBg: 'bg-blue-500',
      activeText: 'text-white',
      chipBg: 'bg-blue-100',
      chipText: 'text-blue-700',
    },
    good: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      fill: 'from-slate-400 to-slate-500',
      badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
      activeBg: 'bg-slate-500',
      activeText: 'text-white',
      chipBg: 'bg-slate-100',
      chipText: 'text-slate-700',
    },
    fair: {
      bg: 'bg-stone-50',
      border: 'border-stone-200',
      text: 'text-stone-600',
      fill: 'from-stone-400 to-stone-500',
      badge: 'bg-gradient-to-r from-stone-400 to-stone-500 text-white',
      activeBg: 'bg-stone-500',
      activeText: 'text-white',
      chipBg: 'bg-stone-100',
      chipText: 'text-stone-600',
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

  // Score ring gradient colors
  scoreRing: {
    outstanding: { from: '#f59e0b', to: '#eab308' },
    excellent: { from: '#10b981', to: '#34d399' },
    veryGood: { from: '#3b82f6', to: '#60a5fa' },
    good: { from: '#64748b', to: '#94a3b8' },
    fair: { from: '#78716c', to: '#a8a29e' },
  },
} as const;

// Tier gradient mapping for distribution bars
export const tierGradients: Record<string, string> = {
  Outstanding: 'bg-gradient-to-r from-amber-400 to-amber-500',
  Excellent: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
  'Very Good': 'bg-gradient-to-r from-blue-400 to-blue-500',
  Good: 'bg-gradient-to-r from-slate-400 to-slate-500',
  Fair: 'bg-gradient-to-r from-stone-400 to-stone-500',
};

export type TierKey = keyof typeof courseDetailTokens.tiers;
