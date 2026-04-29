import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

interface OpaqueHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Standard opaque header for feature pages.
 * Fixed, solid background, with divider. z-index above overlays.
 * Respects safe areas.
 */
export const OpaqueHeader: React.FC<OpaqueHeaderProps> = ({
  title,
  onBack,
  rightAction,
  className
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex items-center justify-between min-h-14 px-4 border-b",
        "backdrop-blur-xl",
        className
      )}
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        background: 'var(--surface-slate)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/90 hover:text-white text-body-md font-medium transition-colors -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      ) : (
        <div className="w-16" />
      )}
      
      <h1 className="text-white/90 text-body-lg font-semibold">
        {title}
      </h1>
      
      {rightAction || <div className="w-16" />}
    </header>
  );
};
