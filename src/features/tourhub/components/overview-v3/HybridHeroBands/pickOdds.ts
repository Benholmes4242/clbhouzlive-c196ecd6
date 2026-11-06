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