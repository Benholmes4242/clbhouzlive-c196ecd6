/**
 * LadderSheet -- "The Ladder" bottom sheet.
 *
 * Shows the seasonal timeline (one medal per quarter) plus every wall
 * level. Pure derivation from `owned` medal count + the user's
 * achievement rows for seasonal id presence / earned state.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { GamSheet } from '../../../gam/_shared/GamSheet';
import { GemVisual } from '@/components/shared/TierGem';
import {
  WALL_LEVELS,
  levelForMedals,
  type WallMaterial,
} from './_shared/levels';
import { MATERIAL_HEX } from './_shared/rarityPalette';
import type { TrophyItem } from './_shared/normalizeTrophyItem';
import {
  quarterOf,
  daysLeft,
  seasonId,
  seasonName,
  seasonDateRange,
  shortStartDate,
  SEASON_ROUNDS_REQUIRED,
} from '@/lib/gam/seasonClock';
import { useViewerHemisphere } from '@/hooks/gam/useViewerHemisphere';
import { useSeasonRoundCount } from '@/hooks/gam/useSeasonRoundCount';
import { Check } from 'lucide-react';

const AMBER = '#F7931E';
const AMBER_BAR_A = '#E8800C';
const AMBER_BAR_B = '#FFCB45';
const GOLD = '#F5C842';
const OBSIDIAN_EDGE = '#D4A017';
const FONT = "'Geist', -apple-system, sans-serif";

function matColor(m: WallMaterial): string {
  if (m === 'obsidian') return OBSIDIAN_EDGE;
  return (MATERIAL_HEX as Record<string, string>)[m] ?? '#C97B4A';
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Medal count -- authoritative for level derivation. */
  owned: number;
  /** All trophy items for the viewing user (needed for seasonal ids). */
  items: TrophyItem[];
  /** User whose ladder we're viewing (for the season round count). */
  userId: string | null | undefined;
}

type SeasonState = 'past-none' | 'past-earned' | 'past-missed' | 'current' | 'upcoming';

interface SeasonCell {
  year: number;
  quarter: number;
  id: string;
  state: SeasonState;
  earned: boolean;
  catalogueExists: boolean;
}

