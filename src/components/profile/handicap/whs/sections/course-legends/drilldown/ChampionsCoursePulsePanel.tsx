import React from 'react';
import type { CourseMeta } from '@/hooks/gam/useCourseMeta';

interface Props {
  meta: CourseMeta | undefined;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const ChampionsCoursePulsePanel: React.FC<Props> = ({ meta }) => {
  const segs: string[] = [];
  if (meta?.course_cr != null) segs.push(`CR ${meta.course_cr.toFixed(1)}`);
  if (meta?.course_slope != null) segs.push(`SLOPE ${meta.course_slope}`);
  if (meta?.hardest_hole?.hole_no != null) segs.push(`H${meta.hardest_hole.hole_no}`);
  if (meta?.avg_over_par != null) segs.push(`AVG +${Number(meta.avg_over_par).toFixed(1)}`);

  if (segs.length === 0) return null;

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: '#94A3B8',
        fontVariantNumeric: 'tabular-nums',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0,
      }}
    >
      {segs.join(' · ')}
    </div>
  );
};

export default ChampionsCoursePulsePanel;
