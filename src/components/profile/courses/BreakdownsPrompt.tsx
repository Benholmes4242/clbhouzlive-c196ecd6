import React from 'react';
import { Plus, Star, ChevronRight } from 'lucide-react';

interface BreakdownsPromptProps {
  missingCount: number;
  onTap: () => void;
  variant?: 'breakdowns' | 'review';
}

const AMBER = '#F7931E';

/**
 * Page-level prompt at the top of AllCoursesList. Mirrors the amber "Rate It"
 * CTA tile used in the Course Details About tab (CommunityScoreCard empty state).
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({
  missingCount,
  onTap,
  variant = 'breakdowns',
}) => {
  if (missingCount === 0) return null;

  const isReview = variant === 'review';

  const label = isReview
    ? `${missingCount} ${missingCount === 1 ? 'course' : 'courses'} you still need to review`
    : `Add breakdowns to ${missingCount} ${missingCount === 1 ? 'course' : 'courses'}`;

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '13px 16px',
        borderRadius: 13,
        background: AMBER,
        border: 'none',
        color: '#fff',
        fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(247,147,30,0.28)',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isReview ? (
          <Star size={13} color="#fff" strokeWidth={2.5} />
        ) : (
          <Plus size={13} color="#fff" strokeWidth={2.5} />
        )}
      </div>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          color: '#fff',
        }}
      >
        {label}
      </span>
      <ChevronRight size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
    </button>
  );
};

export default BreakdownsPrompt;

