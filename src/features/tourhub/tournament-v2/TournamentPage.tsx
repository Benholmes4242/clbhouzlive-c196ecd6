/**
 * TournamentPage (tournament-v2) — TD1 rebuild.
 *
 * One intelligent scroll. State-aware: upcoming / live / completed each
 * lead with their act. No tabs, no framer-motion, no shell rows.
 *
 * Reuse mandate satisfied:
 *   - useTournamentMeta          — leaderboard hook, extended select
 *   - useTourLeaderboard         — Tour Book board rows
 *   - ScorecardSheet             — the ONE drill-in sheet
 *   - useFeaturedGroups          — overview RPC
 *   - useTournamentPulse         — EventState machine
 *   - useBatchCourseImages       — hero image (the ONE Tour resolver, CB55)
 *   - useEventMoments            — moments source
 *   - useTournamentTeeTimes /
 *     useTeeTimesAll             — Round-1 tee times
 *   - useLeaderboardRealtime +
 *     useTournamentStatusRealtime — hero + board move during play
 *
 * Route entry stays as-is (TournamentDetailPage.tsx) — TD2 swaps the
 * component behind the same params.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TourHubShell } from '../components/TourHubShell';
import { TourPageShell } from '../components/TourPageShell';


import { useTournamentMeta } from '../leaderboard/useTournamentMeta';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { useBatchCourseImages } from '../hooks/useBatchCourseImages';
import { useTournamentPulse } from '../components/overview-v3/useTournamentPulse';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';

import { MiniBoard } from './sections/MiniBoard';
import { AllTeeTimesSheet } from './sections/AllTeeTimesSheet';
import { useDrawnRounds } from './data/useDrawnRounds';
import { MomentsSection } from './sections/MomentsSection';
import { FullBoardSheet } from './sections/FullBoardSheet';
import { SituationBand } from '../components/overview-v3/HybridHeroBands/SituationBand';
import { deriveHeroState, roundsFromSchedule } from '../components/overview-v3/HybridHero.utils';
import { tournamentHeadlineSegments } from '../overview/magazineCopy';
import { shortenedApplies, shortenedTo, situationSegments, visibleSituationNote } from '../overview/situationCopy';
import type { HeroTournament } from '../hooks/useHeroCarouselData';

import { useTeeTimesAll } from './data/useTeeTimesAll';
import { useTournamentHoleAnalysis } from './data/useTournamentHoleAnalysis';
import { hasStrokeBoard } from '../_shared/eventFormat';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { TournamentPageSkeleton } from '@/components/skeletons/TournamentPageSkeleton';

import {
  FONT, INK, INK_MUTE, INK_FAINT, TOUR_CANVAS, HAIRLINE_INK_8, SURFACE,
} from '../_shared/tokens';

import {usePickField,useTournamentPickState} from '../hooks/useTournamentPick';
import {useTournamentLastYearTop4} from '../hooks/useTournamentLastYearTop4';
import {useAIPredictions} from '../hooks/useAIPredictions';
import {useTourPlayerFollows} from '../leaderboard/useTourPlayerFollows';
import {useTournamentCourseHoles} from './data/useTournamentCourseHoles';
import {HeroBoardSection} from '../components/overview-v3/HybridHeroBands/HeroBoardBand';
import {ChampionStrip} from '../components/overview-v3/HybridHeroBands/ChampionStrip';
import {resolvePlayerAvatarCandidates} from '../_shared/resolvePlayerAvatar';
import {winnerRow,championNarrative,score,words,copy,playedRounds} from './data/tournamentRules';
import {TournamentHero,RaceSection,FieldSection,LastYearSection,CourseV3Section,NumbersSection,TeeV3Section,SectionHead} from './sections/TournamentV3Sections';
import './tournamentPage.css';

export function TournamentPage() {
  const { t } = useTranslation('tourhub');
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  



  const pulse = useTournamentPulse(tournamentId);

  const { data: meta, isLoading, isError: isMetaError, refetch: refetchMeta } =
    useTournamentMeta(tournamentId, { live: pulse.state === 'live' });
  const { data: leaderboard } = useTourLeaderboard(tournamentId ?? '');
  const { data: holeAnalysis } = useTournamentHoleAnalysis(tournamentId, null);
  const fieldQuery=usePickField(tournamentId??'');
  const courseHolesQuery=useTournamentCourseHoles(tournamentId);
  const {data:lastYear}=useTournamentLastYearTop4(pulse.state==='upcoming'?tournamentId:null);
  const pickState=useTournamentPickState(tournamentId??'');
  const predictions=useAIPredictions(tournamentId);
  const playerFollows=useTourPlayerFollows();
  const ourPickIds=new Set((predictions.data?.topContenders??[]).map(p=>p.playerId));
  const champion=winnerRow(leaderboard??[],meta?.winner_id??null);
  const runner=(leaderboard??[]).filter(r=>r.id!==champion?.id&&r.score!=null).sort((a,b)=>(a.score??0)-(b.score??0))[0];

  // Realtime (equivalent to legacy TournamentDetailPage): board + status.
  useLeaderboardRealtime(pulse.state === 'live' ? tournamentId : null);
  useTournamentStatusRealtime();

  // CB55: the ONE Tour course-photo resolver, keyed by tournament id — the
  // same resolution the Overview hero gets for this tournament.
  const imageAdapter = useMemo(() => {
    if (!tournamentId) return [];
    return [{
      id: tournamentId,
      venue_name: meta?.venue_name ?? meta?.name ?? null,
      venue_course_name: meta?.venue_course_name ?? null,
      venue_city: meta?.venue_city ?? null,
      venue_country: meta?.venue_country ?? null,
      venue_state: meta?.venue_state ?? null,
    }];
  }, [tournamentId, meta]);
  const { data: imageMap } = useBatchCourseImages(imageAdapter);
  const courseImageUrl = tournamentId ? imageMap?.get(tournamentId) ?? null : null;

  // Round awareness: upcoming events show round 1; live/completed use
  // the tournament's current_round so the tab=tee-times deep link never
  // shows Thursday's times on Sunday (Brief F-TD-3 §3).
  const currentRound = pulse.state === 'upcoming' ? 1 : (meta?.current_round ?? 1);
  // Tee-time availability is data-driven: a draw publishes hours before the
  // round rolls over at venue-local midnight.
  const { data: drawnRoundsData } = useDrawnRounds(tournamentId);
  const drawnRounds = drawnRoundsData ?? [];
  const highestDrawnRound = drawnRounds.length ? Math.max(...drawnRounds) : null;
  // Lazy fetch: skip the sr_tee_times request on completed events unless
  // the tab=tee-times deep link is present (Brief F-TD-3 §4).
  const [teeRoundChoice,setTeeRoundChoice]=useState(1);
  const selectedTeeRound=pulse.state==='upcoming'?teeRoundChoice:Math.min(4,(meta?.current_round??1)+1);
  const teeGroupsEnabled=pulse.state!=='completed'&&drawnRounds.includes(selectedTeeRound);
  const {data:teeGroups=[]}=useTeeTimesAll(tournamentId,selectedTeeRound,{enabled:teeGroupsEnabled});

  const [teeTimesOpen, setTeeTimesOpen] = useState(false);
  const [fullBoardOpen, setFullBoardOpen] = useState(false);



  const tourCode = (meta?.tour_code ?? 'pga').toLowerCase();

  // Inbound ?tab= mapping from legacy deep links:
  //   tab=leaderboard  -> scroll to #the-act
  //   tab=tee-times    -> upcoming: scroll to #the-act (tee-times), else open sheet
  //   any other        -> ignore
  useEffect(() => {
    if (isLoading || !meta) return;
    const tab = searchParams.get('tab');
    if (!tab) return;
    if (tab === 'leaderboard') {
      requestAnimationFrame(() => {
        const el = document.getElementById('the-act');
        if (el) scrollElementIntoView(el, { behavior: 'smooth' });
      });
    } else if (tab === 'tee-times') {
      if (pulse.state === 'upcoming') {
        requestAnimationFrame(() => {
          const el = document.getElementById('the-act');
          if (el) scrollElementIntoView(el, { behavior: 'smooth' });
        });
      } else if (teeGroups.length > 0) {
        setTeeTimesOpen(true);
      }
    }
  }, [isLoading, meta, searchParams, pulse.state, teeGroups.length]);

  if (isMetaError) {
    return (
      <TourHubShell immersive immersiveStatusBar>
        <div style={{
          background: TOUR_CANVAS, minHeight: '100dvh', fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ maxWidth: 320 }}>
            {/* READ 11: error eyebrow is a sentence in caps, not a coordinate. */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 10 }}>
              {t('tournament.error.title')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: INK_MUTE, lineHeight: 1.55, marginBottom: 18 }}>
              {t('tournament.error.body')}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => refetchMeta()}
                style={{
                  background: INK, color: TOUR_CANVAS, border: 'none', borderRadius: 999,
                  padding: '10px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: FONT, letterSpacing: '0.02em',
                }}
              >
                {t('tournament.error.retry')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent', color: INK, border: `0.5px solid ${HAIRLINE_INK_8}`,
                  borderRadius: 999, padding: '10px 18px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT, letterSpacing: '0.02em',
                }}
              >
                {t('tournament.error.back')}
              </button>
            </div>
          </div>
        </div>
      </TourHubShell>
    );
  }

  if (isLoading || !meta) {
    return (
      <TourHubShell immersive immersiveStatusBar>
        <TournamentPageSkeleton />
      </TourHubShell>
    );
  }

  const strokeBoard = hasStrokeBoard(meta.event_type);
  const leaderboardRows = strokeBoard ? (leaderboard ?? []) : [];
  const hasBoard = leaderboardRows.some(r=>r.score!=null && r.position!=null);
  const openFullBoard = () => setFullBoardOpen(true);

  /* BRIEF_TOUR_PLAYOFF_AND_SHORTENED_EVENTS §6: the overview's situation copy,
     from the same builder, above the board eyebrow when the event awaits a
     playoff, was shortened, or carries a visible situation_note. */
  const situationTournament = {
    id: meta.id, name: meta.name ?? '', status: meta.status ?? '',
    startDate: meta.start_date ?? '', endDate: meta.end_date ?? '',
    currentRound: meta.current_round ?? null, defendingChampion: meta.defending_champion ?? null,
  } as unknown as HeroTournament;
  const situationState = deriveHeroState(situationTournament);
  const awaitingPlayoff = situationState.kind === 'results' && situationState.variant === 'awaiting-playoff';
  const scheduledRounds = roundsFromSchedule(meta.start_date, meta.end_date);
  const isShortened = strokeBoard && shortenedApplies(situationState) && shortenedTo(leaderboardRows, scheduledRounds) != null;
  const situationNote = visibleSituationNote(meta.situation_note, situationState, meta.end_date);
  const situationCopy = awaitingPlayoff || isShortened || situationNote
    ? situationSegments({
        state: situationState,
        entries: strokeBoard ? leaderboardRows : [],
        scheduledRounds,
        headline: strokeBoard ? tournamentHeadlineSegments({ tournament: situationTournament, state: situationState, leaderboard: leaderboardRows, t }) : [],
        t,
      })
    : null;



  return (
    <TourHubShell immersive immersiveStatusBar>
      <TourPageShell
        immersive
        background={TOUR_CANVAS}
        title={meta?.name ?? 'Tournament'}
        subtitle={meta?.venue_name ?? undefined}
        backFallback="/tourhub?tab=schedule"
      >
      <div className="tournament-v3" style={{fontFamily:FONT}}>
        <TournamentHero meta={meta} phase={pulse.state} rows={leaderboardRows} field={fieldQuery.isError?[]:fieldQuery.data??[]} last={lastYear??[]} holes={courseHolesQuery.isError?[]:courseHolesQuery.data??[]} image={courseImageUrl}/>
        {pulse.state==='completed' && champion?.player && champion.score!=null && <ChampionStrip presentation="tournament" name={champion.player.full_name} playerKey={champion.player.id} avatarCandidates={resolvePlayerAvatarCandidates({name:champion.player.full_name,photoUrl:champion.player.photo_url,tourSlug:tourCode})} score={score(champion.score)} scoreValue={champion.score} scoreLabel={runner?.score!=null?copy('by',{words:words(runner.score-champion.score).toUpperCase()}):undefined} narrativeParts={championNarrative(meta,leaderboardRows)}/>}
        {pulse.state==='completed' && strokeBoard && <RaceSection meta={meta} phase={pulse.state} rows={leaderboardRows}/>}
        <section id="the-act">
          {situationCopy ? <div data-tournament-situation><SituationBand segments={situationCopy} note={situationNote} /></div> : null}
          {pulse.state!=='upcoming'&&hasBoard&&<section className="tv-section" data-tv-section="board"><SectionHead title={copy(pulse.state==='completed'?'finalBoard':'board')} action={copy('fullBoard')} onAction={openFullBoard}/><MiniBoard tournamentId={tournamentId??meta.id} entries={leaderboardRows} currentRound={meta.current_round??playedRounds(leaderboardRows)} phase={pulse.state==='completed'?'completed':'live'} presentation="tournament" winnerPlayerId={champion?.player?.id??null} tourSlug={tourCode}/></section>}
        </section>
        <div data-tv-section="picks"><HeroBoardSection picksOnly tournamentId={tournamentId??meta.id} entries={leaderboardRows} phase={pulse.state} currentRound={meta.current_round??null} championSrId={meta.winner_id} eventName={meta.name??''} eventTourCode={tourCode} eventSeasonYear={meta.start_date?new Date(meta.start_date).getFullYear():undefined} venuePar={meta.venue_par} totalRounds={scheduledRounds}/></div>
        {pulse.state==='live'&&strokeBoard&&<RaceSection meta={meta} phase={pulse.state} rows={leaderboardRows}/>}
        {strokeBoard&&<TeeV3Section groups={teeGroups} phase={pulse.state} round={selectedTeeRound} rounds={drawnRounds} onRound={setTeeRoundChoice} onAll={()=>setTeeTimesOpen(true)} meta={meta} mine={pickState.data?.my_player_id??null} picks={ourPickIds} follows={playerFollows.ids} field={fieldQuery.data??[]} defender={lastYear?.[0]?.name??meta.defending_champion} rows={leaderboardRows}/>}
        {pulse.state==='upcoming'&&<><FieldSection field={fieldQuery.isError?[]:fieldQuery.data??[]} tour={tourCode}/><LastYearSection last={lastYear??[]} field={fieldQuery.data??[]} tour={tourCode}/></>}
        {pulse.state!=='upcoming'&&strokeBoard&&<NumbersSection meta={meta} phase={pulse.state} rows={leaderboardRows} field={fieldQuery.data?.length??0} picks={ourPickIds}/>}
        <CourseV3Section id={tournamentId??meta.id} phase={pulse.state} holes={courseHolesQuery.isError?[]:courseHolesQuery.data??[]} analysis={holeAnalysis??null} rows={leaderboardRows} currentRound={meta.current_round??1}/>
        {pulse.state!=='upcoming'&&<div data-tv-section="moments"><MomentsSection tournamentId={tournamentId??meta.id} tourCode={tourCode}/></div>}

        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      </div>

      {strokeBoard && (
      <AllTeeTimesSheet
        open={teeTimesOpen}
        onClose={() => setTeeTimesOpen(false)}
        tournamentId={tournamentId!}
        tournamentName={meta.name}
        defaultRound={selectedTeeRound}
        maxAvailableRound={highestDrawnRound ?? selectedTeeRound}
        drawnRounds={drawnRounds}
        entries={leaderboardRows}

      />
      )}
      {strokeBoard && (
      <FullBoardSheet
        open={fullBoardOpen}
        onClose={() => setFullBoardOpen(false)}
        tournamentId={tournamentId!}
        meta={meta}
        entries={leaderboardRows}
      />
      )}
      </TourPageShell>
    </TourHubShell>
  );
}

export default TournamentPage;
