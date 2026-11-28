/** Brief 48C overview adapters. Recap selection, freshness, reads and totals
 * stay in useSeasonRecap/seasonRecapRules; stale standings never supply a winner. */
import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroSlide, HeroTournament } from '../../hooks/useHeroCarouselData';
import type { TourId } from '../../hooks/useOverviewData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { BoardFlag } from '../../_shared/BoardFlag';
import { fullTourLabel } from '../../_shared/tourOrder';
import { playerRoute } from '../../routes';
import type { SeasonRecapData } from './useSeasonRecap';
import type { HeroState } from './HybridHero.utils';
import { HybridGlassCard, HybridPhotoFrame } from './HybridPhotoFrame';
import { HybridHead, HybridTiles } from './OverviewHybridSections';
import { getOverviewCountdown, formatOverviewDateRange } from './HybridHero';
import { fmtPoints, surname, youngestEarner, recapFactCells } from './seasonRecapRules';
import { cardsTitle, pointsTitle, seasonPicksTitle } from './heroHeadRules';
import { useOurPickRecord } from '../../hooks/usePickInsights';
import { picksEnabledForTour } from '../../_shared/picksEnabledForTour';
import { OurRecordSheet } from './HybridHeroBands/OurRecordSheet';
import { useOverviewBandReady, overviewQueryReady } from './overviewShells';

