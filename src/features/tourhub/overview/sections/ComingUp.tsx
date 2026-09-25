import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useComingUp, type ComingUpRow } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';
import { fullTourLabel } from '../../_shared/tourOrder';
import { AMBER, FONT, INK, INK_MUTE, OVERVIEW_RAIL_HAIRLINE } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

export function displayEventName(name: string): string { return name.replace(/\s+(hosted|presented)\s+by\s+.+$/i, '').trim() || name; }
export function selectComingUpRail(rows: ComingUpRow[], excludeId?: string | null): ComingUpRow[] {
  return rows.filter((row) => row.id !== excludeId).slice(0, 6);
}

export function ComingUp({ tour, excludeId }: { tour: TourId | null; excludeId?: string | null }) {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const { data = [] } = useComingUp(tour, 6);
  const events = selectComingUpRail(data, excludeId);
  if (events.length === 0) return null;
  return <section><OverviewSectionHead title={t('overview.comingUp.title')} action={t('overview.comingUp.linkLabel')} onAction={() => navigate(`/tourhub?tab=schedule&tour=${tour ?? 'all'}`)} />
    <div data-coming-up-rail role="list" style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto', overflowY: 'hidden', padding: '0 24px', scrollPaddingLeft: 24, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', willChange: 'transform' }} className="[&::-webkit-scrollbar]:hidden">
      {events.map((row, index) => <ComingUpRailItem key={row.id} row={row} last={index === events.length - 1} onOpen={() => navigate(`/tourhub/tournament/${row.id}`)} />)}
    </div></section>;
}

function ComingUpRailItem({ row, last, onOpen }: { row: ComingUpRow; last: boolean; onOpen: () => void }) {
  const date = new Date(row.start_date);
  const dateLabel = Number.isNaN(date.getTime()) ? '' : `${new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).toUpperCase()} ${date.getDate()}`;
  /* role="listitem" wrapper (BRIEF_TEST_SUITE_TRIAGE_PART_2 §4): the item
     carries the grouping, the button the action. A role on the button itself
     would replace its button role, so the wrapper holds it, and takes the
     snap point because snap targets must be direct children of the rail. */
  return <div role="listitem" style={{ display: 'flex', flex: 'none', scrollSnapAlign: 'start' }}><button data-coming-up-item type="button" onClick={onOpen} style={{ width: 210, minWidth: 210, minHeight: 126, flex: 'none', padding: last ? '10px 0' : '10px 10px 10px 0', border: 0, borderRight: last ? 'none' : `1px solid ${OVERVIEW_RAIL_HAIRLINE}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}>
    <span style={{ display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_MUTE }}>{fullTourLabel(row.tour_slug)}</span>
    <span style={{ display: '-webkit-box', minHeight: 37.5, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{displayEventName(row.name)}</span>
    {row.venue ? <span style={{ display: 'block', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: INK_MUTE }}>{row.venue}</span> : null}
    {dateLabel ? <span style={{ display: 'block', marginTop: 9, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: AMBER, fontVariantNumeric: 'tabular-nums' }}>{dateLabel}</span> : null}
  </button></div>;
}