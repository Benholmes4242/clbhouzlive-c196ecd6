/**
 * MILESTONES -- one-off facts. Reached or not reached, with the month.
 *
 * SAME COLUMN, SAME RULE: a month inside the 24 Jul 2026 backfill window is a
 * write timestamp, not an achievement date, so the row shows the milestone as
 * reached and says nothing about when. See src/lib/gam/badgeBackfill.ts.
 *
 * THE MONTH IS THE SAME QUANTITY as the counting rows' date -- both are the
 * badge's earned_at -- so it is labelled the same way, "Reached {month year}".
 * See CountingStatsPanel for the open correctness question about that column.
 *
 * BADGE WALL: four across; earned = REC.GOOD, unearned = faint + dashed.
 * color_token is deliberately NOT read: green means a reached milestone only.
 * Dates and shares are not shown on the wall; their rules (badgeBackfill.ts,
 * shareModel.ts) are untouched.
 *
 * Unreached milestones are listed plainly rather than hidden: what has not
 * happened yet is part of a record. No lock icons, no greyed cards.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { REC } from '../tokens';
import { Panel, MetaLabel, Collapsible } from '../Primitives';
import { badgeIconFor } from '@/lib/gam/visuals';
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
        threshold={1}
        collapsedCount={1}
      >
      {[ordered.slice(0, 8), ordered.slice(8)]
        .filter((group) => group.length > 0)
        .map((group, g) => (
          <div
            key={g}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
              padding: g === 0 ? '12px 14px' : '0 14px 12px',
            }}
          >
            {group.map((item) => {
              const Glyph = badgeIconFor(item.iconKey);
              return (
                <button
                  key={item.badgeId}
                  type="button"
                  onClick={() => data.onOpen({ kind: 'milestone', badgeId: item.badgeId })}
                  aria-label={t(item.earned ? 'career.milestoneTileReached' : 'career.milestoneTileNotYet', { name: item.name })}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 12,
                    border: `1px ${item.earned ? 'solid' : 'dashed'} ${REC.BORDER}`,
                    background: item.earned ? REC.PANEL_2 : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    textAlign: 'center',
                    fontFamily: REC.FONT,
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 11,
                      display: 'grid',
                      placeItems: 'center',
                      background: item.earned ? REC.GOOD_WASH : 'transparent',
                      border: item.earned ? 'none' : `1px solid ${REC.BORDER}`,
                      color: item.earned ? REC.GOOD : REC.FAINT,
                    }}
                  >
                    <Glyph size={17} strokeWidth={2.1} />
                  </span>
                  <span
                    aria-hidden
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      lineHeight: 1.25,
                      color: item.earned ? REC.MUTE : REC.FAINT,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      maxWidth: '100%',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </Collapsible>
    </Panel>
  );
};

export default MilestonesPanel;
