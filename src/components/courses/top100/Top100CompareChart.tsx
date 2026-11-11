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
/** Opens inside the tapped row, under its track; a tap anywhere on the row except View course toggles it. */
function Detail({ row, n, onOpen }: { row: ArgumentRow; n:number; onOpen:(id:string)=>void }) {
  return <div className="t100b-detail" data-compare-detail>
    <span className="t100b-thumb"><CourseImageFallback courseId={row.id} courseName={row.name} imageUrl={row.imageUrl} style={{ height: '100%' }} /></span>
    <span className="t100b-detail-copy"><span className="t100b-detail-line">Officially ranked <span className="t100b-number">{ordinal(row.publishedRank)}</span>, {row.divergence === 0 ? 'and' : 'but'} golfers rank it <span className="t100b-number">{ordinal(row.memberRank)}</span></span><span className="t100b-why">{whyLine(row,n)}</span><button type="button" className="t100b-view" onClick={e => { e.stopPropagation(); onOpen(row.id); }}>View course ›</button></span>
  </div>;
}
/** A position's centre on the track, inset by the 6px half-width of the widest mark. */
function position(p: number, n: number) {
  return `calc((100% - 12px) * ${(p - 1) / Math.max(1, n - 1)} + 6px)`;
}
/** Option C: the full name and the gap above, the two positions and their numbers on the track. */
function CompareRow({ row, n, selected, onSelect, onOpen }: { row: ArgumentRow; n: number; selected: string | null; onSelect: (id: string) => void; onOpen: (id: string) => void }) {
  const agree = row.divergence === 0;
  const up = row.divergence > 0;
  const fill = agree ? '' : up ? 't100b-green' : 't100b-red';
  const tone = agree ? '' : up ? 't100b-up' : 't100b-down';
  const gap = agree ? '=' : `${up ? '↑' : '↓'}${Math.abs(row.divergence)}`;
  const isSelected = selected===row.id;
  /* The wrapper owns the tap so the open panel stays tappable; the inner button carries the click by bubbling. */
  return <div className="t100b-rowwrap" data-compare-row={row.id} data-dim={selected!==null && !isSelected} data-selected={isSelected} onClick={() => onSelect(row.id)}><button type="button" className="t100b-crow" aria-label={row.name} aria-pressed={isSelected}>
    <span className="t100b-name-line"><span className="t100b-name">{shortenCourseName(row.name)}</span><b className={tone ? `t100b-badge ${tone}` : 't100b-badge'}>{gap}</b></span>
    <span className="t100b-track">
      {agree ? <i className="t100b-agree" style={{ left: position(row.listRank, n) }} /> : <>
        <i className={fill ? `t100b-connector ${fill}` : 't100b-connector'} style={{ left: position(Math.min(row.listRank, row.memberRank), n), width: `calc((100% - 12px) * ${Math.abs(row.divergence) / Math.max(1, n - 1)})` }} />
        <i className="t100b-dot t100b-official" style={{ left: position(row.listRank, n) }} />
        <i className={fill ? `t100b-dot t100b-member ${fill}` : 't100b-dot t100b-member'} style={{ left: position(row.memberRank, n) }} />
      </>}
      <em className="t100b-num" style={{ left: position(row.listRank, n) }}>{row.listRank}</em>
      {agree ? null : <em className={tone ? `t100b-num ${tone}` : 't100b-num'} style={{ left: position(row.memberRank, n) }}>{row.memberRank}</em>}
    </span>
  </button>{isSelected ? <Detail row={row} n={n} onOpen={onOpen} /> : null}</div>;
}
function Chart({ rows,n,selected,onSelect,onOpen,onSeeAll }: { rows:ArgumentRow[];n:number;selected:string|null;onSelect:(id:string)=>void;onOpen:(id:string)=>void;onSeeAll?:()=>void }) {
  /* "Golfers agree" joins the key only when a row actually on screen agrees,
     so the page's capped ten and the see-all sheet are checked separately. */
  const agrees = rows.some(r => r.divergence === 0);
  return <><div className="t100b-keyrow"><div className="t100b-key"><span className="t100b-key-item"><i className="t100b-dot t100b-official t100b-key-dot" />Official rank</span>{agrees ? <span className="t100b-key-item"><i className="t100b-agree t100b-key-dot" />Golfers agree</span> : null}</div>{onSeeAll ? <button type="button" className="t100b-see-all" onClick={onSeeAll}>SEE ALL {n}<ChevronRight size={12} aria-hidden /></button> : null}</div><div className="t100b-axis"><span>1st</span><span>{ordinal(n)}</span></div>{rows.map(row => <CompareRow key={row.id} row={row} n={n} selected={selected} onSelect={onSelect} onOpen={onOpen} />)}</>;
}
/** Selection is local to each list-keyed chart; sheet course taps close before navigation. */
export function Top100CompareChart({ rows,onOpenCourse }: { rows:ArgumentRow[];onOpenCourse:(id:string)=>void }) {
  const [selected,setSelected]=useState<string|null>(null), [all,setAll]=useState(false);
  const select=(id:string) => setSelected(current => current===id ? null : id);
  const n=rows.length, capped=n>12;
  return <div className="t100b-chart">{capped ? <div className="t100b-caption">The 10 biggest gaps of the {n}, in official order</div> : null}<Chart rows={chartRows(rows)} n={n} selected={selected} onSelect={select} onOpen={onOpenCourse} onSeeAll={capped ? () => setAll(true) : undefined} />
    {all ? <BottomSheet open onClose={() => setAll(false)} scrollBody ariaLabelledBy="t100b-all-title"><div className="t100b"><div className="t100b-sheet"><div className="t100b-kicker amber">GOLFERS VERSUS THE OFFICIAL LIST</div><div id="t100b-all-title" className="t100b-title">All {n} compared</div><div className="t100b-sub">In official order. Tap a course to see why.</div><div className="t100b-chart"><Chart rows={[...rows].sort((a,b)=>a.listRank-b.listRank)} n={n} selected={selected} onSelect={select} onOpen={id => { setAll(false); onOpenCourse(id); }} /></div></div></div></BottomSheet> : null}
  </div>;
}
