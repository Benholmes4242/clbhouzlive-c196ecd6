/** Record is event-tour/season scoped; member benchmark and board read only the
 * viewer-keyed RPC. Public aggregates never stand in for member rows. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useOurPickRecord, useBeatTheModel } from '../../../hooks/usePickInsights';
import { sortedBeatRows, resultPosition, outStatus } from './pickInsightRules';
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
  const record = recordQuery.isError ? null : recordQuery.data;
  const members = boardQuery.isError ? [] : boardQuery.data ?? [];
  const viewer = members.find(row=>row.is_viewer && row.picks>0);
  const copy = (key: string, opts: Record<string,unknown> = {}) => t(`overview.pickRecord.${key}`, opts);
  const rows = record && members.some(row=>row.picks>0) ? sortedBeatRows(members,record) : [];
  const average = record?.avg_percentile;
  const labels = average == null ? [] : [{ key:'random', value:50, text:copy('random') }, { key:'us', value:average, text:copy('us', { value:average }) }, ...(viewer ? [{ key:'you', value:viewer.avg_percentile, text:copy('you', { value:viewer.avg_percentile }) }] )];
  const month = record?.first_event_date ? new Intl.DateTimeFormat('en-GB', { month:'long' }).format(new Date(record.first_event_date)) : null;
  return <BottomSheet open onClose={onClose} scrollBody topRadius={22} grabberPadding="8px 0 12px" ariaLabelledBy="pick-record-title">
    <div data-our-record-sheet className="text-[color:var(--pick-ink)] pb-6">
      <header className="pick-panel-header"><div className="pick-panel-kicker">{copy('kicker')}</div><h2 id="pick-record-title">{copy('title')}</h2>{month && <div className="pick-panel-sub">{copy('since', { month })}</div>}</header>
      {recordQuery.isError ? <div className="your-pick-empty" role="alert">{copy('error')}<Button variant="ghost" onClick={()=>void recordQuery.refetch()}>{copy('retry')}</Button></div> : !record ? <div className="your-pick-empty" role="status">{copy('loading')}</div> : <>
        <div className="pick-record-tours" aria-label={copy('tours')}>{TOURS.filter(code=>record.tours.includes(code)).map(code=><Button key={code} variant="ghost" className="pick-panel-chip" aria-pressed={selectedTour===code} onClick={()=>setTour(code)}>{TOUR_NAMES[code]}</Button>)}</div>
        <div className="pick-record-three tabular-nums">{(['picks','won','top10'] as const).map(key=><div key={key}><b>{record[key]}</b><span>{copy(key)}</span></div>)}</div>
        {average != null && <div className="pick-record-benchmark"><span>{copy('averageBefore')} <b>{copy('averageFigure', { value:average })}</b>. {copy('averageAfter')}</span>
          <div className="pick-record-track"><div className="pick-panel-fill" style={{ width:`${average}%` }} /><span className="pick-record-tick" />{viewer && <span data-viewer-dot className="pick-record-you" style={{ left:`${viewer.avg_percentile}%` }} />}</div>
          <div className="pick-record-labels">{labels.map((label,index)=>{
            const near = labels.slice(0,index).some(previous=>Math.abs(previous.value-label.value)<18);
            return <span key={label.key} data-viewer={label.key==='you' ? true : undefined} className={label.key==='random' ? 'pick-panel-dim' : ''} style={{ left:`${Math.max(12,Math.min(88,label.value))}%`, top:near ? 26 : 8 }}>{label.text}</span>;
          })}</div>
        </div>}
        {rows.length>0 && <section className="pick-panel-sec" data-beat-model><div className="pick-panel-label">{copy('beatTitle')}</div>
          <div className="pick-record-board-row pick-panel-muted"><span /><span /><span>{copy('picks')}</span><b>{copy('beat')}</b></div>
          {rows.map((row,index)=><div key={row.user_id} className="pick-record-board-row tabular-nums" data-viewer={row.is_viewer} data-beat-user={row.user_id}>
            <span>{index+1}</span><div className="pick-record-board-who">{row.is_model ? <span className="pick-record-mark">c</span> : <SquircleAvatar size={24} src={row.profile_photo_url} alt={row.display_name ?? row.username ?? ''} userId={row.user_id} hairlineRing />}
              <span>{row.is_viewer ? copy('youName') : row.display_name || row.username}</span></div><span>{row.picks}</span><b>{row.avg_percentile}%</b>
          </div>)}<div className="pick-panel-caption">{copy('beatCaption')}</div>
        </section>}
        <section className="pick-panel-sec"><div className="pick-panel-label">{copy('events')}</div>{[...record.events].sort((a,b)=>b.end_date.localeCompare(a.end_date)).map(event=><div key={event.tournament_id} className="pick-record-event" data-record-event={event.tournament_id}>
          <div className="pick-record-event-head"><b>{event.name}</b><small>{new Intl.DateTimeFormat('en-GB',{ day:'numeric',month:'short' }).format(new Date(event.end_date))}</small></div>
          <div className="pick-record-event-picks tabular-nums">{event.picks.map(pick=><div key={pick.player_id}><span>{surnameOf(pick.player_name)}</span><b data-result-tone={outStatus(pick.status) ? 'out' : pick.position===1 ? 'win' : pick.position != null && pick.position<=10 ? 'top10' : 'rest'} className={outStatus(pick.status) ? 'pick-panel-dim' : pick.position===1 ? 'pick-panel-win' : pick.position != null && pick.position<=10 ? '' : 'pick-panel-muted'}>{resultPosition({ playerId:pick.player_id, playerName:pick.player_name, ...pick })}</b></div>)}</div>
        </div>)}</section>
      </>}
    </div>
  </BottomSheet>;
}