import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useRateNudgeCourse } from '@/hooks/useRateNudgeCourse';
import { AMBER, HAIRLINE_INK_10, INK, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import CourseImageFallback from '@/components/whs/CourseImageFallback';

interface Props {
  userId: string;
  onEmptyFallback: () => void;
}

const RateNudge: React.FC<Props> = ({ userId, onEmptyFallback }) => {
  const navigate = useNavigate();
  const { course, loading } = useRateNudgeCourse(userId);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: 76,
          marginTop: 10,
          marginBottom: 10,
          background: SURFACE,
          border: `1px solid ${HAIRLINE_INK_10}`,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
        }}
        className="animate-pulse"
        aria-busy="true"
      />
    );
  }

  if (!course) {
    return (
      <button
        onClick={onEmptyFallback}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginTop: 10,
          marginBottom: 10,
          background: 'rgba(247,147,30,0.05)',
          border: '1px solid rgba(247,147,30,0.18)',
          borderRadius: 12,
          cursor: 'pointer',
        }}
        className="active:scale-[0.97] transition-all"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={14} fill={AMBER} color={AMBER} strokeWidth={0} />
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            Rate a course you've played
          </span>
        </div>
        <ChevronRight size={14} color="#c97a10" strokeWidth={2.5} />
      </button>
    );
  }

  const eyebrow = course.tier === 'played' ? "YOU HAVEN'T RATED YET" : 'TRY RATING';
  const sub =
    course.tier === 'played'
      ? `${course.region ? `${course.region} · ` : ''}Played, not rated`
      : `${course.region ?? 'Suggested for you'}`;

  return (
    <button
      onClick={() => navigate(`/courses/${course.courseId}/rate`)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        background: SURFACE,
        border: `1px solid ${HAIRLINE_INK_10}`,
        borderRadius: 14,
        cursor: 'pointer',
        textAlign: 'left',
      }}
      className="active:scale-[0.985] transition-all"
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#0f172a',
        }}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <CourseImageFallback flagOpacity={0.18} />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: AMBER,
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: INK_MUTE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sub}
        </div>
      </div>

      {/* Rate pill */}
      <div
        style={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          background: AMBER,
          color: '#fff',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        <Star size={12} fill="#fff" color="#fff" strokeWidth={0} />
        Rate
      </div>
    </button>
  );
};

export default RateNudge;
