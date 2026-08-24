import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { X } from 'lucide-react';
import { useUnseenFriendReviews } from '@/hooks/useUnseenFriendReviews';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

const AMBER = '#F7931E';

export function UnseenReviewsBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const { hasUnseen, unseenReviews, unseenCount, markCoursesAsSeen } = useUnseenFriendReviews();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUnseen || dismissed || unseenReviews.length === 0) return null;

  const latest = unseenReviews[0];
  const extraCount = unseenCount - 1;

  const handleTap = () => {
    markCoursesAsSeen();
    setDismissed(true);
    navigate(`/courses/${latest.course_id}?tab=reviews&review=${latest.id}`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    markCoursesAsSeen();
    setDismissed(true);
  };

  return (
    <div
      onClick={handleTap}
      className="relative mx-4 flex items-center gap-3 rounded-2xl border cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        padding: '12px 16px',
        borderColor: `${AMBER}40`,
        background: `linear-gradient(135deg, ${AMBER}12 0%, ${AMBER}06 100%)`,
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <SquircleAvatar
          size={40}
          src={latest.reviewer_avatar}
          alt={latest.reviewer_name}
          fallback={latest.reviewer_name.slice(0, 2).toUpperCase()}
          hairlineRing
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground leading-tight">
          {t('network.unseenReviewsTitle')}
        </p>
        <p className="text-[13px] text-foreground leading-snug mt-0.5 truncate">
          <Trans
            i18nKey="network.unseenReviewsBody"
            ns="courses"
            values={{
              name: latest.reviewer_name,
              course: latest.course_name,
              rating: Number(latest.rating).toFixed(1),
            }}
            components={{
              name: <span className="font-bold" />,
              course: <span className="font-semibold" />,
              rating: <span style={{ color: AMBER, fontWeight: 700 }} />,
            }}
          />
          {extraCount > 0 && (
            <span className="text-muted-foreground">
              {t('network.unseenReviewsMore', { count: extraCount })}
            </span>
          )}
        </p>
      </div>

      {/* Tap hint */}
      <span
        className="flex-shrink-0 text-[11px] font-bold"
        style={{ color: AMBER }}
      >
        {t('network.viewArrow')}
      </span>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-1 rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
