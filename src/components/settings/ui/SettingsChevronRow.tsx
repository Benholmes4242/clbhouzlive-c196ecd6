import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsBadge } from './SettingsRow';

interface SettingsChevronRowProps {
  /** Left icon (optional) */
  icon?: React.ReactNode;
  /** Row title */
  title: string;
  /** Short subtitle (one line max) */
  subtitle?: string;
  /** Click handler */
  onClick: () => void;
  /** Whether it's an external link */
  isExternal?: boolean;
  /** Whether row is disabled */
  disabled?: boolean;
  /** Whether row is first in section */
  isFirst?: boolean;
  /** Whether row is last in section */
  isLast?: boolean;
  /** Show divider below */
  showDivider?: boolean;
  /** Beta badge */
  isBeta?: boolean;
  /** Right side value text */
  value?: string;
}

/**
 * SettingsChevronRow - Navigational row with chevron or external link icon
 */
export function SettingsChevronRow({
  icon,
  title,
  subtitle,
  onClick,
  isExternal = false,
  disabled = false,
  isFirst = false,
  isLast = false,
  showDivider = true,
  isBeta = false,
  value,
}: SettingsChevronRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-full flex items-center justify-between text-left',
        'min-h-[52px] md:min-h-[56px]',
        'px-[14px] py-[12px]',
        'transition-colors duration-[120ms]',
        'cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]',
        disabled && 'opacity-50 cursor-not-allowed',
        isFirst && 'rounded-t-[12px]',
        isLast && 'rounded-b-[12px]',
      )}
    >
      {/* Left content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-[18px] h-[18px] text-white/70">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-white truncate">
              {title}
            </span>
            {isBeta && <SettingsBadge>Beta</SettingsBadge>}
          </div>
          {subtitle && (
            <p className="text-[13px] font-normal text-white/60 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-shrink-0 ml-3 flex items-center gap-2">
        {value && (
          <span className="text-[13px] text-white/50">{value}</span>
        )}
        {isExternal ? (
          <ExternalLink className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/40" />
        )}
      </div>

      {/* Divider */}
      {showDivider && !isLast && (
        <div 
          className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
      )}
    </button>
  );
}
