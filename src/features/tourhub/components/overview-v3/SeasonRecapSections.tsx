/**
 * SEASON RECAP SURFACES (rules: seasonRecapRules.ts; data: useSeasonRecap.ts).
 * RecapPhotoBand renders the shared PhotoBand with the recap kicker, title,
 * final-event place line, points figure and sentence — same start line and
 * bottom anchoring as every state, no spine. SeasonRecapBody renders under the
 * tour buttons: facts, final standings, card list and Our record. Every list
 * part renders only from fresh standings (isFreshStandings).
 */
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import type { TourId } from '../../hooks/useOverviewData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { useOurPickRecord } from '../../hooks/usePickInsights';
import { fullTourLabel } from '../../_shared/tourOrder';
import type { HeadlineSegment } from '../../overview/magazineCopy';
import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { OurRecordSheet } from './HybridHeroBands/OurRecordSheet';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { formatOverviewDateRange } from './HybridHero';
import type { HeroState } from './HybridHero.utils';
import {
  RECAP_CARD_LIST_MAX, columnMajor, fmtPoints, recapFactCells, recapPronoun, surname, youngestEarner,
} from './seasonRecapRules';
import type { SeasonRecapData } from './useSeasonRecap';

const playersRace = (tour: TourId) => `/tourhub?tab=players&tour=${encodeURIComponent(tour)}`;

export function recapSentence(tour: TourId, data: SeasonRecapData | undefined, seasonYear: number, t: (k: string, o?: Record<string, unknown>) => string): HeadlineSegment[] {
  if (!data) return [];
  const winner = data.standings?.[0];
  if (winner) {
    const segs: HeadlineSegment[] = [
      { text: surname(winner.name), figure: true },
      { text: ` ${t(`overview.recap.raceVerb.${tour}`)}.` },
    ];
    if (data.cardLine) {
      segs.push({ text: t('overview.recap.cardsLead'), figure: false }, { text: String(data.cardLine.n), figure: true }, { text: ` ${t(`overview.recap.cardCopy.${tour}`, { year: seasonYear + 1 })}.` });
    }
    return segs;
  }
  if (data.winners <= 0 || data.events <= 0) return [];
  return [
    { text: String(data.winners), figure: true },
    { text: t('overview.recap.winnersA'), figure: false },
    { text: String(data.events), figure: true },
    { text: t('overview.recap.winnersB'), figure: false },
  ];
}

