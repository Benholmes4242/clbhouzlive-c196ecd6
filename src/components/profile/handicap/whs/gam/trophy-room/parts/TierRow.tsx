import React from 'react';
import { Check } from 'lucide-react';
import { GAM } from '../../tokens';
import { relativeTime } from '@/lib/gam/visuals';
import { MATERIAL_PALETTES } from '../_shared/rarityPalette';
import type { TrophyTier } from '../_shared/normalizeTrophyItem';

interface Props {
  tier: TrophyTier;
  metric: string | null;
  /** When true, render the earned state in this tier's material colour. */
  isShowpiece?: boolean;
}

export const TierRow: React.FC<Props> = ({ tier, metric, isShowpiece = false }) => {
  const earned = tier.earned;
  const tierIndex = Math.max(1, Math.min(5, tier.tier)) as 1 | 2 | 3 | 4 | 5;
  const materialPalette = isShowpiece ? MATERIAL_PALETTES[tierIndex] : null;

  const earnedBg = materialPalette ? materialPalette.tint : GAM.AMBER_14;
  const earnedFg = materialPalette ? materialPalette.color : GAM.AMBER;
  const earnedBorder = materialPalette ? `1px solid ${materialPalette.border}` : 'none';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        opacity: earned ? 1 : 0.55,
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: earned ? earnedBg : '#20242E',
          color: earned ? earnedFg : 'rgba(255,255,255,0.55)',
          border: earned ? earnedBorder : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
          ...GAM.TABULAR,
        }}
      >
        {earned ? <Check size={14} strokeWidth={2.8} /> : tier.tier}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.96)' }}>{tier.name}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 1, ...GAM.TABULAR }}>
          {tier.threshold}{metric ? ` ${metric.replace(/_/g, ' ')}` : ''}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: earned ? earnedFg : 'rgba(255,255,255,0.38)',
        }}
      >
        {earned
          ? tier.earnedAt
            ? `Earned ${relativeTime(tier.earnedAt)}`
            : 'Earned'
          : 'Locked'}
      </div>
    </div>
  );
};

export default TierRow;
