/** Weekly rows share today/thru/tie rules with BoardTable. No faces anywhere
 * (signed-off board-rows mock); player rows carry the shared HoleTiles.
 * Winner identity is the hero's confirmed sr_id, never inferred from a name. */
import { ChevronRight } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { tournamentRoute } from '../../routes';
import { fullTourLabel } from '../../_shared/tourOrder';
import { surnameOf } from '../../_shared/playerName';
import { getScoreColor } from '../../_shared/scoreColor';
import { fmtScore } from '../../utils/fmtScore';
import { todayFromEntry, fmtThru, type BoardEntry } from '../../leaderboard/BoardTable';
import { MARK_SURFACE_MINE, HoleMarks, orderedHoleCells } from '../../leaderboard/BoardRound';
import { useBoardHoles } from '../../leaderboard/useBoardHoles';
import { boardTieRole, leaderSummary } from '../../leaderboard/leaderboardRules';
import { chasePlayers,onCourse,situation,startsValues,weekFacts,weekRows,weekTotalRounds } from './alsoWeekRules';
import '../../leaderboard/leaderboard.css';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import './alsoWeek.css';

/** The tiles' round, shared with the Tour hero board: the current round once
 *  the player has started it, otherwise the previous round; a finished event
 *  shows the final round. Round one before tee-off has no previous round. */
