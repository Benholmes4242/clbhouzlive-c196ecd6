import { useEffect, useState } from 'react';
import { fmt, prefersReducedMotion, useWebPopular, useWebPopularCards, type WebFigures } from './useWebHomeData';
import { Dotted, PAUSE_ICON, PLAY_ICON } from './Phone';
const TRI = <svg width="11" height="10" viewBox="0 0 11 10" fill="currentColor" aria-hidden><path d="M5.5 0L11 10H0z"/></svg>;
function Figure({ n, label, delta }: { n: number; label: string; delta?: number | null }) {
  const d = Number(delta ?? 0);
  return <div><div className="fig n">{fmt(n, 'en-GB')}</div><div className="l">{label}</div>{d > 0 && <div className="dl on" data-web-delta="">{TRI}{fmt(d, 'en-GB')} <span>last 30 days</span></div>}</div>;
}
/** Quotes come only from popular course cards and are credited to the course, never a member. */
function Quotes() {
  const popular = useWebPopular(5); const cards = useWebPopularCards((popular.data ?? []).map(p => p.id));
  const quotes = cards.map(c => c.data).filter((c): c is NonNullable<typeof c> => !!c?.quote).map(c => ({ q: c.quote as string, n: c.name, a: c.area ?? '' }));
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || quotes.length < 2 || prefersReducedMotion()) return; const t = setInterval(() => { if (!document.hidden) setI(x => x + 1); }, 6000); return () => clearInterval(t); }, [paused, quotes.length]);
  if (!quotes.length) return null;
  const a = quotes[i % quotes.length]; const b = quotes[(i + 1) % quotes.length];
  return <div className="qblock" data-web-quotes=""><div className="qtop"><span className="sk" style={{ fontSize: 11 }}>What golfers say</span><button type="button" className="pause dk" style={{ margin: 0 }} aria-label={paused ? 'Play' : 'Pause'} onClick={() => setPaused(p => !p)}>{paused ? PLAY_ICON : PAUSE_ICON}</button></div>
    <div className="quote"><q>{a.q}</q><div className="who">{a.n}<span>{a.a}</span></div></div>
    {quotes.length > 1 && <div className="quote dimq"><q>{b.q}</q><div className="who">{b.n}<span>{b.a}</span></div></div>}</div>;
}
export function ProofSection({ figures }: { figures: WebFigures | null }) {
  const left = figures ? <div className="pblock" data-web-proof=""><h2 className="disp"><Dotted text="Live from the platform."/></h2><div className="pnums">
    <Figure n={figures.courses_total} label="Courses" delta={figures.courses_30d}/><Figure n={figures.rounds_total} label="Rounds shared" delta={figures.rounds_30d}/><Figure n={figures.holes_total} label="Holes played" delta={figures.holes_30d}/></div></div> : null;
  const right = <Quotes/>;
  return <section className="light proof"><div className={`wrap split ${left ? '' : 'single'}`}>{left}{right}</div></section>;
}
