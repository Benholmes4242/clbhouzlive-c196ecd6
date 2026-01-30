import React from 'react';
import { cn } from '@/lib/utils';

interface FrostedPillProps {
  children: React.ReactNode;
  variant?: 'default' | 'input' | 'button';
  className?: string;
  onClick?: () => void;
}

/**
 * Frosted white pill component.
 * Shared style for input/search pills, "Open to Play", and Echo composer.
 * Consistent frosted-white appearance.
 */
export const FrostedPill: React.FC<FrostedPillProps> = ({
  children,
  variant = 'default',
  className,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "backdrop-blur-md rounded-full border transition-all",
        variant === 'input' && "bg-white/15 border-white/20 px-4 py-2",
        variant === 'button' && "bg-white/15 border-white/20 px-4 py-2 hover:bg-white/25 active:bg-white/35 cursor-pointer",
        variant === 'default' && "bg-white/15 border-white/20 px-3 py-1.5",
        className
      )}
    >
      {children}
    </div>
  );
};
