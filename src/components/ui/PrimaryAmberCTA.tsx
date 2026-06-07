/**
 * PrimaryAmberCTA — The canonical primary action button.
 *
 * Used for "do the main thing" moments: write the first review, share your
 * experience, send a message, enable notifications, etc.
 *
 * Visual spec:
 *   - linear-gradient(90deg, #F59E0B, #F7931E) bg
 *   - white text, 14/800
 *   - 0 4px 16px rgba(247,147,30,0.28) glow
 *   - 12 border-radius
 *
 * Sizes:
 *   - sm — 11px vertical padding, 12/700 text
 *   - md (default) — 13px vertical padding, 14/800 text
 *   - lg — 16px vertical padding, 15/800 text
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface PrimaryAmberCTAProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: React.ReactNode;
  /** Size variant. Default: 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to container width. Default: true. */
  fullWidth?: boolean;
  /** Optional leading icon (small SVG element). */
  leadingIcon?: React.ReactNode;
  /** Loading state — replaces children with spinner; disables button. */
  loading?: boolean;
}

export const PrimaryAmberCTA: React.FC<PrimaryAmberCTAProps> = ({
  children,
  size = 'md',
  fullWidth = true,
  leadingIcon,
  loading = false,
  className,
  disabled,
  style,
  ...rest
}) => {
  const sizeStyles: Record<NonNullable<PrimaryAmberCTAProps['size']>, React.CSSProperties> = {
    sm: { padding: '11px 16px', fontSize: 12, fontWeight: 700 },
    md: { padding: '13px 20px', fontSize: 14, fontWeight: 800 },
    lg: { padding: '16px 24px', fontSize: 15, fontWeight: 800 },
  };

  const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        className,
      )}
      style={{
        background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(247,147,30,0.28)',
        borderRadius: 12,
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...sizeStyles[size],
        ...style,
      }}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="8"
          />
        </svg>
      ) : (
        <>
          {leadingIcon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default PrimaryAmberCTA;
