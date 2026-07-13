import { rarityColor, rarityColorSoft } from '@/lib/gam/visuals';
import { RARITY_DARK } from '../../tokens';
import type { BadgeRarity } from '@/lib/gam/types';

// rgba helper
// Accepts '#RRGGBB' or 'rgb[a](r,g,b[,a])'. Applying a new alpha to an
// rgba() input REPLACES its alpha - this prevents high-alpha palette
// entries (e.g. common='rgba(148,163,184,0.6)') from leaking as a solid
// light slab when passed through a "wash" stop.
export function rgbaOf(input: string, a: number): string {
  if (!input) return input;
  if (input.startsWith('#')) {
    const h = input.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  return input;
}

/**
 * THE FORGE — single source of truth for material hues used on tiered cards.
 * Obsidian is a treatment (black-glass + gold edge), not a hue — it uses
 * FORGE_GOLD only for glints, pills, and edges.
 */
export const FORGE = {
  bronze: '#C97B4A',
  silver: '#CDD3DE',
  emerald: '#12B784',
  diamond: '#7DD3FC',
} as const;

export const FORGE_GOLD = '#FBBC2E';

export const MATERIAL_HEX: Record<string, string> = {
  bronze: FORGE.bronze,
  silver: FORGE.silver,
  emerald: FORGE.emerald,
  diamond: FORGE.diamond,
  obsidian: '#2A2F36',
};

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
  /** Two hero dark stops (mixed with material). Material palettes only. */
  hero1?: string;
  hero2?: string;
  /** PascalCase material name for user-facing strings. */
  material?: string;
}

export const RARITY_PALETTE: Record<BadgeRarity, RarityPalette> = {
  common: {
    color: rarityColor.common,
    tint: rarityColorSoft.common,
    border: 'rgba(148,163,184,0.30)',
    label: 'COMMON',
    heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.22) 0%, #1B1E27 70%)',
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
    heroGradient: 'linear-gradient(160deg, rgba(59,130,246,0.25) 0%, #1B1E27 70%)',
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
    heroGradient: 'linear-gradient(160deg, rgba(247,147,30,0.25) 0%, #1B1E27 70%)',
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
    heroGradient: 'linear-gradient(160deg, rgba(168,85,247,0.28) 0%, #1B1E27 70%)',
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
    heroGradient: 'linear-gradient(160deg, rgba(251,188,46,0.32) 0%, rgba(247,147,30,0.18) 40%, #1B1E27 80%)',
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
    color: FORGE.bronze,
    tint: 'rgba(201,123,74,0.14)',
    border: 'rgba(201,123,74,0.45)',
    label: 'BRONZE',
    material: 'Bronze',
    hero1: '#1A100A',
    hero2: '#0C0806',
    heroGradient:
      'radial-gradient(120% 90% at 20% 0%, rgba(201,123,74,0.34) 0%, rgba(201,123,74,0.08) 55%, transparent 100%), linear-gradient(180deg, #1A100A, #0C0806)',
    cardSweep: 'linear-gradient(180deg, rgba(201,123,74,0.13), rgba(201,123,74,0.02) 70%)',
    topStripe: RARITY_DARK.bronze.topStripe,
    outerGlow: RARITY_DARK.bronze.outerGlow,
    metaColor: FORGE.bronze,
  },
  2: {
    color: FORGE.silver,
    tint: 'rgba(205,211,222,0.14)',
    border: 'rgba(205,211,222,0.45)',
    label: 'SILVER',
    material: 'Silver',
    hero1: '#13161C',
    hero2: '#0A0C10',
    heroGradient:
      'radial-gradient(120% 90% at 20% 0%, rgba(205,211,222,0.30) 0%, rgba(205,211,222,0.07) 55%, transparent 100%), linear-gradient(180deg, #13161C, #0A0C10)',
    cardSweep: 'linear-gradient(180deg, rgba(205,211,222,0.13), rgba(205,211,222,0.02) 70%)',
    topStripe: RARITY_DARK.silver.topStripe,
    outerGlow: RARITY_DARK.silver.outerGlow,
    metaColor: FORGE.silver,
  },
  // EMERALD tier — scoped exemption from palette canon (rarity/tier only).
  3: {
    color: FORGE.emerald,
    tint: 'rgba(18,183,132,0.14)',
    border: 'rgba(18,183,132,0.48)',
    label: 'EMERALD',
    material: 'Emerald',
    hero1: '#0F1D18',
    hero2: '#0C1210',
    heroGradient:
      'radial-gradient(120% 90% at 20% 0%, rgba(18,183,132,0.34) 0%, rgba(18,183,132,0.08) 55%, transparent 100%), linear-gradient(180deg, #0F1D18, #0C1210)',
    cardSweep: 'linear-gradient(180deg, rgba(18,183,132,0.13), rgba(18,183,132,0.02) 70%)',
    topStripe: RARITY_DARK.emerald.topStripe,
    outerGlow: RARITY_DARK.emerald.outerGlow,
    metaColor: FORGE.emerald,
  },
  4: {
    color: FORGE.diamond,
    tint: 'rgba(125,211,252,0.14)',
    border: 'rgba(125,211,252,0.50)',
    label: 'DIAMOND',
    material: 'Diamond',
    hero1: '#0D1720',
    hero2: '#080D14',
    heroGradient:
      'radial-gradient(120% 90% at 20% 0%, rgba(125,211,252,0.34) 0%, rgba(125,211,252,0.08) 55%, transparent 100%), linear-gradient(180deg, #0D1720, #080D14)',
    cardSweep: 'linear-gradient(180deg, rgba(125,211,252,0.13), rgba(125,211,252,0.02) 70%)',
    topStripe: RARITY_DARK.diamond.topStripe,
    outerGlow: RARITY_DARK.diamond.outerGlow,
    metaColor: FORGE.diamond,
  },
  5: {
    color: FORGE_GOLD,
    tint: 'rgba(251,188,46,0.14)',
    border: 'rgba(251,188,46,0.55)',
    label: 'OBSIDIAN',
    material: 'Obsidian',
    hero1: '#12151C',
    hero2: '#07080C',
    heroGradient:
      'radial-gradient(120% 90% at 20% 0%, rgba(251,188,46,0.30) 0%, rgba(251,188,46,0.06) 55%, transparent 100%), linear-gradient(170deg, #12151C 0%, #07080C 100%)',
    cardSweep: 'linear-gradient(170deg, #12151C 0%, #07080C 100%)',
    topStripe: RARITY_DARK.obsidian.topStripe,
    outerGlow: RARITY_DARK.obsidian.outerGlow,
    metaColor: FORGE_GOLD,
  },
};

