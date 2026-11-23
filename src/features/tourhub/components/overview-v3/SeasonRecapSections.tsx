import { picksEnabledForTour } from '../../_shared/picksEnabledForTour';
import { overviewQueryReady, useOverviewBandReady } from './overviewShells';
/**
 * SEASON RECAP SURFACES (rules: seasonRecapRules.ts; data: useSeasonRecap.ts).
 * RecapPhotoBand renders the shared PhotoBand with the recap kicker, title,
 * season-over sentence and loaded-next-event footer, without a final-event
 * line or points figure. The footer shares the upcoming countdown and adds
 * no reads. SeasonRecapBody renders under the
 * tour buttons: facts, final standings, card list and Our record. Every list
 * part renders only from fresh standings (isFreshStandings).
 * Recap headings/cells reuse completedWeek.css rhythm. CARD LIST A: the card
 * list is a full-width three-column grid (two below 360px) flowing by column
 * in plain DOM order, names as initial + surname, every cell and every points
 * list name opening that player's tour player page (plain text without an id).
 */
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroSlide, HeroTournament } from '../../hooks/useHeroCarouselData';
import type { TourId } from '../../hooks/useOverviewData';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import { useOurPickRecord } from '../../hooks/usePickInsights';
import { fullTourLabel } from '../../_shared/tourOrder';
import type { HeadlineSegment } from '../../overview/magazineCopy';
import { PhotoBand } from './HybridHeroBands/PhotoBand';
import { OurRecordSheet } from './HybridHeroBands/OurRecordSheet';
import { OVERVIEW_PHOTO_BAND_HEIGHT } from './HybridHero.constants';
import { formatOverviewDateRange, getOverviewCountdown } from './HybridHero';
import type { HeroState } from './HybridHero.utils';
import {
  RECAP_CARD_LIST_MAX, fmtPoints, recapFactCells, recapPronoun, surname, youngestEarner,
} from './seasonRecapRules';
import { playerRoute } from '../../routes';
import type { SeasonRecapData } from './useSeasonRecap';
import { HERO_TOT_TYPE } from '../../tournament-v2/sections/HeroBoardRows';
import '../../tournament-v2/sections/completedWeek.css';
import './recapNextUp.css';
import { HeroSectionHead } from './HeroSectionHead';
import { cardsTitle, pointsTitle, seasonPicksTitle, seasonTitle } from './heroHeadRules';

const playersRace = (tour: TourId) => `/tourhub?tab=players&tour=${encodeURIComponent(tour)}`;

export function recapSentence(tour: TourId, data: SeasonRecapData | undefined, seasonYear: number, t: (k: string, o?: Record<string, unknown>) => string): HeadlineSegment[] {
  if (!data) return [];
  const seasonOver: HeadlineSegment = { text: t('overview.recap.seasonOver', { year: seasonYear }), figure: false };
  const winner = data.standings?.[0];
  if (winner) {
    const segs: HeadlineSegment[] = [
      seasonOver,
      { text: surname(winner.name), figure: true },
      { text: ` ${t(`overview.recap.raceVerb.${tour}`)}.`, figure: false },
    ];
    if (data.cardLine) {
      segs.push({ text: t('overview.recap.cardsLead'), figure: false }, { text: String(data.cardLine.n), figure: true }, { text: ` ${t(`overview.recap.cardCopy.${tour}`, { year: seasonYear + 1 })}.`, figure: false });
    }
    return segs;
  }
  if (data.winners <= 0 || data.events <= 0) return [];
  return [
    seasonOver,
    { text: String(data.winners), figure: true },
    { text: t('overview.recap.winnersA'), figure: false },
    { text: String(data.events), figure: true },
    { text: t('overview.recap.winnersB'), figure: false },
  ];
}

/** Presentational footer: only the earliest upcoming tournament already loaded
 * for this recap's tour is passed in; no independent reads or tap target. */
