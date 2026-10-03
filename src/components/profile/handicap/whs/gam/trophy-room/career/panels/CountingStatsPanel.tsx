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
import { tierTone } from '../medalTone';
import { useTranslation } from 'react-i18next';
import { REC, LABEL } from '../tokens';
import { MetaLabel } from '../Primitives';
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

/**
 * Short display names keyed by gam_badge_catalogue id; falls back to item.name.
 * The grid uppercases through CSS, the Closest card uses them as written.
 */
const SHORT_LABEL: Record<string, string> = {
  rounds_played: 'Rounds',
  legend_at_course: 'Course legend',
  continental: 'Continents',
  globetrotter: 'Countries',
  first_birdie: 'Birdies',
  first_eagle: 'Eagles',
  hole_in_one: 'Holes in one',
  albatross: 'Albatrosses',
  first_albatross: 'Albatrosses',
  four_seasons: 'Four seasons',
};

const RING_R = 36;
const RING_C = 2 * Math.PI * RING_R;

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

  const closest = ordered.find((r) => !r.complete && r.value > 0) ?? null;
  const shortLabel = (r: Row) => SHORT_LABEL[r.item.badgeId] ?? r.item.name;
  const open = (r: Row) => data.onOpen({ kind: 'counting', badgeId: r.item.badgeId });

  return (
    <section style={{ marginBottom: 22 }}>
      {closest && closest.item.nextThreshold ? (
        <button
          type="button"
          onClick={() => open(closest)}
          aria-label={`${shortLabel(closest)}, ${closest.value}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            width: '100%',
            padding: 16,
            borderRadius: 16,
            border: `1px solid ${REC.AMBER_LINE}`,
            background: REC.AMBER_WASH,
            marginBottom: 22,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: REC.FONT,
          }}
        >
          <span style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            <svg width={84} height={84} viewBox="0 0 84 84" aria-hidden>
              <circle cx={42} cy={42} r={RING_R} fill="none" stroke={REC.RING_TRACK} strokeWidth={6} />
              <circle
                cx={42}
                cy={42}
                r={RING_R}
                fill="none"
                stroke={REC.AMBER}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${(Math.max(0, Math.min(100, closest.pct)) / 100) * RING_C} ${RING_C}`}
                transform="rotate(-90 42 42)"
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: REC.INK,
                ...REC.TABULAR,
              }}
            >
              {closest.toGo}
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: REC.AMBER }}>
              CLOSEST
            </span>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: REC.INK, ...REC.TABULAR }}>
              {`${closest.toGo} to ${closest.item.nextThreshold}`}
            </span>
            <span style={{ fontSize: 12.5, color: REC.MUTE, ...REC.TABULAR }}>
              {`${shortLabel(closest)} · ${closest.value} so far`}
            </span>
          </span>
        </button>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 2px',
          marginBottom: 10,
        }}
      >
        <MetaLabel>ALL RECORDS</MetaLabel>
        <MetaLabel>CLOSEST FIRST</MetaLabel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {ordered.map((r) => {
          const done = r.complete && r.value > 0;
          const notStarted = r.value === 0 && r.item.reachedTier === 0;
          const tone = tierTone(r.item);
          const named = namedPartsFor(r.item.badgeId, data.rounds);
          let caption: string;
          if (done) caption = 'Complete';
          else if (notStarted) caption = 'Not yet';
          else if (named) caption = `${named.parts.length} of ${named.total}`;
          else caption = `${r.toGo} to ${r.item.nextThreshold}`;
          return (
            <button
              key={r.item.badgeId}
              type="button"
              onClick={() => open(r)}
              aria-label={`${shortLabel(r)}, ${r.value}`}
              style={{
                textAlign: 'left',
                padding: '12px 11px',
                borderRadius: 13,
                minWidth: 0,
                cursor: 'pointer',
                fontFamily: REC.FONT,
                border: done
                  ? `1px solid ${REC.GOOD_LINE}`
                  : notStarted
                    ? `1px dashed ${REC.TILE_DASH}`
                    : `1px solid ${REC.TILE_LINE}`,
                background: done ? REC.GOOD_WASH : notStarted ? 'transparent' : REC.PANEL_2,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: notStarted ? REC.DIM : REC.INK,
                    ...REC.TABULAR,
                  }}
                >
                  {r.value}
                </span>
                <span
                  aria-hidden
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    background: tone ?? 'transparent',
                    border: tone ? 'none' : `1px solid ${REC.DOT_HOLLOW}`,
                  }}
                />
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: REC.MUTE,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shortLabel(r)}
              </span>
              {notStarted ? (
                <span style={{ display: 'block', height: 3, marginTop: 10 }} />
              ) : (
                <span
                  style={{
                    display: 'block',
                    height: 3,
                    marginTop: 10,
                    borderRadius: 2,
                    background: REC.TILE_TRACK,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${done ? 100 : Math.max(0, Math.min(100, r.pct))}%`,
                      background: done ? REC.GOOD : REC.AMBER,
                      borderRadius: 2,
                    }}
                  />
                </span>
              )}
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: 11,
                  color: done ? REC.GOOD : REC.MUTE,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  ...REC.TABULAR,
                }}
              >
                {caption}
              </span>
            </button>
          );
        })}
      </div>

      {sparse ? (
        <div style={{ marginTop: 10, fontSize: 12, color: REC.MUTE, lineHeight: 1.5 }}>
          {t('career.sparseFootnote')}
        </div>
      ) : null}
    </section>
  );
};

export default CountingStatsPanel;
