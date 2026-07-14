/**
 * TierGem -- the canonical wall-level insignia used across surfaces.
 *
 * Renders a squircle gem chip with a hex-glyph inside, tinted from
 * MATERIAL_HEX (the same palette the Trophy Room + RankIdentityCard
 * consume). Zero-medal / null-level users render nothing -- never an
 * empty-state placeholder.
 */

import React from 'react';
import {
  levelForMedals,
  type WallMaterial,
} from '@/components/profile/handicap/whs/gam/trophy-room/_shared/levels';
import { MATERIAL_HEX } from '@/components/profile/handicap/whs/gam/trophy-room/_shared/rarityPalette';

const OBSIDIAN_EDGE = '#D4A017';

export type TierGemSize = 'sm' | 'md' | 'xl';

const SIZE_PX: Record<TierGemSize, number> = {
  sm: 14,
  md: 22,
  xl: 48,
};

function materialColor(m: WallMaterial): string {
  if (m === 'obsidian') return '#2A2F36';
  return (MATERIAL_HEX as Record<string, string>)[m] ?? '#C97B4A';
}

/**
 * Presentational primitive: the squircle chip + hex-glyph. Exported so
 * RankIdentityCard's oversized gem can consume the identical asset
 * mapping without a second inline copy.
 */
export function GemVisual({
  material,
  size,
}: {
  material: WallMaterial;
  size: number;
}) {
  const c = materialColor(material);
  const isObsidian = material === 'obsidian';
  const chipRadius = Math.max(4, Math.round(size * 0.26));
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: chipRadius,
        background: isObsidian
          ? `radial-gradient(120% 90% at 20% 0%, ${OBSIDIAN_EDGE}55 0%, transparent 55%), linear-gradient(160deg, #12151C 0%, #07080C 100%)`
          : `radial-gradient(120% 90% at 20% 0%, ${c}55 0%, transparent 55%), linear-gradient(160deg, ${c} 0%, ${c}33 100%)`,
        border: `1px solid ${isObsidian ? OBSIDIAN_EDGE + '59' : c + '59'}`,
        boxShadow: `0 0 ${Math.round(size * 0.45)}px ${
          isObsidian ? OBSIDIAN_EDGE : c
        }2E, inset 0 1px 0 rgba(255,255,255,0.12)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden
    >
      <div
        style={{
          width: size * 0.5,
          height: size * 0.58,
          background: isObsidian
            ? `linear-gradient(135deg, ${OBSIDIAN_EDGE}, ${OBSIDIAN_EDGE}55 55%, ${OBSIDIAN_EDGE}CC)`
            : `linear-gradient(135deg, ${c}, ${c}55 55%, ${c}CC)`,
          clipPath:
            'polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)',
          boxShadow: `0 0 ${Math.round(size * 0.2)}px ${
            isObsidian ? OBSIDIAN_EDGE : c
          }88`,
        }}
      />
    </div>
  );
}

interface TierGemProps {
  medals: number | null | undefined;
  size?: TierGemSize;
  className?: string;
}

/**
 * Wall-level insignia derived from a medal count. Renders nothing when
 * medals is null/0 (no gem for players who have not started the climb).
 */
export function TierGem({ medals, size = 'md', className }: TierGemProps) {
  if (medals == null || medals <= 0) return null;
  const level = levelForMedals(medals);
  if (!level) return null;
  return (
    <span className={className} style={{ display: 'inline-flex', lineHeight: 0 }}>
      <GemVisual material={level.material} size={SIZE_PX[size]} />
    </span>
  );
}

export default TierGem;
