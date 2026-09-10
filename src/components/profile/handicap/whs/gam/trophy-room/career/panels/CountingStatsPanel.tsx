/**
 * COUNTING STATS -- birdies, eagles, aces, rounds, course record titles.
 *
 * ONE LIST, NOT TWO. There used to be a NEXT UP shortcut panel above an
 * EVERYTHING list, so Rounds Played, Globetrotter and Holes in One each
 * rendered TWICE on one sheet. The list is now sorted by closeness to the next
 * tier, which puts the three closest at the top by construction and makes the
 * shortcut panel unnecessary. The old "{n} MAXED OF {m}" score is gone with it;
 * the meta reads "{n} of {m} complete".
 *
 * Each row states four things: what the achievement is (the catalogue
 * description, never invented here), the value, where the member is in the
 * ladder, and when a tier was reached.
 *
 * THE TIER LADDER IS WORDS, NOT DASHES. The old pip strip was a row of dashes
 * with no key anywhere on the sheet, so it could only be decoded by guessing.
 * It reads "190 more for tier 4 . tier 3 of 5" instead. A finished ladder reads
 * "All tiers reached" in GREEN with a full green bar and no next-tier line.
 *
 * THE DATE IS LABELLED. It used to sit bare on the right ("JUL 2026") with
 * nothing saying what it was. It now reads "Tier {n} reached {month year}", and
 * it renders ONLY where a tier has been reached -- absent on a zero row, not
 * blank-but-present.
 *
 * THE BAR IS (v - prev) / (next - prev) -- progress from the previous threshold
 * to the next, the only reading that answers "how close am I". This is NOT the
 * compare sheet's share-of-sum bar and must not become it. Amber is the fill
 * because a bar is a state; every FIGURE on this sheet is ink.
 *
 * The share renders only above the denominator floor (see shareModel.ts) --
 * below it these rows are counts and thresholds only, which is correct on
 * today's population.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { REC, LABEL } from '../tokens';
import { Panel, RowButton, Bar, MetaLabel } from '../Primitives';
import { measuredShare } from '../shareModel';
import { namedPartsFor } from '../criteria';
import { monthYear } from '../format';
import { attainedAt } from '@/lib/gam/badgeBackfill';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  items: Achievement[];
  /** Sparse account: the closing footnote says what appears as they play. */
  sparse?: boolean;
}

/** Row kicker: 9 / 700 / 0.12em, the sheet's one row-kicker treatment. */
const ROW_KICKER: React.CSSProperties = { ...LABEL };

const NAME: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: REC.INK,
};

/** Row figures are 16. There is no other row figure size on this sheet. */
const FIG = (color: string): React.CSSProperties => ({
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  color,
  ...REC.TABULAR,
  flexShrink: 0,
});

/** Sub-line: the catalogue description, 11 / T40. */
const SUB: React.CSSProperties = { fontSize: 11, color: REC.DIM, lineHeight: 1.45 };

interface Row {
  item: Achievement;
  value: number;
  pct: number;
  toGo: number;
  /** No next threshold: the ladder is finished. Green, not amber. */
  complete: boolean;
  progress: string;
  share: number | null;
  /** "Tier 3 reached JUL 2026", or null where no tier has been reached. */
  when: string | null;
}

