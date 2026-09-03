/**
 * MiniBoard - TD1 top-5 compressed board.
 * Grammar: POS | PLAYER + flag | THRU | TODAY | TOT
 * Row tap opens ScorecardSheet.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CountryFlag from '@/components/ui/country-flag';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  HERO_BOARD_SURFACE, WHITE_ALPHA_65, WHITE_ALPHA_12, AMBER,
} from '../../_shared/tokens';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';

interface Row {
  id: string;
  position: number | null;
  position_tied?: boolean | null;
  score: number | null;
  today?: number | null;
  thru?: number | null;
  status?: string | null;
  round_1?: number | null;
  round_2?: number | null;
  round_3?: number | null;
  round_4?: number | null;
  player?: { id?: string; full_name?: string; country?: string | null; country_code?: string | null } | null;
}

interface Props {
  tournamentId: string;
  entries: Row[];
  limit?: number;
  /** Active round from sr_tournaments.current_round - scopes TODAY and THRU. */
  currentRound?: number | null;
  /**
   * THE GROUND THE BOARD SITS ON. One component, two real grounds:
   *  - 'panel' (default): the tournament page (TournamentPage:233 live board and
   *    :255 final board). Its ground is the #15171F app canvas, so the board is
   *    a PANEL that must read as a step UP — SURFACE (#1B1E27).
   *  - 'heroBoard': the Tour Overview hybrid hero (HeroBoardBand:331). Its ground
   *    is the photo-backed hero block, so the board takes HERO_BOARD_SURFACE
   *    (#0B0F14) and is continuous with the block around it.
   *  - 'light': legacy light chrome islands. No live callsite; retained because
   *    the light ramp has not been deleted.
   */
  theme?: 'panel' | 'heroBoard' | 'light';

  /**
   * Player ids that are Tournament Intelligence picks. DEFAULTS TO UNDEFINED so
   * the tournament-page consumers are pixel-identical — no fork.
   *
   * AMBER MEANS THE LIVE ROUND EVERYWHERE ELSE ON TOUR SURFACES. Here it is
   * deliberately a SECOND meaning, bounded to this one mark: it reads as the
   * clbhouz mark, not a status colour, because it is the logo. Do not "correct"
   * it to a neutral tone.
   */
  pickPlayerIds?: Set<string>;
  /** Row tap hook (analytics). Fires before the scorecard sheet opens. */
  onRowTap?: (playerId: string) => void;
}

/**
 * Surface tokens per ground. INK has no named dark counterpart — plain white.
 *
 * 'panel' and 'heroBoard' share the ink ramp and differ ONLY in surface: the
 * panel rises above the #15171F canvas, the hero board sinks into the photo
 * block. Same component on two grounds — the ground is passed in, never guessed.
 */
const THEME_TOKENS = {
  light: { surface: SURFACE, ink: INK, mute: INK_MUTE, faint: INK_FAINT, hairline: HAIRLINE_INK_8, press: 'active:bg-black/[0.03]' },
  panel: { surface: SURFACE, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_12, press: 'active:bg-white/[0.06]' },
  heroBoard: { surface: HERO_BOARD_SURFACE, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_12, press: 'active:bg-white/[0.06]' },
} as const;


/**
 * Canonical scoring: fmtScore + getScoreColor(..., theme) - the same helpers
 * the schedule, board and college surfaces use. No local forks. The canonical
 * theme is 'dark' (the app's only surface); 'light' survives for the few light
 * chrome islands that have not been flipped, and is NOT the default.
 *
 * Placeholders: a missing figure renders as NOTHING. An em dash is a value in
 * a tabular column and reads as data the field does not have.
 */
const BLANK = '';
function thruLabel(row: Row, today: number | null): string {
  const s = row.status?.toUpperCase();
  if (s === 'MC' || s === 'CUT') return 'MC';
  if (s === 'WD') return 'WD';
  // THRU must agree with TODAY: no round score for the active round means the
  // player has not started, so the stale top-level thru must not render.
  if (today == null) return BLANK;
  if (row.thru == null) return BLANK;
  return row.thru >= 18 ? 'F' : String(row.thru);
}

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound, theme = 'panel', pickPlayerIds, onRowTap }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const rows = entries.slice(0, limit);
  const T = THEME_TOKENS[theme];
  /** getScoreColor knows two ramps only; both dark grounds take the dark ramp. */
  const scoreTheme = theme === 'light' ? 'light' : 'dark';
  // Dark grounds: an absent TODAY reads as an em dash (never a zero, never
  // the previous round). The light board keeps its blank-cell doctrine.
  const todayBlank = theme === 'light' ? BLANK : '\u2014';



  return (
    <>
      <div style={{ background: T.surface, fontFamily: FONT }}>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: `0.5px solid ${T.hairline}`,
            // AXIS 10: column headers (POS / PLAYER / THRU / TODAY / TOT).
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: T.faint, textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 34, flexShrink: 0 }}>{t('board.columns.pos')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{t('board.columns.player')}</div>
          <div style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.thru')}</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.today')}</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.tot')}</div>

        </div>
        {rows.map((r) => {
          const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
            : r.status === 'WD' ? 'WD'
            : r.position == null ? BLANK
            : `${r.position_tied ? 'T' : ''}${r.position}`;
          const cc = r.player?.country_code ?? r.player?.country ?? null;
          
          const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => { onRowTap?.(r.player?.id ?? ''); setTarget({
                playerId: r.player?.id ?? '',
                playerName: r.player?.full_name ?? '',
                countryCode: cc,
                position: r.position ?? null,
                positionTied: r.position_tied ?? null,
                total: r.score ?? null,
                today,
                thru: r.thru ?? null,
                status: r.status ?? null,
              }); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '10px 16px',
                borderBottom: `0.5px solid ${T.hairline}`,
                background: 'transparent', border: 'none',
                borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
              }}
              className={`${T.press} transition-colors`}
            >
              <div style={{ width: 34, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {posText}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                {cc ? <CountryFlag country={cc} size="sm" /> : null}
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.player?.full_name ?? BLANK}
                </span>
                {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) && (
                  <ClbhouzPickMark size={11} label={t('overview.board.clbhouzPick')} />
                )}
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.mute, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {thruLabel(r, today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700, color: getScoreColor(today, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {today == null ? todayBlank : fmtScore(today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {r.score == null ? BLANK : fmtScore(r.score)}
              </div>
            </button>
          );
        })}
      </div>
      <ScorecardSheet
        open={!!target}
        onClose={() => setTarget(null)}
        tournamentId={tournamentId}
        target={target}
      />
    </>
  );
}
