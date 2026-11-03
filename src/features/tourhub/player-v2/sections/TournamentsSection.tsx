/** Results and full-season sheet share recorded positions and win authority.
 * Eight newest rows on-page, all rows in the same existing sheet lifecycle. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { PlayerResult } from '../data/usePlayerData';
import { newest,scoreText } from '../playerRules';
import { isAnyMajor } from '../../utils/majorScope';
import { tournamentRoute } from '../../routes';
import { PlayerSection } from './PlayerSection';
export function PlayerResultRow({result:r,playerId,playerName,isLive,from}:{result:PlayerResult;playerId:string;playerName:string;isLive:boolean;from:'section'|'sheet'}) {
 const {t}=useTranslation('tourhub');const date=new Date(r.end_date),target=tournamentRoute(r.tournament_id,{kind:'player',playerName});
 return <Link to={target.to} state={target.state} className="pv-result num" data-win={r.is_winner} data-player-result={r.tournament_id} onClick={()=>void analyticsEvents.track('tour_player_result_tapped',{player_id:playerId,tournament_id:r.tournament_id,position:r.display_position,from})}>
 <div className="pv-date"><b>{date.getDate()}</b><span>{new Intl.DateTimeFormat('en-GB',{month:'short'}).format(date).toUpperCase()}</span></div><div><div className="pv-event"><span>{r.name}</span>{r.is_winner?<small className="pv-win">{t('player.v3.win')}</small>:isAnyMajor(r.name)?<small>{t('player.v3.major')}</small>:null}{isLive&&<small>{t('player.v3.live')}</small>}</div><div className="pv-result-rounds">{[r.round_1,r.round_2,r.round_3,r.round_4].flatMap((score,i)=>typeof score==='number'?[<span key={i} className={score<0?'pv-under':''}>{scoreText(score)}</span>]:[])}</div></div>
 <div className="pv-position"><b className={r.is_winner?'pv-win':['MC','WD'].includes(r.display_position)?'pv-out':''}>{r.display_position}</b>{typeof r.score==='number'&&<span className={r.score<0?'pv-under':''}>{scoreText(r.score)}</span>}</div></Link>;
}
export function TournamentsSection({results,playerId,playerName,liveTournamentId}:{results:PlayerResult[];playerId:string;playerName:string;liveTournamentId:string|null}) {
 const {t}=useTranslation('tourhub');const [open,setOpen]=useState(false);if(!results.length)return null;const rows=newest(results);
 const show=()=>{setOpen(true);void analyticsEvents.track('tour_player_full_season_opened',{player_id:playerId,results:rows.length});};
 const renderRows=(list:PlayerResult[],from:'section'|'sheet')=>list.map(r=><PlayerResultRow key={r.tournament_id} result={r} playerId={playerId} playerName={playerName} isLive={r.tournament_id===liveTournamentId} from={from}/>);
 return <><PlayerSection id="results" title={t('player.v3.results')} right={rows.length>8?<Button variant="ghost" className="pv-link" onClick={show}>{t('player.v3.fullSeason')}</Button>:null}>{renderRows(rows.slice(0,8),'section')}{rows.length>8&&<Button variant="ghost" className="pv-link pv-more" onClick={show}>{t('player.v3.allStarts',{count:rows.length})}</Button>}</PlayerSection>
 <BottomSheet open={open} onClose={()=>setOpen(false)} scrollBody className="player-season-sheet" ariaLabelledBy="player-season-title"><div className="pv-sec"><h2 id="player-season-title">{playerName}</h2>{renderRows(rows,'sheet')}</div></BottomSheet></>;
}
