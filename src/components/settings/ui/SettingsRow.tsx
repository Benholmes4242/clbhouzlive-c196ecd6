import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Icon color theme for sections */
export type IconTheme = 'account' | 'creator' | 'privacy' | 'notifications' | 'security' | 'support' | 'legal' | 'danger' | 'default';

const iconThemeStyles: Record<IconTheme, { bg: string; text: string }> = {
  account: { bg: 'bg-blue-50', text: 'text-blue-500' },
  creator: { bg: 'bg-purple-50', text: 'text-purple-500' },
  privacy: { bg: 'bg-green-50', text: 'text-green-500' },
  notifications: { bg: 'bg-amber-50', text: 'text-amber-500' },
  security: { bg: 'bg-red-50', text: 'text-red-500' },
  support: { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  legal: { bg: 'bg-gray-100', text: 'text-gray-500' },
  danger: { bg: 'bg-red-100', text: 'text-red-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

interface SettingsRowProps {
  /** Left icon (optional) */
  icon?: React.ReactNode;
  /** Row title */
  title: string;
  /** Short subtitle (one line max) */
  subtitle?: string;
  /** Right side content - chevron, toggle, value, badge */
  rightContent?: React.ReactNode;
  /** Whether row is clickable */
  onClick?: () => void;
  /** Whether row is disabled */
  disabled?: boolean;
  /** Whether row is the first in section (for border radius) */
  isFirst?: boolean;
  /** Whether row is the last in section (for border radius) */
  isLast?: boolean;
  /** Show divider below */
  showDivider?: boolean;
  /** Beta badge */
  isBeta?: boolean;
  /** Locked state */
  isLocked?: boolean;
  /** Icon color theme */
  iconTheme?: IconTheme;
}

/**
 * SettingsRow - Single setting row with premium card-based styling
 * 
 * Features:
 * - Icon in colored container (40x40, rounded-xl)
 * - Refined typography with lighter subtitle
 * - Subtle dividers between rows
 */
export function SettingsRow({
  icon,
  title,
  subtitle,
  rightContent,
  onClick,
  disabled = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  isBeta = false,
  isLocked = false,
  iconTheme = 'default',
}: SettingsRowProps) {
  const isClickable = !!onClick && !disabled && !isLocked;
  const theme = iconThemeStyles[iconTheme];

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'relative flex items-center w-full',
        'min-h-[60px] px-4 py-3',
        'transition-colors duration-150',
        isClickable && 'cursor-pointer active:bg-gray-50',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {/* Left content with icon container */}
      <div className="flex items-center flex-1 min-w-0 gap-3">
        {/* Icon container - 40x40, rounded-xl */}
        {icon && (
          <div 
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              theme.bg
            )}
          >
            <div className={cn('w-5 h-5', theme.text)}>
              {icon}
            </div>
          </div>
        )}
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-gray-900 truncate">
              {title}
            </span>
            {isBeta && <SettingsBadge>Beta</SettingsBadge>}
            {isLocked && (
              <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
          </div>
          {subtitle && (
            <p className="text-[13px] text-gray-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-shrink-0 ml-3 flex items-center">
        {rightContent}
        {isClickable && !rightContent && (
          <ChevronRight className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Divider - very subtle */}
      {showDivider && !isLast && (
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-50" />
      )}
    </div>
  );
}

/**
 * SettingsBadge - Small badge for Beta, etc.
 */
export function SettingsBadge({ children, variant = 'default' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive';
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full',
        variant === 'default' && 'bg-blue-100 text-blue-600',
        variant === 'destructive' && 'bg-red-100 text-red-600',
      )}
    >
      {children}
    </span>
  );
}
