/** The career board owns standing, activity progress owns played/total; sheet reuses existing race and grid unchanged. */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ordinal } from '@/lib/text/numbers';
import { useTop100Race } from '@/hooks/top100/useTop100Race';
import type { RankListSlug } from '@/features/explore-magazine/useTop100RankIndex';
import { Top100RaceSection } from './Top100RaceSection';
import { YourCoursesDropdown } from './YourHundredSection';
import type { ComponentProps } from 'react';

export function Top100YourHundred({ viewerId, list, dropdown, onOpenCourse }: { viewerId: string; list: RankListSlug; dropdown: Omit<ComponentProps<typeof YourCoursesDropdown>, 'onOpenCourse'>; onOpenCourse: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const board = useTop100Race(viewerId, list);
  const standing = !board.isError && !board.isPlaceholderData ? board.data?.find(row => row.user_id === viewerId || row.is_viewer) : undefined;
  if (dropdown.viewerPlayed < 5 || !standing) return null;
  const depart = (id: string) => { setOpen(false); requestAnimationFrame(() => onOpenCourse(id)); };
  return <section className="t100-b-section" data-your-hundred-row><Button variant="ghost" className="t100-your-row" onClick={() => setOpen(true)} aria-label="Open Your hundred"><span className="t100-b-kicker">YOUR HUNDRED</span><span className="t100-your-value"><span><b>{dropdown.viewerPlayed}</b> of <b>{dropdown.total}</b> · <b>{ordinal(standing.pos)}</b> of <b>{standing.total_members}</b></span><ChevronRight size={14} /></span></Button>
    <BottomSheet open={open} onClose={() => setOpen(false)} scrollBody maxHeight="88dvh" ariaLabelledBy="t100-your-title"><div className="t100-compare-sheet"><div className="t100-b-kicker">YOUR HUNDRED</div><h2 id="t100-your-title" className="t100-b-title">The race</h2></div><Top100RaceSection viewerId={viewerId} list={list} total={dropdown.total} onOpenCourse={depart} /><YourCoursesDropdown {...dropdown} onOpenCourse={depart} /></BottomSheet>
  </section>;
}