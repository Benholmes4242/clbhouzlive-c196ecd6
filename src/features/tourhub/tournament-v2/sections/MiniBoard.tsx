/**
 * MiniBoard — TD1 top-5 compressed board.
 * Grammar: POS | PLAYER + flag | THRU | TODAY | TOT
 * Row tap opens ScorecardSheet.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countryFlag, countryFallback } from '../../leaderboard/countryFlag';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT,
} from '../../_shared/tokens';

interface Row {
  id: string;
  position: number | null;
  position_tied?: boolean | null;
  score: number | null;
  today?: number | null;
  thru?: number | null;
  status?: string | null;
  player?: { id?: string; full_name?: string; country?: string | null; country_code?: string | null } | null;
}

interface Props {
  tournamentId: string;
  entries: Row[];
  limit?: number;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : String(n);
}
function color(n: number | null | undefined): string {
  if (n == null) return INK;
  if (n < 0) return TOPAR_UNDER_LIGHT;
  if (n > 0) return TOPAR_OVER_LIGHT;
  return INK;
}
function thruLabel(row: Row): string {
  const s = row.status?.toUpperCase();
  if (s === 'MC' || s === 'CUT') return 'MC';
  if (s === 'WD') return 'WD';
  if (row.thru == null) return '—';
  return row.thru >= 18 ? 'F' : String(row.thru);
}

export function MiniBoard({ tournamentId, entries, limit = 5 }: Props) {
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
            fontSize: 8.5, fontWeight: 800, letterSpacing: '0.10em',
            color: INK_FAINT, textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 34, flexShrink: 0 }}>POS</div>
          <div style={{ flex: 1, minWidth: 0 }}>PLAYER</div>
          <div style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>THRU</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>TODAY</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>TOT</div>
        </div>
        {rows.map((r) => {
          const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
            : r.status === 'WD' ? 'WD'
            : r.position == null ? '—'
            : `${r.position_tied ? 'T' : ''}${r.position}`;
          const cc = r.player?.country_code ?? r.player?.country ?? null;
          const flag = cc ? countryFlag(cc) : null;
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
                today: r.today ?? null,
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
              <div style={{ width: 34, flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {posText}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                {flag ? (
                  <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }} aria-label={cc ?? undefined}>{flag}</span>
                ) : cc ? (
                  <span style={{ fontSize: 8, fontWeight: 700, color: INK_FAINT, letterSpacing: '0.04em' }}>{countryFallback(cc)}</span>
                ) : null}
                <span style={{ fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.player?.full_name ?? '—'}
                </span>
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
                {thruLabel(r)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 800, color: color(r.today), fontVariantNumeric: 'tabular-nums' }}>
                {fmt(r.today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 800, color: color(r.score), fontVariantNumeric: 'tabular-nums' }}>
                {fmt(r.score)}
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
