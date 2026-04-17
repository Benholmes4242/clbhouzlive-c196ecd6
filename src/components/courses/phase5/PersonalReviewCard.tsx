/**
 * PersonalReviewCard - User's own review display, flat white card
 */
import React, { useState } from 'react';
import { Pencil, Calendar } from 'lucide-react';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getScoreRingColors } from '@/hooks/useTierStyles';

// ReviewText component with line clamping
const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = text.length > 180;

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
        "{text}"
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

// Score ring SVG component
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => {
  const { from, to } = getScoreRingColors(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const gradientId = `scoreGradient-${Math.random().toString(36).slice(2)}`;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={`url(#${gradientId})`}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

interface PersonalReviewCardProps {
  courseId: string;
  rating: UserCourseRating;
  className?: string;
}

export const PersonalReviewCard: React.FC<PersonalReviewCardProps> = ({
  courseId,
  rating,
}) => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`/courses/${courseId}/rate`);
  };

  const dateValue = rating.updated_at || rating.created_at;
  const dateLabel = format(new Date(dateValue), 'MMM d, yyyy');

  const categories = [
    { label: 'Design', score: rating.design_score },
    { label: 'Condition', score: rating.condition_score },
    { label: 'Clubhouse', score: rating.clubhouse_score },
    { label: 'Facilities', score: rating.facilities_score },
  ].filter((c): c is { label: string; score: number } => c.score !== null);

  const highlightCategories = categories
    .filter(c => c.score >= 9.0)
    .map(c => c.label);

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
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>Your Rating</h3>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar style={{ width: 12, height: 12 }} />
            Played on {dateLabel}
          </p>
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
          Edit
        </button>
      </div>

      {/* Score ring + category breakdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: highlightCategories.length > 0 || rating.review ? 14 : 0 }}>
        <ScoreRing score={rating.rating} size={80} />
        {categories.length > 0 && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 14, rowGap: 8 }}>
            {categories.map(cat => (
              <div key={cat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#94A3B8' }}>{cat.label}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                    {cat.score.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(245,158,11,0.08)' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      width: `${(cat.score / 10) * 100}%`,
                      background: 'linear-gradient(to right, #F59E0B, #F7931E)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlight pills */}
      {highlightCategories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: rating.review ? 14 : 0 }}>
          {highlightCategories.map(label => (
            <span
              key={label}
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
              ★ {label}
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
