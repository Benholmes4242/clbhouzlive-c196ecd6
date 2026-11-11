import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ordinal } from '@/lib/text/numbers';
import './top100Compare.css';
/** The panel preloads the canonical race query; only this sheet mounts its presentation. */
export function Top100YourHundred({ played,total,position,members,children }: { played:number;total:number;position:number;members:number;children:(close:()=>void)=>ReactNode }) {
 const [open,setOpen]=useState(false); if (played<5) return null;
 return <section className="t100b-section"><button type="button" className="t100b-yrow" onClick={()=>setOpen(true)}><span className="t100b-kicker t100b-ylabel">YOUR HUNDRED</span><span className="t100b-yvalue"><span><b className="t100b-y-number">{played}</b> of <b className="t100b-y-number">{total}</b> · <b className="t100b-y-number">{ordinal(position)}</b> of <b className="t100b-y-number">{members}</b></span><ChevronRight size={14} aria-hidden /></span></button>{open ? <BottomSheet open onClose={()=>setOpen(false)} scrollBody ariaLabelledBy="t100b-race-title"><div className="t100b"><div className="t100b-sheet"><div className="t100b-kicker">YOUR HUNDRED</div><div className="t100b-title" id="t100b-race-title">The race</div></div>{children(()=>setOpen(false))}</div></BottomSheet> : null}</section>;
}
