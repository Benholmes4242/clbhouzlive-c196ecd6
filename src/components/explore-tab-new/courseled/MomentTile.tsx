import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import type { Moment } from './hooks/useMomentsOfTheWeek';

/**
 * MOMENT TILE — the one tile used by BOTH the page mosaic and the sheet grid,
 * so the course label, scrim and 28px glass play glyph on video can never
 * diverge between the two surfaces.
 */

export function MomentPlayGlyph() {
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

interface TileProps {
  moment: Moment;
  onPress: (m: Moment) => void;
  radius: number;
  initialsSize: number;
  labelSize: number;
  labelInset: number;
  scrimStop: string;
  /**
   * FALSE drops the course label AND the scrim together — the scrim exists only
   * to keep the label legible, so without a label it is just a dark wash over a
   * photograph. Used by the SHEET, where the course name is a group header and
   * restating it on every tile says nothing new. Defaults TRUE so the page
   * mosaic is untouched.
   */
  labelled?: boolean;
  style?: React.CSSProperties;
}

export function MomentTile({
  moment: m,
  onPress,
  radius,
  initialsSize,
  labelSize,
  labelInset,
  scrimStop,
  labelled = true,
  style,
}: TileProps) {
  const { t } = useTranslation('courses');
  return (
    <button
      type="button"
      onClick={() => onPress(m)}
      style={{
        position: 'relative',
        padding: 0,
        border: 'none',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
    >
      <CourseImageFallback
        courseId={m.courseId}
        courseName={m.courseName}
        imageUrl={m.thumbnail}
        initialsSize={initialsSize}
        style={{ position: 'absolute', inset: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(0deg, rgba(10,14,10,0.6) 0%, rgba(10,14,10,0) ${scrimStop})`,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: labelInset,
            right: labelInset,
            bottom: labelInset - 1,
            fontSize: labelSize,
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
        {m.mediaType === 'video' && <MomentPlayGlyph />}
      </CourseImageFallback>
    </button>
  );
}

export default MomentTile;
