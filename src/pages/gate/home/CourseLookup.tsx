import { useEffect, useMemo, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { courseArea, useWebCourseCard, useWebPopular, useWebPopularCards, useWebSearch } from './useWebHomeData';
import { WebCourseCard } from './WebCourseCard';
/** Popular five open on the first card with a read (else the featured card); search opens on its first hit.
 * React Query keys by query/id, so stale responses never replace the current selection. */
export function CourseLookup({ count }: { count: string | null }) {
  const [text, setText] = useState(''); const [query, setQuery] = useState(''); const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => { const timer = setTimeout(() => { const q = text.trim(); setQuery(q.length >= 2 ? q : ''); setChosen(null); }, 250); return () => clearTimeout(timer); }, [text]);
  const popular = useWebPopular(5); const pop = popular.data ?? [];
  const cards = useWebPopularCards(pop.map(p => p.id));
  const search = useWebSearch(query);
  const searching = query.length >= 2;
  const settled = cards.length > 0 && cards.every(c => !c.isPending);
  const autoPopular = useMemo(() => { if (!settled) return undefined; const k = cards.findIndex(c => c.data?.read_available); return k >= 0 ? pop[k].id : null; }, [settled, cards, pop]);
  const hits = searching ? search.data ?? [] : pop;
  const selected = chosen ?? (searching ? hits[0]?.id ?? null : autoPopular ?? null);
  const featured = useWebCourseCard(null, !searching && !chosen && autoPopular === null);
  const card = useWebCourseCard(selected, !!selected);
  const shown = selected ? card.data : (!searching && autoPopular === null ? featured.data : null);
  if (popular.isError || (!popular.isPending && !pop.length)) return null;
  const label = count ? `Search ${count} courses` : 'Search courses';
  return <section className="light look" id="look" data-web-lookup=""><div className="wrap">
    <h2 className="disp">How does your course <span className="ltwo">really play?</span></h2>
    <p className="sub">{count ? <>Search <b className="fig" style={{ letterSpacing: '-.02em', color: 'var(--lnk)' }}>{count}</b> courses.</> : 'Search courses.'} See what golfers say, and the hole that really costs the most shots.</p>
    <div className="findgrid"><div className="findl">
      <div className="lsearch"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input aria-label={label} placeholder={label} value={text} onChange={e => setText(e.target.value)} autoComplete="off"/></div>
      {!searching && <div className="hitlabel">Popular on clbhouz</div>}
      <div className="lhits" style={searching ? { marginTop: 22 } : undefined}>{hits.length ? hits.map(hit => <button type="button" key={hit.id} className={`hit ${selected === hit.id ? 'on' : ''}`} aria-pressed={selected === hit.id} onClick={() => { setChosen(hit.id); void analyticsEvents.track('web_course_card_viewed', { course_id: hit.id, source: searching ? 'search' : 'popular' }); }}><b>{hit.name}</b><span>{courseArea(hit)}</span></button>) : searching && !search.isPending ? <div className="hit empty"><b>No course found</b></div> : null}</div>
    </div><div className="lcard">{shown && <WebCourseCard course={shown}/>}</div></div>
    <a className="cta" href="#get" style={{ marginTop: 48 }}>Get the full read in the app</a></div></section>;
}
