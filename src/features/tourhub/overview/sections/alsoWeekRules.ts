/** AlsoThisWeek owns event presentation only. Scoring/ties remain canonical board rules. */
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { leaderSummary } from '../../leaderboard/leaderboardRules';
import { deriveHeroState } from '../../components/overview-v3/HybridHero.utils';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { surnameOf } from '../../_shared/playerName';

export function weekTotalRounds(slide: HeroSlide): number | null {
  const { startDate, endDate } = slide.tournament;
  if (!startDate || !endDate) return null;
  const span = (Date.parse(endDate.slice(0,10)) - Date.parse(startDate.slice(0,10))) / 86400000 + 1;
  if (!Number.isFinite(span) || span < 2 || span > 4) return null;
  const state = deriveHeroState(slide.tournament);
  return state.kind === 'live' || state.kind === 'suspended' ? state.totalRounds : span;
}
export function startedRound(e: BoardEntry, round: number | null) {
  return todayFromEntry(e, round) != null;
}
export function onCourse(entries: BoardEntry[], round: number | null) {
  return entries.filter(e => startedRound(e,round) && e.thru != null && e.thru > 0 && e.thru < 18).length;
}
export function situation(entries: BoardEntry[], round: number | null, total: number | null) {
  const summary = leaderSummary(entries);
  if (!summary || !entries.some(e => startedRound(e,round))) return null;
  const tied = entries.filter(e => e.score === summary.leader.score);
  const values = { name:surnameOf(summary.leader.player?.full_name ?? ''), other:surnameOf(tied[1]?.player?.full_name ?? ''), count:summary.count, margin:summary.lead, score:summary.leader.score, round };
  if (summary.count > 1) return { key:summary.count === 2 ? 'shareTwo' : 'shareMany', values };
  if (summary.lead == null) return null;
  if (!startedRound(summary.leader,round)) return {key:'goingInto',values};
  if (round === total && (summary.leader.thru ?? 0) >= 18) return {key:'inAt',values};
  if (round == null || total == null || summary.leader.thru == null) return {key:'leads',values};
  const holes = (total-round)*18 + Math.max(0,18-summary.leader.thru);
  return {key:round === total ? 'finalPlay' : 'holesPlay',values:{...values,holes}};
}
export function chasePlayers(entries: BoardEntry[], followed: Set<string>) {
  const leader = leaderSummary(entries)?.leader.score;
  if (leader == null) return [];
  return Array.from({length:7},(_,back) => {
    const group = entries.filter(e => e.score != null && e.score-leader === back);
    const mine = group.filter(e => e.player?.id && followed.has(e.player.id));
    const ordinary = group.filter(e => !e.player?.id || !followed.has(e.player.id));
    return [...ordinary.slice(0,Math.max(0,4-mine.length)),...mine].slice(-4).map((entry,stack)=>({entry,back,stack,mine:!!entry.player?.id && followed.has(entry.player.id)}));
  }).flat();
}
export function weekRows(entries: BoardEntry[], followed: Set<string>) {
  const sorted = [...entries].sort((a,b)=>(a.position ?? Infinity)-(b.position ?? Infinity));
  const top = sorted.filter(e => e.position != null && e.position >= 1 && e.position <= 3).slice(0,5);
  const extra = sorted.filter(e => e.player?.id && followed.has(e.player.id) && !top.some(t=>t.id===e.id)).slice(0,2);
  return {top,extra};
}
export function startsValues(date: string, tee: string | null, locale='en') {
  const start = new Date(tee ?? date);
  if (Number.isNaN(start.getTime())) return null;
  return {day:new Intl.DateTimeFormat(locale,{weekday:'short'}).format(start).toUpperCase(),time:tee ? new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false}).format(start) : null};
}
export function weekFacts(field: number | null, purse: number | null, currency: string | null, defending: string | null) {
  const facts:{key:string;value:string}[]=[];
  if (field != null && field > 0) facts.push({key:'field',value:String(field)});
  if (purse != null && currency) facts.push({key:'purse',value:new Intl.NumberFormat('en',{style:'currency',currency,notation:'compact',maximumFractionDigits:1}).format(purse).replace('M','m').replace('K','k')});
  if (defending) facts.push({key:'defending',value:surnameOf(defending)});
  return facts;
}