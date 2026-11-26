import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TenRailCard } from '@/components/topTen/TenRailCard';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
import { useSectionReady } from './PageLoadGate';
import { useClbhouzTenChart } from './useClbhouzTenChart';
import { ClbhouzTenSheet } from './ClbhouzTenSheet';
import { chartCardSize, chartVisible, prosEligible, movementLabel, chartPlace, type ChartCohort } from './clbhouzTenRules';
import '@/styles/clbhouz-ten.css';
/** Brief 32: Everyone admits the section; the eagerly qualified Pros read settles before the page gate.
 * Geometry is shared with the shell. ResizeObserver measures the actual BLEED container, not the viewport.
 */
export function ClbhouzTenSection() {
  const [cohort, setCohort] = useState<ChartCohort>('everyone');
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState(false);
  const container = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(() => chartCardSize(document.documentElement.clientWidth));
  const everyone = useClbhouzTenChart('everyone');
  const needsPros = !everyone.isError && (everyone.data?.pros_voters ?? 0) >= 5 && chartVisible(everyone.data);
  const pros = useClbhouzTenChart('pros', 10, needsPros);
  const pending = everyone.isPending || (needsPros && pros.isPending);
  useSectionReady('clbhouzTen', !pending);
  const show = !everyone.isError && chartVisible(everyone.data);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => { const width = element.getBoundingClientRect().width; if (width > 32) setSize(chartCardSize(width)); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [pending, show]);
  const rows = (cohort === 'everyone' ? everyone : pros).data?.rows.slice(0, 10) ?? [];
  const styles = { '--ten-card-w': `${size.width}px`, '--ten-card-h': `${size.height}px` } as CSSProperties;
  const scrollTo = (index: number, smooth = true) => rail.current?.scrollTo({ left: index * (size.width + 10), behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  const navigate = useNavigate();
  if (!pending && !show) return null;
  if (pending) return <section ref={container} className="clb-ten" style={styles} aria-busy="true" data-clb-ten-shell>
    <div className="clb-ten-head"><div className="clb-ten-eyebrow-row"><div className="clb-ten-shell-line clb-shimmer-dark w-40" /></div><h2 className="clb-ten-title clb-ten-shell-title clb-shimmer-dark" style={{ ...SECTION_TITLE, marginTop: SECTION_TITLE_GAP }} aria-hidden="true">The courses in golfers' top tens</h2></div>
    <div className="clb-ten-rail">{[0, 1].map(i => <div key={i} className="clb-ten-shell-card clb-shimmer-dark" />)}</div>
    <div className="clb-ten-ticks">{Array.from({ length: 10 }, (_, i) => <span key={i} className="clb-ten-tick clb-shimmer-dark flex-1 h-[3px]" />)}</div>
    <div className="clb-ten-hint"><span className="clb-ten-shell-line clb-shimmer-dark w-28" /><span className="clb-ten-shell-line clb-shimmer-dark w-20" /></div>
  </section>;
  return <section ref={container} className="clb-ten" style={styles} data-clb-ten>
    <div className="clb-ten-head"><div className="clb-ten-eyebrow-row"><div className="clb-ten-eyebrow" style={SECTION_EYEBROW}>The clbhouz ten</div>
      {!pros.isError && prosEligible(everyone.data, pros.data) && <div className="clb-ten-switch" aria-label="Chart cohort">{(['everyone', 'pros'] as const).map(option => <Button variant="ghost" key={option} className="clb-ten-option" aria-pressed={cohort === option} onClick={() => { setCohort(option); setActive(0); scrollTo(0, false); }}>{option === 'everyone' ? 'Everyone' : 'Pros'}</Button>)}</div>}
    </div><h2 className="clb-ten-title" style={{ ...SECTION_TITLE, marginTop: SECTION_TITLE_GAP }}>The courses in golfers' top tens</h2></div>
    <div className="clb-ten-rail" ref={rail} onScroll={event => setActive(Math.max(0, Math.min(rows.length - 1, Math.round(event.currentTarget.scrollLeft / (size.width + 10)))))}>
      {rows.map(row => <TenRailCard key={row.course_id} rank={row.rank} courseId={row.course_id} name={row.name} imageUrl={row.thumbnail_image} place={chartPlace(row)} ariaLabel={`${row.rank}. ${row.name}`} onClick={() => navigate(`/courses/${row.course_id}`)}
        corner={movementLabel(row) !== null && <span className="clb-ten-movement" data-movement={row.movement}>{movementLabel(row)}</span>}
        figures={[{ label: 'Points', value: row.points }, { label: 'Tens', value: row.tens }]} story={row.story} />)}
    </div>
    <div className="clb-ten-ticks">{rows.map((row, index) => <Button variant="ghost" key={row.course_id} className="clb-ten-tick" aria-label={`Go to card ${index + 1}`} aria-current={active === index} onClick={() => scrollTo(index)} />)}</div>
    <div className="clb-ten-hint"><span>Swipe for 2 to {rows.length}</span><Button variant="ghost" className="clb-ten-full" onClick={() => setSheet(true)}>Full chart ›</Button></div>
    <ClbhouzTenSheet cohort={cohort} open={sheet} onOpenChange={setSheet} />
  </section>;
}
