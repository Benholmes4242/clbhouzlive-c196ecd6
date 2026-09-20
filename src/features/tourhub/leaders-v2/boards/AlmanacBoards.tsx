import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { AMBER, INK_MUTE, STATUS_LIVE, TREND_DOWN, TREND_UP, WHITE_ALPHA_06 } from '../../_shared/tokens';
import type { LeaderCategoryDef, LeaderRow } from '../data/useLeaderCategories';

const eyebrow: CSSProperties = { margin: 0, color: AMBER, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' };
const title: CSSProperties = { margin: 0, color: A.INK, fontSize: 24, lineHeight: 1.04, fontWeight: 850, letterSpacing: 0 };
const copy: CSSProperties = { margin: 0, color: INK_MUTE, fontSize: 12, lineHeight: 1.45, letterSpacing: 0 };

function Movement({ value }: { value: number | null }) {
  const { t } = useTranslation('tourhub');
  if (value == null) return null;
  if (value === 0) return <span style={{ color: INK_MUTE }}>{t('leaders.season.steady')}</span>;
  return <span style={{ color: value > 0 ? TREND_UP : TREND_DOWN }}>{value > 0 ? '↑' : '↓'} {Math.abs(value)}</span>;
}

function CompactRow({ row, last, onPlayerClick }: { row: LeaderRow; last: boolean; onPlayerClick: (row: LeaderRow) => void }) {
  return (
    <button type="button" onClick={() => onPlayerClick(row)} style={{ width: '100%', minHeight: 68, padding: '12px 0', border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', alignItems: 'center', columnGap: 10, textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ color: INK_MUTE, fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{row.rankLabel}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: A.INK, fontSize: 14, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span>
        <span style={{ display: 'block', marginTop: 4, fontSize: 10, fontWeight: 750 }}><Movement value={row.movement} /></span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ display: 'block', color: A.INK, fontSize: 17, fontWeight: 850, fontVariantNumeric: 'tabular-nums' }}>{row.valueFormatted}</span>
        {row.behindFormatted ? <span style={{ display: 'block', marginTop: 2, color: INK_MUTE, fontSize: 9, fontWeight: 750 }}>+{row.behindFormatted}</span> : null}
      </span>
    </button>
  );
}

export function LeadModule({ category, subjectName }: { category: LeaderCategoryDef; subjectName: string | null }) {
  const { t } = useTranslation('tourhub');
  const leader = category.rows[0];
  return (
    <section style={{ padding: '32px 24px 28px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}>
      <p style={eyebrow}>{t('leaders.season.kicker')}</p>
      <h1 style={{ ...title, marginTop: 8, fontSize: 36 }}>{subjectName ?? t('leaders.season.raceTitle')}</h1>
      <p style={{ ...copy, marginTop: 12, maxWidth: 420 }}>{subjectName ? t('leaders.season.playerStandfirst', { name: subjectName }) : t('leaders.season.raceStandfirst')}</p>
      {leader ? <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'end', gap: 16 }}><span style={{ color: A.INK, fontSize: 15, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leader.name}</span><span style={{ color: AMBER, fontSize: 34, lineHeight: 1, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{leader.valueFormatted}</span></div> : null}
    </section>
  );
}

export function MovementModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  if (category.movementSource !== 'per_event_points') return null;
  const movers = category.rows.filter((row) => row.movement != null).sort((a, b) => Math.abs(b.movement ?? 0) - Math.abs(a.movement ?? 0)).slice(0, 4);
  if (movers.length < 4) return null;
  return <section style={{ padding: '24px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><p style={eyebrow}>{t('leaders.season.movement')}</p><h2 style={{ ...title, marginTop: 7 }}>{t('leaders.season.movementTitle')}</h2><div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>{movers.map((row) => <button type="button" key={row.playerId || row.name} onClick={() => onPlayerClick(row)} style={{ minWidth: 0, minHeight: 112, padding: 14, border: `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><span style={{ display: 'block', fontSize: 20, fontWeight: 900 }}><Movement value={row.movement} /></span><span style={{ display: 'block', marginTop: 16, color: A.INK, fontSize: 13, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span><span style={{ display: 'block', marginTop: 4, color: INK_MUTE, fontSize: 10, fontWeight: 750 }}>{row.valueFormatted}</span></button>)}</div></section>;
}

export function NumberModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  const leader = category.rows[0];
  if (!leader) return null;
  return <section style={{ padding: '28px 24px', borderBottom: `1px solid ${WHITE_ALPHA_06}`, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'end' }}><div style={{ minWidth: 0 }}><p style={eyebrow}>{t('leaders.season.oneNumber')}</p><h2 style={{ ...title, marginTop: 7 }}>{t(category.labelKey)}</h2><p style={{ ...copy, marginTop: 8, maxWidth: 300 }}>{t(category.descriptionKey)}</p><button type="button" onClick={() => onPlayerClick(leader)} style={{ border: 0, padding: 0, marginTop: 12, color: INK_MUTE, background: 'transparent', fontSize: 13, fontWeight: 750, cursor: 'pointer' }}>{leader.name}</button></div><div style={{ color: A.INK, fontSize: 42, lineHeight: 0.9, fontWeight: 900, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{leader.valueFormatted}<span style={{ display: 'block', marginTop: 8, color: INK_MUTE, fontSize: 9, fontWeight: 800 }}>{t(category.unitKey)}</span></div></section>;
}

export function DuelModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  return <section style={{ padding: '28px 24px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><p style={eyebrow}>{t('leaders.season.duel')}</p><h2 style={{ ...title, marginTop: 7 }}>{t(category.labelKey)}</h2><div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', border: `1px solid ${WHITE_ALPHA_06}` }}>{category.rows.slice(0, 2).map((row, index) => <button type="button" key={row.playerId || row.name} onClick={() => onPlayerClick(row)} style={{ minWidth: 0, padding: 16, border: 0, borderLeft: index ? `1px solid ${WHITE_ALPHA_06}` : 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}><span style={{ display: 'block', color: A.INK, fontSize: 20, fontWeight: 900 }}>{row.valueFormatted}</span><span style={{ display: 'block', marginTop: 8, color: INK_MUTE, fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span></button>)}</div></section>;
}

export function TiedListModule({ category, onPlayerClick }: { category: LeaderCategoryDef; onPlayerClick: (row: LeaderRow) => void }) {
  const { t } = useTranslation('tourhub');
  const leaders = category.rows.filter((row) => row.rank === 1).slice(0, 3);
  return <section style={{ padding: '28px 24px', borderBottom: `1px solid ${WHITE_ALPHA_06}` }}><p style={eyebrow}>{t('leaders.season.sharedLead')}</p><h2 style={{ ...title, marginTop: 7 }}>{t(category.labelKey)}</h2><div style={{ marginTop: 14 }}>{leaders.map((row, index) => <CompactRow key={row.playerId || row.name} row={row} last={index === leaders.length - 1} onPlayerClick={onPlayerClick} />)}</div></section>;
}

export function SeasonIndexLink({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('tourhub');
  return <button type="button" onClick={onClick} style={{ width: '100%', minHeight: 76, padding: '13px 24px', border: 0, background: 'transparent', color: A.INK, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}><span style={{ fontSize: 14, fontWeight: 850 }}>{t('leaders.index.title')}</span><ChevronRight size={18} color={STATUS_LIVE} /></button>;
}

// Compatibility exports for callers that still import the old board names.
export const StatBoardRows = TiedListModule;
export const WinnersCircle = TiedListModule;
export const ANATOMY_BY_KEY: Record<string, 'stat' | 'winners'> = {};