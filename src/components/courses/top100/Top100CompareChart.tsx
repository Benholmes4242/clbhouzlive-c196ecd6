/** Comparison owns selection only; every course departure belongs to the panel's openCourse. */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { ordinal } from '@/lib/text/numbers';
import { whyLine, type ArgumentRow } from './theArgument';

export const shortenCourseName = (name: string) => name.replace(/ (Golf and Country Club|Golf & Country Club|Golf Club|Golf Links|Golf Resort|Golf Course)(?=$| \()/, '');
export function chartRows(rows: ArgumentRow[], all = false) {
  return [...(rows.length > 12 && !all ? [...rows].sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence) || a.publishedRank - b.publishedRank).slice(0, 10) : rows)].sort((a, b) => a.listRank - b.listRank);
}
function Detail({ row, n, onOpenCourse }: { row?: ArgumentRow; n: number; onOpenCourse: (id: string) => void }) {
  return <div className="t100-compare-detail">{row ? <Button variant="ghost" className="t100-detail-button" onClick={() => onOpenCourse(row.id)} aria-label={`${row.name}, view course`}>
    <div className="t100-detail-thumb"><CourseImageFallback courseId={row.id} courseName={row.name} imageUrl={row.imageUrl} style={{ height: '100%' }} /></div>
    <span className="t100-detail-copy"><b>{shortenCourseName(row.name)}</b><span className="t100-detail-order">Golfers <em>{ordinal(row.memberRank)}</em> · the list <em>{ordinal(row.listRank)}</em> of the {n} (officially {ordinal(row.publishedRank)})</span><span className="t100-why">{whyLine(row, n)}</span></span><ChevronRight size={14} />
  </Button> : <span className="t100-compare-hint">Tap a course to see why</span>}</div>;
}
function Chart({ rows, n, selected, onSelect }: { rows: ArgumentRow[]; n: number; selected: string | null; onSelect: (id: string) => void }) {
  const position = (p: number) => `calc((100% - 10px) * ${(p - 1) / Math.max(1, n - 1)} + 5px)`;
  return <><div className="t100-compare-key"><span><i className="t100-dot official static" />Official order</span><span><i className="t100-dot filled static" />Golfers' order</span></div>
    <div className="t100-compare-axis"><span /><span>{ordinal(1)}<span>{ordinal(n)}</span></span></div>
    {rows.map(row => <Button key={row.id} variant="ghost" aria-label={`Compare ${row.name}`} aria-pressed={selected === row.id} className={`t100-compare-row ${selected && selected !== row.id ? 'dimmed' : ''} ${selected === row.id ? 'selected' : ''}`} onClick={() => onSelect(row.id)}>
      <span className="t100-compare-name">{shortenCourseName(row.name)}</span><span className="t100-compare-track">
        {row.divergence !== 0 ? <i className={`t100-connector ${row.divergence > 0 ? 'higher' : 'lower'}`} style={{ left: position(Math.min(row.listRank, row.memberRank)), width: `calc((100% - 10px) * ${Math.abs(row.divergence) / Math.max(1, n - 1)})` }} /> : null}
        <i className="t100-dot official" style={{ left: position(row.listRank) }} /><i className={`t100-dot filled ${row.divergence > 0 ? 'higher' : row.divergence < 0 ? 'lower' : ''}`} style={{ left: position(row.memberRank) }} />
      </span>
    </Button>)}
  </>;
}
export function Top100CompareChart({ rows, onOpenCourse }: { rows: ArgumentRow[]; onOpenCourse: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null), [all, setAll] = useState(false), [sheetSelected, setSheetSelected] = useState<string | null>(null);
  const n = rows.length, capped = n > 12;
  return <div className="t100-compare-wrap">
    {capped ? <div className="t100-compare-caption">The 10 biggest gaps of the {n}, in official order</div> : null}
    <Chart rows={chartRows(rows)} n={n} selected={selected} onSelect={id => setSelected(value => value === id ? null : id)} />
    <Detail row={rows.find(row => row.id === selected)} n={n} onOpenCourse={onOpenCourse} />
    {capped ? <Button variant="ghost" className="t100-compare-see" onClick={() => setAll(true)}>SEE ALL {n} COMPARED <ChevronRight size={12} /></Button> : null}
    <BottomSheet open={all} onClose={() => setAll(false)} scrollBody maxHeight="88dvh" ariaLabelledBy="t100-all-title">
      <div className="t100-compare-sheet"><div className="t100-b-kicker amber">GOLFERS VERSUS THE OFFICIAL LIST</div><h2 id="t100-all-title" className="t100-b-title">All {n} compared</h2><p className="t100-b-sub">In official order. Tap a course to see why.</p>
        <div className="t100-compare-wrap"><Chart rows={chartRows(rows, true)} n={n} selected={sheetSelected} onSelect={id => setSheetSelected(value => value === id ? null : id)} /></div>
        <div className="t100-sheet-detail"><Detail row={rows.find(row => row.id === sheetSelected)} n={n} onOpenCourse={id => { setAll(false); requestAnimationFrame(() => onOpenCourse(id)); }} /></div>
      </div>
    </BottomSheet>
  </div>;
}