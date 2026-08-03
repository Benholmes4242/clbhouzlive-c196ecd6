/**
 * COUNTING STATS -- birdies, eagles, aces, rounds, course crown titles.
 *
 * Each row states THREE things: what the achievement is (the catalogue
 * description, never invented here), where the member is (named parts when
 * the set is derivable, otherwise the distance to the next threshold), and
 * when it last moved (earned_at, omitted entirely when null).
 *
 * The share renders only above the denominator floor (see shareModel.ts) --
 * below it these rows are counts and thresholds only, which is correct on
 * today's population.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { Panel, RowButton, Figure, Bar, MetaLabel } from '../Primitives';
import { measuredShare } from '../shareModel';
import { namedPartsFor } from '../criteria';
import { monthYear } from '../format';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  items: Achievement[];
  /** Sparse account: the closing footnote says what appears as they play. */
  sparse?: boolean;
}

export const CountingStatsPanel: React.FC<Props> = ({ data, items, sparse }) => {
  const { t } = useTranslation('handicap');
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
        const named = namedPartsFor(item.badgeId, data.rounds);
        const when = monthYear(item.earnedAt);

        // Progress copy, in order: named parts, then every threshold, then distance.
        let progress: string;
        if (named && named.parts.length > 0) {
          const parts = named.parts.join(', ');
          progress =
            named.parts.length >= named.total
              ? t('career.partsAll', { parts })
              : t('career.partsSoFar', { parts });
        } else if (!next) {
          progress = t('career.everyThreshold');
        } else {
          progress = t('career.toGoTo', { n: toGo, target: next });
        }

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
            {/* Criteria. Nothing renders when the catalogue has no description --
                a description is written at source, never in the client. */}
            {item.description ? (
              <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 600, color: REC.MUTE }}>
                {item.description}
              </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
              <Bar pct={pct} color={value > 0 ? REC.AMBER : REC.BAR_TRACK} />
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
              <span>{progress}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                {share !== null && (
                  <span style={{ color: REC.GOOD, fontWeight: 700 }}>{share}% of members</span>
                )}
                {when ? <span style={{ color: REC.DIM }}>{when}</span> : null}
              </span>
            </div>
          </RowButton>
        );
      })}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
        {sparse ? (
          <div style={{ fontSize: 11.5, color: REC.MUTE, lineHeight: 1.5 }}>
            {t('career.sparseFootnote')}
          </div>
        ) : (
          <MetaLabel>MEASURED ACROSS MEMBERS WITH A POSTED INDEX</MetaLabel>
        )}
      </div>
    </Panel>
  );
};

export default CountingStatsPanel;
