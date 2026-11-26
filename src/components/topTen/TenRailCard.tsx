/** Brief 34: the one countdown rail card shared by the Courses chart and the profile ten.
 * Geometry/typography live in clbhouz-ten.css (.clb-ten scope); callers supply only the corner,
 * the two figures and the story, so the two surfaces cannot drift. */
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';

export interface TenRailFigure { label: string; value: ReactNode; missing?: boolean }
interface Props {
  rank: number;
  courseId: string;
  name: string;
  imageUrl: string | null;
  place: string;
  corner?: ReactNode;
  figures: TenRailFigure[];
  story?: string | null;
  ariaLabel: string;
  onClick: () => void;
  selected?: boolean;
  dimmed?: boolean;
}
export function TenRailCard({ rank, courseId, name, imageUrl, place, corner, figures, story, ariaLabel, onClick, selected, dimmed }: Props) {
  return <Button variant="ghost" className="clb-ten-card" aria-label={ariaLabel} onClick={onClick}
    data-ten-rail-rank={rank} {...(selected !== undefined ? { 'data-selected': selected, 'aria-expanded': selected } : {})} {...(dimmed !== undefined ? { 'data-dimmed': dimmed } : {})}>
    <CourseImageFallback courseId={courseId} courseName={name} imageUrl={imageUrl} flatWhenEmpty>
      <div className="clb-ten-fade" /><span className="clb-ten-rank">{rank}</span>
      {corner}
      <div className="clb-ten-bottom"><div className="clb-ten-name">{name}</div><div className="clb-ten-county">{place}</div>
        <div className="clb-ten-stats">{figures.map(figure => <div className="clb-ten-stat" key={figure.label}><b data-missing={figure.missing || undefined}>{figure.value}</b><small>{figure.label}</small></div>)}{story && <div className="clb-ten-story">{story}</div>}</div>
      </div>
    </CourseImageFallback>
  </Button>;
}
