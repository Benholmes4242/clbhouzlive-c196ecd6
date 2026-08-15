/**
 * HeroBoardSection — the always-on live leaderboard that EXTENDS DOWNWARD from
 * the hero.
 *
 * It is NOT inside the hero card and it never replaces the photo. The hero is a
 * horizontally swiping carousel whose cards share a definite height
 * (TOTAL_HERO_HEIGHT_TARGET); putting the board inside would have forced every
 * card taller, including upcoming tournaments that have no board and would then
 * carry ~270px of dead space. So the board renders as a section BENEATH the
 * carousel, tracking the active slide: the photo moves horizontally on swipe
 * while the board cross-fades in place.
 *
 * Order, one continuous dark surface with NO seam:
 *   photo → board rows → continuation strip (in the hero) → full-leaderboard
 *   row → stat strip → course shape panel.
 * STRAIGHT bottom edge — the page canvas breathes below it, it does not tuck
 * under a radius.
 *
 * There is NO collapse control on the board: on a live slide it is always on;
 * on a results or upcoming slide it renders nothing at all (no placeholder, no
 * reserved height). The COURSE SHAPE panel is the only thing that opens.
 *
 * Six rows, fixed, never internally scrollable — a vertical scroller under a
 * horizontal pager is a gesture trap. The full-leaderboard row is the route to
 * the rest. The stat strip at the foot carries the field figures that used to
 * live in the removed "On the course" section.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown } from 'lucide-react';

import { FONT, CHARCOAL, WHITE_ALPHA_10, WHITE_ALPHA_55, WHITE_ALPHA_65, AMBER, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
import { useAIPredictions } from '../../../hooks/useAIPredictions';
import { CourseShapePanel } from './CourseShapePanel';
import {
  fieldAverageToday,
  lowRoundToday,
  formatToParAvg,
  formatToPar,
} from '../../../overview/data/liveRoundStats';

/**
 * SIX rows. It was five while the board occupied the photo band, because the
 * floating ChromeIsland overlays the top ~46px of the hero and a sixth row
 * would have buried the leader. Extending downward removes that constraint —
 * no chrome clearance applies here.
 */
export const HERO_BOARD_ROWS = 6;

const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };

/**
 * TOUR COLOUR RULE (unchanged from the removed panel): under par is RED,
 * level/over is INK — which on this dark surface is white.
 */
function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return '#FFFFFF';
  return v < 0 ? TOPAR_UNDER_DARK : '#FFFFFF';
}

/**
 * Three equal thirds, not left/centre/right alignment. Figures are NOT heavy:
 * weight 600 with letter-spacing eased to -0.01em; still tabular.
 */
function StatCell({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string | null;
}) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>
      <div
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: WHITE_ALPHA_55,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          marginTop: 2,
          color: color ?? '#FFFFFF',
          ...FIGS,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: WHITE_ALPHA_65,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface HeroBoardSectionProps {
  tournamentId: string;
  entries: any[];
  /** Active round — REQUIRED. TODAY is meaningless without it. */
  currentRound: number;
  onFullLeaderboard: () => void;
  onRowTap?: (playerId: string) => void;
}

