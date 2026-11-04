import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PlayerAvatar } from '../../PlayerAvatar';
import type { PickFieldPlayer, TournamentPicksBoardRow } from '../../../hooks/useTournamentPick';
import { groupTournamentPicks, pickMemberName, PICKS_VISIBLE_MEMBERS } from './picksBoardRules';

export function TournamentPicksBoard({ rows, field, ourPicks, tourCode, pending, failed, retry }: {
  rows: TournamentPicksBoardRow[]; field: PickFieldPlayer[]; ourPicks: {playerId:string}[]; tourCode:string;
  pending:boolean; failed:boolean; retry:()=>void;
}) {
  const {t}=useTranslation('tourhub');
  const copy=(key:string,opts:Record<string,unknown>={})=>t(`overview.yourPick.${key}`,opts);
  const [expanded,setExpanded]=useState<Set<string>>(new Set());
  if (pending) return <div className="your-pick-empty" role="status">{copy('boardLoading')}</div>;
  if (failed) return <div className="your-pick-empty" role="alert">{copy('boardError')}<Button variant="ghost" onClick={retry}>{copy('retry')}</Button></div>;
  return <div data-picks-board>
    <div className="your-pick-heading"><span>{copy('whoHeading')}</span><small>{copy('membersSoFar',{count:rows.length})}</small></div>
    {rows.length===0 ? <div className="your-pick-empty">{copy('noPicks')}</div> : groupTournamentPicks(rows).map(group=>{
      const open=expanded.has(group.playerId), player=field.find(p=>p.player_id===group.playerId), rank=ourPicks.findIndex(p=>p.playerId===group.playerId);
      return <section key={group.playerId} className="your-pick-group" data-pick-group={group.playerId}>
        <div className="your-pick-group-head"><PlayerAvatar playerId={group.playerId} playerName={group.playerName} tourCode={tourCode} photoUrl={player?.photo_url} headshotOverride={player?.headshot_override} size={28}/>
          <span className="your-pick-group-name">{group.playerName}</span>{rank>=0&&<span className="your-pick-tag">{copy('ourPick',{rank:rank+1})}</span>}<b className="your-pick-group-count tabular-nums">{group.members.length}</b></div>
        <div className="your-pick-group-members">{group.members.slice(0,open?undefined:PICKS_VISIBLE_MEMBERS).map(member=>{
          const name=pickMemberName(member);
          return <div key={member.user_id} className="your-pick-member" data-member-id={member.user_id} data-viewer={member.is_viewer}>
            <SquircleAvatar size={20} src={member.profile_photo_url} userId={member.user_id} alt={name} fallback={name.split(/\s+/).map(w=>w[0]).join('').slice(0,2)} hairlineRing/><span>{member.is_viewer?copy('you'):name}</span>
          </div>;
        })}</div>
        {group.members.length>PICKS_VISIBLE_MEMBERS&&<Button variant={null} size={null} className="your-pick-show-all" aria-expanded={open} onClick={()=>setExpanded(current=>{const next=new Set(current);if(open)next.delete(group.playerId);else next.add(group.playerId);return next;})}>{open?copy('showFewer'):copy('showAll',{count:group.members.length})}</Button>}
      </section>;
    })}
  </div>;
}