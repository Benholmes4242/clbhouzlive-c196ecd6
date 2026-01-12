import React from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

/**
 * Glass-styled input field with optional icon and label.
 */
export const GlassInput: React.FC<GlassInputProps> = ({
  icon,
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
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full h-11 rounded-xl",
            "bg-slate-50/80 dark:bg-slate-800/40",
            "border border-slate-200/50 dark:border-slate-700/40",
            "shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",
            "text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300/50",
            "transition-all duration-200",
            icon ? "pl-11 pr-4" : "px-4",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};

export default GlassInput;
