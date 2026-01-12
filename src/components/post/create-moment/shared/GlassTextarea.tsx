import React from 'react';
import { cn } from '@/lib/utils';

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

/**
 * Glass-styled textarea for captions and longer text input.
 */
export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full min-h-[100px] rounded-xl resize-none",
          "bg-slate-50/80 dark:bg-slate-800/40",
          "border border-slate-200/50 dark:border-slate-700/40",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",
          "text-foreground placeholder:text-muted-foreground/70",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300/50",
          "transition-all duration-200",
          "p-4",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default GlassTextarea;
