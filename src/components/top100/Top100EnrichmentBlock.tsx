/**
 * Top100EnrichmentBlock — the fixed-height footer rendered under each Top 100
 * card: an optional verdict band above the COURSE STATS panel.
 *
 * The height is FIXED and identical for every card on purpose.
 * VirtualizedCourseList measures one sample card and multiplies, so a footer
 * whose height varied with the presence of a verdict would drift the row
 * offsets at 100 rows. The verdict occupies a reserved slot instead.
 */
import React from 'react';
import { Top100VerdictBand, VERDICT_BAND_HEIGHT } from './Top100VerdictBand';
import { Top100CourseStatsPanel, STATS_PANEL_HEIGHT } from './Top100CourseStatsPanel';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import type { Verdict } from './verdict';

const TOP_GAP = 8;
const SLOT_GAP = 6;

export const TOP100_ENRICHMENT_HEIGHT =
  TOP_GAP + VERDICT_BAND_HEIGHT + SLOT_GAP + STATS_PANEL_HEIGHT;

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
}) => (
  <div style={{ height: TOP100_ENRICHMENT_HEIGHT, paddingTop: TOP_GAP }}>
    <div className="px-3 sm:px-0">
      <div style={{ height: VERDICT_BAND_HEIGHT, marginBottom: SLOT_GAP }}>
        {verdict && (
          <Top100VerdictBand courseId={courseId} verdict={verdict} onOpen={onOpenVerdict} />
        )}
      </div>
      <Top100CourseStatsPanel data={data} onRate={onRate} />
    </div>
  </div>
);

export default Top100EnrichmentBlock;
