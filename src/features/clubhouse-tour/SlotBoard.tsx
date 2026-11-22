/** Feed-only inert chasing/result rows exclude the entire lead/winner group,
 * never fold ties. Shared helpers own round scores/columns; prior-year data
 * stays owned by the canonical hook, without lead exclusion or new reads. */
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { computeBoardColumns, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { heroRoundScore } from '@/features/tourhub/tournament-v2/sections/HeroBoardRows';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { isStrokeEvent } from '@/features/tourhub/_shared/eventFormat';
import { useTournamentLastYearTop4 } from '@/features/tourhub/hooks/useTournamentLastYearTop4';
import { type SlotTournament } from './tourSlotRules';

interface SlotBoardRow { id: string; position: number | null; tied?: boolean; name: string; score: number | null; entry?: BoardEntry }
export function SlotBoard({ rows, board = [], round, kind }: { rows: SlotBoardRow[]; board?: BoardEntry[]; round?: number; kind: 'live' | 'result' | string }) {
  const { t } = useTranslation('tourhub');
  const live = kind === 'live';
  const result = kind === 'result';
  const columns = live || result ? computeBoardColumns(board, round, result) : null;
  const rounds = columns?.rounds ?? [];
  const shown = live || result ? rows.filter(row => row.position !== rows[0]?.position).slice(0, 4) : rows;
  if (!shown.length) return null;
  const label = live ? t('slot.chasing') : result ? t('rebuilt.leaderboard') : t('slot.lastYear', { year: kind });
  return <section className="tour-slot-board" data-tour-slot-board data-slot-board-kind={live ? 'live' : result ? 'result' : 'last-year'} style={{ '--slot-round-count': rounds.length } as CSSProperties}>
    <div className="tour-slot-board-grid tour-slot-board-header" data-slot-board-header>
      <span className="tour-slot-board-label">{label}</span>
      {rounds.map(rd => <span key={rd} data-slot-round-header={rd} className={`tour-slot-round-header${rd === columns?.liveRound ? ' tour-slot-live' : ''}`}>R{rd}</span>)}
      <span className="tour-slot-total-header">{t('board.columns.tot')}</span>
    </div>
    {shown.map((row, index) => <div key={row.id} className="tour-slot-board-grid tour-slot-board-row" data-slot-board-row>
      <span className="tour-slot-position" data-slot-position>{index > 0 && shown[index - 1].position === row.position ? '' : `${row.tied || rows.filter(r => r.position === row.position).length > 1 ? 'T' : ''}${row.position}`}</span>
      <span className="tour-slot-player">
        <span className="tour-slot-player-name" data-slot-player-name>{row.name}</span>
        {!live && !result && row.position === 1 ? <Trophy size={13} className="recap-trophy" aria-hidden style={{ flexShrink: 0 }} /> : null}
      </span>
      {rounds.map(rd => { const score = row.entry ? heroRoundScore(row.entry, rd, live ? round : undefined) : null; return <span className="tour-slot-round" key={rd} data-slot-round={rd} style={{ color: getScoreColor(score, 'dark') }}>{score == null ? '–' : fmtScore(score)}</span>; })}
      <span className="tour-slot-total" style={{ color: getScoreColor(row.score, 'dark') }}>{row.score == null ? '–' : fmtScore(row.score)}</span>
    </div>)}
  </section>;
}

export function SlotLastYearBoard({ event }: { event: SlotTournament }) {
  const { data } = useTournamentLastYearTop4(isStrokeEvent(event.event_type) ? event.id : null);
  if (!isStrokeEvent(event.event_type) || !data?.length) return null;
  return <SlotBoard kind={data[0].year} rows={data.map((r, index) => ({ id: `${index}-${r.name}`, name: r.name, position: Number(r.rank.replace(/^T/, '')), tied: r.rank.startsWith('T'), score: r.score === 'E' ? 0 : Number(r.score.replace('−', '-')) }))} />;
}

export function slotBoardRows(board: BoardEntry[]): SlotBoardRow[] {
  return board.filter(r => r.position != null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(entry => ({ id: entry.id, position: entry.position, tied: entry.position_tied ?? false, name: entry.player?.full_name ?? entry.team?.display_name ?? '', score: entry.score, entry }));
}