import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import type { StatBrowseRow } from '../useStatBrowse';

/**
 * PhotoFigureCard — the 300 x 230 rail card shared by sections 03 and 05
 * (BRIEF_COURSES_PAGE_DEVICE_REVISION §6). One card, different figures.
 * BrowseCourseCard is full-width and shared with Top 100, so it is not this.
 */
/* Card geometry, read by the card AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
export const PHOTO_FIGURE_W = 300;
export const PHOTO_FIGURE_H = 230;
/** Rail gap of the two PhotoFigureCard rails. */
export const PHOTO_FIGURE_GAP = 2;
/** The regulars (Most played) shows exactly this many cards (BRIEF_COURSES_REGULARS_FIVE). */
export const MOST_PLAYED_COUNT = 5;
/** Highest rated shows exactly this many cards (BRIEF_COURSES_HIGHEST_RATED_TEN). */
export const HIGHEST_RATED_COUNT = 10;

export function PhotoFigureCard({ row, figure, figureColor = '#FFFFFF', figureLabel, footer, nameBottom = 15 }: {
  row: StatBrowseRow;
  figure: React.ReactNode;
  /** Colour of the headline figure only. Default white; Most played passes nothing. */
  figureColor?: string;
  figureLabel: string;
  /** Rendered inside the photo; absolute-positioned footers place themselves. */
  footer?: React.ReactNode;
  /** Distance of the name/place block from the bottom edge. */
  nameBottom?: number;
}) {
  const navigate = useNavigate();
  const place = [row.region, row.sub_country].filter(Boolean).join(', ');
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${row.course_id}`)}
      style={{ width: PHOTO_FIGURE_W, height: PHOTO_FIGURE_H, flex: 'none', padding: 0, border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
    >
      <CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.image_url} style={{ height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
        <div style={{ position: 'absolute', top: 16, right: 16, textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.05em', color: figureColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            {figure}
          </div>
          <div style={{ marginTop: 5, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>
            {figureLabel}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: nameBottom }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1.08 }}>{row.name}</div>
          {place ? <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>{place}</div> : null}
        </div>
        {footer}
      </CourseImageFallback>
    </button>
  );
}
