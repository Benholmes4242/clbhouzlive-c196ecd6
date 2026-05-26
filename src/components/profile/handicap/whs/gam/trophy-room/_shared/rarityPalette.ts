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

/** Palette used for earned showpiece achievements (lifetime counters + Top 100). */
export const PLATINUM_PALETTE: RarityPalette = {
  color: '#E5E7EB',
  tint: 'rgba(229,231,235,0.12)',
  border: 'rgba(229,231,235,0.32)',
  label: 'SHOWPIECE',
  heroGradient: 'linear-gradient(160deg, rgba(229,231,235,0.26) 0%, rgba(203,213,225,0.14) 40%, var(--hcp-bg-1) 80%)',
  cardSweep: RARITY_DARK.platinum.cardSweep,
  topStripe: RARITY_DARK.platinum.topStripe,
  outerGlow: RARITY_DARK.platinum.outerGlow,
  metaColor: RARITY_DARK.platinum.labelFg,
};

/** Palette used when a card is locked. */
export const LOCKED_PALETTE: RarityPalette = {
  color: 'rgba(148,163,184,0.55)',
  tint: 'rgba(148,163,184,0.06)',
  border: 'rgba(148,163,184,0.18)',
  label: 'LOCKED',
  heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.14) 0%, var(--hcp-bg-1) 70%)',
  cardSweep:
    'linear-gradient(135deg, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0.01) 50%, var(--hcp-bg-1) 100%)',
  topStripe: null,
  outerGlow: null,
  metaColor: 'rgba(148,163,184,0.55)',
};
