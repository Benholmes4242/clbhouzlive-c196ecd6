import React from 'react';
import { type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';

interface ChampionsUnclaimedCardProps {
  category: LegendCategory;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  /** Alternating band matching the discover page course-records ledger. */
  banded?: boolean;
  /** Backdrop theme. */
  theme?: 'light' | 'dark';
}

const AMBER = '#F7931E';

export const ChampionsUnclaimedCard: React.FC<ChampionsUnclaimedCardProps> = ({
  category,
  categoryLabel,
  categoryIcon: CatIcon,
  banded = false,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isAlbatross = category === 'most_albatrosses_90d' || category === 'most_albatrosses_all_time';
  const headline = isAlbatross
    ? 'No champion yet — your first albatross takes the crown'
    : 'No champion yet — be the first to claim this crown';

  const bandBg = isLight ? 'rgba(15,23,42,0.035)' : 'rgba(255,255,255,0.025)';
  const hairline = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)';

  return (
    <div
      style={{
        padding: '14px 16px',
        borderTop: `0.5px solid ${hairline}`,
        background: banded ? bandBg : 'transparent',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-60)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
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

