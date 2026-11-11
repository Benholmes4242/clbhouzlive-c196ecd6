import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './useWebHomeData';
import { Dotted, Phone, type Shot } from './Phone';
const STEPS: { title: string; body: string; shot: Shot }[] = [
  { title: 'Every round, worth talking about', shot: 'feed', body: 'Connect your handicap and your rounds post themselves, scored hole by hole. Add the photos and video from the day, and let your friends react, comment and try to beat it.' },
  { title: 'Golf creators, with the scores to back it up', shot: 'explore', body: 'Follow the golfers you like watching. Their videos sit on the course and hole they were filmed on, beside their real rounds.' },
  { title: 'Everyone in golf, on one app', shot: 'club', body: 'Follow your club, your coach and the brands you buy from, and find the people who play where you play.' },
  { title: 'Know every course before you play it', shot: 'course', body: 'Ratings, reviews and the Top 100 as golfers rank it, plus the hole that really costs the most shots.' },
];
/** Six-second auto-advance; clicks restart it; reduced motion and hidden tabs never advance. */
export function WhySection() {
  const [step, setStep] = useState(0); const [run, setRun] = useState(0);
  useEffect(() => { if (prefersReducedMotion()) return; const t = setTimeout(() => { if (document.hidden) setRun(r => r + 1); else setStep(s => (s + 1) % STEPS.length); }, 6000); return () => clearTimeout(t); }, [step, run]);
  return <section className="light why" id="why"><div className="wrap grid">
    <div className="whyphone"><Phone shot={STEPS[step].shot} style={{ width: 300, maxWidth: '100%' }}/></div>
    <div><h2 className="disp"><Dotted text="Why golfers use clbhouz."/></h2><div className="steps">{STEPS.map((s, i) => <button type="button" key={`${i}-${i === step ? run : 0}`} className={`step ${i === step ? 'on' : ''}`} aria-pressed={i === step} onClick={() => { setStep(i); setRun(r => r + 1); }}><span className="num">{i + 1}</span><span><h3>{s.title}</h3><span className="bar"/><p>{s.body}</p></span></button>)}</div></div>
  </div></section>;
}
