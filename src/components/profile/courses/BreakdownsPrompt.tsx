import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';

interface BreakdownsPromptProps {
  missingCount: number;
  onTap: () => void;
}

/**
 * Page-level prompt at the top of AllCoursesList. Replaces the per-card
 * "Add breakdowns" amber CTAs. Hidden entirely when missingCount === 0.
 */
const BreakdownsPrompt: React.FC<BreakdownsPromptProps> = ({
  missingCount,
  onTap,
}) => {
  if (missingCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(247, 147, 30, 0.08)',
        border: '1px solid rgba(247, 147, 30, 0.22)',
        borderRadius: 10,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: 'rgba(247, 147, 30, 0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Plus size={14} color="#C97211" strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.005em',
          }}
        >
          Add breakdowns to {missingCount}{' '}
          {missingCount === 1 ? 'course' : 'courses'}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#64748B',
            marginTop: 2,
          }}
        >
          For more detailed ratings on each card
        </div>
      </div>
      <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
    </button>
  );
};

export default BreakdownsPrompt;