export const LadderSheet: React.FC<Props> = ({ open, onClose, owned, items, userId }) => {
  const hemi = useViewerHemisphere();

  const now = useMemo(() => new Date(), [open]);
  const currentQ = useMemo(() => quarterOf(now), [now]);

  // seasonal-category achievements -> id map
  const seasonalMap = useMemo(() => {
    const map = new Map<string, { earned: boolean }>();
    for (const it of items) {
      if (it.kind !== 'achievement') continue;
      if (it.category !== 'seasonal') continue;
      map.set(it.badgeId, { earned: it.earned || it.reachedTier > 0 });
    }
    return map;
  }, [items]);

  // Build cells: 4 quarters of current year + optional Q1 next year when in Q4.
  const cells: SeasonCell[] = useMemo(() => {
    const out: SeasonCell[] = [];
    for (let q = 1; q <= 4; q++) {
      const id = seasonId(currentQ.year, q);
      out.push(buildCell(currentQ.year, q, currentQ.year, currentQ.quarter, id, seasonalMap));
    }
    if (currentQ.quarter === 4) {
      const id = seasonId(currentQ.year + 1, 1);
      out.push(buildCell(currentQ.year + 1, 1, currentQ.year, currentQ.quarter, id, seasonalMap));
    }
    return out;
  }, [currentQ, seasonalMap]);

  const currentSeasonEarned = seasonalMap.get(seasonId(currentQ.year, currentQ.quarter))?.earned ?? false;
  const roundQuery = useSeasonRoundCount(userId, currentQ.year, currentQ.quarter);
  const roundsDone = Math.min(SEASON_ROUNDS_REQUIRED, roundQuery.data ?? 0);
  const daysRemaining = daysLeft(now);

  // Auto-scroll to current on open.
  const railRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  const level = levelForMedals(owned);

  return (
    <GamSheet open={open} onClose={onClose}>
      <div
        style={{
          fontFamily: FONT,
          background: 'linear-gradient(165deg, #191e26 0%, #0c0f14 100%)',
          color: '#FFFFFF',
          overflowY: 'auto',
          minHeight: 0,
          flex: 1,
        }}
      >
        {/* Grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '18px 20px 4px' }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            The Ladder
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, marginTop: 6, color: '#FFFFFF' }}>
            Ten levels. One wall.
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.55,
              marginTop: 10,
            }}
          >
            Earn medals from verified rounds &mdash; each achievement tier on your wall is one medal.
            Medals never expire and levels never drop. Each season adds one medal to chase &mdash;
            seasons never take anything away.
          </div>
        </div>

        {/* Season timeline */}
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            padding: '12px 20px 0',
          }}
        >
          Seasons · One medal each
        </div>
        <div
          ref={railRef}
          style={{
            display: 'flex',
            gap: 8,
            padding: '8px 14px 2px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
          className="hide-scrollbar"
        >
          {cells.map((cell) => (
            <SeasonCard
              key={cell.id}
              cell={cell}
              hemi={hemi}
              cardRef={cell.state === 'current' ? currentRef : undefined}
              roundsDone={cell.state === 'current' ? roundsDone : 0}
              daysRemaining={cell.state === 'current' ? daysRemaining : 0}
              currentEarned={cell.state === 'current' ? currentSeasonEarned : false}
            />
          ))}
        </div>

        {/* Level rows */}
        <div style={{ padding: '18px 14px 4px' }}>
          {WALL_LEVELS.map((lvl) => {
            const earned = owned >= lvl.medalsRequired;
            const isCurrent = level?.level === lvl.level;
            const isFuture = !earned && !isCurrent;
            const mc = matColor(lvl.material);
            const isLegend = lvl.level === 10;
            return (
              <div
                key={lvl.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 11px',
                  borderRadius: 12,
                  marginBottom: 4,
                  opacity: isFuture ? 0.45 : 1,
                  background: isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: isCurrent ? `1px solid ${mc}59` : '1px solid transparent',
                }}
              >
                <GemVisual material={lvl.material} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
                      {isLegend ? 'Clubhouse Legend' : lvl.label}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: mc,
                          border: `1px solid ${mc}73`,
                          borderRadius: 5,
                          padding: '2px 6px',
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  {isLegend && (
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      the summit &mdash; counts every medal beyond
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {lvl.medalsRequired} {lvl.medalsRequired === 1 ? 'medal' : 'medals'}
                </span>
                {earned && (
                  <Check size={12} strokeWidth={3} style={{ color: mc, marginLeft: 4 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 10.5,
            color: 'rgba(255,255,255,0.45)',
            textAlign: 'center',
            padding: '14px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)',
          }}
        >
          Your wall below shows every medal available.
        </div>
      </div>
    </GamSheet>
  );
};

function buildCell(
  year: number,
  quarter: number,
  cy: number,
  cq: number,
  id: string,
  seasonalMap: Map<string, { earned: boolean }>,
): SeasonCell {
  const isCurrent = year === cy && quarter === cq;
  const isPast = year < cy || (year === cy && quarter < cq);
  const catalogueExists = seasonalMap.has(id);
  const earned = seasonalMap.get(id)?.earned ?? false;

  let state: SeasonState;
  if (isCurrent) state = 'current';
  else if (!isPast) state = 'upcoming';
  else if (!catalogueExists) state = 'past-none';
  else if (earned) state = 'past-earned';
  else state = 'past-missed';

  return { year, quarter, id, state, earned, catalogueExists };
}

interface SeasonCardProps {
  cell: SeasonCell;
  hemi: 'N' | 'S';
  cardRef?: React.Ref<HTMLDivElement>;
  roundsDone: number;
  daysRemaining: number;
  currentEarned: boolean;
}

const SeasonCard: React.FC<SeasonCardProps> = ({
  cell,
  hemi,
  cardRef,
  roundsDone,
  daysRemaining,
  currentEarned,
}) => {
  const name = seasonName(cell.quarter, hemi);
  const range = seasonDateRange(cell.year, cell.quarter);
  const isCurrent = cell.state === 'current';
  const isUpcoming = cell.state === 'upcoming';
  const isPastNone = cell.state === 'past-none';
  const isPastEarned = cell.state === 'past-earned';
  const isPastMissed = cell.state === 'past-missed';

  const dim = isPastNone || isPastMissed || isUpcoming;
  const kColor = isCurrent ? AMBER : 'rgba(255,255,255,0.5)';

  let stateLabel = '';
  if (isCurrent) stateLabel = `${daysRemaining} days left`;
  else if (isUpcoming) stateLabel = 'Upcoming';
  else stateLabel = 'Closed';

  let statusLine: React.ReactNode = null;
  if (isCurrent) {
    if (currentEarned) {
      statusLine = (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: GOLD, fontWeight: 800 }}>
          Earned · on your wall <Check size={11} strokeWidth={3} />
        </span>
      );
    } else {
      statusLine = (
        <span style={{ color: GOLD, fontWeight: 800 }}>
          {roundsDone} of {SEASON_ROUNDS_REQUIRED} rounds · live
        </span>
      );
    }
  } else if (isPastEarned) {
    statusLine = (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: GOLD, fontWeight: 800 }}>
        Earned <Check size={11} strokeWidth={3} />
      </span>
    );
  } else if (isPastMissed) {
    statusLine = <span style={{ color: 'rgba(255,255,255,0.55)' }}>Missed</span>;
  } else if (isPastNone) {
    statusLine = <span style={{ color: 'rgba(255,255,255,0.55)' }}>No medal issued</span>;
  } else if (isUpcoming) {
    statusLine = (
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>
        Starts {shortStartDate(cell.year, cell.quarter)}
      </span>
    );
  }

  const progressPct = isCurrent
    ? currentEarned
      ? 100
      : Math.round((roundsDone / SEASON_ROUNDS_REQUIRED) * 100)
    : 0;

  return (
    <div
      ref={cardRef}
      style={{
        flex: '0 0 auto',
        width: isCurrent ? 170 : 150,
        borderRadius: 12,
        padding: '10px 11px',
        background: isCurrent ? 'rgba(247,147,30,0.07)' : 'rgba(255,255,255,0.03)',
        border: isCurrent
          ? '1px solid rgba(247,147,30,0.45)'
          : isUpcoming
            ? '1px dashed rgba(255,255,255,0.14)'
            : '1px solid rgba(255,255,255,0.09)',
        opacity: dim && !isUpcoming ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: kColor,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: kColor,
            whiteSpace: 'nowrap',
          }}
        >
          {stateLabel}
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          color: '#FFFFFF',
          marginTop: 6,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isCurrent && <MedalDot color={AMBER} />}
        {range}
      </div>

      {isCurrent && !currentEarned && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          Play {SEASON_ROUNDS_REQUIRED} verified rounds
        </div>
      )}
      {isCurrent && (
        <div
          style={{
            height: 4,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
            marginTop: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${AMBER_BAR_A}, ${AMBER_BAR_B})`,
            }}
          />
        </div>
      )}

      <div style={{ fontSize: 10, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{statusLine}</div>
    </div>
  );
};

function MedalDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 10,
        height: 10,
        display: 'inline-block',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
        boxShadow: `0 0 6px ${color}55`,
      }}
    />
  );
}

export default LadderSheet;
