// Shared tokens for gamified handicap (gam_*) surfaces. Matches Dispatch aesthetic.
export const GAM = {
  AMBER: '#F7931E',
  AMBER_14: 'rgba(247,147,30,0.14)',
  AMBER_06: 'rgba(247,147,30,0.06)',
  GOLD: '#FBBC2E',
  INK: '#0F172A',
  INK_70: '#475569',
  INK_55: 'rgba(15,23,42,0.55)',
  INK_40: 'rgba(15,23,42,0.40)',
  INK_10: 'rgba(15,23,42,0.10)',
  INK_06: 'rgba(15,23,42,0.06)',
  GREEN: '#059669',
  GREEN_14: 'rgba(5,150,105,0.14)',
  RED: '#DC2626',
  RED_14: 'rgba(220,38,38,0.14)',
  SILVER: '#94A3B8',
  BRONZE: '#A16207',
  GREY: '#94A3B8',
  FONT_GEIST: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  TABULAR: { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' },
} as const;

export const RARITY_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  common: { bg: 'rgba(148,163,184,0.18)', fg: '#475569', label: 'Common' },
  uncommon: { bg: 'rgba(59,130,246,0.14)', fg: '#1D4ED8', label: 'Uncommon' },
  rare: { bg: 'rgba(247,147,30,0.18)', fg: '#9A5A00', label: 'Rare' },
  epic: { bg: 'rgba(168,85,247,0.16)', fg: '#7C3AED', label: 'Epic' },
  legendary: { bg: 'linear-gradient(90deg,#FBBC2E,#F7931E)', fg: '#1A1300', label: 'Legendary' },
};

/**
 * Dark-mode rarity tokens for surfaces rendered on var(--hcp-bg-0).
 */
export const RARITY_DARK: Record<
  'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'platinum',
  {
    iconBg: string;
    iconRing: string;
    labelFg: string;
    labelBg: string;
    pillBorder: string;
    cardBorder: string;
    cardBg: string;
    cardSweep: string;
    topStripe: string | null;
    glow: string | null;
    outerGlow: string | null;
  }
> = {
  common: {
    iconBg: 'rgba(148,163,184,0.14)',
    iconRing: 'rgba(148,163,184,0.40)',
    labelFg: 'rgba(203,213,225,1)',
    labelBg: 'rgba(148,163,184,0.14)',
    pillBorder: 'rgba(148,163,184,0.30)',
    cardBorder: 'rgba(148,163,184,0.22)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(148,163,184,0.10) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: null,
  },
  uncommon: {
    iconBg: 'rgba(59,130,246,0.14)',
    iconRing: 'rgba(59,130,246,0.42)',
    labelFg: '#93C5FD',
    labelBg: 'rgba(59,130,246,0.14)',
    pillBorder: 'rgba(59,130,246,0.35)',
    cardBorder: 'rgba(59,130,246,0.28)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(59,130,246,0.12) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: '0 0 32px -10px rgba(59,130,246,0.35)',
  },
  rare: {
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.45)',
    labelFg: '#FCD34D',
    labelBg: 'rgba(247,147,30,0.16)',
    pillBorder: 'rgba(247,147,30,0.40)',
    cardBorder: 'rgba(247,147,30,0.32)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(247,147,30,0.12) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: '0 0 36px -10px rgba(247,147,30,0.40)',
  },
  epic: {
    iconBg: 'rgba(168,85,247,0.14)',
    iconRing: 'rgba(168,85,247,0.45)',
    labelFg: '#D8B4FE',
    labelBg: 'rgba(168,85,247,0.14)',
    pillBorder: 'rgba(168,85,247,0.40)',
    cardBorder: 'rgba(168,85,247,0.32)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(168,85,247,0.14) 100%)',
    topStripe: 'linear-gradient(90deg, #A855F7 0%, #C084FC 100%)',
    glow: null,
    outerGlow: '0 0 36px -10px rgba(168,85,247,0.45)',
  },
  legendary: {
    iconBg: 'rgba(247,147,30,0.22)',
    iconRing: 'rgba(251,188,46,0.55)',
    labelFg: '#FBBC2E',
    labelBg:
      'linear-gradient(90deg, rgba(251,188,46,0.22) 0%, rgba(247,147,30,0.22) 100%)',
    pillBorder: 'rgba(251,188,46,0.45)',
    cardBorder: 'rgba(247,147,30,0.42)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(247,147,30,0.18) 100%)',
    topStripe: 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 50%, #F7931E 100%)',
    glow: 'inset 0 0 0 1px rgba(251,188,46,0.15)',
    outerGlow: '0 0 28px -10px rgba(247,147,30,0.32)',
  },
  platinum: {
    iconBg: 'rgba(203,213,225,0.18)',
    iconRing: 'rgba(229,231,235,0.55)',
    labelFg: '#E5E7EB',
    labelBg: 'linear-gradient(90deg, rgba(229,231,235,0.22) 0%, rgba(203,213,225,0.22) 100%)',
    pillBorder: 'rgba(229,231,235,0.42)',
    cardBorder: 'rgba(203,213,225,0.38)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, var(--hcp-bg-1) 0%, #151B23 50%, rgba(229,231,235,0.14) 100%)',
    topStripe: 'linear-gradient(90deg, #CBD5E1 0%, #F1F5F9 50%, #CBD5E1 100%)',
    glow: 'inset 0 0 0 1px rgba(229,231,235,0.14)',
    outerGlow: '0 0 28px -10px rgba(229,231,235,0.30)',
  },
};

export const BRACKET_EMOJI: Record<string, string> = {
  platinum: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};


export function relativeDays(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.max(0, Math.floor(ms / 86400000));
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
