import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useComingUp, type ComingUpRow } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import { FONT, INK, INK_MUTE, LEADER_GOLD, SURFACE, WHITE_ALPHA_04, WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

const SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);
const PARTICLES = new Set(['van', 'von', 'de', 'del', 'della', 'di', 'da', 'dos', 'la', 'le', 'du', 'den', 'ter']);
export function surnameOf(full: string | null | undefined): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  while (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1].toLowerCase())) parts.pop();
  const particleAt = parts.findIndex((part, index) => index > 0 && index < parts.length - 1 && PARTICLES.has(part.toLowerCase()));
  return particleAt > 0 ? parts.slice(particleAt).join(' ') : parts[parts.length - 1] ?? null;
}
export function displayEventName(name: string): string { return name.replace(/\s+(hosted|presented)\s+by\s+.+$/i, '').trim() || name; }

interface WeekGroup { key: string; label: string; events: ComingUpRow[] }
function startOfWeek(date: Date): Date { const result = new Date(date); const day = result.getDay(); result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day)); result.setHours(0, 0, 0, 0); return result; }
function rangeLabel(rows: ComingUpRow[], first: boolean): string {
  const firstDate = new Date(rows[0].start_date); const lastDate = new Date(rows[rows.length - 1].end_date || rows[rows.length - 1].start_date);
  const start = `${firstDate.getDate()}`; const end = `${lastDate.getDate()} ${new Intl.DateTimeFormat('en', { month: 'short' }).format(lastDate).toUpperCase()}`;
  return `${first ? 'NEXT WEEK · ' : ''}${start}–${end}`;
}
export function groupComingUpByWeek(rows: ComingUpRow[]): WeekGroup[] {
  const groups = new Map<string, ComingUpRow[]>();
  for (const row of rows) { const key = startOfWeek(new Date(row.start_date)).toISOString().slice(0, 10); const group = groups.get(key) ?? []; if (group.length < 4) group.push(row); groups.set(key, group); }
  return [...groups.entries()].slice(0, 2).map(([key, events], index) => ({ key, events, label: rangeLabel(events, index === 0) }));
}

export function ComingUp({ tour, excludeId }: { tour: TourId | null; excludeId?: string | null }) {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const { data = [] } = useComingUp(tour, 16);
  const groups = useMemo(() => groupComingUpByWeek(data.filter((row) => row.id !== excludeId)), [data, excludeId]);
  if (groups.length === 0) return null;
  return <section><OverviewSectionHead title={t('overview.comingUp.title')} action={t('overview.comingUp.linkLabel')} onAction={() => navigate(`/tourhub?tab=schedule&tour=${tour ?? 'all'}`)} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map((group) => <div key={group.key}><div style={{ margin: '0 24px 7px', fontFamily: FONT, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: INK_MUTE }}>{group.label}</div><div style={{ margin: '0 10px', overflow: 'hidden', borderRadius: 16, background: SURFACE }}>{group.events.map((row, index) => <ComingUpRowView key={row.id} row={row} last={index === group.events.length - 1} onOpen={() => navigate(`/tourhub/tournament/${row.id}`)} />)}</div></div>)}
    </div></section>;
}

function ComingUpRowView({ row, last, onOpen }: { row: ComingUpRow; last: boolean; onOpen: () => void }) {
  const defending = surnameOf(row.defending_champion); const date = new Date(row.start_date);
  return <button type="button" onClick={onOpen} style={{ width: '100%', minHeight: 68, padding: '8px 14px', display: 'grid', gridTemplateColumns: `44px minmax(0,1fr) ${defending ? '76px' : ''}`, alignItems: 'center', gap: 10, border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}>
    <span style={{ width: 44, height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: WHITE_ALPHA_06 }}><span style={{ fontSize: 9, fontWeight: 800 }}>{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).toUpperCase()}</span><span style={{ marginTop: 1, fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{date.getDate()}</span></span>
    <span style={{ minWidth: 0 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: INK_MUTE }}>{TOUR_LABEL[row.tour_slug] ?? row.tour_slug}</span>{row.isMajor ? <span style={{ fontSize: 9, fontWeight: 800, color: LEADER_GOLD }}>MAJOR</span> : null}</span><span style={{ display: 'block', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{displayEventName(row.name)}</span>{row.venue ? <span style={{ display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: INK_MUTE }}>{row.venue}</span> : null}</span>
    {defending ? <span style={{ minWidth: 0, textAlign: 'right' }}><span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: INK_MUTE }}>DEFENDING</span><span style={{ display: 'block', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600 }}>{defending}</span></span> : null}
  </button>;
}