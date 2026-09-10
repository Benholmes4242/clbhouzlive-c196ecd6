/**
 * MILESTONES -- one-off facts. Reached or not reached, with the month.
 *
 * THE MONTH IS THE SAME QUANTITY as the counting rows' date -- both are the
 * badge's earned_at -- so it is labelled the same way, "Reached {month year}".
 * See CountingStatsPanel for the open correctness question about that column.
 *
 * Unreached milestones are listed plainly rather than hidden: what has not
 * happened yet is part of a record. No lock icons, no greyed cards.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { REC } from '../tokens';
import { Panel, RowButton, Dot, MetaLabel, Collapsible } from '../Primitives';
import { monthYear } from '../format';
import { measuredShare } from '../shareModel';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  items: Achievement[];
}

export const MilestonesPanel: React.FC<Props> = ({ data, items }) => {
  const { t } = useTranslation('handicap');
  if (items.length === 0) return null;
  const reached = items.filter((i) => i.earned);
  const pending = items.filter((i) => !i.earned);
  const ordered = [...reached, ...pending];

  return (
    <Panel
      title={t('career.milestonesKicker')}
      action={
        <MetaLabel>
          {t('career.milestonesReached', { n: reached.length, total: items.length })}
        </MetaLabel>
      }
    >
      <Collapsible
        showAllLabel={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {t('career.milestonesSeeAll', { n: items.length })}
            <ChevronRight size={13} strokeWidth={2.4} />
          </span>
        }
        showFewerLabel={t('career.showFewer')}
      >
      {ordered.map((item, i) => {
        const share = measuredShare(data.shares.get(item.badgeId), data.config.shareMinDenominator);
        return (
          <RowButton
            key={item.badgeId}
            last={i === ordered.length - 1}
            onClick={() => data.onOpen({ kind: 'milestone', badgeId: item.badgeId })}
            ariaLabel={item.name}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Dot on={item.earned} color={REC.GOOD} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.earned ? REC.INK : REC.MUTE,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
              {share !== null && item.earned && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: REC.GOOD,
                    ...REC.TABULAR,
                  }}
                >
                  {share}%
                </span>
              )}
              <span
                style={{
                  fontSize: 11,
                  color: REC.DIM,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  ...REC.TABULAR,
                }}
              >
                {item.earned
                  ? monthYear(item.earnedAt)
                    ? t('career.milestoneReachedAt', { when: monthYear(item.earnedAt) })
                    : t('career.achieved')
                  : 'NOT YET'}
              </span>
            </div>
          </RowButton>
        );
      })}
      </Collapsible>
    </Panel>
  );
};

export default MilestonesPanel;
