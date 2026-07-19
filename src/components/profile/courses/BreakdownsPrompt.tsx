import React from 'react';
import { Plus, Star } from 'lucide-react';

interface BreakdownsPromptProps {
  missingCount: number;
  onTap: () => void;
  variant?: 'breakdowns' | 'review';
}

/**
 * Page-level prompt at the top of AllCoursesList. Mirrors the amber
 * "Played here?" hero tile from Course Details About tab
 * (CourseStatusToggle) — soft amber gradient surface, 1.5px amber
 * hairline, 46px squircle icon, amber pill CTA.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({
  missingCount,
  onTap,
  variant = 'breakdowns',
}) => {
  if (missingCount === 0) return null;

  const isReview = variant === 'review';
  const noun = missingCount === 1 ? 'course' : 'courses';

  const title = isReview
    ? `${missingCount} ${noun} to review`
    : `Add breakdowns to ${missingCount} ${noun}`;

  const sub = isReview
    ? 'Your ratings help golfers worldwide'
    : 'Sharpen your scores by category';

  const cta = isReview ? 'Review' : 'Add';

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 18,
        cursor: 'pointer',
        textAlign: 'left',
        background: 'linear-gradient(135deg, rgba(247,147,30,0.07), rgba(247,147,30,0.02))',
        border: '1.5px solid rgba(247,147,30,0.15)',
        fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
        }}
      >
        {isReview ? (
          <Star size={22} color="#fff" fill="#fff" strokeWidth={0} />
        ) : (
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          padding: '9px 18px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          border: 'none',
          background: '#F7931E',
          boxShadow: '0 4px 14px rgba(247,147,30,0.3)',
        }}
      >
        {cta}
      </span>
    </button>
  );
};

export default BreakdownsPrompt;
