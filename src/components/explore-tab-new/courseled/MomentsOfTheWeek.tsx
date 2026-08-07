import { useTranslation } from 'react-i18next';

import { MomentTile } from './MomentTile';
import { useMomentsOfTheWeek, type Moment } from './hooks/useMomentsOfTheWeek';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { Eyebrow, InkAction, NEW_CARD_RING } from './tokens';
import { MomentsMosaic as MomentsMosaicShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 4 — MOMENTS OF THE MONTH (BRIEF_MOMENTS_MOSAIC_ALTERNATING).
 *
 * The only image-led section. The unit is a BLOCK OF EXACTLY THREE: one TALL
 * tile (220) beside a column of TWO SHORTS (106 + 8 + 106 = 220), so every
 * block squares off flush. Blocks stack with the same 8px gap and the tall tile
 * ALTERNATES SIDE — block 1 left, block 2 right, block 3 left.
 *
 * Rank order is untouched: tiles are chunked in rank order and the FIRST tile
 * of each block takes the tall slot, so hierarchy cascades instead of resetting.
 * A remainder of one renders FULL WIDTH (never half, which leaves a hole); a
 * remainder of two renders as a pair row. Trailing rows do not consume an
 * alternation turn.
 *
 * Every tile is labelled with the COURSE, never the poster — Discover is
 * course-led. Tapping opens the shared fullscreen viewer READ-ONLY.
 */

const TALL = 220;
const SHORT = 106;
const GAP = 8;
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


  const shown = moments.slice(0, 5);

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
        {t('discover.momentsOfTheMonth', 'Moments of the month')}
      </Eyebrow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {shown.map((m, i) => {
          const tall = i === 0;
          return (
            <MomentTile
              key={m.key}
              moment={m}
              onPress={onTilePress}
              radius={14}
              initialsSize={tall ? 30 : 20}
              labelSize={10}
              labelInset={8}
              scrimStop="45%"
              style={{
                height: tall ? TALL : SHORT,
                gridRow: tall ? 'span 2' : 'auto',
                ...(isNewSince(m.post.createdAt, lastSeen) ? NEW_CARD_RING : null),
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

export default MomentsOfTheWeek;
