import React from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassPillProps {
  children: React.ReactNode;
  variant?: 'default' | 'input' | 'button';
  className?: string;
  onClick?: () => void;
}

/**
 * Liquid Glass pill component.
 * Premium translucent effect with gradient and saturation.
 */
export const FrostedPill: React.FC<LiquidGlassPillProps> = ({
  children,
  variant = 'default',
  className,
  onClick
}) => {
  const baseStyles = [
    "rounded-full border transition-all",
    "backdrop-blur-[50px] backdrop-saturate-[180%]",
    "bg-gradient-to-br from-white/18 via-white/10 to-white/14",
    "border-white/15",
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
  ].join(" ");

  return (
    <div
      onClick={onClick}
      className={cn(
        baseStyles,
        variant === 'input' && "px-4 py-2",
        variant === 'button' && "px-4 py-2 hover:from-white/22 hover:via-white/14 hover:to-white/18 active:from-white/28 active:via-white/20 active:to-white/24 cursor-pointer",
        variant === 'default' && "px-3 py-1.5",
        className
      )}
    >
      {children}
    </div>
  );
};
