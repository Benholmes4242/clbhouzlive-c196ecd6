/**
 * PersonalReviewCard - User's own review display, flat white card
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Calendar, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';

import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { useNavigate } from 'react-router-dom';
import { formatMonthDayYearShort } from '@/i18n/format';
import { getRatingTier } from '@/lib/ratingTier';
import { SubScoreBar, bandColor } from '@/features/courses/_shared/scoreBands';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';

// Computed once — reduced-motion users get static gold rings/bars.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ReviewText component with line clamping
const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = stripMentionMarkup(text).length > 180;

  return (
    <div style={{ paddingTop: 14, borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: '#475569',
          fontStyle: 'italic',
          margin: 0,
          whiteSpace: 'pre-wrap',
          display: !expanded && needsClamp ? '-webkit-box' : 'block',
          WebkitLineClamp: !expanded && needsClamp ? 4 : 'unset',
          WebkitBoxOrient: 'vertical',
          overflow: !expanded && needsClamp ? 'hidden' : 'visible',
        }}
      >
        "<MentionText as="span" text={text} />"
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            color: '#94A3B8',
            padding: '6px 0 0',
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

interface PersonalReviewCardProps {
  courseId: string;
  rating: UserCourseRating;
  communityAverage?: number | null;
  className?: string;
}

export const PersonalReviewCard: React.FC<PersonalReviewCardProps> = ({
  courseId,
  rating,
  communityAverage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');

  const handleEditClick = () => {
    navigate(`/courses/${courseId}/rate`);
  };

  const dateValue = rating.updated_at || rating.created_at;
  const dateLabel = formatMonthDayYearShort(new Date(dateValue));

  const categories = [
    { key: 'design', labelKey: 'review.subscore.design', score: rating.design_score },
    { key: 'condition', labelKey: 'review.subscore.condition', score: rating.condition_score },
    { key: 'clubhouse', labelKey: 'review.subscore.clubhouse', score: rating.clubhouse_score },
    { key: 'facilities', labelKey: 'review.subscore.facilities', score: rating.facilities_score },
  ].filter(
    (c): c is { key: string; labelKey: string; score: number } => c.score !== null,
  );

  const highlightCategories = categories
    .filter(c => c.score >= 9.0)
    .map(c => ({ key: c.key, labelKey: c.labelKey }));


  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderRadius: 14,
        boxShadow: '0 1px 6px rgba(15,23,42,0.05)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{t('phase5.personalReview.title')}</h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar style={{ width: 12, height: 12 }} />
            {t('phase5.personalReview.playedOn', { date: dateLabel })}
          </p>
          {communityAverage != null && communityAverage > 0 && (() => {
            const diff = Number((rating.rating - communityAverage).toFixed(1));
            const absDiff = Math.abs(diff);
            const pill: React.CSSProperties = {
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              marginTop: 8,
            };
            if (absDiff < 0.2) {
              return (
                <span style={{ ...pill, background: 'rgba(15,23,42,0.05)', color: '#64748B' }}>
                  <CheckCircle2 style={{ width: 12, height: 12 }} /> {t('phase5.personalReview.matchesConsensus')}
                </span>
              );
            }
            if (diff > 0) {
              return (
                <span style={{ ...pill, background: 'rgba(22,163,74,0.08)', color: '#16A34A' }}>
                  <ArrowUp style={{ width: 12, height: 12 }} /> {t('phase5.personalReview.aboveAvg', { diff: absDiff.toFixed(1) })}
                </span>
              );
            }
            return (
              <span style={{ ...pill, background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                <ArrowDown style={{ width: 12, height: 12 }} /> {t('phase5.personalReview.belowAvg', { diff: absDiff.toFixed(1) })}
              </span>
            );
          })()}
        </div>
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: '#64748B',
            padding: 4,
          }}
        >
          <Pencil style={{ width: 12, height: 12 }} />
          {t('common:action.edit')}
        </button>
      </div>

      {/* Headline figure + category bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: highlightCategories.length > 0 || rating.review ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: bandColor(rating.rating),
            }}
          >
            {rating.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(15,23,42,0.25)', letterSpacing: '-0.02em' }}>
            /10
          </span>
        </div>
        {categories.length > 0 && (
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 14, rowGap: 8 }}>
            {categories.map((cat) => (
              <SubScoreBar key={cat.key} label={t(cat.labelKey)} score={cat.score} />
            ))}
          </div>
        )}
      </div>

      {/* Highlight pills */}
      {highlightCategories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: rating.review ? 14 : 0 }}>
          {highlightCategories.map(cat => (
            <span
              key={cat.key}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#F7931E',
                background: 'rgba(247,147,30,0.08)',
                border: '1px solid rgba(247,147,30,0.2)',
                padding: '4px 10px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {t(cat.labelKey)}
            </span>
          ))}

        </div>
      )}

      {/* Review text */}
      {rating.review && <ReviewText text={rating.review} />}
    </div>
  );
};

export default PersonalReviewCard;
