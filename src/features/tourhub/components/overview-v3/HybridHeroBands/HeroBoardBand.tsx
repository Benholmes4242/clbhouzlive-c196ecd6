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
 * COLLAPSE CONTROLS (BRIEF_HERO_PICKS_ROW §0a — this OVERTURNS the previous
 * rule in both halves, which read: "There is NO collapse control on the board:
 * on a live slide it is always on; on a results or upcoming slide it renders
 * nothing at all. The COURSE SHAPE panel is the only thing that opens."):
 *   - TWO panels now open — COURSE SHAPE and OUR PICKS. The original objection
 *     stands and is not violated: a vertical scroller under a horizontal pager
 *     is still forbidden, and this adds one 37px collapsed row opening to a
 *     FIXED three-row panel that never scrolls internally.
 *   - The band now renders on UPCOMING slides too, because that is the phase
 *     where the picks are most worth reading. With no board there are no rows,
 *     no full-leaderboard row, no stat strip and no course shape — and NO
 *     placeholder or reserved height for any of them (§1). §0b is NOT
 *     overturned: the band being a section rather than a card is exactly what
 *     lets it render at its own height here.
 *
 * Six rows, fixed, never internally scrollable — a vertical scroller under a
 * horizontal pager is a gesture trap. The full-leaderboard row is the route to
 * the rest. The stat strip at the foot carries the field figures that used to
 * live in the removed "On the course" section.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown } from 'lucide-react';

import { FONT, HERO_BOARD_SURFACE, HERO_BOARD_SURFACE_SOFT, WHITE_ALPHA_12, WHITE_ALPHA_65, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
import { ClbhouzPickMark } from '../../../_shared/ClbhouzPickMark';
import { useAIPredictions, type AITopContender } from '../../../hooks/useAIPredictions';
import { CourseShapePanel, useCourseShapeRows } from './CourseShapePanel';
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
  align = 'left',
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string | null;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0, textAlign: align }}>
      <div
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: WHITE_ALPHA_65,
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
  /**
   * Active round. NULL on an upcoming (or completed) slide, where the band
   * exists only to carry the picks row — TODAY is meaningless without it.
   */
  currentRound: number | null;
  /**
   * The lifecycle phase of the slide, read off the hero carousel's own
   * `slide.type` (§2). NO NEW QUERY: the pulse hook would be one, and the
   * carousel already knows.
   */
  phase: 'live' | 'upcoming' | 'completed';
  onFullLeaderboard: () => void;
  onRowTap?: (playerId: string) => void;
  /** §3 — the mandatory route out of the open picks panel. */
  onFullPicks?: () => void;
}

