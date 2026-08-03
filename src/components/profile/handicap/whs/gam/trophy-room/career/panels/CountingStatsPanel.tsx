/**
 * COUNTING STATS -- birdies, eagles, aces, rounds, course crown titles.
 *
 * The count is the fact. The threshold line is what is next, stated as a
 * distance, not as a metal. The share renders only above the denominator
 * floor (see shareModel.ts) -- below it these rows are counts and thresholds
 * only, which is correct on today's population.
 */
import React from 'react';
import { REC } from '../tokens';
import { Panel, RowButton, Figure, Bar, MetaLabel } from '../Primitives';
import { measuredShare } from '../shareModel';
import { plural } from '../format';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  items: Achievement[];
}

export const CountingStatsPanel: React.FC<Props> = ({ data, items }) => {
  if (items.length === 0) return null;
  return (
    <Panel title="COUNTING STATS">
      {items.map((item, i) => {
        const value = item.currentValue ?? 0;
        const next = item.nextThreshold;
        const prev =
          item.reachedTier > 0 && item.tiers[item.reachedTier - 1]
            ? item.tiers[item.reachedTier - 1].threshold
            : 0;
        const pct =
          next && next > prev ? ((value - prev) / (next - prev)) * 100 : value > 0 ? 100 : 0;
        const share = measuredShare(data.shares.get(item.badgeId), data.config.shareMinDenominator);
        const toGo = next ? Math.max(0, next - value) : 0;
        return (
          <RowButton
            key={item.badgeId}
            last={i === items.length - 1}
            onClick={() => data.onOpen({ kind: 'counting', badgeId: item.badgeId })}
            ariaLabel={`${item.name}, ${value}`}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: REC.INK }}>
                {item.name}
              </span>
              <Figure value={value} size={20} color={value > 0 ? REC.INK : REC.DIM} />
            </div>
            <div style={{ marginTop: 8 }}>
              <Bar pct={pct} color={value > 0 ? REC.AMBER : REC.TRACK} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 7,
                fontSize: 11.5,
                color: REC.MUTE,
                ...REC.TABULAR,
              }}
            >
              <span>
                {next
                  ? `${toGo} ${plural(toGo, 'to go', 'to go')} to ${next}`
                  : 'Every threshold passed'}
              </span>
              {share !== null && (
                <span style={{ color: REC.GOOD, fontWeight: 700 }}>{share}% of members</span>
              )}
            </div>
          </RowButton>
        );
      })}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
        <MetaLabel>MEASURED ACROSS MEMBERS WITH A POSTED INDEX</MetaLabel>
      </div>
    </Panel>
  );
};

export default CountingStatsPanel;
