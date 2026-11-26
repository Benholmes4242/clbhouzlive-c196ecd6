import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useClbhouzTenChart } from './useClbhouzTenChart';
import { chartPlace, movementLabel, type ChartCohort } from './clbhouzTenRules';
import '@/styles/clbhouz-ten.css';
/** Reusable chart door: limit 50, server order, optional course highlight; never computes a chart locally. */
export function ClbhouzTenSheet({ cohort, highlightCourseId, open, onOpenChange }: {
  cohort: ChartCohort; highlightCourseId?: string; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const q = useClbhouzTenChart(cohort, 50, open);
  const navigate = useNavigate();
  const highlight = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open && q.data) requestAnimationFrame(() => highlight.current?.scrollIntoView({ block: 'nearest' })); }, [open, q.data, highlightCourseId]);
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="clb-ten-sheet">
      <DrawerTitle className="clb-ten-sheet-title">The clbhouz Ten</DrawerTitle>
      <DrawerDescription className="clb-ten-sheet-description">Worked out every Monday from every public top ten: 10 points for a #1 down to 1 for a #10.</DrawerDescription>
      <div className="clb-ten-sheet-list">
        {q.isPending ? Array.from({ length: 5 }, (_, i) => <div key={i} className="clb-shimmer-dark h-14 mb-2" aria-hidden="true" />) : q.isError ? <p role="alert">The chart couldn’t load.</p> : q.data?.rows.map(row => <Button variant="ghost" className="clb-ten-sheet-row" key={row.course_id}
          ref={highlightCourseId === row.course_id ? highlight : undefined} data-highlight={highlightCourseId === row.course_id}
          onClick={() => { onOpenChange(false); navigate(`/courses/${row.course_id}`); }}>
          <span className="clb-ten-sheet-rank">{row.rank}</span>
          <span className="clb-ten-sheet-photo"><CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.thumbnail_image} /></span>
          <span className="clb-ten-sheet-text"><span className="clb-ten-sheet-name">{row.name}</span><span className="clb-ten-sheet-county">{chartPlace(row)}</span></span>
          <span className="clb-ten-sheet-figure"><b>{row.points}</b><small>Points</small></span>
          <span className="clb-ten-sheet-movement" data-movement={row.movement}>{movementLabel(row, true)}</span>
        </Button>)}
      </div>
    </DrawerContent>
  </Drawer>;
}