const raceNames: Partial<Record<TourId, string>> = { pga: 'The FedExCup', lpga: 'The Race to the CME Globe', euro: 'The Race to Dubai', champ: 'The Charles Schwab Cup', pgad: 'The points list' };
const raceRoute = (tour: TourId) => `/tourhub?tab=players&tour=${encodeURIComponent(tour)}`;
export function HybridRecapNextUp({ tournament, now }: { tournament: HeroTournament; now: Date }) {
  const countdown = getOverviewCountdown(tournament.startDate, now)[0];
  return <div className="ov48-next-up" data-recap-next-up><div><div className="ov48-list-kicker">Next up</div><b className="ov48-next-name">{tournament.name}</b><small>{[tournament.venueName, formatOverviewDateRange(tournament.startDate, tournament.endDate)].filter(Boolean).join(' · ')}</small></div>{countdown ? <div className="ov48-next-value"><b data-recap-next-up-value>{countdown.value}</b><small data-recap-next-up-unit>{countdown.value === 1 ? countdown.label.slice(0, -1) : countdown.label}</small></div> : null}</div>;
}
export function HybridRecapPhoto({ slide, state, data, nextTournament = null, now, onOpen }: { slide: HeroSlide; state: HeroState; data: SeasonRecapData | undefined; nextTournament?: HeroTournament | null; now: Date; onOpen: () => void }) {
  const { t } = useTranslation('tourhub'); const tm = slide.tournament; const tour = tm.tourSlug as TourId;
  const adapter = useMemo(() => [{ id: tm.id, venue_name: tm.venueName, venue_course_name: tm.venueCourseName, venue_city: tm.venueCity, venue_state: tm.venueState, venue_country: tm.venueCountry }], [tm.id, tm.venueName, tm.venueCourseName, tm.venueCity, tm.venueState, tm.venueCountry]);
  const { data: images } = useBatchCourseImages(adapter); const year = tm.seasonYear ?? new Date(tm.endDate ?? tm.startDate).getUTCFullYear();
  const winner = data?.standings?.[0];
  const card = winner ? { label: t(`overview.recap.championLabel.${tour}`), name: winner.name, sub: tour === 'pgad' && data?.cardLine ? `${data.cardLine.n} earned ${year + 1} PGA Tour cards` : `The ${year} season is over`, champion: true, figure: <Trophy size={34} className="ov48-gold" />, faces: [{ key: winner.playerId ?? winner.name, name: winner.name, candidates: resolvePlayerAvatarCandidates({ name: winner.name, tourSlug: tour }) }] } : { label: `THE ${year} SEASON`, name: data ? `${data.winners} winners from ${data.events} events` : '' };
  return <HybridPhotoFrame title={t('overview.recap.title')} kicker={`${fullTourLabel(tour)} · ${year} SEASON`} image={images?.get(tm.id) ?? null} card={<HybridGlassCard card={card} />} footer={nextTournament ? <HybridRecapNextUp tournament={nextTournament} now={now} /> : null} onOpen={onOpen} stateKey="recap" />;
}
export function HybridRecapFacts({ data }: { data: SeasonRecapData }) {
  const cells = recapFactCells({ events: data.events, winners: data.winners, maxWins: data.maxWins, mostWinsSurname: data.mostWinsSurname, tiedLeaders: data.tiedLeaders, cards: null, youngest: null, tiedLabel: String }).slice(0, 3);
  const labels: Record<string, string> = { events: 'Events', winners: 'Winners', mostWins: 'Most wins' };
  return <HybridTiles cells={cells.map(c => ({ key: c.key, label: labels[c.key], value: c.value }))} />;
}
export function HybridRecapStandings({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate(); const rows = (data.standings ?? []).slice(0, 5); if (!rows.length) return null;
  const columns = { '--ov48-columns': '28px minmax(0,1fr) auto auto', '--ov48-narrow-columns': '26px minmax(0,1fr) auto' } as CSSProperties;
  return <section data-recap-board><HybridHead eyebrow={raceNames[tour] ?? 'The points list'} title={pointsTitle(t as never, rows.map(r => ({ name: surname(r.name), points: r.points })), fmtPoints)} action="Full list ›" onAction={() => navigate(raceRoute(tour))} /><div className="ov48-card ov48-points-grid" style={columns}><div className="ov48-board-grid ov48-board-header"><span>POS</span><span>PLAYER</span><span data-recap-behind>BEHIND</span><span>PTS</span></div>{rows.map(r => {
    const country = (r as typeof r & { country?: string | null }).country;
    const name = r.playerId ? <Button variant={null} size={null} className="ov48-recap-name" onClick={() => { if (!r.playerId) return; const route = playerRoute(r.playerId, { kind: 'tour-hub' }); navigate(route.to, { state: route.state }); }} aria-label={r.name}>{r.name}</Button> : <span className="ov48-name">{r.name}</span>;
    return <div className="ov48-board-grid ov48-board-row" key={r.position} data-recap-row={r.position}><span className="ov48-board-pos">{r.position === 1 ? <Trophy size={13} className="ov48-gold" data-recap-trophy /> : r.position}</span><span className="ov48-who">{name}<BoardFlag country={country} /></span><span className="ov48-round" data-recap-behind>{r === rows[0] ? '—' : rows[0].points != null && r.points != null ? fmtPoints(rows[0].points - r.points) : ''}</span><span className="ov48-total">{r.points != null ? fmtPoints(r.points) : ''}</span></div>;
  })}</div></section>;
}
export function HybridRecapCards({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate(); if (!data.standings || !data.cardLine) return null;
  const young = youngestEarner(data.cardEarners); const list = data.cardEarners.slice(0, 12); const more = Math.max(0, data.cardEarners.length - 12);
  return <section data-recap-cards><HybridHead eyebrow={data.cardLine.label.toUpperCase()} title={cardsTitle(t as never, data.cardLine.n, young?.age != null ? { name: surname(young.name), age: young.age } : null)} action="See all ›" onAction={() => navigate(raceRoute(tour))} /><div className="ov48-card ov48-recap-cards">{list.map((e, i) => { const cell = <><span>{i + 1}</span><b>{e.initialName}</b></>; return e.playerId ? <Button key={i} variant={null} size={null} className="ov48-recap-earner" data-recap-card={i + 1} aria-label={e.name} onClick={() => { if (!e.playerId) return; const route = playerRoute(e.playerId, { kind: 'tour-hub' }); navigate(route.to, { state: route.state }); }}>{cell}</Button> : <div key={i} className="ov48-recap-earner" data-recap-card={i + 1}>{cell}</div>; })}{more > 0 ? <Button variant={null} size={null} className="ov48-recap-more" onClick={() => navigate(raceRoute(tour))}>and {more} more ›</Button> : null}</div></section>;
}
function HybridRecapRecord({ tour, year }: { tour: TourId; year: number }) {
  const { t } = useTranslation('tourhub'); const [open, setOpen] = useState(false); const query = useOurPickRecord(tour, year); const r = query.isError ? null : query.data;
  useOverviewBandReady('recapRecord', overviewQueryReady(query, picksEnabledForTour(tour) && !!tour && !!year));
  if (!picksEnabledForTour(tour) || !r || !(r.event_count > 0)) return null;
  return <section data-recap-record><HybridHead eyebrow={t('overview.recap.ourPicks', { year })} title={seasonPicksTitle(t as never, r.won, r.top10)} action="How we pick ›" onAction={() => setOpen(true)} /><HybridTiles cells={[{ key: 'events', label: 'Events', value: String(r.event_count) }, { key: 'winners', label: 'Winners picked', value: String(r.won) }, { key: 'top10', label: 'In the top 10', value: String(r.top10) }]} /><OurRecordSheet open={open} onClose={() => setOpen(false)} tour={tour} year={year} /></section>;
}
export function HybridRecapBody({ tour, year, data }: { tour: TourId; year: number; data: SeasonRecapData | undefined }) {
  return <div data-season-recap>{data ? <><HybridRecapFacts data={data} /><HybridRecapStandings tour={tour} data={data} /><HybridRecapCards tour={tour} data={data} /></> : null}<HybridRecapRecord tour={tour} year={year} /></div>;
}