/** Material name for a reachedTier (1..5). Empty for 0. */
export function materialNameForTier(tier: number): string {
  if (tier <= 0) return '';
  const idx = Math.max(1, Math.min(5, tier)) as 1 | 2 | 3 | 4 | 5;
  return MATERIAL_PALETTES[idx].material ?? MATERIAL_PALETTES[idx].label;
}

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
    heroGradient: 'linear-gradient(160deg, rgba(52,211,153,0.22) 0%, #1B1E27 70%)',
    cardSweep: 'linear-gradient(160deg, rgba(52,211,153,0.16) 0%, rgba(52,211,153,0.05) 100%)',
    topStripe: null,
    outerGlow: 'rgba(52,211,153,0.18)',
    metaColor: '#34D399',
  },
  top_100_europe: {
    color: '#3B82F6',
    tint: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.30)',
    label: 'EUROPE',
    heroGradient: 'linear-gradient(160deg, rgba(59,130,246,0.22) 0%, #1B1E27 70%)',
    cardSweep: 'linear-gradient(160deg, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.05) 100%)',
    topStripe: null,
    outerGlow: 'rgba(59,130,246,0.18)',
    metaColor: '#3B82F6',
  },
  top_100_usa: {
    color: '#EF4444',
    tint: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    label: 'USA',
    heroGradient: 'linear-gradient(160deg, rgba(239,68,68,0.22) 0%, #1B1E27 70%)',
    cardSweep: 'linear-gradient(160deg, rgba(239,68,68,0.16) 0%, rgba(239,68,68,0.05) 100%)',
    topStripe: null,
    outerGlow: 'rgba(239,68,68,0.18)',
    metaColor: '#EF4444',
  },
  top_100_worldwide: {
    color: '#FBBC2E',
    tint: 'rgba(251,188,46,0.14)',
    border: 'rgba(251,188,46,0.32)',
    label: 'WORLD',
    heroGradient: 'linear-gradient(160deg, rgba(251,188,46,0.24) 0%, #1B1E27 70%)',
    cardSweep: 'linear-gradient(160deg, rgba(251,188,46,0.18) 0%, rgba(251,188,46,0.05) 100%)',
    topStripe: null,
    outerGlow: 'rgba(251,188,46,0.20)',
    metaColor: '#FBBC2E',
  },
};

export function regionPaletteForBadge(badgeId: string): RarityPalette | null {
  return REGION_PALETTE[badgeId] ?? null;
}

/**
 * Returns palette for a showpiece. All showpieces (including regional Top 100)
 * now resolve to the user's CURRENT MATERIAL tier — region is expressed via
 * badge label/name, not via card colour. Locked (tier 0) handled caller-side.
 */
export function paletteForShowpiece(reachedTier: number, _badgeId?: string): RarityPalette {
  const clamped = Math.max(1, Math.min(5, reachedTier || 1)) as 1 | 2 | 3 | 4 | 5;
  return MATERIAL_PALETTES[clamped];
}

/** Palette used when a card is locked. */
export const LOCKED_PALETTE: RarityPalette = {
  color: 'rgba(100,116,139,0.85)',
  tint: 'rgba(148,163,184,0.10)',
  border: 'rgba(148,163,184,0.35)',
  label: 'LOCKED',
  heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.14) 0%, #1B1E27 70%)',
  cardSweep: 'linear-gradient(160deg, rgba(148,163,184,0.14) 0%, #1B1E27 100%)',
  topStripe: null,
  outerGlow: null,
  metaColor: 'rgba(100,116,139,0.85)',
};
