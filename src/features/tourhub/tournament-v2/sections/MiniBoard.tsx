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
}

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

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const rows = entries.slice(0, limit);


  return (
    <>
      <div style={{ background: SURFACE, fontFamily: FONT }}>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: INK_FAINT, textTransform: 'uppercase',
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
              onClick={() => setTarget({
                playerId: r.player?.id ?? '',
                playerName: r.player?.full_name ?? '',
                countryCode: cc,
                position: r.position ?? null,
                positionTied: r.position_tied ?? null,
                total: r.score ?? null,
                today,
                thru: r.thru ?? null,
                status: r.status ?? null,
              })}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '10px 16px',
                borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
                background: 'transparent', border: 'none',
                borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
              }}
              className="active:bg-black/[0.03] transition-colors"
            >
              <div style={{ width: 34, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums lining' }}>
                {posText}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                {flag ? (
                  <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }} aria-label={cc ?? undefined}>{flag}</span>
                ) : cc ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: INK_FAINT, letterSpacing: '0.04em' }}>{countryFallback(cc)}</span>
                ) : null}
                <span style={{ fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.player?.full_name ?? BLANK}
                </span>
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums lining' }}>
                {thruLabel(r, today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700, color: getScoreColor(today, 'light'), fontVariantNumeric: 'tabular-nums lining' }}>
                {today == null ? BLANK : fmtScore(today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, 'light'), fontVariantNumeric: 'tabular-nums lining' }}>
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
