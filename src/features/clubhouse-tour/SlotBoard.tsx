/** The feed owns inert rows and top-three compression. Geometry and live
 * round values come from HeroBoardRows; this never opens a scorecard or reads
 * tee times. Prior-year data stays owned by the canonical public hook. */
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { computeBoardColumns, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { HERO_POS_W, HERO_ROUND_W, HERO_TOT_W, HERO_GAP, HERO_POS_TYPE, HERO_TOT_TYPE, heroRoundScore } from '@/features/tourhub/tournament-v2/sections/HeroBoardRows';
import { INK, INK_FAINT, TOUR_LIVE_GREEN } from '@/features/tourhub/_shared/tokens';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { isStrokeEvent } from '@/features/tourhub/_shared/eventFormat';
import { useTournamentLastYearTop4 } from '@/features/tourhub/hooks/useTournamentLastYearTop4';
import { slotTopThree, type SlotTournament } from './tourSlotRules';

interface SlotBoardRow { id: string; position: number | null; tied?: boolean; name: string; score: number | null; entry?: BoardEntry }
const numeric: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };

export function SlotBoard({ rows, board = [], round, kind }: { rows: SlotBoardRow[]; board?: BoardEntry[]; round?: number; kind: 'live' | 'result' | string }) {
  const { t } = useTranslation('tourhub');
  const live = kind === 'live';
  const columns = live ? computeBoardColumns(board, round, false) : null;
  const rounds = columns?.rounds ?? [];
  const shown = live ? rows.slice(0, 5).map(entry => ({ entry, others: 0 })) : slotTopThree(rows);
  if (!shown.length) return null;
  const label = live ? t('rebuilt.leaderboard') : kind === 'result' ? t('slot.finalTopThree') : t('slot.lastYear', { year: kind });
  const grid: CSSProperties = { display: 'grid', gridTemplateColumns: `${HERO_POS_W}px minmax(0,1fr) ${rounds.map(() => `${HERO_ROUND_W}px`).join(' ')} ${HERO_TOT_W}px`, gap: HERO_GAP, padding: '0 16px' };
  return <section data-tour-slot-board data-slot-board-kind={live ? 'live' : kind === 'result' ? 'result' : 'last-year'} style={{ paddingTop: live || kind === 'result' ? 10 : 14 }}>
    <div data-slot-board-header style={{ ...grid, alignItems: 'end', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: INK_FAINT, minHeight: 24, paddingTop: 2, paddingBottom: 6 }}>
      <span style={{ gridColumn: '1 / 3', minWidth: 0 }}>{label}</span>
      {rounds.map(rd => <span key={rd} data-slot-round-header={rd} style={{ textAlign: 'center', color: rd === columns?.liveRound ? TOUR_LIVE_GREEN : INK_FAINT }}>R{rd}</span>)}
      <span style={{ textAlign: 'center' }}>{t('board.columns.tot')}</span>
    </div>
    {shown.map(({ entry: row, others }, index) => <div key={row.id} data-slot-board-row style={{ ...grid, alignItems: 'center', minHeight: 31, paddingTop: 4, paddingBottom: 4 }}>
      <span data-slot-position style={{ ...numeric, ...HERO_POS_TYPE }}>{index > 0 && shown[index - 1].entry.position === row.position ? '' : `${row.tied || rows.filter(r => r.position === row.position).length > 1 ? 'T' : ''}${row.position}`}</span>
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span data-slot-player-name style={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', lineHeight: 1.15, fontSize: 13, fontWeight: 600, color: INK }}>{row.name}{others ? <span data-slot-others style={{ color: INK_FAINT, fontWeight: 600 }}>{t('slot.others', { count: others })}</span> : null}</span>
        {!live && kind !== 'result' && row.position === 1 ? <Trophy size={13} className="recap-trophy" aria-hidden style={{ flexShrink: 0 }} /> : null}
      </span>
      {rounds.map(rd => { const score = row.entry ? heroRoundScore(row.entry, rd, round) : null; return <span key={rd} data-slot-round={rd} style={{ ...numeric, textAlign: 'center', fontSize: 12, fontWeight: rd === columns?.liveRound ? 700 : 600, color: getScoreColor(score, 'dark') }}>{score == null ? '–' : fmtScore(score)}</span>; })}
      <span style={{ ...numeric, ...HERO_TOT_TYPE, textAlign: 'center', color: getScoreColor(row.score, 'dark') }}>{row.score == null ? '–' : fmtScore(row.score)}</span>
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