/**
 * MiniBoard - TD1 top-5 compressed board.
 * Grammar: POS | PLAYER + flag | THRU | TODAY | TOT
 * Row tap opens ScorecardSheet.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countryFlag, countryFallback } from '../../leaderboard/countryFlag';
import { todayFromEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  CHARCOAL, WHITE_ALPHA_65, WHITE_ALPHA_55, WHITE_ALPHA_10,
} from '../../_shared/tokens';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';

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
   * Surface the board is drawn on. 'light' (default) keeps the tournament-page
   * consumers pixel-identical; 'dark' maps every surface token to its dark
   * counterpart for the photo-backed hero board. Same component, not a fork.
   */
  theme?: 'light' | 'dark';
  /** Row tap hook (analytics). Fires before the scorecard sheet opens. */
  onRowTap?: (playerId: string) => void;
}

/** Surface tokens per theme. INK has no named dark counterpart - plain white. */
const THEME_TOKENS = {
  light: { surface: SURFACE, ink: INK, mute: INK_MUTE, faint: INK_FAINT, hairline: HAIRLINE_INK_8, press: 'active:bg-black/[0.03]' },
  dark: { surface: CHARCOAL, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_55, hairline: WHITE_ALPHA_10, press: 'active:bg-white/[0.06]' },
} as const;

/**
 * Canonical scoring: fmtScore + getScoreColor(..., 'light') - the same helpers
 * the schedule, board and college surfaces use. No local forks.
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

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound, theme = 'light', onRowTap }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const rows = entries.slice(0, limit);
  const T = THEME_TOKENS[theme];
  // Dark hero board: an absent TODAY reads as an em dash (never a zero, never
  // the previous round). Light board keeps its blank-cell doctrine.
  const todayBlank = theme === 'dark' ? '\u2014' : BLANK;


  return (
    <>
      <div style={{ background: T.surface, fontFamily: FONT }}>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: `0.5px solid ${T.hairline}`,
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
          const flag = cc ? countryFlag(cc) : null;
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
                {flag ? (
                  <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }} aria-label={cc ?? undefined}>{flag}</span>
                ) : cc ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.faint, letterSpacing: '0.04em' }}>{countryFallback(cc)}</span>
                ) : null}
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.player?.full_name ?? BLANK}
                </span>
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.mute, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {thruLabel(r, today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700, color: getScoreColor(today, theme, r.position === 1 ? 'leader' : 'standard'), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {today == null ? todayBlank : fmtScore(today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, theme, r.position === 1 ? 'leader' : 'standard'), fontVariantNumeric: 'tabular-nums lining-nums' }}>
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
