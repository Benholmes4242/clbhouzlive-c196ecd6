import '@/index.css';
import '@/features/tourhub/leaderboard/leaderboard.css';
import '@/features/tourhub/overview/sections/alsoWeek.css';
import { createRoot } from 'react-dom/client';
import { HoleMarks, HoleMarksKey, MARK_SURFACE_MINE } from '@/features/tourhub/leaderboard/BoardRound';
import { HERO_PAD_X } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import RoundTilePlot from '@/components/feed/roundTilePlot';
import { PAGE_CANVAS, FEED_CARD_SURFACE } from '@/lib/tokens/surfaces';
const pars=[4,4,3,5,4,4,3,4,5,4,3,4,5,4,4,3,5,4];
const lb=[4,6,3,8,3,4,2,4,5,5,3,4,7,4,4,3,4,null].map((s,i)=>({strokes:s,par:pars[i]}));
function shape(n:number){const holes=pars.slice(0,n).map((p,i)=>({holeNo:i+1,par:p,strokes:[p,p+2,p-1,p+3,p,p+1,p-2,p,p-1][i%9],sheetStrokes:null}));let c=0;const series=[0,...holes.map(h=>(c+=h.strokes-h.par))];return {coursePar:holes.reduce((a,h)=>a+h.par,0),series,beads:[],played:n,birdies:0,holes};}
const Lbl=({t}:{t:string})=><div style={{color:'#94A3B8',font:'600 11px system-ui',padding:'14px 16px 4px'}}>{t}</div>;
createRoot(document.getElementById('root')!).render(<div>
 <Lbl t="Leaderboard row (double H2, triple H4)"/>
 <div id="lb" style={{background:'var(--tour-board-canvas)',padding:'8px 16px'}}><HoleMarks holes={lb}/></div>
 <div style={{background:'var(--tour-board-canvas)',paddingBottom:8}}><HoleMarksKey/></div>
 <Lbl t="Hero board row"/>
 <div id="hero" style={{background:PAGE_CANVAS,padding:`8px ${HERO_PAD_X}px`}}><HoleMarks holes={lb} surface={PAGE_CANVAS}/></div>
 <Lbl t="Also this week row (mine)"/>
 <div id="week" style={{background:MARK_SURFACE_MINE,padding:'8px 20px'}}><HoleMarks holes={lb} surface={MARK_SURFACE_MINE}/></div>
 <Lbl t="Clubhouse plot 18"/>
 <div id="p18" style={{background:FEED_CARD_SURFACE,margin:'0 12px'}}><RoundTilePlot shape={shape(18) as any}/></div>
 <Lbl t="Clubhouse plot 9"/>
 <div id="p9" style={{background:FEED_CARD_SURFACE,margin:'0 12px'}}><RoundTilePlot shape={shape(9) as any}/></div>
</div>);
