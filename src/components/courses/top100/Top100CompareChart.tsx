import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { ordinal } from '@/lib/text/numbers';
import { shortenCourseName, whyLine, type ArgumentRow } from './theArgument';
import './top100Compare.css';

export function chartRows(rows: ArgumentRow[]): ArgumentRow[] {
  return rows.length > 12 ? [...rows].sort((a,b) => Math.abs(b.divergence)-Math.abs(a.divergence) || a.publishedRank-b.publishedRank).slice(0,10).sort((a,b) => a.listRank-b.listRank) : [...rows].sort((a,b) => a.listRank-b.listRank);
}
function Detail({ row, n, onOpen }: { row?: ArgumentRow; n:number; onOpen:(id:string)=>void }) {
  return <div className="t100b-detail">{row ? <button type="button" className="t100b-detail-button" onClick={() => onOpen(row.id)} aria-label={`${row.name}, open course`}>
    <span className="t100b-thumb"><CourseImageFallback courseId={row.id} courseName={row.name} imageUrl={row.imageUrl} style={{ height: '100%' }} /></span>
    <span className="t100b-detail-copy"><span className="t100b-detail-name">{shortenCourseName(row.name)}</span><div className="t100b-detail-line">Golfers <span className="t100b-number">{ordinal(row.memberRank)}</span> · the list <span className="t100b-number">{ordinal(row.listRank)}</span> of the {n} (officially <span className="t100b-number">{ordinal(row.publishedRank)}</span>)</div><div className="t100b-why">{whyLine(row,n)}</div></span><ChevronRight size={14} className="t100b-chevron" aria-hidden />
  </button> : <span className="t100b-hint">Tap a course to see why</span>}</div>;
}
function Chart({ rows,n,selected,onSelect }: { rows:ArgumentRow[];n:number;selected:string|null;onSelect:(id:string)=>void }) {
  const position=(p:number) => `calc((100% - 10px) * ${(p-1)/Math.max(1,n-1)} + 5px)`;
  return <><div className="t100b-key"><span className="t100b-key-item"><i className="t100b-dot t100b-official t100b-key-dot" />Official order</span><span className="t100b-key-item"><i className="t100b-dot t100b-member t100b-key-dot" />Golfers' order</span></div><div className="t100b-axis"><span /><span className="t100b-axis-labels"><span>1st</span><span>{ordinal(n)}</span></span></div>{rows.map(row => { const tone=row.divergence>0 ? 't100b-green' : row.divergence<0 ? 't100b-red' : ''; return <button type="button" className="t100b-crow" key={row.id} aria-label={row.name} aria-pressed={selected===row.id} data-dim={selected!==null && selected!==row.id} onClick={() => onSelect(row.id)}><span className="t100b-cname">{shortenCourseName(row.name)}</span><span className="t100b-track">{row.divergence!==0 ? <i className={`t100b-connector ${tone}`} style={{left:position(Math.min(row.listRank,row.memberRank)),width:`calc((100% - 10px) * ${Math.abs(row.divergence)/Math.max(1,n-1)})`}} /> : null}<i className="t100b-dot t100b-official" style={{left:position(row.listRank)}} /><i className={`t100b-dot t100b-member ${tone}`} style={{left:position(row.memberRank)}} /></span></button>; })}</>;
}
/** Selection is local to each list-keyed chart; sheet course taps close before navigation. */
export function Top100CompareChart({ rows,onOpenCourse }: { rows:ArgumentRow[];onOpenCourse:(id:string)=>void }) {
  const [selected,setSelected]=useState<string|null>(null), [all,setAll]=useState(false);
  const select=(id:string) => setSelected(current => current===id ? null : id);
  const selectedRow=rows.find(r => r.id===selected), n=rows.length, capped=n>12;
  return <div className="t100b-chart">{capped ? <div className="t100b-caption">The 10 biggest gaps of the {n}, in official order</div> : null}<Chart rows={chartRows(rows)} n={n} selected={selected} onSelect={select} /><Detail row={selectedRow} n={n} onOpen={onOpenCourse} />{capped ? <button type="button" className="t100b-see-all" onClick={() => setAll(true)}>SEE ALL {n} COMPARED<ChevronRight size={12} aria-hidden /></button> : null}
    {all ? <BottomSheet open onClose={() => setAll(false)} scrollBody ariaLabelledBy="t100b-all-title"><div className="t100b"><div className="t100b-sheet"><div className="t100b-kicker amber">GOLFERS VERSUS THE OFFICIAL LIST</div><div id="t100b-all-title" className="t100b-title">All {n} compared</div><div className="t100b-sub">In official order. Tap a course to see why.</div><div className="t100b-chart"><Chart rows={[...rows].sort((a,b)=>a.listRank-b.listRank)} n={n} selected={selected} onSelect={select} /></div><div className="t100b-sheet-detail"><Detail row={selectedRow} n={n} onOpen={id => { setAll(false); onOpenCourse(id); }} /></div></div></div></BottomSheet> : null}
  </div>;
}
