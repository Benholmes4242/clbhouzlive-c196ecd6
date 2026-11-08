/** One glance renderer for tournament and overview. Default markup/classes
 * and 70px maximum bars reproduce the tournament exactly; overview opts into
 * its smaller strip. Facts remain glanceFacts over the existing hole RPC. */
import { copy, glanceFacts, type CourseHole } from '../data/tournamentRules';
export function CourseGlance({ holes, overview = false }: { holes: CourseHole[]; overview?: boolean }) {
  const glance = glanceFacts(holes);
  if (!glance) return null;
  const max = Math.max(...holes.map(h => h.yards));
  return <>
    <p className="tv-lead">{glance.parts.map((part, i) => part.bold ? <b key={i}>{part.text}</b> : <span key={i}>{part.text}</span>)}</p>
    <div className="tv-strip">{[...holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => <div key={hole.hole_no}><i data-par={hole.par} style={{ height: Math.round(hole.yards / max * (overview ? 54 : 70)) }} /><span>{hole.hole_no}</span></div>)}</div>
    <div className="tv-strip-key">{[3, 4, 5].map(par => <span key={par}><i data-par={par} />{copy('par', { n: par })}</span>)}<span>{copy('barYards')}</span></div>
  </>;
}