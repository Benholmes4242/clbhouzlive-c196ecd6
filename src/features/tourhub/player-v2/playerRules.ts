/** Player-only arithmetic uses display_position/is_winner, never raw finish 1.
 * Hole rates are RPC fractions; hole mix belongs to the player, not the viewer.
 * Copy selectors reuse canonical picks words/ordinals/pronouns and stat helpers. */
import { ordinal, rankWord, wordNumber, pronouns, FIT_STATS, type FitKey } from '../components/overview-v3/HybridHeroBands/pickInsightRules';
import { fullTourLabel, mapTourSlug } from '../_shared/tourOrder';
import { isAnyMajor } from '../utils/majorScope';
import { countryToIso2, titleCaseCountry } from '../utils/countryFlags';
import type { PlayerHeader, PlayerResult, PlayerHoles, PlayerStat, PlayerPickHistory } from './data/usePlayerData';
import type { MyScoring, TourAverages } from '../players-v2/you/youAndTourRules';
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const numberWord = (n: number) => wordNumber(n);
export const displayRank = (position: string) => /^T?\d+$/.test(position) ? Number(position.replace('T', '')) : null;
export const finishWord = (position: string) => displayRank(position) == null ? position === 'MC' ? 'a missed cut' : position === 'WD' ? 'a withdrawal' : position : `${position.startsWith('T') ? 'joint ' : ''}${rankWord(Number(position.replace('T', '')))}`;
export const newest = <T extends { end_date: string }>(rows: T[]) => [...rows].sort((a,b) => b.end_date.localeCompare(a.end_date));
export const bestFinish = (rows: PlayerResult[]) => newest(rows).filter(r => displayRank(r.display_position) != null).sort((a,b) => Number(displayRank(a.display_position))-Number(displayRank(b.display_position)))[0] ?? null;
export const scoreText = (n: number) => n === 0 ? 'E' : `${n < 0 ? '−' : '+'}${Math.abs(n)}`;
export const signed = (n: number, decimals = 2) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toFixed(decimals)}`;
export const tourFor = (header: PlayerHeader | null, codes?: string[] | null) => mapTourSlug(header?.main_tour || codes?.[0]);
export const playerTourLabel = (tour: string) => tour === 'lpga' ? 'LPGA' : fullTourLabel(tour);
export const raceLabels: Record<string, string> = { pga:'Points', euro:'Race to Dubai', lpga:'CME Points', pgad:'Korn Ferry Points', liv:'LIV Points', champ:'Points' };
export function whenEnded(iso: string, now = new Date()) {
  const date = new Date(iso); if (Number.isNaN(date.getTime())) return '';
  const age = now.getTime()-date.getTime();
  if (age >= 0 && age < 7*86400_000) return `on ${new Intl.DateTimeFormat('en-GB',{weekday:'long'}).format(date)}`;
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) return 'this month';
  const previous = new Date(now.getFullYear(), now.getMonth()-1, 1);
  if (date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth()) return 'last month';
  return `in ${new Intl.DateTimeFormat('en-GB',{month:'long'}).format(date)}`;
}
export interface CopyLine { bold: string; rest: string }
export function heroLine(rows: PlayerResult[], world: number | null, race: number | null, tour: string, now = new Date()): CopyLine | null {
  const starts = rows.length; const best = bestFinish(rows); if (!starts || !best) return null;
  const wins = rows.filter(r=>r.is_winner).length;
  const top10 = rows.filter(r=>{const n=displayRank(r.display_position);return n != null && n<=10;}).length;
  const finish = `${finishWord(best.display_position)} at the ${best.name} ${whenEnded(best.end_date,now)}.`;
  if (starts < 3) return { bold: `${cap(wordNumber(starts))} ${starts===1 ? 'start' : 'starts'} this season`, rest: `: ${finish}` };
  if (wins) {
    const beats = rows.flatMap(r=>typeof r.beat_percent==='number' ? [r.beat_percent] : []);
    return { bold:world != null && world<=50 ? `World no. ${world}.` : '', rest:`${cap(wordNumber(wins))} ${wins===1?'win':'wins'} and ${wordNumber(top10)} top 10s from ${wordNumber(starts)} starts this season${beats.length ? `, and ${pronouns(tour).subject.toLowerCase()} beat ${Math.round(beats.reduce((a,b)=>a+b,0)/beats.length)}% of the field on average` : ''}.` };
  }
  return { bold:'No wins yet this season.', rest:`${race ? `${cap(rankWord(race))} in the ${raceLabels[tour] ?? 'points standings'}, with ` : ''}${race ? wordNumber(top10) : cap(wordNumber(top10))} top 10s from ${wordNumber(starts)} starts, and ${finish}` };
}
export interface Figure { key: string; value: string; label: string }
export function heroFigures(rows: PlayerResult[], world: number | null, race: number | null, tour: string): Figure[] {
  if (!rows.length) return [];
  const top10=rows.filter(r=>{const n=displayRank(r.display_position); return n!=null&&n<=10;}).length;
  const best=bestFinish(rows); const wins=rows.filter(r=>r.is_winner).length;
  const starts={key:'starts',value:String(rows.length),label:'STARTS'}; const top={key:'top10',value:String(top10),label:'TOP 10s'};
  const bestCell=best ? {key:'best',value:best.display_position,label:'BEST'} : null;
  if(rows.length<3) return [starts,...(bestCell?[bestCell]:[]),top];
  return [...(world && world>0 ? [{key:'world',value:String(world),label:'WORLD'}] : []),...(race && race>0 ? [{key:'points',value:ordinal(race),label:(raceLabels[tour]??'Points').toUpperCase()}] : []),wins ? {key:'wins',value:String(wins),label:'WINS'} : starts,top,{key:'cuts',value:String(rows.filter(r=>displayRank(r.display_position)!=null).length),label:'CUTS MADE'},...(bestCell?[bestCell]:[])].slice(0,4);
}
export function orderedStats(rows: PlayerStat[]) { return FIT_STATS.flatMap(key=> {const r=rows.find(r=>r.stat===key);return r?[r]:[];}); }
export const statKey = (s: PlayerStat) => s.stat as FitKey;
export const HOLE_NUMBERS = [3,4,5] as const;
export const holeValue = (r: MyScoring | TourAverages, n: 3|4|5) => r[`par${n}`];
export const mix = (r: MyScoring,n:3|4|5) => r.rounds ? r[`holes_par${n}`]/r.rounds : 0;
export function holeGains(him: PlayerHoles, tour: TourAverages) { return HOLE_NUMBERS.map(n=>({n,gain:(holeValue(him,n)-holeValue(tour,n))*mix(him,n)})); }
export function holeCallout(him: PlayerHoles, tour: TourAverages, code: string): CopyLine {
  const p=pronouns(code), gains=holeGains(him,tour), total=gains.reduce((s,r)=>s+r.gain,0);
  const strongest=[...gains].sort((a,b)=>a.gain-b.gain)[0]; const weakest=[...gains].sort((a,b)=>b.gain-a.gain)[0];
  const row=total<=0 ? strongest : weakest;
  if (!row) return {bold:'',rest:''};
  const all=total<0&&row.gain/total>=.75;
  const amount=Math.abs(row.gain); const half=all&&amount>=.4&&amount<=.6;
  const others=gains.filter(r=>r.n!==row.n);
  return {bold:total<=0 ? `${all?'Nearly all':'Most'} of ${p.possessive.toLowerCase()} edge comes on par ${row.n}s` : `${p.subject} gives shots back on par ${row.n}s`,rest:`${total<=0 ? ', ' : ', '}${half?'about half a shot':`${amount.toFixed(1)} shots`}${total<=0?' a round on the tour.':' a round.'}${all&&others.every(r=>Math.abs(r.gain)<=.1) ? ` On par ${others[0].n}s and par ${others[1].n}s ${p.subject.toLowerCase()} scores like the tour does.`:''} And ${p.subject.toLowerCase()} drops a shot on ${(him.bogey_rate*100).toFixed(1)}% of holes; the tour drops one on ${(tour.bogey_rate*100).toFixed(1)}%.`};
}
export function youAgainst(mine: MyScoring, him: PlayerHoles) {
  const rows=HOLE_NUMBERS.map(n=>({n,gap:(holeValue(mine,n)-holeValue(him,n))*mix(him,n),holes:Math.round(mix(him,n))}));
  return {rows,total:rows.reduce((s,r)=>s+r.gap,0),widest:[...rows].sort((a,b)=>Math.abs(holeValue(mine,b.n)-holeValue(him,b.n))-Math.abs(holeValue(mine,a.n)-holeValue(him,a.n)))[0]};
}
export function roundAnalysis(results: PlayerResult[]) {
  const rounds=newest(results).flatMap(r=>[1,2,3,4].flatMap(n=> {const score=r[`round_${n}` as 'round_1'];return typeof score==='number' ? [{n,score,result:r}] : [];}));
  const averages=[1,2,3,4].map(n=>{const rs=rounds.filter(r=>r.n===n);return rs.length ? rs.reduce((s,r)=>s+r.score,0)/rs.length : null;});
  const present=averages.flatMap((value,index)=>value==null?[]:[{value,index}]);
  return {averages,lowest:[...present].sort((a,b)=>a.value-b.value)[0]?.index??null,best:[...rounds].sort((a,b)=>a.score-b.score||b.result.end_date.localeCompare(a.result.end_date)||a.n-b.n).slice(0,3)};
}
export function roundLead(averages:(number|null)[],tour:string): CopyLine | null {
  const entries=averages.flatMap((v,i)=>v==null?[]:[{v,i}]); const lowest=[...entries].sort((a,b)=>a.v-b.v)[0];
  if(!lowest) return null; const p=pronouns(tour); const v=(n:number|null)=>n==null?null:`${Math.abs(n).toFixed(1)} ${n<=0?'under':'over'}`;
  const first=v(averages[0]),last=v(averages[3]);
  return {bold:lowest.i===3 ? `${p.subject} gets better as the week goes on` : lowest.i===0 ? `${p.subject} starts fast` : `${p.possessive} best golf comes in the middle of the week`,rest:`: ${lowest.i===0||lowest.i===3 ? first ? `${first} on Thursdays` : `${v(lowest.v)} in fourth rounds` : `${v(lowest.v)} in ${lowest.i===1?'second':'third'} rounds`}${last?`, ${last} on Sundays`:''}.`};
}
export function majorsLine(rows: PlayerResult[]): string {
  const majors=rows.filter(r=>isAnyMajor(r.name)),best=bestFinish(majors); if(!majors.length) return '';
  const top5=majors.filter(r=>{const n=displayRank(r.display_position);return n!=null&&n<=5;}); const threshold=top5.length?5:10;
  const top=majors.filter(r=>{const n=displayRank(r.display_position);return n!=null&&n<=threshold;});
  if(top.length&&best) return `${cap(wordNumber(top.length))} top ${threshold}s from ${wordNumber(majors.length)} majors, and ${finishWord(best.display_position)} at the ${majorShortName(best.name)}.`;
  return `${cap(wordNumber(majors.length))} ${majors.length===1?'major':'majors'} this season: ${majors.map(r=>`${r.display_position==='MC'?'a missed cut':r.display_position} at the ${majorShortName(r.name)}`).join(' and ')}.`;
}
export function majorShortName(name:string) { const lower=name.toLowerCase();return lower.includes('masters')?'Masters':lower.includes('pga')?'PGA':lower.includes('u.s.')?'U.S. Open':lower.includes('the open')?'The Open':name; }
export function pickHistoryLine(history:PlayerPickHistory,tour:string):CopyLine {
  const p=pronouns(tour),rows=newest(history.picks),count=rows.length,wins=rows.filter(r=>r.won).length;
  const best=[...rows].filter(r=>displayRank(r.position)!=null).sort((a,b)=>Number(displayRank(a.position))-Number(displayRank(b.position)))[0];
  return {bold:count===1?'once':count===2?'twice':`${wordNumber(count)} times`,rest:wins ? `${p.subject} won ${wins===1?'one':wordNumber(wins)} of them.` : best?`${p.possessive} best finish for us: ${best.position} at the ${best.name}.`:''};
}
const STATES:Record<string,string>={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia'};
export function cleanPlace(place:string|null,country:string|null):string|null {
  if(!place) return null; const parts=[...new Map(place.split(',').map(s=>s.trim()).filter(Boolean).map(s=>[s.toUpperCase(),s])).values()]; if(!parts.length)return null;
  const iso=countryToIso2(parts.at(-1)??'')||countryToIso2(country??'');
  if(iso==='US') {const state=parts.slice(1).find(p=>STATES[p.toUpperCase()]||Object.values(STATES).some(s=>s.toUpperCase()===p.toUpperCase()));return [parts[0],state?STATES[state.toUpperCase()]??state:null].filter(Boolean).join(', ');}
  const last=parts.at(-1)??''; const resolved=countryToIso2(last)?titleCaseCountry(last):country?titleCaseCountry(country):null;
  return [parts[0],resolved&&resolved.toUpperCase()!==parts[0].toUpperCase()?resolved:parts.length>1?parts[1]:null].filter(Boolean).join(', ');
}
export function sectionVisibility(starts:number,stats:PlayerStat[],holes:PlayerHoles|null,tour:TourAverages|null,mine:MyScoring|null,member:boolean) {
  const shots=!!(stats.length&&holes&&holes.rounds>=10&&tour&&tour.players>0);
  return {form:starts>=3,season:starts>=5,game:stats.length>0,shots,you:shots&&member&&!!mine&&mine.rounds>=5,rounds:starts>=3};
}