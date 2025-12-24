import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

/**
 * SettingsRow - Single setting row with LinkedIn/Apple light feel
 * 
 * Spacing:
 * - Row height min: 52px (mobile), 56px (desktop)
 * - Row padding: 14px left/right, 12px top/bottom
 * - Icon gap: 12px
 * - Title: 15px, weight 600, color #1F2428
 * - Subtitle: 13px, weight 400, color #5E666D
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
}: SettingsRowProps) {
  const isClickable = !!onClick && !disabled && !isLocked;

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'relative flex items-center justify-between w-full max-w-full box-border',
        'min-h-[52px] md:min-h-[56px]',
        'px-[14px] py-[12px]',
        'transition-colors duration-[120ms]',
        isClickable && 'cursor-pointer hover:bg-[rgba(31,36,40,0.03)] active:bg-[rgba(31,36,40,0.05)]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {/* Left content - min-width:0 prevents text from pushing layout wider */}
      <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
        {icon && (
          <div className="flex-shrink-0 w-[18px] h-[18px] text-[#5E666D]">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[15px] font-semibold text-[#1F2428] truncate overflow-hidden text-ellipsis">
              {title}
            </span>
            {isBeta && <SettingsBadge>Beta</SettingsBadge>}
            {isLocked && (
              <Lock className="w-3.5 h-3.5 text-[#97A1AA] flex-shrink-0" />
            )}
          </div>
          {subtitle && (
            <p className="text-[13px] font-normal text-[#5E666D] truncate overflow-hidden text-ellipsis mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-shrink-0 ml-3 flex items-center">
        {rightContent}
        {isClickable && !rightContent && (
          <ChevronRight className="w-4 h-4 text-[#97A1AA]" />
        )}
      </div>

      {/* Divider */}
      {showDivider && !isLast && (
        <div 
          className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
          style={{ background: 'rgba(31,36,40,0.06)' }}
        />
      )}
    </div>
  );
}

/**
 * SettingsBadge - Small badge for Beta, Locked, etc.
 */
export function SettingsBadge({ children, variant = 'default' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive';
}) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full',
        'border',
        variant === 'default' && 'bg-[rgba(31,36,40,0.06)] border-[rgba(31,36,40,0.08)] text-[#5E666D]',
        variant === 'destructive' && 'bg-red-50 border-red-200 text-red-600',
      )}
    >
      {children}
    </span>
  );
}
