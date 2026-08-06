import { useTranslation } from 'react-i18next';

import { MomentTile } from './MomentTile';
import { useMomentsOfTheWeek, type Moment } from './hooks/useMomentsOfTheWeek';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { Eyebrow, InkAction, NEW_CARD_RING } from './tokens';

/**
 * Section 4 — MOMENTS OF THE MONTH (BRIEF, section 4).
 *
 * The only image-led section: a two-column mosaic where the first tile runs
 * tall. Every tile is labelled with the COURSE, never the poster — Discover is
 * course-led. Tapping opens the shared fullscreen viewer READ-ONLY, so Discover
 * never becomes a second engagement surface.
 */

const TALL = 220;
const SHORT = 106;

interface Props {
  moments: Moment[];
  /** Size of the full ranked list behind the sheet (mosaic is capped). */
  totalCount?: number;
  onTilePress: (m: Moment) => void;
  onSeeAll: () => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
}

export function MomentsOfTheWeek({
  moments,
  totalCount,
  onTilePress,
  onSeeAll,
  lastSeen = null,
}: Props) {
  const { t } = useTranslation('courses');

  // NEW SINCE: the post's created_at, the stamp the mosaic already ranks on.
  const newCount = countNewSince(moments, (m) => m.post.createdAt, lastSeen);
  useReportNewCount('moments', newCount);

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
