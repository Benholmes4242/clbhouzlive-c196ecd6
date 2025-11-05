/**
 * Hub Page Header
 * 
 * Shared header component for all Hub full-screen pages.
 * Handles back navigation to Hub and proper fallback for deep links.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { useHub } from '../useHub';
import { TapButton } from '@/components/ui/TapButton';

interface HubPageHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export function HubPageHeader({ title, rightAction }: HubPageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useHub();

  const goBack = () => {
    const state = location.state as { backgroundLocation?: Location; fromHub?: boolean } | null;
    
    if (state?.backgroundLocation) {
      // Came from Hub - reopen Hub over the same origin
      open();
      navigate(-1);
    } else {
      // Deep link - no background → fallback to clubhouse
      navigate('/clubhouse', { replace: true });
    }
  };

  return (
    <div 
      className="relative z-30 shrink-0"
      style={{
        background: 'transparent',
        borderBottom: '1px solid var(--hub-header-stroke)',
      }}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <TapButton
            onPointerDown={goBack}
            className="transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -ml-2"
            style={{ color: 'var(--hub-close-idle)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-close-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-close-idle)'}
            aria-label="Back to Hub"
          >
            <ChevronLeft className="w-6 h-6" />
          </TapButton>

          <h1 
            className="text-lg font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ color: 'var(--hub-text)' }}
          >
            {title}
          </h1>

          {rightAction && (
            <div className="w-11 h-11 flex items-center justify-center">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
