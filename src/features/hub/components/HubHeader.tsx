/**
 * HubHeader - Shared header component for Hub pages
 */
import React from 'react';

interface HubHeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export function HubHeader({ title, onBack, rightAction }: HubHeaderProps) {
  return (
    <header 
      id="hub-header"
      className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
      style={{
        borderColor: 'var(--hub-stroke)',
        background: 'var(--hub-header-bg)',
        boxShadow: 'var(--hub-header-shadow)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <button
        onClick={onBack}
        className="text-[15px] font-medium transition-colors"
        style={{ color: 'var(--hub-text-body)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
        aria-label="Back"
      >
        ‹ Back
      </button>
      <h1 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text)' }}>{title}</h1>
      <div className={rightAction ? '' : 'w-16'}>
        {rightAction || null}
      </div>
    </header>
  );
}
