import { rarityColor, rarityColorSoft } from '@/lib/gam/visuals';
import { RARITY_DARK } from '../../tokens';
import type { BadgeRarity } from '@/lib/gam/types';

export interface RarityPalette {
  color: string;
  tint: string;
  border: string;
  label: string;
  /** Gradient used for the detail-sheet hero. */
  heroGradient: string;
  /** 3-stop diagonal gradient for the card body. Sourced from RARITY_DARK. */
  cardSweep: string;
  /** Top edge stripe — legendary only. Null otherwise. */
  topStripe: string | null;
  /** Outer coloured glow shadow — uncommon and up. Null otherwise. */
  outerGlow: string | null;
  /** Colour used for the rarity-tinted meta line. */
  metaColor: string;
}

export const RARITY_PALETTE: Record<BadgeRarity, RarityPalette> = {
  common: {
    color: rarityColor.common,
    tint: rarityColorSoft.common,
    border: 'rgba(148,163,184,0.30)',
    label: 'COMMON',
    heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.22) 0%, var(--hcp-bg-1) 70%)',
    cardSweep: RARITY_DARK.common.cardSweep,
    topStripe: RARITY_DARK.common.topStripe,
    outerGlow: RARITY_DARK.common.outerGlow,
    metaColor: RARITY_DARK.common.labelFg,
  },
  uncommon: {
    color: rarityColor.uncommon,
    tint: rarityColorSoft.uncommon,
    border: 'rgba(59,130,246,0.30)',
    label: 'UNCOMMON',
    heroGradient: 'linear-gradient(160deg, rgba(59,130,246,0.25) 0%, var(--hcp-bg-1) 70%)',
    cardSweep: RARITY_DARK.uncommon.cardSweep,
    topStripe: RARITY_DARK.uncommon.topStripe,
    outerGlow: RARITY_DARK.uncommon.outerGlow,
    metaColor: RARITY_DARK.uncommon.labelFg,
  },
  rare: {
    color: rarityColor.rare,
    tint: rarityColorSoft.rare,
    border: 'rgba(247,147,30,0.30)',
    label: 'RARE',
    heroGradient: 'linear-gradient(160deg, rgba(247,147,30,0.25) 0%, var(--hcp-bg-1) 70%)',
    cardSweep: RARITY_DARK.rare.cardSweep,
    topStripe: RARITY_DARK.rare.topStripe,
    outerGlow: RARITY_DARK.rare.outerGlow,
    metaColor: RARITY_DARK.rare.labelFg,
  },
  epic: {
    color: rarityColor.epic,
    tint: rarityColorSoft.epic,
    border: 'rgba(168,85,247,0.30)',
    label: 'EPIC',
    heroGradient: 'linear-gradient(160deg, rgba(168,85,247,0.28) 0%, var(--hcp-bg-1) 70%)',
    cardSweep: RARITY_DARK.epic.cardSweep,
    topStripe: RARITY_DARK.epic.topStripe,
    outerGlow: RARITY_DARK.epic.outerGlow,
    metaColor: RARITY_DARK.epic.labelFg,
  },
  legendary: {
    color: rarityColor.legendary,
    tint: rarityColorSoft.legendary,
    border: 'rgba(251,188,46,0.40)',
    label: 'LEGENDARY',
    heroGradient: 'linear-gradient(160deg, rgba(251,188,46,0.32) 0%, rgba(247,147,30,0.18) 40%, var(--hcp-bg-1) 80%)',
    cardSweep: RARITY_DARK.legendary.cardSweep,
    topStripe: RARITY_DARK.legendary.topStripe,
    outerGlow: RARITY_DARK.legendary.outerGlow,
    metaColor: RARITY_DARK.legendary.labelFg,
  },
};

/** Legend titles always render with the legendary treatment. */
export const LEGEND_PALETTE = RARITY_PALETTE.legendary;

/**
 * Material Tier palettes for lifetime showpieces. Keyed by reachedTier (1–5).
 * T1 Bronze · T2 Silver · T3 Emerald · T4 Diamond · T5 Obsidian.
 */