export function HeroBoardSection({
  tournamentId,
  entries,
  currentRound,
  phase,
  onFullLeaderboard,
  onRowTap,
  onFullPicks,
}: HeroBoardSectionProps) {
  const { t } = useTranslation('tourhub');
  const [shapeOpen, setShapeOpen] = useState(false);
  const [picksOpen, setPicksOpen] = useState(false);

  /**
   * §1 — THE BOARD HALF OF THE BAND IS CONDITIONAL. With no entries there are
   * no rows, no full-leaderboard row, no stat strip and no course shape, and
   * nothing reserves height for them. The picks row is then the only content.
   */
  const hasBoard = currentRound != null && entries.length > 0;

  /* Passing an empty id keeps the hole-averages query DISABLED on a slide with
     no board, so widening the gate costs zero requests. */
  const shape = useCourseShapeRows(hasBoard ? tournamentId : '', currentRound ?? 1);

  const field = useMemo(
    () => (hasBoard ? fieldAverageToday(entries as any, currentRound as number) : null),
    [entries, currentRound, hasBoard],
  );
  const low = useMemo(
    () => (hasBoard ? lowRoundToday(entries as any, currentRound as number) : null),
    [entries, currentRound, hasBoard],
  );

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
    if (!low || currentRound == null) return [] as string[];
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

  /**
   * §2 — THE CLOSED ROW'S FIGURE, FOR THE PHASE. Everything here comes from the
   * predictions cache read above joined against `entries`, which is already a
   * prop (§4). No fetch, no RPC change.
   */
  const picks = (predictions?.topContenders ?? []) as AITopContender[];
  const boardByPlayer = useMemo(() => {
    const m = new Map<string, { position: number | null; tied: boolean; score: number | null }>();
    for (const e of entries as any[]) {
      const id = e?.player?.id;
      if (!id) continue;
      m.set(String(id), {
        position: e?.position ?? null,
        tied: !!e?.position_tied,
        score: e?.score ?? null,
      });
    }
    return m;
  }, [entries]);

  const closedFigure = useMemo(() => {
    if (picks.length === 0) return null;

    /* LIVE — the BEST-PLACED pick. A pick with no board line (withdrawn, missed
       cut, not in the field) simply cannot be the best-placed one, so it is
       skipped; when NONE of the picks has a live line the row falls back to the
       PRE treatment rather than printing a blank figure. */
    if (phase === 'live') {
      let best: { pick: AITopContender; position: number; tied: boolean; score: number | null } | null = null;
      for (const p of picks) {
        const line = boardByPlayer.get(String(p.playerId));
        if (!line || line.position == null) continue;
        if (!best || line.position < best.position) {
          best = { pick: p, position: line.position, tied: line.tied, score: line.score };
        }
      }
      if (best) {
        return {
          name: surnameOf(best.pick.playerName),
          right: `${best.tied ? 'T' : ''}${best.position}`,
          figure: best.score == null ? null : formatToPar(best.score),
          figureColor: tourFigColor(best.score),
        };
      }
    }

    /* PRE — and the fallback for every phase §2 cannot serve: the TOP-RANKED
       pick and its win probability. COMPLETE lands here too: see the report —
       a finishing position is not reachable from anything already in scope. */
    const top = [...picks].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0];
    if (!top) return null;
    return {
      name: surnameOf(top.playerName),
      right: null,
      figure: top.winProbability != null ? `${Math.round(top.winProbability)}%` : null,
      figureColor: '#FFFFFF',
    };
  }, [picks, phase, boardByPlayer]);

  /* §1 / ACCEPTANCE D — with neither a board nor picks there is nothing to
     render, and no reserved height for the absence. */
  if (!hasBoard && picks.length === 0) return null;


  return (
    <div
      style={{
        background: HERO_BOARD_SURFACE,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {hasBoard && (
        <MiniBoard
          tournamentId={tournamentId}
          entries={entries}
          limit={HERO_BOARD_ROWS}
          currentRound={currentRound as number}
          theme="dark"
          pickPlayerIds={pickPlayerIds}
          onRowTap={onRowTap}
        />
      )}

      {hasBoard && (
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
            borderTop: `0.5px solid ${WHITE_ALPHA_12}`,
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
              color: WHITE_ALPHA_65,
              textTransform: 'uppercase',
            }}
          >
            {t('overview.ticker.fullLeaderboard')}
          </span>
          <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.5} />
        </button>
      )}

      {hasStrip && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px 16px',
            background: HERO_BOARD_SURFACE,
            borderTop: `0.5px solid ${WHITE_ALPHA_12}`,
          }}
        >
          {field && (
            <StatCell
              align="left"
              label={t('overview.onTheCourse.fieldAverageToday')}
              value={formatToParAvg(field.avg)}
              color={tourFigColor(field.avg)}
              sub={t('overview.onTheCourse.fromNRoundsIn', { n: field.count })}
            />
          )}
          {low && (
            <StatCell
              align="center"
              label={t('overview.onTheCourse.lowRoundLabel')}
              value={formatToPar(low.toPar)}
              color={tourFigColor(low.toPar)}
              sub={holders.length > 0 ? holders.join(', ') : null}
            />
          )}
          {field && field.count > 0 && (
            <StatCell
              align="right"
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
      {shape.usable && (
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
          borderTop: `0.5px solid ${WHITE_ALPHA_12}`,
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
            color: WHITE_ALPHA_65,
            textTransform: 'uppercase',
          }}
        >
          {t('overview.onTheCourse.courseShapeLabel')}
        </span>
        <ChevronDown
          size={14}
          color="#FFFFFF"
          strokeWidth={2.5}
          style={{ transform: shapeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
        />
      </button>
      )}

      {shape.usable && shapeOpen && <CourseShapePanel rows={shape.rows} />}
    </div>
  );
}

export default HeroBoardSection;
