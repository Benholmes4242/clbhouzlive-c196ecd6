import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRankingsBoards, type RankingsBoard, type RankingsRow } from '../data/useRankingsBoards';
import { DANGER, FONT, INK, INK_FAINT, INK_MUTE, SURFACE, TREND_UP, WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

const BOARDS: { id: RankingsBoard; label: string }[] = [{ id: 'owgr', label: 'World' }, { id: 'r2d', label: 'Race to Dubai' }, { id: 'cme', label: 'LPGA' }, { id: 'kft', label: 'Korn Ferry' }];
function Movement({ value }: { value: number | null }) {
  // Ranking movement is trend data, not a score measured against par.
  const up = value != null && value > 0; const down = value != null && value < 0;
  return <span style={{ fontSize: 11, fontWeight: 800, color: up ? TREND_UP : down ? DANGER : INK_FAINT }}>{up ? `▲${value}` : down ? `▼${Math.abs(value)}` : '–'}</span>;
}
function RankingRow({ row, last, onOpen }: { row: RankingsRow; last: boolean; onOpen?: () => void }) {
  return <button type="button" disabled={!onOpen} onClick={onOpen} style={{ width: '100%', minHeight: 56, padding: '8px 14px', display: 'grid', gridTemplateColumns: '28px 34px minmax(0,1fr) 64px', alignItems: 'center', border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: onOpen ? 'pointer' : 'default' }}><span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{row.rank}</span><Movement value={row.movement} /><span style={{ minWidth: 0 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{row.playerName}</span>{row.country ? <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: INK_MUTE }}>{row.country.toUpperCase()}</span> : null}</span><span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,0.8)', fontVariantNumeric: 'tabular-nums' }}>{row.points == null ? '' : Math.round(row.points).toLocaleString()}</span></button>;
}
export function WorldRankings() {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const [board, setBoard] = useState<RankingsBoard>('owgr'); const { data = [], isLoading } = useRankingsBoards(board);
  if (!isLoading && data.length === 0) return null;
  return <section><OverviewSectionHead title={t('overview.rankings.sectionEyebrow')} action={t('overview.rankings.linkLabel')} onAction={() => navigate('/tourhub?tab=leaderboards')} /><div role="tablist" aria-label={t('overview.rankings.sectionEyebrow')} style={{ margin: '0 10px 10px', padding: '0 14px', display: 'flex', gap: 18, overflowX: 'auto', scrollbarWidth: 'none' }}>{BOARDS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={board === item.id} onClick={() => setBoard(item.id)} style={{ flex: 'none', minHeight: 32, padding: 0, border: 0, background: 'transparent', color: board === item.id ? INK : INK_MUTE, fontFamily: FONT, fontSize: 12, fontWeight: board === item.id ? 800 : 600, cursor: 'pointer' }}>{item.label}</button>)}</div>{data.length > 0 ? <div style={{ margin: '0 10px', overflow: 'hidden', borderRadius: 16, background: SURFACE }}>{data.slice(0, 5).map((row, index) => <RankingRow key={`${row.rank}-${row.playerId ?? row.playerName}`} row={row} last={index === Math.min(data.length, 5) - 1} onOpen={row.playerId ? () => navigate(`/tourhub/player/${row.playerId}`) : undefined} />)}</div> : null}</section>;
}