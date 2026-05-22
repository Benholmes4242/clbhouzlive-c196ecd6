import React from 'react';
import { Check } from 'lucide-react';
import { GAM } from '../../tokens';
import { relativeTime } from '@/lib/gam/visuals';
import type { TrophyTier } from '../_shared/normalizeTrophyItem';

interface Props {
  tier: TrophyTier;
  metric: string | null;
}

export const TierRow: React.FC<Props> = ({ tier, metric }) => {
  const earned = tier.earned;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '0.5px solid var(--hcp-line)',
        opacity: earned ? 1 : 0.55,
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: earned ? GAM.AMBER_14 : 'var(--hcp-bg-2)',
          color: earned ? GAM.AMBER : 'var(--hcp-t-60)',
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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-100)' }}>{tier.name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--hcp-t-60)', marginTop: 1, ...GAM.TABULAR }}>
          {tier.threshold}{metric ? ` ${metric.replace(/_/g, ' ')}` : ''}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: earned ? GAM.AMBER : 'var(--hcp-t-40)',
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
