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
import { fmtScore } from '../../../utils/fmtScore';
import './pickPanels.css';
export interface YourPickCardProps { state: TournamentPickState | null; phase:'upcoming'|'live'|'completed'; ourResults:PickResult[]; tourCode:string; onPick:()=>void; teeTime?:string | null; started?:boolean; guest?:boolean }
export function YourPickCard({state,phase,ourResults,tourCode,onPick,teeTime,started=true,guest=false}:YourPickCardProps) {
  const { t } = useTranslation('tourhub');
  const copy=(key:string,options:Record<string,unknown>={})=>t(`overview.yourPick.${key}`,options);
  const hasPick=Boolean(state?.my_player_id && state.my_still_in_field!==false);
  if (!hasPick && (state?.locked || phase!=='upcoming') && !guest) return null;
  if (!state && !guest) return null;
  const name=state?.my_player_name ?? '';
  const lock=localPickLock(state?.locks_at ?? null);
  const mine:PickResult={playerId:state?.my_player_id ?? '',playerName:name,position:state?.my_position ?? null,tied:state?.my_tied,score:state?.my_score,status:state?.my_status};
  const status=outStatus(mine.status);
  let sub='';
  if (!hasPick) sub=lock ? copy(state?.my_player_id ? 'pickAgainBefore' : 'pickBefore',lock) : copy('pickBeforeNoTime');
  else if (phase==='upcoming') sub=copy('canChange');
  else if (status) sub=copy(['CUT','MC'].includes(mine.status?.toUpperCase() ?? '') ? 'missedCut' : 'withdrew');
  else if (phase==='live' && !started) sub=teeTime ? copy('teesOff',{time:localPickLock(teeTime)?.time ?? ''}) : '';
  else if (phase==='live') sub=compareLivePick(mine,ourResults);
  else sub=[state?.my_percentile!=null ? copy('beatField',{value:state.my_percentile}) : '',compareFinishedPick(mine,ourResults)].filter(Boolean).join(' ');
  return <div className="pick-mine" data-your-pick-card>
    {hasPick ? <span className="pick-mine-face"><PlayerAvatar playerId={mine.playerId} playerName={name} tourCode={tourCode} size={34}/></span> : <span className="pick-mine-placeholder"><Plus size={18}/></span>}
    <div className="pick-mine-text"><div className="pick-mine-label">{copy('kicker')}</div><div className="pick-mine-name">{hasPick ? name : state?.my_player_id ? copy('withdrawnBefore',{name}) : copy('whoWins')}</div>{sub && <div className="pick-mine-sub">{sub}</div>}</div>
    {!hasPick ? <Button variant="ghost" className="pick-mine-action" onClick={onPick}>{copy('pickAction')}</Button> : phase==='upcoming' && !state?.locked ? <Button variant="ghost" className="pick-mine-change" onClick={onPick}>{copy('changeAction')}</Button> : (status || started || phase==='completed') && <div className="pick-mine-figure tabular-nums"><span className={status ? 'pick-panel-muted':''}>{resultPosition(mine)}</span>{!status && mine.score!=null && <> <span className={mine.score<0 ? 'pick-panel-under':''}>{fmtScore(mine.score)}</span></>}{phase==='live' && !status && state?.my_thru!=null && <small>{state.my_thru>=18 ? 'F' : copy('thru',{count:state.my_thru})}</small>}</div>}
  </div>;
}