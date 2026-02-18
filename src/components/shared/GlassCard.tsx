import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

/**
 * Standard glass card component.
 * Shared style across Golfers list cards, Games list cards, and Echo robot tile.
 * Consistent radius, stroke, and shadow.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  onClick,
  interactive = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "backdrop-blur-[12px] rounded-sq-md border overflow-hidden",
        interactive && "cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderColor: 'var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
