/**
 * Top100EnrichmentBlock — the footer rendered under each Top 100 card:
 * an optional verdict band above the COURSE STATS panel.
 *
 * HEIGHT IS NO LONGER FIXED. The brief requires that unrated courses render
 * nothing at all and that sub-score bars appear only above the rating
 * threshold, so the footer height now varies per row. See the ship report —
 * VirtualizedCourseList measures a sample card and multiplies, so row offsets
 * can drift on lists with mixed rated/unrated coverage.
 */
import React from 'react';
import { Top100VerdictBand } from './Top100VerdictBand';
import { Top100CourseStatsPanel } from './Top100CourseStatsPanel';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import type { Verdict } from './verdict';

interface Props {
  courseId: string;
  data: Top100Enrichment | undefined;
  verdict: Verdict | null;
  onOpenVerdict: () => void;
  onRate: () => void;
}

export const Top100EnrichmentBlock: React.FC<Props> = ({
  courseId,
  data,
  verdict,
  onOpenVerdict,
  onRate,
}) => {
  const hasRating = !!data && data.rating != null && data.ratingCount > 0;
  if (!hasRating) return null;

  return (
    <div className="px-3 sm:px-0" style={{ paddingTop: 8 }}>
      {verdict && (
        <div style={{ marginBottom: 6 }}>
          <Top100VerdictBand courseId={courseId} verdict={verdict} onOpen={onOpenVerdict} />
        </div>
      )}
      <Top100CourseStatsPanel courseId={courseId} data={data} onRate={onRate} />
    </div>
  );
};

export default Top100EnrichmentBlock;
