import { rarityColor, rarityColorSoft } from '@/lib/gam/visuals';
import type { BadgeRarity } from '@/lib/gam/types';

export interface RarityPalette {
  color: string;
  tint: string;
  border: string;
  label: string;
  /** Gradient used for the detail-sheet hero. */
  heroGradient: string;
}

export const RARITY_PALETTE: Record<BadgeRarity, RarityPalette> = {
  common: {
    color: rarityColor.common,
    tint: rarityColorSoft.common,
    border: 'rgba(148,163,184,0.30)',
    label: 'COMMON',
    heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.22) 0%, var(--hcp-bg-1) 70%)',
  },
  uncommon: {
    color: rarityColor.uncommon,
    tint: rarityColorSoft.uncommon,
    border: 'rgba(59,130,246,0.30)',
    label: 'UNCOMMON',
    heroGradient: 'linear-gradient(160deg, rgba(59,130,246,0.25) 0%, var(--hcp-bg-1) 70%)',
  },
  rare: {
    color: rarityColor.rare,
    tint: rarityColorSoft.rare,
    border: 'rgba(247,147,30,0.30)',
    label: 'RARE',
    heroGradient: 'linear-gradient(160deg, rgba(247,147,30,0.25) 0%, var(--hcp-bg-1) 70%)',
  },
  epic: {
    color: rarityColor.epic,
    tint: rarityColorSoft.epic,
    border: 'rgba(168,85,247,0.30)',
    label: 'EPIC',
    heroGradient: 'linear-gradient(160deg, rgba(168,85,247,0.28) 0%, var(--hcp-bg-1) 70%)',
  },
  legendary: {
    color: rarityColor.legendary,
    tint: rarityColorSoft.legendary,
    border: 'rgba(251,188,46,0.40)',
    label: 'LEGENDARY',
    heroGradient: 'linear-gradient(160deg, rgba(251,188,46,0.32) 0%, rgba(247,147,30,0.18) 40%, var(--hcp-bg-1) 80%)',
  },
};

/** Legend titles always render with the legendary treatment. */
export const LEGEND_PALETTE = RARITY_PALETTE.legendary;

/** Palette used when a card is locked. */
export const LOCKED_PALETTE: RarityPalette = {
  color: 'rgba(148,163,184,0.55)',
  tint: 'rgba(148,163,184,0.06)',
  border: 'rgba(148,163,184,0.18)',
  label: 'LOCKED',
  heroGradient: 'linear-gradient(160deg, rgba(148,163,184,0.14) 0%, var(--hcp-bg-1) 70%)',
};
