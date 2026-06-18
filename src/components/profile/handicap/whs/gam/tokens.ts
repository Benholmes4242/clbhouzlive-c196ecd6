// Shared tokens for gamified handicap (gam_*) surfaces. Matches Dispatch aesthetic.
export const GAM = {
  AMBER: '#F7931E',
  AMBER_14: 'rgba(247,147,30,0.14)',
  AMBER_06: 'rgba(247,147,30,0.06)',
  DEEP_AMBER: '#B26818',
  GOLD: '#FBBC2E',
  INK: '#0F172A',
  INK_70: '#475569',
  INK_55: 'rgba(15,23,42,0.55)',
  INK_40: 'rgba(15,23,42,0.40)',
  INK_10: 'rgba(15,23,42,0.10)',
  INK_06: 'rgba(15,23,42,0.06)',
  SILVER: '#94A3B8',
  BRONZE: '#A16207',
  GREY: '#94A3B8',
  FONT_GEIST: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  TABULAR: { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' },
} as const;


/**
 * Dark-mode rarity tokens for surfaces rendered on var(--hcp-bg-0).
 */
export const RARITY_DARK: Record<
  'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'bronze' | 'silver' | 'emerald' | 'diamond' | 'obsidian',
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
    labelFg: 'var(--hcp-t-60)',
    labelBg: 'rgba(148,163,184,0.14)',
    pillBorder: 'rgba(148,163,184,0.30)',
    cardBorder: 'rgba(148,163,184,0.22)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(148,163,184,0.16) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: null,
  },
  uncommon: {
    iconBg: 'rgba(59,130,246,0.14)',
    iconRing: 'rgba(59,130,246,0.42)',
    labelFg: '#2563EB',
    labelBg: 'rgba(59,130,246,0.14)',
    pillBorder: 'rgba(59,130,246,0.35)',
    cardBorder: 'rgba(59,130,246,0.28)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(59,130,246,0.16) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: '0 0 32px -10px rgba(59,130,246,0.35)',
  },
  rare: {
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.45)',
    labelFg: '#C97211',
    labelBg: 'rgba(247,147,30,0.16)',
    pillBorder: 'rgba(247,147,30,0.40)',
    cardBorder: 'rgba(247,147,30,0.32)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(247,147,30,0.16) 100%)',
    topStripe: null,
    glow: null,
    outerGlow: '0 0 36px -10px rgba(247,147,30,0.40)',
  },
  epic: {
    iconBg: 'rgba(168,85,247,0.14)',
    iconRing: 'rgba(168,85,247,0.45)',
    labelFg: '#7E22CE',
    labelBg: 'rgba(168,85,247,0.14)',
    pillBorder: 'rgba(168,85,247,0.40)',
    cardBorder: 'rgba(168,85,247,0.32)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(168,85,247,0.16) 100%)',
    topStripe: 'linear-gradient(90deg, #A855F7 0%, #C084FC 100%)',
    glow: null,
    outerGlow: '0 0 36px -10px rgba(168,85,247,0.45)',
  },
  legendary: {
    iconBg: 'rgba(247,147,30,0.22)',
    iconRing: 'rgba(251,188,46,0.55)',
    labelFg: '#C97211',
    labelBg:
      'linear-gradient(90deg, rgba(251,188,46,0.22) 0%, rgba(247,147,30,0.22) 100%)',
    pillBorder: 'rgba(251,188,46,0.45)',
    cardBorder: 'rgba(247,147,30,0.42)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep:
      'linear-gradient(135deg, #FFFFFF 0%, #FFF8EA 55%, rgba(247,147,30,0.22) 100%)',
    topStripe: 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 50%, #F7931E 100%)',
    glow: 'inset 0 0 0 1px rgba(251,188,46,0.15)',
    outerGlow: '0 0 28px -10px rgba(247,147,30,0.32)',
  },
  bronze: {
    iconBg: 'rgba(205,127,50,0.18)',
    iconRing: 'rgba(205,127,50,0.55)',
    labelFg: '#A85F1E',
    labelBg: 'linear-gradient(90deg, rgba(205,127,50,0.22) 0%, rgba(139,90,43,0.22) 100%)',
    pillBorder: 'rgba(205,127,50,0.42)',
    cardBorder: 'rgba(205,127,50,0.42)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep: 'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(205,127,50,0.20) 100%)',
    topStripe: 'linear-gradient(90deg, #8B5A2B 0%, #CD7F32 50%, #8B5A2B 100%)',
    glow: 'inset 0 0 0 1px rgba(205,127,50,0.14)',
    outerGlow: '0 0 28px -10px rgba(205,127,50,0.30)',
  },
  silver: {
    iconBg: 'rgba(192,192,200,0.18)',
    iconRing: 'rgba(192,192,200,0.55)',
    labelFg: '#64748B',
    labelBg: 'linear-gradient(90deg, rgba(192,192,200,0.22) 0%, rgba(148,163,184,0.22) 100%)',
    pillBorder: 'rgba(192,192,200,0.45)',
    cardBorder: 'rgba(192,192,200,0.45)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep: 'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(148,163,184,0.20) 100%)',
    topStripe: 'linear-gradient(90deg, #94A3B8 0%, #E2E8F0 50%, #94A3B8 100%)',
    glow: 'inset 0 0 0 1px rgba(192,192,200,0.14)',
    outerGlow: '0 0 28px -10px rgba(192,192,200,0.30)',
  },
  emerald: {
    iconBg: 'rgba(16,185,129,0.18)',
    iconRing: 'rgba(16,185,129,0.55)',
    labelFg: '#047857',
    labelBg: 'linear-gradient(90deg, rgba(16,185,129,0.22) 0%, rgba(4,120,87,0.22) 100%)',
    pillBorder: 'rgba(16,185,129,0.48)',
    cardBorder: 'rgba(16,185,129,0.48)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep: 'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(16,185,129,0.20) 100%)',
    topStripe: 'linear-gradient(90deg, #047857 0%, #34D399 50%, #047857 100%)',
    glow: 'inset 0 0 0 1px rgba(16,185,129,0.14)',
    outerGlow: '0 0 30px -10px rgba(16,185,129,0.38)',
  },
  diamond: {
    iconBg: 'rgba(125,211,252,0.18)',
    iconRing: 'rgba(125,211,252,0.58)',
    labelFg: '#0284C7',
    labelBg: 'linear-gradient(90deg, rgba(125,211,252,0.22) 0%, rgba(59,130,246,0.22) 100%)',
    pillBorder: 'rgba(125,211,252,0.50)',
    cardBorder: 'rgba(125,211,252,0.50)',
    cardBg: 'var(--hcp-bg-1)',
    cardSweep: 'linear-gradient(135deg, #FFFFFF 0%, var(--hcp-bg-2) 55%, rgba(125,211,252,0.22) 100%)',
    topStripe: 'linear-gradient(90deg, #3B82F6 0%, #93C5FD 30%, #FFFFFF 50%, #93C5FD 70%, #3B82F6 100%)',
    glow: 'inset 0 0 0 1px rgba(125,211,252,0.16)',
    outerGlow: '0 0 32px -10px rgba(125,211,252,0.38)',
  },
  obsidian: {
    iconBg: 'rgba(247,147,30,0.14)',
    iconRing: 'rgba(247,147,30,0.60)',
    labelFg: '#FBBC2E',
    labelBg: 'linear-gradient(90deg, rgba(247,147,30,0.22) 0%, rgba(184,134,11,0.22) 100%)',
    pillBorder: 'rgba(247,147,30,0.55)',
    cardBorder: 'rgba(247,147,30,0.55)',
    cardBg: '#000000',
    cardSweep: 'linear-gradient(135deg, #000000 0%, #1A0E00 40%, #2B1A00 100%)',
    topStripe: 'linear-gradient(90deg, #FBBC2E 0%, #FFFFFF 50%, #FBBC2E 100%)',
    glow: 'inset 0 0 0 1px rgba(251,188,46,0.18)',
    outerGlow: '0 0 36px -8px rgba(251,188,46,0.55)',
  },
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
