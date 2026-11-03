/** Signed-off player hero: no fixed cinematic band; header season owns figures.
 * PlayerAvatar retains the shared candidate fallback; CSS only opts into this
 * hero's exact size and initials. Follow/pick never submit on page mount. */
import { useTranslation } from 'react-i18next';
import CollegeStamp from '@/components/profile/CollegeStamp';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { TourPlayer } from '../../hooks/useTourHubData';
import type { PlayerHeader, PlayerResult } from '../data/usePlayerData';
import { heroLine, heroFigures, playerTourLabel } from '../playerRules';
import { pronouns } from '../../components/overview-v3/HybridHeroBands/pickInsightRules';
import { PlayerLine } from './PlayerSection';
export interface HeroSectionProps { player: TourPlayer; header: PlayerHeader | null; results: PlayerResult[]; tour: string; race: number | null; following: boolean; busy: boolean; onFollow: () => void; onPick: () => void }
export function HeroSection({player,header,results,tour,race,following,busy,onFollow,onPick}:HeroSectionProps) {
  const {t}=useTranslation('tourhub'); const figures=heroFigures(results,header?.world_rank??null,race,tour);
  const copy=(key:string,opts:Record<string,unknown>={})=>t(`player.v3.${key}`,opts);
  const nextDate=header?.next_tee_time?new Date(header.next_tee_time):null;
  const nextTime=nextDate&&!Number.isNaN(nextDate.getTime()) ? new Intl.DateTimeFormat('en-GB',{weekday:'long',hour:'2-digit',minute:'2-digit',hour12:false}).format(nextDate).replace(' at ', ' ').replace(',', ''):null;
  return <section className="pv-hero" data-player-hero>
    <div className="pv-top"><div className="pv-identity"><div className="pv-kicker"><span>{playerTourLabel(tour)}</span>
      {player.country&&<><i aria-hidden/><span className="pv-country"><span>{countryCodeToFlag(player.country_code||player.country)}</span>{titleCaseCountry(player.country)}</span></>}
      {player.college&&<><i aria-hidden/><CollegeStamp normalizedName={player.college_normalized??''} fallbackName={player.college} variant="player" tone="dark" onActivate={mode=>void analyticsEvents.track('tour_player_college_stamp_activated',{player_id:player.id,college:player.college,college_slug:player.college_normalized,mode})}/></>}
    </div><h1 className="pv-name">{player.full_name}</h1></div><div className="pv-photo"><PlayerAvatar playerId={player.id} playerName={player.full_name} tourCode={tour} photoUrl={player.photo_url} headshotOverride={player.headshot_override} size={118} ringColor="var(--pick-rule)" surface="canvas" imagePosition="50% 15%"/></div></div>
    <PlayerLine className="pv-line" line={heroLine(results,header?.world_rank??null,race,tour)}/>
    {figures.length>0&&<div className="pv-figs num" style={{gridTemplateColumns:`repeat(${figures.length},1fr)`}}>{figures.map(f=><div key={f.key} data-player-figure={f.key}><b>{f.value}</b><span>{copy(`figures.${f.key}`,{label:f.label})}</span></div>)}</div>}
    {header?.next_tournament_id&&<div className="pv-next" data-next-start><div><small>{copy('next.kicker')}</small><b>{header.next_name}</b>{nextTime&&<span>{copy('next.tees',{time:nextTime})}</span>}</div><Button variant="ghost" className="pv-pick" onClick={onPick}>{copy('next.pick',{object:pronouns(tour).object})}</Button></div>}
    <div className="pv-actions"><Button variant="ghost" className="pv-pill" data-following={following} disabled={busy} onClick={onFollow}>{copy(following?'following':'follow')}</Button></div>
  </section>;
}
