/**
 * ViewAllFooter - Proper button with category accent
 * 
 * Features:
 * - Full-width button styling
 * - Category accent color throughout
 * - Hover state with deeper accent
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';

interface ViewAllFooterProps {
  categoryName: string;
  accentColor: CategoryId;
}

export const ViewAllFooter = memo(function ViewAllFooter({ categoryName, accentColor }: ViewAllFooterProps) {
  const navigate = useNavigate();
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <button
        onClick={() => navigate('/tourhub/stats')}
        className="w-full flex items-center justify-center transition-all duration-300 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ 
          padding: '12px',
          background: accent.bgLight,
          border: `1px solid ${accent.border}`,
          borderRadius: '12px',
          gap: '6px',
          outlineColor: accent.primary,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = accent.bgMedium;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = accent.bgLight;
        }}
      >
        <span style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: accent.primary,
          transition: 'color 0.3s ease',
        }}>
          View All {categoryName} Stats
        </span>
        <ChevronRight size={14} style={{ color: accent.primary }} />
      </button>
    </div>
  );
});
