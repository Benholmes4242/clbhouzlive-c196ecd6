/**
 * SEASON CUT -- the current season above the lifetime list, so a member sees
 * what THIS year holds without reading it out of lifetime totals.
 *
 * Derived from the rounds the sheet already holds. No new query.
 * The boundary is the calendar year -- see seasonCut() for why the app's
 * quarter-based Ascent season is not used here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { Panel, Figure, MetaLabel } from '../Primitives';
import { seasonCut } from '../criteria';
import type { CareerRoundRow } from '@/hooks/gam/useCareerRounds';

interface Props {
  rounds: CareerRoundRow[];
}

export const SeasonCutPanel: React.FC<Props> = ({ rounds }) => {
  const { t } = useTranslation('handicap');
  const year = new Date().getFullYear();
  const cut = seasonCut(rounds, year);
  if (cut.rounds === 0) return null;

  const cells: Array<{ label: string; value: string | number }> = [
    { label: t('career.seasonRounds'), value: cut.rounds },
    { label: t('career.seasonBirdies'), value: cut.birdies },
    { label: t('career.seasonBest'), value: cut.best ?? '--' },
  ];

  return (
    <Panel
      title={t('career.seasonKicker', { year })}
      action={<MetaLabel>{t('career.seasonAside')}</MetaLabel>}
    >
      <div style={{ display: 'flex', fontFamily: REC.FONT }}>
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRight: i === cells.length - 1 ? 'none' : `1px solid ${REC.BORDER}`,
            }}
          >
            <MetaLabel>{cell.label}</MetaLabel>
            <div style={{ marginTop: 4 }}>
              <Figure value={cell.value} size={20} color={REC.AMBER} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export default SeasonCutPanel;
