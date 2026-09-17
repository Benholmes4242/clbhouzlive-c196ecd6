import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CountryFlag from '@/components/ui/country-flag';
import { useRankingsBoards, type RankingsBoard, type RankingsRow } from '../data/useRankingsBoards';
import { DANGER, FONT, INK, INK_MUTE, TREND_UP } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

const BOARDS: { id: RankingsBoard; label: string }[] = [{ id: 'owgr', label: 'World' }, { id: 'r2d', label: 'Race to Dubai' }, { id: 'cme', label: 'LPGA' }, { id: 'kft', label: 'Korn Ferry' }];

const UNMOVED_INK = 'rgba(248,250,252,0.3)';

/**
 * H11.4 — the delta is a RANK delta, in member-analytics polarity:
 * green when a player climbed, red when they fell. It NEVER goes through
 * getScoreColor, which carries the to-par polarity (red = good). Second time
 * this has needed saying; the comment stays.
 */
function Movement({ value }: { value: number | null }) {
  const up = value != null && value > 0; const down = value != null && value < 0;
  return <span style={{ textAlign: 'right', fontSize: 11.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: up ? TREND_UP : down ? DANGER : UNMOVED_INK }}>{up ? `\u25B2${value}` : down ? `\u25BC${Math.abs(value)}` : '\u2013'}</span>;
}

function RankingRow({ row, onOpen, showMovement }: { row: RankingsRow; onOpen?: () => void; showMovement: boolean }) {
  return <button type="button" disabled={!onOpen} onClick={onOpen} style={{ width: '100%', minHeight: 44, padding: '0 24px', display: 'grid', gridTemplateColumns: showMovement ? '30px minmax(0,1fr) 44px 62px' : '30px minmax(0,1fr) 62px', alignItems: 'center', border: 0, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: onOpen ? 'pointer' : 'default' }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{row.rank}</span>
    <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
      <CountryFlag country={row.country} size="md" />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 600 }}>{row.playerName}</span>
    </span>
    {showMovement ? <Movement value={row.movement} /> : null}
    <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: 'rgba(248,250,252,0.85)', fontVariantNumeric: 'tabular-nums' }}>{row.points == null ? '' : Math.round(row.points).toLocaleString()}</span>
  </button>;
}

/**
 * C5's rule, unchanged: the movement track exists only when at least one of the
 * rows actually drawn carries a value. Only the SOURCE changed (90-day window
 * instead of week-over-week). Never a hardcoded board list.
 */
export function hasMovement(rows: RankingsRow[]): boolean {
  return rows.some((r) => r.movement != null && r.movement !== 0);
}

export function WorldRankings() {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const [board, setBoard] = useState<RankingsBoard>('owgr'); const { data, isLoading } = useRankingsBoards(board);
  const allRows = data?.rows ?? [];
  if (!isLoading && allRows.length === 0) return null;
  const rows = allRows.slice(0, 5);
  const basisDays = data?.basisDays ?? null;
  const showMovement = basisDays != null && hasMovement(rows);
  return <section><OverviewSectionHead title={t('overview.rankings.sectionEyebrow')} action={t('overview.rankings.linkLabel')} onAction={() => navigate('/tourhub?tab=leaderboards')} /><div role="tablist" aria-label={t('overview.rankings.sectionEyebrow')} style={{ margin: '0 0 10px', padding: '0 24px', display: 'flex', gap: 18, overflowX: 'auto', scrollbarWidth: 'none' }}>{BOARDS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={board === item.id} onClick={() => setBoard(item.id)} style={{ flex: 'none', minHeight: 32, padding: 0, border: 0, background: 'transparent', color: board === item.id ? INK : INK_MUTE, fontFamily: FONT, fontSize: 12, fontWeight: board === item.id ? 800 : 600, cursor: 'pointer' }}>{item.label}</button>)}</div>{showMovement ? <div style={{ padding: '0 24px', margin: '0 0 8px', fontFamily: FONT, fontSize: 11, color: 'rgba(248,250,252,0.45)' }}>{t('overview.rankings.movementBasis', { days: basisDays })}</div> : null}{rows.length > 0 ? <div>{rows.map((row) => <RankingRow key={`${row.rank}-${row.playerId ?? row.playerName}`} row={row} showMovement={showMovement} onOpen={row.playerId ? () => navigate(`/tourhub/player/${row.playerId}`) : undefined} />)}</div> : null}</section>;
}
