import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import { useMomentsOfTheWeek, type Moment } from './hooks/useMomentsOfTheWeek';
import { Eyebrow, InkAction } from './tokens';

/**
 * Section 4 — MOMENTS OF THE WEEK (BRIEF, section 4).
 *
 * The only image-led section: a two-column mosaic where the first tile runs
 * tall. Every tile is labelled with the COURSE, never the poster — Discover is
 * course-led. Tapping opens the shared fullscreen viewer READ-ONLY, so Discover
 * never becomes a second engagement surface.
 */

function PlayGlyph() {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 28,
        height: 28,
        borderRadius: 999,
        background: 'rgba(10,14,10,0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg width={11} height={11} viewBox="0 0 24 24" fill="#fff">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

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
        {t('discover.momentsOfTheWeek', 'Moments of the week')}
      </Eyebrow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {shown.map((m, i) => {
          const tall = i === 0;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onTilePress(m)}
              style={{
                position: 'relative',
                padding: 0,
                border: 'none',
                borderRadius: 14,
                overflow: 'hidden',
                height: tall ? TALL : SHORT,
                gridRow: tall ? 'span 2' : 'auto',
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={m.courseId}
                courseName={m.courseName}
                imageUrl={m.thumbnail}
                initialsSize={tall ? 30 : 20}
                style={{ position: 'absolute', inset: 0 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(0deg, rgba(10,14,10,0.55) 0%, rgba(10,14,10,0) 45%)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    bottom: 7,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.01em',
                    textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                  }}
                >
                  {m.courseName ?? t('discover.unknownCourse', 'Course')}
                </span>
                {m.mediaType === 'video' && <PlayGlyph />}
              </CourseImageFallback>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MomentsOfTheWeek;
