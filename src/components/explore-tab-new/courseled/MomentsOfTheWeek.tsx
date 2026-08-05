import { useTranslation } from 'react-i18next';

import { MomentTile } from './MomentTile';
import { useMomentsOfTheWeek, type Moment } from './hooks/useMomentsOfTheWeek';
import { Eyebrow, InkAction } from './tokens';

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
}

export function MomentsOfTheWeek({ moments, totalCount, onTilePress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  if (moments.length === 0) return null;

  const shown = moments.slice(0, 5);

  return (
    <section>
      <Eyebrow
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
              style={{ height: tall ? TALL : SHORT, gridRow: tall ? 'span 2' : 'auto' }}
            />
          );
        })}
      </div>
    </section>
  );
}

export default MomentsOfTheWeek;
