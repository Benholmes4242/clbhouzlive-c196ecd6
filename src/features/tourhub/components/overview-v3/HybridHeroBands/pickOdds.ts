/** Odds against count misses per win; blind baselines come from the server's
 * event-weighted percentage, never an inferred average field size. */
export function recordOdds(wins:number,events:number):string {
  const misses=events-wins;
  if(wins<=0 || misses<=0) return '—';
  if(misses===wins) return 'Evens';
  let a=misses,b=wins;
  while(b){const next=a%b;a=b;b=next;}
  return `${misses/a}/${wins/a}`;
}
export function blindOdds(percent:number|null|undefined):{n:number;odds:string}|null {
  if(percent==null || !Number.isFinite(percent) || percent<=0) return null;
  const n=Math.round(100/percent);
  return {n,odds:`${n-1}/1`};
}
export const winPercent=(wins:number,events:number)=>events>0?wins/events*100:0;
export const percentText=(percent:number,blind=false)=>blind&&percent<.5?'<1%':`${Math.round(percent)}%`;
export const barPercent=(percent:number)=>Math.max(1,percent);
/* PK3: top-10 and winner comparison against blind picks. Our and viewer rows
 * show counts only; odds appear on blind rows alone. */
export function blindTop10(field:number,picks:number):number|null {
  if(!Number.isFinite(field)||field<=0||picks<=0) return null;
  if(field<=10) return 100;
  let miss=1;
  for(let i=0;i<picks;i++) miss*=Math.max(0,field-10-i)/(field-i);
  return 100*(1-miss);
}
export function averageBlindTop10(events:{field_size?:number|null;picks:unknown[]}[]):number|null {
  const values=events.flatMap(e=>e.field_size!=null?[blindTop10(e.field_size,e.picks.length)]:[]).filter((v):v is number=>v!=null);
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
export const viewerBlindTop10=(winPct:number|null|undefined)=>winPct==null||!Number.isFinite(winPct)||winPct<=0?null:Math.min(100,10*winPct);
export const rateOf=(count:number,events:number)=>events>0?count/events*100:0;
export function multipleOf(count:number,rate:number,blind:number|null|undefined):number|null {
  if(count<=0||blind==null||!Number.isFinite(blind)||blind<=0) return null;
  const x=Math.round(rate/blind);
  return x>=2?x:null;
}
export const aboutOneIn=(blind:number)=>Math.round(100/blind);
export const winnerOddsText=(blind:number)=>`${Math.round(100/blind)-1}/1`;
