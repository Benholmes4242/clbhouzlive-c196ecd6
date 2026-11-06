import type React from 'react';
/** Record is event-tour/season scoped; member odds and board read only the
 * viewer-keyed RPC. House circle figures use weekly best only; the ledger
 * keeps MC/WD/DQ separate and never prints eliminated scores. */
import { Trophy } from 'lucide-react';
import { fmtScore } from '../../../utils/fmtScore';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useOurPickRecord, useBeatTheModel, useMyPickOdds } from '../../../hooks/usePickInsights';
import {aboutOneIn,averageBlindTop10,barPercent,multipleOf,rateOf,viewerBlindTop10,winnerOddsText} from './pickOdds';
import { sortedBeatRows, resultPosition, outStatus, recordPickWon, recordEventSummary, orderedRecordPicks } from './pickInsightRules';
import { surnameOf } from '../../../_shared/playerName';
import './pickPanels.css';
const TOURS = ['pga','euro','lpga','champ','pgad','liv'];
const TOUR_NAMES: Record<string,string> = { pga:'PGA TOUR', euro:'DP World', lpga:'LPGA', champ:'Champions', pgad:'Korn Ferry', liv:'LIV Golf' };
export interface OurRecordSheetProps { open: boolean; onClose: () => void; tour: string; year: number }
export function OurRecordSheet(props: OurRecordSheetProps) { return props.open ? <RecordSession key={`${props.tour}-${props.year}`} {...props} /> : null; }
function RecordSession({ onClose, tour, year }: OurRecordSheetProps) {
  const [selectedTour, setTour] = useState(tour);
  const { t } = useTranslation('tourhub');
  const recordQuery = useOurPickRecord(selectedTour, year);
  const boardQuery = useBeatTheModel(selectedTour, year);
  const myOddsQuery=useMyPickOdds(selectedTour,year);
  const record = recordQuery.isError ? null : recordQuery.data;
  const members = boardQuery.isError ? [] : boardQuery.data ?? [];
  const mine=myOddsQuery.isError?null:myOddsQuery.data;
  const copy = (key: string, opts: Record<string,unknown> = {}) => t(`overview.pickRecord.${key}`, opts);
  const rows = record && members.some(row=>row.picks>0) ? sortedBeatRows(members,record) : [];
  const events=record?.event_count;
  const wins=record?.best?.wins;
  const top10=record?.best?.top10;
  const viewerRow=members.find(row=>row.is_viewer);
  const blindTen=record?averageBlindTop10(record.events):null, blindWin=record?.random_win_pct!=null&&record.random_win_pct>0?record.random_win_pct:null;
  const showMine=!!mine&&mine.events>0;
  const myBlindWin=showMine&&mine!.random_win_pct!=null&&mine!.random_win_pct>0?mine!.random_win_pct:null, myBlindTen=viewerBlindTop10(myBlindWin);
  const chanceRow=(key:'ours'|'random'|'you',value:React.ReactNode,rate:number)=><div className="pick-chance-row" data-chance-row={key}>
    <div className="pick-chance-head"><span className="pick-chance-who">{copy(`chance.${key==='random'?'randomThree':key}`)}</span><span className="pick-chance-value">{value}</span></div>
    <div className="pick-chance-track"><div className="pick-chance-fill" style={{width:`${barPercent(rate)}%`}}/></div>
  </div>;
  const counted=(count:number,total:number,trail:string|null)=><>{copy('chance.countOf',{count,events:total})}{trail&&<em>{trail}</em>}</>;
  const group=(kind:'top10'|'winner',ours:number,blind:number|null,blindText:string|null,you:{count:number;events:number;blind:number|null}|null)=>{
    const total=events??0, rate=rateOf(ours,total), x=multipleOf(ours,rate,blind);
    const yourRate=you?rateOf(you.count,you.events):0, yourX=you?multipleOf(you.count,yourRate,you.blind):null;
    return <div className="pick-chance-group" data-chance-group={kind}>
      <div className="pick-chance-group-head"><span>{copy(kind==='top10'?'chance.groupTop10':'chance.groupWinner')}</span>{x!=null&&<span className="pick-chance-x">{x}×<em>{copy('chance.blindPicks')}</em></span>}</div>
      <div className="pick-chance-rows">
        {chanceRow('ours',counted(ours,total,copy('chance.events',{count:total})),rate)}
        {blind!=null&&blindText&&chanceRow('random',blindText,blind)}
        {you&&chanceRow('you',counted(you.count,you.events,yourX!=null?copy('chance.youMultiple',{x:yourX}):null),yourRate)}
      </div>
    </div>;
  };
  const headX=events!=null&&top10!=null&&wins!=null?{a:multipleOf(top10,rateOf(top10,events),blindTen),b:multipleOf(wins,rateOf(wins,events),blindWin)}:null;
  const headKey=headX?(headX.a!=null&&headX.b!=null?'headBoth':headX.a!=null?'headTop10':headX.b!=null?'headWinner':null):null;
  const month = record?.first_event_date ? new Intl.DateTimeFormat('en-GB', { month:'long' }).format(new Date(record.first_event_date)) : null;
  return <BottomSheet open onClose={onClose} scrollBody topRadius={22} grabberPadding="8px 0 12px" ariaLabelledBy="pick-record-title">
    <div data-our-record-sheet className="text-[color:var(--pick-ink)] pb-6">
      <header className="pick-panel-header"><div className="pick-panel-kicker">{copy('kicker')}</div><h2 id="pick-record-title">{copy('title')}</h2>{month && <div className="pick-panel-sub">{copy('since', { month })}</div>}</header>
      {recordQuery.isError ? <div className="your-pick-empty" role="alert">{copy('error')}<Button variant="ghost" onClick={()=>void recordQuery.refetch()}>{copy('retry')}</Button></div> : !record ? <div className="your-pick-empty" role="status">{copy('loading')}</div> : <>
        <div className="pick-record-tours" aria-label={copy('tours')}>{TOURS.filter(code=>record.tours.includes(code)).map(code=><Button key={code} variant="ghost" className="pick-panel-chip" aria-pressed={selectedTour===code} onClick={()=>setTour(code)}>{TOUR_NAMES[code]}</Button>)}</div>
        <div className="pick-record-three tabular-nums">{(['event_count','won','top10'] as const).map(key=><div key={key}><b>{record[key]}</b><span>{copy(key)}</span></div>)}</div>
        {events!=null && wins!=null && top10!=null && <div className="pick-record-chance">
          {headKey&&<p className="pick-chance-sentence"><Trans t={t} i18nKey={`overview.pickRecord.chance.${headKey}`} values={{a:headX!.a,b:headX!.b}} components={{b:<b/>}}/></p>}
          {group('top10',top10,blindTen,blindTen!=null?copy('chance.aboutOneIn',{n:aboutOneIn(blindTen)}):null,showMine&&viewerRow?{count:viewerRow.top10,events:mine!.events,blind:myBlindTen}:null)}
          {group('winner',wins,blindWin,blindWin!=null?winnerOddsText(blindWin):null,showMine?{count:mine!.wins,events:mine!.events,blind:myBlindWin}:null)}
          <p className="pick-chance-foot">{copy('chance.blindFoot')}</p>
        </div>}
        {rows.length>0 && <section className="pick-panel-sec" data-beat-model><div className="pick-panel-label">{copy('beatTitle')}</div>
          <div className="pick-record-board-row pick-record-board-header"><span /><span /><span>{copy('event_count')}</span><span>{copy('winsLabel')}</span><span>{copy('top10Column')}</span><span>{copy('beat')}</span></div>
          {rows.map((row,index)=><div key={row.user_id} className="pick-record-board-row tabular-nums" data-viewer={row.is_viewer} data-beat-user={row.user_id}>
            <span>{index+1}</span><div className="pick-record-board-who">{row.is_model ? <span className="pick-record-mark">c</span> : <SquircleAvatar size={22} src={row.profile_photo_url} alt={row.display_name ?? row.username ?? ''} userId={row.user_id} hairlineRing />}
              <span>{row.is_viewer ? copy('youName') : row.display_name || row.username}</span></div><span data-circle-events>{row.picks}</span><span data-circle-wins>{row.wins}</span><span data-circle-top10>{row.top10}</span><span data-circle-beat>{row.avg_percentile}%</span>
          </div>)}<div className="pick-panel-caption">{copy('beatCaption')}</div>
        </section>}
        <section className="pick-panel-sec"><div className="pick-panel-label">{copy('events')}</div>{[...record.events].sort((a,b)=>b.end_date.localeCompare(a.end_date)).map(event=><div key={event.tournament_id} className="pick-record-event" data-record-event={event.tournament_id}>
          <div className="pick-record-event-head"><b>{event.name}</b><small>{new Intl.DateTimeFormat('en-GB',{ day:'numeric',month:'short' }).format(new Date(event.end_date))}</small></div>
          <div className="pick-record-event-summary">{recordEventSummary(event.picks)}</div>
          <div className="pick-record-event-picks tabular-nums">{orderedRecordPicks(event.picks).map(pick=>{
            const out=outStatus(pick.status), won=recordPickWon(pick);
            return <div key={pick.player_id} data-record-pick={pick.player_id} data-out={out}>
              <span className="pick-record-pick-name"><span>{pick.player_name}</span>{won&&<Trophy data-record-trophy size={12} strokeWidth={2.5} className="pick-panel-win"/>}</span>
              <b className={`pick-record-pick-position ${out?'pick-panel-dim':won?'pick-panel-win':''}`} data-result-tone={out?'out':won?'win':pick.position!=null&&pick.position<=10?'top10':'rest'}>{won?'1st':resultPosition({playerId:pick.player_id,playerName:pick.player_name,...pick})}</b>
              <b className={`pick-record-pick-score ${!out&&pick.score!=null&&pick.score<0?'pick-panel-under':''}`}>{!out&&pick.score!=null?fmtScore(pick.score):''}</b>
            </div>;
          })}</div>
        </div>)}</section>
      </>}
    </div>
  </BottomSheet>;
}