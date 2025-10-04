import * as React from 'react';
import { cn } from '@/lib/utils';

type AnalyzeButtonProps = {
  isAnalyzing?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;           // allow layout overrides
  children?: React.ReactNode;   // default label can be overridden
  ariaLabel?: string;
};

export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
  isAnalyzing = false,
  disabled = false,
  onClick,
  className,
  children,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isAnalyzing}
      aria-busy={isAnalyzing}
      aria-live="polite"
      aria-label={ariaLabel ?? (isAnalyzing ? 'Analyzing swing' : 'Analyze swing')}
      className={cn(
        // size + layout
        'relative w-full h-12 rounded-full select-none',
        // glassmorphic background
        'backdrop-blur-md bg-[linear-gradient(135deg,rgba(255,255,255,0.45),rgba(240,250,240,0.24))]',
        // border + depth
        'border border-[rgba(110,146,119,0.35)] shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
        // motion
        'transition-all active:scale-[0.98]',
        // soft pulse when idle
        !isAnalyzing && 'animate-echoPulse',
        // disabled fade
        (disabled || isAnalyzing) && 'opacity-90',
        className
      )}
    >
      {/* optional subtle inner glow when not analyzing */}
      {!isAnalyzing && (
        <span className="pointer-events-none absolute inset-0 rounded-full
                         shadow-[inset_0_0_0_0_rgba(110,146,119,0.15)]" />
      )}
      <span className="relative z-[1] font-semibold text-gray-900/90">
        {children ?? (isAnalyzing ? 'Analyzing…' : 'Analyze Swing')}
      </span>
    </button>
  );
};

export default AnalyzeButton;
