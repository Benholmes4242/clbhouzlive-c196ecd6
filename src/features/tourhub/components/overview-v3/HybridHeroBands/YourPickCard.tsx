/** Viewer card never invents board data. Server pick state owns availability;
 * comparison excludes eliminated picks and never repeats the 'one of ours' prefix. */
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../../PlayerAvatar';
import type { TournamentPickState } from '../../../hooks/useTournamentPick';
import type { PickResult } from './pickInsightRules';
import { compareLivePick, compareFinishedPick, resultPosition, outStatus } from './pickInsightRules';
import { localPickLock } from './yourPickRules';
import type { TournamentCircleRank } from '../../../hooks/useTournamentCircleRank';
import { liveCircleHeading, liveOurLine, finishedOurHeading, finishedCircleLine } from './integratedPickRules';
import { surnameOf } from '../../../_shared/playerName';
import { fmtScore } from '../../../utils/fmtScore';
import './pickPanels.css';
export interface YourPickCardProps { state: TournamentPickState | null; phase:'upcoming'|'live'|'completed'; ourResults:PickResult[]; tourCode:string; onPick:()=>void; teeTime?:string | null; started?:boolean; guest?:boolean; circleRank?:TournamentCircleRank|null }
export function YourPickCard({state,phase,ourResults,tourCode,onPick,teeTime,started=true,guest=false,circleRank=null}:YourPickCardProps) {
  const { t } = useTranslation('tourhub');
  const copy=(key:string,options:Record<string,unknown>={})=>t(`overview.yourPick.${key}`,options);
  const hasPick=!guest && Boolean(state?.my_player_id && state.my_still_in_field!==false);
  if (!hasPick && (state?.locked || phase!=='upcoming')) return null;
  if (!state && !guest) return null;
  const name=state?.my_player_name ?? '';
  const lock=localPickLock(state?.locks_at ?? null);
  const mine:PickResult={playerId:state?.my_player_id ?? '',playerName:name,position:state?.my_position ?? null,tied:state?.my_tied,score:state?.my_score,status:state?.my_status};
  const status=outStatus(mine.status);
  let sub='';
  if (!hasPick) sub='';
  else if (phase==='upcoming') { const tee=localPickLock(teeTime ?? null); sub=tee ? copy('sectionTee',tee) : ''; }
  else if (status) sub=copy(['CUT','MC'].includes(mine.status?.toUpperCase() ?? '') ? 'missedCut' : 'withdrew');
  else if (phase==='live' && !started) sub=teeTime ? copy('teesOff',{time:localPickLock(teeTime)?.time ?? ''}) : '';
  else if (phase==='live') sub=compareLivePick(mine,ourResults);
  else sub=state?.my_percentile!=null ? copy('beatField',{value:state.my_percentile}) : '';
  const heading=!hasPick ? copy('winnerQuestion') : phase==='upcoming' ? copy('pickedHeading') : phase==='live' ? liveCircleHeading(circleRank,copy) : finishedOurHeading(mine,ourResults,copy);
  const line=!hasPick ? (guest ? lock ? copy('guestWinnerLine',lock) : copy('guestWinnerLineNoTime') : lock ? copy('winnerLine',lock) : copy('winnerLineNoTime')) : phase==='upcoming' ? (lock ? copy('pickedLine',lock) : copy('pickedLineNoTime')) : phase==='live' ? liveOurLine(mine,ourResults,copy) : state ? finishedCircleLine(circleRank,state,copy) : '';
  const best=state?.followed_best;
  const circleLine=phase==='completed' ? '' : phase==='upcoming' && (state?.followed_pickers ?? 0)>0 ? copy('circlePicked',{count:state?.followed_pickers,name:surnameOf(state?.followed_top[0]?.player_name ?? '')}) : phase==='live' && best ? copy('circleBest',{name:surnameOf(best.player_name),position:resultPosition({playerId:best.player_id??'',playerName:best.player_name,position:best.position,tied:best.tied})}) : '';
  return <div className="pick-mine" data-your-pick-card>
    {heading && <div className="pick-mine-heading" data-pick-question>{heading}</div>}
    {line && <div className="pick-mine-how" data-pick-how>{line}</div>}
    <div className="pick-mine-row">
      {hasPick ? <span className="pick-mine-face"><PlayerAvatar playerId={mine.playerId} playerName={name} tourCode={tourCode} size={36} className="pick-mine-avatar"/></span> : <span className="pick-mine-placeholder"><Plus size={18}/></span>}
      <div className="pick-mine-text"><div className="pick-mine-label">{copy('kicker')}</div><div className="pick-mine-name">{hasPick ? name : state?.my_player_id ? copy('withdrawnBefore',{name}) : copy('noPickYet')}</div>{sub && <div className="pick-mine-sub">{sub}</div>}</div>
      {!hasPick ? <Button variant={null} size={null} className="pick-mine-action" onClick={onPick}>{copy('pickAction')}</Button> : phase==='upcoming' && !state?.locked ? <Button variant={null} size={null} className="pick-mine-change" onClick={onPick}>{copy('changeAction')}</Button> : (status || started || phase==='completed') && <div className="pick-mine-figure tabular-nums"><span className={status ? 'pick-panel-dim':''}>{resultPosition(mine)}</span>{!status && mine.score!=null && <> <span className={mine.score<0 ? 'pick-panel-under':''}>{fmtScore(mine.score)}</span></>}{phase==='live' && !status && state?.my_thru!=null && <small>{state.my_thru>=18 ? 'F' : copy('thru',{count:state.my_thru})}</small>}</div>}
    </div>
    {circleLine && <div className="pick-follow-line" data-followed-picks><span className="pick-follow-stack">{state?.followed_top.slice(0,3).map(top=><span key={top.player_id}><PlayerAvatar playerId={top.player_id} playerName={top.player_name} tourCode={tourCode} size={18}/></span>)}</span><span>{circleLine}</span></div>}
  </div>;
}