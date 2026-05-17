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
