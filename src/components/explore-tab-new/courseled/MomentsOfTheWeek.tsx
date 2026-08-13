import { useTranslation } from 'react-i18next';

import { MomentsGrid } from './MomentsGrid';
import { useMomentsOfTheWeek, type Moment } from './hooks/useMomentsOfTheWeek';
import { countNewSince, useReportNewCount } from './newSince';
import { Eyebrow, InkAction } from './tokens';
import { MomentsMosaic as MomentsMosaicShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 4 — FROM THE COMMUNITY (BRIEF_MOMENTS_COMMUNITY_GRID).
 *
 * The only image-led section. Geometry lives in MomentsGrid, which the see-all
 * sheet renders too: one layout for one thing. The section's only difference
 * from the sheet is the page cap and the autoplay group.
 */

/** Page cap. The see-all sheet stays uncapped. */
const PAGE_CAP = 8;

interface Props {
  moments: Moment[];
  /** Size of the full ranked list behind the sheet (mosaic is capped). */
  totalCount?: number;
  /** TRUE while the moments query has not settled — the shell holds the slot. */
  isPending?: boolean;
  onTilePress: (m: Moment) => void;
  onSeeAll: () => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
}

export function MomentsOfTheWeek({
  moments,
  totalCount,
  isPending = false,
  onTilePress,
  onSeeAll,
  lastSeen = null,
}: Props) {
  const { t } = useTranslation('courses');

  // NEW SINCE: the post's created_at, the stamp the mosaic already ranks on.
  // Not computed before settle.
  const newCount = isPending ? 0 : countNewSince(moments, (m) => m.post.createdAt, lastSeen);
  useReportNewCount('moments', newCount);

  // UNRESOLVED IS NOT ABSENT: shell in flight, nothing once settled empty.
  if (isPending) return <MomentsMosaicShell />;
  if (moments.length === 0) return null;


  return (
    <section>
      <Eyebrow
        dot={newCount > 0}
        aside={
          (totalCount ?? moments.length) > shown.length ? (
            <InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>
          ) : undefined
        }
      >
        {t('discover.momentsFromCommunity', 'From the community')}
      </Eyebrow>

      <MomentsGrid
        moments={moments}
        cap={PAGE_CAP}
        gap={2}
        tall={220}
        radius={8}
        lastSeen={lastSeen}
        onTilePress={onTilePress}
        autoplayGroup="moments-page"
      />
    </section>
  );
}

export default MomentsOfTheWeek;