export function weekTileRound(e: BoardEntry, round: number | null, complete: boolean): number | null {
  if (round == null) return null;
  if (complete) return round;
  if (todayFromEntry(e, round) != null) return round;
  return round > 1 ? round - 1 : null;
}
const WEEK_EMPTY_TILES: ReadonlyArray<null> = Array.from({ length: 18 }, () => null);
function WeekBoard({entries,followed,round,complete,tournamentId}:{entries:BoardEntry[];followed:Set<string>;round:number|null;complete:boolean;tournamentId:string}) {
  const {t}=useTranslation('tourhub');const {top,extra}=weekRows(entries,followed);
  const prevRound=!complete&&round!=null&&round>1?round-1:null;
  const needsPrev=prevRound!=null&&[...top,...extra].some(e=>e.player?.id&&todayFromEntry(e,round)==null);
  const cur=useBoardHoles(tournamentId,round,0,round!=null);
  const prev=useBoardHoles(tournamentId,needsPrev?prevRound:null,0,needsPrev);
  const row=(e:BoardEntry,index:number,added=false)=>{
    const tie=added?'':boardTieRole(top,index);const mine=!!e.player?.id&&followed.has(e.player.id);
    const today=todayFromEntry(e,round);
    const tileRound=weekTileRound(e,round,complete);
    const holes=tileRound!=null&&e.player?.id?(tileRound===round?cur.byPlayer.get(e.player.id):prev.byPlayer.get(e.player.id)):undefined;
    return <div className="also-br" key={e.id} data-player={e.player?.id} data-mine={mine} data-tie-role={tie||undefined}>
      <span className="also-pos" data-leader={e.position===1}>{added||!['middle','last'].includes(tie)?`${e.position_tied?'T':''}${e.position??''}`:''}</span>
      <span className="also-who"><span className="also-name">{surnameOf(e.player?.full_name??'')}{mine&&<span className="also-star">★</span>}</span></span>
      <span className="also-c also-today" style={{color:getScoreColor(today,'dark')}}>{fmtScore(today,{absent:''})}</span>
      <span className="also-c also-thru">{complete?'F':today==null?'':fmtThru(e.thru)}</span>
      <span className="also-c also-tot" style={{color:getScoreColor(e.score,'dark')}}>{fmtScore(e.score,{absent:''})}</span>
      <HoleMarks holes={holes?orderedHoleCells(holes):WEEK_EMPTY_TILES} surface={mine?MARK_SURFACE_MINE:PAGE_CANVAS} />
    </div>;
  };
  return top.length||extra.length?<div className="also-board"><div className="also-bh">{['pos','player','today','thru','tot'].map(k=><span key={k}>{t(`overview.alsoThisWeek.${k}`)}</span>)}</div>{top.map((e,i)=>row(e,i))}{extra.length>0&&<><div className="also-gap"/>{extra.map((e,i)=>row(e,i,true))}</>}</div>:null;
}
export function AlsoWeekEvent({slide,entries,draw,followed}:{slide:HeroSlide;entries:BoardEntry[];draw?:{first:string|null;players:NonNullable<BoardEntry['player']>[]};followed:Set<string>}) {
  const {t,i18n}=useTranslation('tourhub');const navigate=useNavigate();const event=slide.tournament;
  const total=weekTotalRounds(slide);const round=event.currentRound??(slide.type==='completed'?total:null);
  const starts=startsValues(event.startDate,draw?.first??null,i18n.language||'en');
  const started=onCourse(entries,round);const line=situation(entries,round,total);
  const winner=entries.find(e=>e.player?.sr_id===event.winnerId)??(entries.filter(e=>e.position===1).length===1?entries.find(e=>e.position===1):undefined);
  const summary=leaderSummary(entries);const playoff=!!winner&&entries.some(e=>e.id!==winner.id&&e.score===winner.score);
  const facts=weekFacts(draw?.players.length||null,event.purse,event.currency,event.defendingChampion);
  const mine=draw?.players.filter(p=>followed.has(p.id))??[];
  const sub=[event.venueName,slide.type==='upcoming'&&event.venueCourseName!==event.venueName?event.venueCourseName:null,event.venuePar!=null?t('overview.alsoThisWeek.par',{par:event.venuePar}):null,slide.type==='live'&&started>0?t('overview.alsoThisWeek.onCourse',{count:started,field:entries.length}):null].filter(Boolean).join(' · ');
  const state=slide.type==='completed'?t('overview.alsoThisWeek.final'):slide.type==='upcoming'?starts?t(`overview.alsoThisWeek.${starts.time?'startsTime':'starts'}`,starts):'':round===total?t('overview.alsoThisWeek.finalRound'):round!=null?t(`overview.alsoThisWeek.${total!=null&&total!==4?'roundOf':'round'}`,{round,total}):'';
  const target=tournamentRoute(event.id,{kind:'overview'});
  return <Button variant="ghost" className="also-event" onClick={()=>navigate(target.to,{state:target.state})}>
    <div className="also-kick"><span>{fullTourLabel(event.tourSlug,event.tourName)}</span><span className="also-state" data-state={slide.type}>{slide.type==='live'&&<i className="also-live-dot"/>}{state}</span></div>
    <div className="also-title"><span>{event.name}</span><ChevronRight size={16} aria-hidden/></div><div className="also-sub">{sub}</div>
    {slide.type==='live'&&line&&<div className="also-sit"><Trans ns="tourhub" i18nKey={`overview.alsoThisWeek.${line.key}`} values={{...line.values,score:fmtScore(line.values.score)}} components={{b:<strong/>}}/></div>}
    {slide.type==='live'&&line&&<div className="also-chase"><div className="also-track"><i className="also-rule"/>{Array.from({length:7},(_,back)=><i className="also-tick" key={back} style={{left:`calc(4px + ${back} * (100% - 8px) / 6)`}}/>)}{chasePlayers(entries,followed).map(p=><i key={p.entry.id} className="also-pip" data-back={p.back} data-mine={p.mine} data-leader={p.back===0} style={{left:`calc(4px + ${p.back} * (100% - 8px) / 6)`,bottom:12+p.stack*7}}/>)}</div><div className="also-axis">{['leader','threeBack','sixBack'].map(k=><span key={k}>{t(`overview.alsoThisWeek.${k}`)}</span>)}</div></div>}
    {slide.type==='completed'&&winner&&<div className="also-win"><div><div className="also-win-line">{t(`overview.alsoThisWeek.${playoff?'playoff':'wins'}`,{name:surnameOf(winner.player?.full_name??''),margin:summary?.lead})}</div><div className="also-win-sub">{fmtScore(winner.score)}{event.venuePar!=null&&round!=null&&todayFromEntry(winner,round)!=null?` · ${t('overview.alsoThisWeek.closing',{strokes:event.venuePar+(todayFromEntry(winner,round)??0)})}`:''}</div></div></div>}
    {slide.type!=='upcoming'&&<WeekBoard entries={entries} followed={followed} round={round} complete={slide.type==='completed'} tournamentId={event.id}/>}
    {slide.type==='upcoming'&&facts.length>0&&<div className="also-facts">{facts.map(f=><div className="also-fact" key={f.key} data-fact={f.key}><div className="also-fv">{f.value}</div><div className="also-fl">{t(`overview.alsoThisWeek.${f.key}`)}</div></div>)}</div>}
    {slide.type==='upcoming'&&mine.length>0&&<div className="also-yours"><span><Trans ns="tourhub" i18nKey="overview.alsoThisWeek.yours" count={mine.length} values={{count:mine.length}} components={{b:<strong/>}}/></span></div>}
  </Button>;
}