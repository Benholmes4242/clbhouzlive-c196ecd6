/** Overview-only upcoming list; selection/count/exclusions remain the shared
 * ComingUp selectors and schedule read. Other ComingUp consumers stay frozen. */
import { useNavigate } from 'react-router-dom';
import { settled, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { Button } from '@/components/ui/button';
import type { TourId } from '../../hooks/useOverviewData';
import { useComingUp } from '../../overview/data/useComingUp';
import { displayEventName, selectComingUpRail } from '../../overview/sections/ComingUp';
import { shortTournamentToken, fullTourLabel } from '../../_shared/tourOrder';
import { HybridHead } from './OverviewHybridSections';

export function OverviewHybridComingUp({ tour, excludeIds }: { tour: TourId | null; excludeIds: readonly string[] }) {
  const navigate = useNavigate(); const query = useComingUp(tour, 12); useSectionReady('comingUp', settled(query));
  const events = selectComingUpRail(query.data ?? [], excludeIds); const first = events[0]; if (!first) return null;
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(new Date(first.start_date));
  return <section data-overview-band="comingUp" className="ov48-coming-up"><HybridHead eyebrow="Coming up" title={`${shortTournamentToken(first.name)} starts ${day}`} action="Schedule ›" onAction={() => navigate(`/tourhub?tab=schedule&tour=${tour ?? 'all'}`)} /><div className="ov48-card ov48-list-card">{events.map(row => <Button key={row.id} variant={null} size={null} className="ov48-list-row" data-coming-up-item onClick={() => navigate(`/tourhub/tournament/${row.id}`)}><div><div className="ov48-list-kicker">{fullTourLabel(row.tour_slug)}</div><b className="ov48-list-name">{displayEventName(row.name)}</b><small className="ov48-list-venue">{[row.venue_name, row.venue_city ?? row.venue_country].filter(Boolean).join(', ')}</small></div><span className="ov48-list-date">{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(row.start_date))}</span></Button>)}</div></section>;
}