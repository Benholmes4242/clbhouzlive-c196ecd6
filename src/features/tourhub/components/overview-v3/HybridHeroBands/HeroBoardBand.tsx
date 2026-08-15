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
 * It reads as one continuous dark block with the photo and the wire ticker
 * above it — square top, rounded bottom where the page canvas resumes. There is
 * NO collapse control: on a live slide the board is always on; on a results or
 * upcoming slide it renders nothing at all (no placeholder, no reserved height).
 *
 * Six rows, fixed, never internally scrollable — a vertical scroller under a
 * horizontal pager is a gesture trap. The full-leaderboard row is the route to
 * the rest. The stat strip at the foot carries the field figures that used to
 * live in the removed "On the course" section.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { FONT, CHARCOAL, WHITE_ALPHA_10, WHITE_ALPHA_55, WHITE_ALPHA_65, AMBER, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
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
  align?: 'left' | 'right';
}) {
  return (
    <div style={{ flex: 1, textAlign: align, minWidth: 0 }}>
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
          fontWeight: 700,
          letterSpacing: '-0.03em',
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

  const field = useMemo(() => fieldAverageToday(entries as any, currentRound), [entries, currentRound]);
  const low = useMemo(() => lowRoundToday(entries as any, currentRound), [entries, currentRound]);

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
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
      }}
    >
      <MiniBoard
        tournamentId={tournamentId}
        entries={entries}
        limit={HERO_BOARD_ROWS}
        currentRound={currentRound}
        theme="dark"
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
              align={field ? 'left' : 'left'}
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
    </div>
  );
}

export default HeroBoardSection;
