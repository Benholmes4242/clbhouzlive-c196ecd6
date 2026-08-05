import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { CourseImageFallback } from './CourseImageFallback';
import type { Moment } from './hooks/useMomentsOfTheWeek';
import { A, KICKER, SANS } from './tokens';

/**
 * MOMENTS SHEET — the full week of member media, course-labelled (BRIEF,
 * section 4 "See all"). A three-column grid, one tile per course-moment; the
 * tile hands the shared fullscreen viewer the same read-only payload the
 * mosaic does.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  moments: Moment[];
  onTilePress: (m: Moment) => void;
}

export function MomentsSheet({ open, onClose, moments, onTilePress }: Props) {
  const { t } = useTranslation('courses');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-moments-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: '82dvh',
        maxHeight: '82dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ ...KICKER, color: A.DIM, marginBottom: 5 }}>
          {t('discover.momentsOverline', {
            defaultValue: '{{count}} courses',
            count: moments.length,
          })}
        </div>
        <div
          id="courseled-moments-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {t('discover.momentsOfTheWeek', 'Moments of the week')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
          }}
        >
          {moments.map((m, i) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onTilePress(m)}
              style={{
                position: 'relative',
                padding: 0,
                border: 'none',
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={m.courseId}
                courseName={m.courseName}
                imageUrl={m.thumbnail}
                initialsSize={18}
                style={{ position: 'absolute', inset: 0 }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(0deg, rgba(10,14,10,0.6) 0%, rgba(10,14,10,0) 50%)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    bottom: 5,
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                  }}
                >
                  {m.courseName ?? t('discover.unknownCourse', 'Course')}
                </span>
              </CourseImageFallback>
            </button>
          ))}
        </div>
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default MomentsSheet;
