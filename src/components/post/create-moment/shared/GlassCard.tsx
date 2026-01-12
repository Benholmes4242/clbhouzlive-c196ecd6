import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  variant?: 'default' | 'input' | 'option';
}

/**
 * Glass card component for inputs, options, and content blocks.
 * Consistent styling across all Create Moment sheets.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  interactive = false,
  selected = false,
  variant = 'default',
  ...props
}) => {
  const variantClasses = {
    default: cn(
      "bg-white/70 dark:bg-slate-800/60",
      "border border-slate-200/60 dark:border-slate-700/50"
    ),
    input: cn(
      "bg-slate-50/80 dark:bg-slate-800/40",
      "border border-slate-200/50 dark:border-slate-700/40",
      "shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
    ),
    option: cn(
      selected 
        ? "bg-orange-50/80 dark:bg-orange-900/20 border-orange-300/60 dark:border-orange-500/40 ring-2 ring-orange-500/20"
        : "bg-white/60 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/40"
    ),
  };

  return (
    <div
      className={cn(
        "rounded-2xl backdrop-blur-sm",
        variantClasses[variant],
        interactive && "cursor-pointer transition-all duration-200 hover:bg-white/90 dark:hover:bg-slate-800/70 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
