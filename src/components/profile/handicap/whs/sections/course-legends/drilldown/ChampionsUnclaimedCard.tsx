/**
 * Unclaimed board. Still an invitation - it just stops shouting: no
 * alternating band, no full-width amber headline, body weight copy.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import { A, Panel, SANS } from '@/features/courses/components/holes/analytical/tokens';

interface ChampionsUnclaimedCardProps {
  category: LegendCategory;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  /** Accepted for signature compat; the analytical treatment has no bands. */
  banded?: boolean;
  /** Accepted for signature compat; this tab is light-only. */
  theme?: 'light' | 'dark';
}

export const ChampionsUnclaimedCard: React.FC<ChampionsUnclaimedCardProps> = ({
  category,
  categoryLabel,
}) => {
  const { t } = useTranslation('courses');
  const isAlbatross =
    category === 'most_albatrosses_90d' || category === 'most_albatrosses_all_time';
  const headline = isAlbatross
    ? t('champions.unclaimedAlbatross')
    : t('champions.unclaimedFirst');

  return (
    <div style={{ padding: '0 14px 12px', fontFamily: SANS }}>
      <Panel title={categoryLabel} aside={t('champions.unclaimed')}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: A.MUTE }}>{headline}</p>
      </Panel>
    </div>
  );
};

export default ChampionsUnclaimedCard;
