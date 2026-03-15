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
  primary:   'bg-[#F5A623] text-white font-semibold hover:bg-[#E8920F] shadow-[0_1px_3px_rgba(245,166,35,0.3)]',
  secondary: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] hover:bg-[#E2E8F0]',
  ghost:     'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155]',
  danger:    'bg-[#FFF1F2] text-[#F31260] border border-[#FECDD3] hover:bg-[#FFE4E6]',
  outline:   'border border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-[10px]',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-[10px]',
  lg: 'h-10 px-5 text-[13.5px] gap-2 rounded-[10px]',
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
        'active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2E8F0]',
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