export function RecapNextUp({ tournament, now }: { tournament: HeroTournament; now: Date }) {
  const { t } = useTranslation('tourhub');
  const countdown = getOverviewCountdown(tournament.startDate, now)[0];
  const venueDates = [tournament.venueName, formatOverviewDateRange(tournament.startDate, tournament.endDate)].filter(Boolean).join(' · ');
  return <div data-recap-next-up className="recap-next-up">
    <div className="recap-next-up-event">
      <div className="recap-next-up-kicker">{t('overview.recap.nextUp')}</div>
      <b className="recap-next-up-name">{tournament.name}</b>
      {venueDates ? <div data-recap-next-up-place className="recap-next-up-place">{venueDates}</div> : null}
    </div>
    {countdown ? <div className="recap-next-up-countdown">
      <b data-recap-next-up-value className="tabular-nums">{countdown.value}</b>
      <div data-recap-next-up-unit>{t(`overview.upcomingPlus.${countdown.label}`, { count: countdown.value })}</div>
    </div> : null}
  </div>;
}

export function RecapPhotoBand({ slide, state, data, nextTournament = null, now = new Date(), onOpen }: { slide: HeroSlide; state: HeroState; data: SeasonRecapData | undefined; nextTournament?: HeroTournament | null; now?: Date; onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  const tm = slide.tournament;
  const tour = tm.tourSlug as TourId;
  const venueAdapter = useMemo(() => [{ id: tm.id, venue_name: tm.venueName, venue_course_name: tm.venueCourseName, venue_city: tm.venueCity, venue_state: tm.venueState, venue_country: tm.venueCountry }], [tm.id, tm.venueName, tm.venueCourseName, tm.venueCity, tm.venueState, tm.venueCountry]);
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const year = tm.seasonYear ?? new Date(tm.endDate ?? tm.startDate).getUTCFullYear();
  return (
    <PhotoBand
      title={t('overview.recap.title')}
      venueName={null}
      datesString={null}
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
      figure={null}
      segments={recapSentence(tour, data, year, t)}
      footer={nextTournament ? <RecapNextUp tournament={nextTournament} now={now} /> : null}
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
  return <section data-recap-season className="cw-block"><HeroSectionHead eyebrow={t('overview.recap.seasonHeading', { defaultValue: 'THE SEASON' })} title={seasonTitle(t as never, data.winners, data.events)} /><div data-recap-facts className="upcoming-facts recap-figs">{cells.map((c) => <div className="cw-cell" key={c.key} data-recap-fact={c.key}><b style={HERO_TOT_TYPE}>{c.value}{c.small ? <small className="recap-fact-small">{c.small}</small> : null}</b><span>{t(`overview.recap.${c.key}`)}</span></div>)}</div></section>;
}

export function RecapStandings({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  /* Restore only THE POINTS LIST kicker; the Full list link stays retired.
     CARD LIST A: each name opens that player's tour player page; no id = plain text.
     Heading and rows share one intrinsic points grid so only names shorten. */
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const rows = (data.standings ?? []).slice(0, 3);
  if (!rows.length) return null;
  return <section data-recap-board className="upcoming-block recap-block" style={{ paddingTop: 0 }}>
    <HeroSectionHead inset={false} eyebrow={t('overview.recap.pointsHeading', { defaultValue: 'THE POINTS LIST' })} title={pointsTitle(t as never, rows.map(r => ({ name: surname(r.name), points: r.points ?? null })), fmtPoints)} />
    <div data-recap-table className="recap-table hero-head-cols">
    <div className="recap-head-row">
      <span style={{ gridColumn: '1 / 3' }} />
      <span className="recap-pts-label">{t('overview.recap.behind')}</span>
      <span className="recap-pts-label">{t('overview.recap.pts')}</span>
    </div>
    {rows.map((r) => <div key={r.position} className="recap-grid recap-row" data-recap-row={r.position}>
      <span className="recap-pos">{r.position === 1 ? <Trophy data-recap-trophy size={13} className="recap-trophy" aria-label="1" /> : r.position}</span>
      {r.playerId
        ? <Button variant="ghost" className="recap-name" aria-label={r.name} onClick={() => { const target = playerRoute(r.playerId as string, { kind: 'tour-hub' }); navigate(target.to, { state: target.state }); }}>{r.name}</Button>
        : <span className="recap-name">{r.name}</span>}
      <span data-recap-behind className="recap-behind">{r === rows[0] ? '—' : rows[0].points != null && r.points != null ? fmtPoints(rows[0].points - r.points) : ''}</span>
      <span className="recap-pts">{r.points != null ? fmtPoints(r.points) : ''}</span>
    </div>)}
    </div>
  </section>;
}

export function RecapCardList({ tour, data }: { tour: TourId; data: SeasonRecapData }) {
  const { t } = useTranslation('tourhub'); const navigate = useNavigate();
  if (!data.standings || !data.cardLine) return null;
  const { n, label } = data.cardLine;
  const young = youngestEarner(data.cardEarners);
  const title = cardsTitle(t as never, n, young && young.age != null ? { name: surname(young.name), age: young.age } : null);
  if (n > RECAP_CARD_LIST_MAX) {
    return <section data-recap-cards className="upcoming-block recap-block" style={{ paddingTop: 0 }}><HeroSectionHead inset={false} eyebrow={label.toLocaleUpperCase()} title={title} action={t('overview.heroHead.seeAll')} onAction={() => navigate(playersRace(tour))} /></section>;
  }
  const list = data.cardEarners.map((e, i) => ({ ...e, pos: i + 1 }));
  const rows3 = Math.ceil(list.length / 3);
  const rows2 = Math.ceil(list.length / 2);
  return <section data-recap-cards className="upcoming-block recap-block" style={{ paddingTop: 0 }}>
    <HeroSectionHead inset={false} eyebrow={label.toLocaleUpperCase()} title={title} />
    <div className="recap-cards" style={{ '--recap-rows-3': rows3, '--recap-rows-2': rows2 } as React.CSSProperties}>
      {list.map((e) => {
        const cell = <><span>{e.pos}</span><b>{e.initialName}</b></>;
        return e.playerId
          ? <Button key={e.pos} variant="ghost" data-recap-card={e.pos} aria-label={e.name} onClick={() => { const target = playerRoute(e.playerId as string, { kind: 'tour-hub' }); navigate(target.to, { state: target.state }); }}>{cell}</Button>
          : <div key={e.pos} data-recap-card={e.pos}>{cell}</div>;
      })}
    </div>
  </section>;
}

export function RecapOurRecord({ tour, year }: { tour: TourId; year: number }) {
  // Record-only heading/figure appearance is scoped by data-recap-record;
  // card-list links and season cells retain their existing shared styling.
  const { t } = useTranslation('tourhub');
  const [open, setOpen] = useState(false);
  const recordQuery = useOurPickRecord(tour, year);
  const { data: record, isError } = recordQuery;
  useOverviewBandReady('recapRecord', overviewQueryReady(recordQuery, picksEnabledForTour(tour) && !!tour && !!year));
  if (!picksEnabledForTour(tour) || isError || !record || !((record.event_count ?? 0) > 0)) return null;
  return <section data-recap-record className="upcoming-block recap-block" style={{ paddingTop: 0 }}>
    <HeroSectionHead inset={false} eyebrow={t('overview.recap.ourPicks', { year })} title={seasonPicksTitle(t as never, record.won, record.top10)} action={t('overview.heroHead.howWePick')} onAction={() => setOpen(true)} />
    <div className="upcoming-facts recap-figs recap-record-figs">
      <div className="cw-cell"><b>{record.event_count}</b><span>{t('overview.recap.events')}</span></div>
      <div className="cw-cell"><b>{record.won}</b><span>{t('overview.recap.winnersPicked')}</span></div>
      <div className="cw-cell"><b>{record.top10}</b><span>{t('overview.recap.inTop10')}</span></div>
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
