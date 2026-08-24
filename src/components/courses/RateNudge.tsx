import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useRateNudgeCourse } from '@/hooks/useRateNudgeCourse';
import { AMBER, HAIRLINE_INK_10, INK, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import CourseImageFallback from '@/components/whs/CourseImageFallback';
import { Skeleton } from '@/components/ui/skeleton';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  userId: string;
  onEmptyFallback: () => void;
}

const RateNudge: React.FC<Props> = ({ userId, onEmptyFallback }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { course, loading } = useRateNudgeCourse(userId);

  if (loading) {
    return (
      <Skeleton
        aria-busy="true"
        style={{
          width: '100%',
          height: 76,
          marginBottom: 12,
          borderRadius: 14,
        }}
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
          marginBottom: 12,
           background: 'rgba(247,147,30,0.10)',
           border: '1px solid rgba(247,147,30,0.42)',
          borderRadius: 12,
          cursor: 'pointer',
        }}
        className="active:scale-[0.97] transition-all"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Star size={14} fill={AMBER} color={AMBER} strokeWidth={0} />
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            {t('rateNudge.emptyLabel')}
          </span>
        </div>
        <ChevronRight size={14} color={AMBER} strokeWidth={2.5} />
      </button>
    );
  }

  const eyebrow =
    course.tier === 'played' ? t('rateNudge.playedEyebrow') : t('rateNudge.suggestedEyebrow');
  const playedSub = course.region
    ? t('rateNudge.playedSubWithRegion', { region: course.region })
    : t('rateNudge.playedSubNoRegion');
  const sub = course.tier === 'played' ? playedSub : (course.region ?? t('rateNudge.suggestedForYou'));

  return (
    <button
      onClick={() => navigate(`/courses/${course.courseId}/rate`)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        padding: 10,
        marginBottom: 12,
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
           background: 'rgba(255,255,255,0.06)',
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
             color: 'rgba(248,250,252,0.62)',
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
          background: A.INK,
           color: A.CANVAS,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {t('rateNudge.rateCta')}
      </div>
    </button>
  );
};

export default RateNudge;