export const CountingStatsPanel: React.FC<Props> = ({ data, items, sparse }) => {
  const { t } = useTranslation('handicap');
  if (items.length === 0) return null;

  const rows: Row[] = items.map((item) => {
    const value = item.currentValue ?? 0;
    const next = item.nextThreshold;
    const total = item.tiers.length;
    const prev =
      item.reachedTier > 0 && item.tiers[item.reachedTier - 1]
        ? item.tiers[item.reachedTier - 1].threshold
        : 0;
    const pct =
      next && next > prev ? ((value - prev) / (next - prev)) * 100 : value > 0 ? 100 : 0;
    const share = measuredShare(data.shares.get(item.badgeId), data.config.shareMinDenominator);
    const toGo = next ? Math.max(0, next - value) : 0;
    const named = namedPartsFor(item.badgeId, data.rounds);

    // Progress copy, in order: named parts, then the finished ladder, then the
    // distance WITH the member's position in the ladder stated in words.
    let progress: string;
    if (named && named.parts.length > 0) {
      const parts = named.parts.join(', ');
      progress =
        named.parts.length >= named.total
          ? t('career.partsAll', { parts })
          : t('career.partsSoFar', { parts });
    } else if (!next) {
      progress = t('career.allTiersReached');
    } else if (total > 1) {
      progress = t('career.tierProgress', {
        n: toGo,
        next: item.reachedTier + 1,
        reached: item.reachedTier,
        total,
      });
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
      // The date belongs to a REACHED tier. No tier reached, no date -- and the
      // row does not keep a blank slot for one.
      //
      // attainedAt() returns null for the 24 Jul 2026 bulk evaluation rows, whose
      // earned_at records when the row was written, not when the tier was
      // reached. Those rows render NO date rather than a fabricated one; rows
      // earned since that run render normally. See src/lib/gam/badgeBackfill.ts.
      when:
        item.reachedTier > 0 && monthYear(attainedAt(item.earnedAt))
          ? t('career.tierReached', {
              tier: item.reachedTier,
              when: monthYear(attainedAt(item.earnedAt)),
            })
          : null,
    };
  });

  const complete = rows.filter((r) => r.complete && r.value > 0).length;

  /**
   * CLOSENESS TO THE NEXT TIER is the sort, so the three closest lead without a
   * separate panel. Not specified by the brief and decided here: a finished
   * ladder has no next tier to be close to and sorts last, and a row at zero
   * sorts after live progress -- so the top of the list is always the part of
   * the record that is moving.
   */
  const ordered = [...rows].sort((a, b) => {
    const band = (r: Row) => (r.complete ? 2 : r.value > 0 ? 0 : 1);
    if (band(a) !== band(b)) return band(a) - band(b);
    if (b.pct !== a.pct) return b.pct - a.pct;
    return a.item.name.localeCompare(b.item.name);
  });

  return (
    <Panel
      title={t('career.countingKicker')}
      action={<MetaLabel>{t('career.countingComplete', { n: complete, total: rows.length })}</MetaLabel>}
    >
      {ordered.map((r, i) => (
        <RowButton
          key={r.item.badgeId}
          last={i === ordered.length - 1}
          onClick={() => data.onOpen({ kind: 'counting', badgeId: r.item.badgeId })}
          ariaLabel={`${r.item.name}, ${r.value}`}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, ...NAME }}>{r.item.name}</span>
            <span style={FIG(r.value > 0 ? REC.INK : REC.DIM)}>{r.value}</span>
          </div>
          {/* Criteria. Nothing renders when the catalogue has no description --
              a description is written at source, never in the client. */}
          {r.item.description ? (
            <div style={{ marginTop: 4, ...SUB }}>{r.item.description}</div>
          ) : null}
          <div style={{ marginTop: 8 }}>
            {/* GREEN HERE MEANS THE LADDER IS FINISHED and nothing else. It is
                not "better"; amber is in-progress. */}
            <Bar
              pct={r.pct}
              color={
                r.complete && r.value > 0 ? REC.GOOD : r.value > 0 ? REC.AMBER : REC.BAR_TRACK
              }
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
                ...ROW_KICKER,
                color: r.complete && r.value > 0 ? REC.GOOD : REC.MUTE,
              }}
            >
              {r.progress}
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
              {r.share !== null && (
                <span style={{ ...ROW_KICKER, color: REC.GOOD }}>{r.share}% of members</span>
              )}
              {r.when ? <span style={ROW_KICKER}>{r.when}</span> : null}
            </span>
          </div>
        </RowButton>
      ))}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${REC.BORDER}` }}>
        {sparse ? (
          <div style={{ fontSize: 11, color: REC.MUTE, lineHeight: 1.5 }}>
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
