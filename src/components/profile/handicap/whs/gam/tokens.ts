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
  'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  {
    iconBg: string;
    iconRing: string;
    labelFg: string;
    cardBorder: string;
    cardBg: string;
    topStripe: string | null;
    glow: string | null;
  }
> = {
  common: {
    iconBg: 'rgba(148,163,184,0.10)',
    iconRing: 'rgba(148,163,184,0.18)',
    labelFg: 'rgba(148,163,184,0.85)',
    cardBorder: 'var(--hcp-line)',
    cardBg: 'var(--hcp-bg-1)',
    topStripe: null,
    glow: null,
  },
  uncommon: {
    iconBg: 'rgba(59,130,246,0.12)',
    iconRing: 'rgba(59,130,246,0.32)',
    labelFg: '#7DAFFF',
    cardBorder: 'rgba(59,130,246,0.22)',
    cardBg: 'linear-gradient(180deg, var(--hcp-bg-1) 0%, rgba(59,130,246,0.04) 100%)',
    topStripe: null,
    glow: null,
  },
  rare: {
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.40)',
    labelFg: '#F7931E',
    cardBorder: 'rgba(247,147,30,0.32)',
    cardBg: 'linear-gradient(180deg, var(--hcp-bg-1) 0%, rgba(247,147,30,0.05) 100%)',
    topStripe: null,
    glow: null,
  },
  epic: {
    iconBg: 'rgba(168,85,247,0.14)',
    iconRing: 'rgba(168,85,247,0.40)',
    labelFg: '#C084FC',
    cardBorder: 'rgba(168,85,247,0.32)',
    cardBg: 'linear-gradient(180deg, var(--hcp-bg-1) 0%, rgba(168,85,247,0.06) 100%)',
    topStripe: 'linear-gradient(90deg, #A855F7 0%, #C084FC 100%)',
    glow: null,
  },
  legendary: {
    iconBg: 'rgba(247,147,30,0.20)',
    iconRing: 'rgba(251,188,46,0.50)',
    labelFg: '#FBBC2E',
    cardBorder: 'rgba(247,147,30,0.45)',
    cardBg: 'linear-gradient(180deg, var(--hcp-bg-1) 0%, rgba(247,147,30,0.08) 100%)',
    topStripe: 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 50%, #F7931E 100%)',
    glow: 'inset 0 0 0 1px rgba(251,188,46,0.18), 0 0 24px -8px rgba(247,147,30,0.4)',
  },
};

export const BRACKET_EMOJI: Record<string, string> = {
  platinum: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

export const LEGEND_CATEGORY_META: Record<
  string,
  { emoji: string; label: string; unit?: string }
> = {
  birdie_legend: { emoji: '🟠', label: 'Birdie Legend', unit: 'birdies' },
  score_legend: { emoji: '🏆', label: 'Score Legend', unit: 'avg' },
  visitor_legend: { emoji: '📍', label: 'Visitor Legend', unit: 'rounds' },
  gross_record: { emoji: '🥏', label: 'Gross Record', unit: 'gross' },
  stableford_champ: { emoji: '⛳', label: 'Stableford Champ', unit: 'pts' },
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