export function HeroBoardSection({
  tournamentId,
  entries,
  currentRound,
  onFullLeaderboard,
  onRowTap,
}: HeroBoardSectionProps) {
  const { t } = useTranslation('tourhub');
  const [shapeOpen, setShapeOpen] = useState(false);

  const field = useMemo(() => fieldAverageToday(entries as any, currentRound), [entries, currentRound]);
  const low = useMemo(() => lowRoundToday(entries as any, currentRound), [entries, currentRound]);

  /**
   * Tournament Intelligence picks. NO NEW QUERY — the overview already makes
   * this call for TIPicksCarousel, so this is a cache read.
   */
  // BRIEF SAID useTournamentPredictions().data.topContenders — that type has no
  // topContenders (it exposes `predictions`). The overview's TI picks come from
  // useAIPredictions(tournamentId), which TIPicksCarousel already calls with the
  // same key, so this is a cache read and not a new query.
  const { data: predictions } = useAIPredictions(tournamentId);
  const pickPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of (predictions?.topContenders ?? []) as any[]) {
      if (p?.playerId) ids.add(String(p.playerId));
    }
    return ids.size > 0 ? ids : undefined;
  }, [predictions]);

  /**
   * Surnames of everyone on the low round — one when outright, all when shared.
   * Read off the same completed-round figures lowRoundToday used, so the set can
   * never disagree with the figure above it.
   */
  const holders = useMemo(() => {
    if (!low) return [] as string[];
    const key = ['round_1', 'round_2', 'round_3', 'round_4'][currentRound - 1];
    if (!key) return [] as string[];
    const names: string[] = [];
    for (const e of entries as any[]) {
      const v = e?.[key];
      if (v == null || Number(v) !== low.toPar) continue;
      if (e?.thru != null && e.thru < 18) continue;
      const full = (e?.player?.full_name ?? '').trim();
      if (!full) continue;
      const parts = full.split(/\s+/);
      names.push(parts[parts.length - 1]);
    }
    if (names.length === 0 && low.playerName) {
      const parts = low.playerName.trim().split(/\s+/);
      names.push(parts[parts.length - 1]);
    }
    return names;
  }, [entries, currentRound, low]);

  // The gate lives in fieldAverageToday (20 completed rounds). Below it there is
  // no field average at all — the strip renders the cells it can and omits the
  // rest rather than averaging six players.
  const hasStrip = !!field || !!low;

  return (
    <div
      style={{
        background: CHARCOAL,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <MiniBoard
        tournamentId={tournamentId}
        entries={entries}
        limit={HERO_BOARD_ROWS}
        currentRound={currentRound}
        theme="dark"
        pickPlayerIds={pickPlayerIds}
        onRowTap={onRowTap}
      />

      <button
        type="button"
        onClick={onFullLeaderboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          borderTop: `0.5px solid ${WHITE_ALPHA_10}`,
          fontFamily: FONT,
          cursor: 'pointer',
        }}
        className="active:bg-white/[0.06] transition-colors"
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: WHITE_ALPHA_55,
            textTransform: 'uppercase',
          }}
        >
          {t('overview.ticker.fullLeaderboard')}
        </span>
        <ChevronRight size={14} color={AMBER} strokeWidth={2.5} />
      </button>

      {hasStrip && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px 16px',
            borderTop: `0.5px solid ${WHITE_ALPHA_10}`,
          }}
        >
          {field && (
            <StatCell
              label={t('overview.onTheCourse.fieldAverageToday')}
              value={formatToParAvg(field.avg)}
              color={tourFigColor(field.avg)}
              sub={t('overview.onTheCourse.fromNRoundsIn', { n: field.count })}
            />
          )}
          {low && (
            <StatCell
              label={t('overview.onTheCourse.lowRoundLabel')}
              value={formatToPar(low.toPar)}
              color={tourFigColor(low.toPar)}
              sub={holders.length > 0 ? holders.join(', ') : null}
            />
          )}
          {field && field.count > 0 && (
            <StatCell
              label={t('overview.onTheCourse.underParTodayLabel')}
              value={t('overview.onTheCourse.underParTodayValue', {
                n: field.underPar,
                m: field.count,
              })}
              sub={t('overview.onTheCourse.underParTodaySub')}
            />
          )}
        </div>
      )}

      {/* COURSE SHAPE — collapsed by default; the only thing on this block that
          opens and closes. */}
      <button
        type="button"
        onClick={() => setShapeOpen((v) => !v)}
        aria-expanded={shapeOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          borderTop: `0.5px solid ${WHITE_ALPHA_10}`,
          fontFamily: FONT,
          cursor: 'pointer',
        }}
        className="active:bg-white/[0.06] transition-colors"
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: WHITE_ALPHA_55,
            textTransform: 'uppercase',
          }}
        >
          {t('overview.onTheCourse.courseShapeLabel')}
        </span>
        <ChevronDown
          size={14}
          color={AMBER}
          strokeWidth={2.5}
          style={{ transform: shapeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
        />
      </button>

      {shapeOpen && (
        <CourseShapePanel tournamentId={tournamentId} round={currentRound} />
      )}
    </div>
  );
}

export default HeroBoardSection;
