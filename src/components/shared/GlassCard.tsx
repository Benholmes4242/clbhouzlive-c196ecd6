import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
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
  interactive = false
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "backdrop-blur-[12px] rounded-xl border overflow-hidden",
        interactive && "cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      style={{
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.08))',
        borderColor: 'var(--border-hairline, rgba(255, 255, 255, 0.15))',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {children}
    </div>
  );
};
