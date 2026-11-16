import { picksEnabledForTour } from '../../../_shared/picksEnabledForTour';
/** Record is event-tour/season scoped and reads only useOurPickRecord
 * (BRIEF_OUR_RECORD_RESULTS_ONLY: no odds, Your pick or circle board here).
 * The ledger keeps MC/WD/DQ separate and never prints eliminated scores. */
import { Trophy } from 'lucide-react';
import { fmtScore } from '../../../utils/fmtScore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { useOurPickRecord } from '../../../hooks/usePickInsights';
import { resultPosition, outStatus, recordPickWon, recordEventSummary, orderedRecordPicks } from './pickInsightRules';
import './pickPanels.css';
import { activeTourList } from '../../../constants/tourMap';
const TOURS = activeTourList(['pga','euro','lpga','champ','pgad','liv']).filter(picksEnabledForTour);
const TOUR_NAMES: Record<string,string> = { pga:'PGA TOUR', euro:'DP World', lpga:'LPGA', champ:'Champions', pgad:'Korn Ferry', liv:'LIV Golf' };
export interface OurRecordSheetProps { open: boolean; onClose: () => void; tour: string; year: number }
export function OurRecordSheet(props: OurRecordSheetProps) { return props.open && picksEnabledForTour(props.tour) ? <RecordSession key={`${props.tour}-${props.year}`} {...props} /> : null; }
function RecordSession({ onClose, tour, year }: OurRecordSheetProps) {
  const [selectedTour, setTour] = useState(tour);
  const { t } = useTranslation('tourhub');
  const recordQuery = useOurPickRecord(selectedTour, year);
  const record = recordQuery.isError ? null : recordQuery.data;
  const copy = (key: string, opts: Record<string,unknown> = {}) => t(`overview.pickRecord.${key}`, opts);
  const month = record?.first_event_date ? new Intl.DateTimeFormat('en-GB', { month:'long' }).format(new Date(record.first_event_date)) : null;
  return <BottomSheet open onClose={onClose} scrollBody topRadius={22} grabberPadding="8px 0 12px" ariaLabelledBy="pick-record-title">
    <div data-our-record-sheet className="text-[color:var(--pick-ink)] pb-6">
      <header className="pick-panel-header"><div className="pick-panel-kicker">{copy('kicker')}</div><h2 id="pick-record-title">{copy('title')}</h2>{month && <div className="pick-panel-sub">{copy('since', { month })}</div>}</header>
      {recordQuery.isError ? <div className="your-pick-empty" role="alert">{copy('error')}<Button variant="ghost" onClick={()=>void recordQuery.refetch()}>{copy('retry')}</Button></div> : !record ? <div className="your-pick-empty" role="status">{copy('loading')}</div> : <>
        <div className="pick-record-tours" aria-label={copy('tours')}>{TOURS.filter(code=>record.tours.includes(code)).map(code=><Button key={code} variant="ghost" className="pick-panel-chip" aria-pressed={selectedTour===code} onClick={()=>setTour(code)}>{TOUR_NAMES[code]}</Button>)}</div>
        <div className="pick-record-three tabular-nums">{(['event_count','won','top10'] as const).map(key=><div key={key}><b>{record[key]}</b><span>{copy(key)}</span></div>)}</div>
        <section className="pick-panel-sec pick-record-events" data-record-events><div className="pick-panel-label">{copy('events')}</div>{[...record.events].sort((a,b)=>b.end_date.localeCompare(a.end_date)).map(event=><div key={event.tournament_id} className="pick-record-event" data-record-event={event.tournament_id}>
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