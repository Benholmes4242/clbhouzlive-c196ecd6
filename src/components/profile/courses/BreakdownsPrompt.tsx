import React from 'react';
import { Plus, Star, ChevronRight } from 'lucide-react';

interface BreakdownsPromptProps {
  missingCount: number;
  onTap: () => void;
  variant?: 'breakdowns' | 'review';
}

/**
 * Page-level prompt at the top of AllCoursesList. Replaces the per-card
 * "Add breakdowns" amber CTAs. Hidden entirely when missingCount === 0.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({
  missingCount,
  onTap,
  variant = 'breakdowns',
}) => {
  if (missingCount === 0) return null;

  const isReview = variant === 'review';

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'rgba(15,23,42,0.03)',
        border: '1px solid rgba(15,23,42,0.06)',
        borderRadius: 10,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'rgba(15,23,42,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isReview ? (
          <Star size={12} color="#475569" strokeWidth={2.5} />
        ) : (
          <Plus size={12} color="#475569" strokeWidth={2.5} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: '#0F172A',
            letterSpacing: '-0.005em',
          }}
        >
          {isReview ? (
            <>
              {missingCount} {missingCount === 1 ? 'course' : 'courses'} you still need to review
            </>
          ) : (
            <>
              Add breakdowns to {missingCount}{' '}
              {missingCount === 1 ? 'course' : 'courses'}
            </>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#94A3B8',
            marginTop: 1,
          }}
        >
          {isReview
            ? 'Courses you have played but not yet rated'
            : 'For more detailed ratings on each card'}
        </div>
      </div>
      <ChevronRight size={14} color="#CBD5E1" strokeWidth={2} />
    </button>
  );
};

export default BreakdownsPrompt;