export const MATERIAL_PALETTES: Record<1 | 2 | 3 | 4 | 5, RarityPalette> = {
  1: {
    color: '#CD7F32',
    tint: 'rgba(205,127,50,0.16)',
    border: 'rgba(205,127,50,0.42)',
    label: 'BRONZE',
    heroGradient: 'linear-gradient(160deg, rgba(205,127,50,0.32) 0%, rgba(139,90,43,0.16) 40%, var(--hcp-bg-1) 80%)',
    cardSweep: 'linear-gradient(160deg, rgba(205,127,50,0.16) 0%, rgba(205,127,50,0.05) 100%)',
    topStripe: RARITY_DARK.bronze.topStripe,
    outerGlow: RARITY_DARK.bronze.outerGlow,
    metaColor: RARITY_DARK.bronze.labelFg,
  },
  2: {
    color: '#C0C0C8',
    tint: 'rgba(192,192,200,0.16)',
    border: 'rgba(192,192,200,0.45)',
    label: 'SILVER',
    heroGradient: 'linear-gradient(160deg, rgba(192,192,200,0.30) 0%, rgba(148,163,184,0.14) 40%, var(--hcp-bg-1) 80%)',
    cardSweep: 'linear-gradient(160deg, rgba(192,192,200,0.18) 0%, rgba(192,192,200,0.05) 100%)',
    topStripe: RARITY_DARK.silver.topStripe,
    outerGlow: RARITY_DARK.silver.outerGlow,
    metaColor: RARITY_DARK.silver.labelFg,
  },
  3: {
    color: '#10B981',
    tint: 'rgba(16,185,129,0.16)',
    border: 'rgba(16,185,129,0.48)',
    label: 'EMERALD',
    heroGradient: 'linear-gradient(160deg, rgba(16,185,129,0.34) 0%, rgba(4,120,87,0.16) 40%, var(--hcp-bg-1) 80%)',
    cardSweep: RARITY_DARK.emerald.cardSweep,
    topStripe: RARITY_DARK.emerald.topStripe,
    outerGlow: RARITY_DARK.emerald.outerGlow,
    metaColor: RARITY_DARK.emerald.labelFg,
  },
  4: {
    color: '#7DD3FC',
    tint: 'rgba(125,211,252,0.16)',
    border: 'rgba(125,211,252,0.50)',
    label: 'DIAMOND',
    heroGradient: 'linear-gradient(160deg, rgba(125,211,252,0.36) 0%, rgba(59,130,246,0.18) 40%, var(--hcp-bg-1) 80%)',
    cardSweep: RARITY_DARK.diamond.cardSweep,
    topStripe: RARITY_DARK.diamond.topStripe,
    outerGlow: RARITY_DARK.diamond.outerGlow,
    metaColor: RARITY_DARK.diamond.labelFg,
  },
  5: {
    color: '#FBBC2E',
    tint: 'rgba(247,147,30,0.14)',
    border: 'rgba(247,147,30,0.55)',
    label: 'OBSIDIAN',
    heroGradient: 'linear-gradient(160deg, rgba(247,147,30,0.40) 0%, #1A0E00 50%, #000000 100%)',
    cardSweep: RARITY_DARK.obsidian.cardSweep,
    topStripe: RARITY_DARK.obsidian.topStripe,
    outerGlow: RARITY_DARK.obsidian.outerGlow,
    metaColor: RARITY_DARK.obsidian.labelFg,
  },
};

/**
 * Region palettes for the four regional Top 100 showpieces. Colour by region,
 * not by tier — so GB&I is always emerald, Europe blue, USA red, World gold.
 */
const REGION_PALETTE: Record<string, RarityPalette> = {
  top_100_gbni: {
    color: '#34D399',
    tint: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
    label: 'GB&I',
    heroGradient: 'linear-gradient(160deg, rgba(52,211,153,0.22) 0%, var(--hcp-bg-1) 70%)',
    cardSweep:
      'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(52,211,153,0.04) 50%, var(--hcp-bg-1) 100%)',
    topStripe: null,
    outerGlow: 'rgba(52,211,153,0.18)',
    metaColor: '#34D399',
  },
  top_100_europe: {
    color: '#3B82F6',
    tint: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.30)',
    label: 'EUROPE',
    heroGradient: 'linear-gradient(160deg, rgba(59,130,246,0.22) 0%, var(--hcp-bg-1) 70%)',
    cardSweep:
      'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 50%, var(--hcp-bg-1) 100%)',
    topStripe: null,
    outerGlow: 'rgba(59,130,246,0.18)',
    metaColor: '#3B82F6',
  },
  top_100_usa: {
    color: '#EF4444',
    tint: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    label: 'USA',
    heroGradient: 'linear-gradient(160deg, rgba(239,68,68,0.22) 0%, var(--hcp-bg-1) 70%)',
    cardSweep:
      'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.04) 50%, var(--hcp-bg-1) 100%)',
    topStripe: null,
    outerGlow: 'rgba(239,68,68,0.18)',
    metaColor: '#EF4444',
  },
  top_100_worldwide: {
    color: '#FBBC2E',
    tint: 'rgba(251,188,46,0.14)',
    border: 'rgba(251,188,46,0.32)',
    label: 'WORLD',
    heroGradient: 'linear-gradient(160deg, rgba(251,188,46,0.24) 0%, var(--hcp-bg-1) 70%)',
    cardSweep:
      'linear-gradient(135deg, rgba(251,188,46,0.16) 0%, rgba(251,188,46,0.04) 50%, var(--hcp-bg-1) 100%)',
    topStripe: null,
    outerGlow: 'rgba(251,188,46,0.20)',
    metaColor: '#FBBC2E',
  },
};

export function regionPaletteForBadge(badgeId: string): RarityPalette | null {
  return REGION_PALETTE[badgeId] ?? null;
}

/**
 * Returns palette for a showpiece. Regional Top 100 badges resolve by region;
 * other showpieces fall back to material tier. Locked (tier 0) handled caller-side.
 */
export function paletteForShowpiece(reachedTier: number, badgeId?: string): RarityPalette {
  if (badgeId) {
    const r = regionPaletteForBadge(badgeId);
    if (r) return r;
  }
  const clamped = Math.max(1, Math.min(5, reachedTier || 1)) as 1 | 2 | 3 | 4 | 5;
  return MATERIAL_PALETTES[clamped];
}

/** Palette used when a card is locked. */
export const LOCKED_PALETTE: RarityPalette = {
  color: 'rgba(148,163,184,0.55)',
  tint: 'rgba(148,163,184,0.06)',
  border: 'rgba(148,163,184,0.18)',
  label: 'LOCKED',
  heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.14) 0%, var(--hcp-bg-1) 70%)',
  cardSweep:
    'linear-gradient(150deg, var(--hcp-bg-2) 0%, #FFFFFF 70%)',
  topStripe: null,
  outerGlow: null,
  metaColor: 'rgba(148,163,184,0.55)',
};
