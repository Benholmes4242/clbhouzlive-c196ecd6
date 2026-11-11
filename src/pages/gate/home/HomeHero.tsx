import { useEffect, useRef } from 'react';
import { Dotted, Phone, type Shot } from './Phone';
const FAN: Shot[] = ['club', 'scorecard', 'feed', 'course', 'explore'];
/** Scales the fan to the viewport exactly as the mock's fit(); recomputed on resize. */
function useFanFit() {
  const fan = useRef<HTMLDivElement>(null); const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => { const w = document.documentElement.clientWidth || window.innerWidth; if (!fan.current || !box.current || !w) return; const s = Math.min(1, (w - 8) / (w < 860 ? 600 : 1180));
      fan.current.style.transform = `scale(${s})`; fan.current.style.transformOrigin = 'top center'; fan.current.style.height = '470px'; box.current.style.height = `${470 * s}px`;
      fan.current.querySelectorAll<HTMLElement>('.p1,.p5').forEach(p => { p.style.display = w < 860 ? 'none' : ''; }); };
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);
  return { fan, box };
}
export function HomeHero({ head, headSoft, lede, badges, fine }: { head: string; headSoft?: string; lede: string; badges: React.ReactNode; fine: string }) {
  const { fan, box } = useFanFit();
  return <header className="hero"><div className="txt">
    <h1 className="disp">{headSoft ? <><span className="hl1">{head}</span> <span className="two"><Dotted text={headSoft}/></span></> : <Dotted text={head}/>}</h1>
    <p className="lede">{lede}</p>{badges}<p className="fine">{fine}</p></div>
    <div className="fanbox" ref={box}><div className="fan" ref={fan} data-hero-fan="">{FAN.map((shot, i) => <div key={shot} className={`ph p${i + 1}`}><Phone shot={shot} eager={i === 2}/></div>)}</div></div>
  </header>;
}
