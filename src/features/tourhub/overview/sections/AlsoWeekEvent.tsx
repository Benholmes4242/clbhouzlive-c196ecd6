/** Also this week player rows ARE the Tour hero board's rows (HeroBoardRows,
 * signed-off also-week-board mock): POS | PLAYER | R1…Rn | TOT, tap a row to
 * open its round underneath (chips, hole marks, OUT/IN or the no-card note,
 * Full scorecard), one open row per card. The event header is the only
 * navigation control; the board sits outside it. No faces anywhere. Winner
 * identity is the hero's confirmed sr_id, never inferred from a name. */
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
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { leaderSummary } from '../../leaderboard/leaderboardRules';
import { HeroBoardRows } from '../../tournament-v2/sections/HeroBoardRows';
import { chasePlayers,onCourse,situation,startsValues,weekFacts,weekRows,weekTotalRounds } from './alsoWeekRules';
import './alsoWeek.css';

export function AlsoWeekEvent({slide,entries,draw,followed}:{slide:HeroSlide;entries:BoardEntry[];draw?:{first:string|null;players:NonNullable<BoardEntry['player']>[]};followed:Set<string>}) {
  const {t,i18n}=useTranslation('tourhub');const navigate=useNavigate();const event=slide.tournament;
  const total=weekTotalRounds(slide);const round=event.currentRound??(slide.type==='completed'?total:null);
  const complete=slide.type==='completed';
  const starts=startsValues(event.startDate,draw?.first??null,i18n.language||'en');
  const started=onCourse(entries,round);const line=situation(entries,round,total);
  const winner=entries.find(e=>e.player?.sr_id===event.winnerId)??(entries.filter(e=>e.position===1).length===1?entries.find(e=>e.position===1):undefined);
  const summary=leaderSummary(entries);const playoff=!!winner&&entries.some(e=>e.id!==winner.id&&e.score===winner.score);
  const facts=weekFacts(draw?.players.length||null,event.purse,event.currency,event.defendingChampion);
  const mine=draw?.players.filter(p=>followed.has(p.id))??[];
  const sub=[event.venueName,slide.type==='upcoming'&&event.venueCourseName!==event.venueName?event.venueCourseName:null,event.venuePar!=null?t('overview.alsoThisWeek.par',{par:event.venuePar}):null,slide.type==='live'&&started>0?t('overview.alsoThisWeek.onCourse',{count:started,field:entries.length}):null].filter(Boolean).join(' · ');
  const state=complete?t('overview.alsoThisWeek.final'):slide.type==='upcoming'?starts?t(`overview.alsoThisWeek.${starts.time?'startsTime':'starts'}`,starts):'':round===total?t('overview.alsoThisWeek.finalRound'):round!=null?t(`overview.alsoThisWeek.${total!=null&&total!==4?'roundOf':'round'}`,{round,total}):'';
  const target=tournamentRoute(event.id,{kind:'overview'});
  const {top,extra}=weekRows(entries,followed);
  const winnerClosing=complete&&winner&&event.venuePar!=null&&round!=null?todayFromEntry(winner,round):null;
  return <div className="also-event">
    <Button variant="ghost" className="also-head" onClick={()=>navigate(target.to,{state:target.state})}>
      <div className="also-kick"><span>{fullTourLabel(event.tourSlug,event.tourName)}</span><span className="also-state" data-state={slide.type}>{slide.type==='live'&&<i className="also-live-dot"/>}{state}</span></div>
      <div className="also-title"><span>{event.name}</span><ChevronRight size={16} aria-hidden/></div><div className="also-sub">{sub}</div>
      {slide.type==='live'&&line&&<div className="also-sit"><Trans ns="tourhub" i18nKey={`overview.alsoThisWeek.${line.key}`} values={{...line.values,score:fmtScore(line.values.score)}} components={{b:<strong/>}}/></div>}
      {slide.type==='live'&&line&&<div className="also-chase"><div className="also-track"><i className="also-rule"/>{Array.from({length:7},(_,back)=><i className="also-tick" key={back} style={{left:`calc(4px + ${back} * (100% - 8px) / 6)`}}/>)}{chasePlayers(entries,followed).map(p=><i key={p.entry.id} className="also-pip" data-back={p.back} data-mine={p.mine} data-leader={p.back===0} style={{left:`calc(4px + ${p.back} * (100% - 8px) / 6)`,bottom:12+p.stack*7}}/>)}</div><div className="also-axis">{['leader','threeBack','sixBack'].map(k=><span key={k}>{t(`overview.alsoThisWeek.${k}`)}</span>)}</div></div>}
      {complete&&winner&&<div className="also-win"><div><div className="also-win-line">{t(`overview.alsoThisWeek.${playoff?'playoff':'wins'}`,{name:surnameOf(winner.player?.full_name??''),margin:summary?.lead})}</div><div className="also-win-sub"><span className="also-win-score" style={{color:getScoreColor(winner.score,'dark')}}>{fmtScore(winner.score)}</span>{winnerClosing!=null?` · ${t('overview.alsoThisWeek.closing',{strokes:event.venuePar as number+winnerClosing})}`:''}</div></div></div>}
    </Button>
    {slide.type!=='upcoming'&&(top.length>0||extra.length>0)&&<div className="also-board"><HeroBoardRows
      tournamentId={event.id}
      entries={entries}
      rows={top}
      extraRows={extra}
      currentRound={round}
      phase={complete?'completed':'live'}
      tourSlug={event.tourSlug}
      totalRounds={total}
      bleed
      flushTop
    /></div>}
    {slide.type==='upcoming'&&facts.length>0&&<div className="also-facts">{facts.map(f=><div className="also-fact" key={f.key} data-fact={f.key}><div className="also-fv">{f.value}</div><div className="also-fl">{t(`overview.alsoThisWeek.${f.key}`)}</div></div>)}</div>}
    {slide.type==='upcoming'&&mine.length>0&&<div className="also-yours"><span><Trans ns="tourhub" i18nKey="overview.alsoThisWeek.yours" count={mine.length} values={{count:mine.length}} components={{b:<strong/>}}/></span></div>}
  </div>;
}
