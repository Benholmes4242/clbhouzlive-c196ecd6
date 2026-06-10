import React from 'react';
import { type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';

interface ChampionsUnclaimedCardProps {
  category: LegendCategory;
  categoryLabel: string;
  categoryIcon: LucideIcon;
}

const AMBER = '#F7931E';

export const ChampionsUnclaimedCard: React.FC<ChampionsUnclaimedCardProps> = ({
  category,
  categoryLabel,
  categoryIcon: CatIcon,
}) => {
  const isAlbatross = category === 'most_albatrosses_90d' || category === 'most_albatrosses_all_time';
  const headline = isAlbatross
    ? 'No champion yet — your first albatross takes the crown'
    : 'No champion yet — be the first to claim this crown';

  return (
    <div
      style={{
        border: '1.5px dashed rgba(15,23,42,0.20)',
        borderRadius: 16,
        padding: 16,
        margin: '0 16px 10px',
        background: 'rgba(15,23,42,0.012)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#64748B',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <CatIcon size={11} strokeWidth={2.4} />
        {categoryLabel} · Unclaimed
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: AMBER,
          letterSpacing: '-0.005em',
        }}
      >
        {headline}
      </div>
    </div>
  );
};

export default ChampionsUnclaimedCard;
