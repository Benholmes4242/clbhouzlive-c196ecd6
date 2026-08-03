/**
 * MILESTONES -- one-off facts. Reached or not reached, with the month.
 *
 * Unreached milestones are listed plainly rather than hidden: what has not
 * happened yet is part of a record. No lock icons, no greyed cards.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  if (items.length === 0) return null;
  const reached = items.filter((i) => i.earned);
  const pending = items.filter((i) => !i.earned);
  const ordered = [...reached, ...pending];

  return (
    <Panel
      title="MILESTONES"
      action={
        <MetaLabel>
          {reached.length} OF {items.length} REACHED
        </MetaLabel>
      }
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
              <Dot on={item.earned} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  fontWeight: item.earned ? 700 : 600,
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
                  color: item.earned ? REC.AMBER : REC.DIM,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  ...REC.TABULAR,
                }}
              >
                {item.earned ? monthYear(item.earnedAt) || 'REACHED' : 'NOT YET'}
              </span>
            </div>
          </RowButton>
        );
      })}
    </Panel>
  );
};

export default MilestonesPanel;