export function RecapPhotoBand({ slide, state, data, onOpen }: { slide: HeroSlide; state: HeroState; data: SeasonRecapData | undefined; onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  const tm = slide.tournament;
  const tour = tm.tourSlug as TourId;
  const venueAdapter = useMemo(() => [{ id: tm.id, venue_name: tm.venueName, venue_course_name: tm.venueCourseName, venue_city: tm.venueCity, venue_state: tm.venueState, venue_country: tm.venueCountry }], [tm.id, tm.venueName, tm.venueCourseName, tm.venueCity, tm.venueState, tm.venueCountry]);
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const winner = data?.standings?.[0];
  const year = tm.seasonYear ?? new Date(tm.endDate ?? tm.startDate).getUTCFullYear();
  return (
    <PhotoBand
      title={t('overview.recap.title')}
      venueName={tm.venueName ? t('overview.recap.finalEvent', { venue: tm.venueName }) : null}
      datesString={tm.startDate ? formatOverviewDateRange(tm.startDate, tm.endDate) : null}
      venueImageUrl={imageMap?.get(tm.id) ?? null}
      state={state}
      tourLabel={null}
      kicker={t('overview.recap.kicker', { tour: fullTourLabel(tour), year })}
      stateKey="recap"
      leader={null}
      countdown={[]}
      startDay={null}
      heightPx={OVERVIEW_PHOTO_BAND_HEIGHT}
      onOpen={onOpen}
      figure={winner?.points != null ? { value: fmtPoints(winner.points), caps: surname(winner.name) } : null}
      segments={recapSentence(tour, data, year, t)}
    />
  );
}

export function RecapFacts({ data }: { data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub');
  const fresh = !!data.standings;
  const cards = fresh && data.cardLine ? data.cardLine.n : null;
  const youngest = cards != null ? youngestEarner(data.cardEarners)?.age ?? null : null;
  const cells = recapFactCells({
    events: data.events, winners: data.winners, maxWins: data.maxWins, mostWinsSurname: data.mostWinsSurname, tiedLeaders: data.tiedLeaders,
    cards, youngest, tiedLabel: (count) => t('overview.recap.tiedPlayers', { count }),
  });
  if (!cells.length) return null;
  return <div data-recap-facts className="upcoming-facts">{cells.map((c) => <div key={c.key} data-recap-fact={c.key}><b>{c.value}{c.small ? <small className="recap-fact-small">{c.small}</small> : null}</b><span>{t(`overview.recap.${c.key}`)}</span></div>)}</div>;
}

export function RecapStandings({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  const rows = (data.standings ?? []).slice(0, 3);
  if (!rows.length) return null;
  return <section data-recap-board className="upcoming-block recap-block">
    <div className="recap-head"><h2 className="upcoming-kicker">{t(`overview.recap.boardKicker.${tour}`)}</h2><Button variant="ghost" data-recap-full-list className="recap-link" onClick={() => navigate(playersRace(tour))}>{t('overview.recap.fullList')}</Button></div>
    <div className="recap-grid recap-grid-head"><span>{t('overview.upcomingPlus.pos')}</span><span>{t('overview.upcomingPlus.player')}</span><span>{t('overview.recap.pts')}</span></div>
    {rows.map((r) => <div key={r.position} className="recap-grid recap-row" data-recap-row={r.position}>
      <span className="recap-pos">{r.position === 1 ? <Trophy data-recap-trophy size={13} className="recap-trophy" aria-label="1" /> : r.position}</span>
      <span className="recap-name">{r.name}</span>
      <span className="recap-pts">{r.points != null ? fmtPoints(r.points) : ''}</span>
    </div>)}
  </section>;
}

export function RecapCardList({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  if (!data.standings || !data.cardLine) return null;
  const { n, label } = data.cardLine;
  if (n > RECAP_CARD_LIST_MAX) {
    return <section data-recap-cards className="upcoming-block recap-block"><div className="recap-head"><h2 className="upcoming-kicker">{label}</h2><Button variant="ghost" data-recap-see-all className="recap-link" onClick={() => navigate(playersRace(tour))}>{t('overview.recap.seeAll', { count: n })}</Button></div></section>;
  }
  const list = data.cardEarners.map((e, i) => ({ ...e, pos: i + 1 }));
  const young = youngestEarner(data.cardEarners);
  return <section data-recap-cards className="upcoming-block recap-block">
    <h2 className="upcoming-kicker recap-kicker-only">{label}</h2>
    <div className="recap-cards">{columnMajor(list).map((e) => <div key={e.pos} data-recap-card={e.pos}><span>{e.pos}</span><b>{e.name}</b></div>)}</div>
    {young ? <p data-recap-youngest className="recap-foot"><Trans t={t} i18nKey={`overview.recap.youngestLine_${recapPronoun(tour)}`} values={{ name: young.name, age: young.age, count: n }} components={{ b: <b /> }} /></p> : null}
  </section>;
}

export function RecapOurRecord({ tour, year }: { tour: TourId; year: number }) {
  const { t } = useTranslation('tourhub');
  const [open, setOpen] = useState(false);
  const { data: record, isError } = useOurPickRecord(tour, year);
  if (isError || !record || !((record.event_count ?? 0) > 0)) return null;
  return <section data-recap-record className="upcoming-block recap-block">
    <div className="recap-head"><h2 className="upcoming-kicker">{t('overview.recap.ourRecord', { year })}</h2><Button variant="ghost" className="recap-link" onClick={() => setOpen(true)}>{t('overview.recap.howWePick')}</Button></div>
    <div className="upcoming-facts recap-record-figs">
      <div><b>{record.event_count}</b><span>{t('overview.recap.events')}</span></div>
      <div><b>{record.won}</b><span>{t('overview.recap.won')}</span></div>
      <div><b>{record.top10}</b><span>{t('overview.recap.top10')}</span></div>
    </div>
    <OurRecordSheet open={open} onClose={() => setOpen(false)} tour={tour} year={year} />
  </section>;
}

export function SeasonRecapBody({ tour, year, data }: { tour: TourId; year: number; data: SeasonRecapData | undefined }) {
  return <div data-season-recap>
    {data ? <><RecapFacts data={data} /><RecapStandings tour={tour} data={data} /><RecapCardList tour={tour} data={data} /></> : null}
    <RecapOurRecord tour={tour} year={year} />
  </div>;
}
