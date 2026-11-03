/** Player detail owns one header-selected season and tour. Analytical readers
 * never fall back across seasons; only the unchanged live strip is live-owned.
 * Race ranks retain their existing source through the isolated header-year reader.
 * Shared picks/you-and-tour helpers remain authoritative; old sections are retired. */
import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { motion,AnimatePresence } from 'framer-motion';
import { TourHubShell } from '../components/TourHubShell';
import { TourPageShell } from '../components/TourPageShell';
import { useTourPlayer } from '../hooks/useTourHubData';
import { usePlayerState } from '../hooks/usePlayerState';
import { PlayerPageSkeleton } from '@/components/skeletons/PlayerPageSkeleton';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';
import { useTourPlayerFollows } from '../leaderboard/useTourPlayerFollows';
import { useTourHoleAverages,useMyHoleScoring } from '../players-v2/you/useYouAndTour';
import { usePlayerHeader,usePlayerSeasonResults,usePlayerHoleScoring,usePlayerStatPercentiles,usePlayerPickHistory,usePlayerRaceRank } from './data/usePlayerData';
import { tourFor,sectionVisibility,playerTourLabel } from './playerRules';
import { HeroSection } from './sections/HeroSection';
import { LiveNowStrip } from './sections/LiveNowStrip';
import { PlayerForm } from './sections/PlayerForm';
import { PlayerGame } from './sections/PlayerGame';
import { PlayerShots } from './sections/PlayerShots';
import { PlayerRoundByRound,PlayerMajors,PlayerPicks } from './sections/PlayerSeasonDetails';
import { TournamentsSection } from './sections/TournamentsSection';
import { AboutSection } from './sections/AboutSection';
import { YourPickSheet } from '../components/overview-v3/HybridHeroBands/YourPickSheet';
import { OurRecordSheet } from '../components/overview-v3/HybridHeroBands/OurRecordSheet';
import './playerPage.css';
export function PlayerPage() {
 const {t}=useTranslation('tourhub'),{playerId=''}=useParams<{playerId:string}>();const playerQuery=useTourPlayer(playerId),headerQuery=usePlayerHeader(playerId);
 const header=headerQuery.isError?null:headerQuery.data??null,year=header?.season_year??null,tour=tourFor(header,playerQuery.data?.tour_codes);
 const resultsQuery=usePlayerSeasonResults(playerId,year),holesQuery=usePlayerHoleScoring(playerId,year),statsQuery=usePlayerStatPercentiles(playerId,year),picksQuery=usePlayerPickHistory(playerId,year),raceQuery=usePlayerRaceRank(playerId,tour,year);
 const tourQuery=useTourHoleAverages(tour,year),{user}=useSupabaseSession(),guest=useIsGuest(),mineQuery=useMyHoleScoring(!guest&&!user?.is_anonymous?user?.id:null);
 const follows=useTourPlayerFollows(),gate=useGuestActionGate(),state=usePlayerState(playerId),[pickOpen,setPickOpen]=useState(false),[recordOpen,setRecordOpen]=useState(false);
 useEffect(()=>{scrollPageToTop('auto');setPickOpen(false);setRecordOpen(false);},[playerId]);
 if(playerQuery.isLoading||headerQuery.isLoading||year!=null&&resultsQuery.isLoading)return <TourHubShell><PlayerPageSkeleton/></TourHubShell>;
 const player=playerQuery.data;
 if(playerQuery.isError||!player||headerQuery.isError)return <TourHubShell><div className="player-v3 px-5 py-20"><p>{t('player.error.loadFailed')}</p><Button onClick={()=>{void playerQuery.refetch();void headerQuery.refetch();}}>{t('player.error.retry')}</Button></div></TourHubShell>;
 const results=resultsQuery.isError?[]:resultsQuery.data??[],stats=statsQuery.isError?[]:statsQuery.data??[],holes=holesQuery.isError?null:holesQuery.data??null,tourHoles=tourQuery.isError?null:tourQuery.data??null,mine=mineQuery.isError?null:mineQuery.data??null;
 const visible=sectionVisibility(results.length,stats,holes,tourHoles,mine,!!user&&!guest&&!user.is_anonymous),liveId=state.state==='live'?state.liveData?.tournamentId??null:null;
 const onPick=()=>{if(gate('other')||!user||user.is_anonymous)return;setPickOpen(true);};
 return <TourHubShell><TourPageShell immersive background="var(--player-canvas)" title={player.full_name} backFallback="/tourhub?tab=players"><div className="player-v3">
 <HeroSection player={player} header={header} results={results} tour={tour} race={raceQuery.isError?null:raceQuery.data??null} following={follows.ids.has(player.id)} busy={follows.busy} onFollow={()=>follows.toggle(player.id)} onPick={onPick}/>
 <AnimatePresence initial={false}>{state.state==='live'&&state.liveData&&<motion.div key="live-now" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.25,ease:'easeOut'}} style={{overflow:'hidden'}}><LiveNowStrip liveData={state.liveData} playerName={player.full_name}/></motion.div>}</AnimatePresence>
 {year!=null&&<PlayerForm results={results} year={year} name={player.full_name}/>}
 {visible.game&&<PlayerGame stats={stats} tour={tour} label={playerTourLabel(tour)}/>}
 {visible.shots&&holes&&tourHoles&&<PlayerShots him={holes} tour={tourHoles} mine={visible.you?mine:null} code={tour}/>}
 <PlayerRoundByRound results={results} tour={tour}/>{year!=null&&<PlayerMajors results={results} year={year}/>}
 <PlayerPicks history={picksQuery.isError?null:picksQuery.data??null} tour={tour} onRecord={()=>setRecordOpen(true)}/>
 <TournamentsSection results={results} playerId={player.id} playerName={player.full_name} liveTournamentId={liveId}/><AboutSection player={player}/>
 {header?.next_tournament_id&&<YourPickSheet open={pickOpen} onClose={()=>setPickOpen(false)} tournamentId={header.next_tournament_id} eventName={header.next_name} ourPicks={[]} tourCode={tour} initialPlayerId={player.id}/>}
 {year!=null&&<OurRecordSheet open={recordOpen} onClose={()=>setRecordOpen(false)} tour={tour} year={year}/>}
 </div></TourPageShell></TourHubShell>;
}
