import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

/**
 * Unified glass button for Create Moment flows.
 * Primary uses the premium accent color, secondary is neutral glass.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "text-white font-medium",
      "shadow-[0_4px_16px_rgba(245,158,11,0.25)]",
      "hover:from-orange-500/95 hover:to-orange-600/95",
      "disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:shadow-none"
    ),
    secondary: cn(
      "bg-white/80 dark:bg-slate-800/80",
      "backdrop-blur-md",
      "border border-slate-200/60 dark:border-slate-700/60",
      "text-foreground",
      "shadow-sm",
      "hover:bg-white/90 dark:hover:bg-slate-800/90",
      "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
    ),
    ghost: cn(
      "bg-transparent",
      "text-muted-foreground",
      "hover:bg-slate-100/60 dark:hover:bg-slate-800/60",
      "hover:text-foreground"
    ),
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "rounded-full",
        "font-medium",
        "transition-all duration-200",
        "active:scale-[0.98]",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

export default GlassButton;
