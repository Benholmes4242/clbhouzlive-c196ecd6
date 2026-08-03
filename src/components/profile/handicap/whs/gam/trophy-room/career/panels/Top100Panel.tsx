/**
 * TOP 100 -- four lists, each a count against a fixed set of 100.
 *
 * Below top100_share_floor no standing renders: with a median of 1 to 3
 * courses played, a share would say more about the sample than the member.
 * Above top100_rank_crossover the share saturates ("more than 94%" for
 * everybody), so an ordinal bound is used instead.
 */
import React from 'react';
import { REC } from '../tokens';
import { Panel, RowButton, Figure, Bar } from '../Primitives';
import { top100Standing } from '../shareModel';
import { top100BadgeIdToListSlug } from '../../_shared/showpieces';
import type { Achievement, CareerData } from '../types';

const LIST_LABEL: Record<string, string> = {
  top_100_worldwide: 'World Top 100',
  top_100_gbni: 'GB and Ireland Top 100',
  top_100_europe: 'Continental Europe Top 100',
  top_100_usa: 'USA Top 100',
};

const ORDER = ['top_100_worldwide', 'top_100_gbni', 'top_100_europe', 'top_100_usa'];

interface Props {
  data: CareerData;
  items: Achievement[];
}

export const Top100Panel: React.FC<Props> = ({ data, items }) => {
  const sorted = [...items].sort(
    (a, b) => ORDER.indexOf(a.badgeId) - ORDER.indexOf(b.badgeId),
  );
  if (sorted.length === 0) return null;

  return (
    <Panel title="TOP 100 LISTS">
      {sorted.map((item, i) => {
        const count = item.currentValue ?? 0;
        const slug = top100BadgeIdToListSlug(item.badgeId) ?? '';
        const standing = top100Standing(
          data.distribution,
          slug,
          count,
          data.config.top100ShareFloor,
          data.config.top100RankCrossover,
          data.config.shareMinDenominator,
        );
        return (
          <RowButton
            key={item.badgeId}
            last={i === sorted.length - 1}
            onClick={() => data.onOpen({ kind: 'top100', badgeId: item.badgeId })}
            ariaLabel={`${LIST_LABEL[item.badgeId] ?? item.name}, ${count} of 100`}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: REC.INK }}>
                {LIST_LABEL[item.badgeId] ?? item.name}
              </span>
              <span style={{ ...REC.TABULAR, fontSize: 12, color: REC.MUTE }}>
                <Figure value={count} size={20} color={count > 0 ? REC.AMBER : REC.DIM} /> of 100
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Bar pct={count} color={count > 0 ? REC.AMBER : REC.TRACK} />
            </div>
            <div
              style={{
                marginTop: 7,
                fontSize: 11.5,
                color: REC.MUTE,
                ...REC.TABULAR,
              }}
            >
              {standing.kind === 'share' && (
                <span style={{ color: REC.GOOD, fontWeight: 700 }}>
                  Ahead of {standing.pct}% of members
                </span>
              )}
              {standing.kind === 'ordinal' && (
                <span style={{ color: REC.GOOD, fontWeight: 700 }}>
                  Among the top {standing.members} of any member
                </span>
              )}
              {standing.kind === 'none' && <span>{100 - count} still to play</span>}
            </div>
          </RowButton>
        );
      })}
    </Panel>
  );
};

export default Top100Panel;
