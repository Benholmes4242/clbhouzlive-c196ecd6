import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-foreground text-background hover:opacity-90',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
  ghost:     'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger:    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  outline:   'border border-border/60 text-foreground hover:bg-muted hover:border-border',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-lg',
  lg: 'h-10 px-5 text-[13.5px] gap-2 rounded-xl',
};

export function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading,
  icon: Icon,
  iconPosition = 'left',
  children,
  disabled,
  className,
  ...props
}: AdminButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-100',
        'active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-border',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {loading && iconPosition === 'left' && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      )}
      {loading && iconPosition === 'right' && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      )}
    </button>
  );
}
