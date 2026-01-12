import React from 'react';
import { cn } from '@/lib/utils';

interface GlassChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Glass chip/pill component for filters, categories, and selections.
 * Selected state has premium glow effect.
 */
export const GlassChip: React.FC<GlassChipProps> = ({
  children,
  selected = false,
  icon,
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-7 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-full",
        "font-medium",
        "transition-all duration-200",
        "active:scale-[0.97]",
        sizeClasses[size],
        selected
          ? cn(
              "bg-gradient-to-br from-orange-500/90 to-orange-600/90",
              "text-white",
              "shadow-[0_2px_12px_rgba(245,158,11,0.3)]",
              "border border-orange-400/30"
            )
          : cn(
              "bg-slate-100/80 dark:bg-slate-800/60",
              "text-slate-600 dark:text-slate-300",
              "border border-slate-200/50 dark:border-slate-700/50",
              "hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            ),
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export default GlassChip;
