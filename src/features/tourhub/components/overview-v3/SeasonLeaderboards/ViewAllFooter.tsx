/**
 * ViewAllFooter - Inside-card footer with View All link
 * 
 * Features:
 * - Clbhouz green text
 * - Top border only
 * - No icon before text
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface ViewAllFooterProps {
  categoryName: string;
}

export const ViewAllFooter = memo(function ViewAllFooter({ categoryName }: ViewAllFooterProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/tourhub/stats')}
      className="w-full flex items-center justify-center transition-colors duration-120 hover:bg-[rgba(22,90,50,0.03)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
      style={{ 
        padding: '14px 0',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#165A32' }}>
        View All {categoryName} Stats
      </span>
      <ChevronRight size={14} style={{ color: '#165A32' }} />
    </button>
  );
});
