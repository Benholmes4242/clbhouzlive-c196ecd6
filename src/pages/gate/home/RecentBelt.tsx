import { useState } from 'react';
import { useWebBeltNames, prefersReducedMotion } from './useWebHomeData';
import { Dotted, PAUSE_ICON, PLAY_ICON } from './Phone';
/** Recently on clbhouz: recent courses, else popular, else the section hides. */
export function RecentBelt() {
  const names = useWebBeltNames(); const [paused, setPaused] = useState(() => prefersReducedMotion());
  const list = names.data ?? []; if (!list.length) return null;
  const one = list.map((n, i) => <span key={i} style={{ display: 'contents' }}><span>{n}</span><i/></span>);
  return <section className="light marq" data-web-belt=""><div className="wrap"><h2 className="disp"><Dotted text="Recently on clbhouz."/></h2><p className="sub">The courses golfers have played in the last 30 days.</p></div>
    <div className={`belt ${paused ? 'paused' : ''}`}><div className="track">{[0, 1, 2].map(k => <span key={k} style={{ display: 'contents' }} aria-hidden={k > 0 || undefined}>{one}</span>)}</div></div>
    <button type="button" className="pause" aria-label={paused ? 'Play' : 'Pause'} onClick={() => setPaused(p => !p)}>{paused ? PLAY_ICON : PAUSE_ICON}</button></section>;
}
