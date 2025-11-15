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
        background: 'rgba(22, 24, 27, 0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <button
        onClick={onBack}
        className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
        aria-label="Back"
      >
        ‹ Back
      </button>
      <h1 className="text-white/90 text-[17px] font-semibold">{title}</h1>
      <div className={rightAction ? '' : 'w-16'}>
        {rightAction || null}
      </div>
    </header>
  );
}
