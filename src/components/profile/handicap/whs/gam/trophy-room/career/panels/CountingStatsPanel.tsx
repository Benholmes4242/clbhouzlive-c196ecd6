/**
 * COUNTING STATS -- birdies, eagles, aces, rounds, course crown titles.
 *
 * Each row states FOUR things: what the achievement is (the catalogue
 * description, never invented here), WHICH TIER THE MEMBER IS ON (the pip
 * strip -- reachedTier of tiers.length, both already in hand), where they are
 * within it (named parts when the set is derivable, otherwise the distance to
 * the next tier), and when it last moved (earned_at, omitted entirely when
 * null).
 *
 * THE BAR IS (v - prev) / (next - prev) -- progress from the previous
 * threshold to the next, which is the only reading that answers "how close am
 * I". This is NOT the compare sheet's share-of-sum bar and must not become it.
 *
 * NEXT UP is derived entirely from the rows below it: the three furthest
 * through their current tier, excluding completed sets and anything at zero.
 * No query, no new field. When nothing qualifies the block is absent rather
 * than empty.
 *
 * The share renders only above the denominator floor (see shareModel.ts) --
 * below it these rows are counts and thresholds only, which is correct on
 * today's population.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { Panel, RowButton, Bar, MetaLabel } from '../Primitives';
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

/** Local type, 700 everywhere. The shared LABEL token is 800. */
const LABEL_7: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: REC.DIM,
};

const NAME: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: REC.INK,
};

const FIG = (size: number, color: string): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 700,
  letterSpacing: '-0.04em',
  color,
  ...REC.TABULAR,
  flexShrink: 0,
});

/**
 * The tier position. Earned pips are long and amber, unearned short and
 * track -- so the strip reads as distance travelled without a caption.
 */
const TierPips: React.FC<{ reached: number; total: number }> = ({ reached, total }) => {
  if (total <= 1) return null;
  return (
    <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', gap: 2.5 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: i < reached ? 9 : 5,
            height: 3,
            borderRadius: 999,
            background: i < reached ? REC.AMBER : REC.TRACK,
          }}
        />
      ))}
    </span>
  );
};

interface Row {
  item: Achievement;
  value: number;
  pct: number;
  toGo: number;
  /** No next threshold: the set is finished. Green, not amber. */
  complete: boolean;
  progress: string;
  share: number | null;
  when: string | null;
}

export const CountingStatsPanel: React.FC<Props> = ({ data, items, sparse }) => {
  const { t } = useTranslation('handicap');
  if (items.length === 0) return null;

  const rows: Row[] = items.map((item) => {
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

    // Progress copy, in order: named parts, then every threshold, then the
    // distance -- which now NAMES THE TIER, so a first-tier row reads
    // "1 more for tier 1" instead of the old "1 to go to 1" stutter.
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
      progress = t('career.moreForTier', { n: toGo, tier: item.reachedTier + 1 });
    }

    return {
      item,
      value,
      pct,
      toGo,
      complete: !next,
      progress,
      share,
      when: monthYear(item.earnedAt),
    };
  });

  // ONE SCORE AT THE TOP. A list becomes a standing with something to move.
  const maxed = rows.filter((r) => r.complete && r.value > 0).length;

  // NEXT UP: closest to their next tier. Never padded, never empty.
  const nextUp = rows
    .filter((r) => !r.complete && r.value > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const score = (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, ...REC.TABULAR }}>
      <span style={{ ...LABEL_7, color: REC.GOOD, fontSize: 11 }}>
        {t('career.maxedOf', { n: maxed, total: rows.length })}
      </span>
    </span>
  );

  return (
    <>
      {nextUp.length > 0 && (
        <Panel title="COUNTING STATS" action={score}>
          {nextUp.map((r, i) => (
            <RowButton
              key={r.item.badgeId}
              last={i === nextUp.length - 1}
              onClick={() => data.onOpen({ kind: 'counting', badgeId: r.item.badgeId })}
              ariaLabel={`${r.item.name}, ${r.toGo} to go`}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0, ...NAME }}>{r.item.name}</span>
                <span style={FIG(17, REC.AMBER)}>{r.toGo}</span>
                <span style={{ ...LABEL_7 }}>{t('career.toGo')}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <Bar pct={r.pct} color={REC.AMBER} />
              </div>
            </RowButton>
          ))}
        </Panel>
      )}

      <Panel
        title={nextUp.length > 0 ? 'EVERYTHING' : 'COUNTING STATS'}
        action={nextUp.length > 0 ? undefined : score}
      >
        {rows.map((r, i) => (
          <RowButton
            key={r.item.badgeId}
            last={i === rows.length - 1}
            onClick={() => data.onOpen({ kind: 'counting', badgeId: r.item.badgeId })}
            ariaLabel={`${r.item.name}, ${r.value}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, ...NAME }}>{r.item.name}</span>
              <TierPips reached={r.item.reachedTier} total={r.item.tiers.length} />
              <span style={FIG(19, r.value > 0 ? REC.INK : REC.DIM)}>{r.value}</span>
            </div>
            {/* Criteria. Nothing renders when the catalogue has no description --
                a description is written at source, never in the client. */}
            {r.item.description ? (
              <div style={{ marginTop: 4, ...LABEL_7, color: REC.MUTE, letterSpacing: '0.1em' }}>
                {r.item.description}
              </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
              {/* GREEN HERE MEANS COMPLETE -- every threshold passed -- and
                  nothing else. It is not "better"; amber is in-progress. */}
              <Bar
                pct={r.pct}
                color={r.complete && r.value > 0 ? REC.GOOD : r.value > 0 ? REC.AMBER : REC.BAR_TRACK}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 7,
                ...REC.TABULAR,
              }}
            >
              <span
                style={{
                  ...LABEL_7,
                  color: r.complete && r.value > 0 ? REC.GOOD : REC.MUTE,
                  letterSpacing: '0.12em',
                }}
              >
                {r.progress}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                {r.share !== null && (
                  <span style={{ ...LABEL_7, color: REC.GOOD }}>{r.share}% of members</span>
                )}
                {r.when ? <span style={{ ...LABEL_7 }}>{r.when}</span> : null}
              </span>
            </div>
          </RowButton>
        ))}
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
    </>
  );
};

export default CountingStatsPanel;
